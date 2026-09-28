import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import {
  connectNotificationSocket,
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService'

const NotificationContext = createContext(null)

function toViewNotification(notification) {
  return {
    ...notification,
    read: notification.isRead,
    detail: notification.message,
    time: new Date(notification.createdAt).toLocaleString(),
  }
}

export function NotificationProvider({ children }) {
  const { token } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [incidentUpdates, setIncidentUpdates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const receivedIds = useRef(new Set())

  useEffect(() => {
    if (!token) {
      setNotifications([])
      setUnreadCount(0)
      setIncidentUpdates([])
      setError('')
      setLoading(false)
      setRealtimeConnected(false)
      receivedIds.current.clear()
      return undefined
    }

    let active = true
    setLoading(true)
    setError('')

    Promise.all([listNotifications(token), getUnreadCount(token)])
      .then(([page, unread]) => {
        if (!active) return
        const loaded = page.notifications.map(toViewNotification)
        receivedIds.current = new Set(loaded.map((item) => item.id))
        setNotifications(loaded)
        setUnreadCount(unread.count)
      })
      .catch((loadError) => {
        if (active) setError(loadError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const socket = connectNotificationSocket(token)
    socket.on('connect', () => { if (active) setRealtimeConnected(true) })
    socket.on('disconnect', () => { if (active) setRealtimeConnected(false) })
    socket.on('connect_error', () => { if (active) setRealtimeConnected(false) })
    socket.on('notification:new', (notification) => {
      if (!active || !notification?.id || receivedIds.current.has(notification.id)) return
      receivedIds.current.add(notification.id)
      setNotifications((current) => [toViewNotification(notification), ...current].slice(0, 50))
      if (!notification.isRead) setUnreadCount((count) => count + 1)
    })
    socket.on('notification:read', ({ id, readAt }) => {
      if (!active) return
      setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true, isRead: true, readAt } : item))
    })
    socket.on('notification:read-all', () => {
      if (!active) return
      setNotifications((current) => current.map((item) => ({ ...item, read: true, isRead: true })))
      setUnreadCount(0)
    })
    socket.on('incident:update', (update) => {
      if (!active || !update?.id) return
      setIncidentUpdates((current) => [update, ...current.filter((item) => item.id !== update.id)].slice(0, 20))
    })

    return () => {
      active = false
      socket.disconnect()
    }
  }, [token])

  const markRead = useCallback(async (id) => {
    if (!token) return
    const existing = notifications.find((item) => item.id === id)
    try {
      const result = await markNotificationRead(token, id)
      const updated = toViewNotification(result.notification)
      setNotifications((current) => current.map((item) => item.id === id ? updated : item))
      if (existing && !existing.read) setUnreadCount((count) => Math.max(0, count - 1))
    } catch (markError) {
      setError(markError.message)
    }
  }, [notifications, token])

  const markAllRead = useCallback(async () => {
    if (!token) return
    try {
      await markAllNotificationsRead(token)
      setNotifications((current) => current.map((item) => ({ ...item, read: true, isRead: true })))
      setUnreadCount(0)
    } catch (markError) {
      setError(markError.message)
    }
  }, [token])

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      incidentUpdates,
      loading,
      error,
      realtimeConnected,
      markRead,
      markAllRead,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used inside NotificationProvider')
  return context
}