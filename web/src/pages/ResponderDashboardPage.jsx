import { ArrowRight, MapPin, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import Alert from '../components/Alert'
import Card from '../components/Card'
import StatusBadge from '../components/StatusBadge'
import { useResponder } from '../context/ResponderContext'

const availabilityOptions = ['available', 'busy', 'offline']

function statusLabel(status) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function ResponderDashboardPage() {
  const { profile, assignments, loading, error, refresh, availability, setResponderStatus } = useResponder()
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')

  const updateAvailability = async (event) => {
    setSaving(true)
    setActionError('')
    try {
      await setResponderStatus(event.target.value)
    } catch (updateError) {
      setActionError(updateError.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading && !profile) return <div className="page-content"><Card role="status">Loading responder profile…</Card></div>

  return (
    <div className="page-content responder-page">
      <div className="page-header"><div><span className="eyebrow"><ShieldCheck size={14} /> Responder dashboard</span><h1 className="page-title">Response Desk</h1><p className="page-subtitle">Your backend profile and assigned incidents.</p></div>{profile && <StatusBadge label={availability} />}</div>
      {error && <Alert tone="error" title="Responder data unavailable">{error}<button type="button" className="text-link" onClick={refresh}>Retry</button></Alert>}
      {actionError && <Alert tone="error" title="Availability was not changed">{actionError}</Alert>}
      {profile && <>
        <Card className="responder-status-panel">
          <div><span className="muted-label">Profile status</span><h2>{profile.isActive ? 'Active' : 'Inactive'} · {profile.isVerified ? 'Verified' : 'Not verified'}</h2><p>{profile.organization || 'Organization not provided'} · {profile.serviceArea || 'Service area not provided'}</p></div>
          <label className="field"><span>Availability</span><select value={profile.availability} disabled={saving || (!profile.isActive || !profile.isVerified) && profile.availability !== 'busy'} onChange={updateAvailability}>
            {availabilityOptions.map((value) => <option value={value} key={value}>{statusLabel(value)}</option>)}
          </select></label>
        </Card>
        {(!profile.isActive || !profile.isVerified) && <Alert tone="warning" title="Profile cannot accept assignments">Only an active, verified responder can set availability to available.</Alert>}
        <div className="page-header"><div><span className="muted-label">Assigned work</span><h2 className="detail-card-title">Incidents assigned to you</h2></div></div>
        {assignments.length ? <div className="hospital-list">{assignments.map((incident) => (
          <Card className="responder-assignment-card" key={incident.id}>
            <div className="card-heading"><div><span className="muted-label">{incident.id}</span><h2>{incident.type}</h2></div><StatusBadge label={statusLabel(incident.status)} /></div>
            <div className="responder-assignment-facts"><span><MapPin size={16} /><strong>{incident.location}</strong></span><span><strong>{new Date(incident.updatedAt).toLocaleString()}</strong></span></div>
            <Link className="btn btn--primary" to={`/responder/incident/${incident.id}`}>Open incident <ArrowRight size={16} /></Link>
          </Card>
        ))}</div> : <Card className="responder-empty"><h2>No incidents assigned</h2><p>Assignments will appear here when recorded by the platform administrator.</p></Card>}
      </>}
      {!loading && !error && !profile && <Card><h2>Responder profile unavailable</h2><p>This account does not currently have an active responder profile.</p></Card>}
    </div>
  )
}
