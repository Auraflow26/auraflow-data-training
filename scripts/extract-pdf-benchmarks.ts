#!/usr/bin/env tsx
/**
 * AuraFlow — PDF Benchmark Extractor
 *
 * Reads a downloaded industry report PDF, extracts benchmark numbers
 * using Claude, maps to our data point IDs, and upserts to Supabase.
 *
 * Usage:
 *   npx tsx scripts/extract-pdf-benchmarks.ts clio-legal-trends-2025.pdf law
 *   npx tsx scripts/extract-pdf-benchmarks.ts toast-report-2025.pdf restaurant
 *   npx tsx scripts/extract-pdf-benchmarks.ts servicetitan-benchmarks.pdf home_services
 *   npx tsx scripts/extract-pdf-benchmarks.ts shopify-commerce-2025.pdf ecommerce
 *   npx tsx scripts/extract-pdf-benchmarks.ts hubspot-marketing-2025.pdf all
 *
 * Download PDFs from:
 *   Clio:        https://www.clio.com/resources/legal-trends/
 *   Toast:       https://pos.toasttab.com/resources/restaurant-success-from-day-one
 *   ServiceTitan:https://www.servicetitan.com/blog/home-services-benchmarks
 *   Shopify:     https://www.shopify.com/research/future-of-commerce
 *   HubSpot:     https://www.hubspot.com/state-of-marketing
 */

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const pdfPath = process.argv[2]
const vertical = process.argv[3] ?? 'all'

if (!pdfPath) {
  console.error('Usage: npx tsx scripts/extract-pdf-benchmarks.ts <pdf-file> <vertical>')
  console.error('Example: npx tsx scripts/extract-pdf-benchmarks.ts clio-2025.pdf law')
  process.exit(1)
}

// ─── EXTRACTION PROMPTS PER SOURCE ────────────────────────────────────────────

const EXTRACTION_PROMPTS: Record<string, string> = {
  law: `Extract benchmark data from this Clio Legal Trends report.
Find and extract: billable hour targets, attorney utilization rates (actual vs target),
collection rates, matter cycle times (days to close), software adoption rates,
client acquisition costs, revenue per attorney, average matter value.
Return as JSON:
{
  "billable_hrs_target_per_day": 8,
  "utilization_rate_actual_pct": 31,
  "utilization_rate_target_pct": 40,
  "collection_rate_pct": 88,
  "matter_cycle_days": 90,
  "software_adoption_pct": 72,
  "revenue_per_attorney": 180000,
  "avg_matter_value": 4500
}`,

  restaurant: `Extract benchmark data from this Toast restaurant industry report.
Find: food cost percentage, labor cost percentage, table turn rate (lunch/dinner),
average check size by category, online ordering percentage, delivery percentage,
profit margin ranges, employee turnover rate, revenue per square foot.
Return as JSON:
{
  "food_cost_pct": 30,
  "labor_cost_pct": 32,
  "table_turns_lunch": 2.1,
  "table_turns_dinner": 1.5,
  "avg_check_casual": 22,
  "online_order_pct": 30,
  "net_margin_pct": 5,
  "annual_turnover_pct": 75
}`,

  home_services: `Extract benchmark data from this ServiceTitan home services report.
Find: revenue per technician, booking rates, average job size by trade,
response time benchmarks, software adoption rates, gross margins,
revenue per employee, close rates.
Return as JSON:
{
  "revenue_per_technician": 220000,
  "booking_rate_pct": 42,
  "avg_job_electrical": 800,
  "avg_job_plumbing": 300,
  "avg_job_hvac": 1200,
  "response_time_benchmark_min": 15,
  "gross_margin_pct": 35,
  "close_rate_pct": 42
}`,

  ecommerce: `Extract benchmark data from this Shopify commerce report.
Find: average order value (AOV), cart abandonment rate, site conversion rate,
customer acquisition cost (CAC), customer lifetime value (LTV), return rates,
repeat purchase rate, email open rates, revenue per session.
Return as JSON:
{
  "avg_order_value": 85,
  "cart_abandonment_pct": 70,
  "site_cvr_pct": 2.1,
  "cac": 45,
  "ltv": 280,
  "return_rate_pct": 20,
  "repeat_purchase_rate_pct": 28,
  "revenue_per_session": 1.80
}`,

  all: `Extract ALL benchmark statistics from this industry report.
Look for any numeric benchmarks: percentages, dollar amounts, time metrics,
conversion rates, satisfaction scores, adoption rates, growth rates.
For each statistic found, note the metric name, value, unit, and which industry/segment it applies to.
Return as JSON array:
[
  {"metric": "email open rate", "value": 21.5, "unit": "%", "segment": "all", "context": "average across industries"},
  {"metric": "CRM adoption", "value": 72, "unit": "%", "segment": "SMB", "context": "businesses using CRM"}
]`,
}

