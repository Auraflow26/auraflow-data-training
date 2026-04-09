// AuraFlow Diagnostic Engine — Gap Analyzer
// Identifies infrastructure gaps and calculates dollar value for each
//
// Gap Value Formula (from docs):
//   GAP = (Time Savings + Revenue Increase + Cost Reduction + Opportunity Cost) per month
//   Pricing: 25% of annual gap value (value-based pricing)

import type { GapItem, DiagnosticDimension, Vertical } from '@/lib/types'

interface GapInput {
  rawData: Record<string, unknown>
  vertical: Vertical
  employee_count: number
  revenue: number           // annual
  avg_deal_size: number
  monthly_leads: number
  close_rate: number        // 0-100
  owner_hourly_value: number // revenue / 2080 hours
}

interface GapAnalysisResult {
  gaps: GapItem[]
  total_monthly_gap: number
  total_annual_gap: number
  suggested_monthly_fee: number
  suggested_setup_fee: number
}

// ─── INDIVIDUAL GAP CALCULATORS ──────────────────────────────────────────────

function calcLeadResponseGap(input: GapInput): GapItem | null {
  const responseMin = Number(input.rawData['L04'] ?? 999)
  if (responseMin <= 15) return null

  const missedLeadRate = Math.min((responseMin - 15) / 240, 0.6) // up to 60% missed
  const monthly_value = Math.round(
    input.monthly_leads * missedLeadRate * (input.close_rate / 100) * input.avg_deal_size
  )
  if (monthly_value < 500) return null

  return {
    gap: 'Lead Response Automation',
    dimension: 'lead_generation',
    current_state: `${responseMin}-minute average response time`,
    target_state: '<5-minute AI-powered response',
    monthly_value,
    value_breakdown: {
      time_savings: Math.round(monthly_value * 0.1),
      revenue_increase: Math.round(monthly_value * 0.8),
      cost_reduction: Math.round(monthly_value * 0.1),
      opportunity_cost: 0,
    },
  }
}

function calcFollowUpGap(input: GapInput): GapItem | null {
  const hasFollowUp = input.rawData['L14']
  if (hasFollowUp === true || hasFollowUp === 'Yes') return null

  const touchpoints = Number(input.rawData['L15'] ?? 0)
  if (touchpoints >= 5) return null

  const recoverable_leads = Math.round(input.monthly_leads * 0.35)
  const monthly_value = Math.round(recoverable_leads * (input.close_rate / 100) * input.avg_deal_size)

  return {
    gap: 'Automated Follow-Up Sequence',
    dimension: 'lead_generation',
    current_state: touchpoints === 0 ? 'No follow-up system' : `Only ${touchpoints} touchpoints`,
    target_state: '7-touch multi-channel sequence (SMS + email + voicemail)',
    monthly_value,
    value_breakdown: {
      time_savings: Math.round(input.employee_count * 2 * 4.33 * 25),
      revenue_increase: Math.round(monthly_value * 0.85),
      cost_reduction: 0,
      opportunity_cost: 0,
    },
  }
}

function calcWebsiteGap(input: GapInput): GapItem | null {
  const hasSite = input.rawData['D01']
  const isMobile = input.rawData['D04']
  const loadSpeed = Number(input.rawData['D05'] ?? 3)

  if (!hasSite) {
    const monthly_value = Math.round(input.monthly_leads * 0.4 * (input.close_rate / 100) * input.avg_deal_size)
    return {
      gap: 'Professional Website',
      dimension: 'digital_presence',
      current_state: 'No website — only GBP/directories',
      target_state: 'Professional site with 8+ service pages, contact form, analytics',
      monthly_value,
      value_breakdown: {
        time_savings: 0,
        revenue_increase: monthly_value,
        cost_reduction: 0,
        opportunity_cost: Math.round(input.monthly_leads * 0.2 * input.avg_deal_size),
      },
    }
  }

  if (!isMobile || loadSpeed > 4) {
    const monthly_value = Math.round(input.monthly_leads * 0.2 * (input.close_rate / 100) * input.avg_deal_size)
    return {
      gap: 'Website Performance & Mobile Optimization',
      dimension: 'digital_presence',
      current_state: `${!isMobile ? 'Non-mobile-responsive site' : `${loadSpeed}s load speed`}`,
      target_state: 'Mobile-first, sub-2s load time, Core Web Vitals passing',
      monthly_value,
      value_breakdown: {
        time_savings: 0,
        revenue_increase: monthly_value,
        cost_reduction: 0,
        opportunity_cost: Math.round(monthly_value * 0.5),
      },
    }
  }

  return null
}

