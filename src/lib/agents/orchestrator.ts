// AuraFlow — MasterOrchestrator ("The Memory Palace")
// Single entry point: accepts raw diagnostic data + business context,
// runs all 12 skills + 3 scoring algorithms, returns one unified PalaceReport.

import type { Vertical } from '@/lib/types'

// ─── SCORING ─────────────────────────────────────────────────────────────────
import { calculateFoundationScore, type FoundationScoreResult } from '@/lib/scoring/foundation-score'
import { calculateComplexityScore, type ComplexityScoreResult } from '@/lib/scoring/complexity-score'
import { analyzeGaps } from '@/lib/scoring/gap-analyzer'

// ─── SKILLS ──────────────────────────────────────────────────────────────────
import { calculateRevenueBleed, type BleedRateResult }    from '@/lib/skills/revenue-bleed'
import { calculateOwnerTrap, type OwnerTrapResult }       from '@/lib/skills/owner-trap'
import { runCompetitorMirroring, type CompetitorMirrorResult } from '@/lib/skills/competitor-mirror'
import { calculateAdSpendScaler, type AdSpendScalerResult } from '@/lib/skills/ad-spend-scaler'
import { runSentimentGhost, type SentimentGhostResult }   from '@/lib/skills/sentiment-ghost'
import { runShadowSiteAuditor, type ShadowSiteResult }    from '@/lib/skills/shadow-site-auditor'
import { runLeadVelocityRadar, type LeadVelocityResult }  from '@/lib/skills/lead-velocity-radar'
import { runCyberResilienceCheck, type CyberResilienceResult } from '@/lib/skills/cyber-resilience'
import { runChurnPredictor, type ChurnPredictorResult }   from '@/lib/skills/churn-predictor'
import { runTalentDensityMap, type TalentDensityResult }  from '@/lib/skills/talent-density'
import { runMarginOptimizer, type MarginOptimizerResult } from '@/lib/skills/margin-optimizer'
import { runMarketValueMultiplier, type MarketValueResult } from '@/lib/skills/market-value-multiplier'

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface OrchestratorInput {
  rawData: Record<string, unknown>  // 163 diagnostic data points (F01, D07, etc.)
  vertical: Vertical
  revenue: number                   // annual revenue in dollars
  monthly_leads: number
  avg_deal_size: number
  close_rate: number                // 0-100
  employee_count: number
  owner_hourly_value?: number       // defaults to revenue / employee_count / 2080
}

export interface GapAnalysisResult {
  gaps: import('@/lib/types').GapItem[]
  total_monthly_gap: number
  total_annual_gap: number
  suggested_monthly_fee: number
  suggested_setup_fee: number
}

export interface PalaceReport {
  // Identity
  vertical: Vertical
  generatedAt: string

  // Core scores
  foundationScore: FoundationScoreResult
  complexityScore: ComplexityScoreResult
  gapAnalysis: GapAnalysisResult

  // 12 diagnostic skills
  revenueBleed: BleedRateResult
  ownerTrap: OwnerTrapResult
  competitorMirror: CompetitorMirrorResult
  adSpendScaler: AdSpendScalerResult
  sentimentGhost: SentimentGhostResult
  shadowSite: ShadowSiteResult
  leadVelocity: LeadVelocityResult
  cyberResilience: CyberResilienceResult
  churnPredictor: ChurnPredictorResult
  talentDensity: TalentDensityResult
  marginOptimizer: MarginOptimizerResult
  marketValue: MarketValueResult

  // Synthesized narrative
  executiveSummary: string
  criticalAlerts: string[]
  topOpportunities: string[]
  totalAnnualOpportunity: number
}

// ─── MAIN ENTRY POINT ────────────────────────────────────────────────────────

