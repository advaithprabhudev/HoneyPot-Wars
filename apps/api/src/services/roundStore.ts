import type { ArenaMetric } from '@honeypot-wars/shared'
import { getGapCoverageRate } from '../lib/supabase.js'

// In-memory set for local-engine novelty tracking.
// Production uses Supabase (fingerprintHashExists) as the durable source of truth.
const seenHashes = new Set<string>()

export function markHashSeen(hash: string): void {
  seenHashes.add(hash)
}

export function isHashSeen(hash: string): boolean {
  return seenHashes.has(hash)
}

export function clearSeenHashes(): void {
  seenHashes.clear()
}

/**
 * Returns the leaderboard metric for the given window.
 * gapCoverageRate = caught / total over isNovel===true rounds ONLY.
 * The Referee does NOT compute this — roundStore does.
 */
export async function computeLeaderboard(windowDays: number): Promise<ArenaMetric> {
  return getGapCoverageRate(windowDays)
}
