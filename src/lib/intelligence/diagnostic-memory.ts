// AuraFlow — Diagnostic Vector Memory
// Stores past diagnostic reports as embeddings in Supabase pgvector.
// On a new diagnostic, retrieves the N most similar past cases for few-shot context.
//
// This gives Hermes real examples to reference — not generic advice, but
// "here's what we told the last 5 home services companies that looked like yours."
//
// Flow:
//   1. PalaceReport generated → fingerprint() → embedding → store in Supabase
//   2. New diagnostic comes in → fingerprint() → find 5 nearest neighbors
//   3. Return past summaries as few-shot examples for Hermes prompt
//
// Supabase setup: enable pgvector extension + create diagnostic_memory table (schema at bottom)

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface DiagnosticMemoryEntry {
  id?: string
  report_id: string
  vertical: string
  foundation_score: number
  fingerprint: number[]           // embedding vector (dimension = feature count)
  summary: string                 // the executive summary that was generated
  key_metrics: {
    revenue_bleed_annual: number
    owner_trap_level: string
    churn_rate: number
    margin_gap_pct: number
    valuation_gap: number
    lead_velocity_grade: string
    site_grade: string
    cyber_risk: string
  }
  outcome?: string                // from feedback loop — accepted/converted/etc
  quality_score?: number          // from feedback loop
  created_at?: string
}

export interface SimilarCase {
  report_id: string
  vertical: string
  foundation_score: number
  summary: string
  key_metrics: DiagnosticMemoryEntry['key_metrics']
  similarity: number              // 0-1, higher = more similar
}

// ─── FINGERPRINTING ───────────────────────────────────────────────────────────
// Instead of calling an embedding model (which costs money and adds latency),
// we build a deterministic numeric fingerprint from the diagnostic data.
// This is fast, free, and works perfectly for finding similar businesses.

export function fingerprint(data: {
  vertical: string
  foundation_score: number
  dimension_scores: Record<string, number>
  revenue_bleed_annual: number
  revenue: number
  owner_hrs: number
  team_autonomous_days: number
  churn_rate: number
  margin_pct: number
  benchmark_margin_pct: number
  lead_velocity_score: number
  site_performance: number
  seo_score: number
  cyber_resilience: number
  talent_score: number
  review_count: number
  review_rating: number
  repeat_rate: number
  employee_count: number
  valuation_multiple: number
}): number[] {
  // 25-dimensional feature vector — same order always
  const VERTICALS = [
    'home_services', 'restaurant', 'agency', 'real_estate', 'ecommerce',
    'healthcare', 'saas', 'construction', 'law', 'accounting',
    'fitness', 'insurance', 'logistics', 'manufacturing', 'education',
  ]
  const verticalIdx = VERTICALS.indexOf(data.vertical)

  return [
    // Vertical (one-hot would be 15 dims — use index instead, normalized)
    verticalIdx >= 0 ? verticalIdx / 14 : 0.5,

    // Core scores (normalized 0-1)
    data.foundation_score / 100,
    (data.dimension_scores.digital_presence ?? 0) / 14,
    (data.dimension_scores.lead_generation ?? 0) / 15,
    (data.dimension_scores.advertising ?? 0) / 12,
    (data.dimension_scores.reputation ?? 0) / 13,
    (data.dimension_scores.operations ?? 0) / 16,
    (data.dimension_scores.financial ?? 0) / 15,
    (data.dimension_scores.people ?? 0) / 15,

    // Financial signals (log-scaled for large ranges)
    Math.log10(Math.max(data.revenue, 1)) / 7,              // $1 → 0, $10M → 1
    Math.log10(Math.max(data.revenue_bleed_annual, 1)) / 6,  // $1 → 0, $1M → 1
    data.margin_pct / 50,                                     // 0% → 0, 50% → 1
    (data.benchmark_margin_pct - data.margin_pct) / 30,       // margin gap normalized

    // Owner/people signals
    Math.min(data.owner_hrs / 80, 1),                         // 0-80 hrs → 0-1
    Math.min(data.team_autonomous_days / 14, 1),              // 0-14 days → 0-1
    data.talent_score / 100,
    Math.min(data.employee_count / 50, 1),                    // 0-50 → 0-1

    // Pipeline/growth signals
    data.lead_velocity_score / 100,
    data.churn_rate / 100,
    Math.min(data.repeat_rate / 100, 1),

    // Digital signals
    data.site_performance / 100,
    data.seo_score / 100,
    data.cyber_resilience / 100,

    // Reputation signals
    Math.log10(Math.max(data.review_count, 1)) / 3,          // 1 → 0, 1000 → 1
    data.review_rating / 5,                                    // 0-5 → 0-1

    // Valuation
    data.valuation_multiple / 10,                              // 0-10x → 0-1
  ]
}

