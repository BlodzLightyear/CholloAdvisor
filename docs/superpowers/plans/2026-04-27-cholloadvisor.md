# CholloAdvisor - Flight Price Monitor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React Native + Expo mobile app with Node.js backend that monitors flight prices and sends push notifications when prices drop.

**Architecture:** Mobile app (Expo) talks to Express backend via REST API. Backend runs cron jobs that query Amadeus API, stores price history in SQLite, and sends FCM push notifications when prices drop below threshold.

**Tech Stack:** React Native, Expo ~51, React Navigation 6, React Native Chart Kit, Axios, AsyncStorage (mobile) | Node.js 20, Express 4, better-sqlite3, node-cron, firebase-admin, jsonwebtoken, bcryptjs (backend)

---

## File Structure

```
CholloAdvisor/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── database.js          # SQLite connection singleton
│   │   │   └── migrations.js        # Schema creation on startup
│   │   ├── models/
│   │   │   ├── userModel.js         # User CRUD
│   │   │   ├── searchModel.js       # FlightSearch CRUD
│   │   │   └── priceModel.js        # PriceRecord CRUD + stats
│   │   ├── routes/
│   │   │   ├── auth.js              # POST /auth/register, POST /auth/login
│   │   │   ├── searches.js          # CRUD /searches
│   │   │   └── prices.js            # GET /prices/:id/stats
│   │   ├── middleware/
│   │   │   └── requireAuth.js       # JWT verification middleware
│   │   ├── services/
│   │   │   ├── amadeusService.js    # Amadeus API wrapper
│   │   │   ├── fcmService.js        # Firebase Cloud Messaging
│   │   │   └── priceMonitor.js      # Cron + price comparison logic
│   │   └── app.js                   # Express app factory
│   ├── index.js                     # Entry point, starts server + cron
│   ├── package.json
│   └── .env.example
├── mobile/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js            # Axios instance with JWT interceptor
│   │   ├── screens/
│   │   │   ├── LoginScreen.js
│   │   │   ├── RegisterScreen.js
│   │   │   ├── SearchFormScreen.js
│   │   │   ├── ActiveSearchesScreen.js
│   │   │   ├── PriceHistoryScreen.js
│   │   │   ├── NotificationsScreen.js
│   │   │   └── SettingsScreen.js
│   │   ├── components/
│   │   │   ├── SearchCard.js
│   │   │   ├── PriceChart.js
│   │   │   ├── AirportAutocomplete.js
│   │   │   └── PriceHistoryTable.js
│   │   ├── navigation/
│   │   │   └── AppNavigator.js
│   │   ├── store/
│   │   │   ├── authStore.js         # AsyncStorage + JWT state
│   │   │   └── settingsStore.js     # Default frequency, alert threshold
│   │   └── utils/
│   │       └── fcmSetup.js          # FCM token registration
│   ├── App.js
│   ├── app.json
│   └── package.json
└── docs/
    └── superpowers/plans/
        └── 2026-04-27-cholloadvisor.md
```

---

## Task 1: Backend — Project Scaffold

**Files:**
- Create: `backend/package.json`
- Create: `backend/.env.example`
- Create: `backend/index.js`
- Create: `backend/src/app.js`

- [ ] **Step 1: Create backend/package.json**

```json
{
  "name": "cholloadvisor-backend",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest --runInBand"
  },
  "dependencies": {
    "axios": "^1.7.2",
    "bcryptjs": "^2.4.3",
    "better-sqlite3": "^9.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "firebase-admin": "^12.2.0",
    "jsonwebtoken": "^9.0.2",
    "node-cron": "^3.0.3"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.1.3",
    "supertest": "^7.0.0"
  }
}
```

- [ ] **Step 2: Create backend/.env.example**

```env
PORT=3000
JWT_SECRET=change_this_secret_key_in_production
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@your-project.iam.gserviceaccount.com
```

- [ ] **Step 3: Create backend/src/app.js**

```js
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/searches');
const priceRoutes = require('./routes/prices');

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/auth', authRoutes);
  app.use('/searches', searchRoutes);
  app.use('/prices', priceRoutes);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  return app;
}

module.exports = { createApp };
```

- [ ] **Step 4: Create backend/index.js**

```js
require('dotenv').config();
const { createApp } = require('./src/app');
const { initDb } = require('./src/db/database');
const { startPriceMonitor } = require('./src/services/priceMonitor');

const PORT = process.env.PORT || 3000;

initDb();
const app = createApp();
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
startPriceMonitor();
```

- [ ] **Step 5: Install dependencies and verify server starts**

```bash
cd backend && cp .env.example .env && npm install
node index.js
```

Expected: `Backend running on port 3000`

---

## Task 2: Backend — Database Schema

**Files:**
- Create: `backend/src/db/database.js`
- Create: `backend/src/db/migrations.js`

- [ ] **Step 1: Write test**

Create `backend/tests/db.test.js`:

```js
const { initDb, getDb } = require('../src/db/database');

describe('database', () => {
  beforeAll(() => initDb(':memory:'));

  test('users table exists', () => {
    const db = getDb();
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    expect(row).toBeDefined();
  });

  test('flight_searches table exists', () => {
    const db = getDb();
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='flight_searches'").get();
    expect(row).toBeDefined();
  });

  test('price_records table exists', () => {
    const db = getDb();
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='price_records'").get();
    expect(row).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd backend && npx jest tests/db.test.js --no-coverage
```

Expected: `Cannot find module '../src/db/database'`

- [ ] **Step 3: Create backend/src/db/migrations.js**

```js
function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      fcm_token TEXT,
      alert_threshold_euros REAL DEFAULT 10,
      default_frequency_hours INTEGER DEFAULT 6,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS flight_searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      depart_date TEXT NOT NULL,
      return_date TEXT,
      passengers INTEGER NOT NULL DEFAULT 1,
      is_multidestino INTEGER NOT NULL DEFAULT 0,
      frequency_hours INTEGER NOT NULL DEFAULT 6,
      status TEXT NOT NULL DEFAULT 'active',
      best_price_euros REAL,
      best_price_airline TEXT,
      best_price_url TEXT,
      last_checked_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS price_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      search_id INTEGER NOT NULL REFERENCES flight_searches(id) ON DELETE CASCADE,
      price_euros REAL NOT NULL,
      airline TEXT NOT NULL,
      flight_url TEXT,
      recorded_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      search_id INTEGER NOT NULL REFERENCES flight_searches(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      price_euros REAL NOT NULL,
      airline TEXT NOT NULL,
      flight_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

module.exports = { runMigrations };
```

- [ ] **Step 4: Create backend/src/db/database.js**

```js
const Database = require('better-sqlite3');
const { runMigrations } = require('./migrations');

let db;

function initDb(path = './cholloadvisor.db') {
  db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  runMigrations(db);
}

function getDb() {
  if (!db) throw new Error('DB not initialized. Call initDb() first.');
  return db;
}

module.exports = { initDb, getDb };
```

- [ ] **Step 5: Run test — expect PASS**

```bash
cd backend && npx jest tests/db.test.js --no-coverage
```

Expected: 3 tests pass.

- [ ] **Step 6: Commit**

```bash
cd backend && git add -A && git commit -m "feat: backend scaffold + SQLite schema"
```

---

## Task 3: Backend — User Model + Auth Routes

