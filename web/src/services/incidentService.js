const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/+$/, '')

async function request(path, token, options = {}) {
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
    throw new Error('The incident service is unavailable. Check that the backend is running.')
  }

  let result
  try {
    result = await response.json()
  } catch {
    throw new Error('The incident service returned an unreadable response.')
  }

  if (!response.ok) {
    throw new Error(result?.message || 'The incident request could not be completed.')
  }

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
}
