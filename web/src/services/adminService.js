const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/+$/, '')

function toQueryString(params = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    query.set(key, String(value))
  }
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

async function request(path, token, options = {}) {
  const headers = { ...options.headers }
  if (token) headers.Authorization = `Bearer ${token}`
  if (options.body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  let response
  try {
    response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers,
      body: options.body === undefined ? undefined : typeof options.body === 'string' ? options.body : JSON.stringify(options.body),
    })
  } catch {
    throw new Error('The admin service is unavailable. Check that the backend is running.')
  }

  let result
  try {
    result = await response.json()
  } catch {
    throw new Error('The admin service returned an unreadable response.')
  }

  if (!response.ok) {
    throw new Error(result?.message || 'The administrator request could not be completed.')
  }

  return result
}

export const adminService = {
  async getStatistics(token) {
    return request('/admin/statistics', token)
  },

  async getUsers(token, filters = {}) {
    return request(`/admin/users${toQueryString(filters)}`, token)
  },

  async getUser(token, id) {
    return request(`/admin/users/${encodeURIComponent(id)}`, token)
  },

  async updateUserStatus(token, id, status) {
    return request(`/admin/users/${encodeURIComponent(id)}/status`, token, {
      method: 'PATCH',
      body: { status },
    })
  },

  async updateUserRole(token, id, role) {
    return request(`/admin/users/${encodeURIComponent(id)}/role`, token, {
      method: 'PATCH',
      body: { role },
    })
  },

  async getResponders(token, filters = {}) {
    return request(`/admin/responders${toQueryString(filters)}`, token)
  },

  async getPendingResponders(token) {
    return request('/admin/responders/pending', token)
  },

  async updateResponderVerification(token, id, status) {
    return request(`/admin/responders/${encodeURIComponent(id)}/verification`, token, {
      method: 'PATCH',
      body: { status },
    })
  },

  async getIncidents(token, filters = {}) {
    return request(`/admin/incidents${toQueryString(filters)}`, token)
  },

  async getActiveIncidents(token) {
    return request('/admin/incidents/active', token)
  },
}
