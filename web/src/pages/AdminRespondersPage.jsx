import { Search, ShieldCheck, UsersRound } from 'lucide-react'
import { useState } from 'react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import Card from '../components/Card'
import StatusBadge from '../components/StatusBadge'
import { useAdminManagement } from '../context/AdminManagementContext'

export default function AdminRespondersPage() {
  const { users, responders, loading, error: loadError, updateResponder, createResponderProfile } = useAdminManagement()
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createNotice, setCreateNotice] = useState('')
  const [createUserId, setCreateUserId] = useState('')
  const [createType, setCreateType] = useState('first_responder')
  const eligibleUsers = users.filter((user) => user.role === 'responder'
    && user.status === 'active' && !responders.some((profile) => profile.id === user.id))
  const filtered = responders.filter((item) =>
    `${item.name} ${item.email || ''} ${item.zone} ${item.responderType}`.toLowerCase().includes(query.toLowerCase()))
  const selected = filtered.find((item) => item.id === selectedId) || filtered[0]

  const update = async (changes) => {
    if (!selected) return
    setSaving(true)
    setError('')
    try {
      await updateResponder(selected.id, changes)
    } catch (updateError) {
      setError(updateError.message)
    } finally {
      setSaving(false)
    }
  }

  const createProfile = async (event) => {
    event.preventDefault()
    if (!createUserId) return
    setCreating(true)
    setCreateError('')
    setCreateNotice('')
    try {
      await createResponderProfile({
        userId: createUserId,
        responderType: createType,
        organization: event.currentTarget.organization.value,
        serviceArea: event.currentTarget.serviceArea.value,
      })
      setCreateNotice('Responder profile created in the backend. It starts inactive, offline, and unverified.')
      setCreateUserId('')
    } catch (createFailure) {
      setCreateError(createFailure.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="page-content admin-management-page">
      <div className="page-header"><div><span className="eyebrow"><UsersRound size={14} /> Admin management</span><h1 className="page-title">Responder management</h1><p className="page-subtitle">Review backend responder profiles and verification controls.</p></div></div>
      {loadError && <Alert tone="error" title="Could not load responders">{loadError}</Alert>}
      <div className="dashboard-demo-note"><span className="status-dot status-dot--info" /><span>Verification and activation only</span><small>Availability is controlled by each responder. This platform does not dispatch real emergency services.</small></div>
      {createError && <Alert tone="error" title="Profile creation failed">{createError}</Alert>}
      {createNotice && <Alert tone="success" title="Responder profile created">{createNotice}</Alert>}
      <Card className="admin-edit-form">
        <h2>Create responder profile</h2>
        {eligibleUsers.length ? <form onSubmit={createProfile}>
          <label className="field"><span>Active responder account</span><select value={createUserId} onChange={(event) => setCreateUserId(event.target.value)} required><option value="">Select account</option>{eligibleUsers.map((user) => <option value={user.id} key={user.id}>{user.name} · {user.identifier}</option>)}</select></label>
          <label className="field"><span>Responder type</span><select value={createType} onChange={(event) => setCreateType(event.target.value)}>{['ambulance', 'paramedic', 'police', 'fire', 'rescue', 'first_responder'].map((type) => <option key={type}>{type}</option>)}</select></label>
          <label className="field"><span>Organization (optional)</span><input name="organization" maxLength="120" /></label>
          <label className="field"><span>Service area (optional)</span><input name="serviceArea" maxLength="120" /></label>
          <Button type="submit" disabled={creating || !createUserId} loading={creating}>Create profile</Button>
        </form> : <p>No active responder accounts without a profile are available.</p>}
      </Card>
      <div className="management-toolbar"><label className="incident-search"><Search size={17} /><span className="sr-only">Search responders</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search responder, email, or service area" /></label></div>
      {loading ? <Card role="status">Loading responders…</Card> : (
        <div className="management-grid">
          <Card className="management-list">
            {filtered.length ? filtered.map((item) => (
              <button className={`management-list-row ${selected?.id === item.id ? 'management-list-row--active' : ''}`} type="button" key={item.id} onClick={() => { setSelectedId(item.id); setError('') }}>
                <span className="management-avatar"><ShieldCheck size={17} /></span><span><strong>{item.name}</strong><small>{item.responderType} · {item.zone}</small></span><StatusBadge label={item.status} />
              </button>
            )) : <AdminEmpty text={loadError ? 'Responder list unavailable' : 'No responder profiles found'} />}
          </Card>
          {selected && <Card className="management-detail">
            <div className="management-detail-heading"><div><span className="muted-label">Responder profile</span><h2>{selected.name}</h2><small>{selected.identifier}</small></div><StatusBadge label={selected.status} /></div>
            {error && <Alert tone="error" title="Update failed">{error}</Alert>}
            <div className="management-facts">
              <span><small>Type</small><strong>{selected.responderType}</strong></span>
              <span><small>Organization</small><strong>{selected.organization || 'Not provided'}</strong></span>
              <span><small>Service area</small><strong>{selected.zone}</strong></span>
              <span><small>Availability</small><strong>{selected.availability}</strong></span>
              <span><small>Account</small><strong>{selected.accountStatus}</strong></span>
            </div>
            <div className="management-actions">
              <Button variant={selected.isVerified ? 'secondary' : 'primary'} disabled={saving} onClick={() => update({ isVerified: !selected.isVerified })}>
                {saving ? 'Saving…' : selected.isVerified ? 'Revoke verification' : 'Verify responder'}
              </Button>
              <Button variant="secondary" disabled={saving} onClick={() => update({ isActive: !selected.isActive })}>
                {saving ? 'Saving…' : selected.isActive ? 'Deactivate profile' : 'Activate profile'}
              </Button>
            </div>
          </Card>}
        </div>
      )}
    </div>
  )
}

function AdminEmpty({ text }) { return <div className="admin-empty"><UsersRound size={20} /><span>{text}</span></div> }
