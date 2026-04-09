import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { validateWebhookSecret, FORBIDDEN } from '@/lib/webhooks/auth'

const AgentPayload = z.object({
  client_id: z.string(),
  agent_name: z.enum(['cyrus', 'maven', 'orion', 'atlas', 'apex', 'nova']),
  action: z.string(),
  details: z.string().nullable().optional(),
  category: z.enum(['lead', 'ad', 'review', 'seo', 'workflow', 'system', 'financial']),
  status: z.enum(['completed', 'pending_approval', 'failed', 'in_progress']).default('completed'),
  requires_approval: z.boolean().default(false),
  metadata: z.record(z.unknown()).default({}),
})

export async function POST(req: NextRequest) {
  if (!validateWebhookSecret(req)) return FORBIDDEN

  const body = await req.json().catch(() => null)
  const parsed = AgentPayload.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const { data: row, error } = await supabaseAdmin
    .from('agent_activity')
    .insert(parsed.data)
    .select('id')
    .single()

  if (error) {
    console.error('[webhook/agent] insert failed', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ success: true, id: row.id })
}
