import { AGENT_PARAMS, type AgentName, type Attack } from '@honeypot/shared';
import { clamp01 } from '../../lib/rng.js';

/**
 * Every local agent is a transparent function of attack.params. A real detector
 * fires on its strongest signal, so confidence blends the max owned knob with the
 * mean (0.6/0.4), nudged by small seeded noise so novel combos occasionally slip
 * (CLAUDE.md §6).
 */
export function localConfidence(agent: AgentName, attack: Attack, rng: () => number): number {
  const keys = AGENT_PARAMS[agent];
  let max = 0;
  let sum = 0;
  for (const k of keys) {
    const v = attack.params[k] ?? 0;
    sum += v;
    if (v > max) max = v;
  }
  const mean = sum / keys.length;
  const noise = (rng() - 0.5) * 0.16;
  return clamp01(0.85 * max + 0.35 * mean + noise);
}

/** A one-line, scam-free explanation naming the strongest knob for this agent. */
export function localSignal(agent: AgentName, attack: Attack): string {
  const keys = AGENT_PARAMS[agent];
  let topKey = keys[0];
  let topVal = -1;
  for (const k of keys) {
    const v = attack.params[k] ?? 0;
    if (v > topVal) {
      topVal = v;
      topKey = k;
    }
  }
  return `${topKey} elevated (${topVal.toFixed(2)})`;
}
