#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const { data, error } = await db.from('mock_datasets').select('vertical, health_level')
  if (error) { console.log('ERROR:', error.message); process.exit(1) }

  const counts: Record<string, number> = {}
  const byHealth: Record<string, number> = {}
  data?.forEach(r => {
    counts[r.vertical] = (counts[r.vertical] || 0) + 1
    byHealth[r.health_level] = (byHealth[r.health_level] || 0) + 1
  })

  console.log('TOTAL mock_datasets:', data?.length)
  console.log('─'.repeat(35))
  Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([v, n]) => {
    console.log(`  ${v.padEnd(20)} ${n}`)
  })
  console.log('\nBy health level:')
  Object.entries(byHealth).forEach(([h, n]) => console.log(`  ${h.padEnd(16)} ${n}`))
}

main().catch(console.error)
