import { describe, it, expect } from 'vitest'
import { createLocalDetector } from './detectorAgent.js'
import { appendSnapshot, computeStats } from './window.js'
import {
  detectEvasion,
  detectGapProbe,
  detectCategoryFocus,
  detectBoundaryProbe,
  detectSlipStreak,
} from './patterns.js'
import type { RoundSnapshot } from './types.js'
import type { RoundResult } from '@honeypot-wars/shared'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSnap(overrides: Partial<RoundSnapshot> = {}): RoundSnapshot {
  return {
    category:   'hardcoded_secret',
    fusedScore: 0.5,
    verdict:    'caught',
    isNovel:    true,
    ...overrides,
  }
}

function makeRound(overrides: Partial<RoundResult> = {}): RoundResult {
  return {
    id:      '1-abcd1234',
    seed:    1,
    engine:  'local',
    finding: {
      category:        'hardcoded_secret',
      params: {
        entropy: 0.9, scopeExposure: 0.8, ageInDays: 0.7, rotationRisk: 0.9,
        inputSurface: 0.3, sinkDanger: 0.3, sanitiserPresence: 0.3, reachability: 0.3,
        exposureLevel: 0.3, bypassEase: 0.3, defaultness: 0.3, documentedRisk: 0.3,
        cvssScore: 0.3, transitivity: 0.3, exploitMaturity: 0.3, updateAvailable: 0.3,
      },
      fingerprintHash: 'a'.repeat(64),
      location:        { file: 'src/index.ts', line: 10 },
      severity:        'critical',
    },
    verdicts:   [],
    fusedScore: 0.5,
    verdict:    'caught',
    isNovel:    true,
    reason:     'test',
    createdAt:  new Date(),
    ...overrides,
  }
}

function buildStats(snaps: RoundSnapshot[]) {
  return computeStats(snaps)
}

// ── window ────────────────────────────────────────────────────────────────────

describe('window — appendSnapshot', () => {
  it('returns new array without mutating existing', () => {
    const original: readonly RoundSnapshot[] = [makeSnap()]
    const next = appendSnapshot(original, makeSnap())
    expect(next).not.toBe(original)
    expect(original).toHaveLength(1)
    expect(next).toHaveLength(2)
  })

  it('caps at WINDOW_SIZE (20)', () => {
    let snaps: readonly RoundSnapshot[] = []
    for (let i = 0; i < 25; i++) snaps = appendSnapshot(snaps, makeSnap())
    expect(snaps).toHaveLength(20)
  })
})

describe('window — computeStats', () => {
  it('returns zeros for empty snapshot list', () => {
    const stats = buildStats([])
    expect(stats.totalRounds).toBe(0)
    expect(stats.meanFusedScore).toBe(0)
    expect(stats.recentSlipStreak).toBe(0)
  })

  it('counts slips correctly', () => {
    const snaps = [
      makeSnap({ verdict: 'slipped' }),
      makeSnap({ verdict: 'caught' }),
      makeSnap({ verdict: 'slipped' }),
    ]
    const stats = buildStats(snaps)
    expect(stats.slippedRounds).toBe(2)
    expect(stats.totalRounds).toBe(3)
  })

  it('tracks consecutive slip streak from tail', () => {
    const snaps = [
      makeSnap({ verdict: 'caught' }),
      makeSnap({ verdict: 'slipped' }),
      makeSnap({ verdict: 'slipped' }),
      makeSnap({ verdict: 'slipped' }),
    ]
    expect(buildStats(snaps).recentSlipStreak).toBe(3)
  })

  it('resets streak when catch appears at tail', () => {
    const snaps = [
      makeSnap({ verdict: 'slipped' }),
      makeSnap({ verdict: 'slipped' }),
      makeSnap({ verdict: 'caught' }),
    ]
    expect(buildStats(snaps).recentSlipStreak).toBe(0)
  })

  it('computes categoryFreq correctly', () => {
    const snaps = [
      makeSnap({ category: 'hardcoded_secret' }),
      makeSnap({ category: 'hardcoded_secret' }),
      makeSnap({ category: 'injection_vector' }),
    ]
    const stats = buildStats(snaps)
    expect(stats.categoryFreq['hardcoded_secret']).toBe(2)
    expect(stats.categoryFreq['injection_vector']).toBe(1)
  })
})

