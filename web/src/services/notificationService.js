import { io } from 'socket.io-client'
import { getApiBaseUrl, getSocketBaseUrl } from '../config/api'
import { notifySessionExpired, throwForApiError } from './apiErrors'

async function request(path, token, options = {}) {
  const apiBase = getApiBaseUrl()
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
    throw new Error('Unable to connect to the server. Check your connection.')
  }

  let result
  try {
    result = await response.json()
  } catch {
    throw new Error('The notification service returned an unreadable response.')
  }
  throwForApiError(response, result, 'The notification request could not be completed.')
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
  const socket = io(getSocketBaseUrl(), {
    auth: { token },
  })
  socket.on('connect_error', (error) => {
    if (/authentication required|invalid or expired token/i.test(error.message)) {
      notifySessionExpired()
    }
  })
  return socket
}