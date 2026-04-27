const request = require('supertest');
const { createApp } = require('../src/app');
const { initDb } = require('../src/db/database');
const jwt = require('jsonwebtoken');

let app, token;

beforeAll(() => {
  process.env.JWT_SECRET = 'test_secret';
  initDb(':memory:');
  app = createApp();
});

beforeEach(async () => {
  const res = await request(app).post('/auth/register').send({ email: `u${Date.now()}@t.com`, password: 'pass' });
  token = res.body.token;
});

const searchPayload = {
  origin: 'MAD', destination: 'LHR',
  departDate: '2026-06-15', returnDate: '2026-06-22',
  passengers: 2, frequencyHours: 6
};

test('POST /searches creates search', async () => {
  const res = await request(app).post('/searches').set('Authorization', `Bearer ${token}`).send(searchPayload);
  expect(res.status).toBe(201);
  expect(res.body.search.origin).toBe('MAD');
  expect(res.body.search.status).toBe('active');
});

test('GET /searches returns user searches', async () => {
  await request(app).post('/searches').set('Authorization', `Bearer ${token}`).send(searchPayload);
  const res = await request(app).get('/searches').set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(200);
  expect(res.body.searches.length).toBeGreaterThan(0);
});

test('PUT /searches/:id can pause search', async () => {
  const create = await request(app).post('/searches').set('Authorization', `Bearer ${token}`).send(searchPayload);
  const id = create.body.search.id;
  const res = await request(app).put(`/searches/${id}`).set('Authorization', `Bearer ${token}`).send({ status: 'paused' });
  expect(res.status).toBe(200);
  expect(res.body.search.status).toBe('paused');
});

test('DELETE /searches/:id removes search', async () => {
  const create = await request(app).post('/searches').set('Authorization', `Bearer ${token}`).send(searchPayload);
  const id = create.body.search.id;
  const res = await request(app).delete(`/searches/${id}`).set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(200);
});

test('GET /searches/:id/history returns price records', async () => {
  const create = await request(app).post('/searches').set('Authorization', `Bearer ${token}`).send(searchPayload);
  const id = create.body.search.id;
  const res = await request(app).get(`/searches/${id}/history`).set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body.records)).toBe(true);
});
