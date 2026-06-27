import type { RoundResult, VulnCategory } from '@honeypot-wars/shared'
import { CATCH_THRESHOLD, CATEGORY_LABELS, AGENT_LABELS } from '@honeypot-wars/shared'
import { mulberry32 } from '../../lib/rng.js'
import { localScannerGenerate } from '../scanner.js'
import { fuse } from '../fusion.js'
import { secretsAgent, injectionAgent, configAgent, dependencyAgent } from '../agents/index.js'
import type { RoundEngine, ScorerAgent } from '../types.js'

const AGENTS: readonly ScorerAgent[] = [secretsAgent, injectionAgent, configAgent, dependencyAgent]

/**
 * Local deterministic engine — no network calls, seeded RNG only.
 * Powers the public arcade/demo and all tests (CLAUDE.md §3 determinism boundary).
 */
export function createLocalEngine(
  isHashSeen: (hash: string) => boolean,
): RoundEngine {
  return {
    async runRound({ seed, category: _category }: { seed: number; category?: VulnCategory }): Promise<RoundResult> {
      const rng = mulberry32(seed)
      const ctx = { rng, seed }

      // 1. Generate finding (local engine always uses its own category from RNG)
      const finding = localScannerGenerate(rng)

      // 2. Novelty check — in-memory for local engine
      const isNovel = !isHashSeen(finding.fingerprintHash)

      // 3. Score all four agents in parallel — never serial
      const settled = await Promise.allSettled(AGENTS.map((a) => a.score(finding, ctx)))
      const verdicts = settled.map((r, i) =>
        r.status === 'fulfilled'
          ? r.value
          : {
              agent:      AGENTS[i].name,
              confidence: 0,
              flagged:    false,
              signal:     'agent error — sentinel',
            },
      )

      // 4. Fuse
      const fusedScore = fuse(verdicts)

      // 5. Referee decision
      const caught = fusedScore >= CATCH_THRESHOLD
      const verdict = caught ? ('caught' as const) : ('slipped' as const)
      const novelTag = isNovel ? 'novel' : 'repeat'

      const topVerdict = verdicts.reduce((best, v) =>
        v.confidence > best.confidence ? v : best,
      )

      const reason = caught
        ? `${AGENT_LABELS[topVerdict.agent]} flagged ${CATEGORY_LABELS[finding.category]} (${novelTag}) — ${topVerdict.signal}`
        : `${CATEGORY_LABELS[finding.category]} (${novelTag}) slipped — fused ${fusedScore.toFixed(2)} < ${CATCH_THRESHOLD}`

      return {
        id:        `${seed}-${finding.fingerprintHash.slice(0, 8)}`,
        seed,
        engine:    'local',
        finding,
        verdicts,
        fusedScore,
        verdict,
        isNovel,
        reason,
        createdAt: new Date(),
      }
    },
  }
}
