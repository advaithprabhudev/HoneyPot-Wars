import type { AgentVerdict, AgentName } from '@honeypot-wars/shared'
import { WEIGHTS } from '../config/weights.js'

// Weighted mean of the four defender confidences.
// Weights are imported from config/weights.ts (re-exported from shared taxonomy).
export function fuse(verdicts: readonly AgentVerdict[]): number {
  let weightedSum = 0
  let totalWeight = 0
  for (const v of verdicts) {
    const w = WEIGHTS[v.agent as AgentName] ?? 0
    weightedSum += v.confidence * w
    totalWeight += w
  }
  return totalWeight === 0 ? 0 : weightedSum / totalWeight
}
