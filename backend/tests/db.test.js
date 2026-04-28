const { initDb, getDb } = require('../src/db/database');

describe('database', () => {
  beforeAll(async () => {
    await initDb(':memory:');
  });

  test('users table exists', async () => {
    const result = await getDb().execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    expect(result.rows[0]).toBeDefined();
  });

  test('flight_searches table exists', async () => {
    const result = await getDb().execute("SELECT name FROM sqlite_master WHERE type='table' AND name='flight_searches'");
    expect(result.rows[0]).toBeDefined();
  });

  test('price_records table exists', async () => {
    const result = await getDb().execute("SELECT name FROM sqlite_master WHERE type='table' AND name='price_records'");
    expect(result.rows[0]).toBeDefined();
  });
});
