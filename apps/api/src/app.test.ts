import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { createApp } from './app.js'

// Mock Supabase so leaderboard endpoint doesn't need a real DB connection
vi.mock('./lib/supabase.js', () => ({
  supabase: {},
  getGapCoverageRate: vi.fn().mockResolvedValue({
    gapCoverageRate: 0.85,
    totalRounds: 100,
    novelSlips: 15,
  }),
  insertRound: vi.fn(),
  fingerprintHashExists: vi.fn().mockResolvedValue(false),
  getRecentRounds: vi.fn().mockResolvedValue([]),
}))

const app = createApp()

describe('GET /api/taxonomy', () => {
  it('returns categories, agents, and paramKeys arrays', async () => {
    const res = await request(app).get('/api/taxonomy')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.categories)).toBe(true)
    expect(res.body.categories).toContain('hardcoded_secret')
    expect(res.body.categories).toContain('injection_vector')
    expect(res.body.agents).toContain('secrets')
    expect(res.body.paramKeys).toContain('entropy')
    expect(res.body.paramKeys).toContain('cvssScore')
  })

  it('does not include old fraud-domain fields', async () => {
    const res = await request(app).get('/api/taxonomy')
    expect(res.body).not.toHaveProperty('archetypes')
    expect(JSON.stringify(res.body)).not.toContain('advance_fee')
  })
})

describe('GET /api/leaderboard', () => {
  it('returns gapCoverageRate (not detectionRate)', async () => {
    const res = await request(app).get('/api/leaderboard')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('gapCoverageRate')
    expect(res.body).not.toHaveProperty('detectionRate')
    expect(typeof res.body.gapCoverageRate).toBe('number')
  })

  it('returns totalRounds and novelSlips', async () => {
    const res = await request(app).get('/api/leaderboard')
    expect(res.body).toHaveProperty('totalRounds')
    expect(res.body).toHaveProperty('novelSlips')
  })

  it('rejects non-positive windowDays with 400', async () => {
    const res = await request(app).get('/api/leaderboard?windowDays=0')
    expect(res.status).toBe(400)
  })
})
