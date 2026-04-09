import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { validateWebhookSecret, FORBIDDEN } from '@/lib/webhooks/auth'
import { processNewLead } from '@/lib/intelligence/bridge'

const LeadPayload = z.object({
  client_id: z.string(),
  lead_name: z.string(),
  lead_email: z.string().email().nullable().optional(),
  lead_phone: z.string().nullable().optional(),
  lead_location: z.string().nullable().optional(),
  source: z.enum(['google_ads', 'meta', 'angi', 'yelp', 'organic', 'referral', 'direct', 'lsa', 'thumbtack']),
  service_type: z.string().default(''),
  estimated_value: z.number().default(0),
  lead_score: z.number().min(0).max(100).default(50),
  notes: z.string().nullable().optional(),
})

export async function POST(req: NextRequest) {
  if (!validateWebhookSecret(req)) return FORBIDDEN

  const body = await req.json().catch(() => null)
  const parsed = LeadPayload.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  const { data: lead, error } = await supabaseAdmin
    .from('lead_interactions')
    .upsert(
      {
        ...data,
        status: 'new',
        follow_up_stage: 0,
        follow_up_history: [],
      },
      { onConflict: 'client_id,lead_email', ignoreDuplicates: false }
    )
    .select('id, client_id, lead_name, source, service_type, estimated_value, notes')
    .single()

  if (error) {
    console.error('[webhook/lead] upsert failed', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  // Background: analyze intent — don't await, don't block response
  void processNewLead(supabaseAdmin, lead)

  return NextResponse.json({ success: true, id: lead.id })
}
