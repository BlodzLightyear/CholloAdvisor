const request = require('supertest');
const { createApp } = require('../src/app');
const { initDb } = require('../src/db/database');

let app;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_secret';
  await initDb(':memory:');
  app = createApp();
});

test('POST /auth/register creates user and returns token', async () => {
  const res = await request(app)
    .post('/auth/register')
    .send({ email: 'test@test.com', password: 'password123' });
  expect(res.status).toBe(201);
  expect(res.body.token).toBeDefined();
  expect(res.body.user.email).toBe('test@test.com');
});

test('POST /auth/register rejects duplicate email', async () => {
  await request(app).post('/auth/register').send({ email: 'dup@test.com', password: 'pass' });
  const res = await request(app).post('/auth/register').send({ email: 'dup@test.com', password: 'pass' });
  expect(res.status).toBe(409);
});

test('POST /auth/login returns token for valid credentials', async () => {
  await request(app).post('/auth/register').send({ email: 'login@test.com', password: 'mypass' });
  const res = await request(app).post('/auth/login').send({ email: 'login@test.com', password: 'mypass' });
  expect(res.status).toBe(200);
  expect(res.body.token).toBeDefined();
});

test('POST /auth/login rejects wrong password', async () => {
  const res = await request(app).post('/auth/login').send({ email: 'login@test.com', password: 'wrong' });
  expect(res.status).toBe(401);
});
