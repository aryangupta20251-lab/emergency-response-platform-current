import { Crosshair, Hospital, MapPin, Plus, Minus } from 'lucide-react'

export default function MapContainer({ interactive = false }) {
  return (
    <div className={`mock-map ${interactive ? 'mock-map--interactive' : ''}`} aria-label="Map preview">
      <div className="map-grid" />
      <div className="map-road map-road--one" /><div className="map-road map-road--two" /><div className="map-road map-road--three" />
      <span className="map-marker map-marker--incident"><MapPin size={24} fill="currentColor" /></span>
      <span className="map-marker map-marker--hospital"><Hospital size={17} /></span>
      <span className="map-marker map-marker--user"><span /></span>
      <div className="map-controls"><button aria-label="Zoom in"><Plus size={16} /></button><button aria-label="Zoom out"><Minus size={16} /></button><button aria-label="Locate me"><Crosshair size={16} /></button></div>
      <div className="map-label">Demo map · location data</div>
    </div>
  )
}
