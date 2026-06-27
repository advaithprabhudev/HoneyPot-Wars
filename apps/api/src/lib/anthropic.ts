import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';

/**
 * Single Anthropic client. Server-side ONLY (CLAUDE.md §1/§13) — never import
 * this from apps/web. Lazily constructed so the local engine never needs a key.
 */
let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set; llm engine is unavailable');
  }
  if (!client) {
    client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 2, timeout: 20_000 });
  }
  return client;
}

export const MODELS = {
  generator: 'claude-sonnet-4-6',
  defender: 'claude-haiku-4-5',
  referee: 'claude-sonnet-4-6',
} as const;
