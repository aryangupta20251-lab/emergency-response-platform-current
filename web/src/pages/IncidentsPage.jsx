import { ClipboardList, Search, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/Card'
import StatusBadge from '../components/StatusBadge'
import { incidentStatuses, incidents } from '../data/incidentData'

export default function IncidentsPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All statuses')
  const filteredIncidents = incidents.filter((incident) => {
    const matchesQuery = `${incident.id} ${incident.location} ${incident.type}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (status === 'All statuses' || incident.status === status)
  })
  return <div className="page-content incidents-page"><div className="page-header"><div><span className="eyebrow"><ClipboardList size={14} /> Incident history</span><h1 className="page-title">Your incidents</h1><p className="page-subtitle">Review demo incident reports and their simulated status history.</p></div></div><div className="dashboard-demo-note"><span className="status-dot status-dot--info" /><span>Demo incident history</span><small>Statuses and responder updates are simulated frontend data.</small></div><Card className="incident-filters"><label className="incident-search"><Search size={17} /><span className="sr-only">Search incidents</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by ID, location, or type" /></label><label className="incident-status-filter"><SlidersHorizontal size={16} /><span className="sr-only">Filter by status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option>{incidentStatuses.map((item) => <option key={item}>{item}</option>)}</select></label></Card>{filteredIncidents.length ? <div className="incident-list">{filteredIncidents.map((incident) => <IncidentListItem incident={incident} key={incident.id} />)}</div> : <Card className="incident-empty-page"><div className="placeholder-page__icon"><Search size={26} /></div><h2>No incidents found</h2><p>Try a different search or status filter.</p></Card>}</div>
}

function IncidentListItem({ incident }) { return <Card className="incident-list-item"><div className="incident-list-item__main"><div className="incident-list-item__top"><span className="incident-id">{incident.id}</span><StatusBadge label={incident.status} /></div><h2>{incident.type}</h2><p>{incident.location} · {incident.shortDate}</p><small>{incident.demo ? 'Demo record' : 'Incident record'} · {incident.peopleInvolved} people involved</small></div><Link className="btn btn--secondary incident-list-item__link" to={`/incidents/${incident.id}`}>View details</Link></Card> }