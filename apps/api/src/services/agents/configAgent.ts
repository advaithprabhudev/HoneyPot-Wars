import type { RealFinding } from '@honeypot-wars/shared'
import type { FileEntry } from '../fileAnalyzer.js'
import { getOpenAIClient } from '../../lib/openai.js'
import { buildFileBlock, parseAgentResponse } from './agentUtils.js'

const SYSTEM_PROMPT = `You are a security expert specializing in insecure configuration detection.
Analyze the provided source files and config files for security misconfigurations: open/wildcard CORS policies, missing authentication, missing rate limiting, HTTP instead of HTTPS, debug mode in production, overly permissive permissions, missing security headers, exposed admin endpoints, default credentials, disabled TLS verification, and similar risks.

RULES:
- Examine Docker files, CI/CD configs, web server configs, framework configs, and application code
- Return findings as a JSON array with these exact fields per item:
  { "severity": "critical"|"high"|"medium"|"low", "file": "<relative path>", "line": <number>, "description": "<what the misconfiguration is>", "recommendation": "<how to fix>" }
- Severity guide: critical=auth bypass or publicly exposed sensitive data, high=significant exposure, medium=defense-in-depth gap, low=best-practice deviation
- If no config issues found, return: []
- Return ONLY the JSON array — no markdown fences, no explanation`

export async function runConfigAgent(batch: FileEntry[]): Promise<RealFinding[]> {
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
  return parseAgentResponse(raw, 'config', 'insecure_config')
}
