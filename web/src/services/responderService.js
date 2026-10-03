import { getApiBaseUrl } from '../config/api'
import { throwForApiError } from './apiErrors'

async function request(path, token, options = {}) {
  let response
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...options,
      headers: {
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new Error('Unable to connect to the server. Check your connection.')
  }

  let result
  try {
    result = await response.json()
  } catch {
    throw new Error('The responder service returned an unreadable response.')
  }

  throwForApiError(response, result, 'The responder request could not be completed.')
  return result
}

export const responderService = {
  async getProfile(token) {
    return request('/responders/me', token)
  },

  async updateAvailability(token, availability) {
    return request('/responders/me/availability', token, {
      method: 'PATCH',
      body: { availability },
    })
  },

  async listAssignedIncidents(token) {
    return request('/responders/me/incidents', token)
  },

  async getAssignedIncident(token, incidentId) {
    return request(`/responders/me/incidents/${encodeURIComponent(incidentId)}`, token)
  },

  async updateIncidentStatus(token, incidentId, status) {
    return request(`/incidents/${encodeURIComponent(incidentId)}/status`, token, {
      method: 'PATCH',
      body: { status },
    })
  },
}
