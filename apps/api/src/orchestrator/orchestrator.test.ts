import { describe, it, expect } from 'vitest'
import { createLocalEngine } from './engines/local.js'
import { VULN_CATEGORIES } from '@honeypot-wars/shared'

function makeEngine() {
  const seen = new Set<string>()
  return {
    engine: createLocalEngine((h) => seen.has(h)),
    seen,
  }
}

describe('local engine — determinism', () => {
  it('same seed yields identical RoundResult', async () => {
    const { engine: e1 } = makeEngine()
    const { engine: e2 } = makeEngine()
    const r1 = await e1.runRound({ seed: 42 })
    const r2 = await e2.runRound({ seed: 42 })
    expect(r1.id).toBe(r2.id)
    expect(r1.finding.fingerprintHash).toBe(r2.finding.fingerprintHash)
    expect(r1.finding.category).toBe(r2.finding.category)
    expect(r1.fusedScore).toBe(r2.fusedScore)
    expect(r1.verdict).toBe(r2.verdict)
    expect(r1.verdicts.map((v) => v.confidence)).toEqual(r2.verdicts.map((v) => v.confidence))
  })

  it('different seeds produce different findings', async () => {
    const { engine } = makeEngine()
    const r1 = await engine.runRound({ seed: 1 })
    const r2 = await engine.runRound({ seed: 2 })
    expect(r1.finding.fingerprintHash).not.toBe(r2.finding.fingerprintHash)
  })
})

describe('local engine — category coverage', () => {
  it('all four VulnCategories appear across 20 seeded rounds', async () => {
    const seen = new Set<string>()
    const engine = createLocalEngine((h) => seen.has(h))
    const categories = new Set<string>()
    for (let s = 1; s <= 20; s++) {
      const r = await engine.runRound({ seed: s * 7 })
      categories.add(r.finding.category)
      seen.add(r.finding.fingerprintHash)
    }
    for (const cat of VULN_CATEGORIES) {
      expect(categories.has(cat), `category ${cat} not seen in 20 rounds`).toBe(true)
    }
  })
})

describe('local engine — novelty', () => {
  it('isNovel flips to false on repeated fingerprintHash', async () => {
    const seen = new Set<string>()
    const engine = createLocalEngine((h) => seen.has(h))

    const first = await engine.runRound({ seed: 99 })
    expect(first.isNovel).toBe(true)
    seen.add(first.finding.fingerprintHash)

    const repeat = await engine.runRound({ seed: 99 })
    expect(repeat.finding.fingerprintHash).toBe(first.finding.fingerprintHash)
    expect(repeat.isNovel).toBe(false)
  })
})

describe('local engine — safety invariant', () => {
  it('no VulnFinding field contains suspicious injection strings', async () => {
    const SUSPICIOUS = ["' OR", '--', '<script', 'DROP TABLE']
    const { engine } = makeEngine()
    for (let s = 1; s <= 10; s++) {
      const r = await engine.runRound({ seed: s })
      const { category, fingerprintHash, severity } = r.finding
      for (const bad of SUSPICIOUS) {
        expect(category).not.toContain(bad)
        expect(fingerprintHash).not.toContain(bad)
        expect(severity).not.toContain(bad)
      }
      expect(r.finding.location.file.length).toBeLessThanOrEqual(200)
      for (const v of r.verdicts) {
        expect(v.signal.length).toBeLessThanOrEqual(160)
      }
    }
  })
})
