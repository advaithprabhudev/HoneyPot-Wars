import { z } from 'zod';
import { AGENT_NAMES, ARCHETYPES, PARAM_KEYS } from './taxonomy.js';

const unit = z.number().min(0).max(1);

/**
 * The params record is strict: only known ParamKeys, each a unit float.
 * SAFETY (CLAUDE.md §1 / §14): there is intentionally NO free-text field here.
 * This schema rejecting any string-valued param is the safety regression guard.
 */
export const paramsSchema = z
  .object(Object.fromEntries(PARAM_KEYS.map((k) => [k, unit])) as Record<string, typeof unit>)
  .strict();

/** What the Generator is allowed to emit — archetype + params, nothing else. */
export const generatedAttackSchema = z
  .object({
    archetype: z.enum(ARCHETYPES),
    params: paramsSchema,
  })
  .strict();

export const attackSchema = generatedAttackSchema
  .extend({
    paramHash: z.string().length(64),
  })
  .strict();

export const agentVerdictSchema = z.object({
  agent: z.enum(AGENT_NAMES),
  confidence: unit,
  flagged: z.boolean(),
  signal: z.string().max(160),
});

export const roundResultSchema = z.object({
  id: z.string(),
  seed: z.number().int().nonnegative(),
  engine: z.enum(['local', 'llm']),
  attack: attackSchema,
  verdicts: z.array(agentVerdictSchema).length(4),
  fusedScore: unit,
  verdict: z.enum(['caught', 'slipped']),
  isNovel: z.boolean(),
  reason: z.string().max(200),
  createdAt: z.string(),
});

export const arenaStartSchema = z.object({
  engine: z.enum(['local', 'llm']).optional(),
  seed: z.number().int().nonnegative().optional(),
});

export const playerAttackSchema = generatedAttackSchema;

export const contactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  company: z.string().max(160).optional(),
  message: z.string().min(1).max(2000),
});

export type GeneratedAttack = z.infer<typeof generatedAttackSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
