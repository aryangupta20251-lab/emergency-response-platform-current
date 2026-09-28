import { incidents } from './incidentData'
import { hospitals } from './hospitalData'

export const dashboardData = {
  location: {
    label: 'Current location',
    name: 'Sector 12, Chandigarh',
    note: 'Demo location · last updated just now'
  },
  hospitals: hospitals.slice(0, 2),
  contacts: [
    { name: 'Priya Gupta', relation: 'Primary contact', phone: '+91 98765 43210' },
    { name: 'Emergency services', relation: 'Available in demo mode', phone: '112' }
  ],
  incident: { ...incidents[0], time: 'Demo incident · 12 min ago' },
  updates: [
    { title: 'Welcome to the platform', detail: 'Demo notification · just now' },
    { title: 'Emergency contacts', detail: 'Review your trusted contacts' }
  ]
}