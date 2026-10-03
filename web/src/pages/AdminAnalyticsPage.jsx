import { Activity, BarChart3, ClipboardList, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import Alert from '../components/Alert'
import Card from '../components/Card'
import { useAuth } from '../context/AuthContext'
import { adminService } from '../services/adminService'

const availableMetrics = [
  ['Incident records created today', 'incidentsToday', ClipboardList],
  ['Incident records created this week', 'incidentsThisWeek', Activity],
  ['Active incidents', 'activeIncidents', ClipboardList],
  ['Resolved incidents', 'resolvedIncidents', ClipboardList],
  ['Responder accounts', 'responders', UsersRound],
  ['Verified responder profiles', 'verifiedResponders', UsersRound],
  ['Available verified responders', 'availableResponders', UsersRound],
]

export default function AdminAnalyticsPage() {
  const { token } = useAuth()
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    adminService.getStatistics(token)
      .then((result) => { if (active) setStatistics(result) })
      .catch((loadError) => { if (active) setError(loadError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token])

  return (
    <div className="page-content admin-page analytics-page">
      <div className="page-header"><div><span className="eyebrow"><BarChart3 size={14} /> Admin analytics</span><h1 className="page-title">Platform metrics</h1><p className="page-subtitle">Only aggregates provided by the backend are shown.</p></div></div>
      <Alert tone="info" title="Available metrics only">The current API does not provide incident-by-type, hospital-count, notification-activity, response-time, or historical trend aggregations. Those charts are intentionally omitted.</Alert>
      {error && <Alert tone="error" title="Metrics unavailable">{error}</Alert>}
      {loading ? <Card role="status">Loading platform metrics…</Card> : statistics ? (
        <div className="analytics-stat-grid">
          {availableMetrics.map(([label, key, Icon]) => <Card className="analytics-stat" key={key}><Icon size={18} /><span><small>{label}</small><strong>{statistics[key]}</strong><em>Database aggregate</em></span></Card>)}
        </div>
      ) : !error && <Card>No analytics are available.</Card>}
    </div>
  )
}
