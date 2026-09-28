import { createContext, useCallback, useContext, useState } from 'react'
import { initialAdminHospitals, initialAdminIncidents, initialAdminResponders, initialAdminUsers } from '../data/adminManagementData'
import { adminManagementService } from '../services/adminManagementService'

const AdminManagementContext = createContext(null)

export function AdminManagementProvider({ children }) {
  const [users, setUsers] = useState(initialAdminUsers)
  const [incidents, setIncidents] = useState(initialAdminIncidents)
  const [responders, setResponders] = useState(initialAdminResponders)
  const [hospitals, setHospitals] = useState(initialAdminHospitals)
  const updateUser = useCallback(async (id, updates) => { const record = users.find((item) => item.id === id); await adminManagementService.update({ ...record, ...updates }); setUsers((current) => current.map((item) => item.id === id ? { ...item, ...updates } : item)) }, [users])
  const removeUser = useCallback(async (id) => { const record = users.find((item) => item.id === id); await adminManagementService.remove(record); setUsers((current) => current.filter((item) => item.id !== id)) }, [users])
  const updateIncident = useCallback(async (id, updates) => { const record = incidents.find((item) => item.id === id); await adminManagementService.update({ ...record, ...updates }); setIncidents((current) => current.map((item) => item.id === id ? { ...item, ...updates } : item)) }, [incidents])
  const removeIncident = useCallback(async (id) => { const record = incidents.find((item) => item.id === id); await adminManagementService.remove(record); setIncidents((current) => current.filter((item) => item.id !== id)) }, [incidents])
  const updateResponder = useCallback(async (id, updates) => { const record = responders.find((item) => item.id === id); await adminManagementService.update({ ...record, ...updates }); setResponders((current) => current.map((item) => item.id === id ? { ...item, ...updates } : item)) }, [responders])
  const removeResponder = useCallback(async (id) => { const record = responders.find((item) => item.id === id); await adminManagementService.remove(record); setResponders((current) => current.filter((item) => item.id !== id)) }, [responders])
  const updateHospital = useCallback(async (id, updates) => { const record = hospitals.find((item) => item.id === id); await adminManagementService.update({ ...record, ...updates }); setHospitals((current) => current.map((item) => item.id === id ? { ...item, ...updates } : item)) }, [hospitals])
  const removeHospital = useCallback(async (id) => { const record = hospitals.find((item) => item.id === id); await adminManagementService.remove(record); setHospitals((current) => current.filter((item) => item.id !== id)) }, [hospitals])
  return <AdminManagementContext.Provider value={{ users, incidents, responders, hospitals, updateUser, removeUser, updateIncident, removeIncident, updateResponder, removeResponder, updateHospital, removeHospital }}>{children}</AdminManagementContext.Provider>
}

export function useAdminManagement() {
  const context = useContext(AdminManagementContext)
  if (!context) throw new Error('useAdminManagement must be used inside AdminManagementProvider')
  return context
}