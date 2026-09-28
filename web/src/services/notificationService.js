import { io } from 'socket.io-client'

const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/+$/, '')
const socketBase = apiBase.replace(/\/api\/?$/i, '')

async function request(path, token, options = {}) {
  let response
  try {
    response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('The notification service is unavailable. Check that the backend is running.')
  }

  let result
  try {
    result = await response.json()
  } catch {
    throw new Error('The notification service returned an unreadable response.')
  }
  if (!response.ok) throw new Error(result.message || 'The notification request could not be completed.')
  return result
}

export async function listNotifications(token, { page = 1, limit = 50 } = {}) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  return request(`/notifications?${query}`, token)
}

export async function getUnreadCount(token) {
  return request('/notifications/unread-count', token)
}

export async function markNotificationRead(token, notificationId) {
  return request(`/notifications/${encodeURIComponent(notificationId)}/read`, token, { method: 'PATCH' })
}

export async function markAllNotificationsRead(token) {
  return request('/notifications/read-all', token, { method: 'PATCH' })
}

export function connectNotificationSocket(token) {
  return io(socketBase, {
    auth: { token },
  })
}