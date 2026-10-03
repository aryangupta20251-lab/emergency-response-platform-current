import { Activity, ClipboardList, ShieldCheck, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Alert from '../components/Alert'
import Card from '../components/Card'
import { useAuth } from '../context/AuthContext'
import { adminService } from '../services/adminService'

const statisticCards = [
  ['Users', 'users', UsersRound],
  ['Active incidents', 'activeIncidents', Activity],
  ['Incidents today', 'incidentsToday', ClipboardList],
  ['Incidents this week', 'incidentsThisWeek', ClipboardList],
  ['Verified responders', 'verifiedResponders', ShieldCheck],
  ['Available responders', 'availableResponders', UsersRound],
  ['Resolved incidents', 'resolvedIncidents', ClipboardList],
  ['Responder accounts', 'responders', UsersRound],
]

export default function AdminDashboardPage() {
  const { token } = useAuth()
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    adminService.getStatistics(token)
      .then((result) => { if (active) setStatistics(result) })
      .catch((loadError) => { if (active) setError(loadError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token])

  return (
    <div className="page-content admin-page">
      <div className="page-header"><div><span className="eyebrow"><ShieldCheck size={14} /> Admin overview</span><h1 className="page-title">Control center</h1><p className="page-subtitle">Current database aggregates from the backend.</p></div></div>
      {error && <Alert tone="error" title="Statistics unavailable">{error}</Alert>}
      <Alert tone="info" title="Coordination platform only">These counts describe records in this platform. They do not represent external dispatch or guaranteed responder availability.</Alert>
      {loading ? <Card role="status">Loading platform statistics…</Card> : statistics && (
        <div className="admin-stat-grid">
          {statisticCards.map(([label, key, Icon]) => (
            <Card className="admin-stat-card" key={key}>
              <Icon size={18} /><span>{label}</span><strong>{statistics[key]}</strong>
            </Card>
          ))}
        </div>
      )}
      {!loading && !error && !statistics && <Card>No statistics are available.</Card>}
      <div className="report-actions">
        <Link className="btn btn--secondary" to="/admin/incidents">Review incidents</Link>
        <Link className="btn btn--secondary" to="/admin/responders">Review responders</Link>
        <Link className="btn btn--secondary" to="/admin/users">Manage accounts</Link>
      </div>
    </div>
  )
}
