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

export const incidentService = {
  async listIncidents(token) {
    return request('/incidents', token)
  },

  async getIncident(token, incidentId) {
    return request(`/incidents/${encodeURIComponent(incidentId)}`, token)
  },

  async getIncidentHistory(token, incidentId) {
    return request(`/incidents/${encodeURIComponent(incidentId)}/history`, token)
  },

  async createIncident(token, payload) {
    return request('/incidents', token, {
      method: 'POST',
      body: payload,
    })
  },

  async updateStatus(token, incidentId, status) {
    return request(`/incidents/${encodeURIComponent(incidentId)}/status`, token, {
      method: 'PATCH',
      body: { status },
    })
  },
}