// ─── COSINE SIMILARITY ────────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB)
  return denom === 0 ? 0 : dot / denom
}

// ─── STORAGE ──────────────────────────────────────────────────────────────────

function getSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/**
 * Store a completed diagnostic in vector memory.
 * Call this after generatePalaceReport() produces results.
 */
export async function storeMemory(entry: DiagnosticMemoryEntry): Promise<string> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('diagnostic_memory')
    .upsert({
      report_id:        entry.report_id,
      vertical:         entry.vertical,
      foundation_score: entry.foundation_score,
      fingerprint:      entry.fingerprint,
      summary:          entry.summary,
      key_metrics:      entry.key_metrics,
      outcome:          entry.outcome ?? null,
      quality_score:    entry.quality_score ?? null,
    }, { onConflict: 'report_id' })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to store memory: ${error.message}`)
  return data.id
}

/**
 * Find the N most similar past diagnostics to a new fingerprint.
 * Uses cosine similarity on the 25-dim fingerprint vector.
 *
 * If pgvector is enabled, this uses SQL-level similarity search.
 * Otherwise, falls back to pulling all entries and computing locally.
 */
export async function findSimilar(
  queryFingerprint: number[],
  options?: {
    n?: number                // how many to return (default: 5)
    vertical?: string         // optionally restrict to same vertical
    minQuality?: number       // only return entries with quality >= this
  }
): Promise<SimilarCase[]> {
  const supabase = getSupabase()
  const n = options?.n ?? 5

  // Try pgvector first (fast, SQL-level)
  try {
    const { data, error } = await supabase.rpc('match_diagnostics', {
      query_fingerprint: queryFingerprint,
      match_count: n,
      filter_vertical: options?.vertical ?? null,
      min_quality: options?.minQuality ?? null,
    })

    if (!error && data && data.length > 0) {
      return data.map((row: any) => ({
        report_id:        row.report_id,
        vertical:         row.vertical,
        foundation_score: row.foundation_score,
        summary:          row.summary,
        key_metrics:      row.key_metrics,
        similarity:       row.similarity,
      }))
    }
  } catch {
    // pgvector RPC not available — fall through to local computation
  }

  // Fallback: pull all entries and compute cosine similarity locally
  let query = supabase
    .from('diagnostic_memory')
    .select('report_id, vertical, foundation_score, summary, key_metrics, fingerprint')

  if (options?.vertical)   query = query.eq('vertical', options.vertical)
  if (options?.minQuality) query = query.gte('quality_score', options.minQuality)

  const { data: rows, error } = await query
  if (error) throw new Error(`Failed to query memory: ${error.message}`)
  if (!rows || rows.length === 0) return []

  const scored = rows.map(row => ({
    report_id:        row.report_id,
    vertical:         row.vertical,
    foundation_score: row.foundation_score,
    summary:          row.summary,
    key_metrics:      row.key_metrics,
    similarity:       cosineSimilarity(queryFingerprint, row.fingerprint as number[]),
  }))

  scored.sort((a, b) => b.similarity - a.similarity)
  return scored.slice(0, n)
}

/**
 * Build a few-shot prompt section from similar past diagnostics.
 * Returns a formatted string ready to prepend to the Hermes prompt.
 */
export function buildFewShotContext(cases: SimilarCase[]): string {
  if (cases.length === 0) return ''

  const sections = cases.map((c, i) => {
    const m = c.key_metrics
    return `--- SIMILAR CASE ${i + 1} (${Math.round(c.similarity * 100)}% match) ---
