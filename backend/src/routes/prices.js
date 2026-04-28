const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { getPriceStats, getNotificationsByUser } = require('../models/priceModel');
const { findSearchById } = require('../models/searchModel');

const router = express.Router();
router.use(requireAuth);

router.get('/notifications', async (req, res) => {
  const notifications = await getNotificationsByUser(req.userId);
  res.json({ notifications });
});

router.get('/:id/stats', async (req, res) => {
  const search = await findSearchById(req.params.id);
  if (!search || search.user_id !== req.userId) return res.status(404).json({ error: 'Not found' });
  const stats = await getPriceStats(req.params.id);
  res.json({ stats });
});

module.exports = router;
