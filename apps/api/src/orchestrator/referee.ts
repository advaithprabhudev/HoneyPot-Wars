import type { AgentVerdict, Verdict, VulnFinding } from '@honeypot-wars/shared'
import { CATCH_THRESHOLD, CATEGORY_LABELS, AGENT_LABELS } from '@honeypot-wars/shared'
import { fuse } from './fusion.js'

export type RefereeResult = {
  verdict: Verdict
  fusedScore: number
  reason: string
}

/**
 * Combines four agent verdicts into a fused score and determines the verdict.
 * The referee is the ONLY source of truth for the verdict — never the client.
 * gapCoverageRate is computed in roundStore.ts, not here.
 */
export function refereeDecide(
  finding: VulnFinding,
  verdicts: readonly AgentVerdict[],
  isNovel: boolean,
): RefereeResult {
  const fusedScore = fuse(verdicts)
  const caught = fusedScore >= CATCH_THRESHOLD
  const verdict: Verdict = caught ? 'caught' : 'slipped'
  const novelTag = isNovel ? 'novel' : 'repeat'

  const top = verdicts.reduce((best, v) =>
    v.confidence > best.confidence ? v : best,
  )

  const reason = caught
    ? `${AGENT_LABELS[top.agent]} flagged ${CATEGORY_LABELS[finding.category]} (${novelTag}) — ${top.signal}`
    : `${CATEGORY_LABELS[finding.category]} (${novelTag}) slipped — fused ${fusedScore.toFixed(2)} < ${CATCH_THRESHOLD}`

  return { verdict, fusedScore, reason }
}
