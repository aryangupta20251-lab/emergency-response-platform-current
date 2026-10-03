import { LocateFixed } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  getGoogleMapsAuthFailure,
  loadGoogleMaps,
  subscribeToGoogleMapsAuthFailure,
} from '../services/googleMapsLoader'
import { getMapPosition } from '../utils/mapCoordinates'

const defaultCenter = { lat: 30.7415, lng: 76.7683 }
const emptyMarkers = []

const locationMessages = {
  'permission-required': ['Location permission required', 'Use the location control to request browser permission.'],
  loading: ['Finding location', 'Waiting for browser location permission...'],
  unavailable: ['Location unavailable', 'You can still browse the map and hospital list.'],
  error: ['Could not load location', 'You can still browse the map and hospital list.'],
}

function getMarkerIcon(kind) {
  const styles = {
    hospital: { color: '#2563eb', scale: 14 },
    incident: { color: '#dc2626', scale: 14 },
    user: { color: '#14b8a6', scale: 9 },
  }
  const style = styles[kind]
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: style.color,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: style.scale,
  }
}

function createInfoContent(marker, kind) {
  const content = document.createElement('div')
  content.className = 'map-popup'

  const addText = (tag, text) => {
    if (text == null || text === '') return
    const element = document.createElement(tag)
    element.textContent = String(text)
    content.append(element)
  }

  if (kind === 'user') {
    addText('strong', marker.source === 'Browser location permission' ? 'Your current location' : 'Selected incident location')
    return content
  }

  addText('strong', marker.name || (kind === 'incident' ? 'Authorized incident location' : 'Location'))
  if (marker.type) addText('span', marker.type)
  if (marker.address) addText('span', marker.address)
  if (marker.distanceKm !== undefined) addText('span', `${Number(marker.distanceKm).toFixed(1)} km straight-line`)
  if (marker.emergencyAvailable !== undefined) {
    addText('span', marker.emergencyAvailable ? 'Listed as emergency-capable' : 'Emergency availability not listed')
  }
  if (marker.isDemo) addText('small', 'Development sample · availability is not live')
  return content
}

function getMapError(error) {
  if (error?.code === 'GOOGLE_MAPS_KEY_MISSING') {
    return 'Google Maps is not configured. Set VITE_GOOGLE_MAPS_API_KEY in web/.env.local and restart Vite.'
  }
  if (error?.code === 'GOOGLE_MAPS_AUTH_FAILURE') {
    return 'Google Maps rejected this key. Check its Maps JavaScript API restriction, HTTP referrers, and billing configuration.'
  }
  return 'Google Maps could not load. Check your network connection and Google Cloud API-key, referrer, and billing settings.'
}