export function generatePalaceReport(input: OrchestratorInput): PalaceReport {
  const {
    rawData, vertical, revenue, monthly_leads, avg_deal_size,
    close_rate, employee_count,
  } = input

  const owner_hourly_value = input.owner_hourly_value ?? (revenue / Math.max(employee_count, 1) / 2080)
  const tool_count = Number(rawData['O01'] ?? 5)

  // ── Scoring layer ──────────────────────────────────────────────────────────
  const foundationScore = calculateFoundationScore(rawData)

  const complexityScore = calculateComplexityScore({
    employee_count,
    revenue,
    vertical,
    tool_count,
    integration_needs: 'medium',
  })

  const gapAnalysis = analyzeGaps({
    rawData,
    vertical,
    employee_count,
    revenue,
    avg_deal_size,
    monthly_leads,
    close_rate,
    owner_hourly_value,
  }) as GapAnalysisResult

  // ── Skills layer (all synchronous) ────────────────────────────────────────
  const pipelineCtx = { monthly_leads, avg_deal_size, close_rate }

  const revenueBleed     = calculateRevenueBleed(rawData, { revenue, monthly_leads, avg_deal_size, close_rate })
  const ownerTrap        = calculateOwnerTrap(rawData)
  const competitorMirror = runCompetitorMirroring(rawData, vertical)
  const adSpendScaler    = calculateAdSpendScaler(rawData)
  const sentimentGhost   = runSentimentGhost(rawData)
  const shadowSite       = runShadowSiteAuditor(rawData, pipelineCtx)
  const leadVelocity     = runLeadVelocityRadar(rawData, pipelineCtx)
  const cyberResilience  = runCyberResilienceCheck(rawData)
  const churnPredictor   = runChurnPredictor(rawData, { revenue, avg_deal_size, vertical })
  const talentDensity    = runTalentDensityMap(rawData, { revenue, vertical })
  const marginOptimizer  = runMarginOptimizer(rawData, { revenue, vertical, avg_deal_size })
  const marketValue      = runMarketValueMultiplier(rawData, {
    revenue,
    vertical,
    foundationScore: foundationScore.foundation_score,
  })

  // ── Synthesis ─────────────────────────────────────────────────────────────
  const criticalAlerts    = buildCriticalAlerts({ cyberResilience, churnPredictor, talentDensity, leadVelocity, shadowSite })
  const topOpportunities  = buildTopOpportunities({ marginOptimizer, gapAnalysis, revenueBleed, churnPredictor })
  const totalAnnualOpportunity = calcTotalOpportunity({ revenueBleed, gapAnalysis, churnPredictor, marginOptimizer })
  const executiveSummary  = buildExecutiveSummary({
    vertical, foundationScore, revenueBleed, ownerTrap, marketValue, topOpportunities,
  })

  return {
    vertical,
    generatedAt: new Date().toISOString(),
    foundationScore,
    complexityScore,
    gapAnalysis,
    revenueBleed,
    ownerTrap,
    competitorMirror,
    adSpendScaler,
    sentimentGhost,
    shadowSite,
    leadVelocity,
    cyberResilience,
    churnPredictor,
    talentDensity,
    marginOptimizer,
    marketValue,
    executiveSummary,
    criticalAlerts,
    topOpportunities,
    totalAnnualOpportunity,
  }
}

// ─── SYNTHESIS HELPERS ───────────────────────────────────────────────────────

function buildExecutiveSummary(args: {
  vertical: Vertical
  foundationScore: FoundationScoreResult
  revenueBleed: BleedRateResult
  ownerTrap: OwnerTrapResult
  marketValue: MarketValueResult
  topOpportunities: string[]
}): string {
  const { vertical, foundationScore: fs, revenueBleed, ownerTrap, marketValue, topOpportunities } = args
  const verticalLabel = vertical.replace(/_/g, ' ')
  const top3 = topOpportunities.slice(0, 3).join('; ')

  return (
    `This ${verticalLabel} business scores ${fs.foundation_score}/100 (${fs.tier_label}). ` +
    `The primary revenue leak is "${revenueBleed.primaryLeak}" costing $${revenueBleed.monthlyLoss.toLocaleString()}/mo ($${revenueBleed.annualLoss.toLocaleString()}/yr). ` +
    `The owner is ${ownerTrap.trapLevel} in day-to-day operations (${ownerTrap.ownerHrsPerWeek} hrs/week in the business). ` +
    `With AuraFlow improvements, the estimated valuation uplift is $${marketValue.valueGap.toLocaleString()} ` +
    `($${marketValue.currentValuation.toLocaleString()} → $${marketValue.potentialValuation.toLocaleString()}). ` +
    `Top priorities: ${top3 || 'full diagnostic required'}.`
  )
}

