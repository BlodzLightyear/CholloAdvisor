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
