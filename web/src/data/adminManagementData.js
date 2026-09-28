import { hospitals } from './hospitalData'
import { incidents } from './incidentData'

export const adminUserStatuses = ['Active', 'Inactive', 'Suspended']
export const adminResponderStatuses = ['Available', 'Unavailable', 'Busy', 'Offline']

export const initialAdminUsers = [
  { id: 'user-demo-citizen', name: 'Demo Citizen', identifier: 'demo@example.com', role: 'Citizen', status: 'Active', joined: '24 Sep 2024' },
  { id: 'user-demo-responder', name: 'Alex Morgan', identifier: 'responder.demo@example.com', role: 'Responder', status: 'Active', joined: '18 Sep 2024' },
  { id: 'user-demo-reviewer', name: 'Jordan Lee', identifier: 'reviewer.demo@example.com', role: 'Reviewer', status: 'Inactive', joined: '02 Sep 2024' }
]

export const initialAdminIncidents = incidents.map((incident) => ({ ...incident, archived: false }))

export const initialAdminResponders = [
  { id: 'responder-alex', name: 'Alex Morgan', identifier: 'Demo responder', status: 'Available', assigned: 1, zone: 'Sector 12' },
  { id: 'responder-sam', name: 'Sam Rivera', identifier: 'Demo responder', status: 'Busy', assigned: 2, zone: 'Industrial Area' },
  { id: 'responder-taylor', name: 'Taylor Kim', identifier: 'Demo responder', status: 'Unavailable', assigned: 0, zone: 'Madhya Marg' },
  { id: 'responder-casey', name: 'Casey Patel', identifier: 'Demo responder', status: 'Offline', assigned: 0, zone: 'Sector 16' }
]

export const initialAdminHospitals = hospitals.map((hospital) => ({ ...hospital, status: 'Listed', archived: false }))