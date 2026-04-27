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
