#!/usr/bin/env tsx
/**
 * AuraFlow — Industry Benchmark Scraper
 *
 * Scrapes publicly accessible benchmark pages from open sources,
 * extracts structured data using Claude, maps to our data point IDs,
 * and upserts into Supabase industry_benchmarks table.
 *
 * Sources:
 *   Layer 1 (Web scrape):  WordStream, Databox, ReviewTrackers, HubSpot blog
 *   Layer 2 (PDF extract): Clio, Toast, ServiceTitan (run separately after downloading)
 *   Layer 3 (API):         PageSpeed + GBP already in scan_history
 *
 * Usage:
 *   npx tsx scripts/scrape-industry-benchmarks.ts              # all sources
 *   npx tsx scripts/scrape-industry-benchmarks.ts --source wordstream
 *   npx tsx scripts/scrape-industry-benchmarks.ts --dry-run    # print, don't upsert
 */

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const isDryRun = process.argv.includes('--dry-run')
const sourceFilter = process.argv.find(a => a.startsWith('--source='))?.split('=')[1]
  ?? (process.argv[process.argv.indexOf('--source') + 1] !== undefined
      && !process.argv[process.argv.indexOf('--source') + 1].startsWith('--')
        ? process.argv[process.argv.indexOf('--source') + 1]
        : null)

// ─── VERTICAL MAPPING ─────────────────────────────────────────────────────────
// Maps source industry names → our vertical IDs
const VERTICAL_MAP: Record<string, string> = {
  // WordStream industry names
  'home services': 'home_services',
  'home improvement': 'home_services',
  'legal': 'law',
  'legal services': 'law',
  'healthcare': 'healthcare',
  'health and medical': 'healthcare',
  'restaurants': 'restaurant',
  'restaurant': 'restaurant',
  'real estate': 'real_estate',
  'ecommerce': 'ecommerce',
  'e-commerce': 'ecommerce',
  'education': 'education',
  'finance and insurance': 'insurance',
  'insurance': 'insurance',
  'industrial services': 'manufacturing',
  'business services': 'agency',
  'fitness': 'fitness',
  'sports and recreation': 'fitness',
  'technology': 'saas',
  'software': 'saas',
  'b2b': 'saas',
  'construction': 'construction',
  'automotive': 'home_services', // closest vertical
  'travel and hospitality': 'restaurant',
}

// ─── DATA POINT MAPPING ───────────────────────────────────────────────────────
// What each extracted metric maps to in our scoring system
const METRIC_TO_DATAPOINT: Record<string, { id: string, description: string }> = {
  ctr: { id: 'A06', description: 'Google Ads CTR %' },
  cpc: { id: 'A07', description: 'Google Ads CPC $' },
  cpa: { id: 'L03', description: 'Cost per acquisition/lead $' },
  cpl: { id: 'L03', description: 'Cost per lead $' },
  conversion_rate: { id: 'L24', description: 'Conversion rate %' },
  cvr: { id: 'L24', description: 'Conversion rate %' },
  google_rating: { id: 'R06', description: 'Google rating' },
  review_count: { id: 'R05', description: 'Google review count' },
  response_rate: { id: 'R08', description: 'Review response rate %' },
  response_time: { id: 'L04', description: 'Lead response time (min)' },
  phone_answer_rate: { id: 'L07', description: 'Phone answer rate %' },
}

// ─── SOURCES ──────────────────────────────────────────────────────────────────

interface BenchmarkSource {
  id: string
  name: string
  url: string
  description: string
  extractPrompt: string
}

