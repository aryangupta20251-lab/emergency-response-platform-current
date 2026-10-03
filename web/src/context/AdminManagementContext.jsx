import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { adminService } from '../services/adminService'
import { incidentService } from '../services/incidentService'
import { listHospitals } from '../services/hospitalService'

const AdminManagementContext = createContext(null)

function statusLabel(status) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function toUserView(user) {
  return {
    ...user,
    status: user.accountStatus,
    identifier: user.identifier || user.email || user.phoneNumber || 'No contact information',
    joined: new Date(user.createdAt).toLocaleDateString(),
  }
}

function toIncidentView(incident) {
  return {
    ...incident,
    status: statusLabel(incident.status),
    date: new Date(incident.createdAt).toLocaleString(),
  }
}

function toResponderView(responder) {
  const state = !responder.isActive
    ? 'Inactive'
    : !responder.isVerified
      ? 'Unverified'
      : statusLabel(responder.availability)
  return {
    ...responder,
    id: responder.userId,
    identifier: responder.email || 'No email provided',
    zone: responder.serviceArea || 'Service area not set',
    status: state,
  }
}

export function AdminManagementProvider({ children }) {
  const { token, user } = useAuth()
  const [users, setUsers] = useState([])
  const [incidents, setIncidents] = useState([])
  const [responders, setResponders] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const loadAttempt = useRef(0)

  const loadData = useCallback(async () => {
    const attempt = ++loadAttempt.current
    if (!token || user?.role !== 'admin') {
      setUsers([])
      setIncidents([])
      setResponders([])
      setHospitals([])
      setLoading(false)
      setError('')
      return
    }

    setLoading(true)
    setError('')
    try {
      const [userResult, incidentResult, responderResult, hospitalResult] = await Promise.all([
        adminService.getUsers(token, { limit: 100 }),
        adminService.getIncidents(token, { limit: 100 }),
        adminService.getResponders(token, { limit: 100 }),
        listHospitals(),
      ])
      if (attempt !== loadAttempt.current) return
      setUsers(userResult.users.map(toUserView))
      setIncidents(incidentResult.incidents.map(toIncidentView))
      setResponders(responderResult.responders.map(toResponderView))
      setHospitals(hospitalResult)
    } catch (loadError) {
      if (attempt !== loadAttempt.current) return
      setUsers([])
      setIncidents([])
      setResponders([])
      setHospitals([])
      setError(loadError.message)
    } finally {
      if (attempt === loadAttempt.current) setLoading(false)
    }
  }, [token, user?.role])

  useEffect(() => {
    loadData()
    return () => { loadAttempt.current += 1 }
  }, [loadData])

  const updateUser = useCallback(async (id, updates) => {
    const current = users.find((item) => item.id === id)
    if (!current) throw new Error('User is no longer available.')
    const roleChanged = updates.role && updates.role !== current.role
    const statusChanged = updates.status && updates.status !== current.status
    if (roleChanged && statusChanged) {
      throw new Error('Save role and account status separately so each backend change is confirmed.')
    }
    const result = roleChanged
      ? (await adminService.updateUserRole(token, id, updates.role)).user
      : statusChanged
        ? (await adminService.updateUserStatus(token, id, updates.status)).user
        : current
    const updated = toUserView(result)
    setUsers((items) => items.map((item) => item.id === id ? updated : item))
  }, [token, users])

  const updateIncident = useCallback(async (id, updates) => {
    const response = await incidentService.updateStatus(token, id, updates.status.toLowerCase().replaceAll(' ', '_'))
    const updated = toIncidentView(response.incident)
    setIncidents((items) => items.map((item) => item.id === id ? updated : item))
  }, [token])

  const updateResponder = useCallback(async (id, updates) => {
    if (updates.isVerified !== undefined) {
      await adminService.updateResponderVerification(token, id, updates.isVerified ? 'verified' : 'pending')
    }
    if (updates.isActive !== undefined) {
      await adminService.updateResponderProfile(token, id, { isActive: updates.isActive })
    }
    const response = await adminService.getResponders(token, { limit: 100 })
    const record = response.responders.find((item) => item.userId === id)
    if (!record) throw new Error('Responder is no longer available.')
    const updated = toResponderView(record)
    setResponders((items) => items.map((item) => item.id === id ? updated : item))
  }, [token])

  const createResponderProfile = useCallback(async (profile) => {
    const result = await adminService.createResponderProfile(token, profile)
    await loadData()
    return result.responder
  }, [loadData, token])

  return (
    <AdminManagementContext.Provider value={{
      users,
      incidents,
      responders,
      hospitals,
      loading,
      error,
      refresh: loadData,
      updateUser,
      updateIncident,
      updateResponder,
      createResponderProfile,
    }}>
      {children}
    </AdminManagementContext.Provider>
  )
}

export function useAdminManagement() {
  const context = useContext(AdminManagementContext)
  if (!context) throw new Error('useAdminManagement must be used inside AdminManagementProvider')
  return context
}
