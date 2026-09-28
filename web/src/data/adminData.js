import { hospitals } from './hospitalData'
import { incidentStatuses, incidents } from './incidentData'
import { responderStatuses } from './responderData'

export const adminStats = [
  { label: 'Total incidents', value: '24', detail: 'Demo records this period', tone: 'primary' },
  { label: 'Active incidents', value: '7', detail: 'Reported or in progress', tone: 'warning' },
  { label: 'Resolved', value: '15', detail: 'Simulated closed records', tone: 'success' },
  { label: 'Cancelled', value: '2', detail: 'Demo records cancelled', tone: 'emergency' }
]

export const incidentStatusSummary = incidentStatuses.map((status, index) => ({ status, count: [3, 2, 2, 3, 2, 1, 9, 2][index] }))

export const responderSummary = responderStatuses.map((status, index) => ({ status, count: [12, 2, 4, 1][index] }))

export const adminActivity = [
  { title: 'Demo incident received', detail: `${incidents[0].id} · ${incidents[0].location}`, time: 'Just now', tone: 'info' },
  { title: 'Responder status updated', detail: 'Demo responder workspace marked busy', time: '8 min ago', tone: 'warning' },
  { title: 'Hospital directory synced', detail: `${hospitals.length} demo locations available`, time: 'Today, 09:30', tone: 'success' }
]

export const systemSummary = {
  hospitals: hospitals.length,
  responderProfiles: 19,
  demoEnvironment: 'Frontend only'
}