import { incidents } from './incidentData'

export const responderStatuses = ['Available', 'Unavailable', 'Busy', 'Offline']

export const assignedIncident = {
  ...incidents[0],
  status: 'Responder Assigned',
  assignmentNote: 'Demo assignment · no real dispatch has been created.',
  assignedAt: 'Today, 18:45',
  demoResponder: 'Alex Morgan · Demo responder'
}