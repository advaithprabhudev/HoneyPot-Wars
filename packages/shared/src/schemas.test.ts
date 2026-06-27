import { describe, expect, it } from 'vitest';
import { generatedAttackSchema, paramsSchema } from './schemas.js';
import { PARAM_KEYS } from './taxonomy.js';

const fullParams = Object.fromEntries(PARAM_KEYS.map((k) => [k, 0.5]));

describe('safety regression: generator output schema', () => {
  it('accepts a valid abstract attack', () => {
    const result = generatedAttackSchema.safeParse({
      archetype: 'advance_fee',
      params: fullParams,
    });
    expect(result.success).toBe(true);
  });

  // CLAUDE.md §1 / §14 — this test must never be deleted.
  it('rejects any free-text field smuggled into params', () => {
    const result = paramsSchema.safeParse({ ...fullParams, rawScamText: 'pay me now' });
    expect(result.success).toBe(false);
  });

  it('rejects a string value where a unit knob is required', () => {
    const result = paramsSchema.safeParse({ ...fullParams, urgency: 'very high' });
    expect(result.success).toBe(false);
  });

  it('rejects out-of-range knobs', () => {
    const result = paramsSchema.safeParse({ ...fullParams, urgency: 1.5 });
    expect(result.success).toBe(false);
  });
});
