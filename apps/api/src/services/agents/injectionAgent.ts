import type { RealFinding } from '@honeypot-wars/shared'
import type { FileEntry } from '../fileAnalyzer.js'
import { getOpenAIClient } from '../../lib/openai.js'
import { buildFileBlock, parseAgentResponse } from './agentUtils.js'

const SYSTEM_PROMPT = `You are a security expert specializing in injection vulnerability detection.
Analyze the provided source files for SQL injection, command injection, OS injection, path traversal, LDAP injection, XSS, template injection, and similar injection vulnerabilities.

RULES:
- Look for user-controlled input flowing into dangerous sinks without proper sanitization
- NEVER output working exploit strings or payloads — only describe the vulnerability pattern
- Return findings as a JSON array with these exact fields per item:
  { "severity": "critical"|"high"|"medium"|"low", "file": "<relative path>", "line": <number>, "description": "<vulnerability description — no exploit strings>", "recommendation": "<how to fix>" }
- Severity guide: critical=direct RCE or full DB access, high=significant data exposure, medium=limited impact, low=potential pattern
- If no injection vulnerabilities found, return: []
- Return ONLY the JSON array — no markdown fences, no explanation`

export async function runInjectionAgent(batch: FileEntry[]): Promise<RealFinding[]> {
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
  return parseAgentResponse(raw, 'injection', 'injection_vector')
}
