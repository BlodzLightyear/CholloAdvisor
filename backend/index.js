require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET env var is not set');
  process.exit(1);
}

const { createApp } = require('./src/app');
const { initDb } = require('./src/db/database');
const { startPriceMonitor } = require('./src/services/priceMonitor');
const { initFirebase } = require('./src/services/fcmService');

const PORT = process.env.PORT || 3000;

(async () => {
  await initDb(
    process.env.TURSO_DATABASE_URL || 'file:cholloadvisor.db',
    process.env.TURSO_AUTH_TOKEN
  );
  initFirebase();
  const app = createApp();
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
  startPriceMonitor();
})();
