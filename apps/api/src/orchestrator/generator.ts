import {
  ARCHETYPES,
  ARCHETYPE_EMPHASIS,
  PARAM_KEYS,
  generatedAttackSchema,
  type Archetype,
  type Attack,
  type ParamKey,
} from '@honeypot/shared';
import { clamp01 } from '../lib/rng.js';
import { paramHash } from '../lib/hash.js';

const BASELINE_KNOB = 0.3;

/**
 * Deterministic generator for the local engine. Each round draws a uniform
 * "threat" level; knobs are the archetype's emphasis scaled by that threat, so
 * loud attacks (high threat) are easy to catch and quiet ones may slip past the
 * swarm. Output is { archetype, params } only — validated against the shared
 * schema, which rejects any free-text field (CLAUDE.md §1/§6).
 */
export function localGenerateAttack(rng: () => number): Attack {
  const archetype = ARCHETYPES[Math.floor(rng() * ARCHETYPES.length)] as Archetype;
  const emphasis = ARCHETYPE_EMPHASIS[archetype];
  const threat = rng();
  const scale = 0.5 + 0.95 * threat;

  const params: Record<string, number> = {};
  for (const key of PARAM_KEYS) {
    const base = emphasis[key as ParamKey] ?? BASELINE_KNOB;
    const noise = (rng() - 0.5) * 0.14;
    params[key] = Number(clamp01(base * scale + noise).toFixed(3));
  }

  const parsed = generatedAttackSchema.parse({ archetype, params });
  return { ...parsed, paramHash: paramHash(parsed.params) };
}
