// AuraFlow Diagnostic Engine — Foundation Score Algorithm
// Takes raw_data (163 data points) → dimension scores → Foundation Score (0-100)
//
// DATA SCIENCE AUDIT NOTE:
// - No future data leakage: all 163 points are observable at diagnostic time ✓
// - Fully deterministic: no random state ✓
// - Scoring is bounded [0, DIMENSION_MAX] per dimension ✓

import { DATA_POINTS, DIMENSION_MAXES, DIMENSION_NAMES, getDimensionRawMax } from './dimension-weights'
import type { DiagnosticDimension } from '@/lib/types'

export interface FoundationScoreResult {
  foundation_score: number
  dimension_scores: Record<DiagnosticDimension, number>
  raw_dimension_pts: Record<DiagnosticDimension, number>
  tier: 'critical' | 'significant_gaps' | 'functional' | 'strong' | 'optimized'
  tier_label: string
}

// ─── SCORING HELPERS ─────────────────────────────────────────────────────────

function scoreNumeric(
  value: number,
  thresholds: number[],
  direction: 'higher_better' | 'lower_better'
): number {
  // thresholds = [poor, below_avg, above_avg, excellent]
  const [t0, t1, t2, t3] = thresholds
  if (direction === 'higher_better') {
    if (value >= t3) return 1.0
    if (value >= t2) return 0.75
    if (value >= t1) return 0.5
    if (value >= t0) return 0.25
    return 0
  } else {
    // lower is better — invert
    if (value <= t3) return 1.0
    if (value <= t2) return 0.75
    if (value <= t1) return 0.5
    if (value <= t0) return 0.25
    return 0
  }
}

function scoreDataPoint(id: string, value: unknown): number {
  const config = DATA_POINTS.find(dp => dp.id === id)
  if (!config || config.weight === 0) return 0
  if (value === null || value === undefined) return 0

  switch (config.direction) {
    case 'binary':
      return (value === true || value === 'Yes' || value === 'yes' || value === 'true' || value === 1) ? 1 : 0

    case 'scale': {
      const v = Number(value)
      if (isNaN(v)) return 0
      return Math.max(0, Math.min(1, (v - 1) / 4)) // 1→0, 3→0.5, 5→1
    }

    case 'percentage': {
      const target = config.thresholds?.[0] ?? 100
      const v = Number(value)
      if (isNaN(v)) return 0
      return Math.min(v / target, 1)
    }

    case 'higher_better':
    case 'lower_better': {
      if (!config.thresholds) return 0
      const v = Number(value)
      if (isNaN(v)) return 0
      return scoreNumeric(v, config.thresholds, config.direction)
    }

    case 'category': {
      const map = config.valueMap ?? {}
      const key = String(value).toLowerCase().replace(/\s+/g, '_')
      return map[key] ?? 0
    }

    case 'multi': {
      // value is an array or object — more items = better (max 1.0 at 3+ items)
      const arr = Array.isArray(value) ? value : Object.keys(value as object)
      const count = arr.filter(Boolean).length
      return Math.min(count / 3, 1)
    }

    default:
      return 0
  }
}

// ─── MAIN ALGORITHM ─────────────────────────────────────────────────────────

export function calculateFoundationScore(rawData: Record<string, unknown>): FoundationScoreResult {
  // Accumulate raw weighted points per dimension
  const dimRawPts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 }

  for (const dp of DATA_POINTS) {
    if (dp.weight === 0) continue
    const norm = scoreDataPoint(dp.id, rawData[dp.id])
    dimRawPts[dp.dimension] += norm * dp.weight
  }

  // Normalize each dimension to its max score
  const dimensionScores: Record<DiagnosticDimension, number> = {} as Record<DiagnosticDimension, number>
  const rawDimPts: Record<DiagnosticDimension, number> = {} as Record<DiagnosticDimension, number>
  let foundation_score = 0

  for (let dim = 1; dim <= 7; dim++) {
    const dimName = DIMENSION_NAMES[dim] as DiagnosticDimension
    const rawMax = getDimensionRawMax(dim)
    const maxScore = DIMENSION_MAXES[dim]
    const rawPts = dimRawPts[dim]

    // Normalize to max dimension score (e.g. D1 raw → 14 pts max)
    const dimScore = rawMax > 0 ? Math.round((rawPts / rawMax) * maxScore * 10) / 10 : 0
    dimensionScores[dimName] = dimScore
    rawDimPts[dimName] = Math.round(rawPts * 10) / 10
    foundation_score += dimScore
  }

  foundation_score = Math.round(foundation_score)

  // Scoring tiers from the docs
  let tier: FoundationScoreResult['tier']
  let tier_label: string
  if (foundation_score <= 25) {
    tier = 'critical'
    tier_label = 'Critical Infrastructure Gaps'
  } else if (foundation_score <= 50) {
    tier = 'significant_gaps'
    tier_label = 'Significant Gaps'
  } else if (foundation_score <= 70) {
    tier = 'functional'
    tier_label = 'Functional, Inefficient'
  } else if (foundation_score <= 85) {
    tier = 'strong'
    tier_label = 'Strong Foundation'
  } else {
    tier = 'optimized'
    tier_label = 'Optimized'
  }

  return { foundation_score, dimension_scores: dimensionScores, raw_dimension_pts: rawDimPts, tier, tier_label }
}
