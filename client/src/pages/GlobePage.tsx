import { useState } from 'react'
import { Star, Map as MapIcon, Image as ImageIcon, Box, Maximize2, Minimize2, MousePointer2, Hand, Search, X } from 'lucide-react'
import { CesiumGlobe } from '../components/CesiumGlobe'
import { useGlobeStore } from '../stores/globeStore'
import { useTrackingStore } from '../stores/trackingStore'
import { formatNumber } from '../utils/format'
import './GlobePage.css'

export function GlobePage() {
  const selected = useGlobeStore((state) => state.selected)
  const mapStyle = useGlobeStore((state) => state.mapStyle)
  const setMapStyle = useGlobeStore((state) => state.setMapStyle)
  const isLoading = useGlobeStore((state) => state.isLoading)
  const loadProgress = useGlobeStore((state) => state.loadProgress)
  const add = useTrackingStore((state) => state.add)
  
  const [isInfoCollapsed, setIsInfoCollapsed] = useState(false)
  const [showTutorial, setShowTutorial] = useState(true)

  return (
    <div className="globe-page">
      <CesiumGlobe />

      {/* Loading Progress Bar */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-card">
            <div className="loading-text">
              <span>Loading Orbital Data...</span>
              <span>{loadProgress}%</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${loadProgress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="tutorial-overlay">
          <div className="tutorial-card">
            <h2>Globe Controls</h2>
            <p>Welcome! Here is how to navigate the 3D viewer:</p>
            
            <div className="tutorial-controls">
              <div className="tutorial-item">
                <MousePointer2 className="tutorial-icon" />
                <div className="tutorial-text">
                  <strong>Rotate</strong>
                  <span>Left Click + Drag</span>
                </div>
              </div>
              <div className="tutorial-item">
                <Hand className="tutorial-icon" />
                <div className="tutorial-text">
                  <strong>Pan</strong>
                  <span>Spacebar + Drag</span>
                </div>
              </div>
              <div className="tutorial-item">
                <Search className="tutorial-icon" />
                <div className="tutorial-text">
                  <strong>Zoom</strong>
                  <span>Scroll Wheel</span>
                </div>
              </div>
              <div className="tutorial-item">
                <X className="tutorial-icon" />
                <div className="tutorial-text">
                  <strong>Deselect</strong>
                  <span>Double Click empty space</span>
                </div>
              </div>
            </div>

            <button className="tutorial-btn" onClick={() => setShowTutorial(false)}>
              Understood
            </button>
          </div>
        </div>
      )}

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

      <aside className={`info-panel ${isInfoCollapsed ? 'collapsed' : ''}`}>
        {isInfoCollapsed ? (
          <button onClick={() => setIsInfoCollapsed(false)} className="expand-btn" title="Expand Info">
            <Maximize2 size={18} />
          </button>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 style={{ margin: 0 }}>Globe</h1>
              <button onClick={() => setIsInfoCollapsed(true)} className="collapse-btn" title="Collapse Info">
                <Minimize2 size={18} />
              </button>
            </div>
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
          </>
        )}
      </aside>
    </div>
  )
}
