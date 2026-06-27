import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { RoundResult } from '@honeypot-wars/shared'
import { env } from '../config/env.js'

function createSupabase(): SupabaseClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for arena game persistence')
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
}

// Lazy singleton — only initialised when arena endpoints are called
let _client: SupabaseClient | null = null
function getClient(): SupabaseClient {
  if (!_client) _client = createSupabase()
  return _client
}

// Proxy so callers use `supabase.from(...)` as before, init is deferred
export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

// ── Round persistence ────────────────────────────────────────────────────────

export async function insertRound(round: RoundResult): Promise<void> {
  const { error } = await supabase.from('rounds').insert({
    seed:             round.seed,
    engine:           round.engine,
    category:         round.finding.category,
    params:           round.finding.params,
    fingerprint_hash: round.finding.fingerprintHash,
    severity:         round.finding.severity,
    verdicts:         round.verdicts,
    fused_score:      round.fusedScore,
    verdict:          round.verdict,
    is_novel:         round.isNovel,
    reason:           round.reason,
    // created_at is set by Postgres DEFAULT NOW()
  })
  if (error) throw new Error(`supabase insertRound: ${error.message}`)
}

export async function fingerprintHashExists(hash: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('rounds')
    .select('id', { count: 'exact', head: true })
    .eq('fingerprint_hash', hash)
  if (error) throw new Error(`supabase fingerprintHashExists: ${error.message}`)
  return (count ?? 0) > 0
}

export async function getRecentRounds(limit: number, novelOnly: boolean): Promise<unknown[]> {
  let query = supabase
    .from('rounds')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (novelOnly) query = query.eq('is_novel', true)
  const { data, error } = await query
  if (error) throw new Error(`supabase getRecentRounds: ${error.message}`)
  return data ?? []
}

export async function getGapCoverageRate(windowDays: number): Promise<{
  gapCoverageRate: number
  totalRounds: number
  novelSlips: number
}> {
  const since = new Date(Date.now() - windowDays * 86_400_000).toISOString()

  const { data, error } = await supabase
    .from('rounds')
    .select('verdict, is_novel')
    .eq('is_novel', true)
    .gte('created_at', since)

  if (error) throw new Error(`supabase getGapCoverageRate: ${error.message}`)

  const rows = data ?? []
  const totalRounds = rows.length
  const novelSlips = rows.filter((r: { verdict: string }) => r.verdict === 'slipped').length
  const caught = totalRounds - novelSlips
  const gapCoverageRate = totalRounds === 0 ? 0 : caught / totalRounds

  return { gapCoverageRate, totalRounds, novelSlips }
}
