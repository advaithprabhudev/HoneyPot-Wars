import type { ScanJob, RealFinding, ScanStatus, ScanSummary } from '@honeypot-wars/shared'

// In-memory store for active scan jobs — ephemeral, not persisted across restarts
const jobs = new Map<string, ScanJob>()

// Pending ZIP uploads awaiting Socket.IO scan initiation — auto-expire after 5 min
const pendingUploads = new Map<string, { buffer: Buffer; originalName: string }>()

export function storePendingUpload(token: string, buffer: Buffer, originalName: string): void {
  pendingUploads.set(token, { buffer, originalName })
  setTimeout(() => pendingUploads.delete(token), 5 * 60 * 1000)
}

export function claimPendingUpload(token: string): { buffer: Buffer; originalName: string } | undefined {
  const upload = pendingUploads.get(token)
  if (!upload) return undefined
  pendingUploads.delete(token)
  return upload
}

function computeSummary(findings: RealFinding[]): ScanSummary {
  const summary: ScanSummary = { critical: 0, high: 0, medium: 0, low: 0, total: findings.length }
  for (const f of findings) {
    summary[f.severity]++
  }
  return summary
}

export function createJob(scanId: string, repoName: string): ScanJob {
  const job: ScanJob = {
    scanId,
    status: 'pending',
    repoName,
    totalFiles: 0,
    scannedFiles: 0,
    findings: [],
    summary: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
    startedAt: new Date(),
  }
  jobs.set(scanId, job)
  return job
}

export function updateStatus(scanId: string, status: ScanStatus): void {
  const job = jobs.get(scanId)
  if (!job) return
  jobs.set(scanId, { ...job, status })
}

export function setTotalFiles(scanId: string, totalFiles: number): void {
  const job = jobs.get(scanId)
  if (!job) return
  jobs.set(scanId, { ...job, totalFiles })
}

export function incrementScanned(scanId: string, count: number): void {
  const job = jobs.get(scanId)
  if (!job) return
  jobs.set(scanId, { ...job, scannedFiles: job.scannedFiles + count })
}

export function addFindings(scanId: string, newFindings: RealFinding[]): void {
  const job = jobs.get(scanId)
  if (!job) return
  const findings = [...job.findings, ...newFindings]
  jobs.set(scanId, { ...job, findings, summary: computeSummary(findings) })
}

export function completeJob(scanId: string): ScanJob {
  const job = jobs.get(scanId)
  if (!job) throw new Error(`scanStore: job ${scanId} not found`)
  const completed: ScanJob = { ...job, status: 'done', completedAt: new Date() }
  jobs.set(scanId, completed)
  return completed
}

export function failJob(scanId: string, error: string): void {
  const job = jobs.get(scanId)
  if (!job) return
  jobs.set(scanId, { ...job, status: 'error', error, completedAt: new Date() })
}

export function getJob(scanId: string): ScanJob | undefined {
  return jobs.get(scanId)
}

export function deleteJob(scanId: string): void {
  jobs.delete(scanId)
}
