import { Star, Map as MapIcon, Image as ImageIcon, Box } from 'lucide-react'
import { CesiumGlobe } from '../components/CesiumGlobe'
import { useGlobeStore } from '../stores/globeStore'
import { useTrackingStore } from '../stores/trackingStore'
import { formatNumber } from '../utils/format'
import './GlobePage.css' // We will create this

export function GlobePage() {
  const selected = useGlobeStore((state) => state.selected)
  const mapStyle = useGlobeStore((state) => state.mapStyle)
  const setMapStyle = useGlobeStore((state) => state.setMapStyle)
  const add = useTrackingStore((state) => state.add)

  return (
    <div className="globe-page">
      <CesiumGlobe />
      
      {/* Map Style Controls */}
      <div id="altitude-indicator" className="altitude-indicator">
        Altitude: -- km
      </div>
      
      <div className="map-style-controls">
        <button 
          className={`style-btn ${mapStyle === 'satellite' ? 'active' : ''}`}
          onClick={() => setMapStyle('satellite')}
          title="Satellite Imagery"
        >
          <ImageIcon size={16} /> Satellite
        </button>
        <button 
          className={`style-btn ${mapStyle === 'map' ? 'active' : ''}`}
          onClick={() => setMapStyle('map')}
          title="Map with Borders"
        >
          <MapIcon size={16} /> Map
        </button>
        <button 
          className={`style-btn ${mapStyle === 'base' ? 'active' : ''}`}
          onClick={() => setMapStyle('base')}
          title="Base Color"
        >
          <Box size={16} /> Base
        </button>
      </div>

      <aside className="info-panel">
        <h1>Globe</h1>
        {selected ? (
          <>
            <h2>{selected.name ?? selected.catalogNumber}</h2>
            <dl>
              <dt>Catalog</dt><dd>{selected.catalogNumber}</dd>
              <dt>Class</dt><dd>{selected.assetClass}</dd>
              <dt>Operator</dt><dd>{selected.operatorName ?? 'n/a'}</dd>
              <dt>Country</dt><dd>{selected.originCountry ?? 'n/a'}</dd>
              <dt>Altitude</dt><dd>{formatNumber(selected.altitudeKm, 1)} km</dd>
              <dt>Velocity</dt><dd>{formatNumber(selected.velocityKmps, 2)} km/s</dd>
            </dl>
            <button onClick={() => add({ catalogNumber: selected.catalogNumber, name: selected.name })}>
              <Star size={16} /> Track
            </button>
          </>
        ) : <p>Select a satellite to inspect its current propagated state.</p>}
      </aside>
    </div>
  )
}
