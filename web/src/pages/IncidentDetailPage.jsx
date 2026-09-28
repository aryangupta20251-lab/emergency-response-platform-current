import { ArrowLeft, CalendarDays, FileText, MapPin, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Alert from '../components/Alert'
import Card from '../components/Card'
import IncidentTimeline from '../components/IncidentTimeline'
import MapContainer from '../components/MapContainer'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { incidentService } from '../services/incidentService'

function formatStatusLabel(status) {
  if (!status) return 'Reported'
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export default function IncidentDetailPage() {
  const { incidentId } = useParams()
  const { token } = useAuth()
  const [incident, setIncident] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token || !incidentId) {
      setIncident(null)
      setHistory([])
      setLoading(false)
      return undefined
    }

    let active = true
    setLoading(true)
    setError('')

    Promise.all([
      incidentService.getIncident(token, incidentId),
      incidentService.getIncidentHistory(token, incidentId),
    ])
      .then(([incidentResult, historyResult]) => {
        if (!active) return
        setIncident(incidentResult.incident)
        setHistory(historyResult.history || [])
      })
      .catch((loadError) => {
        if (active) setError(loadError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [incidentId, token])

  if (!token) return <Navigate to="/login" replace />
  if (!loading && !incident && !error) return <Navigate to="/incidents" replace />

  if (loading) {
    return <div className="page-content"><Card><h2>Loading incident…</h2><p>Fetching the latest incident details.</p></Card></div>
  }

  if (error || !incident) {
    return <div className="page-content incident-detail-page"><Link className="report-back" to="/incidents"><ArrowLeft size={16} /> Back to incidents</Link><Alert tone="error" title="Incident unavailable">{error || 'This incident could not be loaded.'}</Alert></div>
  }

  const hasCoordinates = Number.isFinite(incident.latitude) && Number.isFinite(incident.longitude)
  const statusLabel = formatStatusLabel(incident.status)
  const timeline = history.length
    ? history.map((item) => ({
        status: formatStatusLabel(item.newStatus),
        time: new Date(item.createdAt).toLocaleString(),
        note: item.previousStatus ? `Updated from ${formatStatusLabel(item.previousStatus)}.` : 'Incident reported in the platform.',
      }))
    : [{
        status: statusLabel,
        time: new Date(incident.createdAt).toLocaleString(),
        note: 'Incident reported in the platform.',
      }]

  return <div className="page-content incident-detail-page"><Link className="report-back" to="/incidents"><ArrowLeft size={16} /> Back to incidents</Link><div className="page-header incident-detail-header"><div><span className="eyebrow">Incident detail</span><h1 className="page-title">{incident.type}</h1><p className="page-subtitle">{incident.id} · {incident.location}</p></div><StatusBadge label={statusLabel} /></div><div className="incident-detail-grid"><div className="incident-detail-main"><Card><div className="card-heading"><div><span className="muted-label">Incident summary</span><h2 className="detail-card-title">Report information</h2></div><FileText color="var(--color-primary)" size={21} /></div><div className="detail-facts"><Fact icon={CalendarDays} label="Date and time" value={new Date(incident.createdAt).toLocaleString()} /><Fact icon={MapPin} label="Location" value={incident.location} /><Fact icon={UsersRound} label="People involved" value={incident.peopleInvolved} /><Fact icon={FileText} label="Vehicles" value={incident.vehicles} /></div><div className="detail-description"><small>Description</small><p>{incident.description || 'No description provided.'}</p></div></Card>{hasCoordinates && <Card><div className="card-heading"><div><span className="muted-label">Authorized incident location</span><h2 className="detail-card-title">Incident map</h2></div><MapPin color="var(--color-primary)" size={20} /></div><MapContainer incidentLocation={{ latitude: incident.latitude, longitude: incident.longitude, name: incident.location }} center={[incident.latitude, incident.longitude]} zoom={15} /></Card>}<Card><div className="card-heading"><div><span className="muted-label">Status history</span><h2 className="detail-card-title">Incident timeline</h2></div></div><IncidentTimeline events={timeline} /></Card></div><div className="incident-detail-side"><Alert tone="info" title="Platform record">This record reflects the latest confirmed status in the platform. External dispatch status is only shown when the backend reports it.</Alert><Card><span className="muted-label">Report details</span><div className="detail-facts"><Fact icon={UsersRound} label="Assigned responder" value={incident.assignedResponderId || 'Not assigned'} /><Fact icon={MapPin} label="Response zone" value={incident.location} /></div></Card></div></div></div>
}

function Fact({ icon: Icon, label, value }) { return <div className="detail-fact"><Icon size={17} /><span><small>{label}</small><strong>{value}</strong></span></div> }
