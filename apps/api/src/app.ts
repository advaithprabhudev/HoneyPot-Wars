import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import { getTaxonomy } from './controllers/taxonomy.js'
import { getLeaderboard } from './controllers/leaderboard.js'
import { scanRouter } from './routes/scan.js'
import { env } from './config/env.js'

export function createApp(): express.Application {
  const app = express()

  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))
  app.use(express.json())

  app.get('/api/health',      (_req, res) => { res.json({ ok: true }) })
  app.get('/api/taxonomy',    getTaxonomy)
  app.get('/api/leaderboard', (req, res, next) => { getLeaderboard(req, res).catch(next) })

  app.use('/api/scan', scanRouter)

  // Central error handler — catches errors forwarded via next(err) from any route
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ success: false, error: message })
  })

  return app
}
