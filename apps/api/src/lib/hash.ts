import { createHash } from 'node:crypto';

/**
 * Novelty primitive: sha256 over the params sorted by key. Two attacks with the
 * same rounded knob vector hash identically, so repeats are detectable.
 */
export function paramHash(params: Record<string, number>): string {
  const canonical = Object.keys(params)
    .sort()
    .map((k) => `${k}:${params[k].toFixed(3)}`)
    .join('|');
  return createHash('sha256').update(canonical).digest('hex');
}
