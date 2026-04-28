const express = require('express');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmailWithCredentials, findUserById, updateUserFcmToken, updateUserSettings, verifyPassword } = require('../models/userModel');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const user = await createUser(email, password);
    res.status(201).json({ token: signToken(user.id), user });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await findUserByEmailWithCredentials(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const safeUser = await findUserById(user.id);
  res.json({ token: signToken(user.id), user: safeUser });
});

router.put('/fcm-token', requireAuth, async (req, res) => {
  const { fcmToken } = req.body;
  if (!fcmToken) return res.status(400).json({ error: 'fcmToken required' });
  await updateUserFcmToken(req.userId, fcmToken);
  res.json({ success: true });
});

router.put('/settings', requireAuth, async (req, res) => {
  const { alertThresholdEuros, defaultFrequencyHours } = req.body;
  const user = await updateUserSettings(req.userId, { alertThresholdEuros, defaultFrequencyHours });
  res.json({ user });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await findUserById(req.userId);
  res.json({ user });
});

module.exports = router;
