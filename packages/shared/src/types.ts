import type { AgentName, VulnCategory } from './taxonomy.js'

export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type Verdict = 'caught' | 'slipped'
export type Engine = 'local' | 'llm_claude'

// ── Real scan types (OpenAI-powered live analysis) ───────────────────────────

export type ScanStatus = 'pending' | 'extracting' | 'scanning' | 'synthesizing' | 'done' | 'error'

export type AgentRole = 'secrets' | 'injection' | 'config' | 'dependency'

export type RealFinding = {
  id: string
  category: VulnCategory
  severity: Severity
  file: string           // relative path — never absolute
  line: number
  description: string    // what the issue is — no raw credential values ever
  recommendation: string // actionable fix
  agent: AgentRole
  detectedAt: Date
}

export type ScanSummary = {
  critical: number
  high: number
  medium: number
  low: number
  total: number
}

export type ScanJob = {
  scanId: string
  status: ScanStatus
  repoName: string
  totalFiles: number
  scannedFiles: number
  findings: RealFinding[]
  summary: ScanSummary
  startedAt: Date
  completedAt?: Date
  error?: string
}

export type VulnFinding = {
  category: VulnCategory
  params: Record<string, number>
  fingerprintHash: string
  location: { file: string; line: number }
  severity: Severity
}

export type AgentVerdict = {
  agent: AgentName
  confidence: number // 0..1
  flagged: boolean
  signal: string // max 160 chars; no raw param values — CLAUDE.md §A
}

export type RoundResult = {
  id: string // "${seed}-${fingerprintHash.slice(0,8)}"
  seed: number
  engine: Engine
  finding: VulnFinding // REFEREE is the only source of truth for verdict
  verdicts: AgentVerdict[] // exactly 4
  fusedScore: number // 0..1
  verdict: Verdict // set by Referee only — never recomputed on client
  isNovel: boolean
  reason: string
  createdAt: Date
}

export type FeedLine = {
  roundId: string
  verdict: Verdict
  category: VulnCategory
  isNovel: boolean
  fusedScore: number
  reason: string
  createdAt: Date
}

export type ArenaMetric = {
  gapCoverageRate: number // caught / total over isNovel===true rounds ONLY
  totalRounds: number
  novelSlips: number
}

export type AttackPattern =
  | 'evasion'        // params tuned to hover near catch threshold
  | 'gap_probe'      // high novelty rate — systematically probing detection gaps
  | 'category_focus' // repeatedly targeting one category where defenders score low
  | 'boundary_probe' // fusedScores clustering near threshold with low variance
  | 'slip_streak'    // unusual consecutive-slip streak

export type DetectorAlert = {
  readonly pattern: AttackPattern
  readonly confidence: number  // 0..1
  readonly evidence: string    // ≤160 chars, no raw values
  readonly windowRounds: number
  readonly slipRate: number    // fraction of recent rounds that slipped
  readonly createdAt: Date
}
