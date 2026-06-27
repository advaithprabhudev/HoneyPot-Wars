import express from 'express'
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
  app.get('/api/leaderboard', (req, res) => { void getLeaderboard(req, res) })

  app.use('/api/scan', scanRouter)

  return app
}
