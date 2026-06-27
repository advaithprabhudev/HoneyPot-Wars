import type { RoundResult, FeedLine, ArenaMetric, RealFinding, ScanJob, DetectorAlert } from './types.js'

// All socket event names live here — never hard-code strings elsewhere.
export const SOCKET_EVENTS = {
  // Client → Server (arena game)
  ARENA_START:    'arena:start',
  ARENA_STOP:     'arena:stop',
  PLAYER_ATTACK:  'player:attack',
  SCAN_UPLOAD:    'scan:upload',
  // Server → Client (arena game)
  ARENA_ROUND:    'arena:round',
  ARENA_FEED:     'arena:feed',
  ARENA_METRIC:   'arena:metric',
  // Client → Server (real scan agent)
  REAL_SCAN_START: 'real:scan:start',
  REAL_SCAN_STOP:  'real:scan:stop',
  // Server → Client (real scan agent)
  SCAN_PROGRESS:   'scan:progress',
  SCAN_FINDING:    'scan:finding',
  SCAN_COMPLETE:   'scan:complete',
  SCAN_ERROR:      'scan:error',
  // Server → Client (detector)
  DETECTOR_ALERT:  'detector:alert',
} as const

export type SocketEvents = typeof SOCKET_EVENTS
export type SocketEventName = SocketEvents[keyof SocketEvents]

// ── Event payload types ──────────────────────────────────────────────────────

export type ArenaStartPayload = {
  engine: 'local' | 'llm_openai'
  seed?: number
}

export type PlayerAttackPayload = {
  category: string
  params: Record<string, number>
}

export type ScanUploadPayload = {
  fileName:    string
  chunkIndex:  number
  totalChunks: number
  data:        string
}

export type ScanProgressPayload = {
  file:   string
  status: 'scanning' | 'done' | 'error'
}

// ── Typed socket maps (for socket.io generics) ────────────────────────────────

export type RealScanStartPayload = {
  type: 'github'
  repoUrl: string
  token: string
} | {
  type: 'zip'
  scanId: string // pre-assigned ID from the HTTP upload endpoint
}

export type RealScanProgressPayload = {
  scanId: string
  status: string
  file?: string
  scannedFiles: number
  totalFiles: number
}

export type RealScanCompletePayload = {
  scanId: string
  job: ScanJob
}

export type RealScanErrorPayload = {
  scanId: string
  error: string
}

export interface ClientToServerEvents {
  'arena:start':     (payload: ArenaStartPayload) => void
  'arena:stop':      (payload: Record<string, never>) => void
  'player:attack':   (payload: PlayerAttackPayload) => void
  'scan:upload':     (payload: ScanUploadPayload) => void
  'real:scan:start': (payload: RealScanStartPayload) => void
  'real:scan:stop':  (payload: { scanId: string }) => void
}

export interface ServerToClientEvents {
  'arena:round':    (payload: RoundResult) => void
  'arena:feed':     (payload: FeedLine) => void
  'arena:metric':   (payload: ArenaMetric) => void
  'scan:progress':  (payload: RealScanProgressPayload) => void
  'scan:finding':   (payload: RealFinding) => void
  'scan:complete':  (payload: RealScanCompletePayload) => void
  'scan:error':     (payload: RealScanErrorPayload) => void
  'detector:alert': (payload: DetectorAlert) => void
}