const SOURCES: BenchmarkSource[] = [
  {
    id: 'wordstream',
    name: 'WordStream Google Ads Benchmarks',
    url: 'https://www.wordstream.com/google-adwords-industry-benchmarks',
    description: 'CTR, CPC, CVR, CPA by industry for Google Ads',
    extractPrompt: `Extract ALL industry-specific benchmark data from this page.
For each industry listed, extract: CTR (%), CPC ($), conversion rate (%), CPA ($).
Return as JSON array:
[{"industry": "Legal", "ctr": 2.93, "cpc": 6.75, "conversion_rate": 6.98, "cpa": 86.02}, ...]
Only return the JSON array, no other text.`,
  },
  {
    id: 'databox_ctr',
    name: 'Databox Google Ads Benchmarks',
    url: 'https://databox.com/google-ads-benchmarks',
    description: 'Overall and industry Google Ads performance metrics',
    extractPrompt: `Extract all benchmark metrics from this page.
Look for CTR, CPC, CPA, conversion rate, ROAS data.
Return as JSON array with industry-specific data where available:
[{"industry": "all", "ctr": 4.7, "cpc": 1.53, "conversion_rate": 2.55, "cpa": 52.08}]
Only return the JSON array.`,
  },
  {
    id: 'reviewtrackers',
    name: 'ReviewTrackers Online Reviews Survey',
    url: 'https://www.reviewtrackers.com/reports/online-reviews-survey/',
    description: 'Review behavior benchmarks: response rates, velocity, platform data',
    extractPrompt: `Extract all review-related benchmark statistics from this page.
Look for: average star ratings, review response rates, how quickly businesses respond,
which platforms customers use, percentage of businesses that respond to reviews.
Return as JSON: {"avg_rating": 4.1, "response_rate_pct": 53, "avg_response_time_hrs": 24, ...}
Only return the JSON object.`,
  },
  {
    id: 'hubspot_response',
    name: 'HubSpot Lead Response Time Data',
    url: 'https://blog.hubspot.com/sales/lead-response-time-stats',
    description: 'Lead response time benchmarks and impact on conversion',
    extractPrompt: `Extract all statistics about lead response times from this page.
Look for: average response times, percentage of companies that respond quickly,
impact of fast response on conversion rates, best practice response time targets.
Return as JSON: {"avg_response_time_min": 47, "respond_within_5min_pct": 7,
"first_responder_win_rate": 78, "recommended_response_time_min": 5}
Only return the JSON object.`,
  },
  {
    id: 'birdeye_reviews',
    name: 'BirdEye Review Benchmarks',
    url: 'https://birdeye.com/blog/review-statistics/',
    description: 'Review count, rating, and velocity benchmarks by industry',
    extractPrompt: `Extract all review benchmark statistics from this page.
Look for: average review counts by industry, average star ratings, review velocity,
percentage of consumers who read reviews, how many reviews consumers expect.
Return as JSON with industry-specific data where available:
{"avg_rating_all": 4.1, "min_reviews_before_trust": 10, "industries": [...]}
Only return the JSON.`,
  },
  {
    id: 'invoca_phone',
    name: 'Invoca Phone Call Benchmarks',
    url: 'https://www.invoca.com/blog/phone-call-statistics',
    description: 'Phone answer rates, call conversion benchmarks',
    extractPrompt: `Extract all phone call and call center benchmark statistics.
Look for: phone answer rates, call conversion rates, lead response times,
percentage of leads that come via phone, impact of missed calls.
Return as JSON: {"answer_rate_pct": 61, "calls_to_appointment_cvr": 42,
"missed_call_cost_pct": 67, "preferred_contact_phone_pct": 65}
Only return the JSON object.`,
  },
]

