const { createClient } = require('@libsql/client');
const { runMigrations } = require('./migrations');

let client;

async function initDb(url = 'file:cholloadvisor.db', authToken) {
  const config = authToken ? { url, authToken } : { url };
  client = createClient(config);
  await runMigrations(client);
}

function getDb() {
  if (!client) throw new Error('DB not initialized. Call initDb() first.');
  return client;
}

module.exports = { initDb, getDb };
