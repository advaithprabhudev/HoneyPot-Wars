import {
  AGENT_LABELS,
  CATCH_THRESHOLD,
  FUSION_WEIGHTS,
  type AgentVerdict,
  type Verdict,
} from '@honeypot/shared';
import { clamp01 } from '../lib/rng.js';

/** Weighted-mean fusion of the four agent confidences (seller_graph weighted highest). */
export function fuse(verdicts: AgentVerdict[]): number {
  let weighted = 0;
  let total = 0;
  for (const v of verdicts) {
    const w = FUSION_WEIGHTS[v.agent];
    weighted += v.confidence * w;
    total += w;
  }
  return clamp01(total === 0 ? 0 : weighted / total);
}

/**
 * The Referee is the only source of truth for the verdict (CLAUDE.md §2). It maps
 * fusedScore against the catch threshold and records who carried the round.
 */
export function refereeDecide(
  verdicts: AgentVerdict[],
  fusedScore: number,
  isNovel: boolean,
): { verdict: Verdict; reason: string } {
  const verdict: Verdict = fusedScore >= CATCH_THRESHOLD ? 'caught' : 'slipped';
  const novelTag = isNovel ? 'novel' : 'repeat';

  if (verdict === 'caught') {
    const top = [...verdicts].sort((a, b) => b.confidence - a.confidence)[0];
    return {
      verdict,
      reason: `${AGENT_LABELS[top.agent]} caught ${novelTag} attack — ${top.signal}`,
    };
  }
  return {
    verdict,
    reason: `${novelTag} attack slipped — swarm fused ${fusedScore.toFixed(2)} < ${CATCH_THRESHOLD}`,
  };
}
