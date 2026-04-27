const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { getPriceStats, getNotificationsByUser } = require('../models/priceModel');
const { findSearchById } = require('../models/searchModel');

const router = express.Router();
router.use(requireAuth);

router.get('/notifications', (req, res) => {
  const notifications = getNotificationsByUser(req.userId);
  res.json({ notifications });
});

router.get('/:id/stats', (req, res) => {
  const search = findSearchById(req.params.id);
  if (!search || search.user_id !== req.userId) return res.status(404).json({ error: 'Not found' });
  const stats = getPriceStats(req.params.id);
  res.json({ stats });
});

module.exports = router;
