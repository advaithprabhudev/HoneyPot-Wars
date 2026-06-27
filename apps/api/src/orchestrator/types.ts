import type { AgentName, AgentVerdict, VulnFinding, VulnCategory, RoundResult } from '@honeypot-wars/shared'
import type { Rng } from '../lib/rng.js'

export interface RoundContext {
  rng: Rng
  seed: number
}

// Single interface for all engines — async so both local (Promise.resolve) and
// LLM (real async) agents satisfy it without branching.
export interface ScorerAgent {
  readonly name: AgentName
  score(finding: VulnFinding, ctx: RoundContext): Promise<AgentVerdict>
}

export interface RoundEngine {
  runRound(opts: { seed: number; category?: VulnCategory }): Promise<RoundResult>
}

// Satisfy TypeScript — these re-exports are consumed by engine factories.
export type { AgentName, AgentVerdict, VulnFinding, VulnCategory, RoundResult }
