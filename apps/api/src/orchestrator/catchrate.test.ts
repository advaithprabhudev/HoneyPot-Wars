import { describe, it, expect } from 'vitest'
import { createLocalEngine } from './engines/local.js'

describe('local engine — catch rate guard', () => {
  it('gapCoverage over 200 seeded novel rounds is in [0.78, 0.92]', async () => {
    const seenHashes = new Set<string>()
    const engine = createLocalEngine((h) => seenHashes.has(h))

    let novelCaught = 0
    let novelTotal = 0

    for (let seed = 1; seed <= 200; seed++) {
      const result = await engine.runRound({ seed })
      if (result.isNovel) {
        novelTotal++
        if (result.verdict === 'caught') novelCaught++
      }
      seenHashes.add(result.finding.fingerprintHash)
    }

    const gapCoverage = novelTotal === 0 ? 0 : novelCaught / novelTotal
    expect(novelTotal).toBeGreaterThan(150)
    expect(gapCoverage).toBeGreaterThanOrEqual(0.78)
    expect(gapCoverage).toBeLessThanOrEqual(0.92)
  })
})
