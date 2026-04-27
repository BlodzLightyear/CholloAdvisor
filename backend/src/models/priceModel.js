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
