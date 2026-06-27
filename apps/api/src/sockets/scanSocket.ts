import type { Socket } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents } from '@honeypot-wars/shared'
import { SOCKET_EVENTS } from '@honeypot-wars/shared'
import { z } from 'zod'
import { startScan } from '../services/scanOrchestrator.js'
import { claimPendingUpload } from '../services/scanStore.js'

type ScanSocket = Socket<ClientToServerEvents, ServerToClientEvents>

const githubStartSchema = z.object({
  type: z.literal('github'),
  repoUrl: z.string().url().startsWith('https://github.com/'),
  token: z.string().min(1),
})

const realScanStartSchema = z.union([
  githubStartSchema,
  z.object({ type: z.literal('zip'), scanId: z.string().min(1) }),
])

export function registerScanHandlers(socket: ScanSocket): void {
  socket.on(SOCKET_EVENTS.REAL_SCAN_START, (payload) => {
    const result = realScanStartSchema.safeParse(payload)
    if (!result.success) {
      socket.emit(SOCKET_EVENTS.SCAN_ERROR, {
        scanId: 'unknown',
        error: `Invalid scan payload: ${JSON.stringify(result.error.flatten().fieldErrors)}`,
      })
      return
    }

    const input = result.data
    if (input.type === 'github') {
      startScan({ type: 'github', repoUrl: input.repoUrl, token: input.token }, socket)
    } else {
      const pending = claimPendingUpload(input.scanId)
      if (!pending) {
        socket.emit(SOCKET_EVENTS.SCAN_ERROR, {
          scanId: input.scanId,
          error: 'Upload not found or expired. Please re-upload your ZIP file.',
        })
        return
      }
      startScan({ type: 'zip', buffer: pending.buffer, originalName: pending.originalName }, socket)
    }
  })
}