// ── patterns ──────────────────────────────────────────────────────────────────

describe('detectEvasion', () => {
  it('returns null when window too small', () => {
    const snaps = Array.from({ length: 4 }, () => makeSnap({ verdict: 'slipped', fusedScore: 0.22 }))
    expect(detectEvasion(buildStats(snaps))).toBeNull()
  })

  it('detects evasion when slip rate high and mean below threshold', () => {
    const snaps = Array.from({ length: 10 }, () =>
      makeSnap({ verdict: 'slipped', fusedScore: 0.22 }),
    )
    const alert = detectEvasion(buildStats(snaps))
    expect(alert).not.toBeNull()
    expect(alert?.pattern).toBe('evasion')
    expect(alert?.confidence).toBeGreaterThan(0)
    expect(alert?.confidence).toBeLessThanOrEqual(1)
    expect(alert?.evidence.length).toBeLessThanOrEqual(160)
  })

  it('returns null when slip rate below 0.6', () => {
    const snaps = [
      ...Array.from({ length: 5 }, () => makeSnap({ verdict: 'caught', fusedScore: 0.5 })),
      ...Array.from({ length: 5 }, () => makeSnap({ verdict: 'slipped', fusedScore: 0.22 })),
    ]
    expect(detectEvasion(buildStats(snaps))).toBeNull()
  })
})

describe('detectGapProbe', () => {
  it('returns null when window too small', () => {
    const snaps = Array.from({ length: 4 }, () => makeSnap({ isNovel: true, verdict: 'slipped' }))
    expect(detectGapProbe(buildStats(snaps))).toBeNull()
  })

  it('detects gap probe when novel rate and novel slip rate are high', () => {
    const snaps = Array.from({ length: 10 }, () =>
      makeSnap({ isNovel: true, verdict: 'slipped', fusedScore: 0.2 }),
    )
    const alert = detectGapProbe(buildStats(snaps))
    expect(alert).not.toBeNull()
    expect(alert?.pattern).toBe('gap_probe')
  })

  it('returns null when novelSlipRate below 0.5', () => {
    const snaps = [
      ...Array.from({ length: 8 }, () => makeSnap({ isNovel: true, verdict: 'caught' })),
      ...Array.from({ length: 2 }, () => makeSnap({ isNovel: false, verdict: 'caught' })),
    ]
    expect(detectGapProbe(buildStats(snaps))).toBeNull()
  })
})

describe('detectCategoryFocus', () => {
  it('detects when one category dominates', () => {
    const snaps = [
      ...Array.from({ length: 8 }, () => makeSnap({ category: 'injection_vector', verdict: 'slipped' })),
      makeSnap({ category: 'hardcoded_secret' }),
      makeSnap({ category: 'insecure_config' }),
    ]
    const alert = detectCategoryFocus(buildStats(snaps))
    expect(alert).not.toBeNull()
    expect(alert?.pattern).toBe('category_focus')
    expect(alert?.evidence).toContain('injection_vector')
  })

  it('returns null when no category exceeds 60%', () => {
    const snaps = [
      ...Array.from({ length: 3 }, () => makeSnap({ category: 'injection_vector' })),
      ...Array.from({ length: 3 }, () => makeSnap({ category: 'hardcoded_secret' })),
      ...Array.from({ length: 2 }, () => makeSnap({ category: 'insecure_config' })),
      ...Array.from({ length: 2 }, () => makeSnap({ category: 'vulnerable_dependency' })),
    ]
    expect(detectCategoryFocus(buildStats(snaps))).toBeNull()
  })
})

