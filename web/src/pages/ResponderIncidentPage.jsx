import { ArrowLeft, CheckCircle2, MapPin, MessageSquare, ThumbsDown, ThumbsUp } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import Card from '../components/Card'
import IncidentTimeline from '../components/IncidentTimeline'
import MapContainer from '../components/MapContainer'
import StatusBadge from '../components/StatusBadge'
import { useResponder } from '../context/ResponderContext'
import { assignedIncident } from '../data/responderData'

const actions = { Responding: { label: 'Mark arrived', next: 'Arrived' }, Arrived: { label: 'Mark completed', next: 'Resolved' } }

export default function ResponderIncidentPage() {
  const { incidentId } = useParams()
  const { assignmentStatus, assignmentState, acceptAssignment, rejectAssignment, updateIncidentStatus, resetAssignment } = useResponder()
  if (incidentId !== assignedIncident.id) return <Navigate to="/responder" replace />
  const timeline = [...assignedIncident.timeline, ...(assignmentStatus !== assignedIncident.status ? [{ status: assignmentStatus, time: 'Now', note: 'Updated in the responder demo workspace.' }] : [])]
  const action = actions[assignmentStatus]
  return <div className="page-content responder-detail-page"><Link className="report-back" to="/responder"><ArrowLeft size={16} /> Back to responder dashboard</Link><div className="page-header"><div><span className="eyebrow">Assignment · demo record</span><h1 className="page-title">{assignedIncident.type}</h1><p className="page-subtitle">{assignedIncident.id} · {assignedIncident.location}</p></div><StatusBadge label={assignmentStatus} /></div><div className="responder-detail-grid"><div className="responder-detail-main"><Card><div className="card-heading"><div><span className="muted-label">Assignment details</span><h2 className="detail-card-title">{assignedIncident.location}</h2></div><MapPin color="var(--color-primary)" size={21} /></div><MapContainer markers={[{ id: assignedIncident.id, name: assignedIncident.location, position: { left: '52%', top: '48%' } }]} /><p className="responder-detail-description">{assignedIncident.description}</p></Card><Card><div className="card-heading"><div><span className="muted-label">Responder timeline</span><h2 className="detail-card-title">Status updates</h2></div></div><IncidentTimeline events={timeline} /></Card></div><div className="responder-detail-side"><Alert tone="warning" title="Simulated assignment">Accepting or updating this assignment changes local demo state only. No person has been dispatched.</Alert>{assignmentState === 'assigned' && <Card className="responder-action-card"><h2>New assignment</h2><p>Review the incident and choose whether to accept it.</p><div className="responder-action-buttons"><Button onClick={acceptAssignment}><ThumbsUp size={16} /> Accept</Button><Button variant="danger" onClick={rejectAssignment}><ThumbsDown size={16} /> Reject</Button></div></Card>}{assignmentState === 'rejected' && <Card className="responder-action-card"><CheckCircle2 color="var(--color-success)" size={25} /><h2>Assignment rejected</h2><p>This demo assignment is no longer active.</p><Button variant="secondary" onClick={resetAssignment}>Reset demo assignment</Button></Card>}{action && <Card className="responder-action-card"><MessageSquare color="var(--color-primary)" size={24} /><h2>{assignmentStatus}</h2><p>Continue the simulated response workflow.</p><Button onClick={() => updateIncidentStatus(action.next)}>{action.label}</Button></Card>}{assignmentStatus === 'Resolved' && <Card className="responder-action-card"><CheckCircle2 color="var(--color-success)" size={25} /><h2>Assignment completed</h2><p>The demo incident is marked resolved. No real response occurred.</p></Card>}</div></div></div>
}