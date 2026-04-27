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
