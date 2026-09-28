import { incidentStatusSummary, responderSummary } from './adminData'

export const incidentTrend = [
  { label: 'Mon', incidents: 6, resolved: 3 },
  { label: 'Tue', incidents: 8, resolved: 5 },
  { label: 'Wed', incidents: 5, resolved: 4 },
  { label: 'Thu', incidents: 11, resolved: 7 },
  { label: 'Fri', incidents: 9, resolved: 6 },
  { label: 'Sat', incidents: 14, resolved: 9 },
  { label: 'Sun', incidents: 10, resolved: 8 }
]

export const analyticsStatusSummary = incidentStatusSummary
export const analyticsResponderSummary = responderSummary.map((item, index) => ({ ...item, activity: [18, 4, 11, 2][index], responseMinutes: [6, 18, 12, 0][index] }))

export const auditLogEntries = [
  { id: 'audit-001', timestamp: '24 Sep 2024, 18:46', actor: 'Demo Admin', action: 'Reviewed incident status', object: 'ACC-2024-0520941', detail: 'Status overview opened', status: 'Completed' },
  { id: 'audit-002', timestamp: '24 Sep 2024, 18:45', actor: 'Demo Responder', action: 'Accepted assignment', object: 'ACC-2024-0520941', detail: 'Mock workflow moved to Responding', status: 'Simulated' },
  { id: 'audit-003', timestamp: '24 Sep 2024, 09:30', actor: 'System demo', action: 'Updated directory', object: 'Hospital directory', detail: '3 sample records available', status: 'Completed' },
  { id: 'audit-004', timestamp: '23 Sep 2024, 16:20', actor: 'Demo Admin', action: 'Changed user status', object: 'user-demo-reviewer', detail: 'Account marked inactive', status: 'Simulated' }
]

export const reportCards = [
  { id: 'incident-summary', title: 'Incident summary', detail: 'Counts, statuses, and seven-day demo trend', icon: 'incident' },
  { id: 'responder-activity', title: 'Responder activity', detail: 'Availability and simulated response activity', icon: 'responder' },
  { id: 'system-directory', title: 'System directory', detail: 'Demo hospitals, users, and environment notes', icon: 'system' }
]