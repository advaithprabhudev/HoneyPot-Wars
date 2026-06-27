import type { RealFinding } from '@honeypot-wars/shared'
import type { FileEntry } from '../fileAnalyzer.js'
import { getOpenAIClient } from '../../lib/openai.js'
import { buildFileBlock, parseAgentResponse } from './agentUtils.js'

const SYSTEM_PROMPT = `You are a security expert specializing in vulnerable dependency detection.
Analyze the provided dependency manifest files (package.json, requirements.txt, Pipfile, Gemfile, pom.xml, go.mod, build.gradle, etc.) for:
- Known vulnerable package versions (reference CVEs and known vulnerability patterns)
- Packages with security issues at the pinned version
- Outdated packages with available security patches
- Packages with suspicious or typosquatted names
- Missing lockfiles that allow dependency confusion attacks

RULES:
- Focus on packages where the pinned version has documented security issues
- Return findings as a JSON array with these exact fields per item:
  { "severity": "critical"|"high"|"medium"|"low", "file": "<relative path>", "line": <number>, "description": "<package name, version, and the security risk>", "recommendation": "<upgrade to specific version or alternative>" }
- Severity guide: critical=actively exploited CVE, high=significant CVE, medium=moderate CVE, low=outdated with patch available
- If no vulnerable dependencies found, return: []
- Return ONLY the JSON array — no markdown fences, no explanation`

export async function runDependencyAgent(batch: FileEntry[]): Promise<RealFinding[]> {
  const client = getOpenAIClient()

  // Only analyze manifest files — no point sending source code to this agent
  const manifestBatch = batch.filter((f) =>
    /package\.json|requirements\.txt|Pipfile|Gemfile|pom\.xml|go\.mod|build\.gradle/i.test(f.relativePath),
  )

  if (manifestBatch.length === 0) return []

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 2048,
    temperature: 0,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildFileBlock(manifestBatch) },
    ],
  })

  const raw = response.choices[0]?.message?.content ?? '[]'
  return parseAgentResponse(raw, 'dependency', 'vulnerable_dependency')
}
