import type { AgentVerdict, VulnFinding } from '@honeypot-wars/shared'
import type { ScorerAgent, RoundContext } from '../types.js'
import { localConfidence, localSignal } from './localScoring.js'

export const injectionAgent: ScorerAgent = {
  name: 'injection',

  async score(finding: VulnFinding, ctx: RoundContext): Promise<AgentVerdict> {
    const confidence = localConfidence('injection', finding, ctx.rng)
    return {
      agent:   'injection',
      confidence,
      flagged: confidence >= 0.5,
      signal:  localSignal('injection', finding),
    }
  },
}
