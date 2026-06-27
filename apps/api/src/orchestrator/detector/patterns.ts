import type { DetectorAlert, AttackPattern } from '@honeypot-wars/shared'
import { CATCH_THRESHOLD } from '@honeypot-wars/shared'
import type { WindowStats } from './types.js'
import { MIN_WINDOW } from './types.js'

const MIN_STREAK = 5

function makeAlert(
  pattern: AttackPattern,
  confidence: number,
  evidence: string,
  stats: WindowStats,
): DetectorAlert {
  const slipRate = stats.totalRounds === 0 ? 0 : stats.slippedRounds / stats.totalRounds
  return {
    pattern,
    confidence: Math.max(0, Math.min(1, confidence)),
    evidence: evidence.slice(0, 160),
    windowRounds: stats.totalRounds,
    slipRate,
    createdAt: new Date(),
  }
}

// Attacker tuning params to hover just below CATCH_THRESHOLD.
// Signal: high slip rate + mean fusedScore sitting in danger zone below threshold.
export function detectEvasion(stats: WindowStats): DetectorAlert | null {
  if (stats.totalRounds < MIN_WINDOW) return null

  const slipRate = stats.slippedRounds / stats.totalRounds
  const { meanFusedScore, stdFusedScore } = stats

  if (slipRate < 0.6) return null
  if (meanFusedScore < 0.12 || meanFusedScore >= CATCH_THRESHOLD) return null

  // Lower std → more intentional evasion (attacker has found a sweet spot)
  const precisionBonus = Math.max(0, 1 - stdFusedScore / 0.15)
  const confidence = slipRate * 0.55 + precisionBonus * 0.45

  return makeAlert(
    'evasion',
    confidence,
    `slip rate ${(slipRate * 100).toFixed(0)}%, mean fused ${meanFusedScore.toFixed(3)} below threshold ${CATCH_THRESHOLD}`,
    stats,
  )
}

// Attacker exploring novel parameter space at high rate to find detection gaps.
// Signal: novel rate high AND novel slip rate high (new combos are evading defenders).
export function detectGapProbe(stats: WindowStats): DetectorAlert | null {
  if (stats.totalRounds < MIN_WINDOW) return null

  const novelRate     = stats.novelRounds / stats.totalRounds
  const novelSlipRate = stats.novelRounds === 0 ? 0 : stats.novelSlips / stats.novelRounds

  if (novelRate < 0.7) return null
  if (novelSlipRate < 0.5) return null

  const confidence = novelRate * 0.5 + novelSlipRate * 0.5

  return makeAlert(
    'gap_probe',
    confidence,
    `novel rate ${(novelRate * 100).toFixed(0)}%, ${stats.novelSlips}/${stats.novelRounds} novel rounds slipped`,
    stats,
  )
}

// Attacker repeatedly targeting one category where defenders score low.
// Signal: single category dominating >60% of rounds.
export function detectCategoryFocus(stats: WindowStats): DetectorAlert | null {
  if (stats.totalRounds < MIN_WINDOW) return null

  let topCategory: string | null = null
  let topCount = 0

  for (const [cat, count] of Object.entries(stats.categoryFreq)) {
    if (count > topCount) {
      topCount = count
      topCategory = cat
    }
  }

  if (!topCategory) return null

  const focusRate = topCount / stats.totalRounds
  if (focusRate < 0.6) return null

  const slipRate   = stats.slippedRounds / stats.totalRounds
  const confidence = focusRate * 0.65 + slipRate * 0.35

  return makeAlert(
    'category_focus',
    confidence,
    `${topCategory} in ${(focusRate * 100).toFixed(0)}% of ${stats.totalRounds} rounds`,
    stats,
  )
}

// Attacker has found a parameter cluster near the catch boundary.
// Signal: very low fusedScore variance AND mean near CATCH_THRESHOLD.
export function detectBoundaryProbe(stats: WindowStats): DetectorAlert | null {
  if (stats.totalRounds < MIN_WINDOW) return null

  const { meanFusedScore, stdFusedScore } = stats
  const distFromThreshold = Math.abs(meanFusedScore - CATCH_THRESHOLD)

  if (stdFusedScore >= 0.06) return null
  if (distFromThreshold >= 0.12) return null

  const tightness  = Math.max(0, 1 - stdFusedScore / 0.06)
  const proximity  = Math.max(0, 1 - distFromThreshold / 0.12)
  const confidence = tightness * 0.6 + proximity * 0.4

  return makeAlert(
    'boundary_probe',
    confidence,
    `fused mean ${meanFusedScore.toFixed(3)} ± ${stdFusedScore.toFixed(3)} clustering near threshold ${CATCH_THRESHOLD}`,
    stats,
  )
}

// Unusual run of consecutive slips from the tail of the observation window.
export function detectSlipStreak(stats: WindowStats): DetectorAlert | null {
  if (stats.recentSlipStreak < MIN_STREAK) return null

  const extraSlips = stats.recentSlipStreak - MIN_STREAK
  const confidence = Math.min(1, 0.5 + extraSlips * 0.05)

  return makeAlert(
    'slip_streak',
    confidence,
    `${stats.recentSlipStreak} consecutive slips detected in last ${stats.totalRounds} rounds`,
    stats,
  )
}

export function runLocalPatterns(stats: WindowStats): readonly DetectorAlert[] {
  return [
    detectEvasion(stats),
    detectGapProbe(stats),
    detectCategoryFocus(stats),
    detectBoundaryProbe(stats),
    detectSlipStreak(stats),
  ].filter((a): a is DetectorAlert => a !== null)
}
