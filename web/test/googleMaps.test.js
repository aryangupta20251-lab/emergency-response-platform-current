import assert from 'node:assert/strict'
import test from 'node:test'
import { loadGoogleMaps } from '../src/services/googleMapsLoader.js'
import { getMapPosition } from '../src/utils/mapCoordinates.js'

test('Google Maps reports a clear configuration error when the browser key is missing', async () => {
  await assert.rejects(loadGoogleMaps(), {
    code: 'GOOGLE_MAPS_KEY_MISSING',
    message: 'Set VITE_GOOGLE_MAPS_API_KEY to load Google Maps.',
  })
})

test('map coordinates accept valid latitude and longitude values', () => {
  assert.deepEqual(getMapPosition({ latitude: '30.7415', longitude: '76.7683' }), {
    lat: 30.7415,
    lng: 76.7683,
  })
  assert.deepEqual(getMapPosition({ lat: -90, lon: 180 }), { lat: -90, lng: 180 })
})

test('map coordinates reject missing, empty, non-finite, and out-of-range values', () => {
  for (const position of [
    null,
    {},
    { latitude: '', longitude: '76.7' },
    { latitude: 'north', longitude: '76.7' },
    { latitude: 90.1, longitude: 76.7 },
    { latitude: 30.7, longitude: -180.1 },
  ]) {
    assert.equal(getMapPosition(position), null)
  }
})