function buildCriticalAlerts(args: {
  cyberResilience: CyberResilienceResult
  churnPredictor: ChurnPredictorResult
  talentDensity: TalentDensityResult
  leadVelocity: LeadVelocityResult
  shadowSite: ShadowSiteResult
}): string[] {
  const alerts: string[] = []

  for (const v of args.cyberResilience.vulnerabilities) {
    if (v.severity === 'critical') {
      alerts.push(`CYBER: ${v.vulnerability} — ${v.businessImpact}`)
    }
  }

  if (args.churnPredictor.churnRisk === 'critical') {
    alerts.push(
      `CHURN: ${args.churnPredictor.churnRateEstimate}% estimated annual churn — ` +
      `$${args.churnPredictor.annualRevenueLostToChurn.toLocaleString()} leaving the business per year`
    )
  }

  for (const r of args.talentDensity.risks) {
    if (r.severity === 'critical') {
      alerts.push(`PEOPLE: ${r.risk} — ${r.impact}`)
    }
  }

  if (args.leadVelocity.velocityGrade === 'F') {
    alerts.push(
      `PIPELINE: Lead pipeline grade F — ${args.leadVelocity.leaksPerMonth} leads lost per month. ` +
      `Bottleneck: ${args.leadVelocity.bottleneck}`
    )
  }

  if (args.shadowSite.siteGrade === 'F') {
    alerts.push(
      `WEBSITE: Site grade F — performance score ${args.shadowSite.performanceScore}/100. ` +
      `${args.shadowSite.structuralIssues.filter(i => i.severity === 'critical').length} critical structural issues.`
    )
  }

  return alerts
}

function buildTopOpportunities(args: {
  marginOptimizer: MarginOptimizerResult
  gapAnalysis: GapAnalysisResult
  revenueBleed: BleedRateResult
  churnPredictor: ChurnPredictorResult
}): string[] {
  const candidates: Array<{ label: string; annualValue: number }> = []

  for (const opp of args.marginOptimizer.opportunities) {
    candidates.push({ label: opp.opportunity, annualValue: opp.estimatedAnnualDollar })
  }

  for (const gap of args.gapAnalysis.gaps) {
    candidates.push({ label: gap.gap, annualValue: gap.monthly_value * 12 })
  }

  for (const leak of args.revenueBleed.leaks) {
    candidates.push({ label: leak.source, annualValue: leak.monthlyAmount * 12 })
  }

  if (args.churnPredictor.annualRevenueLostToChurn > 0) {
    candidates.push({
      label: `Recover churned revenue (${args.churnPredictor.churnRateEstimate}% churn rate)`,
      annualValue: args.churnPredictor.annualRevenueLostToChurn,
    })
  }

  return candidates
    .filter(c => c.annualValue > 0)
    .sort((a, b) => b.annualValue - a.annualValue)
    .slice(0, 5)
    .map(c => `${c.label} ($${c.annualValue.toLocaleString()}/yr)`)
}

function calcTotalOpportunity(args: {
  revenueBleed: BleedRateResult
  gapAnalysis: GapAnalysisResult
  churnPredictor: ChurnPredictorResult
  marginOptimizer: MarginOptimizerResult
}): number {
  return (
    args.revenueBleed.annualLoss +
    args.gapAnalysis.total_annual_gap +
    args.churnPredictor.annualRevenueLostToChurn +
    args.marginOptimizer.annualMarginGap
  )
}
