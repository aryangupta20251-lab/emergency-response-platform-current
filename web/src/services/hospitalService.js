import { getApiBaseUrl } from '../config/api'

async function request(path) {
  const apiBase = getApiBaseUrl()
  let response
  try {
    response = await fetch(`${apiBase}${path}`)
  } catch {
    throw new Error('Unable to connect to the server. Check your connection.')
  }
  let data

  try {
    data = await response.json()
  } catch {
    throw new Error('The hospital service returned an unreadable response.')
  }

  if (!response.ok) {
    throw new Error(data.message || 'Hospital information is temporarily unavailable.')
  }

  return data
}

function toQueryString(filters) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  }
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

export async function listHospitals(filters = {}) {
  const result = await request(`/hospitals${toQueryString(filters)}`)
  return result.hospitals
}

export async function getHospital(id) {
  const result = await request(`/hospitals/${encodeURIComponent(id)}`)
  return result.hospital
}

export async function findNearbyHospitals({ latitude, longitude, radius = 10, ...filters }) {
  const result = await request(`/hospitals/nearby${toQueryString({ latitude, longitude, radius, ...filters })}`)
  return result.hospitals
}