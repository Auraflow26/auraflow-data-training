// AuraFlow Skill #3 — Competitor Mirror ("The Hall of Mirrors")
// Key data points: R05 (Google reviews), R06 (Google rating), scan_history benchmarks
// Shows exactly where the client stands vs real competitors in their vertical.

import type { Vertical } from '@/lib/types'

export interface CompetitorMirrorResult {
  vertical: string
  clientReviews: number
  clientRating: number
  industryMedianReviews: number
  industryMedianRating: number
  industryTopReviews: number      // top 10% benchmark
  industryTopRating: number
  reviewPercentile: number        // 0-100: where client sits vs peers
  ratingPercentile: number
  reviewGap: number               // reviews needed to reach median
  reviewGapToTop: number          // reviews needed to reach top 10%
  competitivePosition: 'leading' | 'competitive' | 'lagging' | 'invisible'
  insights: string[]
  quickWins: string[]
}

// Industry benchmark defaults (from scan_history aggregation)
// These get overridden when live Supabase data is passed in
const VERTICAL_BENCHMARKS: Record<string, {
  p25_reviews: number, median_reviews: number, top10_reviews: number,
  p25_rating: number,  median_rating: number,  top10_rating: number,
}> = {
  home_services: { p25_reviews: 28, median_reviews: 65,  top10_reviews: 280, p25_rating: 4.2, median_rating: 4.5, top10_rating: 4.8 },
  restaurant:    { p25_reviews: 55, median_reviews: 130, top10_reviews: 500, p25_rating: 4.0, median_rating: 4.2, top10_rating: 4.7 },
  agency:        { p25_reviews: 8,  median_reviews: 22,  top10_reviews: 85,  p25_rating: 4.3, median_rating: 4.6, top10_rating: 4.9 },
  real_estate:   { p25_reviews: 18, median_reviews: 42,  top10_reviews: 180, p25_rating: 4.4, median_rating: 4.6, top10_rating: 4.9 },
  ecommerce:     { p25_reviews: 12, median_reviews: 35,  top10_reviews: 150, p25_rating: 4.1, median_rating: 4.3, top10_rating: 4.8 },
  healthcare:    { p25_reviews: 22, median_reviews: 58,  top10_reviews: 220, p25_rating: 4.2, median_rating: 4.5, top10_rating: 4.8 },
  saas:          { p25_reviews: 15, median_reviews: 40,  top10_reviews: 160, p25_rating: 4.2, median_rating: 4.4, top10_rating: 4.8 },
  construction:  { p25_reviews: 20, median_reviews: 52,  top10_reviews: 200, p25_rating: 4.2, median_rating: 4.5, top10_rating: 4.8 },
  law:           { p25_reviews: 15, median_reviews: 38,  top10_reviews: 150, p25_rating: 4.3, median_rating: 4.6, top10_rating: 4.9 },
  accounting:    { p25_reviews: 12, median_reviews: 30,  top10_reviews: 120, p25_rating: 4.3, median_rating: 4.6, top10_rating: 4.9 },
  fitness:       { p25_reviews: 30, median_reviews: 75,  top10_reviews: 300, p25_rating: 4.3, median_rating: 4.5, top10_rating: 4.8 },
  insurance:     { p25_reviews: 10, median_reviews: 28,  top10_reviews: 110, p25_rating: 4.2, median_rating: 4.5, top10_rating: 4.9 },
  logistics:     { p25_reviews: 8,  median_reviews: 22,  top10_reviews: 90,  p25_rating: 4.1, median_rating: 4.4, top10_rating: 4.8 },
  manufacturing: { p25_reviews: 6,  median_reviews: 18,  top10_reviews: 70,  p25_rating: 4.1, median_rating: 4.4, top10_rating: 4.8 },
  education:     { p25_reviews: 15, median_reviews: 40,  top10_reviews: 160, p25_rating: 4.3, median_rating: 4.5, top10_rating: 4.9 },
}

function percentileRank(value: number, p25: number, median: number, top10: number): number {
  if (value >= top10) return 95
  if (value >= median) return 50 + Math.round(((value - median) / (top10 - median)) * 45)
  if (value >= p25)   return 25 + Math.round(((value - p25) / (median - p25)) * 25)
  return Math.max(1, Math.round((value / p25) * 25))
}

