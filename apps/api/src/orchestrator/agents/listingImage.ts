import { type AgentVerdict } from '@honeypot/shared';
import type { ScorerAgent } from '../types.js';
import { localConfidence, localSignal } from './localScoring.js';

const NAME = 'listing_image' as const;

export const listingImageAgent: ScorerAgent = {
  name: NAME,
  async score(attack, ctx): Promise<AgentVerdict> {
    const confidence = localConfidence(NAME, attack, ctx.rng);
    return {
      agent: NAME,
      confidence,
      flagged: confidence >= 0.5,
      signal: localSignal(NAME, attack),
    };
  },
};
