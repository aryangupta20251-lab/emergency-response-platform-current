import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService'
import { sessionExpiredEvent } from '../services/apiErrors'

const storageKey = 'emergency-response-user'
const tokenStorageKey = 'emergency-response-access-token'
const rememberMeKey = 'emergency-response-remember-me'
const sessionExpiredNoticeKey = 'emergency-response-session-expired-notice'
const AuthContext = createContext(null)

function getExpiresAt(token) {
  if (!token || typeof token !== 'string') return null
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null
  } catch {
    return null
  }
}

function clearStoredSession() {
  localStorage.removeItem(storageKey)
  localStorage.removeItem(tokenStorageKey)
  localStorage.removeItem(rememberMeKey)
  sessionStorage.removeItem(storageKey)
  sessionStorage.removeItem(tokenStorageKey)
}

function getSessionStore(rememberMe) {
  return rememberMe ? localStorage : sessionStorage
}

function readStoredSession() {
  const remembered = localStorage.getItem(rememberMeKey) === 'true'
  const store = remembered ? localStorage : sessionStorage
  const token = store.getItem(tokenStorageKey)
  const user = token ? store.getItem(storageKey) : null

  if (!token || !user) {
    return { user: null, token: null, rememberMe: remembered }
  }

  try {
    const parsed = JSON.parse(user)
    const expiresAt = getExpiresAt(token)
    if (expiresAt && Date.now() > expiresAt) {
      clearStoredSession()
      return { user: null, token: null, rememberMe: false }
    }
    return { user: parsed, token, rememberMe: remembered }
  } catch {
    clearStoredSession()
    return { user: null, token: null, rememberMe: false }
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession)
  const { user, token, rememberMe } = session

  useEffect(() => {
    const handleSessionExpired = () => {
      clearStoredSession()
      sessionStorage.setItem(sessionExpiredNoticeKey, 'true')
      setSession({ user: null, token: null, rememberMe: false })
    }
    window.addEventListener(sessionExpiredEvent, handleSessionExpired)
    return () => window.removeEventListener(sessionExpiredEvent, handleSessionExpired)
  }, [])

  useEffect(() => {
    if (user && token) {
      const store = getSessionStore(rememberMe)
      const otherStore = rememberMe ? sessionStorage : localStorage
      store.setItem(storageKey, JSON.stringify(user))
      store.setItem(tokenStorageKey, token)
      localStorage.setItem(rememberMeKey, String(Boolean(rememberMe)))
      otherStore.removeItem(storageKey)
      otherStore.removeItem(tokenStorageKey)
      localStorage.removeItem('emergency-response-mock-user')
    } else {
      clearStoredSession()
    }
  }, [user, token, rememberMe])

  const login = async (credentials, nextRememberMe = true) => {
    const nextSession = await authService.login(credentials)
    sessionStorage.removeItem(sessionExpiredNoticeKey)
    setSession({ ...nextSession, rememberMe: nextRememberMe })
    return nextSession.user
  }

  const register = async (details, nextRememberMe = true) => {
    const nextSession = await authService.register(details)
    setSession({ ...nextSession, rememberMe: nextRememberMe })
    return nextSession.user
  }

  const logout = () => {
    clearStoredSession()
    setSession({ user: null, token: null, rememberMe: false })
  }

  const updateProfile = (updates) => setSession((current) => ({
    ...current,
    user: current.user ? { ...current.user, ...updates } : null,
  }))

  return <AuthContext.Provider value={{ user, token, rememberMe, isAuthenticated: Boolean(user && token), login, register, logout, updateProfile, requestPasswordReset: authService.requestPasswordReset, resetPassword: authService.resetPassword }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}