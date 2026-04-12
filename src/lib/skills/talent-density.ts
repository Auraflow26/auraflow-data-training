// AuraFlow Skill #10 — Talent-Density Map ("The Barracks")
// Key data points: P01 (employee count), P05 (time to fill open positions)
// Assesses team strength, hiring velocity, and the people risk to the business.

export interface TalentDensityResult {
  talentScore: number           // 0-100
  hiringHealth: 'thriving' | 'stable' | 'strained' | 'crisis'
  revenuePerEmployee: number
  benchmarkRevPerEmployee: number
  turnoverRate: number
  benchmarkTurnover: number
  openPositions: number
  timeToFillWeeks: number
  hiringDebt: number            // $ cost of current open positions per month
  risks: Array<{
    risk: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    impact: string
    fix: string
  }>
  strengths: string[]
  hiringPriorities: string[]    // ranked roles to hire next
}

export function runTalentDensityMap(rawData: Record<string, unknown>, context: {
  revenue: number
  vertical: string
}): TalentDensityResult {
  const employees      = Number(rawData['P01'] ?? 1)
  const timeToFill     = Number(rawData['P05'] ?? 8)
  const openPositions  = Number(rawData['P04'] ?? 0)
  const turnoverRate   = Number(rawData['P03'] ?? 30)
  const avgTenure      = Number(rawData['P02'] ?? 12)
  const hasTraining    = !!(rawData['P06'])
  const trainingHrsYr  = Number(rawData['P07'] ?? 0)
  const satisfaction   = Number(rawData['P08'] ?? 3)  // 1-5 scale
  const ownerHrsIn     = Number(rawData['P09'] ?? 50)
  const hasOrgChart    = !!(rawData['P14'])
  const hasPerformMetrics = !!(rawData['P13'])

  // Vertical benchmarks for revenue per employee
  const REV_PER_EMP_BENCHMARKS: Record<string, number> = {
    home_services: 120000, restaurant: 55000, agency: 140000, real_estate: 180000,
    ecommerce: 200000, healthcare: 150000, saas: 250000, construction: 110000,
    law: 200000, accounting: 160000, fitness: 65000, insurance: 180000,
    logistics: 130000, manufacturing: 95000, education: 75000,
  }

  const TURNOVER_BENCHMARKS: Record<string, number> = {
    home_services: 25, restaurant: 75, agency: 22, real_estate: 15,
    ecommerce: 20, healthcare: 18, saas: 14, construction: 22,
    law: 12, accounting: 10, fitness: 30, insurance: 14,
    logistics: 25, manufacturing: 18, education: 20,
  }

  const benchmarkRevPerEmp = REV_PER_EMP_BENCHMARKS[context.vertical] ?? 120000
  const benchmarkTurnover  = TURNOVER_BENCHMARKS[context.vertical] ?? 20
  const revenuePerEmployee = employees > 0 ? Math.round(context.revenue / employees) : 0

  const risks: TalentDensityResult['risks'] = []
  const strengths: string[] = []
  let talentScore = 60

  // Revenue per employee
  if (revenuePerEmployee < benchmarkRevPerEmp * 0.6) {
    talentScore -= 20
    risks.push({
      risk: `Revenue per employee ($${revenuePerEmployee.toLocaleString()}) is 40%+ below benchmark ($${benchmarkRevPerEmp.toLocaleString()})`,
      severity: 'critical',
      impact: 'Team is underperforming or overstaffed relative to revenue generated',
      fix: 'Identify lowest-performing roles. Set clear output metrics for every position.',
    })
  } else if (revenuePerEmployee > benchmarkRevPerEmp * 1.3) {
    talentScore += 15
    strengths.push(`Revenue per employee ($${revenuePerEmployee.toLocaleString()}) is 30%+ above benchmark — high-output team`)
  }

  // Turnover
  if (turnoverRate > benchmarkTurnover * 1.5) {
    talentScore -= 20
    const replacementCost = Math.round(context.revenue / employees * 0.5)
    const annualCost = Math.round(employees * (turnoverRate / 100) * replacementCost)
    risks.push({
      risk: `${turnoverRate}% annual turnover rate (benchmark: ${benchmarkTurnover}%)`,
      severity: 'critical',
      impact: `Estimated $${annualCost.toLocaleString()}/year in replacement costs (recruiting, training, lost productivity)`,
      fix: 'Exit interviews mandatory. Address top 3 reasons employees leave. Start with compensation audit.',
    })
  } else if (turnoverRate <= benchmarkTurnover * 0.7) {
    talentScore += 10
    strengths.push(`${turnoverRate}% turnover rate is well below the ${context.vertical.replace('_', ' ')} benchmark — strong retention`)
  }

  // Open positions
  if (openPositions > 2) {
    talentScore -= 15
    const costPerOpenRole = Math.round(context.revenue / employees * 0.25 / 12)
    risks.push({
      risk: `${openPositions} open positions — team is understaffed`,
      severity: 'high',
      impact: `Current team carrying ${openPositions} extra workloads. Burnout risk. $${(costPerOpenRole * openPositions).toLocaleString()}/mo in lost output.`,
      fix: 'Prioritize filling highest-impact roles first. Consider contractors while hiring full-time.',
    })
  }

  // Time to fill
  if (timeToFill > 12) {
    talentScore -= 10
    risks.push({
      risk: `${timeToFill}-week average time to fill positions`,
      severity: 'high',
      impact: 'Slow hiring extends understaffing periods and drives overwork/burnout in current team',
      fix: 'Build a talent pipeline before you need it. Partner with a recruiter for key roles.',
    })
  }

  // No training program
  if (!hasTraining || trainingHrsYr < 8) {
    talentScore -= 10
    risks.push({
      risk: `No formal training program (${trainingHrsYr} hrs/year)`,
      severity: 'medium',
      impact: 'Team skills stagnate. High performers leave for employers who invest in their growth.',
      fix: 'Allocate 20+ hours/year per employee for training. Start with role-specific skill building.',
    })
  } else if (trainingHrsYr >= 20) {
    talentScore += 5
    strengths.push(`${trainingHrsYr} training hours/year shows investment in team development`)
  }

  // Employee satisfaction
  if (satisfaction <= 2) {
    talentScore -= 15
    risks.push({
      risk: `Low employee satisfaction (${satisfaction}/5)`,
      severity: 'critical',
      impact: 'High turnover risk imminent. Dissatisfied employees leave and take institutional knowledge.',
      fix: 'One-on-one meetings with every team member this week. Ask: what would make this a great place to work?',
    })
  } else if (satisfaction >= 4) {
    talentScore += 10
    strengths.push(`Strong employee satisfaction (${satisfaction}/5) — cultural foundation is healthy`)
  }

  // Org chart
  if (!hasOrgChart) {
    talentScore -= 5
    risks.push({
      risk: 'No org chart — reporting lines unclear',
      severity: 'low',
      impact: 'Confusion about who owns what leads to duplication and gaps',
      fix: 'Create a simple org chart in Lucidchart or Notion. Update quarterly.',
    })
  }

  // Performance metrics
  if (!hasPerformMetrics) {
    talentScore -= 10
    risks.push({
      risk: 'No performance metrics tracked per employee',
      severity: 'medium',
      impact: 'Can\'t identify underperformers or reward top performers objectively',
      fix: 'Define 3 KPIs per role. Review monthly. Tie to compensation where possible.',
    })
  }

  talentScore = Math.max(0, Math.min(100, talentScore))

  let hiringHealth: TalentDensityResult['hiringHealth']
  if (talentScore >= 75)      hiringHealth = 'thriving'
  else if (talentScore >= 55) hiringHealth = 'stable'
  else if (talentScore >= 35) hiringHealth = 'strained'
  else                         hiringHealth = 'crisis'

  const hiringDebt = openPositions > 0
    ? Math.round(openPositions * (context.revenue / employees / 12) * 0.6)
    : 0

  risks.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 }
    return order[a.severity] - order[b.severity]
  })

  const hiringPriorities = [
    ownerHrsIn > 50 ? 'Operations Manager — to take daily tasks off the owner' : null,
    openPositions > 0 ? `Fill ${openPositions} open position${openPositions > 1 ? 's' : ''} — current team is carrying extra load` : null,
    turnoverRate > benchmarkTurnover ? 'HR/Culture role — turnover is the most expensive problem to ignore' : null,
    'Build a bench: identify 2-3 candidates per key role before you need to hire',
  ].filter(Boolean) as string[]

  return {
    talentScore,
    hiringHealth,
    revenuePerEmployee,
    benchmarkRevPerEmployee: benchmarkRevPerEmp,
    turnoverRate,
    benchmarkTurnover,
    openPositions,
    timeToFillWeeks: timeToFill,
    hiringDebt,
    risks,
    strengths,
    hiringPriorities: hiringPriorities.slice(0, 4),
  }
}
