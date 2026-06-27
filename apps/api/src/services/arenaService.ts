import {
  type ArenaMetric,
  type Attack,
  type Engine,
  type FeedLine,
  type RoundResult,
} from '@honeypot/shared';
import { env } from '../config/env.js';
import { runRound } from '../orchestrator/orchestrator.js';
import { isHashSeen, liveMetric, recordRound } from './roundStore.js';

let seedCounter = Math.floor(Math.random() * 1_000_000);

function nextSeed(): number {
  seedCounter = (seedCounter + 1) >>> 0;
  return seedCounter;
}

export function feedLineFromRound(round: RoundResult): FeedLine {
  const topAgent = [...round.verdicts].sort((a, b) => b.confidence - a.confidence)[0];
  return {
    id: `${round.id}-feed`,
    roundId: round.id,
    archetype: round.attack.archetype,
    verdict: round.verdict,
    isNovel: round.isNovel,
    fusedScore: round.fusedScore,
    topAgent: topAgent.agent,
    reason: round.reason,
    createdAt: round.createdAt,
  };
}

/** Run and persist one arena round. */
export async function playRound(opts: { engine?: Engine; seed?: number; attack?: Attack }): Promise<{
  round: RoundResult;
  feed: FeedLine;
  metric: ArenaMetric;
}> {
  const engine = opts.engine ?? env.ARENA_ENGINE;
  const seed = opts.seed ?? nextSeed();
  const round = await runRound({ engine, seed, isHashSeen, attack: opts.attack });
  await recordRound(round);
  return { round, feed: feedLineFromRound(round), metric: liveMetric() };
}
