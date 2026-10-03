import { ClipboardList, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import Card from '../components/Card'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { useAdminManagement } from '../context/AdminManagementContext'
import { adminService } from '../services/adminService'

const nextStatuses = {
  Reported: ['Received', 'Cancelled'],
  Received: ['Verified', 'Cancelled'],
  Verified: ['Cancelled'],
  'Responder Assigned': ['Responding', 'Cancelled'],
  Responding: ['Arrived', 'Cancelled'],
  Arrived: ['Resolved'],
  Resolved: [],
  Cancelled: [],
}

export default function AdminIncidentsPage() {
  const { token } = useAuth()
  const { incidents, loading, error: loadError, updateIncident, refresh } = useAdminManagement()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [selectedId, setSelectedId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [nearbyResponders, setNearbyResponders] = useState([])
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const [assignmentError, setAssignmentError] = useState('')
  const [assignmentSuccess, setAssignmentSuccess] = useState('')
  const [responderId, setResponderId] = useState('')
  const filtered = incidents.filter((item) =>
    `${item.id} ${item.location} ${item.type}`.toLowerCase().includes(query.toLowerCase())
    && (statusFilter === 'All statuses' || item.status === statusFilter))
  const selected = filtered.find((item) => item.id === selectedId) || filtered[0]
  const transitions = selected ? nextStatuses[selected.status] || [] : []

  useEffect(() => {
    let active = true
    setNearbyResponders([])
    setResponderId('')
    setAssignmentError('')
    setAssignmentSuccess('')
    if (!selected || selected.status !== 'Verified'
      || !Number.isFinite(selected.latitude) || !Number.isFinite(selected.longitude)) return undefined
    setAssignmentLoading(true)
    adminService.getIncidentResponders(token, selected.id)
      .then((result) => { if (active) setNearbyResponders(result.responders) })
      .catch((loadError) => { if (active) setAssignmentError(loadError.message) })
      .finally(() => { if (active) setAssignmentLoading(false) })
    return () => { active = false }
  }, [selected?.id, selected?.status, selected?.latitude, selected?.longitude, token])

  const changeStatus = async (event) => {
    if (!selected || !event.target.value) return
    setSaving(true)
    setError('')
    try {
      await updateIncident(selected.id, { status: event.target.value })
    } catch (updateError) {
      setError(updateError.message)
    } finally {
      setSaving(false)
    }
  }

  const assignResponder = async () => {
    if (!selected || !responderId) return
    setSaving(true)
    setAssignmentError('')
    setAssignmentSuccess('')
    try {
      await adminService.assignResponder(token, selected.id, responderId)
      setAssignmentSuccess('Responder assignment was confirmed by the backend.')
      await refresh()
    } catch (assignError) {
      setAssignmentError(assignError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-content admin-management-page">
      <AdminManagementHeader />
      {loadError && <Alert tone="error" title="Could not load incidents">{loadError}</Alert>}
      <div className="management-toolbar">
        <label className="incident-search"><Search size={17} /><span className="sr-only">Search incidents</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ID, location, or type" /></label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter incidents by status">
          <option>All statuses</option>{Object.keys(nextStatuses).map((status) => <option key={status}>{status}</option>)}
        </select>
      </div>
      {loading ? <Card role="status">Loading incidents…</Card> : (
        <div className="management-grid">
          <Card className="management-list">
            {filtered.length ? filtered.map((item) => (
              <button className={`management-list-row ${selected?.id === item.id ? 'management-list-row--active' : ''}`} type="button" key={item.id} onClick={() => { setSelectedId(item.id); setError('') }}>
                <span className="management-avatar"><ClipboardList size={17} /></span><span><strong>{item.type}</strong><small>{item.id} · {item.location}</small></span><StatusBadge label={item.status} />
              </button>
            )) : <AdminEmpty text={loadError ? 'Incident list unavailable' : 'No incidents found'} />}
          </Card>
          {selected && <Card className="management-detail">
            <div className="management-detail-heading"><div><span className="muted-label">Incident detail</span><h2>{selected.type}</h2><small>{selected.id}</small></div><StatusBadge label={selected.status} /></div>
            {error && <Alert tone="error" title="Status update failed">{error}</Alert>}
            {assignmentError && <Alert tone="error" title="Responder assignment unavailable">{assignmentError}</Alert>}
            {assignmentSuccess && <Alert tone="success" title="Assignment recorded">{assignmentSuccess}</Alert>}
            <div className="management-facts">
              <span><small>Location</small><strong>{selected.location}</strong></span>
              <span><small>Reported</small><strong>{selected.date}</strong></span>
              <span><small>Description</small><strong>{selected.description || 'No description provided'}</strong></span>
              <span><small>Coordinates</small><strong>{Number.isFinite(selected.latitude) && Number.isFinite(selected.longitude) ? `${selected.latitude}, ${selected.longitude}` : 'Not recorded'}</strong></span>
              <span><small>Assigned responder</small><strong>{selected.assignedResponderId || 'Not assigned'}</strong></span>
            </div>
            <label className="field"><span>Next status</span>
              <select value="" onChange={changeStatus} disabled={saving || transitions.length === 0}>
                <option value="">{transitions.length ? 'Select a valid next status' : 'No further status transitions'}</option>
                {transitions.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            {saving && <Button loading disabled>Saving status…</Button>}
            {selected.status === 'Verified' && <section className="admin-edit-form" aria-label="Assign responder">
              <h3>Assign a responder</h3>
              {!Number.isFinite(selected.latitude) || !Number.isFinite(selected.longitude)
                ? <p>Responder discovery requires incident coordinates.</p>
                : assignmentLoading
                  ? <p role="status">Finding available verified responders…</p>
                  : nearbyResponders.length
                    ? <>
                      <label className="field"><span>Available nearby responder</span><select value={responderId} onChange={(event) => setResponderId(event.target.value)}><option value="">Select responder</option>{nearbyResponders.map((responder) => <option value={responder.userId} key={responder.userId}>{responder.responderType} · {responder.serviceArea || responder.organization || responder.userId} · {responder.distanceKm.toFixed(1)} km</option>)}</select></label>
                      <Button disabled={!responderId || saving} loading={saving} onClick={assignResponder}>Assign responder</Button>
                    </>
                    : <p>No active, verified, available responders were found within the search radius.</p>}
            </section>}
          </Card>}
        </div>
      )}
    </div>
  )
}

function AdminManagementHeader() {
  return <div className="page-header"><div><span className="eyebrow"><ClipboardList size={14} /> Admin management</span><h1 className="page-title">Incident management</h1><p className="page-subtitle">Review backend incidents and apply permitted status transitions.</p></div></div>
}

function AdminEmpty({ text }) { return <div className="admin-empty"><ClipboardList size={20} /><span>{text}</span></div> }
