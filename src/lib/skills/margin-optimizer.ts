// AuraFlow Skill #11 — Margin Optimizer ("The Alchemist")
// Key data points: F01 (annual revenue range), F04 (avg deal size)
// Finds where margin is being destroyed and how to get it back.

export interface MarginOptimizerResult {
  currentMarginBand: string     // e.g. "10-20%"
  estimatedMarginPct: number    // midpoint estimate
  benchmarkMarginPct: number    // what this vertical should achieve
  marginGapPct: number          // how far below benchmark
  annualMarginGap: number       // $ difference at current revenue
  opportunities: Array<{
    opportunity: string
    estimatedMarginImpact: number   // percentage points
    estimatedAnnualDollar: number
    effort: 'quick' | 'medium' | 'project'
    action: string
  }>
  pricingHealth: 'underpriced' | 'fairly_priced' | 'competitive' | 'premium'
  revenueLevers: string[]
}

export function runMarginOptimizer(rawData: Record<string, unknown>, context: {
  revenue: number
  vertical: string
  avg_deal_size: number
}): MarginOptimizerResult {
  const revenueBand    = String(rawData['F01'] ?? '250K-500K')
  const marginBand     = String(rawData['F03'] ?? '<10%')
  const avgDealSize    = Number(rawData['F04'] ?? context.avg_deal_size)
  const growthTrend    = String(rawData['F02'] ?? 'flat')
  const knowsCAC       = !!(rawData['F05'])
  const knowsLTV       = !!(rawData['F06'])
  const revFromDigital = Number(rawData['F21'] ?? 20)
  const adSpend        = Number(rawData['A01'] ?? 0)
  const adRoas         = Number(rawData['A20'] ?? 0)
  const pricingStrategy = String(rawData['F16'] ?? 'gut_feel')
  const pricingReviewed = Number(rawData['F17'] ?? 24)
  const hasTracking    = !!(rawData['A04'])

  // Vertical margin benchmarks
  const MARGIN_BENCHMARKS: Record<string, number> = {
    home_services: 32, restaurant: 7, agency: 20, real_estate: 25,
    ecommerce: 15, healthcare: 22, saas: 40, construction: 12,
    law: 28, accounting: 30, fitness: 20, insurance: 22,
    logistics: 8, manufacturing: 12, education: 25,
  }

  const benchmarkMarginPct = MARGIN_BENCHMARKS[context.vertical] ?? 20

  // Estimate current margin as midpoint
  const MARGIN_MIDPOINTS: Record<string, number> = {
    'negative': -5, '<10%': 6, '10-20%': 15, '20-30%': 25, '30%+': 35,
  }
  const estimatedMarginPct = MARGIN_MIDPOINTS[marginBand] ?? 6

  const marginGapPct = Math.max(0, benchmarkMarginPct - estimatedMarginPct)
  const annualMarginGap = Math.round(context.revenue * (marginGapPct / 100))

  const opportunities: MarginOptimizerResult['opportunities'] = []

  // Pricing strategy
  if (pricingStrategy === 'gut_feel' || pricingStrategy === 'competitive') {
    opportunities.push({
      opportunity: `Pricing by ${pricingStrategy === 'gut_feel' ? 'gut feel' : 'matching competitors'} — almost always underpriced`,
      estimatedMarginImpact: 5,
      estimatedAnnualDollar: Math.round(context.revenue * 0.05),
      effort: 'medium',
      action: 'Test a 10% price increase on new quotes only. Track win rate. Most SMBs lose <5% of deals.',
    })
  }

  // Pricing not reviewed
  if (pricingReviewed > 12) {
    opportunities.push({
      opportunity: `Pricing hasn't been reviewed in ${pricingReviewed} months (inflation has eaten your margin)`,
      estimatedMarginImpact: 3,
      estimatedAnnualDollar: Math.round(context.revenue * 0.03),
      effort: 'quick',
      action: 'Review and update pricing today. Inflation since last review has reduced your real margin.',
    })
  }

  // No CAC/LTV visibility
  if (!knowsCAC || !knowsLTV) {
    opportunities.push({
      opportunity: `Unknown ${!knowsCAC ? 'customer acquisition cost' : ''}${!knowsCAC && !knowsLTV ? ' and ' : ''}${!knowsLTV ? 'customer lifetime value' : ''}`,
      estimatedMarginImpact: 4,
      estimatedAnnualDollar: Math.round(context.revenue * 0.04),
      effort: 'medium',
      action: 'Calculate CAC and LTV this week. These numbers tell you which customers to get more of and which to fire.',
    })
  }

  // Wasted ad spend
  if (adSpend > 1000 && !hasTracking) {
    const wastedSpend = Math.round(adSpend * 0.35 * 12)
    opportunities.push({
      opportunity: `$${adSpend.toLocaleString()}/mo in ads without conversion tracking — blind spending`,
      estimatedMarginImpact: Math.round((wastedSpend / context.revenue) * 100),
      estimatedAnnualDollar: wastedSpend,
      effort: 'quick',
      action: 'Install conversion tracking before next billing cycle. Stop paying for untracked traffic.',
    })
  }

  // Poor ROAS
  if (adSpend > 500 && adRoas > 0 && adRoas < 2.5) {
    opportunities.push({
      opportunity: `Ad ROAS of ${adRoas}x is below break-even for most verticals (target: 3x minimum)`,
      estimatedMarginImpact: 3,
      estimatedAnnualDollar: Math.round(adSpend * 0.5 * 12),
      effort: 'medium',
      action: 'Pause lowest-performing campaigns. Reallocate budget to highest-ROAS sources.',
    })
  }

  // Low digital revenue
  if (revFromDigital < 30) {
    opportunities.push({
      opportunity: `Only ${revFromDigital}% of revenue from digital channels — untapped higher-margin growth`,
      estimatedMarginImpact: 3,
      estimatedAnnualDollar: Math.round(context.revenue * 0.03),
      effort: 'project',
      action: 'Shift 10% more revenue to digital channels (typically lower CAC = higher net margin)',
    })
  }

  // Avg deal size below vertical benchmark
  const DEAL_BENCHMARKS: Record<string, number> = {
    home_services: 2800, restaurant: 45, agency: 8500, real_estate: 12000,
    ecommerce: 85, healthcare: 1800, saas: 2400, construction: 185000,
    law: 8500, accounting: 4500, fitness: 149, insurance: 1200,
    logistics: 45000, manufacturing: 125000, education: 1800,
  }

  const dealBenchmark = DEAL_BENCHMARKS[context.vertical] ?? 2000
  if (avgDealSize < dealBenchmark * 0.7) {
    opportunities.push({
      opportunity: `Average deal size ($${avgDealSize.toLocaleString()}) is 30%+ below the vertical benchmark ($${dealBenchmark.toLocaleString()})`,
      estimatedMarginImpact: 5,
      estimatedAnnualDollar: Math.round(context.revenue * 0.05),
      effort: 'medium',
      action: 'Introduce premium tier or bundled packages. Test upselling on 30% of jobs this month.',
    })
  }

  opportunities.sort((a, b) => b.estimatedAnnualDollar - a.estimatedAnnualDollar)

  let pricingHealth: MarginOptimizerResult['pricingHealth']
  if (pricingStrategy === 'value_based' && estimatedMarginPct >= benchmarkMarginPct) pricingHealth = 'premium'
  else if (estimatedMarginPct >= benchmarkMarginPct * 0.9) pricingHealth = 'competitive'
  else if (estimatedMarginPct >= benchmarkMarginPct * 0.7) pricingHealth = 'fairly_priced'
  else pricingHealth = 'underpriced'

  const revenueLevers = [
    `Price increase: +10% on new quotes = +${Math.round(context.revenue * 0.08 / 12).toLocaleString()}/mo (assuming 80% win rate maintained)`,
    `Upsell: if 30% of customers buy one add-on at avg $${Math.round(avgDealSize * 0.2).toLocaleString()}, that's +$${Math.round(context.revenue * 0.06 / 12).toLocaleString()}/mo`,
    `Reduce churn by 10%: retain ${Math.round(context.revenue * 0.1 / 12).toLocaleString()} in existing revenue per month`,
    growthTrend === 'declining' ? 'Stop the bleed first — identify why revenue is declining before optimizing margin' : '',
  ].filter(Boolean)

  return {
    currentMarginBand: marginBand,
    estimatedMarginPct,
    benchmarkMarginPct,
    marginGapPct,
    annualMarginGap,
    opportunities,
    pricingHealth,
    revenueLevers,
  }
}
