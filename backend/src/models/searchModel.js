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
