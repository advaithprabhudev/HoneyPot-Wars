import type { AgentVerdict, VulnFinding } from '@honeypot-wars/shared'
import type { ScorerAgent, RoundContext } from '../types.js'
import { localConfidence, localSignal } from './localScoring.js'

export const dependencyAgent: ScorerAgent = {
  name: 'dependency',

  async score(finding: VulnFinding, ctx: RoundContext): Promise<AgentVerdict> {
    const confidence = localConfidence('dependency', finding, ctx.rng)
    return {
      agent:   'dependency',
      confidence,
      flagged: confidence >= 0.5,
      signal:  localSignal('dependency', finding),
    }
  },
}
