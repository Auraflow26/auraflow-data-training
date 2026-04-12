// AuraFlow Skill #5 — Sentiment Ghost ("The Whispering Gallery")
// Key data points: R05 (review count), R06 (rating), R08 (response rate), R09 (response time)
// Analyzes reputation health — what customers are saying that the owner can't see.

export interface SentimentGhostResult {
  overallSentiment: 'excellent' | 'positive' | 'mixed' | 'negative' | 'crisis'
  sentimentScore: number        // 0-100
  reputationRisk: 'low' | 'medium' | 'high' | 'critical'
  signals: Array<{
    signal: string
    type: 'positive' | 'warning' | 'critical'
    insight: string
    action: string
  }>
  hiddenThreats: string[]       // reputation risks the owner probably doesn't know about
  reputationMoat: string[]      // strengths to double down on
  velocityTrend: 'accelerating' | 'steady' | 'slowing' | 'stalled'
  projectedRating12mo: number   // where rating will be in 12 months if nothing changes
}

export function runSentimentGhost(rawData: Record<string, unknown>): SentimentGhostResult {
  const reviewCount    = Number(rawData['R05'] ?? 0)
  const rating         = Number(rawData['R06'] ?? 0)
  const responseRate   = Number(rawData['R08'] ?? 0)
  const responseTimeHrs = Number(rawData['R09'] ?? 168)
  const velocity       = Number(rawData['R07'] ?? 0)   // reviews per month
  const hasGenSystem   = rawData['R15']
  const hasNegProtocol = rawData['R16']
  const yelpRating     = Number(rawData['R12'] ?? 0)
  const yelpCount      = Number(rawData['R11'] ?? 0)
  const napConsistency = Number(rawData['R17'] ?? 50)

  const signals: SentimentGhostResult['signals'] = []
  const hiddenThreats: string[] = []
  const reputationMoat: string[] = []
  let sentimentScore = 50

  // Rating signals
  if (rating >= 4.7) {
    sentimentScore += 20
    reputationMoat.push(`${rating} Google rating — in top 10% of your vertical. This is a competitive moat.`)
  } else if (rating >= 4.4) {
    sentimentScore += 10
    signals.push({ signal: `${rating} Google rating`, type: 'positive', insight: 'Above average — customers are satisfied', action: 'Protect this rating; one bad month can shift it' })
  } else if (rating < 4.0) {
    sentimentScore -= 20
    signals.push({ signal: `${rating} Google rating`, type: 'critical', insight: 'Below 4.0 — consumers filter you out of local search results', action: 'Address root cause of negative reviews first, then launch review generation' })
    hiddenThreats.push('Consumers use 4.0 as a filter — you may be invisible to 67% of searchers')
  }

  // Review count signals
  if (reviewCount < 10) {
    sentimentScore -= 20
    signals.push({ signal: `Only ${reviewCount} reviews`, type: 'critical', insight: 'Insufficient social proof — consumers don\'t trust businesses with < 10 reviews', action: 'Emergency review blitz: contact last 30 customers personally' })
    hiddenThreats.push('Consumers need to see 10+ reviews before trusting a local business (BrightLocal data)')
  } else if (reviewCount < 30) {
    sentimentScore -= 10
    signals.push({ signal: `${reviewCount} reviews`, type: 'warning', insight: 'Below minimum trust threshold for most verticals', action: 'Set up automated post-service review request via SMS' })
  } else if (reviewCount > 100) {
    sentimentScore += 15
    reputationMoat.push(`${reviewCount} reviews provides strong social proof — hard for competitors to catch up quickly`)
  }

  // Response rate signals
  if (responseRate < 30) {
    sentimentScore -= 15
    signals.push({ signal: `${responseRate}% review response rate`, type: 'critical', insight: 'Not responding to reviews signals you don\'t care about customer feedback', action: 'Respond to ALL reviews within 24 hours — even the positive ones' })
    hiddenThreats.push('Google ranks businesses higher when they actively respond to reviews')
  } else if (responseRate >= 80) {
    sentimentScore += 10
    reputationMoat.push(`${responseRate}% response rate shows exceptional customer engagement`)
  }

  // Response time signals
  if (responseTimeHrs > 72) {
    sentimentScore -= 10
    signals.push({ signal: `${responseTimeHrs}-hour average review response time`, type: 'warning', insight: 'Slow responses to negative reviews allow damage to compound', action: 'Set up Google Business Profile notifications for instant alerts' })
  }

  // Review velocity
  if (velocity === 0) {
    sentimentScore -= 10
    signals.push({ signal: 'Zero review velocity', type: 'critical', insight: 'No new reviews means your profile looks inactive or abandoned', action: 'Automate review requests — target 5+ new reviews per month' })
    hiddenThreats.push('Stagnant review profiles lose ranking vs. competitors actively collecting reviews')
  } else if (velocity >= 10) {
    sentimentScore += 10
    reputationMoat.push(`${velocity} reviews/month velocity — consistently building social proof`)
  }

  // No negative review protocol
  if (!hasNegProtocol) {
    hiddenThreats.push('No protocol for negative reviews — one angry customer can do uncontrolled damage')
    signals.push({ signal: 'No negative review response protocol', type: 'warning', insight: 'Unmanaged negative reviews cost 22% of business (Moz data)', action: 'Create a 3-step negative review response script and assign ownership' })
  }

  // Yelp cross-platform check
  if (yelpCount > 0 && yelpRating > 0 && Math.abs(yelpRating - rating) > 0.5) {
    hiddenThreats.push(`Yelp rating (${yelpRating}) and Google rating (${rating}) diverge significantly — investigate why`)
  }

  // NAP consistency
  if (napConsistency < 70) {
    sentimentScore -= 5
    hiddenThreats.push(`Only ${napConsistency}% NAP consistency — inconsistent name/address/phone across directories hurts local SEO and confuses customers`)
  }

  sentimentScore = Math.max(0, Math.min(100, sentimentScore))

  let overallSentiment: SentimentGhostResult['overallSentiment']
  if (sentimentScore >= 80)      overallSentiment = 'excellent'
  else if (sentimentScore >= 65) overallSentiment = 'positive'
  else if (sentimentScore >= 45) overallSentiment = 'mixed'
  else if (sentimentScore >= 25) overallSentiment = 'negative'
  else                            overallSentiment = 'crisis'

  let reputationRisk: SentimentGhostResult['reputationRisk']
  const criticalCount = signals.filter(s => s.type === 'critical').length
  if (criticalCount >= 3)     reputationRisk = 'critical'
  else if (criticalCount >= 2) reputationRisk = 'high'
  else if (criticalCount >= 1) reputationRisk = 'medium'
  else                          reputationRisk = 'low'

  // Velocity trend analysis
  let velocityTrend: SentimentGhostResult['velocityTrend']
  if (!hasGenSystem)      velocityTrend = 'stalled'
  else if (velocity >= 8) velocityTrend = 'accelerating'
  else if (velocity >= 4) velocityTrend = 'steady'
  else                     velocityTrend = 'slowing'

  // Project rating 12 months out (simplified model)
  const monthlyRatingImpact = hasGenSystem ? 0.02 : (responseRate > 50 ? 0 : -0.01)
  const projectedRating12mo = Math.min(5.0, Math.max(1.0, +(rating + (monthlyRatingImpact * 12)).toFixed(1)))

  return {
    overallSentiment,
    sentimentScore,
    reputationRisk,
    signals: signals.sort((a, b) => {
      const order = { critical: 0, warning: 1, positive: 2 }
      return order[a.type] - order[b.type]
    }),
    hiddenThreats,
    reputationMoat,
    velocityTrend,
    projectedRating12mo,
  }
}
