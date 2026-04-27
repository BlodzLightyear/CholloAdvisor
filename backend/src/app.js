const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/searches');
const priceRoutes = require('./routes/prices');

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/auth', authRoutes);
  app.use('/searches', searchRoutes);
  app.use('/prices', priceRoutes);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  return app;
}

module.exports = { createApp };
