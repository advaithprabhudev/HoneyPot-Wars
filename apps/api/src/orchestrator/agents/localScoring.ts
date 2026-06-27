import type { AgentName, VulnFinding } from '@honeypot-wars/shared'
import { AGENT_PARAMS } from '@honeypot-wars/shared'
import type { Rng } from '../../lib/rng.js'

/**
 * Deterministic confidence score for a local-engine defender agent.
 *
 * Uses only AGENT_PARAMS[agent] keys from finding.params.
 * Never accesses finding.location or any free-text field — params only (§A safety).
 */
export function localConfidence(
  agent: AgentName,
  finding: VulnFinding,
  rng: Rng,
): number {
  const owned = AGENT_PARAMS[agent]
  const values = owned.map((k) => finding.params[k] ?? 0)

  const maxOwned = Math.max(...values)
  const meanOwned = values.reduce((s, v) => s + v, 0) / values.length
  const noise = (rng() - 0.5) * 0.16

  return Math.max(0, Math.min(1, 0.85 * maxOwned + 0.35 * meanOwned + noise))
}

/**
 * One-line diagnostic signal for the agent.
 * Reports only the top owned param key and its rounded value — never raw location
 * or finding text (§A no deployable artifact from finding content).
 */
export function localSignal(agent: AgentName, finding: VulnFinding): string {
  const owned = AGENT_PARAMS[agent]
  let topKey = owned[0]
  let topVal = finding.params[topKey] ?? 0

  for (const k of owned) {
    const v = finding.params[k] ?? 0
    if (v > topVal) {
      topVal = v
      topKey = k
    }
  }

  return `${topKey} elevated (${topVal.toFixed(2)})`
}
