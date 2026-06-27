import type { Request, Response } from 'express'
import { computeLeaderboard } from '../services/roundStore.js'

export async function getLeaderboard(req: Request, res: Response): Promise<void> {
  const windowDays = Number(req.query.windowDays ?? 7)
  if (!Number.isFinite(windowDays) || windowDays < 1) {
    res.status(400).json({ error: 'windowDays must be a positive integer' })
    return
  }
  const metric = await computeLeaderboard(windowDays)
  res.json(metric)
}
