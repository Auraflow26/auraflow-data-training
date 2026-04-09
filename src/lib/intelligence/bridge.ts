import Anthropic from '@anthropic-ai/sdk'
import { SupabaseClient } from '@supabase/supabase-js'
import { Lead } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Analyze a new lead and write results to lead_analyses
// Called as background fire-and-forget from the lead webhook
export async function processNewLead(
  supabase: SupabaseClient,
  lead: Partial<Lead> & { id: string; client_id: string }
): Promise<void> {
  try {
    const prompt = `Analyze this incoming lead and return JSON only — no prose, no markdown fences.

Lead data:
- Name: ${lead.lead_name ?? 'Unknown'}
- Source: ${lead.source ?? 'unknown'}
- Service type: ${lead.service_type ?? 'unspecified'}
- Estimated value: $${lead.estimated_value ?? 0}
- Notes: ${lead.notes ?? 'none'}

Return this exact shape:
{
  "intent_score": <0-100 integer>,
  "intent_signals": ["signal 1", "signal 2"],
  "suggested_reply": "<one short paragraph reply to send to this lead>",
  "urgency": "urgent" | "follow-up" | "standard",
  "analysis_summary": "<2-3 sentence summary>"
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const analysis = JSON.parse(text)

    await supabase.from('lead_analyses').upsert(
      {
        client_id: lead.client_id,
        lead_id: lead.id,
        intent_score: analysis.intent_score,
        intent_signals: analysis.intent_signals,
        suggested_reply: analysis.suggested_reply,
        urgency: analysis.urgency,
        analysis_summary: analysis.analysis_summary,
      },
      { onConflict: 'lead_id' }
    )
  } catch {
    // Background job — log but don't throw so the webhook response is unaffected
    console.error('[bridge] processNewLead failed for lead', lead.id)
  }
}
