/**
 * OpenAI LLM engine.
 * Engine discriminant: 'llm_openai'
 *
 * Pipeline: scanner → [secrets, injection, config, dependency] → fuse → referee
 * Model assignment:
 *   Scanner    : gpt-4o       (structured param generation within taxonomy bounds)
 *   4 Defenders: gpt-4o-mini  (fast, parallel, high-volume scoring)
 *   Referee    : gpt-4o       (novelty + fusion judgement)
 */

import type OpenAI from 'openai'
import {
  VULN_CATEGORIES,
  AGENT_PARAMS,
  vulnFindingSchema,
  agentVerdictOutputSchema,
  refereeOutputSchema,
} from '@honeypot-wars/shared'
import type { VulnFinding, AgentVerdict, AgentName, VulnCategory, RoundResult } from '@honeypot-wars/shared'
import { CATCH_THRESHOLD, CATEGORY_LABELS, AGENT_LABELS } from '@honeypot-wars/shared'
import { getOpenAIClient } from '../../lib/openai.js'
import { MAX_GENERATE_ATTEMPTS } from '../../config/weights.js'
import { mulberry32 } from '../../lib/rng.js'
import { fingerprintHash } from '../hash.js'
import { fuse } from '../fusion.js'
import { localSignal } from '../agents/localScoring.js'
import type { RoundEngine, ScorerAgent, RoundContext } from '../types.js'

// ── Models ───────────────────────────────────────────────────────────────────

const SCANNER_MODEL  = 'gpt-4o'
const DEFENDER_MODEL = 'gpt-4o-mini'
const REFEREE_MODEL  = 'gpt-4o'

// ── Prompt builders ──────────────────────────────────────────────────────────

function scannerSystemPrompt(category: VulnCategory): string {
  const paramList = (Object.values(AGENT_PARAMS) as string[][]).flat().join(', ')
  return [
    'You are a static-analysis vulnerability parameter generator for a security-research training system.',
    'Output ONLY abstract numeric risk parameters — no exploit strings, no shellcode, no credentials,',
    'no SQL payloads, no real file paths, no deployable artifact of any kind.',
    '',
    `Vulnerability category: ${category}`,
    `All 16 param keys (floats 0.0-1.0): ${paramList}`,
    '',
    'Respond with ONLY valid JSON:',
    `{"category":"${category}","params":{"<param>":<0.0-1.0>,...},"severity":"critical"|"high"|"medium"|"low"}`,
    'No markdown, no explanation, no extra fields.',
  ].join('\n')
}

function agentSystemPrompt(agentName: AgentName): string {
  const owned = AGENT_PARAMS[agentName].join(', ')
  return [
    `You are the '${agentName}' static-analysis detector.`,
    `Score ONLY these abstract security knobs: ${owned}.`,
    'Reply JSON: {"confidence":<0.0-1.0>,"signal":"<160 chars max, no raw values>"}',
  ].join('\n')
}

function refereeSystemPrompt(): string {
  return [
    'You are the static-analysis coverage referee.',
    `Threshold: ${CATCH_THRESHOLD}. fusedScore >= ${CATCH_THRESHOLD} => caught, else slipped.`,
    'For caught: name the highest-confidence agent. For slipped: explain why agents scored low.',
    'Return ONLY JSON: {"verdict":"caught"|"slipped","reason":"<150 chars max>"}',
  ].join('\n')
}

function refereeUserPrompt(fusedScore: number, verdicts: AgentVerdict[]): string {
  const summary = verdicts
    .map((v) => `${v.agent}:${v.confidence.toFixed(3)}`)
    .join(', ')
  return `fusedScore=${fusedScore.toFixed(4)} | ${summary}`
}

// ── OpenAI call helper ───────────────────────────────────────────────────────

async function callOpenAI(
  client: OpenAI,
  model: string,
  system: string,
  user: string,
): Promise<string> {
  const completion = await client.chat.completions.create({
    model,
    max_tokens: 512,
    messages: [
      { role: 'system', content: system },
      { role: 'user',   content: user },
    ],
  })
  const text = completion.choices[0]?.message?.content
  if (!text) {
    throw new Error('openai: empty or missing content in response')
  }
  return text
}

function extractJSON(raw: string): unknown {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(`openai: no JSON object in response: ${raw.slice(0, 120)}`)
  return JSON.parse(match[0])
}

// ── Scanner ──────────────────────────────────────────────────────────────────

async function runScanner(
  client: OpenAI,
  category: VulnCategory,
  seedParams: Record<string, number>,
): Promise<VulnFinding> {
  for (let attempt = 1; attempt <= MAX_GENERATE_ATTEMPTS; attempt++) {
    const raw = await callOpenAI(client, SCANNER_MODEL, scannerSystemPrompt(category), 'Generate.')
    try {
      const parsed = extractJSON(raw) as Record<string, unknown>
      const finding: VulnFinding = {
        category,
        params:          parsed.params as Record<string, number>,
        fingerprintHash: fingerprintHash(seedParams),
        location:        { file: '[llm-extracted]', line: 0 },
        severity:        (parsed.severity as VulnFinding['severity']) ?? 'high',
      }
      return vulnFindingSchema.parse(finding)
    } catch {
      if (attempt === MAX_GENERATE_ATTEMPTS) {
        throw new Error(`openai scanner: ${MAX_GENERATE_ATTEMPTS} attempts exhausted for ${category}`)
      }
    }
  }
  throw new Error('openai scanner: unreachable')
}

