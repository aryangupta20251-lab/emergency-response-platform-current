import { Edit3, Search, UserRound, UsersRound } from 'lucide-react'
import { useState } from 'react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import Card from '../components/Card'
import StatusBadge from '../components/StatusBadge'
import { useAdminManagement } from '../context/AdminManagementContext'

export default function AdminUsersPage() {
  const { users, loading, error: loadError, updateUser } = useAdminManagement()
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('All roles')
  const [selectedId, setSelectedId] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const filtered = users.filter((user) =>
    `${user.name} ${user.identifier} ${user.role}`.toLowerCase().includes(query.toLowerCase())
    && (role === 'All roles' || user.role === role))
  const selected = filtered.find((user) => user.id === selectedId) || filtered[0]

  const save = async (event) => {
    event.preventDefault()
    if (!selected) return
    setSaving(true)
    setError('')
    try {
      const form = new FormData(event.currentTarget)
      await updateUser(selected.id, { role: form.get('role'), status: form.get('status') })
      setEditing(false)
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-content admin-management-page">
      <AdminManagementHeader title="User management" subtitle="Review and manage accounts from the backend." />
      {loadError && <Alert tone="error" title="Could not load users">{loadError}</Alert>}
      <div className="management-toolbar">
        <label className="incident-search">
          <Search size={17} /><span className="sr-only">Search users</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or identifier" />
        </label>
        <select value={role} onChange={(event) => setRole(event.target.value)} aria-label="Filter users by role">
          <option>All roles</option><option value="citizen">Citizen</option><option value="responder">Responder</option><option value="admin">Admin</option>
        </select>
      </div>
      {loading ? <Card role="status">Loading users…</Card> : (
        <div className="management-grid">
          <Card className="management-list">
            {filtered.length ? filtered.map((user) => (
              <button className={`management-list-row ${selected?.id === user.id ? 'management-list-row--active' : ''}`} type="button" key={user.id} onClick={() => { setSelectedId(user.id); setEditing(false); setError('') }}>
                <span className="management-avatar"><UserRound size={17} /></span>
                <span><strong>{user.name}</strong><small>{user.role} · {user.identifier}</small></span>
                <StatusBadge label={user.status} />
              </button>
            )) : <AdminEmpty text={loadError ? 'User list unavailable' : 'No users found'} />}
          </Card>
          {selected && <Card className="management-detail">
            <div className="management-detail-heading"><div><span className="muted-label">User detail</span><h2>{selected.name}</h2></div><StatusBadge label={selected.status} /></div>
            {error && <Alert tone="error" title="Action failed">{error}</Alert>}
            {editing ? <form className="admin-edit-form" onSubmit={save}>
              <label className="field"><span>Role</span><select name="role" defaultValue={selected.role}><option value="citizen">Citizen</option><option value="responder">Responder</option><option value="admin">Admin</option></select></label>
              <label className="field"><span>Account status</span><select name="status" defaultValue={selected.status}><option value="active">Active</option><option value="disabled">Disabled</option></select></label>
              <div className="report-actions"><Button variant="ghost" type="button" onClick={() => setEditing(false)}>Cancel</Button><Button loading={saving} type="submit">Save user</Button></div>
            </form> : <>
              <div className="management-facts"><span><small>Identifier</small><strong>{selected.identifier}</strong></span><span><small>Joined</small><strong>{selected.joined}</strong></span><span><small>Role</small><strong>{selected.role}</strong></span></div>
              <div className="management-actions"><Button variant="secondary" onClick={() => { setError(''); setEditing(true) }}><Edit3 size={15} /> Edit role/status</Button></div>
            </>}
          </Card>}
        </div>
      )}
    </div>
  )
}

function AdminManagementHeader({ title, subtitle }) {
  return <div className="page-header"><div><span className="eyebrow"><UsersRound size={14} /> Admin management</span><h1 className="page-title">{title}</h1><p className="page-subtitle">{subtitle}</p></div></div>
}

function AdminEmpty({ text }) { return <div className="admin-empty"><UsersRound size={20} /><span>{text}</span></div> }
