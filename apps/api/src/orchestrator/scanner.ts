import type { VulnFinding, VulnCategory, Severity, AgentName } from '@honeypot-wars/shared'
import {
  VULN_CATEGORIES,
  AGENT_PARAMS,
  PARAM_KEYS,
  CATEGORY_EMPHASIS,
} from '@honeypot-wars/shared'
import { vulnFindingSchema } from '@honeypot-wars/shared'
import type { Rng } from '../lib/rng.js'
import { fingerprintHash } from './hash.js'

// Map each VulnCategory to its owning AgentName (same index order in both const arrays).
export const CATEGORY_AGENT: Record<VulnCategory, AgentName> = {
  hardcoded_secret:      'secrets',
  injection_vector:      'injection',
  insecure_config:       'config',
  vulnerable_dependency: 'dependency',
}

// Severity weights per category: [critical, high, medium, low]
const SEVERITY_WEIGHTS: Record<VulnCategory, readonly number[]> = {
  hardcoded_secret:      [0.40, 0.35, 0.20, 0.05],
  injection_vector:      [0.35, 0.40, 0.20, 0.05],
  insecure_config:       [0.15, 0.30, 0.40, 0.15],
  vulnerable_dependency: [0.25, 0.35, 0.30, 0.10],
}

const SEVERITIES: readonly Severity[] = ['critical', 'high', 'medium', 'low']

function pickWeighted(items: readonly Severity[], weights: readonly number[], rng: Rng): Severity {
  const r = rng()
  let cumulative = 0
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i]
    if (r < cumulative) return items[i]
  }
  return items[items.length - 1]
}

/**
 * Deterministic local scanner — generates a synthetic VulnFinding from a seed-derived RNG.
 * No network calls. Validates output against vulnFindingSchema before returning.
 * Throws on schema failure — a failed validate is a bug in the generator logic (§A invariant).
 */
export function localScannerGenerate(rng: Rng): VulnFinding {
  // 1. Pick category
  const category = VULN_CATEGORIES[Math.floor(rng() * VULN_CATEGORIES.length)]

  // 2. Pick severity weighted by category risk profile
  const severity = pickWeighted(SEVERITIES, SEVERITY_WEIGHTS[category], rng)

  // 3. Generate params
  const ownedKeys = new Set(AGENT_PARAMS[CATEGORY_AGENT[category]])
  const emphasis = CATEGORY_EMPHASIS[category]

  // Scale factor stretches or compresses the emphasis values across the full [0.5, 1.45] range.
  const scale = 0.5 + 0.95 * rng()

  const params: Record<string, number> = {}
  for (const key of PARAM_KEYS) {
    if (ownedKeys.has(key)) {
      const base = emphasis[key] ?? 0.3
      const noise = (rng() - 0.5) * 0.14
      params[key] = Math.max(0, Math.min(1, base * scale + noise))
    } else {
      // Background noise — low so non-relevant agents don't inflate fusedScore.
      params[key] = rng() * 0.25
    }
  }

  // 4. Compute fingerprint from full 16-key param vector
  const hash = fingerprintHash(params)

  // 5. Synthetic location — no real paths from local-engine output
  const line = Math.floor(rng() * 500) + 1

  const finding: VulnFinding = {
    category,
    params,
    fingerprintHash: hash,
    location: { file: 'demo/synthetic.ts', line },
    severity,
  }

  // Validates: throws on failure — never emit invalid output (§A invariant)
  vulnFindingSchema.parse(finding)

  return finding
}