function calcToolIntegrationGap(input: GapInput): GapItem | null {
  const totalTools = Number(input.rawData['O01'] ?? 0)
  const connectedTools = Number(input.rawData['O02'] ?? 0)
  const manualHrs = Number(input.rawData['O03'] ?? 0)

  if (totalTools - connectedTools < 4) return null

  const disconnected = totalTools - connectedTools
  const time_savings = Math.round(manualHrs * 0.6 * 4.33 * (input.owner_hourly_value / 4.33))
  const monthly_value = Math.max(time_savings, disconnected * 150)

  return {
    gap: 'Tool Integration & Automation',
    dimension: 'operations',
    current_state: `${disconnected} of ${totalTools} tools siloed — ${manualHrs} hrs/week manual data entry`,
    target_state: 'Unified tech stack with automated data flows between all key platforms',
    monthly_value,
    value_breakdown: {
      time_savings: Math.round(monthly_value * 0.7),
      revenue_increase: 0,
      cost_reduction: Math.round(monthly_value * 0.2),
      opportunity_cost: Math.round(monthly_value * 0.1),
    },
  }
}

function calcReviewGap(input: GapInput): GapItem | null {
  const reviewCount = Number(input.rawData['R05'] ?? 0)
  const responseRate = Number(input.rawData['R08'] ?? 0)
  const hasGenSystem = input.rawData['R15']

  if (reviewCount >= 80 && responseRate >= 70 && hasGenSystem) return null

  // Each additional review = ~1.8% lift in organic leads (Invoca data)
  const reviewsNeeded = Math.max(0, 50 - reviewCount)
  const monthly_value = Math.round(reviewsNeeded * 0.018 * input.monthly_leads * (input.close_rate / 100) * input.avg_deal_size)

  const floor_monthly = 800
  return {
    gap: 'Review Generation & Response System',
    dimension: 'reputation',
    current_state: `${reviewCount} Google reviews, ${responseRate}% response rate`,
    target_state: '50+ reviews, 90% response rate, automated review requests post-service',
    monthly_value: Math.max(monthly_value, floor_monthly),
    value_breakdown: {
      time_savings: Math.round(responseRate < 50 ? 200 : 0),
      revenue_increase: monthly_value,
      cost_reduction: 0,
      opportunity_cost: Math.round(floor_monthly * 0.5),
    },
  }
}

function calcOwnerDependencyGap(input: GapInput): GapItem | null {
  const ownerHrsIn = Number(input.rawData['P09'] ?? 40)
  const daysWithout = Number(input.rawData['P12'] ?? 1)

  if (ownerHrsIn <= 35 && daysWithout >= 7) return null

  const recoverable_hrs = Math.max(0, ownerHrsIn - 30)
  const time_savings = Math.round(recoverable_hrs * 4.33 * input.owner_hourly_value)

  return {
    gap: 'Owner Dependency & Delegation',
    dimension: 'operations',
    current_state: `Owner works ${ownerHrsIn} hrs/week IN the business; team autonomous for ${daysWithout} day(s)`,
    target_state: 'Owner focuses 20 hrs/week ON strategy; team runs operations for 14+ days independently',
    monthly_value: time_savings,
    value_breakdown: {
      time_savings,
      revenue_increase: 0,
      cost_reduction: 0,
      opportunity_cost: Math.round(time_savings * 0.4),
    },
  }
}

function calcAdTrackingGap(input: GapInput): GapItem | null {
  const hasTracking = input.rawData['A04']
  const adSpend = Number(input.rawData['A01'] ?? 0)
  const roas = Number(input.rawData['A20'] ?? 0)

  if (hasTracking && roas >= 4) return null
  if (adSpend < 500) return null

  // Avg 22% improvement in ROAS with proper tracking/optimization (LocaliQ data)
  const monthly_value = Math.round(adSpend * 0.22)

  return {
    gap: 'Ad Tracking & Attribution',
    dimension: 'advertising',
    current_state: `$${adSpend}/mo ad spend ${!hasTracking ? 'with no conversion tracking' : `at ${roas}x ROAS`}`,
    target_state: 'Full conversion tracking, attribution model, and AI bid optimization',
    monthly_value,
    value_breakdown: {
      time_savings: 0,
      revenue_increase: monthly_value,
      cost_reduction: Math.round(adSpend * 0.05),
      opportunity_cost: 0,
    },
  }
}

// ─── MAIN ANALYZER ─────────────────────────────────────────────────────────

export function analyzeGaps(input: GapInput): GapAnalysisResult {
  const gapFns = [
    calcLeadResponseGap,
    calcFollowUpGap,
    calcWebsiteGap,
    calcToolIntegrationGap,
    calcReviewGap,
    calcOwnerDependencyGap,
    calcAdTrackingGap,
  ]

  const gaps = gapFns
    .map(fn => fn(input))
    .filter((g): g is GapItem => g !== null)
    .sort((a, b) => b.monthly_value - a.monthly_value)

  const total_monthly_gap = gaps.reduce((sum, g) => sum + g.monthly_value, 0)
  const total_annual_gap = total_monthly_gap * 12

  // AuraFlow pricing: 25% of annual gap value, min $1,500/mo, max $12,000/mo
  const raw_monthly_fee = Math.round((total_annual_gap * 0.25) / 12)
  const suggested_monthly_fee = Math.max(1500, Math.min(12000, raw_monthly_fee))

  // Setup fee: 1.5-2× monthly fee
  const suggested_setup_fee = Math.round(suggested_monthly_fee * 1.75 / 500) * 500

  return { gaps, total_monthly_gap, total_annual_gap, suggested_monthly_fee, suggested_setup_fee }
}
