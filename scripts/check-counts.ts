#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const { data, error } = await db.from('scan_history').select('vertical')
  if (error) { console.log('ERROR:', error.message); process.exit(1) }

  const counts: Record<string, number> = {}
  data?.forEach(r => counts[r.vertical] = (counts[r.vertical] || 0) + 1)

  console.log('TOTAL rows in scan_history:', data?.length)
  console.log('─'.repeat(35))
  Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([v, n]) => {
    const status = n >= 50 ? '✅' : '⚠️ '
    console.log(`${status} ${v.padEnd(20)} ${n}`)
  })
}

main().catch(console.error)
