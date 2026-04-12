// AuraFlow Skill #4 — Ad-Spend Scaler ("The Greenhouse")
// Key data points: A16 (negative keywords), A01 (monthly ad spend), D11 (service pages)
// Determines if ad spend is optimized, wasted, or ready to scale.

export interface AdSpendScalerResult {
  currentSpend: number
  currentROAS: number
  wastedSpend: number           // estimated wasted budget per month
  optimizedSpend: number        // what spend should be after optimization
  scalingReadiness: number      // 0-100: how ready to scale (100 = scale now)
  readinessLevel: 'not_ready' | 'fix_first' | 'optimize_then_scale' | 'ready_to_scale'
  issues: Array<{
    issue: string
    impact: string
    fix: string
    monthlyWaste: number
  }>
  projectedROAS: number         // estimated ROAS after fixes
  recommendation: string
}

export function calculateAdSpendScaler(rawData: Record<string, unknown>): AdSpendScalerResult {
  const adSpend   = Number(rawData['A01'] ?? 0)
  const roas      = Number(rawData['A20'] ?? 0)
  const servicePages = Number(rawData['D11'] ?? 0)
  const hasNegKeywords   = rawData['A16']
  const hasConvTracking  = rawData['A04']
  const hasGeoTargeting  = rawData['A17']
  const hasAdScheduling  = rawData['A18']
  const hasRetargeting   = rawData['A19']
  const hasABTesting     = rawData['A15']
  const creativeAgeDays  = Number(rawData['A14'] ?? 999)
  const qualityScore     = Number(rawData['A05'] ?? 4)

  const issues: AdSpendScalerResult['issues'] = []
  let wastedSpend = 0
  let readinessScore = 50

  // No conversion tracking — biggest issue
  if (!hasConvTracking && adSpend > 0) {
    const waste = Math.round(adSpend * 0.35)
    wastedSpend += waste
    readinessScore -= 25
    issues.push({
      issue: 'No conversion tracking installed',
      impact: 'Flying blind — no idea which campaigns, keywords, or ads drive revenue',
      fix: 'Install Google Ads conversion tracking + GA4 goals before spending another dollar',
      monthlyWaste: waste,
    })
  }

  // No negative keywords — paying for irrelevant clicks
  if (!hasNegKeywords && adSpend > 0) {
    const waste = Math.round(adSpend * 0.2)
    wastedSpend += waste
    readinessScore -= 15
    issues.push({
      issue: 'No negative keyword list',
      impact: `Estimated ${Math.round(adSpend * 0.2 / adSpend * 100)}% of budget wasted on irrelevant searches`,
      fix: 'Add 50+ negative keywords immediately. Review Search Terms report weekly.',
      monthlyWaste: waste,
    })
  }

  // Thin landing pages — service pages < 4
  if (servicePages < 4 && adSpend > 0) {
    const waste = Math.round(adSpend * 0.15)
    wastedSpend += waste
    readinessScore -= 15
    issues.push({
      issue: `Only ${servicePages} service page${servicePages === 1 ? '' : 's'} — ads sending traffic to poor landing pages`,
      impact: 'Low Quality Score drives up CPC; low CVR wastes budget',
      fix: 'Build dedicated landing pages per service/campaign before scaling spend',
      monthlyWaste: waste,
    })
  }

  // Stale creative
  if (creativeAgeDays > 90 && adSpend > 0) {
    const waste = Math.round(adSpend * 0.1)
    wastedSpend += waste
    readinessScore -= 10
    issues.push({
      issue: `Ad creative is ${creativeAgeDays} days old — suffering from ad fatigue`,
      impact: 'CTR decay from ad fatigue wastes 10-20% of budget on diminishing returns',
      fix: 'Refresh creative every 30-45 days. Test 3 variations simultaneously.',
      monthlyWaste: waste,
    })
  }

  // No retargeting — leaving warm leads behind
  if (!hasRetargeting && adSpend > 500) {
    readinessScore -= 10
    issues.push({
      issue: 'No retargeting campaigns running',
      impact: 'Website visitors who don\'t convert on first visit are lost forever',
      fix: 'Launch retargeting campaign with $200-500/mo budget — highest ROAS channel available',
      monthlyWaste: 0,
    })
  }

  // No geo-targeting — paying for out-of-area clicks
  if (!hasGeoTargeting && adSpend > 0) {
    const waste = Math.round(adSpend * 0.08)
    wastedSpend += waste
    readinessScore -= 5
    issues.push({
      issue: 'No geo-targeting configured',
      impact: 'Budget spent on clicks from outside your service area',
      fix: 'Set specific radius or zip code targeting. Exclude areas you don\'t serve.',
      monthlyWaste: waste,
    })
  }

  // Low quality score
  if (qualityScore < 6 && adSpend > 0) {
    const cpcPenalty = Math.round(adSpend * 0.12)
    wastedSpend += cpcPenalty
    readinessScore -= 10
    issues.push({
      issue: `Low Quality Score (${qualityScore}/10) — paying premium CPC`,
      impact: `Paying ~${Math.round((10 - qualityScore) * 16)}% more per click than competitors with better QS`,
      fix: 'Align ad copy, keywords, and landing page. Improve expected CTR first.',
      monthlyWaste: cpcPenalty,
    })
  }

  issues.sort((a, b) => b.monthlyWaste - a.monthlyWaste)

  readinessScore = Math.max(0, Math.min(100, readinessScore))
  const wastedPct = adSpend > 0 ? wastedSpend / adSpend : 0
  const projectedROAS = roas > 0 ? roas * (1 + wastedPct * 0.8) : 0
  const optimizedSpend = wastedSpend > 0 ? adSpend - wastedSpend : adSpend

  let readinessLevel: AdSpendScalerResult['readinessLevel']
  if (readinessScore < 25)      readinessLevel = 'not_ready'
  else if (readinessScore < 50) readinessLevel = 'fix_first'
  else if (readinessScore < 75) readinessLevel = 'optimize_then_scale'
  else                           readinessLevel = 'ready_to_scale'

  const recommendations: Record<string, string> = {
    not_ready: `Stop scaling. Fix conversion tracking and negative keywords first. You\'re wasting $${wastedSpend.toLocaleString()}/mo.`,
    fix_first: `Pause scaling until top ${issues.slice(0, 2).map(i => i.issue.split(' ').slice(0, 3).join(' ')).join(' and ')} are fixed.`,
    optimize_then_scale: `Optimize the ${issues.length} identified issues, then scale budget 20% month-over-month.`,
    ready_to_scale: `Strong foundation. Scale budget 25-30% and test new campaigns with 15% of total spend.`,
  }

  return {
    currentSpend: adSpend,
    currentROAS: roas,
    wastedSpend,
    optimizedSpend,
    scalingReadiness: readinessScore,
    readinessLevel,
    issues,
    projectedROAS,
    recommendation: recommendations[readinessLevel],
  }
}
