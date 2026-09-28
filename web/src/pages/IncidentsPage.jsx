import { ClipboardList, Search, SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Alert from '../components/Alert'
import Card from '../components/Card'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { incidentService } from '../services/incidentService'

const statuses = ['All statuses', 'Reported', 'Received', 'Verified', 'Responder Assigned', 'Responding', 'Arrived', 'Resolved', 'Cancelled']

function formatStatusLabel(status) {
  if (!status) return 'Reported'
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export default function IncidentsPage() {
  const { token } = useAuth()
  const [incidents, setIncidents] = useState([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All statuses')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setIncidents([])
      setError('')
      return undefined
    }

    let active = true
    setLoading(true)
    setError('')

    incidentService.listIncidents(token)
      .then((result) => {
        if (!active) return
        setIncidents(result.incidents || [])
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
  }, [token])

  const filteredIncidents = incidents.filter((incident) => {
    const matchesQuery = `${incident.id} ${incident.location || ''} ${incident.type || ''}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (status === 'All statuses' || formatStatusLabel(incident.status) === status)
  })

  return <div className="page-content incidents-page"><div className="page-header"><div><span className="eyebrow"><ClipboardList size={14} /> Incident history</span><h1 className="page-title">Your incidents</h1><p className="page-subtitle">Review the incidents submitted through your account.</p></div></div>{error && <Alert tone="error" title="Could not load incidents">{error}</Alert>}<Card className="incident-filters"><label className="incident-search"><Search size={17} /><span className="sr-only">Search incidents</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by ID, location, or type" /></label><label className="incident-status-filter"><SlidersHorizontal size={16} /><span className="sr-only">Filter by status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label></Card>{loading ? <Card className="incident-empty-page"><h2>Loading incidents…</h2><p>Fetching your latest report activity.</p></Card> : filteredIncidents.length ? <div className="incident-list">{filteredIncidents.map((incident) => <IncidentListItem incident={incident} key={incident.id} />)}</div> : <Card className="incident-empty-page"><div className="placeholder-page__icon"><Search size={26} /></div><h2>No incidents found</h2><p>Submit a report to begin tracking your incident history.</p></Card>}</div>
}

function IncidentListItem({ incident }) {
  const statusLabel = formatStatusLabel(incident.status)
  const createdAt = incident.createdAt ? new Date(incident.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'

  return <Card className="incident-list-item"><div className="incident-list-item__main"><div className="incident-list-item__top"><span className="incident-id">{incident.id}</span><StatusBadge label={statusLabel} /></div><h2>{incident.type}</h2><p>{incident.location} · {createdAt}</p><small>{incident.peopleInvolved} people involved</small></div><Link className="btn btn--secondary incident-list-item__link" to={`/incidents/${incident.id}`}>View details</Link></Card>
}