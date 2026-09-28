import { Activity, ArrowRight, MapPin, ShieldCheck, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import Card from '../components/Card'
import MapContainer from '../components/MapContainer'
import StatusBadge from '../components/StatusBadge'
import { useResponder } from '../context/ResponderContext'
import { assignedIncident, responderStatuses } from '../data/responderData'

export default function ResponderDashboardPage() {
  const { availability, assignmentStatus, assignmentState, setResponderStatus, resetAssignment } = useResponder()
  const hasAssignment = assignmentState !== 'rejected'
  return <div className="page-content responder-page"><div className="page-header"><div><span className="eyebrow"><ShieldCheck size={14} /> Responder dashboard</span><h1 className="page-title">Response Desk</h1><p className="page-subtitle">Review simulated assignments and update your demo availability.</p></div><StatusBadge label={availability} /></div><Alert tone="info" title="Demo responder workspace">This screen shows simulated assignments only. No real dispatch or responder coordination is active.</Alert><div className="responder-status-panel"><div><span className="muted-label">Your availability</span><h2>{availability}</h2><p>Choose a mock state for this browser session.</p></div><div className="responder-status-options">{responderStatuses.map((status) => <button className={`responder-status-option ${availability === status ? 'responder-status-option--active' : ''}`} type="button" key={status} onClick={() => setResponderStatus(status)}><span className={`status-dot status-dot--${status === 'Available' ? 'success' : status === 'Busy' ? 'warning' : status === 'Unavailable' ? 'emergency' : 'info'}`} />{status}</button>)}</div></div>{hasAssignment ? <Card className="responder-assignment-card"><div className="card-heading"><div><span className="muted-label">Assigned incident</span><h2>{assignedIncident.type}</h2><p className="responder-assignment-id">{assignedIncident.id}</p></div><StatusBadge label={assignmentStatus} /></div><div className="responder-assignment-facts"><span><MapPin size={16} /><strong>{assignedIncident.location}</strong></span><span><UserRound size={16} /><strong>{assignedIncident.peopleInvolved} people involved</strong></span><span><Activity size={16} /><strong>Assigned {assignedIncident.assignedAt}</strong></span></div><p className="responder-assignment-note">{assignedIncident.assignmentNote}</p><div className="responder-assignment-actions"><Link className="btn btn--primary" to={`/responder/incident/${assignedIncident.id}`}>View assignment <ArrowRight size={16} /></Link></div></Card> : <Card className="responder-empty"><div className="placeholder-page__icon"><ClipboardIcon /></div><h2>No active assignment</h2><p>The demo assignment was rejected. Reset it to test the responder flow again.</p><Button variant="secondary" onClick={resetAssignment}>Reset demo assignment</Button></Card>}</div>
}

function ClipboardIcon() { return <ShieldCheck size={26} /> }