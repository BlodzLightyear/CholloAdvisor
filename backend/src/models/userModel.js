const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');

async function createUser(email, password) {
  const passwordHash = bcrypt.hashSync(password, 10);
  const result = await getDb().execute({
    sql: 'INSERT INTO users (email, password_hash) VALUES (?, ?)',
    args: [email, passwordHash],
  });
  return findUserById(Number(result.lastInsertRowid));
}

async function findUserByEmailWithCredentials(email) {
  const result = await getDb().execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: [email],
  });
  return result.rows[0] ?? null;
}

async function findUserById(id) {
  const result = await getDb().execute({
    sql: 'SELECT id, email, fcm_token, alert_threshold_euros, default_frequency_hours, created_at FROM users WHERE id = ?',
    args: [id],
  });
  return result.rows[0] ?? null;
}

async function updateUserFcmToken(userId, fcmToken) {
  await getDb().execute({
    sql: 'UPDATE users SET fcm_token = ? WHERE id = ?',
    args: [fcmToken, userId],
  });
}

async function updateUserSettings(userId, { alertThresholdEuros, defaultFrequencyHours }) {
  await getDb().execute({
    sql: 'UPDATE users SET alert_threshold_euros = COALESCE(?, alert_threshold_euros), default_frequency_hours = COALESCE(?, default_frequency_hours) WHERE id = ?',
    args: [alertThresholdEuros ?? null, defaultFrequencyHours ?? null, userId],
  });
  return findUserById(userId);
}

function verifyPassword(plaintext, hash) {
  return bcrypt.compareSync(plaintext, hash);
}

module.exports = { createUser, findUserByEmailWithCredentials, findUserById, updateUserFcmToken, updateUserSettings, verifyPassword };
