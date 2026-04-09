import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { validateWebhookSecret, FORBIDDEN } from '@/lib/webhooks/auth'

const MetricPayload = z.object({
  client_id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  leads_captured: z.number().int().default(0),
  leads_qualified: z.number().int().default(0),
  leads_booked: z.number().int().default(0),
  leads_won: z.number().int().default(0),
  leads_lost: z.number().int().default(0),
  avg_response_time_sec: z.number().default(0),
  cost_per_lead: z.number().default(0),
  ad_spend: z.number().default(0),
  ad_revenue: z.number().default(0),
  ad_roas: z.number().default(0),
  reviews_received: z.number().int().default(0),
  reviews_responded: z.number().int().default(0),
  avg_review_score: z.number().min(0).max(5).default(0),
  total_reviews: z.number().int().default(0),
  organic_traffic: z.number().int().default(0),
  keywords_ranking: z.number().int().default(0),
  admin_hours_saved: z.number().default(0),
  workflows_executed: z.number().int().default(0),
  foundation_score: z.number().min(0).max(100).default(0),
  pipeline_value: z.number().default(0),
})

export async function POST(req: NextRequest) {
  if (!validateWebhookSecret(req)) return FORBIDDEN

  const body = await req.json().catch(() => null)
  const parsed = MetricPayload.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('daily_metrics')
    .upsert(parsed.data, { onConflict: 'client_id,date' })

  if (error) {
    console.error('[webhook/metric] upsert failed', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
