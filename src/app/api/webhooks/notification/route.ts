import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { validateWebhookSecret, FORBIDDEN } from '@/lib/webhooks/auth'

const NotificationPayload = z.object({
  client_id: z.string(),
  type: z.enum(['lead_new', 'lead_hot', 'review_new', 'review_negative', 'agent_action', 'advisor_message', 'report_ready', 'system_alert']),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  title: z.string(),
  body: z.string().nullable().optional(),
  action_url: z.string().nullable().optional(),
})

export async function POST(req: NextRequest) {
  if (!validateWebhookSecret(req)) return FORBIDDEN

  const body = await req.json().catch(() => null)
  const parsed = NotificationPayload.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const { data: row, error } = await supabaseAdmin
    .from('notifications')
    .insert({ ...parsed.data, read: false })
    .select('id')
    .single()

  if (error) {
    console.error('[webhook/notification] insert failed', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ success: true, id: row.id })
}
