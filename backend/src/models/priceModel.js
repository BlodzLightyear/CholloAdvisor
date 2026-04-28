const { getDb } = require('../db/database');

async function recordPrice(searchId, { priceEuros, airline, flightUrl }) {
  await getDb().execute({
    sql: 'INSERT INTO price_records (search_id, price_euros, airline, flight_url) VALUES (?, ?, ?, ?)',
    args: [searchId, priceEuros, airline, flightUrl ?? null],
  });
}

async function getPriceHistory(searchId) {
  const result = await getDb().execute({
    sql: 'SELECT * FROM price_records WHERE search_id = ? ORDER BY recorded_at ASC',
    args: [searchId],
  });
  return result.rows;
}

async function getPriceStats(searchId) {
  const result = await getDb().execute({
    sql: `SELECT
            MIN(price_euros) as min_price,
            MAX(price_euros) as max_price,
            AVG(price_euros) as avg_price,
            COUNT(*) as data_points
          FROM price_records WHERE search_id = ?`,
    args: [searchId],
  });
  return result.rows[0] ?? null;
}

async function saveNotification(userId, searchId, { message, priceEuros, airline, flightUrl }) {
  await getDb().execute({
    sql: 'INSERT INTO notifications (user_id, search_id, message, price_euros, airline, flight_url) VALUES (?, ?, ?, ?, ?, ?)',
    args: [userId, searchId, message, priceEuros, airline, flightUrl ?? null],
  });
}

async function getNotificationsByUser(userId) {
  const result = await getDb().execute({
    sql: 'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100',
    args: [userId],
  });
  return result.rows;
}

module.exports = { recordPrice, getPriceHistory, getPriceStats, saveNotification, getNotificationsByUser };
