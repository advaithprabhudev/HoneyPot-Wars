import type { AgentVerdict, VulnFinding } from '@honeypot-wars/shared'
import type { ScorerAgent, RoundContext } from '../types.js'
import { localConfidence, localSignal } from './localScoring.js'

export const configAgent: ScorerAgent = {
  name: 'config',

  async score(finding: VulnFinding, ctx: RoundContext): Promise<AgentVerdict> {
    const confidence = localConfidence('config', finding, ctx.rng)
    return {
      agent:   'config',
      confidence,
      flagged: confidence >= 0.5,
      signal:  localSignal('config', finding),
    }
  },
}