**Files:**
- Create: `backend/src/models/userModel.js`
- Create: `backend/src/middleware/requireAuth.js`
- Create: `backend/src/routes/auth.js`

- [ ] **Step 1: Write tests**

Create `backend/tests/auth.test.js`:

```js
const request = require('supertest');
const { createApp } = require('../src/app');
const { initDb } = require('../src/db/database');

let app;

beforeAll(() => {
  process.env.JWT_SECRET = 'test_secret';
  initDb(':memory:');
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
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd backend && npx jest tests/auth.test.js --no-coverage
```

Expected: 404 or route not found errors.

- [ ] **Step 3: Create backend/src/models/userModel.js**

```js
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');

function createUser(email, password) {
  const db = getDb();
  const passwordHash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
  const result = stmt.run(email, passwordHash);
  return findUserById(result.lastInsertRowid);
}

function findUserByEmail(email) {
  return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email);
}

function findUserById(id) {
  return getDb().prepare('SELECT id, email, fcm_token, alert_threshold_euros, default_frequency_hours, created_at FROM users WHERE id = ?').get(id);
}

function updateUserFcmToken(userId, fcmToken) {
  getDb().prepare('UPDATE users SET fcm_token = ? WHERE id = ?').run(fcmToken, userId);
}

function updateUserSettings(userId, { alertThresholdEuros, defaultFrequencyHours }) {
  getDb().prepare(
    'UPDATE users SET alert_threshold_euros = COALESCE(?, alert_threshold_euros), default_frequency_hours = COALESCE(?, default_frequency_hours) WHERE id = ?'
  ).run(alertThresholdEuros ?? null, defaultFrequencyHours ?? null, userId);
  return findUserById(userId);
}

function verifyPassword(plaintext, hash) {
  return bcrypt.compareSync(plaintext, hash);
}

module.exports = { createUser, findUserByEmail, findUserById, updateUserFcmToken, updateUserSettings, verifyPassword };
```

- [ ] **Step 4: Create backend/src/middleware/requireAuth.js**

```js
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { requireAuth };
```

- [ ] **Step 5: Create backend/src/routes/auth.js**

```js
const express = require('express');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail, findUserById, updateUserFcmToken, updateUserSettings, verifyPassword } = require('../models/userModel');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

router.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const user = createUser(email, password);
    res.status(201).json({ token: signToken(user.id), user });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const safeUser = findUserById(user.id);
  res.json({ token: signToken(user.id), user: safeUser });
});

router.put('/fcm-token', requireAuth, (req, res) => {
  const { fcmToken } = req.body;
  if (!fcmToken) return res.status(400).json({ error: 'fcmToken required' });
  updateUserFcmToken(req.userId, fcmToken);
  res.json({ success: true });
});

router.put('/settings', requireAuth, (req, res) => {
  const { alertThresholdEuros, defaultFrequencyHours } = req.body;
  const user = updateUserSettings(req.userId, { alertThresholdEuros, defaultFrequencyHours });
  res.json({ user });
});

router.get('/me', requireAuth, (req, res) => {
  const user = findUserById(req.userId);
  res.json({ user });
});

module.exports = router;
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
cd backend && npx jest tests/auth.test.js --no-coverage
```

Expected: 4 tests pass.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: user model + auth routes (register/login/JWT)"
```

---

## Task 4: Backend — Search Model + Routes

**Files:**
- Create: `backend/src/models/searchModel.js`
- Create: `backend/src/routes/searches.js`

- [ ] **Step 1: Write tests**

Create `backend/tests/searches.test.js`:

```js
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
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd backend && npx jest tests/searches.test.js --no-coverage
```

- [ ] **Step 3: Create backend/src/models/searchModel.js**

```js
const { getDb } = require('../db/database');

function createSearch(userId, { origin, destination, departDate, returnDate, passengers, isMultidestino, frequencyHours }) {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO flight_searches (user_id, origin, destination, depart_date, return_date, passengers, is_multidestino, frequency_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId, origin, destination, departDate, returnDate ?? null, passengers, isMultidestino ? 1 : 0, frequencyHours ?? 6);
  return findSearchById(result.lastInsertRowid);
}

function findSearchById(id) {
  return getDb().prepare('SELECT * FROM flight_searches WHERE id = ?').get(id);
}

function findActiveSearchesByUser(userId) {
  return getDb().prepare('SELECT * FROM flight_searches WHERE user_id = ? ORDER BY created_at DESC').all(userId);
}

function findAllActiveSearches() {
  return getDb().prepare("SELECT * FROM flight_searches WHERE status = 'active'").all();
}

function updateSearch(id, userId, fields) {
  const allowed = ['status', 'frequency_hours', 'best_price_euros', 'best_price_airline', 'best_price_url', 'last_checked_at'];
  const updates = Object.entries(fields)
    .filter(([k]) => allowed.includes(k))
    .map(([k]) => `${k} = ?`).join(', ');
  const values = Object.entries(fields).filter(([k]) => allowed.includes(k)).map(([, v]) => v);
  if (!updates) return findSearchById(id);
  getDb().prepare(`UPDATE flight_searches SET ${updates} WHERE id = ? AND user_id = ?`).run(...values, id, userId);
  return findSearchById(id);
}

function deleteSearch(id, userId) {
  return getDb().prepare('DELETE FROM flight_searches WHERE id = ? AND user_id = ?').run(id, userId);
}

module.exports = { createSearch, findSearchById, findActiveSearchesByUser, findAllActiveSearches, updateSearch, deleteSearch };
```

- [ ] **Step 4: Create backend/src/models/priceModel.js**

```js
const { getDb } = require('../db/database');

function recordPrice(searchId, { priceEuros, airline, flightUrl }) {
  getDb().prepare('INSERT INTO price_records (search_id, price_euros, airline, flight_url) VALUES (?, ?, ?, ?)')
    .run(searchId, priceEuros, airline, flightUrl ?? null);
}

function getPriceHistory(searchId) {
  return getDb().prepare('SELECT * FROM price_records WHERE search_id = ? ORDER BY recorded_at ASC').all(searchId);
}

function getPriceStats(searchId) {
  return getDb().prepare(`
    SELECT 
      MIN(price_euros) as min_price,
      MAX(price_euros) as max_price,
      AVG(price_euros) as avg_price,
      COUNT(*) as data_points
    FROM price_records WHERE search_id = ?
  `).get(searchId);
}

function saveNotification(userId, searchId, { message, priceEuros, airline, flightUrl }) {
  getDb().prepare('INSERT INTO notifications (user_id, search_id, message, price_euros, airline, flight_url) VALUES (?, ?, ?, ?, ?, ?)')
    .run(userId, searchId, message, priceEuros, airline, flightUrl ?? null);
}

function getNotificationsByUser(userId) {
  return getDb().prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').all(userId);
}

module.exports = { recordPrice, getPriceHistory, getPriceStats, saveNotification, getNotificationsByUser };
```

- [ ] **Step 5: Create backend/src/routes/searches.js**

```js
const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { createSearch, findActiveSearchesByUser, updateSearch, deleteSearch, findSearchById } = require('../models/searchModel');
const { getPriceHistory, getNotificationsByUser } = require('../models/priceModel');

const router = express.Router();
router.use(requireAuth);

