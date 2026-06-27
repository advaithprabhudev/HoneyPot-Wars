import { Schema, model } from 'mongoose';
import { AGENT_NAMES, ARCHETYPES } from '@honeypot/shared';

const agentVerdictSchema = new Schema(
  {
    agent: { type: String, enum: AGENT_NAMES, required: true },
    confidence: { type: Number, min: 0, max: 1, required: true },
    flagged: { type: Boolean, required: true },
    signal: { type: String, required: true },
  },
  { _id: false },
);

/**
 * One full generator -> swarm -> referee cycle. Note: there is deliberately no
 * rawScamText field — storing generated scam copy violates CLAUDE.md §1/§5.
 * Only paramHash is logged for params (§13).
 */
const roundSchema = new Schema(
  {
    seed: { type: Number, required: true },
    engine: { type: String, enum: ['local', 'llm'], required: true },
    attack: {
      archetype: { type: String, enum: ARCHETYPES, required: true },
      params: { type: Map, of: Number, required: true },
      paramHash: { type: String, required: true, index: true },
    },
    verdicts: { type: [agentVerdictSchema], required: true },
    fusedScore: { type: Number, min: 0, max: 1, required: true },
    verdict: { type: String, enum: ['caught', 'slipped'], required: true },
    isNovel: { type: Boolean, required: true, index: true },
    reason: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const RoundModel = model('Round', roundSchema);
