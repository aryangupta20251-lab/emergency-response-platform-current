import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { useNotifications } from './NotificationContext'
import { responderService } from '../services/responderService'

const ResponderContext = createContext(null)

function statusLabel(value) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function ResponderProvider({ children }) {
  const { token, user } = useAuth()
  const { incidentUpdates } = useNotifications()
  const [profile, setProfile] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const loadAttempt = useRef(0)

  const refresh = useCallback(async () => {
    const attempt = ++loadAttempt.current
    if (!token || user?.role !== 'responder') {
      setProfile(null)
      setAssignments([])
      setLoading(false)
      setError('')
      return
    }

    setLoading(true)
    setError('')
    try {
      const [profileResult, assignmentResult] = await Promise.all([
        responderService.getProfile(token),
        responderService.listAssignedIncidents(token),
      ])
      if (attempt !== loadAttempt.current) return
      setProfile(profileResult.responder)
      setAssignments(assignmentResult.incidents)
    } catch (loadError) {
      if (attempt !== loadAttempt.current) return
      setProfile(null)
      setAssignments([])
      setError(loadError.message)
    } finally {
      if (attempt === loadAttempt.current) setLoading(false)
    }
  }, [token, user?.role])

  useEffect(() => {
    refresh()
    return () => { loadAttempt.current += 1 }
  }, [refresh])

  useEffect(() => {
    if (incidentUpdates.length) refresh()
  }, [incidentUpdates, refresh])

  const setResponderStatus = useCallback(async (availability) => {
    const result = await responderService.updateAvailability(token, availability.toLowerCase())
    setProfile(result.responder)
    return result.responder
  }, [token])

  const updateIncidentStatus = useCallback(async (incidentId, status) => {
    const result = await responderService.updateIncidentStatus(token, incidentId, status.toLowerCase().replaceAll(' ', '_'))
    setAssignments((current) => current.map((incident) => incident.id === incidentId ? result.incident : incident))
    return result.incident
  }, [token])

  return (
    <ResponderContext.Provider value={{
      profile,
      assignments,
      loading,
      error,
      refresh,
      availability: profile ? statusLabel(profile.availability) : 'Offline',
      setResponderStatus,
      updateIncidentStatus,
    }}>
      {children}
    </ResponderContext.Provider>
  )
}

export function useResponder() {
  const context = useContext(ResponderContext)
  if (!context) throw new Error('useResponder must be used inside ResponderProvider')
  return context
}
