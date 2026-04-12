// AuraFlow Skill #1 — Bleed-Rate Triage ("The Leaky Pipe")
// Key data points: L01 (monthly leads), D13 (contact form), F03 (profit margin)
// Finds where money is actively leaking out of the business each month.

export interface BleedRateResult {
  monthlyLoss: number
  annualLoss: number
  primaryLeak: string
  leaks: Array<{
    source: string
    monthlyAmount: number
    fixDescription: string
    priority: 'critical' | 'high' | 'medium'
  }>
  bleedScore: number  // 0-100: how severe the bleed is (100 = catastrophic)
}

export function calculateRevenueBleed(rawData: Record<string, unknown>, context: {
  revenue: number
  monthly_leads: number
  avg_deal_size: number
  close_rate: number
}): BleedRateResult {
  const leaks: BleedRateResult['leaks'] = []

  // L01 — Monthly leads × response time bleed
  const responseMin = Number(rawData['L04'] ?? 999)
  const leads = context.monthly_leads
  if (responseMin > 15) {
    const lostLeadRate = Math.min((responseMin - 15) / 240, 0.55)
    const amount = Math.round(leads * lostLeadRate * (context.close_rate / 100) * context.avg_deal_size)
    if (amount > 0) leaks.push({
      source: `Slow lead response (${responseMin} min avg)`,
      monthlyAmount: amount,
      fixDescription: 'AI receptionist or auto-text reduces response to <60 seconds',
      priority: responseMin > 120 ? 'critical' : 'high',
    })
  }

  // D13 — No contact form = lost inbound leads
  const hasContactForm = rawData['D13']
  if (!hasContactForm) {
    const amount = Math.round(leads * 0.25 * (context.close_rate / 100) * context.avg_deal_size)
    leaks.push({
      source: 'No contact form — inbound leads lost',
      monthlyAmount: amount,
      fixDescription: 'Add contact form with instant email/SMS notification',
      priority: 'high',
    })
  }

  // F03 — Profit margin below 20%
  const marginRaw = String(rawData['F03'] ?? '<10%')
  const marginScore = { 'negative': -0.1, '<10%': 0.07, '10-20%': 0.15, '20-30%': 0.25, '30%+': 0.35 }[marginRaw] ?? 0.07
  if (marginScore < 0.15) {
    const amount = Math.round(context.revenue * (0.15 - marginScore) / 12)
    leaks.push({
      source: `Thin margins (${marginRaw}) — pricing or cost problem`,
      monthlyAmount: amount,
      fixDescription: 'Margin audit: identify unprofitable services/clients, test 10% price increase',
      priority: marginScore < 0 ? 'critical' : 'high',
    })
  }

  // L14 — No follow-up sequence
  const hasFollowUp = rawData['L14']
  if (!hasFollowUp) {
    const recoverable = Math.round(leads * 0.3 * (context.close_rate / 100) * context.avg_deal_size)
    leaks.push({
      source: 'No follow-up sequence — leads going cold',
      monthlyAmount: recoverable,
      fixDescription: '7-touch follow-up sequence (email + SMS + voicemail drops)',
      priority: 'high',
    })
  }

  // A04 — Ad spend with no conversion tracking
  const hasTracking = rawData['A04']
  const adSpend = Number(rawData['A01'] ?? 0)
  if (!hasTracking && adSpend > 500) {
    const wastedSpend = Math.round(adSpend * 0.3)
    leaks.push({
      source: `$${adSpend}/mo in ads with no conversion tracking`,
      monthlyAmount: wastedSpend,
      fixDescription: 'Install conversion tracking — identify which campaigns drive revenue',
      priority: 'critical',
    })
  }

  // Sort by amount descending
  leaks.sort((a, b) => b.monthlyAmount - a.monthlyAmount)

  const monthlyLoss = leaks.reduce((sum, l) => sum + l.monthlyAmount, 0)
  const bleedScore = Math.min(100, Math.round((monthlyLoss / (context.revenue / 12)) * 100))

  return {
    monthlyLoss,
    annualLoss: monthlyLoss * 12,
    primaryLeak: leaks[0]?.source ?? 'No critical leaks detected',
    leaks,
    bleedScore,
  }
}
