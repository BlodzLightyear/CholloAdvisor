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
