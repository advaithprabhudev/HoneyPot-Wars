import type { Request, Response } from 'express';
import { computeLeaderboard } from '../services/roundStore.js';

export function getLeaderboard(req: Request, res: Response): void {
  const windowDays = Math.max(1, Math.min(365, Number(req.query.windowDays) || 7));
  res.json(computeLeaderboard(windowDays));
}
