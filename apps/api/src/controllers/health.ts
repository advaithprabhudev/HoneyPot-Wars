import type { Request, Response } from 'express';
import { isMongoConnected } from '../lib/db.js';
import { env } from '../config/env.js';

export function getHealth(_req: Request, res: Response): void {
  res.json({
    status: 'ok',
    engine: env.ARENA_ENGINE,
    mongo: isMongoConnected() ? 'connected' : 'in-memory',
    uptime: process.uptime(),
  });
}
