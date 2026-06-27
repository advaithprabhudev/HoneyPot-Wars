import type { Socket } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents, FeedLine, ArenaMetric } from '@honeypot-wars/shared'
import { SOCKET_EVENTS, arenaStartSchema } from '@honeypot-wars/shared'
import { env } from '../config/env.js'
import { createOrchestrator, runRound } from '../orchestrator/orchestrator.js'
import { createClaudeEngine } from '../orchestrator/engines/openai.js'
import { createLocalDetector, createLlmDetector } from '../orchestrator/detector/index.js'
import type { DetectorAgent } from '../orchestrator/detector/index.js'
import type { RoundEngine } from '../orchestrator/types.js'

// Delay between rounds in milliseconds.
// Local engine is instant; LLM engine needs breathing room for API calls.
const ROUND_INTERVAL_LOCAL = 500
const ROUND_INTERVAL_LLM   = 0

type ArenaState = {
  running:     boolean
  engine:      RoundEngine
  detector:    DetectorAgent
  seenHashes:  Set<string>
  novelCaught: number
  novelTotal:  number
  totalRounds: number
  novelSlips:  number
  nextSeed:    number
  intervalMs:  number
}

function buildMetric(state: ArenaState): ArenaMetric {
  return {
    gapCoverageRate: state.novelTotal === 0 ? 0 : state.novelCaught / state.novelTotal,
    totalRounds:     state.totalRounds,
    novelSlips:      state.novelSlips,
  }
}

function buildFeedLine(round: Awaited<ReturnType<typeof runRound>>): FeedLine {
  return {
    roundId:    round.id,
    verdict:    round.verdict,
    category:   round.finding.category,
    isNovel:    round.isNovel,
    fusedScore: round.fusedScore,
    reason:     round.reason,
    createdAt:  round.createdAt,
  }
}

type ArenaSocket = Socket<ClientToServerEvents, ServerToClientEvents>

export function registerArenaHandlers(socket: ArenaSocket): void {
  let state: ArenaState | null = null
  let loopHandle: ReturnType<typeof setTimeout> | null = null

  function stopLoop(): void {
    if (loopHandle !== null) {
      clearTimeout(loopHandle)
      loopHandle = null
    }
    if (state) state.running = false
  }

  async function runOneRound(): Promise<void> {
    if (!state?.running) return

    try {
      const seed  = state.nextSeed++
      const round = await runRound(state.engine, { seed })

      // Per-connection novelty metric tracking
      if (round.isNovel) {
        state.novelTotal++
        if (round.verdict === 'caught')  state.novelCaught++
        if (round.verdict === 'slipped') state.novelSlips++
      }
      state.totalRounds++

      socket.emit(SOCKET_EVENTS.ARENA_ROUND,  round)
      socket.emit(SOCKET_EVENTS.ARENA_FEED,   buildFeedLine(round))
      socket.emit(SOCKET_EVENTS.ARENA_METRIC, buildMetric(state))

      // Detector observes the round and emits any detected attack patterns
      const alerts = await state.detector.observe(round)
      for (const alert of alerts) {
        socket.emit(SOCKET_EVENTS.DETECTOR_ALERT, alert)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'arena round failed'
      socket.emit(SOCKET_EVENTS.SCAN_ERROR, { scanId: 'arena', error: msg })
    }

    if (state?.running) {
      loopHandle = setTimeout(() => { void runOneRound() }, state.intervalMs)
    }
  }

  socket.on(SOCKET_EVENTS.ARENA_START, (payload) => {
    const parsed = arenaStartSchema.safeParse(payload)
    if (!parsed.success) {
      socket.emit(SOCKET_EVENTS.SCAN_ERROR, {
        scanId: 'arena',
        error: `Invalid arena:start payload: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
      })
      return
    }

    stopLoop()

    const { engine: engineName, seed: startSeed } = parsed.data
    const seenHashes = new Set<string>()

    const engine: RoundEngine =
      engineName === 'llm_claude'
        ? createOrchestrator({
            engine:          'llm_claude',
            isHashSeen:      (h) => seenHashes.has(h),
            getClaudeEngine: () => createClaudeEngine((h) => seenHashes.has(h)),
          })
        : createOrchestrator({
            engine:     'local',
            isHashSeen: (h) => seenHashes.has(h),
          })

    const useAnthropicDetector =
      engineName === 'llm_claude' && Boolean(env.ANTHROPIC_API_KEY)

    const detector: DetectorAgent = useAnthropicDetector
      ? createLlmDetector()
      : createLocalDetector()

    state = {
      running:     true,
      engine,
      detector,
      seenHashes,
      novelCaught: 0,
      novelTotal:  0,
      totalRounds: 0,
      novelSlips:  0,
      nextSeed:    startSeed ?? Math.floor(Math.random() * 1_000_000),
      intervalMs:  engineName === 'llm_claude' ? ROUND_INTERVAL_LLM : ROUND_INTERVAL_LOCAL,
    }

    void runOneRound()
  })

  socket.on(SOCKET_EVENTS.ARENA_STOP, () => {
    stopLoop()
  })

  socket.on('disconnect', () => {
    stopLoop()
  })
}
