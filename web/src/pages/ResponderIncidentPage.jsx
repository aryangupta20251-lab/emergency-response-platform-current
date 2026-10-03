import { ArrowLeft, MapPin, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import Card from '../components/Card'
import IncidentTimeline from '../components/IncidentTimeline'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { useResponder } from '../context/ResponderContext'
import { responderService } from '../services/responderService'

const nextStatuses = {
  responder_assigned: ['responding', 'cancelled'],
  responding: ['arrived', 'cancelled'],
  arrived: ['resolved'],
}

function statusLabel(value) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function ResponderIncidentPage() {
  const { incidentId } = useParams()
  const { token } = useAuth()
  const { refresh } = useResponder()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await responderService.getAssignedIncident(token, incidentId)
      setRecord(result)
    } catch (loadError) {
      setRecord(null)
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    responderService.getAssignedIncident(token, incidentId)
      .then((result) => { if (active) setRecord(result) })
      .catch((loadError) => { if (active) { setRecord(null); setError(loadError.message) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [incidentId, token])

  const changeStatus = async (status) => {
    if (!record?.incident) return
    setSaving(true)
    setError('')
    try {
      await responderService.updateIncidentStatus(token, incidentId, status)
      await load()
      await refresh()
    } catch (updateError) {
      setError(updateError.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="page-content"><Card role="status">Loading assigned incident…</Card></div>
  if (error && !record) return <div className="page-content"><Link className="report-back" to="/responder"><ArrowLeft size={16} /> Back to responder dashboard</Link><Alert tone="error" title="Assigned incident unavailable">{error}</Alert></div>
  if (!record?.incident) return <Navigate to="/responder" replace />

  const incident = record.incident
  const transitions = nextStatuses[incident.status] || []
  const timeline = record.history.map((item) => ({
    status: statusLabel(item.newStatus),
    time: new Date(item.createdAt).toLocaleString(),
    note: item.previousStatus ? `Updated from ${statusLabel(item.previousStatus)}.` : 'Incident was reported in the platform.',
  }))

  return (
    <div className="page-content responder-detail-page">
      <Link className="report-back" to="/responder"><ArrowLeft size={16} /> Back to responder dashboard</Link>
      <div className="page-header"><div><span className="eyebrow"><ShieldCheck size={14} /> Assigned incident</span><h1 className="page-title">{incident.type}</h1><p className="page-subtitle">{incident.id} · {incident.location}</p></div><StatusBadge label={statusLabel(incident.status)} /></div>
      {error && <Alert tone="error" title="Status update failed">{error}</Alert>}
      <div className="responder-detail-grid">
        <div className="responder-detail-main">
          <Card><div className="card-heading"><div><span className="muted-label">Incident details</span><h2 className="detail-card-title">{incident.location}</h2></div><MapPin color="var(--color-primary)" size={21} /></div>
            <div className="detail-facts"><Fact label="People involved" value={incident.peopleInvolved} /><Fact label="Visible injuries" value={incident.injuries} /><Fact label="Vehicles" value={incident.vehicles} /><Fact label="Reported" value={new Date(incident.createdAt).toLocaleString()} /></div>
            <p className="responder-detail-description">{incident.description || 'No description provided.'}</p>
            {Number.isFinite(incident.latitude) && Number.isFinite(incident.longitude) && <small>Recorded coordinates: {incident.latitude}, {incident.longitude}</small>}
          </Card>
          <Card><div className="card-heading"><div><span className="muted-label">Backend status history</span><h2 className="detail-card-title">Incident timeline</h2></div></div><IncidentTimeline events={timeline} /></Card>
        </div>
        <div className="responder-detail-side"><Card className="responder-action-card"><h2>Allowed status updates</h2>
          {transitions.length ? transitions.map((status) => <Button key={status} loading={saving} disabled={saving} variant={status === 'cancelled' ? 'danger' : 'primary'} onClick={() => changeStatus(statusLabel(status))}>{status === 'cancelled' ? 'Cancel incident' : `Mark ${statusLabel(status).toLowerCase()}`}</Button>) : <p>No further status transitions are available.</p>}
        </Card><Alert tone="info" title="Platform workflow only">Updates are recorded in this platform. They do not confirm external dispatch or emergency-service contact.</Alert></div>
      </div>
    </div>
  )
}

function Fact({ label, value }) { return <div className="detail-fact"><span><small>{label}</small><strong>{value}</strong></span></div> }
