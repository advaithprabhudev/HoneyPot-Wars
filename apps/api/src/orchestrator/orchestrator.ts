import type { RoundResult, VulnCategory } from '@honeypot-wars/shared'
import { createLocalEngine } from './engines/local.js'
import type { RoundEngine } from './types.js'

export type OrchestratorOptions = {
  engine: 'local' | 'llm_openai'
  isHashSeen: (hash: string) => boolean
  getOpenAIEngine?: () => RoundEngine
}

/**
 * Creates the round engine for the specified mode.
 * Keeps engine selection in one place — callers just call runRound().
 */
export function createOrchestrator(opts: OrchestratorOptions): RoundEngine {
  if (opts.engine === 'llm_openai') {
    if (!opts.getOpenAIEngine) {
      throw new Error('getOpenAIEngine factory required for llm_openai engine')
    }
    return opts.getOpenAIEngine()
  }

  return createLocalEngine(opts.isHashSeen)
}

/**
 * Runs a single round and returns the full RoundResult.
 * isHashSeen is called with finding.fingerprintHash to determine novelty.
 */
export async function runRound(
  engine: RoundEngine,
  opts: { seed: number; category?: VulnCategory },
): Promise<RoundResult> {
  return engine.runRound(opts)
}
