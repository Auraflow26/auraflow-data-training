#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'
import { runActorAndGetResults } from '../src/lib/scraping/apify-client'
import { aggregateBenchmarks } from '../src/lib/scraping/benchmark-aggregator'
import type { ApifyGoogleMapsResult, Vertical } from '../src/lib/types'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const TOPUPS: Array<{ vertical: Vertical; queries: string[]; location: string }> = [
  { vertical: 'fitness',       queries: ['yoga studio', 'pilates studio'],                      location: 'Houston TX' },
  { vertical: 'insurance',     queries: ['life insurance agent', 'commercial insurance broker'], location: 'Chicago IL' },
  { vertical: 'manufacturing', queries: ['injection molding company', 'precision machining'],    location: 'Detroit MI' },
]

async function main() {
  for (const cfg of TOPUPS) {
    console.log('▶', cfg.vertical)
    try {
      const results = await runActorAndGetResults<ApifyGoogleMapsResult>('compass~crawler-google-places', {
        searchStringsArray: cfg.queries.map(q => `${q} ${cfg.location}`),
        maxCrawledPlacesPerSearch: 25, language: 'en', maxReviews: 0,
        includeWebResults: false, includeOpeningHours: false,
        includeHistogram: false, includePeopleAlsoSearch: false,
        maxImages: 0, scrapeDirectories: false, deeperCityScrape: false,
      }, { memoryMbytes: 512, maxWaitMs: 300_000 })

      const filtered = results.filter(r => r.website && r.reviewsCount >= 5 && r.totalScore > 0).slice(0, 20)
      if (!filtered.length) { console.log('  No results'); continue }

      const { error } = await db.from('scan_history').insert(filtered.map(r => ({
        business_name: r.title, vertical: cfg.vertical,
        website_url: r.website || null,
        location: [r.city, r.state].filter(Boolean).join(', '),
        google_rating: r.totalScore, google_review_count: r.reviewsCount,
        google_categories: r.categoryName, scan_data: {},
      })))
      if (error) { console.log('  ❌', error.message); continue }
      console.log(`  ✓ Added ${filtered.length}`)
      await aggregateBenchmarks(cfg.vertical)
    } catch (e) { console.log('  ❌', e instanceof Error ? e.message : e) }
  }

  // Final count
  const { data } = await db.from('scan_history').select('vertical')
  const counts: Record<string, number> = {}
  data?.forEach(r => counts[r.vertical] = (counts[r.vertical] || 0) + 1)
  const all = ['home_services','restaurant','agency','real_estate','ecommerce','healthcare','saas','construction','law','accounting','fitness','insurance','logistics','manufacturing','education']
  console.log('\nFINAL COUNTS')
  console.log('─'.repeat(35))
  all.forEach(v => console.log((counts[v] >= 50 ? '✅' : '⚠️ ') + ' ' + v.padEnd(20) + counts[v] || 0))
  console.log('TOTAL:', data?.length)
}

main().catch(console.error)
