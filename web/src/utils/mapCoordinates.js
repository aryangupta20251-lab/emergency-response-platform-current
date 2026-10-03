export function getMapPosition(location) {
  if (!location || typeof location !== 'object') return null
  const latitudeValue = location.latitude ?? location.lat
  const longitudeValue = location.longitude ?? location.lng ?? location.lon
  if (latitudeValue === '' || longitudeValue === '' || latitudeValue == null || longitudeValue == null) return null

  const lat = Number(latitudeValue)
  const lng = Number(longitudeValue)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null
  }
  return { lat, lng }
}