export function runCompetitorMirroring(
  rawData: Record<string, unknown>,
  vertical: Vertical,
  liveBenchmarks?: {
    median_reviews?: number; top10_reviews?: number; p25_reviews?: number;
    median_rating?: number;  top10_rating?: number;  p25_rating?: number;
  }
): CompetitorMirrorResult {
  const clientReviews = Number(rawData['R05'] ?? 0)
  const clientRating  = Number(rawData['R06'] ?? 0)

  const defaults = VERTICAL_BENCHMARKS[vertical] ?? VERTICAL_BENCHMARKS.home_services
  const bench = {
    p25_reviews:  liveBenchmarks?.p25_reviews  ?? defaults.p25_reviews,
    median_reviews: liveBenchmarks?.median_reviews ?? defaults.median_reviews,
    top10_reviews: liveBenchmarks?.top10_reviews  ?? defaults.top10_reviews,
    p25_rating:   liveBenchmarks?.p25_rating   ?? defaults.p25_rating,
    median_rating:  liveBenchmarks?.median_rating  ?? defaults.median_rating,
    top10_rating:   liveBenchmarks?.top10_rating   ?? defaults.top10_rating,
  }

  const reviewPercentile = percentileRank(clientReviews, bench.p25_reviews, bench.median_reviews, bench.top10_reviews)
  const ratingPercentile = percentileRank(clientRating,  bench.p25_rating,  bench.median_rating,  bench.top10_rating)

  const reviewGap      = Math.max(0, bench.median_reviews - clientReviews)
  const reviewGapToTop = Math.max(0, bench.top10_reviews  - clientReviews)

  let competitivePosition: CompetitorMirrorResult['competitivePosition']
  const avgPercentile = (reviewPercentile + ratingPercentile) / 2
  if (avgPercentile >= 75)      competitivePosition = 'leading'
  else if (avgPercentile >= 50) competitivePosition = 'competitive'
  else if (avgPercentile >= 25) competitivePosition = 'lagging'
  else                           competitivePosition = 'invisible'

  const insights: string[] = []
  if (clientReviews < bench.p25_reviews) {
    insights.push(`With ${clientReviews} reviews, you're in the bottom 25% of ${vertical.replace('_', ' ')} businesses. Competitors with ${bench.median_reviews}+ reviews dominate local search results.`)
  } else if (clientReviews < bench.median_reviews) {
    insights.push(`You have ${clientReviews} reviews vs. the industry median of ${bench.median_reviews}. ${reviewGap} more reviews puts you in the top half.`)
  } else {
    insights.push(`Your ${clientReviews} reviews places you above the median (${bench.median_reviews}). ${reviewGapToTop} more reviews puts you in the top 10%.`)
  }

  if (clientRating < bench.median_rating) {
    insights.push(`Your ${clientRating} rating is below the ${vertical.replace('_', ' ')} median of ${bench.median_rating}. Each 0.1-point increase in rating drives ~13% more click-throughs.`)
  } else if (clientRating >= bench.top10_rating) {
    insights.push(`Your ${clientRating} rating is top-tier for your vertical. Protect it — respond to every review within 24 hours.`)
  }

  const quickWins: string[] = [
    `Send review requests to your last 50 completed jobs this week — targeting ${Math.min(20, reviewGap)} new reviews`,
    clientRating < 4.5 ? 'Identify your 3 most satisfied repeat clients and call them personally to leave a review' : 'Maintain rating: respond to all new reviews within 2 hours',
    reviewGapToTop > 0 ? `At 5 reviews/month, you reach top-10% status in ${Math.ceil(reviewGapToTop / 5)} months` : 'You\'re in the top 10% — focus on review velocity to stay there',
  ]

  return {
    vertical,
    clientReviews,
    clientRating,
    industryMedianReviews: bench.median_reviews,
    industryMedianRating:  bench.median_rating,
    industryTopReviews:    bench.top10_reviews,
    industryTopRating:     bench.top10_rating,
    reviewPercentile,
    ratingPercentile,
    reviewGap,
    reviewGapToTop,
    competitivePosition,
    insights,
    quickWins,
  }
}
