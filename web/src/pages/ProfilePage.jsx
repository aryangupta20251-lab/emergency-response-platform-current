import { CheckCircle2, Edit3, Mail, Phone, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import { useAuth } from '../context/AuthContext'

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ name: user?.name || '', identifier: user?.identifier || '' })
  useEffect(() => setForm({ name: user?.name || '', identifier: user?.identifier || '' }), [user])
  const save = (event) => { event.preventDefault(); updateProfile({ name: form.name.trim(), identifier: form.identifier.trim() }); setEditing(false); setSaved(true) }
  return <div className="page-content profile-page"><div className="page-header"><div><span className="eyebrow"><UserRound size={14} /> Account</span><h1 className="page-title">Profile</h1><p className="page-subtitle">Manage your demo account information.</p></div>{!editing && <Button variant="secondary" onClick={() => { setEditing(true); setSaved(false) }}><Edit3 size={16} /> Edit profile</Button>}</div>{saved && <Alert tone="success" title="Profile updated">Your changes are stored locally in this demo.</Alert>}<Card className="profile-card"><div className="profile-card__hero"><div className="profile-large-avatar">{(user?.name || 'D').slice(0, 1).toUpperCase()}</div><div><h2>{user?.name || 'Demo Citizen'}</h2><p>Citizen account · Frontend demo</p></div></div>{editing ? <form className="profile-form" onSubmit={save}><Input label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /><Input label="Email or phone" value={form.identifier} onChange={(event) => setForm({ ...form, identifier: event.target.value })} required /><div className="report-actions"><Button variant="ghost" type="button" onClick={() => setEditing(false)}>Cancel</Button><Button type="submit"><CheckCircle2 size={16} /> Save changes</Button></div></form> : <div className="profile-facts"><div><Mail size={17} /><span><small>Email or phone</small><strong>{user?.identifier || 'Not provided'}</strong></span></div><div><Phone size={17} /><span><small>Account role</small><strong>Citizen</strong></span></div></div>}</Card><Card className="profile-note"><strong>Demo account</strong><p>This profile is not connected to a backend account or identity verification service.</p></Card></div>
}