// ─── DATA POINT MAPPER ────────────────────────────────────────────────────────

function mapExtractedToBenchmarks(
  data: unknown,
  vertical: string,
  sourceName: string
): Array<Record<string, unknown>> {
  const rows: Array<Record<string, unknown>> = []
  const obj = data as Record<string, unknown>

  // Mapping: extracted field names → data point IDs
  const fieldMap: Record<string, { id: string; invert?: boolean }> = {
    // Law
    utilization_rate_actual_pct:   { id: 'F08' }, // repeat/utilization rate
    collection_rate_pct:           { id: 'L24' }, // collection = close rate proxy
    matter_cycle_days:             { id: 'O03' }, // operational cycle time
    revenue_per_attorney:          { id: 'F07' }, // rev per employee
    avg_matter_value:              { id: 'F04' }, // avg deal size

    // Restaurant
    food_cost_pct:                 { id: 'F03' }, // margin proxy (inverse)
    net_margin_pct:                { id: 'F03' }, // profit margin
    online_order_pct:              { id: 'F21' }, // revenue from digital
    annual_turnover_pct:           { id: 'P03' }, // employee turnover

    // Home services
    revenue_per_technician:        { id: 'F07' }, // rev per employee
    booking_rate_pct:              { id: 'L23' }, // lead to appt CVR
    close_rate_pct:                { id: 'L24' }, // appt to close
    gross_margin_pct:              { id: 'F03' }, // profit margin
    response_time_benchmark_min:   { id: 'L04' }, // lead response time

    // Ecommerce
    avg_order_value:               { id: 'F04' }, // avg deal size
    cart_abandonment_pct:          { id: 'L22' }, // no-show/abandonment proxy
    site_cvr_pct:                  { id: 'L24' }, // conversion rate
    cac:                           { id: 'L03' }, // cost per lead/acquisition
    repeat_purchase_rate_pct:      { id: 'F08' }, // repeat customer rate
  }

  for (const [field, dp] of Object.entries(fieldMap)) {
    const raw = obj[field]
    if (raw === undefined || raw === null) continue
    const val = Number(raw)
    if (isNaN(val)) continue

    rows.push({
      vertical,
      size_band: 'all',
      data_point_id: dp.id,
      benchmark_p25: +(val * 0.65).toFixed(2),
      benchmark_median: +val.toFixed(2),
      benchmark_p75: +(val * 1.35).toFixed(2),
      benchmark_top10: +(val * 1.85).toFixed(2),
      sample_size: 1,
      source: sourceName,
    })
  }

  return rows
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const absPath = path.resolve(pdfPath)
  if (!fs.existsSync(absPath)) {
    console.error(`❌ File not found: ${absPath}`)
    process.exit(1)
  }

  const sourceName = path.basename(pdfPath, '.pdf')
  console.log('═'.repeat(55))
  console.log('PDF BENCHMARK EXTRACTOR')
  console.log(`File:     ${path.basename(pdfPath)}`)
  console.log(`Vertical: ${vertical}`)
  console.log('═'.repeat(55))

  // Read PDF as base64
  const pdfBytes = fs.readFileSync(absPath)
  const base64 = pdfBytes.toString('base64')

  const prompt = EXTRACTION_PROMPTS[vertical] ?? EXTRACTION_PROMPTS.all

  console.log('\n▶ Sending to Claude for extraction...')

  const msg = await claude.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        },
        {
          type: 'text',
          text: `${prompt}\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no explanation.`,
        },
      ],
    }],
  })

  const text = (msg.content[0] as { type: string; text: string }).text.trim()
  const clean = text.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim()

  let extracted: unknown
  try {
    extracted = JSON.parse(clean)
  } catch {
    console.error('❌ Claude returned non-JSON:')
    console.error(clean.slice(0, 500))
    process.exit(1)
  }

  console.log('✓ Extracted data:')
  console.log(JSON.stringify(extracted, null, 2))

  // Map to benchmark rows
  const rows = mapExtractedToBenchmarks(extracted, vertical, sourceName)
  console.log(`\n✓ Mapped to ${rows.length} benchmark data points`)

  if (!rows.length) {
    console.log('⚠️  No data points mapped. Check field names in EXTRACTION_PROMPTS.')
    process.exit(0)
  }

  // Upsert
  const { error } = await db
    .from('source_benchmarks')
    .upsert(rows, { onConflict: 'vertical,size_band,data_point_id,source' })

  if (error) {
    console.error('❌ Upsert error:', error.message)
  } else {
    console.log(`✅ Upserted ${rows.length} benchmarks to source_benchmarks`)
    console.log('\nRun: npx tsx scripts/scrape-industry-benchmarks.ts')
    console.log('to see threshold update recommendations.')
  }
}

main().catch(console.error)
