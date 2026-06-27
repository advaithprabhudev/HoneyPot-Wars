import { randomUUID } from 'crypto'
import type { RealFinding, VulnCategory, AgentRole, Severity } from '@honeypot-wars/shared'
import type { FileEntry } from '../fileAnalyzer.js'

const SEVERITY_VALUES: Severity[] = ['critical', 'high', 'medium', 'low']

type RawItem = {
  severity?: string
  file?: string
  line?: number | string
  description?: string
  recommendation?: string
}

export function buildFileBlock(batch: FileEntry[]): string {
  return batch
    .map((f) => `=== FILE: ${f.relativePath} ===\n${f.content}`)
    .join('\n\n')
}

export function parseAgentResponse(
  raw: string,
  agent: AgentRole,
  category: VulnCategory,
): RealFinding[] {
  try {
    // Strip markdown fences if the model wrapped the JSON
    const cleaned = raw.replace(/^```[a-z]*\n?/gm, '').replace(/```$/gm, '').trim()
    const match = cleaned.match(/\[[\s\S]*\]/)
    if (!match) return []

    const items: RawItem[] = JSON.parse(match[0])
    if (!Array.isArray(items)) return []

    return items
      .filter((item): item is Required<RawItem> =>
        typeof item === 'object' &&
        typeof item.file === 'string' &&
        typeof item.description === 'string' &&
        typeof item.recommendation === 'string',
      )
      .map((item) => ({
        id: randomUUID(),
        category,
        severity: SEVERITY_VALUES.includes(item.severity as Severity)
          ? (item.severity as Severity)
          : 'medium',
        file: item.file,
        line: typeof item.line === 'number'
          ? item.line
          : parseInt(String(item.line ?? '0'), 10) || 0,
        description: item.description.slice(0, 500),
        recommendation: item.recommendation.slice(0, 500),
        agent,
        detectedAt: new Date(),
      }))
  } catch {
    return []
  }
}
