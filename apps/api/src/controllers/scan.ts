import type { Request, Response } from 'express'
import { z } from 'zod'
import { getJob } from '../services/scanStore.js'

const githubScanSchema = z.object({
  repoUrl: z.string().url().startsWith('https://github.com/'),
  token: z.string().min(1),
})

export function handleGetScanReport(req: Request, res: Response): void {
  const { scanId } = req.params
  const job = getJob(scanId)

  if (!job) {
    res.status(404).json({ success: false, error: 'Scan not found' })
    return
  }

  if (job.status === 'error') {
    res.status(500).json({ success: false, error: job.error ?? 'Scan failed' })
    return
  }

  res.json({ success: true, data: job })
}

export function handleGitHubScanValidate(req: Request, res: Response): void {
  const result = githubScanSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ success: false, error: result.error.flatten().fieldErrors })
    return
  }
  res.json({ success: true, data: { validated: true } })
}
