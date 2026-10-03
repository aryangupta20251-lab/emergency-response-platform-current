import { Hospital, MapPin, Search, SlidersHorizontal } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Alert from '../components/Alert'
import Card from '../components/Card'
import MapContainer from '../components/MapContainer'
import { hospitalTypes, hospitals as sampleHospitals } from '../data/hospitalData'
import { findNearbyHospitals, listHospitals } from '../services/hospitalService'

export default function HospitalsPage() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('All types')
  const [hospitals, setHospitals] = useState(sampleHospitals)
  const [loading, setLoading] = useState(true)
  const [directoryError, setDirectoryError] = useState('')
  const [locationError, setLocationError] = useState('')
  const [locationState, setLocationState] = useState('permission-required')
  const [userLocation, setUserLocation] = useState(null)
  const [nearbyOnly, setNearbyOnly] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    listHospitals({ type: type === 'All types' ? undefined : type })
      .then((results) => {
        if (!active) return
        setHospitals(results)
        setDirectoryError('')
      })
      .catch(() => {
        if (!active) return
        setHospitals(sampleHospitals)
        setDirectoryError('Hospital service is unavailable. Showing clearly labeled sample listings.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [type])

  const filteredHospitals = hospitals.filter((hospital) => {
    const matchesQuery = `${hospital.name} ${hospital.address} ${hospital.type}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (type === 'All types' || hospital.type === type)
  })

  const mapMarkers = useMemo(() => filteredHospitals.map((hospital) => ({
    ...hospital,
    distanceKm: hospital.distanceKm,
    isDemo: hospital.isDemo ?? true,
  })), [filteredHospitals])

  const requestUserLocation = () => {
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationState('unavailable')
      setLocationError('This browser does not support location access. You can still browse the directory.')
      return
    }

    setLocationState('loading')
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const location = { latitude: coords.latitude, longitude: coords.longitude }
      setUserLocation(location)
      setLocationState('available')
      try {
        const nearby = await findNearbyHospitals({ ...location, radius: 10, type: type === 'All types' ? undefined : type })
        setHospitals(nearby)
        setNearbyOnly(true)
        setDirectoryError('')
      } catch {
        setLocationError('Nearby search is unavailable. The hospital directory is still available.')
      }
    }, () => {
      setLocationState('unavailable')
      setLocationError('Location permission was not granted. You can still browse the hospital directory and map.')
    }, { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 })
  }

  const visibleCenter = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : [30.7415, 76.7683]

  return (
    <div className="page-content hospitals-page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><Hospital size={14} /> Hospital directory</span>
          <h1 className="page-title">Nearby hospitals</h1>
          <p className="page-subtitle">Browse hospital directory listings and request a nearby search from your location.</p>
        </div>
      </div>
      <div className="dashboard-demo-note">
        <span className="status-dot status-dot--info" />
        <span>Directory availability is not live</span>
        <small>Development listings are labeled. Call local emergency services directly in an emergency.</small>
      </div>
      {directoryError && <Alert tone="warning" title="Hospital directory notice">{directoryError}</Alert>}
      {locationError && <Alert tone="info" title="Location not available">{locationError}</Alert>}
      <div className="hospital-layout">
        <div className="hospital-list-column">
          <Card className="hospital-filters">
            <label className="incident-search">
              <Search size={17} />
              <span className="sr-only">Search hospitals</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search hospitals or locations" />
            </label>
            <label className="incident-status-filter">
              <SlidersHorizontal size={16} />
              <span className="sr-only">Filter by hospital type</span>
              <select value={type} onChange={(event) => { setType(event.target.value); setNearbyOnly(false) }}>
                <option>All types</option>
                {hospitalTypes.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </Card>
          {loading ? <Card role="status">Loading hospital directory…</Card> : filteredHospitals.length ? (
            <div className="hospital-list">
              {filteredHospitals.map((hospital) => <HospitalCard hospital={hospital} key={hospital.id} />)}
            </div>
          ) : (
            <Card className="incident-empty-page">
              <div className="placeholder-page__icon"><Search size={26} /></div>
              <h2>{nearbyOnly ? 'No hospitals within 10 km' : 'No hospitals found'}</h2>
              <p>{nearbyOnly ? 'Try browsing the full directory or another location.' : 'Try a different search or hospital type.'}</p>
            </Card>
          )}
        </div>
        <Card className="hospital-map-card">
          <div className="card-heading">
            <div>
              <span className="muted-label">Google Maps</span>
              <h2 className="detail-card-title">{nearbyOnly ? 'Hospitals within 10 km' : 'Hospital locations'}</h2>
            </div>
            <MapPin color="var(--color-primary)" size={20} />
          </div>
          <MapContainer
            interactive
            markers={mapMarkers}
            userLocation={userLocation}
            center={visibleCenter}
            locationState={locationState}
            onRequestLocation={requestUserLocation}
          />
          <small className="hospital-map-note">Markers use the application hospital directory; emergency availability is not real-time.</small>
        </Card>
      </div>
    </div>
  )
}

function HospitalCard({ hospital }) {
  const distance = typeof hospital.distanceKm === 'number'
    ? `${hospital.distanceKm.toFixed(1)} km straight-line`
    : hospital.distance || 'Distance not calculated'
  return (
    <Card className="hospital-card">
      <div className="hospital-card__icon"><Hospital size={21} /></div>
      <div className="hospital-card__body">
        <div className="hospital-card__top">
          <span className="hospital-type">{hospital.type}</span>
          <strong>{distance}</strong>
        </div>
        <h2>{hospital.name}</h2>
        <p>{hospital.address}</p>
        <small>{hospital.isDemo ? 'Development sample · availability is not live' : `Emergency availability: ${hospital.emergencyAvailable ? 'listed' : 'not listed'}`}</small>
      </div>
      <Link className="btn btn--secondary hospital-card__link" to={`/hospitals/${hospital.id}`}>Details</Link>
    </Card>
  )
}