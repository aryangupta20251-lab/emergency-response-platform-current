import { getApiBaseUrl } from '../config/api'
import { throwForApiError } from './apiErrors'

async function request(path, token, options = {}) {
  const apiBase = getApiBaseUrl()
  let response
  try {
    response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      body: options.body === undefined ? undefined : typeof options.body === 'string' ? options.body : JSON.stringify(options.body),
    })
  } catch {
    throw new Error('Unable to connect to the server. Check your connection.')
  }

  let result
  try {
    result = await response.json()
  } catch {
    throw new Error('The incident service returned an unreadable response.')
  }

  throwForApiError(response, result, 'The incident request could not be completed.')

  return result
}

export const accidentReportService = {
  async submit(report, token) {
    if (!token) {
      throw new Error('You need to be signed in before submitting an accident report.')
    }

    const location = report.location && typeof report.location === 'object'
      ? {
        name: report.location.name || 'Location not specified',
        source: report.location.source || 'Current device location',
        ...(Object.hasOwn(report.location, 'latitude') ? { latitude: report.location.latitude } : {}),
        ...(Object.hasOwn(report.location, 'longitude') ? { longitude: report.location.longitude } : {}),
      }
      : { name: String(report.location || 'Location not specified'), source: 'User-provided location' }

    const payload = {
      accidentType: report.accidentType,
      peopleInvolved: report.peopleInvolved,
      injuries: report.injuries,
      vehicles: report.vehicles,
      description: report.description?.trim() || '',
      location,
    }

    const result = await request('/incidents', token, {
      method: 'POST',
      body: payload,
    })

    if (!result?.incident || typeof result.incident.id !== 'string') {
      throw new Error('The server did not confirm this incident report. Check incident history before trying again.')
    }

    return result.incident
  },
}