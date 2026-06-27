import type { ArenaEngine } from '../types.js';
import { localGenerateAttack } from '../generator.js';
import {
  textAgent,
  listingImageAgent,
  priceAnomalyAgent,
  sellerGraphAgent,
} from '../agents/index.js';

export const localEngine: ArenaEngine = {
  engine: 'local',
  async generate(ctx) {
    return localGenerateAttack(ctx.rng);
  },
  agents: [textAgent, listingImageAgent, priceAnomalyAgent, sellerGraphAgent],
};
