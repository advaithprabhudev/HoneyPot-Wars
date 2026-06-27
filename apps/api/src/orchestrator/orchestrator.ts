import {
  type AgentVerdict,
  type Attack,
  type Engine,
  type RoundResult,
} from '@honeypot/shared';
import { mulberry32, stringToSeed } from '../lib/rng.js';
import type { ArenaEngine, RoundContext } from './types.js';
import { localEngine } from './engines/local.js';
import { llmEngine } from './engines/llm.js';
import { fuse, refereeDecide } from './referee.js';

function selectEngine(engine: Engine): ArenaEngine {
  return engine === 'llm' ? llmEngine : localEngine;
}

export interface RunRoundOptions {
  engine: Engine;
  seed: number;
  /** Provided by the service: has this paramHash been recorded before? */
  isHashSeen: (hash: string) => Promise<boolean> | boolean;
  /** Optional override attack (playable mode); skips generation. */
  attack?: Attack;
}

/**
 * One full round: generate -> swarm scores in parallel -> fuse -> referee.
 * Determinism: the generator and each agent get an independent sub-seeded rng,
 * so the result is stable regardless of Promise.all scheduling.
 */
export async function runRound(opts: RunRoundOptions): Promise<RoundResult> {
  const engine = selectEngine(opts.engine);
  const genCtx: RoundContext = {
    seed: opts.seed,
    engine: opts.engine,
    rng: mulberry32(opts.seed),
  };

  const attack = opts.attack ?? (await engine.generate(genCtx));

  const verdicts: AgentVerdict[] = await Promise.all(
    engine.agents.map((agent) => {
      const subSeed = (opts.seed ^ stringToSeed(agent.name)) >>> 0;
      const ctx: RoundContext = { seed: subSeed, engine: opts.engine, rng: mulberry32(subSeed) };
      return agent.score(attack, ctx);
    }),
  );

  const fusedScore = fuse(verdicts);
  const isNovel = !(await opts.isHashSeen(attack.paramHash));
  const { verdict, reason } = refereeDecide(verdicts, fusedScore, isNovel);

  return {
    id: `${opts.seed}-${attack.paramHash.slice(0, 8)}`,
    seed: opts.seed,
    engine: opts.engine,
    attack,
    verdicts,
    fusedScore,
    verdict,
    isNovel,
    reason,
    createdAt: new Date().toISOString(),
  };
}
