jest.mock('axios');
const axios = require('axios');
const { searchFlights } = require('../src/services/amadeusService');

beforeEach(() => {
  jest.resetModules();
  process.env.AMADEUS_CLIENT_ID = 'test_id';
  process.env.AMADEUS_CLIENT_SECRET = 'test_secret';
});

test('searchFlights returns normalized offers', async () => {
  axios.post.mockResolvedValueOnce({ data: { access_token: 'fake_token', expires_in: 1799 } });
  axios.get.mockResolvedValueOnce({
    data: {
      data: [{
        itineraries: [{ segments: [{ carrierCode: 'IB', departure: { iataCode: 'MAD' }, arrival: { iataCode: 'LHR' } }] }],
        price: { grandTotal: '89.50', currency: 'EUR' }
      }],
      dictionaries: { carriers: { IB: 'Iberia' } }
    }
  });

  const results = await searchFlights({ origin: 'MAD', destination: 'LHR', departDate: '2026-06-15', passengers: 1 });
  expect(results).toHaveLength(1);
  expect(results[0].priceEuros).toBe(89.50);
  expect(results[0].airline).toBe('Iberia');
});

test('searchFlights handles missing carrier dictionary gracefully', async () => {
  axios.post.mockResolvedValueOnce({ data: { access_token: 'fake_token', expires_in: 1799 } });
  axios.get.mockResolvedValueOnce({
    data: {
      data: [{
        itineraries: [{ segments: [{ carrierCode: 'XX', departure: { iataCode: 'MAD' }, arrival: { iataCode: 'LHR' } }] }],
        price: { grandTotal: '150.00', currency: 'EUR' }
      }],
      dictionaries: { carriers: {} }
    }
  });

  const results = await searchFlights({ origin: 'MAD', destination: 'LHR', departDate: '2026-06-15', passengers: 1 });
  expect(results[0].airline).toBe('XX');
});

test('searchFlights caches access token', async () => {
  jest.resetModules();
  jest.mock('axios');
  const axiosReset = require('axios');
  const { searchFlights: sf } = require('../src/services/amadeusService');

  axiosReset.post.mockResolvedValueOnce({ data: { access_token: 'fake_token', expires_in: 1799 } });
  axiosReset.get.mockResolvedValueOnce({
    data: {
      data: [{ itineraries: [{ segments: [{ carrierCode: 'IB' }] }], price: { grandTotal: '100', currency: 'EUR' } }],
      dictionaries: { carriers: { IB: 'Iberia' } }
    }
  });

  await sf({ origin: 'MAD', destination: 'LHR', departDate: '2026-06-15', passengers: 1 });
  const postCallCount = axiosReset.post.mock.calls.length;

  axiosReset.get.mockResolvedValueOnce({
    data: {
      data: [{ itineraries: [{ segments: [{ carrierCode: 'IB' }] }], price: { grandTotal: '150', currency: 'EUR' } }],
      dictionaries: { carriers: { IB: 'Iberia' } }
    }
  });

  await sf({ origin: 'BCN', destination: 'CDG', departDate: '2026-07-01', passengers: 2 });
  expect(axiosReset.post.mock.calls.length).toBe(postCallCount);
});

test('searchFlights includes flightUrl in response', async () => {
  axios.post.mockResolvedValueOnce({ data: { access_token: 'fake_token', expires_in: 1799 } });
  axios.get.mockResolvedValueOnce({
    data: {
      data: [{
        itineraries: [{ segments: [{ carrierCode: 'IB' }] }],
        price: { grandTotal: '89.50', currency: 'EUR' }
      }],
      dictionaries: { carriers: { IB: 'Iberia' } }
    }
  });

  const results = await searchFlights({ origin: 'MAD', destination: 'LHR', departDate: '2026-06-15', passengers: 1 });
  expect(results[0].flightUrl).toBeDefined();
  expect(results[0].flightUrl).toContain('amadeus');
});
