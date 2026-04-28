const axios = require('axios');

const IGNAV_BASE_URL = 'https://ignav.com/api/fares';

async function searchFlights({ origin, destination, departDate, returnDate, passengers }) {
  const endpoint = returnDate ? `${IGNAV_BASE_URL}/round-trip` : `${IGNAV_BASE_URL}/one-way`;

  const body = {
    origin,
    destination,
    departure_date: departDate,
    ...(returnDate && { return_date: returnDate }),
    ...(passengers > 1 && { adults: passengers }),
  };

  const response = await axios.post(endpoint, body, {
    headers: {
      'X-Api-Key': process.env.IGNAV_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  const itineraries = response.data.itineraries ?? [];

  return itineraries.map(itinerary => ({
    priceEuros: itinerary.price?.amount ?? 0,
    airline: itinerary.outbound?.carrier ?? itinerary.outbound?.segments?.[0]?.carrier ?? 'Unknown',
    flightUrl: `https://ignav.com/book/${itinerary.ignav_id}`,
  }));
}

module.exports = { searchFlights };
