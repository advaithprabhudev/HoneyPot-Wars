import type { AgentName, AgentVerdict, Attack, Engine } from '@honeypot/shared';

export interface RoundContext {
  seed: number;
  engine: Engine;
  /** Seeded PRNG for the local engine; unused by the llm engine. */
  rng: () => number;
}

export interface ScorerAgent {
  name: AgentName;
  score(attack: Attack, ctx: RoundContext): Promise<AgentVerdict>;
}

export interface ArenaEngine {
  engine: Engine;
  generate(ctx: RoundContext): Promise<Attack>;
  agents: ScorerAgent[];
}
