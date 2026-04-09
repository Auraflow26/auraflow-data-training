export function validateWebhookSecret(req: Request): boolean {
  const auth = req.headers.get('authorization')
  return !!process.env.WEBHOOK_SECRET && auth === `Bearer ${process.env.WEBHOOK_SECRET}`
}

export const FORBIDDEN = new Response(JSON.stringify({ error: 'Forbidden' }), {
  status: 403,
  headers: { 'Content-Type': 'application/json' },
})