// ─── SCRAPER ──────────────────────────────────────────────────────────────────

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,*/*',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  const html = await res.text()
  // Strip tags, collapse whitespace — give Claude clean text
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 50000) // Claude context limit buffer
}

async function extractWithClaude(content: string, prompt: string, sourceName: string): Promise<unknown> {
  const msg = await claude.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `You are extracting benchmark data from a webpage for a business intelligence platform.

PAGE CONTENT:
${content}

EXTRACTION TASK:
${prompt}

IMPORTANT: Return ONLY valid JSON. No markdown, no explanation, just the JSON.`,
    }],
  })
  const text = (msg.content[0] as { type: string; text: string }).text.trim()
  // Strip markdown code fences if present
  const clean = text.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim()
  return JSON.parse(clean)
}

// ─── BENCHMARK MAPPER ─────────────────────────────────────────────────────────

interface BenchmarkRow {
  vertical: string
  size_band: string
  data_point_id: string
  benchmark_p25: number | null
  benchmark_median: number | null
  benchmark_p75: number | null
  benchmark_top10: number | null
  sample_size: number
  source: string
}

function mapWordStreamData(data: unknown[], sourceName: string): BenchmarkRow[] {
  const rows: BenchmarkRow[] = []
  const arr = data as Array<Record<string, unknown>>

  for (const item of arr) {
    const industryRaw = String(item.industry ?? '').toLowerCase()
    const vertical = VERTICAL_MAP[industryRaw]
    if (!vertical) continue

    const metrics: Array<{ field: string; dpId: string }> = [
      { field: 'ctr', dpId: 'A06' },
      { field: 'cpc', dpId: 'A07' },
      { field: 'conversion_rate', dpId: 'L24' },
      { field: 'cpa', dpId: 'L03' },
    ]

    for (const { field, dpId } of metrics) {
      const val = Number(item[field])
      if (isNaN(val)) continue

      rows.push({
        vertical,
        size_band: 'all',
        data_point_id: dpId,
        benchmark_p25: val * 0.7,   // estimate p25 as 70% of median
        benchmark_median: val,
        benchmark_p75: val * 1.35,  // estimate p75 as 135% of median
        benchmark_top10: val * 1.8, // estimate top10 as 180% of median
        sample_size: 1,
        source: sourceName,
      })
    }
  }
  return rows
}

function mapGenericData(data: unknown, dpId: string, vertical: string, sourceName: string): BenchmarkRow[] {
  const obj = data as Record<string, unknown>
  const rows: BenchmarkRow[] = []

  // Look for keys that match our metric names
  for (const [key, val] of Object.entries(obj)) {
    const numVal = Number(val)
    if (isNaN(numVal) || numVal === 0) continue

    const dp = Object.entries(METRIC_TO_DATAPOINT).find(([k]) => key.toLowerCase().includes(k))
    if (!dp) continue

    rows.push({
      vertical,
      size_band: 'all',
      data_point_id: dp[1].id,
      benchmark_p25: numVal * 0.65,
      benchmark_median: numVal,
      benchmark_p75: numVal * 1.4,
      benchmark_top10: numVal * 1.9,
      sample_size: 1,
      source: sourceName,
    })
  }
  return rows
}

// ─── UPSERT ───────────────────────────────────────────────────────────────────

async function upsertBenchmarks(rows: BenchmarkRow[]): Promise<void> {
  if (!rows.length) return

  const { error } = await db
    .from('source_benchmarks')
    .upsert(rows, { onConflict: 'vertical,size_band,data_point_id,source' })

  if (error) {
    // Table may not exist yet — print SQL to create it
    if (error.code === '42P01') {
      console.log('\n⚠️  source_benchmarks table not found. Run this in Supabase SQL editor:')
      console.log(`
CREATE TABLE source_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical TEXT NOT NULL,
  size_band TEXT NOT NULL DEFAULT 'all',
  data_point_id TEXT NOT NULL,
  benchmark_p25 DECIMAL(12,4),
  benchmark_median DECIMAL(12,4),
  benchmark_p75 DECIMAL(12,4),
  benchmark_top10 DECIMAL(12,4),
  sample_size INT DEFAULT 1,
  source TEXT NOT NULL,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vertical, size_band, data_point_id, source)
);
CREATE INDEX idx_sb_vertical ON source_benchmarks(vertical, data_point_id);
      `)
    } else {
      console.log('  ❌ Upsert error:', error.message)
    }
  }
}

// ─── THRESHOLD GENERATOR ──────────────────────────────────────────────────────
// After scraping, generates updated threshold recommendations for dimension-weights.ts

async function generateThresholdReport(): Promise<void> {
  const { data, error } = await db
    .from('source_benchmarks')
    .select('*')
    .order('data_point_id')

  if (error || !data?.length) {
    console.log('\n⚠️  No source_benchmarks data yet. Run scraper first.')
    return
  }

  console.log('\n\n═'.repeat(55))
  console.log('THRESHOLD UPDATE RECOMMENDATIONS FOR dimension-weights.ts')
  console.log('═'.repeat(55))
  console.log('Based on scraped industry data. Format: [poor, ok, good, excellent]\n')

  // Group by data_point_id
  const byDp: Record<string, typeof data> = {}
  data.forEach(r => {
    if (!byDp[r.data_point_id]) byDp[r.data_point_id] = []
    byDp[r.data_point_id].push(r)
  })

  for (const [dpId, rows] of Object.entries(byDp)) {
    const medians = rows.map(r => r.benchmark_median).filter(Boolean)
    const p25s = rows.map(r => r.benchmark_p25).filter(Boolean)
    const p75s = rows.map(r => r.benchmark_p75).filter(Boolean)
    const top10s = rows.map(r => r.benchmark_top10).filter(Boolean)

    if (!medians.length) continue

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
    const sources = [...new Set(rows.map(r => r.source))].join(', ')

    console.log(`${dpId} — sources: ${sources}`)
    console.log(`  Suggested thresholds: [${avg(p25s).toFixed(1)}, ${avg(medians).toFixed(1)}, ${avg(p75s).toFixed(1)}, ${avg(top10s).toFixed(1)}]`)
    console.log()
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(55))
  console.log('AURAFLOW — INDUSTRY BENCHMARK SCRAPER')
  console.log('═'.repeat(55))
  if (isDryRun) console.log('DRY RUN — no data will be written\n')

  const sources = sourceFilter
    ? SOURCES.filter(s => s.id === sourceFilter)
    : SOURCES

  if (!sources.length) {
    console.log(`❌ Unknown source: ${sourceFilter}`)
    console.log('Available:', SOURCES.map(s => s.id).join(', '))
    process.exit(1)
  }

  let totalRows = 0

  for (const source of sources) {
    console.log(`\n▶ ${source.name}`)
    console.log(`  ${source.url}`)

    try {
      // Fetch page
      process.stdout.write('  Fetching...')
      const html = await fetchPage(source.url)
      process.stdout.write(` ${Math.round(html.length / 1000)}KB\n`)

      // Extract with Claude
      process.stdout.write('  Extracting with Claude...')
      const extracted = await extractWithClaude(html, source.extractPrompt, source.name)
      process.stdout.write(' done\n')

      // Map to benchmark rows
      let rows: BenchmarkRow[] = []
      if (source.id === 'wordstream') {
        rows = mapWordStreamData(extracted as unknown[], source.name)
      } else {
        // Generic: map to 'all' verticals
        rows = mapGenericData(extracted, '', 'all', source.name)
      }

      if (!rows.length) {
        console.log('  ⚠️  No mappable data extracted')
        console.log('  Raw:', JSON.stringify(extracted).slice(0, 200))
        continue
      }

      console.log(`  ✓ Extracted ${rows.length} benchmark data points`)

      if (isDryRun) {
        console.log('  Sample:', JSON.stringify(rows.slice(0, 2), null, 2))
        continue
      }

      // Upsert
      await upsertBenchmarks(rows)
      console.log(`  ✓ Upserted to source_benchmarks`)
      totalRows += rows.length

    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('JSON')) {
        console.log('  ⚠️  Claude returned non-JSON — page may be blocked or content missing')
      } else {
        console.log('  ❌', msg)
      }
    }
  }

  if (!isDryRun && totalRows > 0) {
    console.log(`\n✅ Total: ${totalRows} benchmarks written to source_benchmarks`)
    await generateThresholdReport()
  } else if (!isDryRun) {
    console.log('\n⚠️  No data written. Check source accessibility.')
  }

  // Always print the PDF instructions
  console.log('\n\n─── LAYER 2: PDF SOURCES (manual download required) ───')
  console.log('These sources publish free annual reports with deep benchmark data.')
  console.log('Download the PDFs, then run: npx tsx scripts/extract-pdf-benchmarks.ts <file.pdf>\n')
  console.log('  📄 Clio Legal Trends Report    → https://www.clio.com/resources/legal-trends/')
  console.log('     Contains: billable hours, utilization, collection rates, software adoption')
  console.log()
  console.log('  📄 Toast Restaurant Report     → https://pos.toasttab.com/resources/restaurant-success-from-day-one')
  console.log('     Contains: food cost %, labor %, table turns, online order rates')
  console.log()
  console.log('  📄 ServiceTitan Contractor Report → https://www.servicetitan.com/blog/home-services-benchmarks')
  console.log('     Contains: revenue/tech, booking rate, job size, response time benchmarks')
  console.log()
  console.log('  📄 Shopify Commerce Report     → https://www.shopify.com/research/future-of-commerce')
  console.log('     Contains: AOV, CVR, CAC, LTV for ecommerce')
  console.log()
  console.log('  📄 HubSpot State of Marketing  → https://www.hubspot.com/state-of-marketing')
  console.log('     Contains: email open rates, content benchmarks, CRM adoption')
}

main().catch(console.error)
