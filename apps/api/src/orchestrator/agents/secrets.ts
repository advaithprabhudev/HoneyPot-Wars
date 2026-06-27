import type { AgentVerdict, VulnFinding } from '@honeypot-wars/shared'
import type { ScorerAgent, RoundContext } from '../types.js'
import { localConfidence, localSignal } from './localScoring.js'

export const secretsAgent: ScorerAgent = {
  name: 'secrets',

  async score(finding: VulnFinding, ctx: RoundContext): Promise<AgentVerdict> {
    const confidence = localConfidence('secrets', finding, ctx.rng)
    return {
      agent:   'secrets',
      confidence,
      flagged: confidence >= 0.5,
      signal:  localSignal('secrets', finding),
    }
  },
}