// ── Scoring agents ───────────────────────────────────────────────────────────

function createDefenderAgent(client: OpenAI, agentName: AgentName): ScorerAgent {
  return {
    name: agentName,
    async score(finding: VulnFinding, _ctx: RoundContext): Promise<AgentVerdict> {
      const owned = AGENT_PARAMS[agentName]
      const ownedParams: Record<string, number> = {}
      for (const k of owned) {
        ownedParams[k] = finding.params[k] ?? 0
      }

      try {
        const raw = await callOpenAI(
          client,
          DEFENDER_MODEL,
          agentSystemPrompt(agentName),
          JSON.stringify(ownedParams),
        )
        const parsed = agentVerdictOutputSchema.parse(extractJSON(raw))
        return {
          agent:      agentName,
          confidence: parsed.confidence,
          flagged:    parsed.confidence >= 0.5,
          signal:     parsed.signal,
        }
      } catch {
        return {
          agent:      agentName,
          confidence: 0,
          flagged:    false,
          signal:     localSignal(agentName, finding),
        }
      }
    },
  }
}

// ── Referee ──────────────────────────────────────────────────────────────────

async function runReferee(
  client: OpenAI,
  fusedScore: number,
  verdicts: AgentVerdict[],
  finding: VulnFinding,
  isNovel: boolean,
): Promise<{ verdict: 'caught' | 'slipped'; reason: string }> {
  try {
    const raw = await callOpenAI(
      client,
      REFEREE_MODEL,
      refereeSystemPrompt(),
      refereeUserPrompt(fusedScore, verdicts),
    )
    return refereeOutputSchema.parse(extractJSON(raw))
  } catch {
    const caught = fusedScore >= CATCH_THRESHOLD
    const novelTag = isNovel ? 'novel' : 'repeat'
    const top = verdicts.reduce((best, v) => v.confidence > best.confidence ? v : best)
    return {
      verdict: caught ? 'caught' : 'slipped',
      reason:  caught
        ? `${AGENT_LABELS[top.agent]} flagged ${CATEGORY_LABELS[finding.category]} (${novelTag})`
        : `${CATEGORY_LABELS[finding.category]} (${novelTag}) slipped — fused ${fusedScore.toFixed(2)}`,
    }
  }
}

// ── Engine factory ───────────────────────────────────────────────────────────

export function createOpenAIEngine(
  isHashSeen: (hash: string) => boolean,
): RoundEngine {
  const client = getOpenAIClient()

  const defenders: ScorerAgent[] = [
    createDefenderAgent(client, 'secrets'),
    createDefenderAgent(client, 'injection'),
    createDefenderAgent(client, 'config'),
    createDefenderAgent(client, 'dependency'),
  ]

  return {
    async runRound({ seed, category }: { seed: number; category?: VulnCategory }): Promise<RoundResult> {
      const rng = mulberry32(seed)
      const ctx = { rng, seed }

      const resolvedCategory: VulnCategory =
        category ?? VULN_CATEGORIES[Math.floor(rng() * VULN_CATEGORIES.length)]

      // Seed params — used for fingerprint only; raw source discarded after hash (§A.3)
      const seedParams: Record<string, number> = {}
      for (const agentKey of Object.keys(AGENT_PARAMS) as AgentName[]) {
        for (const paramKey of AGENT_PARAMS[agentKey]) {
          seedParams[paramKey] = rng()
        }
      }
      const hash = fingerprintHash(seedParams)

      const rawFinding = await runScanner(client, resolvedCategory, seedParams)
      const finding: VulnFinding = { ...rawFinding, fingerprintHash: hash }

      const isNovel = !isHashSeen(finding.fingerprintHash)

      // Defenders in parallel — never serial (CLAUDE.md §G)
      const settled = await Promise.allSettled(defenders.map((d) => d.score(finding, ctx)))
      const verdicts: AgentVerdict[] = settled.map((r, i) =>
        r.status === 'fulfilled'
          ? r.value
          : {
              agent:      defenders[i].name,
              confidence: 0,
              flagged:    false,
              signal:     'agent error — sentinel',
            },
      )

      const fusedScore = fuse(verdicts)

      const { verdict, reason } = await runReferee(
        client,
        fusedScore,
        verdicts,
        finding,
        isNovel,
      )

      return {
        id:        `${seed}-${finding.fingerprintHash.slice(0, 8)}`,
        seed,
        engine:    'llm_openai',
        finding,
        verdicts,
        fusedScore,
        verdict,
        isNovel,
        reason,
        createdAt: new Date(),
      }
    },
  }
}
