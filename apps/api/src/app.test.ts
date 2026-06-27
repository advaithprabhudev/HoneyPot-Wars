import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';

const app = createApp();

describe('REST API', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/taxonomy returns archetypes and agents', async () => {
    const res = await request(app).get('/api/taxonomy');
    expect(res.status).toBe(200);
    expect(res.body.archetypes).toContain('advance_fee');
    expect(res.body.agents).toContain('seller_graph');
  });

  it('GET /api/leaderboard returns a metric shape', async () => {
    const res = await request(app).get('/api/leaderboard?windowDays=7');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('detectionRate');
    expect(res.body).toHaveProperty('totalRounds');
  });

  it('GET /api/rounds returns an array', async () => {
    const res = await request(app).get('/api/rounds?limit=10');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/contact rejects an invalid payload with 400', async () => {
    const res = await request(app).post('/api/contact').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  it('POST /api/contact accepts a valid payload', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ name: 'Ada', email: 'ada@example.com', message: 'Send the coverage report.' });
    expect(res.status).toBe(201);
    expect(res.body.received).toBe(true);
  });
});
