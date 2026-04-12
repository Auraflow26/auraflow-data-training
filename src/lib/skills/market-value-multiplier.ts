// AuraFlow Skill #12 — Market-Value Multiplier ("The Auction House")
// Formula: Foundation Score × Vertical Multiplier
// Estimates what the business is worth today vs. what it could be worth after AuraFlow.

export interface MarketValueResult {
  currentValuation: number          // estimated current business value $
  potentialValuation: number        // estimated value after AuraFlow improvements
  valuationMultiple: number         // EBITDA or revenue multiple used
  valuationMethod: string
  currentFoundationScore: number
  projectedFoundationScore: number  // estimated score after 12 months with AuraFlow
  valueGap: number                  // $ difference between current and potential
  valuationDrivers: Array<{
    driver: string
    currentImpact: 'positive' | 'negative' | 'neutral'
    valueImpact: number             // $ impact on valuation
    fix: string
  }>
  exitReadiness: 'not_ready' | 'early_stage' | 'preparing' | 'exit_ready'
  buyerAppeal: string[]             // what buyers look for — how they score
  quickValueAdds: string[]          // actions that immediately increase valuation
}

// Vertical-specific EBITDA or revenue multiples (SMB M&A data)
const VERTICAL_MULTIPLES: Record<string, { low: number; median: number; high: number; basis: 'ebitda' | 'revenue' }> = {
  home_services: { low: 3,  median: 4.5,  high: 7,   basis: 'ebitda' },
  restaurant:    { low: 2,  median: 3,    high: 4.5,  basis: 'ebitda' },
  agency:        { low: 4,  median: 6,    high: 10,   basis: 'ebitda' },
  real_estate:   { low: 2,  median: 3.5,  high: 5,   basis: 'ebitda' },
  ecommerce:     { low: 2,  median: 3,    high: 5,   basis: 'revenue' },
  healthcare:    { low: 4,  median: 6,    high: 9,   basis: 'ebitda' },
  saas:          { low: 3,  median: 5,    high: 10,  basis: 'revenue' },
  construction:  { low: 3,  median: 4,    high: 6,   basis: 'ebitda' },
  law:           { low: 1,  median: 2,    high: 4,   basis: 'revenue' },
  accounting:    { low: 1,  median: 2,    high: 3,   basis: 'revenue' },
  fitness:       { low: 3,  median: 4,    high: 6,   basis: 'ebitda' },
  insurance:     { low: 1.5, median: 2.5, high: 4,  basis: 'revenue' },
  logistics:     { low: 3,  median: 4.5,  high: 7,   basis: 'ebitda' },
  manufacturing: { low: 4,  median: 5.5,  high: 8,   basis: 'ebitda' },
  education:     { low: 3,  median: 5,    high: 8,   basis: 'ebitda' },
}

const MARGIN_MIDPOINTS: Record<string, number> = {
  'negative': -0.05, '<10%': 0.06, '10-20%': 0.15, '20-30%': 0.25, '30%+': 0.35,
}