router.post('/', (req, res) => {
  const { origin, destination, departDate, returnDate, passengers, isMultidestino, frequencyHours } = req.body;
  if (!origin || !destination || !departDate || !passengers) {
    return res.status(400).json({ error: 'origin, destination, departDate, passengers required' });
  }
  const search = createSearch(req.userId, { origin, destination, departDate, returnDate, passengers, isMultidestino, frequencyHours });
  res.status(201).json({ search });
});

router.get('/', (req, res) => {
  const searches = findActiveSearchesByUser(req.userId);
  res.json({ searches });
});

router.get('/:id/history', (req, res) => {
  const search = findSearchById(req.params.id);
  if (!search || search.user_id !== req.userId) return res.status(404).json({ error: 'Not found' });
  const records = getPriceHistory(req.params.id);
  res.json({ records });
});

router.put('/:id', (req, res) => {
  const { status, frequencyHours } = req.body;
  const fields = {};
  if (status) fields.status = status;
  if (frequencyHours) fields.frequency_hours = frequencyHours;
  const search = updateSearch(req.params.id, req.userId, fields);
  if (!search) return res.status(404).json({ error: 'Not found' });
  res.json({ search });
});

router.delete('/:id', (req, res) => {
  const result = deleteSearch(req.params.id, req.userId);
  if (!result.changes) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = router;
```

- [ ] **Step 6: Create backend/src/routes/prices.js**

```js
const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { getPriceStats, getNotificationsByUser } = require('../models/priceModel');
const { findSearchById } = require('../models/searchModel');

const router = express.Router();
router.use(requireAuth);

router.get('/:id/stats', (req, res) => {
  const search = findSearchById(req.params.id);
  if (!search || search.user_id !== req.userId) return res.status(404).json({ error: 'Not found' });
  const stats = getPriceStats(req.params.id);
  res.json({ stats });
});

router.get('/notifications', (req, res) => {
  const notifications = getNotificationsByUser(req.userId);
  res.json({ notifications });
});

module.exports = router;
```

- [ ] **Step 7: Run tests — expect PASS**

```bash
cd backend && npx jest --no-coverage
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: search + price models and routes"
```

---

## Task 5: Backend — Amadeus Service

**Files:**
- Create: `backend/src/services/amadeusService.js`

- [ ] **Step 1: Write test (mock HTTP)**

Create `backend/tests/amadeus.test.js`:

```js
jest.mock('axios');
const axios = require('axios');
const { searchFlights } = require('../src/services/amadeusService');

beforeEach(() => {
  process.env.AMADEUS_CLIENT_ID = 'test_id';
  process.env.AMADEUS_CLIENT_SECRET = 'test_secret';
});

test('searchFlights returns normalized offers', async () => {
  axios.post.mockResolvedValueOnce({ data: { access_token: 'fake_token', expires_in: 1799 } });
  axios.get.mockResolvedValueOnce({
    data: {
      data: [{
        itineraries: [{ segments: [{ carrierCode: 'IB', departure: { iataCode: 'MAD' }, arrival: { iataCode: 'LHR' } }] }],
        price: { grandTotal: '89.50', currency: 'EUR' }
      }],
      dictionaries: { carriers: { IB: 'Iberia' } }
    }
  });

  const results = await searchFlights({ origin: 'MAD', destination: 'LHR', departDate: '2026-06-15', passengers: 1 });
  expect(results).toHaveLength(1);
  expect(results[0].priceEuros).toBe(89.50);
  expect(results[0].airline).toBe('Iberia');
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd backend && npx jest tests/amadeus.test.js --no-coverage
```

- [ ] **Step 3: Create backend/src/services/amadeusService.js**

```js
const axios = require('axios');

const AMADEUS_AUTH_URL = 'https://test.api.amadeus.com/v1/security/oauth2/token';
const AMADEUS_FLIGHTS_URL = 'https://test.api.amadeus.com/v2/shopping/flight-offers';

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  const res = await axios.post(AMADEUS_AUTH_URL, new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.AMADEUS_CLIENT_ID,
    client_secret: process.env.AMADEUS_CLIENT_SECRET,
  }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  cachedToken = res.data.access_token;
  tokenExpiresAt = Date.now() + (res.data.expires_in - 60) * 1000;
  return cachedToken;
}

async function searchFlights({ origin, destination, departDate, returnDate, passengers }) {
  const token = await getAccessToken();
  const params = {
    originLocationCode: origin,
    destinationLocationCode: destination,
    departureDate: departDate,
    adults: passengers,
    max: 10,
    currencyCode: 'EUR',
  };
  if (returnDate) params.returnDate = returnDate;

  const res = await axios.get(AMADEUS_FLIGHTS_URL, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });

  const carriers = res.data.dictionaries?.carriers ?? {};
  return res.data.data.map(offer => ({
    priceEuros: parseFloat(offer.price.grandTotal),
    airline: carriers[offer.itineraries[0].segments[0].carrierCode] ?? offer.itineraries[0].segments[0].carrierCode,
    flightUrl: `https://www.amadeus.com`,
  }));
}

module.exports = { searchFlights };
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd backend && npx jest tests/amadeus.test.js --no-coverage
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: Amadeus API service with token caching"
```

---

## Task 6: Backend — FCM Service + Price Monitor

**Files:**
- Create: `backend/src/services/fcmService.js`
- Create: `backend/src/services/priceMonitor.js`

- [ ] **Step 1: Create backend/src/services/fcmService.js**

```js
let firebaseApp;

function initFirebase() {
  if (firebaseApp) return;
  if (!process.env.FIREBASE_PROJECT_ID) {
    console.warn('Firebase not configured — push notifications disabled');
    return;
  }
  const admin = require('firebase-admin');
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

async function sendPushNotification(fcmToken, { title, body, data }) {
  if (!firebaseApp) return;
  const admin = require('firebase-admin');
  try {
    await admin.messaging(firebaseApp).send({
      token: fcmToken,
      notification: { title, body },
      data: data ?? {},
    });
  } catch (err) {
    console.error('FCM send error:', err.message);
  }
}

module.exports = { initFirebase, sendPushNotification };
```

- [ ] **Step 2: Create backend/src/services/priceMonitor.js**

```js
const cron = require('node-cron');
const { findAllActiveSearches, updateSearch } = require('../models/searchModel');
const { recordPrice, saveNotification } = require('../models/priceModel');
const { searchFlights } = require('./amadeusService');
const { sendPushNotification } = require('./fcmService');
const { findUserById } = require('../models/userModel');

async function checkSearchPrices(search) {
  let offers;
  try {
    offers = await searchFlights({
      origin: search.origin,
      destination: search.destination,
      departDate: search.depart_date,
      returnDate: search.return_date,
      passengers: search.passengers,
    });
  } catch (err) {
    console.error(`Price check failed for search ${search.id}:`, err.message);
    return;
  }

  if (!offers.length) return;

  const cheapest = offers.reduce((a, b) => a.priceEuros < b.priceEuros ? a : b);
  recordPrice(search.id, cheapest);
  updateSearch(search.id, search.user_id, { last_checked_at: new Date().toISOString() });

  const previousBest = search.best_price_euros;
  const user = findUserById(search.user_id);
  const threshold = user?.alert_threshold_euros ?? 10;
  const isPriceDrop = !previousBest || cheapest.priceEuros < previousBest - threshold;

  if (isPriceDrop) {
    updateSearch(search.id, search.user_id, {
      best_price_euros: cheapest.priceEuros,
      best_price_airline: cheapest.airline,
      best_price_url: cheapest.flightUrl,
    });

    const message = `${search.origin}→${search.destination}: ${cheapest.priceEuros}€ con ${cheapest.airline}${previousBest ? ` (era ${previousBest}€)` : ''}`;
    saveNotification(search.user_id, search.id, { message, priceEuros: cheapest.priceEuros, airline: cheapest.airline, flightUrl: cheapest.flightUrl });

    if (user?.fcm_token) {
      await sendPushNotification(user.fcm_token, {
        title: '¡Precio bajado! ✈️',
        body: message,
        data: { searchId: String(search.id), price: String(cheapest.priceEuros) },
      });
    }
  }
}

async function runAllActiveSearches() {
  const searches = findAllActiveSearches();
  for (const search of searches) {
    await checkSearchPrices(search);
  }
}

function startPriceMonitor() {
  // Run every 30 minutes; each search has its own frequency tracked by last_checked_at
  cron.schedule('*/30 * * * *', async () => {
    const searches = findAllActiveSearches();
    const now = Date.now();
    const due = searches.filter(s => {
      if (!s.last_checked_at) return true;
      const lastMs = new Date(s.last_checked_at).getTime();
      return now - lastMs >= s.frequency_hours * 3600 * 1000;
    });
    for (const search of due) await checkSearchPrices(search);
  });
  console.log('Price monitor cron started (runs every 30min, checks per-search frequency)');
}

module.exports = { startPriceMonitor, runAllActiveSearches, checkSearchPrices };
```

- [ ] **Step 3: Update index.js to init Firebase**

Edit `backend/index.js`:

```js
require('dotenv').config();
const { createApp } = require('./src/app');
const { initDb } = require('./src/db/database');
const { startPriceMonitor } = require('./src/services/priceMonitor');
const { initFirebase } = require('./src/services/fcmService');

const PORT = process.env.PORT || 3000;

initDb();
initFirebase();
const app = createApp();
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
startPriceMonitor();
```

- [ ] **Step 4: Commit**

```bash
cd backend && git add -A && git commit -m "feat: FCM service + price monitor cron"
```

---

## Task 7: Mobile — Expo Scaffold

**Files:**
- Create: `mobile/package.json`
- Create: `mobile/app.json`
- Create: `mobile/App.js`

- [ ] **Step 1: Create mobile/package.json**

```json
{
  "name": "cholloadvisor-mobile",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios"
  },
  "dependencies": {
    "@react-navigation/bottom-tabs": "^6.5.20",
    "@react-navigation/native": "^6.1.17",
    "@react-navigation/native-stack": "^6.9.26",
    "axios": "^1.7.2",
    "expo": "~51.0.0",
    "expo-notifications": "~0.28.0",
    "expo-status-bar": "~1.12.1",
    "react": "18.2.0",
    "react-native": "0.74.1",
    "react-native-chart-kit": "^6.12.0",
    "react-native-safe-area-context": "4.10.1",
    "react-native-screens": "3.31.1",
    "react-native-svg": "15.2.0",
    "@react-native-async-storage/async-storage": "1.23.1",
    "@react-native-community/datetimepicker": "8.0.1"
  }
}
```

- [ ] **Step 2: Create mobile/app.json**

```json
{
  "expo": {
    "name": "CholloAdvisor",
    "slug": "cholloadvisor",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": { "resizeMode": "contain", "backgroundColor": "#1a1a2e" },
    "android": {
      "adaptiveIcon": { "backgroundColor": "#1a1a2e" },
      "package": "com.cholloadvisor.app",
      "googleServicesFile": "./google-services.json"
    },
    "plugins": ["expo-notifications"],
    "scheme": "cholloadvisor"
  }
}
```

- [ ] **Step 3: Create mobile/src/api/client.js**

```js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = __DEV__ ? 'http://10.0.2.2:3000' : 'https://your-backend.com';

const client = axios.create({ baseURL: BASE_URL, timeout: 15000 });

client.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('jwt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
```

- [ ] **Step 4: Create mobile/src/store/authStore.js**

```js
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

export async function login(email, password) {
  const res = await client.post('/auth/login', { email, password });
  await AsyncStorage.setItem('jwt_token', res.data.token);
  await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
  return res.data;
}

export async function register(email, password) {
  const res = await client.post('/auth/register', { email, password });
  await AsyncStorage.setItem('jwt_token', res.data.token);
  await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
  return res.data;
}

export async function logout() {
  await AsyncStorage.multiRemove(['jwt_token', 'user']);
}

export async function getStoredUser() {
  const raw = await AsyncStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export async function isAuthenticated() {
  const token = await AsyncStorage.getItem('jwt_token');
  return !!token;
}
```

- [ ] **Step 5: Create mobile/src/store/settingsStore.js**

```js
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'app_settings';

const defaults = { defaultFrequencyHours: 6, alertThresholdEuros: 10 };

export async function loadSettings() {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
}

export async function saveSettings(partial) {
  const current = await loadSettings();
  const updated = { ...current, ...partial };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}
```

- [ ] **Step 6: Install dependencies**

```bash
cd mobile && npm install
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: Expo scaffold + API client + auth/settings stores"
```

---

## Task 8: Mobile — Navigation + Auth Screens

**Files:**
- Create: `mobile/src/navigation/AppNavigator.js`
- Create: `mobile/src/screens/LoginScreen.js`
- Create: `mobile/src/screens/RegisterScreen.js`
- Create: `mobile/App.js`

- [ ] **Step 1: Create mobile/src/navigation/AppNavigator.js**

```js
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ActiveSearchesScreen from '../screens/ActiveSearchesScreen';
import SearchFormScreen from '../screens/SearchFormScreen';
import PriceHistoryScreen from '../screens/PriceHistoryScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { isAuthenticated } from '../store/authStore';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ tabBarStyle: { backgroundColor: '#1a1a2e' }, tabBarActiveTintColor: '#e94560', tabBarInactiveTintColor: '#aaa', headerStyle: { backgroundColor: '#1a1a2e' }, headerTintColor: '#fff' }}>
      <Tab.Screen name="Búsquedas" component={ActiveSearchesScreen} options={{ tabBarIcon: () => <Text>🔍</Text> }} />
      <Tab.Screen name="Notificaciones" component={NotificationsScreen} options={{ tabBarIcon: () => <Text>🔔</Text> }} />
      <Tab.Screen name="Ajustes" component={SettingsScreen} options={{ tabBarIcon: () => <Text>⚙️</Text> }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [authed, setAuthed] = useState(null);

  useEffect(() => {
    isAuthenticated().then(setAuthed);
  }, []);

  if (authed === null) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#1a1a2e' }, headerTintColor: '#fff' }}>
        {authed ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="SearchForm" component={SearchFormScreen} options={{ title: 'Nueva búsqueda' }} />
            <Stack.Screen name="PriceHistory" component={PriceHistoryScreen} options={{ title: 'Historial de precios' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Crear cuenta' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

- [ ] **Step 2: Create mobile/src/screens/LoginScreen.js**

```js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { login } from '../store/authStore';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) return Alert.alert('Error', 'Introduce email y contraseña');
    setLoading(true);
    try {
      await login(email, password);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch {
      Alert.alert('Error', 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>✈️ CholloAdvisor</Text>
      <Text style={styles.subtitle}>Alertas de vuelos baratos</Text>
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#666" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#aaa', marginBottom: 40 },
  input: { width: '100%', backgroundColor: '#16213e', color: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: '#0f3460' },
  button: { width: '100%', backgroundColor: '#e94560', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  link: { color: '#e94560', fontSize: 14, marginTop: 8 },
});
```

- [ ] **Step 3: Create mobile/src/screens/RegisterScreen.js**

```js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { register } from '../store/authStore';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email || password.length < 6) return Alert.alert('Error', 'Email válido y contraseña de mínimo 6 caracteres');
    setLoading(true);
    try {
      await register(email, password);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error ?? 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>Crear cuenta</Text>
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#666" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Contraseña (mín. 6 caracteres)" placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creando...' : 'Crear cuenta'}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 32 },
  input: { width: '100%', backgroundColor: '#16213e', color: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: '#0f3460' },
  button: { width: '100%', backgroundColor: '#e94560', borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
```

- [ ] **Step 4: Create mobile/App.js**

```js
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: navigation structure + auth screens"
```

---

## Task 9: Mobile — Search Form Screen

**Files:**
- Create: `mobile/src/components/AirportAutocomplete.js`
- Create: `mobile/src/screens/SearchFormScreen.js`

- [ ] **Step 1: Create mobile/src/components/AirportAutocomplete.js**

```js
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, FlatList, StyleSheet } from 'react-native';

const AIRPORT_DB = [
  { code: 'MAD', name: 'Madrid Barajas', city: 'Madrid' },
  { code: 'BCN', name: 'Barcelona El Prat', city: 'Barcelona' },
  { code: 'LHR', name: 'London Heathrow', city: 'London' },
  { code: 'CDG', name: 'Paris Charles de Gaulle', city: 'Paris' },
  { code: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam' },
  { code: 'FCO', name: 'Rome Fiumicino', city: 'Rome' },
  { code: 'MXP', name: 'Milan Malpensa', city: 'Milan' },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt' },
  { code: 'LGW', name: 'London Gatwick', city: 'London' },
  { code: 'DXB', name: 'Dubai International', city: 'Dubai' },
  { code: 'JFK', name: 'New York JFK', city: 'New York' },
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles' },
  { code: 'PMI', name: 'Palma de Mallorca', city: 'Mallorca' },
  { code: 'AGP', name: 'Málaga Airport', city: 'Málaga' },
  { code: 'SVQ', name: 'Sevilla Airport', city: 'Sevilla' },
  { code: 'VLC', name: 'Valencia Airport', city: 'Valencia' },
  { code: 'BIO', name: 'Bilbao Airport', city: 'Bilbao' },
  { code: 'LIS', name: 'Lisbon Humberto Delgado', city: 'Lisbon' },
  { code: 'ORY', name: 'Paris Orly', city: 'Paris' },
  { code: 'VIE', name: 'Vienna International', city: 'Vienna' },
];

export default function AirportAutocomplete({ value, onSelect, placeholder, style }) {
  const [query, setQuery] = useState(value?.code ? `${value.code} - ${value.city}` : '');
  const [suggestions, setSuggestions] = useState([]);

  function handleChange(text) {
    setQuery(text);
    if (text.length < 2) { setSuggestions([]); return; }
    const q = text.toLowerCase();
    setSuggestions(AIRPORT_DB.filter(a =>
      a.code.toLowerCase().includes(q) || a.city.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
    ).slice(0, 5));
  }

  function selectAirport(airport) {
    setQuery(`${airport.code} - ${airport.city}`);
    setSuggestions([]);
    onSelect(airport);
  }

  return (
    <View style={style}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor="#666"
      />
      {suggestions.length > 0 && (
        <View style={styles.dropdown}>
          {suggestions.map(airport => (
            <TouchableOpacity key={airport.code} style={styles.suggestion} onPress={() => selectAirport(airport)}>
              <Text style={styles.code}>{airport.code}</Text>
              <Text style={styles.airportName}>{airport.city} — {airport.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { backgroundColor: '#16213e', color: '#fff', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#0f3460' },
  dropdown: { backgroundColor: '#16213e', borderRadius: 8, borderWidth: 1, borderColor: '#0f3460', marginTop: 2, zIndex: 100 },
  suggestion: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#0f3460' },
  code: { color: '#e94560', fontWeight: 'bold', fontSize: 14 },
  airportName: { color: '#ccc', fontSize: 12 },
});
```

- [ ] **Step 2: Create mobile/src/screens/SearchFormScreen.js**

```js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AirportAutocomplete from '../components/AirportAutocomplete';
import { loadSettings } from '../store/settingsStore';
import client from '../api/client';

const FREQUENCY_OPTIONS = [
  { label: 'Cada hora', value: 1 },
  { label: 'Cada 3 horas', value: 3 },
  { label: 'Cada 6 horas', value: 6 },
  { label: 'Cada 12 horas', value: 12 },
  { label: 'Diaria', value: 24 },
];

export default function SearchFormScreen({ navigation }) {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [departDate, setDepartDate] = useState(new Date());
  const [returnDate, setReturnDate] = useState(null);
  const [passengers, setPassengers] = useState(1);
  const [frequencyHours, setFrequencyHours] = useState(6);
  const [showDepartPicker, setShowDepartPicker] = useState(false);
  const [showReturnPicker, setShowReturnPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings().then(s => setFrequencyHours(s.defaultFrequencyHours));
  }, []);

  function formatDate(d) {
    return d ? d.toISOString().split('T')[0] : 'Sin fecha';
  }

  async function handleSave() {
    if (!origin || !destination) return Alert.alert('Error', 'Selecciona origen y destino');
    setLoading(true);
    try {
      await client.post('/searches', {
        origin: origin.code,
        destination: destination.code,
        departDate: formatDate(departDate),
        returnDate: returnDate ? formatDate(returnDate) : undefined,
        passengers,
        frequencyHours,
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error ?? 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Origen</Text>
      <AirportAutocomplete value={origin} onSelect={setOrigin} placeholder="MAD - Madrid" style={styles.field} />

      <Text style={styles.label}>Destino</Text>
      <AirportAutocomplete value={destination} onSelect={setDestination} placeholder="LHR - London" style={styles.field} />

      <Text style={styles.label}>Fecha ida</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowDepartPicker(true)}>
        <Text style={styles.dateText}>{formatDate(departDate)}</Text>
      </TouchableOpacity>
      {showDepartPicker && (
        <DateTimePicker value={departDate} mode="date" minimumDate={new Date()} onChange={(_, d) => { setShowDepartPicker(false); if (d) setDepartDate(d); }} />
      )}

      <Text style={styles.label}>Fecha vuelta (opcional)</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowReturnPicker(true)}>
        <Text style={styles.dateText}>{returnDate ? formatDate(returnDate) : 'Solo ida'}</Text>
      </TouchableOpacity>
      {showReturnPicker && (
        <DateTimePicker value={returnDate ?? departDate} mode="date" minimumDate={departDate} onChange={(_, d) => { setShowReturnPicker(false); if (d) setReturnDate(d); }} />
      )}

      <Text style={styles.label}>Pasajeros: {passengers}</Text>
      <View style={styles.counter}>
        <TouchableOpacity style={styles.counterBtn} onPress={() => setPassengers(Math.max(1, passengers - 1))}><Text style={styles.counterText}>−</Text></TouchableOpacity>
        <Text style={styles.counterValue}>{passengers}</Text>
        <TouchableOpacity style={styles.counterBtn} onPress={() => setPassengers(Math.min(9, passengers + 1))}><Text style={styles.counterText}>+</Text></TouchableOpacity>
      </View>

      <Text style={styles.label}>Frecuencia de búsqueda</Text>
      <View style={styles.frequencyRow}>
        {FREQUENCY_OPTIONS.map(opt => (
          <TouchableOpacity key={opt.value} style={[styles.freqBtn, frequencyHours === opt.value && styles.freqBtnActive]} onPress={() => setFrequencyHours(opt.value)}>
            <Text style={[styles.freqText, frequencyHours === opt.value && styles.freqTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
        <Text style={styles.saveBtnText}>{loading ? 'Guardando...' : 'Guardar búsqueda'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 20 },
  label: { color: '#aaa', fontSize: 13, marginTop: 16, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  field: { marginBottom: 4 },
  dateButton: { backgroundColor: '#16213e', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#0f3460' },
  dateText: { color: '#fff', fontSize: 16 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  counterBtn: { backgroundColor: '#0f3460', borderRadius: 8, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  counterText: { color: '#fff', fontSize: 22 },
  counterValue: { color: '#fff', fontSize: 20, fontWeight: 'bold', minWidth: 30, textAlign: 'center' },
  frequencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  freqBtn: { backgroundColor: '#16213e', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#0f3460' },
  freqBtnActive: { backgroundColor: '#e94560', borderColor: '#e94560' },
  freqText: { color: '#aaa', fontSize: 13 },
  freqTextActive: { color: '#fff', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#e94560', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32, marginBottom: 40 },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: search form screen + airport autocomplete"
```

---

## Task 10: Mobile — Active Searches + Search Card

**Files:**
- Create: `mobile/src/components/SearchCard.js`
- Create: `mobile/src/screens/ActiveSearchesScreen.js`

- [ ] **Step 1: Create mobile/src/components/SearchCard.js**

```js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

function PriceTrend({ current, best }) {
  if (!best || current === best) return <Text style={styles.trendFlat}>→</Text>;
  return current < best
    ? <Text style={styles.trendDown}>↓ mejor precio</Text>
    : <Text style={styles.trendUp}>↑</Text>;
}

export default function SearchCard({ search, onHistory, onToggle, onDelete }) {
  const isActive = search.status === 'active';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.route}>{search.origin} → {search.destination}</Text>
        <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgePaused]}>
          <Text style={styles.badgeText}>{isActive ? 'Activa' : 'Pausada'}</Text>
        </View>
      </View>
      <Text style={styles.dates}>{search.depart_date}{search.return_date ? ` · vuelta ${search.return_date}` : ''} · {search.passengers} pax</Text>
      <View style={styles.priceRow}>
        {search.best_price_euros ? (
          <>
            <Text style={styles.price}>{search.best_price_euros}€</Text>
            <Text style={styles.airline}>{search.best_price_airline}</Text>
            <PriceTrend current={search.best_price_euros} best={search.best_price_euros} />
          </>
        ) : (
          <Text style={styles.noPrice}>Sin datos aún</Text>
        )}
      </View>
      <Text style={styles.lastChecked}>{search.last_checked_at ? `Última comprobación: ${new Date(search.last_checked_at).toLocaleString('es-ES')}` : 'Aún no comprobado'}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onHistory}><Text style={styles.actionText}>📈 Historial</Text></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onToggle}><Text style={styles.actionText}>{isActive ? '⏸ Pausar' : '▶ Reanudar'}</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={onDelete}><Text style={styles.actionText}>🗑</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#16213e', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#0f3460' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  route: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  badge: { borderRadius: 6, paddingVertical: 2, paddingHorizontal: 8 },
  badgeActive: { backgroundColor: '#1a6b3c' },
  badgePaused: { backgroundColor: '#5a4a00' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  dates: { color: '#888', fontSize: 12, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  price: { color: '#e94560', fontSize: 26, fontWeight: 'bold' },
  airline: { color: '#aaa', fontSize: 14 },
  trendDown: { color: '#2ecc71', fontWeight: 'bold' },
  trendUp: { color: '#e74c3c', fontWeight: 'bold' },
  trendFlat: { color: '#aaa' },
  noPrice: { color: '#666', fontStyle: 'italic' },
  lastChecked: { color: '#555', fontSize: 11, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, backgroundColor: '#0f3460', borderRadius: 8, padding: 8, alignItems: 'center' },
  deleteBtn: { flex: 0, paddingHorizontal: 16 },
  actionText: { color: '#fff', fontSize: 13 },
});
```

- [ ] **Step 2: Create mobile/src/screens/ActiveSearchesScreen.js**

```js
import React, { useState, useCallback } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import SearchCard from '../components/SearchCard';
import client from '../api/client';

export default function ActiveSearchesScreen({ navigation }) {
  const [searches, setSearches] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadSearches = useCallback(async () => {
    try {
      const res = await client.get('/searches');
      setSearches(res.data.searches);
    } catch (err) {
      if (err.response?.status === 401) navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  }, [navigation]);

  useFocusEffect(useCallback(() => { loadSearches(); }, [loadSearches]));

  async function handleRefresh() {
    setRefreshing(true);
    await loadSearches();
    setRefreshing(false);
  }

  async function toggleSearch(search) {
    const newStatus = search.status === 'active' ? 'paused' : 'active';
    await client.put(`/searches/${search.id}`, { status: newStatus });
    loadSearches();
  }

  async function deleteSearch(id) {
    Alert.alert('Eliminar', '¿Eliminar esta búsqueda?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await client.delete(`/searches/${id}`); loadSearches(); } },
    ]);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={searches}
        keyExtractor={s => String(s.id)}
        renderItem={({ item }) => (
          <SearchCard
            search={item}
            onHistory={() => navigation.navigate('PriceHistory', { searchId: item.id, route: `${item.origin}→${item.destination}` })}
            onToggle={() => toggleSearch(item)}
            onDelete={() => deleteSearch(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#e94560" />}
        ListEmptyComponent={<Text style={styles.empty}>Sin búsquedas activas.{'\n'}Toca + para crear una.</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('SearchForm')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  list: { padding: 16 },
  empty: { color: '#666', textAlign: 'center', marginTop: 80, fontSize: 16, lineHeight: 26 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#e94560', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
});
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: active searches screen + search card component"
```

---

## Task 11: Mobile — Price History Screen + Chart

**Files:**
- Create: `mobile/src/components/PriceChart.js`
- Create: `mobile/src/components/PriceHistoryTable.js`
- Create: `mobile/src/screens/PriceHistoryScreen.js`

- [ ] **Step 1: Create mobile/src/components/PriceChart.js**

```js
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function PriceChart({ records }) {
  if (records.length < 2) {
    return <View style={styles.empty}><Text style={styles.emptyText}>Se necesitan al menos 2 puntos de datos para mostrar el gráfico</Text></View>;
  }

  const sorted = [...records].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
  const prices = sorted.map(r => r.price_euros);
  const labels = sorted.map((r, i) => i % Math.ceil(sorted.length / 5) === 0 ? new Date(r.recorded_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) : '');

  return (
    <LineChart
      data={{ labels, datasets: [{ data: prices, color: () => '#e94560', strokeWidth: 2 }] }}
      width={SCREEN_WIDTH - 32}
      height={200}
      chartConfig={{
        backgroundColor: '#16213e',
        backgroundGradientFrom: '#16213e',
        backgroundGradientTo: '#1a1a2e',
        decimalPlaces: 0,
        color: () => '#e94560',
        labelColor: () => '#aaa',
        propsForDots: { r: '4', strokeWidth: '2', stroke: '#e94560' },
      }}
      bezier
      style={styles.chart}
    />
  );
}

const styles = StyleSheet.create({
  chart: { borderRadius: 12, marginVertical: 8 },
  empty: { height: 160, alignItems: 'center', justifyContent: 'center', backgroundColor: '#16213e', borderRadius: 12, marginVertical: 8, padding: 16 },
  emptyText: { color: '#666', textAlign: 'center' },
});
```

- [ ] **Step 2: Create mobile/src/components/PriceHistoryTable.js**

```js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

export default function PriceHistoryTable({ records }) {
  const [airlineFilter, setAirlineFilter] = useState(null);
  const airlines = [...new Set(records.map(r => r.airline))];
  const filtered = airlineFilter ? records.filter(r => r.airline === airlineFilter) : records;
  const sorted = [...filtered].sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));

  return (
    <View>
      <View style={styles.filters}>
        <TouchableOpacity style={[styles.filterBtn, !airlineFilter && styles.filterActive]} onPress={() => setAirlineFilter(null)}>
          <Text style={styles.filterText}>Todas</Text>
        </TouchableOpacity>
        {airlines.map(a => (
          <TouchableOpacity key={a} style={[styles.filterBtn, airlineFilter === a && styles.filterActive]} onPress={() => setAirlineFilter(a)}>
            <Text style={styles.filterText}>{a}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.tableHeader}>
        <Text style={[styles.col, styles.colDate]}>Fecha</Text>
        <Text style={[styles.col, styles.colPrice]}>Precio</Text>
        <Text style={[styles.col, styles.colAirline]}>Aerolínea</Text>
      </View>
      {sorted.map(r => (
        <View key={r.id} style={styles.row}>
          <Text style={[styles.col, styles.colDate]}>{new Date(r.recorded_at).toLocaleDateString('es-ES')}</Text>
          <Text style={[styles.col, styles.colPrice, styles.priceText]}>{r.price_euros}€</Text>
          <Text style={[styles.col, styles.colAirline]}>{r.airline}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  filterBtn: { backgroundColor: '#16213e', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: '#0f3460' },
  filterActive: { backgroundColor: '#e94560', borderColor: '#e94560' },
  filterText: { color: '#fff', fontSize: 12 },
  tableHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#0f3460' },
  row: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#0f3460' },
  col: { color: '#ccc', fontSize: 13 },
  colDate: { flex: 2 },
  colPrice: { flex: 1, textAlign: 'right' },
  colAirline: { flex: 2, textAlign: 'right' },
  priceText: { color: '#e94560', fontWeight: 'bold' },
});
```

- [ ] **Step 3: Create mobile/src/screens/PriceHistoryScreen.js**

```js
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import PriceChart from '../components/PriceChart';
import PriceHistoryTable from '../components/PriceHistoryTable';
import client from '../api/client';

export default function PriceHistoryScreen({ route }) {
  const { searchId, route: flightRoute } = route.params;
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [histRes, statsRes] = await Promise.all([
        client.get(`/searches/${searchId}/history`),
        client.get(`/prices/${searchId}/stats`),
      ]);
      setRecords(histRes.data.records);
      setStats(statsRes.data.stats);
      setLoading(false);
    }
    load();
  }, [searchId]);

  if (loading) return <View style={styles.center}><ActivityIndicator color="#e94560" size="large" /></View>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{flightRoute}</Text>
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statBox}><Text style={styles.statVal}>{stats.min_price ?? '—'}€</Text><Text style={styles.statLabel}>Mínimo</Text></View>
          <View style={styles.statBox}><Text style={styles.statVal}>{stats.max_price ?? '—'}€</Text><Text style={styles.statLabel}>Máximo</Text></View>
          <View style={styles.statBox}><Text style={styles.statVal}>{stats.avg_price ? Math.round(stats.avg_price) : '—'}€</Text><Text style={styles.statLabel}>Media</Text></View>
          <View style={styles.statBox}><Text style={styles.statVal}>{stats.data_points ?? 0}</Text><Text style={styles.statLabel}>Registros</Text></View>
        </View>
      )}
      <Text style={styles.sectionTitle}>Evolución de precio</Text>
      <PriceChart records={records} />
      <Text style={styles.sectionTitle}>Historial</Text>
      <PriceHistoryTable records={records} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 16 },
  center: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#16213e', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#0f3460' },
  statVal: { color: '#e94560', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: '#888', fontSize: 11, marginTop: 2 },
  sectionTitle: { color: '#aaa', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 8 },
});
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: price history screen + chart + table components"
```

---

## Task 12: Mobile — Notifications + Settings Screens

**Files:**
- Create: `mobile/src/screens/NotificationsScreen.js`
- Create: `mobile/src/screens/SettingsScreen.js`
- Create: `mobile/src/utils/fcmSetup.js`

- [ ] **Step 1: Create mobile/src/utils/fcmSetup.js**

```js
import * as Notifications from 'expo-notifications';
import client from '../api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true }),
});

export async function registerForPushNotifications() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  try {
    await client.put('/auth/fcm-token', { fcmToken: token });
  } catch {
    // Token registration is non-critical
  }

  return token;
}
```

- [ ] **Step 2: Create mobile/src/screens/NotificationsScreen.js**

```js
import React, { useState, useCallback } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, Linking, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';

function NotificationItem({ item }) {
  return (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.price}>{item.price_euros}€</Text>
        <Text style={styles.time}>{new Date(item.created_at).toLocaleString('es-ES')}</Text>
      </View>
      <Text style={styles.message}>{item.message}</Text>
      {item.flight_url && (
        <TouchableOpacity onPress={() => Linking.openURL(item.flight_url)}>
          <Text style={styles.link}>Ver vuelo →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await client.get('/prices/notifications');
    setNotifications(res.data.notifications);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={n => String(n.id)}
        renderItem={({ item }) => <NotificationItem item={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#e94560" />}
        ListEmptyComponent={<Text style={styles.empty}>Sin alertas aún.{'\n'}Las notificaciones de bajada de precio aparecerán aquí.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  list: { padding: 16 },
  item: { backgroundColor: '#16213e', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#0f3460' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  price: { color: '#e94560', fontSize: 20, fontWeight: 'bold' },
  time: { color: '#666', fontSize: 12, alignSelf: 'center' },
  message: { color: '#ccc', fontSize: 14, marginBottom: 8 },
  link: { color: '#e94560', fontSize: 13 },
  empty: { color: '#666', textAlign: 'center', marginTop: 80, fontSize: 15, lineHeight: 26 },
});
```

- [ ] **Step 3: Create mobile/src/screens/SettingsScreen.js**

```js
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native';
import { loadSettings, saveSettings } from '../store/settingsStore';
import { logout } from '../store/authStore';
import client from '../api/client';

const FREQ_OPTIONS = [1, 3, 6, 12, 24];
const THRESHOLD_OPTIONS = [5, 10, 15, 20, 30];

export default function SettingsScreen({ navigation }) {
  const [settings, setSettings] = useState({ defaultFrequencyHours: 6, alertThresholdEuros: 10 });

  useEffect(() => { loadSettings().then(setSettings); }, []);

  async function updateFrequency(v) {
    const updated = await saveSettings({ defaultFrequencyHours: v });
    setSettings(updated);
    await client.put('/auth/settings', { defaultFrequencyHours: v }).catch(() => {});
  }

  async function updateThreshold(v) {
    const updated = await saveSettings({ alertThresholdEuros: v });
    setSettings(updated);
    await client.put('/auth/settings', { alertThresholdEuros: v }).catch(() => {});
  }

  function confirmClearData() {
    Alert.alert('Eliminar datos', '¿Eliminar todas tus búsquedas y datos? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar todo', style: 'destructive', onPress: async () => {
        const searches = (await client.get('/searches')).data.searches;
        await Promise.all(searches.map(s => client.delete(`/searches/${s.id}`)));
        Alert.alert('Listo', 'Todos los datos eliminados');
      }},
    ]);
  }

  async function handleLogout() {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Frecuencia por defecto</Text>
      <View style={styles.row}>
        {FREQ_OPTIONS.map(v => (
          <TouchableOpacity key={v} style={[styles.chip, settings.defaultFrequencyHours === v && styles.chipActive]} onPress={() => updateFrequency(v)}>
            <Text style={[styles.chipText, settings.defaultFrequencyHours === v && styles.chipTextActive]}>{v}h</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.sectionTitle}>Umbral de alerta (€ de bajada)</Text>
      <View style={styles.row}>
        {THRESHOLD_OPTIONS.map(v => (
          <TouchableOpacity key={v} style={[styles.chip, settings.alertThresholdEuros === v && styles.chipActive]} onPress={() => updateThreshold(v)}>
            <Text style={[styles.chipText, settings.alertThresholdEuros === v && styles.chipTextActive]}>{v}€</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.spacer} />
      <TouchableOpacity style={styles.dangerBtn} onPress={confirmClearData}>
        <Text style={styles.dangerText}>Eliminar todos los datos</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 20 },
  sectionTitle: { color: '#aaa', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { backgroundColor: '#16213e', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: '#0f3460' },
  chipActive: { backgroundColor: '#e94560', borderColor: '#e94560' },
  chipText: { color: '#aaa', fontWeight: 'bold' },
  chipTextActive: { color: '#fff' },
  spacer: { flex: 1 },
  dangerBtn: { backgroundColor: '#3c1515', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#e94560' },
  dangerText: { color: '#e94560', fontWeight: 'bold', fontSize: 15 },
  logoutBtn: { backgroundColor: '#16213e', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  logoutText: { color: '#aaa', fontSize: 15 },
});
```

- [ ] **Step 4: Update App.js to register for notifications**

```js
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { registerForPushNotifications } from './src/utils/fcmSetup';
import { isAuthenticated } from './src/store/authStore';

export default function App() {
  useEffect(() => {
    isAuthenticated().then(authed => {
      if (authed) registerForPushNotifications();
    });
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: notifications + settings screens + FCM registration"
```

---

## Task 13: Integration — Wire Up & Root README

**Files:**
- Create: `mobile/assets/icon.png` (placeholder — use any 1024x1024 image)
- Create: `.gitignore`

- [ ] **Step 1: Create root .gitignore**

```gitignore
# Backend
backend/node_modules/
backend/cholloadvisor.db
backend/.env

# Mobile
mobile/node_modules/
mobile/.expo/
mobile/google-services.json

# General
.DS_Store
*.log
```

- [ ] **Step 2: Create mobile/assets/ placeholder**

```bash
mkdir -p mobile/assets
# Copy any PNG as icon — Expo provides a default if missing
```

- [ ] **Step 3: Verify backend all tests pass**

```bash
cd backend && npx jest --no-coverage
```

Expected: all tests green.

- [ ] **Step 4: Start backend and verify health endpoint**

```bash
cd backend && node index.js &
curl http://localhost:3000/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 5: Start mobile app**

```bash
cd mobile && npx expo start --android
```

Expected: QR code or Android emulator opens with login screen.

- [ ] **Step 6: End-to-end smoke test**

Manual steps:
1. Register new user
2. Navigate to Búsquedas tab → tap + button
3. Set MAD → LHR, select dates, 2 passengers, 6h frequency → Guardar
4. Verify search card appears in list
5. Tap 📈 Historial → verify screen loads (empty chart is OK)
6. Tap ⏸ Pausar → verify badge changes
7. Navigate to Ajustes → change threshold to 15€

- [ ] **Step 7: Final commit**

```bash
git add -A && git commit -m "feat: complete CholloAdvisor MVP"
```

---

## Post-MVP: Amadeus Real API Setup

> Do this once you have an Amadeus developer account.

- [ ] Register at https://developers.amadeus.com — free tier gives 100 req/month
- [ ] Copy Client ID and Client Secret to `backend/.env`
- [ ] Test with real search:

```bash
cd backend && node -e "
require('dotenv').config();
const { searchFlights } = require('./src/services/amadeusService');
searchFlights({ origin: 'MAD', destination: 'LHR', departDate: '2026-07-15', passengers: 1 }).then(console.log);
"
```

Expected: array of flight offers with real prices.

---

## Post-MVP: Firebase FCM Setup

- [ ] Create Firebase project at https://console.firebase.google.com
- [ ] Enable Cloud Messaging
- [ ] Download `google-services.json` → place in `mobile/google-services.json`
- [ ] Copy service account credentials to `backend/.env` (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL)
- [ ] Build Expo dev build (FCM requires native build, not Expo Go):

```bash
cd mobile && npx expo run:android
```

---

## Self-Review Against Spec

| Requirement | Task |
|---|---|
| Airport autocomplete (MAD, global) | Task 9 — AirportAutocomplete |
| Date picker ida/vuelta | Task 9 — SearchFormScreen |
| Passengers 1-9 | Task 9 — counter |
| Frecuencia configurable | Task 9 — FREQUENCY_OPTIONS |
| Lista búsquedas activas + precio | Task 10 — SearchCard |
| Tendencia ↑↓ | Task 10 — PriceTrend component |
| Gráfico lineal historial | Task 11 — PriceChart |
| Tabla precios históricos + filtros | Task 11 — PriceHistoryTable |
| Pantalla notificaciones + timestamp + enlace | Task 12 — NotificationsScreen |
| Settings: frecuencia, umbral, borrar data | Task 12 — SettingsScreen |
| SQLite: búsquedas + precios | Task 2 |
| Cron job + comparación precios | Task 6 — priceMonitor |
| Amadeus API | Task 5 |
| FCM push notifications | Task 6 + Task 12 |
| JWT auth | Task 3 |
| Todos los endpoints REST | Tasks 3-4 |
| Multidestino flag | Task 4 — model field + form |
| Pausa/reanudar búsqueda | Tasks 4 + 10 |
| Eliminar búsqueda | Tasks 4 + 10 |

All requirements covered.
