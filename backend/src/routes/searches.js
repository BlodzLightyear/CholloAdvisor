const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { createSearch, findActiveSearchesByUser, updateSearch, deleteSearch, findSearchById } = require('../models/searchModel');
const { getPriceHistory } = require('../models/priceModel');

const router = express.Router();
router.use(requireAuth);

router.post('/', (req, res) => {
  const { origin, destination, departDate, returnDate, passengers, isMultidestino, frequencyHours } = req.body;
  if (!origin || !destination || !departDate || !passengers) {
    return res.status(400).json({ error: 'origin, destination, departDate, passengers required' });
  }
  const search = createSearch(req.userId, { origin, destination, departDate, returnDate, passengers, isMultidestino, frequencyHours });
  res.status(201).json({ search });
});

router.get('/', (req, res) => {
  const searches = findActiveSearchesByUser(req.userId);
  res.json({ searches });
});

router.get('/:id/history', (req, res) => {
  const search = findSearchById(req.params.id);
  if (!search || search.user_id !== req.userId) return res.status(404).json({ error: 'Not found' });
  const records = getPriceHistory(req.params.id);
  res.json({ records });
});

router.put('/:id', (req, res) => {
  const { status, frequencyHours } = req.body;
  const fields = {};
  if (status) fields.status = status;
  if (frequencyHours) fields.frequency_hours = frequencyHours;
  const search = updateSearch(req.params.id, req.userId, fields);
  if (!search) return res.status(404).json({ error: 'Not found' });
  res.json({ search });
});

router.delete('/:id', (req, res) => {
  const result = deleteSearch(req.params.id, req.userId);
  if (!result.changes) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = router;
