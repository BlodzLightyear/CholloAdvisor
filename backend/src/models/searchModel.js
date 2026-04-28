const { getDb } = require('../db/database');

async function createSearch(userId, { origin, destination, departDate, returnDate, passengers, isMultidestino, frequencyHours }) {
  const result = await getDb().execute({
    sql: `INSERT INTO flight_searches (user_id, origin, destination, depart_date, return_date, passengers, is_multidestino, frequency_hours)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [userId, origin, destination, departDate, returnDate ?? null, passengers, isMultidestino ? 1 : 0, frequencyHours ?? 6],
  });
  return findSearchById(Number(result.lastInsertRowid));
}

async function findSearchById(id) {
  const result = await getDb().execute({
    sql: 'SELECT * FROM flight_searches WHERE id = ?',
    args: [id],
  });
  return result.rows[0] ?? null;
}

async function findActiveSearchesByUser(userId) {
  const result = await getDb().execute({
    sql: 'SELECT * FROM flight_searches WHERE user_id = ? ORDER BY created_at DESC',
    args: [userId],
  });
  return result.rows;
}

async function findAllActiveSearches() {
  const result = await getDb().execute("SELECT * FROM flight_searches WHERE status = 'active'");
  return result.rows;
}

async function updateSearch(id, userId, fields) {
  const allowed = ['status', 'frequency_hours', 'best_price_euros', 'best_price_airline', 'best_price_url', 'last_checked_at'];
  const filtered = Object.entries(fields).filter(([k]) => allowed.includes(k));
  if (!filtered.length) return findSearchById(id);
  const setClauses = filtered.map(([k]) => `${k} = ?`).join(', ');
  const args = [...filtered.map(([, v]) => v), id, userId];
  await getDb().execute({
    sql: `UPDATE flight_searches SET ${setClauses} WHERE id = ? AND user_id = ?`,
    args,
  });
  return findSearchById(id);
}

async function deleteSearch(id, userId) {
  const result = await getDb().execute({
    sql: 'DELETE FROM flight_searches WHERE id = ? AND user_id = ?',
    args: [id, userId],
  });
  return result;
}

module.exports = { createSearch, findSearchById, findActiveSearchesByUser, findAllActiveSearches, updateSearch, deleteSearch };
