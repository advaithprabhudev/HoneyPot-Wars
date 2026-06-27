/**
 * Detector AI Agent — observes the attacker's round-by-round behavior and
 * identifies attack patterns in real time.
 *
 * Two implementations:
 *   local  — pure deterministic pattern matching, no network
 *   llm    — claude-haiku-4-5 behavioral analysis with local fallback
 *
 * All data passed to the LLM is abstract stats (counts, rates, scores).
 * No raw source code, credentials, or exploit strings ever cross this boundary (§A).
 */

import type Anthropic from '@anthropic-ai/sdk'
import type { RoundResult, DetectorAlert } from '@honeypot-wars/shared'
import { detectorAlertSchema } from '@honeypot-wars/shared'
import { CATCH_THRESHOLD } from '@honeypot-wars/shared'
import { getAnthropicClient } from '../../lib/anthropic.js'
import { snapshotFromRound, appendSnapshot, computeStats } from './window.js'
import { runLocalPatterns } from './patterns.js'
import type { RoundSnapshot } from './types.js'
import { MIN_WINDOW } from './types.js'

const DETECTOR_MODEL = 'claude-haiku-4-5'

export interface DetectorAgent {
  observe(round: RoundResult): Promise<readonly DetectorAlert[]>
}

// ── LLM helper ───────────────────────────────────────────────────────────────

function buildDetectorContext(stats: ReturnType<typeof computeStats>): string {
  return JSON.stringify({
    windowSize:    stats.totalRounds,
    slipRate:      Number((stats.slippedRounds / stats.totalRounds).toFixed(3)),
    novelRate:     Number((stats.novelRounds / stats.totalRounds).toFixed(3)),
    novelSlipRate: stats.novelRounds === 0
      ? 0
      : Number((stats.novelSlips / stats.novelRounds).toFixed(3)),
    meanFusedScore:   Number(stats.meanFusedScore.toFixed(4)),
    stdFusedScore:    Number(stats.stdFusedScore.toFixed(4)),
    catchThreshold:   CATCH_THRESHOLD,
    recentSlipStreak: stats.recentSlipStreak,
    categoryFreq:     stats.categoryFreq,
  })
}

const DETECTOR_SYSTEM = [
  'You are a behavioral attack pattern detector for a static-analysis security arena.',
  'You receive abstract round statistics — no source code, no credentials, no exploit strings.',
  '',
  `Catch threshold is ${CATCH_THRESHOLD}. Identify which patterns apply:`,
  '  evasion        — attacker tuning params to hover just below threshold',
  '  gap_probe      — high novelty rate, attacker probing for detection gaps',
  '  category_focus — attacker repeatedly targeting one vuln category',
  '  boundary_probe — fusedScores clustering near threshold with low variance',
  '  slip_streak    — unusual run of consecutive slips',
  '',
  'Return ONLY a JSON array (empty if no patterns):',
  '[{"pattern":"<name>","confidence":<0.0-1.0>,"evidence":"<max 160 chars, no raw values>"}]',
  'No markdown, no explanation.',
].join('\n')

type LlmPatternItem = {
  pattern: string
  confidence: number
  evidence: string
}

async function callLlmDetector(
  client: Anthropic,
  stats: ReturnType<typeof computeStats>,
): Promise<readonly DetectorAlert[]> {
  const message = await client.messages.create({
    model:      DETECTOR_MODEL,
    max_tokens: 512,
    system:     DETECTOR_SYSTEM,
    messages:   [{ role: 'user', content: buildDetectorContext(stats) }],
  })

  const block = message.content[0]
  if (!block || block.type !== 'text') return []

  const raw = block.text.match(/\[[\s\S]*\]/)
  if (!raw) return []

  const items = JSON.parse(raw[0]) as LlmPatternItem[]
  if (!Array.isArray(items)) return []

  const slipRate = stats.totalRounds === 0 ? 0 : stats.slippedRounds / stats.totalRounds

  const alerts: DetectorAlert[] = []
  for (const item of items) {
    const result = detectorAlertSchema.safeParse({
      pattern:      item.pattern,
      confidence:   item.confidence,
      evidence:     item.evidence,
      windowRounds: stats.totalRounds,
      slipRate,
      createdAt:    new Date(),
    })
    if (result.success) alerts.push(result.data)
  }
  return alerts
}

// ── Factory functions ─────────────────────────────────────────────────────────

export function createLocalDetector(): DetectorAgent {
  let snapshots: readonly RoundSnapshot[] = []

  return {
    async observe(round: RoundResult): Promise<readonly DetectorAlert[]> {
      const snap  = snapshotFromRound(round)
      snapshots   = appendSnapshot(snapshots, snap)
      const stats = computeStats(snapshots)
      return runLocalPatterns(stats)
    },
  }
}

export function createLlmDetector(): DetectorAgent {
  const client = getAnthropicClient()
  let snapshots: readonly RoundSnapshot[] = []

  return {
    async observe(round: RoundResult): Promise<readonly DetectorAlert[]> {
      const snap  = snapshotFromRound(round)
      snapshots   = appendSnapshot(snapshots, snap)
      const stats = computeStats(snapshots)

      if (stats.totalRounds < MIN_WINDOW) return []

      try {
        return await callLlmDetector(client, stats)
      } catch {
        // Graceful fallback — LLM unavailable or returned bad JSON
        return runLocalPatterns(stats)
      }
    },
  }
}
