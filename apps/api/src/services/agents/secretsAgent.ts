import { randomUUID } from 'crypto'
import type { RealFinding } from '@honeypot-wars/shared'
import type { FileEntry } from '../fileAnalyzer.js'
import { getOpenAIClient } from '../../lib/openai.js'
import { buildFileBlock, parseAgentResponse } from './agentUtils.js'

const SYSTEM_PROMPT = `You are a security expert specializing in hardcoded secrets detection.
Analyze the provided source files for hardcoded credentials, API keys, tokens, passwords, private keys, connection strings, and similar sensitive values embedded directly in code or config files.

RULES:
- NEVER include the actual secret value in your output — only describe its location and nature
- Focus only on real issues, not comments or documentation examples
- Return findings as a JSON array with these exact fields per item:
  { "severity": "critical"|"high"|"medium"|"low", "file": "<relative path>", "line": <number>, "description": "<what you found — NO raw value>", "recommendation": "<how to fix>" }
- Severity guide: critical=production private key/credential, high=API key/token/password, medium=test credential or placeholder, low=pattern that resembles a secret
- If no secrets found, return: []
- Return ONLY the JSON array — no markdown fences, no explanation`

export async function runSecretsAgent(batch: FileEntry[]): Promise<RealFinding[]> {
  const client = getOpenAIClient()

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 2048,
    temperature: 0,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildFileBlock(batch) },
    ],
  })

  const raw = response.choices[0]?.message?.content ?? '[]'
  return parseAgentResponse(raw, 'secrets', 'hardcoded_secret')
}
