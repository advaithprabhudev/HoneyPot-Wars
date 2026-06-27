import Anthropic from '@anthropic-ai/sdk'
import { env } from '../config/env.js'

let _client: Anthropic | null = null

// Single shared client — initialised once, reused across all engine calls.
// Throws at first use if ANTHROPIC_API_KEY is missing (fail-fast, not at boot).
export function getAnthropicClient(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required for the llm_claude engine')
  }
  if (!_client) {
    _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  }
  return _client
}
