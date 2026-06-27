import type { Request, Response } from 'express';
import { listRounds } from '../services/roundStore.js';

export function getRounds(req: Request, res: Response): void {
  const limit = Math.max(1, Math.min(200, Number(req.query.limit) || 50));
  const novelOnly = req.query.novelOnly === 'true';
  res.json(listRounds(limit, novelOnly));
}
