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

  app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };
