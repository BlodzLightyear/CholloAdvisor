require('dotenv').config();
const { createApp } = require('./src/app');
const { initDb } = require('./src/db/database');
const { startPriceMonitor } = require('./src/services/priceMonitor');
const { initFirebase } = require('./src/services/fcmService');

const PORT = process.env.PORT || 3000;

initDb();
initFirebase();
const app = createApp();
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
startPriceMonitor();
