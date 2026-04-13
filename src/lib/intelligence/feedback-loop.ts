// AuraFlow — Self-Learning Feedback Loop
// Tracks diagnostic outcomes: did the client accept? Did the recommendations work?
// Each feedback entry becomes training data for the next Hermes fine-tune cycle.
//
// Flow:
//   PalaceReport generated → saved with report_id
//   Client reacts → feedback recorded (accepted, rejected, modified, converted)
//   Monthly: pull all feedback → weight good completions higher → retrain
//
// Supabase table: diagnostic_feedback (see schema SQL at bottom of file)

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type FeedbackOutcome =
  | 'accepted'       // client accepted the diagnostic as-is
  | 'modified'       // client accepted but asked for changes (partial win)
  | 'rejected'       // client rejected the diagnostic
  | 'converted'      // client signed up for AuraFlow services (best signal)
  | 'no_response'    // client never responded (weak negative)

export interface DiagnosticFeedback {
  report_id: string
  dataset_id?: string           // links to mock_datasets if from training data
  vertical: string
  health_level?: string
  foundation_score: number
  outcome: FeedbackOutcome
  quality_score: number         // 1-5 human rating of the executive summary
  client_comments?: string      // what the client said (if anything)
  summary_used: string          // the executive summary that was generated
  recommendations_followed: string[]  // which recommendations the client acted on
  revenue_impact?: number       // actual $ impact after 90 days (if trackable)
}

export interface FeedbackEntry extends DiagnosticFeedback {
  id: string
  created_at: string
  training_weight: number       // computed: how much to weight this in fine-tuning
}

// ─── FEEDBACK COLLECTOR ───────────────────────────────────────────────────────

function getSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/**
 * Record feedback for a completed diagnostic.
 * Called when a client responds to their report.
 */
export async function recordFeedback(feedback: DiagnosticFeedback): Promise<string> {
  const supabase = getSupabase()

  // Compute training weight based on outcome signal strength
  const training_weight = computeTrainingWeight(feedback)

  const { data, error } = await supabase
    .from('diagnostic_feedback')
    .insert({
      ...feedback,
      training_weight,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to record feedback: ${error.message}`)
  return data.id
}

/**
 * Pull all feedback entries for fine-tuning dataset generation.
 * Returns entries sorted by training_weight (best examples first).
 */
export async function getFeedbackForTraining(options?: {
  minQuality?: number         // minimum quality_score to include (default: 3)
  vertical?: string           // filter by vertical
  since?: string              // ISO date — only feedback after this date
  limit?: number
}): Promise<FeedbackEntry[]> {
  const supabase = getSupabase()
  const minQ = options?.minQuality ?? 3

  let query = supabase
    .from('diagnostic_feedback')
    .select('*')
    .gte('quality_score', minQ)
    .order('training_weight', { ascending: false })

  if (options?.vertical) query = query.eq('vertical', options.vertical)
  if (options?.since)    query = query.gte('created_at', options.since)
  if (options?.limit)    query = query.limit(options.limit)

  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch feedback: ${error.message}`)
  return (data ?? []) as FeedbackEntry[]
}

/**
 * Get feedback stats — how the model is performing over time.
 */
export async function getFeedbackStats(): Promise<{
  total: number
  byOutcome: Record<FeedbackOutcome, number>
  avgQuality: number
  conversionRate: number
  topVertical: string
  weakestVertical: string
}> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('diagnostic_feedback')
    .select('outcome, quality_score, vertical')

  if (error) throw new Error(`Failed to fetch stats: ${error.message}`)
  const rows = data ?? []

  const byOutcome: Record<string, number> = {
    accepted: 0, modified: 0, rejected: 0, converted: 0, no_response: 0,
  }
  const verticalScores: Record<string, { total: number; count: number }> = {}

  let qualitySum = 0
  let conversions = 0

  for (const row of rows) {
    byOutcome[row.outcome] = (byOutcome[row.outcome] ?? 0) + 1
    qualitySum += row.quality_score
    if (row.outcome === 'converted') conversions++

    if (!verticalScores[row.vertical]) {
      verticalScores[row.vertical] = { total: 0, count: 0 }
    }
    verticalScores[row.vertical].total += row.quality_score
    verticalScores[row.vertical].count++
  }

  const verticalAvgs = Object.entries(verticalScores).map(([v, s]) => ({
    vertical: v, avg: s.total / s.count,
  }))
  verticalAvgs.sort((a, b) => b.avg - a.avg)

  return {
    total: rows.length,
    byOutcome: byOutcome as Record<FeedbackOutcome, number>,
    avgQuality: rows.length > 0 ? Math.round((qualitySum / rows.length) * 10) / 10 : 0,
    conversionRate: rows.length > 0 ? Math.round((conversions / rows.length) * 100) : 0,
    topVertical: verticalAvgs[0]?.vertical ?? 'none',
    weakestVertical: verticalAvgs[verticalAvgs.length - 1]?.vertical ?? 'none',
  }
}

// ─── TRAINING WEIGHT CALCULATION ──────────────────────────────────────────────
// Higher weight = this example should count more in fine-tuning.
// Converted clients = gold standard. Rejected = negative examples (still useful).

function computeTrainingWeight(feedback: DiagnosticFeedback): number {
  let weight = 1.0

  // Outcome multiplier
  switch (feedback.outcome) {
    case 'converted':    weight *= 3.0; break  // best signal — client bought
    case 'accepted':     weight *= 2.0; break  // client agreed with analysis
    case 'modified':     weight *= 1.5; break  // partially useful
    case 'rejected':     weight *= 0.8; break  // negative example (still train on it)
    case 'no_response':  weight *= 0.3; break  // weak signal
  }

  // Quality multiplier (1-5 → 0.4-2.0)
  weight *= 0.2 + (feedback.quality_score / 5) * 1.8

  // Revenue impact bonus — if we can track real $ impact
  if (feedback.revenue_impact && feedback.revenue_impact > 10000) {
    weight *= 1.5
  }

  // Recommendations followed — more followed = better calibrated
  if (feedback.recommendations_followed.length >= 3) {
    weight *= 1.3
  }

  return Math.round(weight * 100) / 100
}

// ─── SUPABASE SCHEMA ──────────────────────────────────────────────────────────
// Run this in Supabase SQL editor:
//
// CREATE TABLE IF NOT EXISTS diagnostic_feedback (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   report_id TEXT NOT NULL,
//   dataset_id TEXT,
//   vertical TEXT NOT NULL,
//   health_level TEXT,
//   foundation_score INT NOT NULL,
//   outcome TEXT NOT NULL CHECK (outcome IN ('accepted','modified','rejected','converted','no_response')),
//   quality_score INT NOT NULL CHECK (quality_score BETWEEN 1 AND 5),
//   client_comments TEXT,
//   summary_used TEXT NOT NULL,
//   recommendations_followed TEXT[] DEFAULT '{}',
//   revenue_impact DECIMAL(12,2),
//   training_weight DECIMAL(5,2) DEFAULT 1.0,
//   created_at TIMESTAMPTZ DEFAULT now()
// );
//
// CREATE INDEX idx_feedback_vertical ON diagnostic_feedback(vertical);
// CREATE INDEX idx_feedback_outcome ON diagnostic_feedback(outcome);
// CREATE INDEX idx_feedback_weight ON diagnostic_feedback(training_weight DESC);
