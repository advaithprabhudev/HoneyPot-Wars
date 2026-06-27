import type { RoundResult } from '@honeypot-wars/shared'
import { VULN_CATEGORIES } from '@honeypot-wars/shared'
import type { RoundSnapshot, WindowStats } from './types.js'
import { WINDOW_SIZE } from './types.js'

export function snapshotFromRound(round: RoundResult): RoundSnapshot {
  return {
    category:   round.finding.category,
    fusedScore: round.fusedScore,
    verdict:    round.verdict,
    isNovel:    round.isNovel,
  }
}

export function appendSnapshot(
  existing: readonly RoundSnapshot[],
  snap: RoundSnapshot,
): readonly RoundSnapshot[] {
  const next = [...existing, snap]
  return next.length > WINDOW_SIZE ? next.slice(next.length - WINDOW_SIZE) : next
}

export function computeStats(snapshots: readonly RoundSnapshot[]): WindowStats {
  const total = snapshots.length
  const novelRounds    = snapshots.filter((s) => s.isNovel).length
  const slippedRounds  = snapshots.filter((s) => s.verdict === 'slipped').length
  const novelSlips     = snapshots.filter((s) => s.isNovel && s.verdict === 'slipped').length

  const catFreq = Object.fromEntries(
    VULN_CATEGORIES.map((c) => [c, 0]),
  ) as Record<string, number>
  for (const s of snapshots) {
    catFreq[s.category] = (catFreq[s.category] ?? 0) + 1
  }

  const scores = snapshots.map((s) => s.fusedScore)
  const meanFusedScore =
    total === 0 ? 0 : scores.reduce((a, b) => a + b, 0) / total
  const variance =
    total === 0
      ? 0
      : scores.reduce((a, b) => a + (b - meanFusedScore) ** 2, 0) / total
  const stdFusedScore = Math.sqrt(variance)

  let recentSlipStreak = 0
  for (let i = snapshots.length - 1; i >= 0; i--) {
    if (snapshots[i].verdict === 'slipped') recentSlipStreak++
    else break
  }

  return {
    snapshots,
    totalRounds: total,
    novelRounds,
    slippedRounds,
    novelSlips,
    categoryFreq: catFreq as Record<(typeof VULN_CATEGORIES)[number], number>,
    meanFusedScore,
    stdFusedScore,
    recentSlipStreak,
  }
}
