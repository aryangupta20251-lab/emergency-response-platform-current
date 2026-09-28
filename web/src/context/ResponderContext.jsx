import { createContext, useCallback, useContext, useState } from 'react'
import { assignedIncident } from '../data/responderData'

const ResponderContext = createContext(null)

export function ResponderProvider({ children }) {
  const [availability, setAvailability] = useState('Available')
  const [assignmentStatus, setAssignmentStatus] = useState(assignedIncident.status)
  const [assignmentState, setAssignmentState] = useState('assigned')
  const setResponderStatus = useCallback((status) => setAvailability(status), [])
  const acceptAssignment = useCallback(() => { setAssignmentState('accepted'); setAssignmentStatus('Responding'); setAvailability('Busy') }, [])
  const rejectAssignment = useCallback(() => { setAssignmentState('rejected'); setAssignmentStatus('Cancelled') }, [])
  const updateIncidentStatus = useCallback((status) => setAssignmentStatus(status), [])
  const resetAssignment = useCallback(() => { setAssignmentState('assigned'); setAssignmentStatus(assignedIncident.status); setAvailability('Available') }, [])
  return <ResponderContext.Provider value={{ availability, assignmentStatus, assignmentState, setResponderStatus, acceptAssignment, rejectAssignment, updateIncidentStatus, resetAssignment }}>{children}</ResponderContext.Provider>
}

export function useResponder() {
  const context = useContext(ResponderContext)
  if (!context) throw new Error('useResponder must be used inside ResponderProvider')
  return context
}