export function runMarketValueMultiplier(
  rawData: Record<string, unknown>,
  context: {
    revenue: number
    vertical: string
    foundationScore: number
  }
): MarketValueResult {
  const marginBand       = String(rawData['F03'] ?? '<10%')
  const marginPct        = MARGIN_MIDPOINTS[marginBand] ?? 0.08
  const growthTrend      = String(rawData['F02'] ?? 'flat')
  const repeatRate       = Number(rawData['F08'] ?? 20)
  const hasSOP           = !!(rawData['O04'])
  const hasReporting     = !!(rawData['O22'])
  const ownerHrsIn       = Number(rawData['P09'] ?? 55)
  const teamAutonomous   = Number(rawData['P12'] ?? 1)
  const hasContracts     = !!(rawData['F06'])   // LTV known = likely recurring revenue
  const hasCRM           = String(rawData['L11'] ?? 'none').toLowerCase() !== 'none'
  const reviewCount      = Number(rawData['R05'] ?? 0)
  const googleRating     = Number(rawData['R06'] ?? 0)
  const revFromDigital   = Number(rawData['F21'] ?? 20)

  const vertMult = VERTICAL_MULTIPLES[context.vertical] ?? VERTICAL_MULTIPLES.home_services
  const ebitda = context.revenue * marginPct
  const basis = vertMult.basis === 'ebitda' ? ebitda : context.revenue

  // Foundation Score maps to where on the valuation range the business sits
  // Score 0-25: low multiple, Score 75-100: high multiple
  const scoreRatio = context.foundationScore / 100
  const currentMultiple = vertMult.low + (scoreRatio * (vertMult.high - vertMult.low))
  const currentValuation = Math.round(basis * currentMultiple)

  // Projected score after 12 months of AuraFlow (typically +15-25 pts)
  const projectedScore = Math.min(100, context.foundationScore + 20)
  const projectedRatio = projectedScore / 100
  const projectedMultiple = vertMult.low + (projectedRatio * (vertMult.high - vertMult.low))
  const potentialValuation = Math.round(basis * projectedMultiple)
  const valueGap = potentialValuation - currentValuation

  const valuationDrivers: MarketValueResult['valuationDrivers'] = []

  // Growth trend
  if (growthTrend === 'growing' || growthTrend === 'growing_fast') {
    valuationDrivers.push({
      driver: 'Revenue growth trend',
      currentImpact: 'positive',
      valueImpact: Math.round(currentValuation * 0.15),
      fix: 'Document growth trajectory with 3 years of financials for buyers',
    })
  } else if (growthTrend === 'declining') {
    valuationDrivers.push({
      driver: 'Declining revenue',
      currentImpact: 'negative',
      valueImpact: -Math.round(currentValuation * 0.3),
      fix: 'Reverse decline before attempting any exit — buyers discount heavily for declining businesses',
    })
  }

  // Owner dependency
  if (ownerHrsIn > 50 || teamAutonomous < 3) {
    valuationDrivers.push({
      driver: 'High owner dependency (business doesn\'t run without you)',
      currentImpact: 'negative',
      valueImpact: -Math.round(currentValuation * 0.2),
      fix: 'Reduce owner hours to <30/week and document all processes. Prove team can run independently.',
    })
  } else {
    valuationDrivers.push({
      driver: 'Low owner dependency — team operates independently',
      currentImpact: 'positive',
      valueImpact: Math.round(currentValuation * 0.15),
      fix: 'Document team autonomy with org chart and decision rights as proof for buyers',
    })
  }

  // SOPs
  if (!hasSOP) {
    valuationDrivers.push({
      driver: 'No documented SOPs — processes live in owner\'s head',
      currentImpact: 'negative',
      valueImpact: -Math.round(currentValuation * 0.1),
      fix: 'Document all critical processes. Buyers pay more for businesses that run without the owner.',
    })
  } else {
    valuationDrivers.push({
      driver: 'SOPs documented — processes are transferable',
      currentImpact: 'positive',
      valueImpact: Math.round(currentValuation * 0.08),
      fix: 'Keep SOPs current and organized for due diligence',
    })
  }

  // Recurring revenue / repeat customers
  if (repeatRate > 50) {
    valuationDrivers.push({
      driver: `${repeatRate}% repeat customer rate — predictable recurring revenue`,
      currentImpact: 'positive',
      valueImpact: Math.round(currentValuation * 0.12),
      fix: 'Convert repeat customers to formal contracts or memberships if possible',
    })
  } else if (repeatRate < 20) {
    valuationDrivers.push({
      driver: `${repeatRate}% repeat rate — heavily dependent on new customer acquisition`,
      currentImpact: 'negative',
      valueImpact: -Math.round(currentValuation * 0.1),
      fix: 'Build subscription or retainer component to increase recurring revenue',
    })
  }

  // Online reputation
  if (reviewCount > 100 && googleRating >= 4.5) {
    valuationDrivers.push({
      driver: `${reviewCount} reviews at ${googleRating} stars — strong online brand`,
      currentImpact: 'positive',
      valueImpact: Math.round(currentValuation * 0.05),
      fix: 'Maintain velocity — buyers see this as an asset',
    })
  }

  // Reporting/financial visibility
  if (!hasReporting) {
    valuationDrivers.push({
      driver: 'No reporting dashboard — buyers can\'t easily verify financial health',
      currentImpact: 'negative',
      valueImpact: -Math.round(currentValuation * 0.05),
      fix: 'Set up clean financial reporting with 3 years of P&L, balance sheet, and cash flow',
    })
  }

  valuationDrivers.sort((a, b) => Math.abs(b.valueImpact) - Math.abs(a.valueImpact))

  let exitReadiness: MarketValueResult['exitReadiness']
  if (context.foundationScore >= 75 && hasSOP && ownerHrsIn <= 35 && teamAutonomous >= 7) exitReadiness = 'exit_ready'
  else if (context.foundationScore >= 60 && hasSOP) exitReadiness = 'preparing'
  else if (context.foundationScore >= 40) exitReadiness = 'early_stage'
  else exitReadiness = 'not_ready'

  const buyerAppeal = [
    'Clean financials: 3 years of P&L reviewed by CPA',
    'Owner not essential: business runs for 2+ weeks without founder',
    'Documented processes: SOPs for all critical functions',
    'Recurring revenue: contracts, memberships, or high repeat rate',
    'Growth trend: 3+ years of revenue growth',
    'Strong brand: 100+ reviews, 4.5+ rating, active digital presence',
  ]

  const quickValueAdds = [
    !hasSOP ? 'Document your top 10 processes — adds 10-15% to valuation' : null,
    ownerHrsIn > 40 ? 'Reduce your hours in the business — every hour less = thousands more in valuation' : null,
    !hasReporting ? 'Set up clean monthly P&L reporting — buyers require 3 clean years' : null,
    repeatRate < 30 ? 'Build a retainer or membership component — recurring revenue gets premium multiples' : null,
    `Price it right: at your Foundation Score of ${context.foundationScore}, your multiple range is ${currentMultiple.toFixed(1)}x-${projectedMultiple.toFixed(1)}x`,
  ].filter(Boolean) as string[]

  return {
    currentValuation,
    potentialValuation,
    valuationMultiple: +currentMultiple.toFixed(1),
    valuationMethod: `${vertMult.basis.toUpperCase()} × ${currentMultiple.toFixed(1)}x (${context.vertical.replace('_', ' ')} ${vertMult.basis === 'ebitda' ? 'EBITDA' : 'Revenue'} multiple)`,
    currentFoundationScore: context.foundationScore,
    projectedFoundationScore: projectedScore,
    valueGap,
    valuationDrivers,
    exitReadiness,
    buyerAppeal,
    quickValueAdds,
  }
}
