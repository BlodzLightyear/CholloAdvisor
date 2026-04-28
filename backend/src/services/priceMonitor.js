const cron = require('node-cron');
const { findAllActiveSearches, updateSearch } = require('../models/searchModel');
const { recordPrice, saveNotification } = require('../models/priceModel');
const { searchFlights } = require('./amadeusService');
const { sendPushNotification } = require('./fcmService');
const { findUserById } = require('../models/userModel');

async function checkSearchPrices(search) {
  let offers;
  try {
    offers = await searchFlights({
      origin: search.origin,
      destination: search.destination,
      departDate: search.depart_date,
      returnDate: search.return_date,
      passengers: search.passengers,
    });
  } catch (err) {
    console.error(`Price check failed for search ${search.id}:`, err.message);
    return;
  }

  if (!offers.length) return;

  const cheapest = offers.reduce((a, b) => a.priceEuros < b.priceEuros ? a : b);
  await recordPrice(search.id, cheapest);
  await updateSearch(search.id, search.user_id, { last_checked_at: new Date().toISOString() });

  const previousBest = search.best_price_euros;
  const user = await findUserById(search.user_id);
  const threshold = user?.alert_threshold_euros ?? 10;
  const isPriceDrop = !previousBest || cheapest.priceEuros < previousBest - threshold;

  if (isPriceDrop) {
    await updateSearch(search.id, search.user_id, {
      best_price_euros: cheapest.priceEuros,
      best_price_airline: cheapest.airline,
      best_price_url: cheapest.flightUrl,
    });

    const message = `${search.origin}→${search.destination}: ${cheapest.priceEuros}€ con ${cheapest.airline}${previousBest ? ` (era ${previousBest}€)` : ''}`;
    await saveNotification(search.user_id, search.id, { message, priceEuros: cheapest.priceEuros, airline: cheapest.airline, flightUrl: cheapest.flightUrl });

    if (user?.fcm_token) {
      await sendPushNotification(user.fcm_token, {
        title: '¡Precio bajado! ✈️',
        body: message,
        data: { searchId: String(search.id), price: String(cheapest.priceEuros) },
      });
    }
  }
}

async function runAllActiveSearches() {
  const searches = await findAllActiveSearches();
  const now = Date.now();
  const due = searches.filter(s => {
    if (!s.last_checked_at) return true;
    const lastMs = new Date(s.last_checked_at).getTime();
    return now - lastMs >= s.frequency_hours * 3600 * 1000;
  });
  for (const search of due) await checkSearchPrices(search);
}

function startPriceMonitor() {
  cron.schedule('*/30 * * * *', runAllActiveSearches);
  console.log('Price monitor cron started (runs every 30min, checks per-search frequency)');
}

module.exports = { startPriceMonitor, runAllActiveSearches, checkSearchPrices };
