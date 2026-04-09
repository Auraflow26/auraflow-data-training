/**
 * AuraFlow — Apify API Client
 * Typed wrapper around Apify REST API for scraping actors.
 * Uses raw fetch (no apify-client SDK) for simplicity + full control.
 */

const APIFY_BASE = 'https://api.apify.com/v2'

function apifyToken(): string {
  const token = process.env.APIFY_API_TOKEN
  if (!token) throw new Error('APIFY_API_TOKEN is not set in environment')
  return token
}

function apifyHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apifyToken()}`,
  }
}

// ─── Run Management ───────────────────────────────────────────────────────────

export interface ApifyRun {
  id: string
  actId: string
  status: 'READY' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED-OUT' | 'ABORTED'
  defaultDatasetId: string
  startedAt: string
  finishedAt: string | null
}

/**
 * Start an Apify actor run with the given input.
 * Returns the run object containing runId and datasetId.
 */
export async function startActorRun(
  actorId: string,
  input: Record<string, unknown>,
  memoryMbytes = 256
): Promise<ApifyRun> {
  const url = `${APIFY_BASE}/acts/${actorId}/runs?memory=${memoryMbytes}`
  const res = await fetch(url, {
    method: 'POST',
    headers: apifyHeaders(),
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Apify startRun failed (${res.status}): ${err}`)
  }

  const json = await res.json()
  return json.data as ApifyRun
}

/**
 * Poll an actor run until it reaches a terminal status.
 * Polls every `intervalMs` ms, times out after `maxWaitMs`.
 */
export async function pollRunUntilDone(
  runId: string,
  intervalMs = 10_000,
  maxWaitMs = 600_000
): Promise<ApifyRun> {
  const deadline = Date.now() + maxWaitMs

  while (Date.now() < deadline) {
    const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}`, {
      headers: apifyHeaders(),
    })

    if (!res.ok) throw new Error(`Apify pollRun failed (${res.status})`)

    const json = await res.json()
    const run = json.data as ApifyRun

    if (['SUCCEEDED', 'FAILED', 'TIMED-OUT', 'ABORTED'].includes(run.status)) {
      return run
    }

    await sleep(intervalMs)
  }

  throw new Error(`Apify run ${runId} did not complete within ${maxWaitMs / 1000}s`)
}

/**
 * Fetch all items from an Apify dataset.
 */
export async function getDatasetItems<T = Record<string, unknown>>(
  datasetId: string,
  limit = 200
): Promise<T[]> {
  const url = `${APIFY_BASE}/datasets/${datasetId}/items?limit=${limit}&clean=true`
  const res = await fetch(url, { headers: apifyHeaders() })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Apify getDataset failed (${res.status}): ${err}`)
  }

  const items = await res.json()
  return Array.isArray(items) ? items : []
}

/**
 * Convenience: start a run, wait for it, return all dataset items.
 */
export async function runActorAndGetResults<T = Record<string, unknown>>(
  actorId: string,
  input: Record<string, unknown>,
  options: { memoryMbytes?: number; maxWaitMs?: number; intervalMs?: number } = {}
): Promise<T[]> {
  const run = await startActorRun(actorId, input, options.memoryMbytes ?? 256)
  const completed = await pollRunUntilDone(
    run.id,
    options.intervalMs ?? 10_000,
    options.maxWaitMs ?? 600_000
  )

  if (completed.status !== 'SUCCEEDED') {
    throw new Error(`Apify actor ${actorId} run ${run.id} ended with status: ${completed.status}`)
  }

  return getDatasetItems<T>(completed.defaultDatasetId)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
