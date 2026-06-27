import { randomUUID } from 'crypto'
import type { Socket } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents } from '@honeypot-wars/shared'
import { SOCKET_EVENTS } from '@honeypot-wars/shared'
import { extractGitHub, extractZip, cleanupDir } from './repoExtractor.js'
import { listScanableFiles, readFiles, batchByContent } from './fileAnalyzer.js'
import { runSecretsAgent } from './agents/secretsAgent.js'
import { runInjectionAgent } from './agents/injectionAgent.js'
import { runConfigAgent } from './agents/configAgent.js'
import { runDependencyAgent } from './agents/dependencyAgent.js'
import * as store from './scanStore.js'

type ScanSocket = Socket<ClientToServerEvents, ServerToClientEvents>

export type ScanInput =
  | { type: 'github'; repoUrl: string; token: string }
  | { type: 'zip'; buffer: Buffer; originalName: string }

export function startScan(input: ScanInput, socket: ScanSocket): string {
  const scanId = randomUUID()
  // Fire-and-forget — client tracks progress via Socket.IO events
  void runScanPipeline(scanId, input, socket)
  return scanId
}

async function runScanPipeline(
  scanId: string,
  input: ScanInput,
  socket: ScanSocket,
): Promise<void> {
  let extractedDir: string | null = null

  try {
    // ── 1. Create job ─────────────────────────────────────────────────────────
    store.createJob(scanId, 'Extracting…')
    store.updateStatus(scanId, 'extracting')

    socket.emit(SOCKET_EVENTS.SCAN_PROGRESS, {
      scanId,
      status: 'extracting',
      scannedFiles: 0,
      totalFiles: 0,
    })

    // ── 2. Extract repo ───────────────────────────────────────────────────────
    let repoName: string

    if (input.type === 'github') {
      const result = await extractGitHub(input.repoUrl, input.token)
      extractedDir = result.dir
      repoName = result.name
    } else {
      const result = await extractZip(input.buffer, input.originalName)
      extractedDir = result.dir
      repoName = result.name
    }

    // Patch the job with the real repo name now that we know it
    store.updateRepoName(scanId, repoName)
    store.updateStatus(scanId, 'scanning')

    // ── 3. List scannable files ───────────────────────────────────────────────
    const allFiles = await listScanableFiles(extractedDir)
    store.setTotalFiles(scanId, allFiles.length)
    store.updateStatus(scanId, 'scanning')

    socket.emit(SOCKET_EVENTS.SCAN_PROGRESS, {
      scanId,
      status: 'scanning',
      scannedFiles: 0,
      totalFiles: allFiles.length,
    })

    // ── 4. Read files and create content-aware batches ────────────────────────
    const entries = await readFiles(allFiles, extractedDir)
    const batches = batchByContent(entries)

    // ── 5. Run all 4 agents in parallel per batch ─────────────────────────────
    for (const batch of batches) {
      const [secretsFindings, injectionFindings, configFindings, depFindings] =
        await Promise.all([
          runSecretsAgent(batch),
          runInjectionAgent(batch),
          runConfigAgent(batch),
          runDependencyAgent(batch),
        ])

      const batchFindings = [...secretsFindings, ...injectionFindings, ...configFindings, ...depFindings]

      store.addFindings(scanId, batchFindings)
      store.incrementScanned(scanId, batch.length)

      const updated = store.getJob(scanId)

      // Stream each finding to the client immediately
      for (const finding of batchFindings) {
        socket.emit(SOCKET_EVENTS.SCAN_FINDING, finding)
      }

      socket.emit(SOCKET_EVENTS.SCAN_PROGRESS, {
        scanId,
        status: 'scanning',
        file: batch.at(-1)?.relativePath,
        scannedFiles: updated?.scannedFiles ?? 0,
        totalFiles: updated?.totalFiles ?? 0,
      })
    }

    // ── 6. Complete ───────────────────────────────────────────────────────────
    store.updateStatus(scanId, 'synthesizing')
    const completedJob = store.completeJob(scanId)
    socket.emit(SOCKET_EVENTS.SCAN_COMPLETE, { scanId, job: completedJob })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown scan error'
    store.failJob(scanId, message)
    socket.emit(SOCKET_EVENTS.SCAN_ERROR, { scanId, error: message })
  } finally {
    // Source files never persist beyond the scan session — always clean up (§A.3)
    if (extractedDir) {
      await cleanupDir(extractedDir)
    }
  }
}
