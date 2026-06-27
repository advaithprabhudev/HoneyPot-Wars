/**
 * Harness for tuning CATCH_THRESHOLD in packages/shared/taxonomy.ts.
 * Run: npx tsx apps/api/src/scripts/tune-catchrate.ts
 *
 * Prints per-category and aggregate catch rates across 500 seeded rounds.
 * Target aggregate: [0.80, 0.90]
 */

import { createLocalEngine } from '../orchestrator/engines/local.js'
import type { VulnCategory } from '@honeypot-wars/shared'
import { CATCH_THRESHOLD, VULN_CATEGORIES } from '@honeypot-wars/shared'

void (async () => {
  const NUM_ROUNDS = 500
  const seenHashes = new Set<string>()
  const engine = createLocalEngine((hash) => seenHashes.has(hash))

  const stats: Record<VulnCategory, { caught: number; total: number }> = {
    hardcoded_secret:      { caught: 0, total: 0 },
    injection_vector:      { caught: 0, total: 0 },
    insecure_config:       { caught: 0, total: 0 },
    vulnerable_dependency: { caught: 0, total: 0 },
  }

  let novelCaught = 0
  let novelTotal = 0

  for (let seed = 1; seed <= NUM_ROUNDS; seed++) {
    const result = await engine.runRound({ seed })
    const cat = result.finding.category
    if (result.isNovel) {
      novelTotal++
      if (result.verdict === 'caught') {
        novelCaught++
        stats[cat].caught++
      }
      stats[cat].total++
    }
    seenHashes.add(result.finding.fingerprintHash)
  }

  const gapCoverageRate = novelTotal === 0 ? 0 : novelCaught / novelTotal

  // eslint-disable-next-line no-console
  console.log(`\nCATCH_THRESHOLD = ${CATCH_THRESHOLD}`)
  // eslint-disable-next-line no-console
  console.log(`Seeds: 1-${NUM_ROUNDS}  |  Novel rounds: ${novelTotal}`)
  // eslint-disable-next-line no-console
  console.log(`\nAggregate gapCoverageRate: ${(gapCoverageRate * 100).toFixed(1)}%`)
  for (const cat of VULN_CATEGORIES) {
    const { caught, total } = stats[cat]
    const rate = total === 0 ? 0 : caught / total
    // eslint-disable-next-line no-console
    console.log(`  ${cat.padEnd(24)} ${(rate * 100).toFixed(1)}%  (${caught}/${total})`)
  }

  const inRange = gapCoverageRate >= 0.80 && gapCoverageRate <= 0.90
  // eslint-disable-next-line no-console
  console.log(`\n${inRange ? 'PASS [0.80, 0.90]' : 'FAIL -- adjust CATCH_THRESHOLD'}`)
  process.exit(inRange ? 0 : 1)
})()
