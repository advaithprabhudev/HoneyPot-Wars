import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './errors.js';
import { logger } from './logger.js';

// Single Express error middleware: typed errors -> HTTP (CLAUDE.md §12).
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  logger.error({ err: (err as Error).message }, 'unhandled error');
  res.status(500).json({ error: 'internal server error' });
}
