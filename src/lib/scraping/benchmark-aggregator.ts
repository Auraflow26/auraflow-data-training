/**
 * AuraFlow — Benchmark Aggregator
 * Reads scan_history for a vertical, calculates p25/median/p75/top10
 * per data point, and upserts to industry_benchmarks table.
 */

import { createClient } from '@supabase/supabase-js'
import type { LighthouseData, WebsiteStructureData, SocialPresenceData, Vertical } from '../types'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── Percentile math ──────────────────────────────────────────────────────────

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(idx)
  const upper = Math.ceil(idx)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower)
}

function calcPercentiles(values: number[]) {
  if (values.length === 0) return { p25: 0, median: 0, p75: 0, top10: 0 }
  const sorted = [...values].sort((a, b) => a - b)
  return {
    p25: Math.round(percentile(sorted, 25) * 100) / 100,
    median: Math.round(percentile(sorted, 50) * 100) / 100,
    p75: Math.round(percentile(sorted, 75) * 100) / 100,
    top10: Math.round(percentile(sorted, 90) * 100) / 100,
  }
}

// ─── Data point extractors ────────────────────────────────────────────────────
// Each extractor pulls a specific metric from scan_data for a row.
// Maps to scoring IDs (D01, R05, etc.) from the feature registry.

interface ScanRow {
  google_rating: number
  google_review_count: number
  scan_data: {
    lighthouse?: LighthouseData
    structure?: WebsiteStructureData
    social?: SocialPresenceData
  }
}

interface DataPointExtractor {
  id: string       // Scoring ID (D01, R05, etc.)
  name: string
  extract: (row: ScanRow) => number | null
}

const EXTRACTORS: DataPointExtractor[] = [
  // DIGITAL PRESENCE
  { id: 'D01', name: 'Website Exists', extract: r => r.scan_data.structure ? 1 : (r.scan_data.lighthouse ? 1 : 0) },
  { id: 'D04', name: 'Mobile Responsive', extract: r => r.scan_data.lighthouse?.mobile_friendly ? 1 : 0 },
  { id: 'D05', name: 'Page Load Speed (sec)', extract: r => r.scan_data.lighthouse ? r.scan_data.lighthouse.page_load_ms / 1000 : null },
  { id: 'D08', name: 'SSL Certificate', extract: r => r.scan_data.structure?.ssl ? 1 : 0 },
  { id: 'D11', name: 'Has Blog', extract: r => r.scan_data.structure?.has_blog ? 1 : 0 },
  { id: 'D13', name: 'Service Pages Count', extract: r => r.scan_data.structure?.service_pages_count ?? null },
  { id: 'D17', name: 'Contact Form Exists', extract: r => r.scan_data.structure?.has_contact_form ? 1 : 0 },
  { id: 'D18', name: 'Phone Visible Above Fold', extract: r => r.scan_data.structure?.phone_visible ? 1 : 0 },
  { id: 'D20', name: 'Chat Widget Exists', extract: r => r.scan_data.structure?.has_chat_widget ? 1 : 0 },
  { id: 'D22', name: 'Schema Markup', extract: r => r.scan_data.structure?.has_schema ? 1 : 0 },
  { id: 'D23', name: 'Google Analytics Installed', extract: r => r.scan_data.structure?.has_analytics ? 1 : 0 },
  { id: 'D25', name: 'Facebook Pixel Installed', extract: r => r.scan_data.structure?.has_facebook_pixel ? 1 : 0 },
  { id: 'D_SEO', name: 'SEO Score (Lighthouse)', extract: r => r.scan_data.lighthouse?.seo_score ?? null },
  { id: 'D_PERF', name: 'Performance Score (Lighthouse)', extract: r => r.scan_data.lighthouse?.performance_score ?? null },
  { id: 'D_LCP', name: 'LCP (sec)', extract: r => r.scan_data.lighthouse?.lcp ?? null },
  { id: 'D_CLS', name: 'CLS', extract: r => r.scan_data.lighthouse?.cls ?? null },

  // REPUTATION
  { id: 'R01', name: 'GBP Claimed', extract: r => r.google_review_count > 0 ? 1 : 0 },
  { id: 'R05', name: 'Total Google Reviews', extract: r => r.google_review_count },
  { id: 'R06', name: 'Google Star Rating', extract: r => r.google_rating },

  // SOCIAL PRESENCE
  { id: 'S_IG', name: 'Has Instagram', extract: r => r.scan_data.social?.has_instagram ? 1 : 0 },
  { id: 'S_IG_FOLLOWERS', name: 'Instagram Followers', extract: r => r.scan_data.social?.ig_followers ?? null },
  { id: 'S_FB', name: 'Has Facebook', extract: r => r.scan_data.social?.has_facebook ? 1 : 0 },
  { id: 'S_FB_FOLLOWERS', name: 'Facebook Followers', extract: r => r.scan_data.social?.fb_followers ?? null },
]

// ─── Main aggregation function ────────────────────────────────────────────────

export async function aggregateBenchmarks(vertical: Vertical, sizeBand = 'all'): Promise<void> {
  const db = supabase()

  // Fetch all scan_history for this vertical
  const { data: rows, error } = await db
    .from('scan_history')
    .select('google_rating, google_review_count, scan_data')
    .eq('vertical', vertical)

  if (error) throw new Error(`Failed to fetch scan_history: ${error.message}`)
  if (!rows || rows.length === 0) {
    console.log(`  No scan_history found for ${vertical} — skipping benchmark aggregation`)
    return
  }

  console.log(`  Aggregating benchmarks for ${vertical} (${rows.length} businesses)`)

  const upsertRows: Array<{
    vertical: string
    size_band: string
    data_point_id: string
    data_point_name: string
    benchmark_p25: number
    benchmark_median: number
    benchmark_p75: number
    benchmark_top10: number
    sample_size: number
    source: string
  }> = []

  for (const extractor of EXTRACTORS) {
    const values = rows
      .map(row => extractor.extract(row as ScanRow))
      .filter((v): v is number => v !== null && !isNaN(v))

    if (values.length < 3) continue // Not enough data

    const { p25, median, p75, top10 } = calcPercentiles(values)

    upsertRows.push({
      vertical,
      size_band: sizeBand,
      data_point_id: extractor.id,
      data_point_name: extractor.name,
      benchmark_p25: p25,
      benchmark_median: median,
      benchmark_p75: p75,
      benchmark_top10: top10,
      sample_size: values.length,
      source: 'apify_scrape_2026',
    })
  }

  if (upsertRows.length === 0) {
    console.log(`  No benchmark rows to upsert for ${vertical}`)
    return
  }

  const { error: upsertError } = await db
    .from('industry_benchmarks')
    .upsert(upsertRows, { onConflict: 'vertical,size_band,data_point_id' })

  if (upsertError) throw new Error(`Failed to upsert benchmarks: ${upsertError.message}`)

  console.log(`  ✓ Upserted ${upsertRows.length} benchmark data points for ${vertical}`)
}
