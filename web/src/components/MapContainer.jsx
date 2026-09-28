import L from 'leaflet'
import { LocateFixed } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { MapContainer as LeafletMap, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const defaultCenter = [30.7415, 76.7683]
const emptyMarkers = []

const markerIcons = {
  hospital: L.divIcon({
    className: 'leaflet-marker leaflet-marker--hospital',
    html: '<span aria-hidden="true">H</span>',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30],
  }),
  user: L.divIcon({
    className: 'leaflet-marker leaflet-marker--user',
    html: '<span aria-hidden="true"></span>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }),
  incident: L.divIcon({
    className: 'leaflet-marker leaflet-marker--incident',
    html: '<span aria-hidden="true">!</span>',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30],
  }),
}

const locationMessages = {
  'permission-required': ['Location permission required', 'Use the location control to request browser permission.'],
  loading: ['Finding location', 'Waiting for browser location permission...'],
  unavailable: ['Location unavailable', 'You can still browse the map and hospital list.'],
  error: ['Could not load location', 'You can still browse the map and hospital list.'],
}

function getPosition(location) {
  if (!location || typeof location !== 'object') return null
  const latitude = Number(location.latitude ?? location.lat)
  const longitude = Number(location.longitude ?? location.lng ?? location.lon)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
    || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null
  }
  return [latitude, longitude]
}

function FitMarkers({ positions, center, zoom }) {
  const map = useMap()
  const positionKey = positions.map(([latitude, longitude]) => `${latitude},${longitude}`).join('|')

  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(positions, { padding: [32, 32], maxZoom: 15 })
    } else if (positions.length === 1) {
      map.setView(positions[0], Math.max(map.getZoom(), 14))
    } else {
      map.setView(center, zoom)
    }
  // positionKey changes only when coordinates change, so user panning is preserved.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center, map, positionKey, zoom])

  return null
}

function MapPointSelector({ onSelectLocation }) {
  useMapEvents({
    click(event) {
      onSelectLocation?.({ latitude: event.latlng.lat, longitude: event.latlng.lng })
    },
  })
  return null
}

export default function MapContainer({
  interactive = false,
  locationState = 'available',
  onRequestLocation,
  markers = emptyMarkers,
  userLocation = null,
  incidentLocation = null,
  onSelectLocation,
  center = defaultCenter,
  zoom = 12,
}) {
  const [tileStatus, setTileStatus] = useState('loading')
  const stateMessage = locationMessages[locationState]
  const safeMarkers = useMemo(() => markers
    .map((marker) => ({ ...marker, position: getPosition(marker) }))
    .filter((marker) => marker.position), [markers])
  const userPosition = getPosition(userLocation)
  const incidentPosition = getPosition(incidentLocation)
  const centerPosition = getPosition({ latitude: center[0], longitude: center[1] }) || defaultCenter
  const positions = useMemo(() => [
    ...safeMarkers.map((marker) => marker.position),
    ...(userPosition ? [userPosition] : []),
    ...(incidentPosition ? [incidentPosition] : []),
  ], [incidentPosition?.[0], incidentPosition?.[1], safeMarkers, userPosition?.[0], userPosition?.[1]])

  return (
    <div className={`real-map ${interactive ? 'real-map--interactive' : ''}`} aria-label="OpenStreetMap">
      <LeafletMap center={centerPosition} zoom={zoom} scrollWheelZoom={interactive} className="real-map__canvas">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            load: () => setTileStatus('loaded'),
            tileerror: () => setTileStatus((current) => current === 'loaded' ? current : 'error'),
          }}
        />
        <FitMarkers positions={positions} center={centerPosition} zoom={zoom} />
        {onSelectLocation && <MapPointSelector onSelectLocation={onSelectLocation} />}
        {safeMarkers.map((marker) => (
          <Marker key={marker.id} position={marker.position} icon={markerIcons.hospital}>
            <Popup>
              <div className="map-popup">
                <strong>{marker.name}</strong>
                {marker.type && <span>{marker.type}</span>}
                {marker.address && <span>{marker.address}</span>}
                {marker.distanceKm !== undefined && <span>{Number(marker.distanceKm).toFixed(1)} km straight-line</span>}
                {marker.emergencyAvailable !== undefined && (
                  <span>{marker.emergencyAvailable ? 'Listed as emergency-capable' : 'Emergency availability not listed'}</span>
                )}
                {marker.isDemo && <small>Development sample · availability is not live</small>}
              </div>
            </Popup>
          </Marker>
        ))}
        {userPosition && (
          <Marker position={userPosition} icon={markerIcons.user}>
            <Popup>{userLocation.source === 'Browser location permission' ? 'Your current location' : 'Selected incident location'}</Popup>
          </Marker>
        )}
        {incidentPosition && (
          <Marker position={incidentPosition} icon={markerIcons.incident}>
            <Popup>{incidentLocation.name || 'Authorized incident location'}</Popup>
          </Marker>
        )}
      </LeafletMap>
      {tileStatus === 'loading' && <div className="real-map__notice" role="status">Loading OpenStreetMap…</div>}
      {tileStatus === 'error' && (
        <div className="real-map__notice real-map__notice--error" role="status">
          Map tiles are temporarily unavailable. You can still use the hospital list.
        </div>
      )}
      {onRequestLocation && (
        <button
          className="real-map__locate"
          type="button"
          onClick={onRequestLocation}
          aria-label="Use my current location"
          title="Use my current location"
        >
          <LocateFixed size={17} />
        </button>
      )}
      {stateMessage && (
        <div className="real-map__location-notice" role="status">
          <strong>{stateMessage[0]}</strong>
          <span>{stateMessage[1]}</span>
        </div>
      )}
    </div>
  )
}
