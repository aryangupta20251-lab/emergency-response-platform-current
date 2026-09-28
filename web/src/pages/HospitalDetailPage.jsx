import { ArrowLeft, Clock3, Hospital, MapPin, Phone } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Alert from '../components/Alert'
import Card from '../components/Card'
import MapContainer from '../components/MapContainer'
import { hospitals } from '../data/hospitalData'
import { getHospital } from '../services/hospitalService'

export default function HospitalDetailPage() {
  const { hospitalId } = useParams()
  const [hospital, setHospital] = useState(() => hospitals.find((item) => item.id === hospitalId) || null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true
    getHospital(hospitalId)
      .then((result) => {
        if (active) {
          setHospital(result)
          setLoadError('')
        }
      })
      .catch(() => {
        if (active) setLoadError('Live directory details are unavailable; any shown sample information is for development only.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [hospitalId])

  if (loading && !hospital) return <div className="page-content" role="status">Loading hospital details…</div>
  if (!hospital) return <Navigate to="/hospitals" replace />

  const hasCoordinates = Number.isFinite(hospital.latitude) && Number.isFinite(hospital.longitude)
  const markers = hasCoordinates ? [{ ...hospital, name: hospital.name }] : []
  const contact = hospital.phone && !hospital.phone.includes('00000') ? hospital.phone : 'Not provided in this listing'

  return (
    <div className="page-content hospital-detail-page">
      <Link className="report-back" to="/hospitals"><ArrowLeft size={16} /> Back to hospitals</Link>
      <div className="page-header hospital-detail-header">
        <div>
          <span className="eyebrow">{hospital.isDemo ? 'Development sample listing' : 'Hospital directory'}</span>
          <h1 className="page-title">{hospital.name}</h1>
          <p className="page-subtitle">{hospital.address}</p>
        </div>
        <span className="hospital-type hospital-type--large">{hospital.type}</span>
      </div>
      {loadError && <Alert tone="warning" title="Directory notice">{loadError}</Alert>}
      <div className="hospital-detail-grid">
        <div className="hospital-detail-main">
          <Card>
            <div className="card-heading">
              <div><span className="muted-label">About this listing</span><h2 className="detail-card-title">{hospital.name}</h2></div>
              <Hospital color="var(--color-primary)" size={22} />
            </div>
            <p className="hospital-description">{hospital.description || 'No additional description is available.'}</p>
            <div className="hospital-facts">
              <Fact icon={MapPin} label="Location" value={`${hospital.address}${hospital.city ? `, ${hospital.city}` : ''}`} />
              <Fact icon={Phone} label="Contact" value={contact} />
              <Fact icon={Clock3} label="Hours" value={hospital.hours || 'Not provided in this listing'} />
              <Fact icon={Hospital} label="Emergency listing" value={`${hospital.emergencyAvailable ? 'Marked as emergency-capable' : 'Not marked as emergency-capable'}; availability is not live`} />
              {typeof hospital.distanceKm === 'number' && <Fact icon={MapPin} label="Distance" value={`${hospital.distanceKm.toFixed(1)} km straight-line`} />}
            </div>
          </Card>
          <Card>
            <div className="card-heading">
              <div><span className="muted-label">Map</span><h2 className="detail-card-title">Hospital location</h2></div>
              <MapPin color="var(--color-primary)" size={20} />
            </div>
            <MapContainer
              markers={markers}
              center={hasCoordinates ? [hospital.latitude, hospital.longitude] : undefined}
              zoom={hasCoordinates ? 14 : 12}
            />
            {!hasCoordinates && <small className="hospital-map-note">Coordinates are not available for this listing.</small>}
          </Card>
        </div>
        <div className="hospital-detail-side">
          <Alert tone="info" title="Directory information only">Emergency availability is a directory flag. This platform does not verify live capacity, wait times, or hospital acceptance.</Alert>
          {hospital.isDemo && <Alert tone="warning" title="Development sample">This listing and its coordinates are sample data, not a verified facility record.</Alert>}
          <Link className="btn btn--ghost hospital-back-button" to="/hospitals">Return to hospital directory</Link>
        </div>
      </div>
    </div>
  )
}

function Fact({ icon: Icon, label, value }) { return <div className="hospital-fact"><Icon size={17} /><span><small>{label}</small><strong>{value}</strong></span></div> }