const axios = require('axios');

const AMADEUS_AUTH_URL = 'https://test.api.amadeus.com/v1/security/oauth2/token';
const AMADEUS_FLIGHTS_URL = 'https://test.api.amadeus.com/v2/shopping/flight-offers';

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const response = await axios.post(
    AMADEUS_AUTH_URL,
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.AMADEUS_CLIENT_ID,
      client_secret: process.env.AMADEUS_CLIENT_SECRET,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  cachedToken = response.data.access_token;
  tokenExpiresAt = Date.now() + (response.data.expires_in - 60) * 1000;

  return cachedToken;
}

async function searchFlights({ origin, destination, departDate, returnDate, passengers }) {
  const token = await getAccessToken();

  const params = {
    originLocationCode: origin,
    destinationLocationCode: destination,
    departureDate: departDate,
    adults: passengers,
    max: 10,
    currencyCode: 'EUR',
  };

  if (returnDate) {
    params.returnDate = returnDate;
  }

  const response = await axios.get(AMADEUS_FLIGHTS_URL, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });

  const carriers = response.data.dictionaries?.carriers ?? {};

  return response.data.data.map(offer => ({
    priceEuros: parseFloat(offer.price.grandTotal),
    airline: carriers[offer.itineraries[0].segments[0].carrierCode] ?? offer.itineraries[0].segments[0].carrierCode,
    flightUrl: 'https://www.amadeus.com',
  }));
}

module.exports = { searchFlights };