export default function MapContainer({
  interactive = false,
  locationState = 'available',
  onRequestLocation,
  markers = emptyMarkers,
  userLocation = null,
  incidentLocation = null,
  onSelectLocation,
  center = [defaultCenter.lat, defaultCenter.lng],
  zoom = 12,
}) {
  const elementRef = useRef(null)
  const mapRef = useRef(null)
  const infoWindowRef = useRef(null)
  const onSelectLocationRef = useRef(onSelectLocation)
  const [mapLibrary, setMapLibrary] = useState(null)
  const [mapError, setMapError] = useState('')
  const [mapReady, setMapReady] = useState(false)
  const [authFailure, setAuthFailure] = useState(false)

  const safeMarkers = useMemo(() => markers
    .map((marker) => ({ ...marker, position: getMapPosition(marker) }))
    .filter((marker) => marker.position), [markers])
  const invalidMarkerCount = markers.length - safeMarkers.length
  const userPosition = getMapPosition(userLocation)
  const incidentPosition = getMapPosition(incidentLocation)
  const centerPosition = useMemo(
    () => getMapPosition({ latitude: center?.[0], longitude: center?.[1] }) || defaultCenter,
    [center?.[0], center?.[1]],
  )
  const positions = useMemo(() => [
    ...safeMarkers.map((marker) => marker.position),
    ...(userPosition ? [userPosition] : []),
    ...(incidentPosition ? [incidentPosition] : []),
  ], [incidentPosition?.lat, incidentPosition?.lng, safeMarkers, userPosition?.lat, userPosition?.lng])
  const positionKey = positions.map(({ lat, lng }) => `${lat},${lng}`).join('|')
  const stateMessage = locationMessages[locationState]

  useEffect(() => {
    onSelectLocationRef.current = onSelectLocation
  }, [onSelectLocation])

  useEffect(() => {
    let active = true
    const unsubscribe = subscribeToGoogleMapsAuthFailure(() => {
      if (active) {
        setAuthFailure(true)
        setMapError(getMapError({ code: 'GOOGLE_MAPS_AUTH_FAILURE' }))
      }
    })

    loadGoogleMaps()
      .then((library) => {
        if (!active) return
        if (getGoogleMapsAuthFailure()) {
          setAuthFailure(true)
          setMapError(getMapError({ code: 'GOOGLE_MAPS_AUTH_FAILURE' }))
          return
        }
        setMapLibrary(library)
      })
      .catch((error) => {
        if (active) setMapError(getMapError(error))
      })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!mapLibrary || !elementRef.current || authFailure) return undefined

    const map = new mapLibrary.Map(elementRef.current, {
      center: defaultCenter,
      zoom: 12,
      clickableIcons: false,
      gestureHandling: 'cooperative',
      scrollwheel: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })
    const infoWindow = new mapLibrary.InfoWindow()
    const clickListener = map.addListener('click', (event) => {
      if (event.latLng && onSelectLocationRef.current) {
        onSelectLocationRef.current({
          latitude: event.latLng.lat(),
          longitude: event.latLng.lng(),
        })
      }
    })

    mapRef.current = map
    infoWindowRef.current = infoWindow
    setMapReady(true)

    return () => {
      clickListener.remove()
      infoWindow.close()
      mapRef.current = null
      infoWindowRef.current = null
    }
  }, [authFailure, mapLibrary])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    if (positions.length > 1) {
      const bounds = new window.google.maps.LatLngBounds()
      positions.forEach((position) => bounds.extend(position))
      map.fitBounds(bounds, 32)
    } else if (positions.length === 1) {
      map.setCenter(positions[0])
      map.setZoom(Math.max(map.getZoom() || zoom, 14))
    } else {
      map.setCenter(centerPosition)
      map.setZoom(zoom)
    }
  }, [centerPosition, mapLibrary, mapReady, positionKey, positions, zoom])

  useEffect(() => {
    mapRef.current?.setOptions({
      gestureHandling: interactive ? 'greedy' : 'cooperative',
      scrollwheel: interactive,
    })
  }, [interactive, mapReady])

  useEffect(() => {
    const map = mapRef.current
    const infoWindow = infoWindowRef.current
    if (!map || !infoWindow || !mapReady || authFailure) return undefined

    const activeMarkers = []
    const addMarker = (marker, kind) => {
      const instance = new window.google.maps.Marker({
        map,
        position: marker.position,
        title: marker.name || (kind === 'incident' ? 'Incident location' : 'Current location'),
        icon: getMarkerIcon(kind),
        ...(kind === 'hospital' || kind === 'incident'
          ? { label: { text: kind === 'hospital' ? 'H' : '!', color: '#ffffff', fontWeight: '700' } }
          : {}),
      })
      const listener = instance.addListener('click', () => {
        infoWindow.setContent(createInfoContent(marker, kind))
        infoWindow.open({ map, anchor: instance })
      })
      activeMarkers.push({ instance, listener })
    }

    safeMarkers.forEach((marker) => addMarker(marker, 'hospital'))
    if (userPosition) addMarker({ ...userLocation, position: userPosition }, 'user')
    if (incidentPosition) addMarker({ ...incidentLocation, position: incidentPosition }, 'incident')

    return () => {
      activeMarkers.forEach(({ instance, listener }) => {
        listener.remove()
        instance.setMap(null)
      })
      infoWindow.close()
    }
  }, [
    incidentLocation?.name,
    incidentPosition?.lat,
    incidentPosition?.lng,
    mapLibrary,
    mapReady,
    authFailure,
    safeMarkers,
    userLocation?.source,
    userPosition?.lat,
    userPosition?.lng,
  ])

  const errorText = mapError || (authFailure ? getMapError({ code: 'GOOGLE_MAPS_AUTH_FAILURE' }) : '')

  return (
    <div className={`real-map ${interactive ? 'real-map--interactive' : ''}`} role="region" aria-label="Google Map">
      <div ref={elementRef} className="real-map__canvas" />
      {!errorText && !mapReady && <div className="real-map__notice" role="status">Loading Google Maps…</div>}
      {errorText && <div className="real-map__notice real-map__notice--error" role="alert">{errorText}</div>}
      {invalidMarkerCount > 0 && !errorText && (
        <div className="real-map__notice real-map__notice--warning" role="status">
          {invalidMarkerCount} location{invalidMarkerCount === 1 ? '' : 's'} could not be shown because coordinates are missing or invalid.
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
