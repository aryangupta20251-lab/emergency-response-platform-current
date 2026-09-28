import { ArrowLeft, CalendarDays, FileText, MapPin, UsersRound } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Alert from '../components/Alert'
import Card from '../components/Card'
import IncidentTimeline from '../components/IncidentTimeline'
import MapContainer from '../components/MapContainer'
import StatusBadge from '../components/StatusBadge'
import { incidents } from '../data/incidentData'

export default function IncidentDetailPage() {
  const { incidentId } = useParams()
  const incident = incidents.find((item) => item.id === incidentId)
  if (!incident) return <Navigate to="/incidents" replace />
  const hasCoordinates = Number.isFinite(incident.latitude) && Number.isFinite(incident.longitude)
  return <div className="page-content incident-detail-page"><Link className="report-back" to="/incidents"><ArrowLeft size={16} /> Back to incidents</Link><div className="page-header incident-detail-header"><div><span className="eyebrow">Incident detail · demo record</span><h1 className="page-title">{incident.type}</h1><p className="page-subtitle">{incident.id} · {incident.location}</p></div><StatusBadge label={incident.status} /></div><div className="incident-detail-grid"><div className="incident-detail-main"><Card><div className="card-heading"><div><span className="muted-label">Incident summary</span><h2 className="detail-card-title">Report information</h2></div><FileText color="var(--color-primary)" size={21} /></div><div className="detail-facts"><Fact icon={CalendarDays} label="Date and time" value={incident.date} /><Fact icon={MapPin} label="Location" value={incident.location} /><Fact icon={UsersRound} label="People involved" value={incident.peopleInvolved} /><Fact icon={FileText} label="Vehicles" value={incident.vehicles} /></div><div className="detail-description"><small>Description</small><p>{incident.description}</p></div></Card>{hasCoordinates && <Card><div className="card-heading"><div><span className="muted-label">Authorized incident location</span><h2 className="detail-card-title">Incident map</h2></div><MapPin color="var(--color-primary)" size={20} /></div><MapContainer incidentLocation={{ latitude: incident.latitude, longitude: incident.longitude, name: incident.location }} center={[incident.latitude, incident.longitude]} zoom={15} /></Card>}<Card><div className="card-heading"><div><span className="muted-label">Status history</span><h2 className="detail-card-title">Incident timeline</h2></div></div><IncidentTimeline events={incident.timeline} /></Card></div><div className="incident-detail-side"><Alert tone="info" title="Demo information">This record and all status updates are simulated. No responder has been dispatched.</Alert><Card><span className="muted-label">Relevant updates</span><div className="detail-updates">{incident.updates.map((update) => <p key={update}>{update}</p>)}</div></Card><Link className="btn btn--ghost incident-back-button" to="/incidents">Return to incident history</Link></div></div></div>
}

function Fact({ icon: Icon, label, value }) { return <div className="detail-fact"><Icon size={17} /><span><small>{label}</small><strong>{value}</strong></span></div> }