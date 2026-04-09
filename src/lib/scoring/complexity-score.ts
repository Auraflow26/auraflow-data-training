// AuraFlow Diagnostic Engine — Complexity Score Algorithm
// Determines pricing tier, hierarchy depth, and deployment timeline.
// Output range: 10-40

import type { Vertical } from '@/lib/types'

export interface ComplexityInput {
  employee_count: number
  revenue: number           // annual, in dollars
  location_count?: number   // defaults to 1
  vertical: Vertical
  tool_count: number
  integration_needs?: 'low' | 'medium' | 'high' | 'enterprise' // defaults to medium
}

export interface ComplexityScoreResult {
  complexity_score: number
  tier: 'simple' | 'standard' | 'complex' | 'enterprise'
  diagnostic_fee: number
  turnaround_days: number
  hierarchy_depth: number
  breakdown: Record<string, number>
}

// Vertical complexity classification from the docs
const VERTICAL_COMPLEXITY: Record<Vertical, 'simple' | 'standard' | 'complex' | 'regulated'> = {
  fitness:      'simple',
  education:    'simple',
  restaurant:   'standard',
  home_services:'standard',
  real_estate:  'standard',
  construction: 'standard',
  agency:       'complex',
  ecommerce:    'complex',
  saas:         'complex',
  logistics:    'complex',
  manufacturing:'complex',
  healthcare:   'regulated',
  law:          'regulated',
  accounting:   'regulated',
  insurance:    'regulated',
}

const VERTICAL_COMPLEXITY_PTS: Record<string, number> = {
  simple: 2, standard: 4, complex: 6, regulated: 8,
}

export function calculateComplexityScore(input: ComplexityInput): ComplexityScoreResult {
  const breakdown: Record<string, number> = {}

  // Employee count
  if (input.employee_count <= 5)       breakdown.employees = 2
  else if (input.employee_count <= 15) breakdown.employees = 4
  else if (input.employee_count <= 30) breakdown.employees = 6
  else if (input.employee_count <= 50) breakdown.employees = 8
  else                                  breakdown.employees = 10

  // Revenue range
  if (input.revenue < 250_000)        breakdown.revenue = 1
  else if (input.revenue < 500_000)   breakdown.revenue = 2
  else if (input.revenue < 1_000_000) breakdown.revenue = 4
  else if (input.revenue < 5_000_000) breakdown.revenue = 6
  else                                 breakdown.revenue = 8

  // Locations
  const locs = input.location_count ?? 1
  if (locs === 1)       breakdown.locations = 0
  else if (locs <= 3)   breakdown.locations = 3
  else if (locs <= 10)  breakdown.locations = 5
  else                   breakdown.locations = 8

  // Vertical
  const vertType = VERTICAL_COMPLEXITY[input.vertical]
  breakdown.vertical = VERTICAL_COMPLEXITY_PTS[vertType]

  // Tool count
  if (input.tool_count <= 5)        breakdown.tools = 1
  else if (input.tool_count <= 10)  breakdown.tools = 3
  else if (input.tool_count <= 20)  breakdown.tools = 5
  else                               breakdown.tools = 7

  // Integration needs
  const intNeedMap: Record<string, number> = { low: 1, medium: 3, high: 5, enterprise: 7 }
  breakdown.integrations = intNeedMap[input.integration_needs ?? 'medium']

  const raw = Object.values(breakdown).reduce((a, b) => a + b, 0)
  // Clamp to [10, 40]
  const complexity_score = Math.max(10, Math.min(40, raw))

  let tier: ComplexityScoreResult['tier']
  let diagnostic_fee: number
  let turnaround_days: number
  let hierarchy_depth: number

  if (complexity_score <= 18) {
    tier = 'simple';        diagnostic_fee = 500;  turnaround_days = 3;  hierarchy_depth = 3
  } else if (complexity_score <= 26) {
    tier = 'standard';      diagnostic_fee = 1000; turnaround_days = 5;  hierarchy_depth = 5
  } else if (complexity_score <= 34) {
    tier = 'complex';       diagnostic_fee = 1500; turnaround_days = 7;  hierarchy_depth = 7
  } else {
    tier = 'enterprise';    diagnostic_fee = 0;    turnaround_days = 10; hierarchy_depth = 10
    // 0 = custom pricing
  }

  return { complexity_score, tier, diagnostic_fee, turnaround_days, hierarchy_depth, breakdown }
}
