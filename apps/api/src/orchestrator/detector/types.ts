import type { VulnCategory, Verdict } from '@honeypot-wars/shared'

export const WINDOW_SIZE = 20
export const MIN_WINDOW = 5

export type RoundSnapshot = {
  readonly category: VulnCategory
  readonly fusedScore: number
  readonly verdict: Verdict
  readonly isNovel: boolean
}

export type WindowStats = {
  readonly snapshots: readonly RoundSnapshot[]
  readonly totalRounds: number
  readonly novelRounds: number
  readonly slippedRounds: number
  readonly novelSlips: number
  readonly categoryFreq: Readonly<Record<VulnCategory, number>>
  readonly meanFusedScore: number
  readonly stdFusedScore: number
  readonly recentSlipStreak: number
}
