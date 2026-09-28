import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService'

const storageKey = 'emergency-response-user'
const tokenStorageKey = 'emergency-response-access-token'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const token = localStorage.getItem(tokenStorageKey)
    try {
      const user = token ? JSON.parse(localStorage.getItem(storageKey)) : null
      return user ? { user, token } : { user: null, token: null }
    } catch {
      return { user: null, token: null }
    }
  })
  const { user, token } = session

  useEffect(() => {
    if (user && token) {
      localStorage.setItem(storageKey, JSON.stringify(user))
      localStorage.setItem(tokenStorageKey, token)
      localStorage.removeItem('emergency-response-mock-user')
    } else {
      localStorage.removeItem(storageKey)
      localStorage.removeItem(tokenStorageKey)
      localStorage.removeItem('emergency-response-mock-user')
    }
  }, [user, token])

  const login = async (credentials) => {
    const nextSession = await authService.login(credentials)
    setSession(nextSession)
    return nextSession.user
  }

  const register = async (details) => {
    const nextSession = await authService.register(details)
    setSession(nextSession)
    return nextSession.user
  }

  const logout = () => setSession({ user: null, token: null })
  const updateProfile = (updates) => setSession((current) => ({
    ...current,
    user: current.user ? { ...current.user, ...updates } : null,
  }))

  return <AuthContext.Provider value={{ user, token, isAuthenticated: Boolean(user && token), login, register, logout, updateProfile, requestPasswordReset: authService.requestPasswordReset, resetPassword: authService.resetPassword }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}