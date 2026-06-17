import { useState, useEffect } from 'react'
import { Star, Map as MapIcon, Image as ImageIcon, Box, Maximize2, Minimize2, MousePointer2, Hand, Search, X, Globe2, Compass, CheckCircle } from 'lucide-react'
import { CesiumGlobe } from '../components/CesiumGlobe'
import { SkyMapCanvas } from '../components/SkyMapCanvas'
import { CelestialEventsPanel } from '../components/CelestialEventsPanel'
import { PlanetContextCard } from '../components/PlanetContextCard'
import { LocationPrompt } from '../components/LocationPrompt'
import { useGlobeStore } from '../stores/globeStore'
import { useTrackingStore } from '../stores/trackingStore'
import { useChatStore } from '../stores/chatStore'
import { useSkyStore } from '../stores/skyStore'
import { formatNumber } from '../utils/format'
import './GlobePage.css'

export function GlobePage() {
  const selected = useGlobeStore((state) => state.selected)
  const mapStyle = useGlobeStore((state) => state.mapStyle)
  const setMapStyle = useGlobeStore((state) => state.setMapStyle)
  const isLoading = useGlobeStore((state) => state.isLoading)
  const loadProgress = useGlobeStore((state) => state.loadProgress)
  const add = useTrackingStore((state) => state.add)
  const remove = useTrackingStore((state) => state.remove)
  const isTracked = useTrackingStore((state) => state.isTracked)
  const isChatOpen = useChatStore((state) => state.isOpen)
  const viewMode = useSkyStore((state) => state.viewMode)
  const setViewMode = useSkyStore((state) => state.setViewMode)

  const [isInfoCollapsed, setIsInfoCollapsed] = useState(false)
  const [showTutorial, setShowTutorial] = useState(true)
  const [toast, setToast] = useState<'tracked' | 'untracked' | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const toggleTrack = () => {
    if (!selected) return
    if (isTracked(selected.catalogNumber)) {
      remove(selected.catalogNumber)
      setToast('untracked')
    } else {
      add({ catalogNumber: selected.catalogNumber, name: selected.name })
      setToast('tracked')
    }
  }
  const isSkyMap = viewMode === 'skymap'

  return (
    <div className="globe-page">
      {/* Cesium stays mounted so the viewer + camera state persist across toggles */}
      <CesiumGlobe />
      {isSkyMap && <SkyMapCanvas />}
      <LocationPrompt />
      <PlanetContextCard />

      {/* Globe / Sky Map view toggle */}
      <div className="view-mode-toggle">
        <button className={!isSkyMap ? 'active' : ''} onClick={() => setViewMode('globe')} title="3D Globe view">
          <Globe2 size={15} /> Globe
        </button>
        <button className={isSkyMap ? 'active' : ''} onClick={() => setViewMode('skymap')} title="Zenith Sky Map view">
          <Compass size={15} /> Sky Map
        </button>
      </div>

      {/* Loading Progress Bar */}
      {isLoading && !isSkyMap && (
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
      {showTutorial && !isSkyMap && (
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

      {/* Map Style Controls (globe view only) */}
      {!isSkyMap && (
        <>
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
        </>
      )}

      <aside className={`info-panel ${isInfoCollapsed ? 'collapsed' : ''} ${isChatOpen ? 'shifted' : ''}`}>
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
                <button
                  className={`track-btn ${isTracked(selected.catalogNumber) ? 'tracked' : ''}`}
                  onClick={toggleTrack}
                >
                  <Star size={16} fill={isTracked(selected.catalogNumber) ? 'currentColor' : 'none'} />
                  {isTracked(selected.catalogNumber) ? 'Tracked' : 'Track'}
                </button>

                {toast && (
                  <div className={`track-toast ${toast}`}>
                    <CheckCircle size={14} />
                    {toast === 'tracked' ? 'Tracked successfully!' : 'Removed from tracked'}
                  </div>
                )}
              </>
            ) : <p>Select a satellite to inspect its current propagated state.</p>}
          </>
        )}
      </aside>

      <CelestialEventsPanel />
    </div>
  )
}
