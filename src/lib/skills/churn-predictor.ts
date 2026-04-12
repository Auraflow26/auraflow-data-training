// AuraFlow Skill #9 — Churn Predictor ("The Back Door")
// Key data points: F08 (repeat customer rate), F12 (financial reports frequency / retention tracking)
// Predicts how many customers are silently leaving and why.

export interface ChurnPredictorResult {
  churnRateEstimate: number     // % of customers lost per year (estimated)
  churnRisk: 'low' | 'medium' | 'high' | 'critical'
  retentionScore: number        // 0-100 (100 = excellent retention)
  annualRevenueLostToChurn: number
  retentionGaps: Array<{
    gap: string
    churnContribution: number   // % of total churn this gap causes
    fix: string
    impact: string
  }>
  retentionStrengths: string[]
  ltvEstimate: number           // estimated customer lifetime value
  ltvBenchmark: number          // what LTV should be for this vertical
  quickRetentionWins: string[]
}

export function runChurnPredictor(rawData: Record<string, unknown>, context: {
  revenue: number
  avg_deal_size: number
  vertical: string
}): ChurnPredictorResult {
  const repeatRate         = Number(rawData['F08'] ?? 20)   // % of repeat customers
  const reportsFrequency   = String(rawData['F12'] ?? 'never')
  const hasFollowUp        = !!(rawData['L14'])
  const hasNPS             = !!(rawData['P08'])              // using employee satisfaction as proxy
  const reviewResponseRate = Number(rawData['R08'] ?? 20)
  const reviewResponseTime = Number(rawData['R09'] ?? 168)
  const hasReviewSystem    = !!(rawData['R15'])
  const negReviewProtocol  = !!(rawData['R16'])
  const customerCommsAuto  = !!(rawData['O10'])
  const hasCRM             = String(rawData['L11'] ?? 'none').toLowerCase() !== 'none'
  const revGrowthTrend     = String(rawData['F02'] ?? 'flat')

  // Vertical-specific benchmark repeat rates
  const REPEAT_BENCHMARKS: Record<string, number> = {
    home_services: 30, restaurant: 65, agency: 75, real_estate: 15,
    ecommerce: 30, healthcare: 70, saas: 80, construction: 20,
    law: 40, accounting: 88, fitness: 60, insurance: 84,
    logistics: 80, manufacturing: 75, education: 55,
  }

  const benchmarkRepeat = REPEAT_BENCHMARKS[context.vertical] ?? 40
  const retentionGaps: ChurnPredictorResult['retentionGaps'] = []
  const retentionStrengths: string[] = []
  let retentionScore = 50

  // Repeat rate vs benchmark
  const repeatGap = benchmarkRepeat - repeatRate
  if (repeatRate < benchmarkRepeat * 0.6) {
    retentionScore -= 25
    retentionGaps.push({
      gap: `Repeat customer rate of ${repeatRate}% vs. ${benchmarkRepeat}% industry benchmark`,
      churnContribution: 40,
      fix: 'Implement a post-service follow-up sequence and loyalty program',
      impact: `Raising repeat rate to ${benchmarkRepeat}% adds $${Math.round(context.revenue * (benchmarkRepeat - repeatRate) / 100 / 12).toLocaleString()}/mo in recurring revenue`,
    })
  } else if (repeatRate >= benchmarkRepeat) {
    retentionScore += 15
    retentionStrengths.push(`${repeatRate}% repeat customer rate is at or above the ${context.vertical.replace('_', ' ')} benchmark`)
  }

  // No CRM = no visibility into who's leaving
  if (!hasCRM) {
    retentionScore -= 15
    retentionGaps.push({
      gap: 'No CRM — impossible to track who\'s active vs. lapsed',
      churnContribution: 25,
      fix: 'Implement CRM with customer activity tracking and re-engagement triggers',
      impact: 'Without a CRM, you don\'t know you\'ve lost a customer until it\'s too late',
    })
  } else {
    retentionStrengths.push('CRM in place — baseline retention visibility exists')
    retentionScore += 10
  }

  // No customer comms automation
  if (!customerCommsAuto) {
    retentionScore -= 10
    retentionGaps.push({
      gap: 'Customer communications not automated',
      churnContribution: 20,
      fix: 'Set up: appointment reminders, post-service check-ins, annual touchpoints, birthday/anniversary messages',
      impact: 'Automated touchpoints increase repeat purchase rate by 20-30% (HubSpot data)',
    })
  } else {
    retentionStrengths.push('Customer communications automated')
    retentionScore += 5
  }

  // Low review response rate = signal you don't value customers
  if (reviewResponseRate < 40) {
    retentionScore -= 10
    retentionGaps.push({
      gap: `Only ${reviewResponseRate}% of reviews get a response`,
      churnContribution: 15,
      fix: 'Respond to every review within 24 hours — it signals to current customers that you care',
      impact: 'Customers who see unanswered negative reviews are 45% more likely to switch',
    })
  }

  // Declining revenue = churn already happening
  if (revGrowthTrend === 'declining') {
    retentionScore -= 20
    retentionGaps.push({
      gap: 'Revenue is declining — churn is already exceeding new customer acquisition',
      churnContribution: 50,
      fix: 'Customer exit interviews: call your last 10 lost customers and ask why they left',
      impact: 'Understanding churn reason is step 1 to stopping it',
    })
  }

  // No negative review protocol
  if (!negReviewProtocol) {
    retentionScore -= 5
    retentionGaps.push({
      gap: 'No protocol for handling complaints before they become public negative reviews',
      churnContribution: 10,
      fix: 'Create a complaint resolution process: direct customer to private channel before they post publicly',
      impact: '67% of churned customers would have stayed if their complaint had been resolved (Bain data)',
    })
  }

  // Financial reports reviewed rarely — can\'t catch churn signals
  if (reportsFrequency === 'never' || reportsFrequency === 'annual') {
    retentionScore -= 10
    retentionGaps.push({
      gap: `Financial reports reviewed ${reportsFrequency} — can't catch early churn signals`,
      churnContribution: 10,
      fix: 'Review monthly: revenue by customer segment, repeat rate, and average order value trends',
      impact: 'Early churn detection allows intervention before the customer leaves permanently',
    })
  }

  retentionScore = Math.max(0, Math.min(100, retentionScore))

  let churnRisk: ChurnPredictorResult['churnRisk']
  const estimatedChurnRate = Math.max(5, 100 - repeatRate - (retentionScore * 0.3))
  if (estimatedChurnRate > 50)      churnRisk = 'critical'
  else if (estimatedChurnRate > 30) churnRisk = 'high'
  else if (estimatedChurnRate > 15) churnRisk = 'medium'
  else                               churnRisk = 'low'

  const annualRevenueLostToChurn = Math.round(context.revenue * (estimatedChurnRate / 100))

  // LTV calculation
  const avgTransactionsPerYear = repeatRate / 100 * 3 + 1
  const avgCustomerLifeYears = repeatRate > 50 ? 3.5 : repeatRate > 30 ? 2 : 1.2
  const ltvEstimate = Math.round(context.avg_deal_size * avgTransactionsPerYear * avgCustomerLifeYears)
  const ltvBenchmark = Math.round(context.avg_deal_size * (benchmarkRepeat / 100 * 3 + 1) * 2.5)

  retentionGaps.sort((a, b) => b.churnContribution - a.churnContribution)

  const quickRetentionWins = [
    `Call your top 20 customers this week — ask one question: "What would make us a 10/10 for you?"`,
    `Set up a 30-day post-service check-in (SMS or email) — takes 2 hours to build, runs automatically`,
    !hasReviewSystem ? 'Ask for reviews immediately after service — happy customers leave first, unhappy ones leave later' : 'Maintain review velocity — keep asking every completed job',
  ]

  return {
    churnRateEstimate: Math.round(estimatedChurnRate),
    churnRisk,
    retentionScore,
    annualRevenueLostToChurn,
    retentionGaps,
    retentionStrengths,
    ltvEstimate,
    ltvBenchmark,
    quickRetentionWins,
  }
}