Vertical: ${c.vertical.replace(/_/g, ' ')} | Score: ${c.foundation_score}/100
Revenue bleed: $${m.revenue_bleed_annual.toLocaleString()}/yr | Owner: ${m.owner_trap_level}
Churn: ${m.churn_rate}% | Margin gap: ${m.margin_gap_pct}% | Lead grade: ${m.lead_velocity_grade}
Summary generated:
${c.summary}`
  })

  return `[SIMILAR PAST DIAGNOSTICS — use these as reference for tone and specificity]

${sections.join('\n\n')}

[END SIMILAR CASES — now generate the summary for the current business]
`
}

/**
 * Update memory with feedback data (called when feedback-loop records outcome).
 */
export async function updateMemoryWithFeedback(
  report_id: string,
  outcome: string,
  quality_score: number,
): Promise<void> {
  const supabase = getSupabase()

  const { error } = await supabase
    .from('diagnostic_memory')
    .update({ outcome, quality_score })
    .eq('report_id', report_id)

  if (error) throw new Error(`Failed to update memory: ${error.message}`)
}

// ─── SUPABASE SCHEMA ──────────────────────────────────────────────────────────
// Run this in Supabase SQL editor:
//
// -- Enable pgvector if not already enabled
// CREATE EXTENSION IF NOT EXISTS vector;
//
// CREATE TABLE IF NOT EXISTS diagnostic_memory (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   report_id TEXT UNIQUE NOT NULL,
//   vertical TEXT NOT NULL,
//   foundation_score INT NOT NULL,
//   fingerprint FLOAT8[] NOT NULL,          -- 25-dim feature vector
//   summary TEXT NOT NULL,
//   key_metrics JSONB NOT NULL,
//   outcome TEXT,
//   quality_score INT,
//   created_at TIMESTAMPTZ DEFAULT now()
// );
//
// CREATE INDEX idx_memory_vertical ON diagnostic_memory(vertical);
// CREATE INDEX idx_memory_score ON diagnostic_memory(foundation_score);
// CREATE INDEX idx_memory_quality ON diagnostic_memory(quality_score);
//
// -- pgvector similarity search function
// -- If pgvector is available, this gives SQL-level cosine search
// CREATE OR REPLACE FUNCTION match_diagnostics(
//   query_fingerprint FLOAT8[],
//   match_count INT DEFAULT 5,
//   filter_vertical TEXT DEFAULT NULL,
//   min_quality INT DEFAULT NULL
// ) RETURNS TABLE (
//   report_id TEXT,
//   vertical TEXT,
//   foundation_score INT,
//   summary TEXT,
//   key_metrics JSONB,
//   similarity FLOAT8
// ) LANGUAGE plpgsql AS $$
// BEGIN
//   RETURN QUERY
//   SELECT
//     dm.report_id, dm.vertical, dm.foundation_score, dm.summary, dm.key_metrics,
//     1 - (dm.fingerprint::vector <=> query_fingerprint::vector) AS similarity
//   FROM diagnostic_memory dm
//   WHERE (filter_vertical IS NULL OR dm.vertical = filter_vertical)
//     AND (min_quality IS NULL OR dm.quality_score >= min_quality)
//   ORDER BY dm.fingerprint::vector <=> query_fingerprint::vector
//   LIMIT match_count;
// END;
// $$;