describe('detectBoundaryProbe', () => {
  it('detects tight clustering near threshold', () => {
    const scores = [0.29, 0.30, 0.31, 0.32, 0.30, 0.29, 0.31, 0.32, 0.30, 0.29]
    const snaps  = scores.map((s) => makeSnap({ fusedScore: s }))
    const alert  = detectBoundaryProbe(buildStats(snaps))
    expect(alert).not.toBeNull()
    expect(alert?.pattern).toBe('boundary_probe')
  })

  it('returns null when std is high', () => {
    const snaps = Array.from({ length: 10 }, (_, i) => makeSnap({ fusedScore: i * 0.1 }))
    expect(detectBoundaryProbe(buildStats(snaps))).toBeNull()
  })
})

describe('detectSlipStreak', () => {
  it('detects streak of 5 or more consecutive slips', () => {
    const snaps = [
      makeSnap({ verdict: 'caught' }),
      ...Array.from({ length: 5 }, () => makeSnap({ verdict: 'slipped' })),
    ]
    const alert = detectSlipStreak(buildStats(snaps))
    expect(alert).not.toBeNull()
    expect(alert?.pattern).toBe('slip_streak')
    expect(alert?.confidence).toBeGreaterThanOrEqual(0.5)
  })

  it('returns null for streak of 4', () => {
    const snaps = [
      makeSnap({ verdict: 'caught' }),
      ...Array.from({ length: 4 }, () => makeSnap({ verdict: 'slipped' })),
    ]
    expect(detectSlipStreak(buildStats(snaps))).toBeNull()
  })
})

// ── detectorAgent — local path ────────────────────────────────────────────────

describe('createLocalDetector', () => {
  it('returns empty array for the first few rounds (below MIN_WINDOW)', async () => {
    const detector = createLocalDetector()
    const result = await detector.observe(makeRound({ verdict: 'slipped', fusedScore: 0.2 }))
    expect(result).toEqual([])
  })

  it('emits slip_streak alert after 5+ consecutive slips', async () => {
    const detector = createLocalDetector()
    let lastAlerts: readonly import('@honeypot-wars/shared').DetectorAlert[] = []

    for (let i = 0; i < 6; i++) {
      lastAlerts = await detector.observe(makeRound({
        seed:       i,
        verdict:    'slipped',
        fusedScore: 0.2,
        isNovel:    true,
      }))
    }

    const streakAlert = lastAlerts.find((a) => a.pattern === 'slip_streak')
    expect(streakAlert).toBeDefined()
    expect(streakAlert?.evidence).toContain('consecutive slips')
  })

  it('evidence strings never exceed 160 characters', async () => {
    const detector = createLocalDetector()
    for (let i = 0; i < 15; i++) {
      const alerts = await detector.observe(makeRound({
        seed:       i,
        verdict:    'slipped',
        fusedScore: 0.22,
        isNovel:    true,
      }))
      for (const a of alerts) {
        expect(a.evidence.length).toBeLessThanOrEqual(160)
      }
    }
  })

  it('all alert confidences are in [0, 1]', async () => {
    const detector = createLocalDetector()
    for (let i = 0; i < 20; i++) {
      const alerts = await detector.observe(makeRound({
        seed:       i,
        verdict:    i % 3 === 0 ? 'caught' : 'slipped',
        fusedScore: 0.15 + (i % 5) * 0.04,
        isNovel:    i % 4 !== 0,
      }))
      for (const a of alerts) {
        expect(a.confidence).toBeGreaterThanOrEqual(0)
        expect(a.confidence).toBeLessThanOrEqual(1)
      }
    }
  })

  it('detector state is independent between instances', async () => {
    const d1 = createLocalDetector()
    const d2 = createLocalDetector()

    for (let i = 0; i < 6; i++) {
      await d1.observe(makeRound({ seed: i, verdict: 'slipped', fusedScore: 0.2 }))
    }

    // d2 has seen nothing — should not emit slip_streak
    const d2Alerts = await d2.observe(makeRound({ verdict: 'caught' }))
    expect(d2Alerts.find((a) => a.pattern === 'slip_streak')).toBeUndefined()
  })
})
