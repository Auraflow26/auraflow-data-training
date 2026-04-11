#!/usr/bin/env tsx
/**
 * AuraFlow — Top-up scraper
 * Fills verticals that are under 50 businesses using alternate queries + locations.
 */

import { createClient } from '@supabase/supabase-js'
import { runActorAndGetResults } from '../src/lib/scraping/apify-client'
import type { ApifyGoogleMapsResult, Vertical } from '../src/lib/types'
import { aggregateBenchmarks } from '../src/lib/scraping/benchmark-aggregator'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TOPUPS: Array<{ vertical: Vertical; queries: string[]; location: string }> = [
  { vertical: 'ecommerce',     queries: ['boutique clothing store', 'online retail shop'],      location: 'Los Angeles CA' },
  { vertical: 'healthcare',    queries: ['chiropractor', 'physical therapy clinic'],            location: 'Dallas TX' },
  { vertical: 'saas',          queries: ['software company', 'app development company'],        location: 'Boston MA' },
  { vertical: 'construction',  queries: ['roofing contractor', 'remodeling contractor'],        location: 'Phoenix AZ' },
  { vertical: 'law',           queries: ['personal injury attorney', 'family law attorney'],    location: 'Miami FL' },
  { vertical: 'accounting',    queries: ['tax preparation service', 'financial advisor'],       location: 'Atlanta GA' },
  { vertical: 'fitness',       queries: ['personal trainer', 'crossfit gym', 'boxing gym'],     location: 'Miami FL' },
  { vertical: 'insurance',     queries: ['auto insurance agency', 'health insurance broker'],   location: 'Dallas TX' },
  { vertical: 'manufacturing', queries: ['metal fabrication', 'custom manufacturing'],          location: 'Chicago IL' },
]

async function main() {
  console.log('═'.repeat(50))
  console.log('AURAFLOW — VERTICAL TOP-UP SCRAPER')
  console.log('═'.repeat(50))

  for (const cfg of TOPUPS) {
    console.log(`\n▶ Topping up ${cfg.vertical}...`)
    try {
      const input = {
        searchStringsArray: cfg.queries.map(q => `${q} ${cfg.location}`),
        maxCrawledPlacesPerSearch: 30,
        language: 'en',
        maxReviews: 0,
        includeWebResults: false,
        includeOpeningHours: false,
        includeHistogram: false,
        includePeopleAlsoSearch: false,
        maxImages: 0,
        scrapeDirectories: false,
        deeperCityScrape: false,
      }

      const results = await runActorAndGetResults<ApifyGoogleMapsResult>(
        'compass~crawler-google-places', input, { memoryMbytes: 512, maxWaitMs: 300_000 }
      )

      const filtered = results
        .filter(r => r.website && r.reviewsCount >= 5 && r.totalScore > 0)
        .slice(0, 25)

      if (filtered.length === 0) { console.log('  No results'); continue }

      const rows = filtered.map(r => ({
        business_name: r.title,
        vertical: cfg.vertical,
        website_url: r.website || null,
        location: [r.city, r.state].filter(Boolean).join(', '),
        google_rating: r.totalScore,
        google_review_count: r.reviewsCount,
        google_categories: r.categoryName,
        scan_data: {},
      }))

      const { error } = await db.from('scan_history').insert(rows)
      if (error) { console.log('  ❌ Insert error:', error.message); continue }

      console.log(`  ✓ Added ${rows.length} businesses`)

      // Re-aggregate benchmarks with new data
      await aggregateBenchmarks(cfg.vertical)

    } catch (e) {
      console.log('  ❌', e instanceof Error ? e.message : e)
    }
  }

  // Final count report
  const { data } = await db.from('scan_history').select('vertical')
  const counts: Record<string, number> = {}
  data?.forEach(r => counts[r.vertical] = (counts[r.vertical] || 0) + 1)

  console.log('\n═'.repeat(50))
  console.log('FINAL COUNTS')
  console.log('─'.repeat(40))
  const all = ['home_services','restaurant','agency','real_estate','ecommerce','healthcare','saas','construction','law','accounting','fitness','insurance','logistics','manufacturing','education']
  all.forEach(v => {
    const n = counts[v] || 0
    const status = n >= 50 ? '✅' : '⚠️ '
    console.log(`${status} ${v.padEnd(20)} ${n}`)
  })
  console.log('─'.repeat(40))
  console.log(`TOTAL: ${data?.length}`)
}

main().catch(console.error)
