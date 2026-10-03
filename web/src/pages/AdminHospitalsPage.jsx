import { Hospital, MapPin, Search } from 'lucide-react'
import { useState } from 'react'
import Alert from '../components/Alert'
import Card from '../components/Card'
import { useAdminManagement } from '../context/AdminManagementContext'

export default function AdminHospitalsPage() {
  const { hospitals, loading, error } = useAdminManagement()
  const [query, setQuery] = useState('')
  const filtered = hospitals.filter((item) =>
    `${item.name} ${item.address} ${item.type}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="page-content admin-management-page">
      <div className="page-header"><div><span className="eyebrow"><Hospital size={14} /> Admin directory</span><h1 className="page-title">Hospital directory</h1><p className="page-subtitle">Read-only view of hospital records provided by the backend directory.</p></div></div>
      <Alert tone="info" title="Directory records only">No hospital create/edit API is available. Emergency availability is stored directory data, not live capacity or acceptance.</Alert>
      {error && <Alert tone="error" title="Could not load hospital records">{error}</Alert>}
      <Card className="management-toolbar"><label className="incident-search"><Search size={17} /><span className="sr-only">Search hospitals</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search hospital or location" /></label></Card>
      {loading ? <Card role="status">Loading hospital directory…</Card> : filtered.length ? (
        <div className="hospital-list">
          {filtered.map((item) => (
            <Card className="hospital-card" key={item.id}>
              <div className="hospital-card__icon"><Hospital size={21} /></div>
              <div className="hospital-card__body">
                <div className="hospital-card__top"><span className="hospital-type">{item.type}</span><strong>{item.isDemo ? 'Development sample' : 'Directory record'}</strong></div>
                <h2>{item.name}</h2><p>{item.address}</p>
                <small><MapPin size={13} /> {Number.isFinite(item.latitude) && Number.isFinite(item.longitude) ? `${item.latitude}, ${item.longitude}` : 'Coordinates not available'}</small>
                <small>Emergency flag: {item.emergencyAvailable ? 'listed' : 'not listed'}; availability is not live</small>
              </div>
            </Card>
          ))}
        </div>
      ) : <Card className="incident-empty-page"><h2>{error ? 'Directory unavailable' : 'No hospital records found'}</h2></Card>}
    </div>
  )
}
