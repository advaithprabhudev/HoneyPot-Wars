import express, { type Express } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { errorMiddleware } from './lib/errorMiddleware.js';

export function createApp(): Express {
  const app = express();
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: '64kb' }));
  app.use('/api', apiRouter);
  app.use(errorMiddleware);
  return app;
}
