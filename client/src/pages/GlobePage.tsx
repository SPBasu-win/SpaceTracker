import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star, Maximize2, Minimize2, MousePointer2, Hand, ZoomIn, X,
  Globe2, CheckCircle, ChevronRight, Satellite, Radio
} from 'lucide-react'
import { CesiumGlobe }           from '../components/CesiumGlobe'
import { CelestialEventsPanel }  from '../components/CelestialEventsPanel'
import { ZenithPanel }           from '../components/ZenithPanel'
import { PlanetContextCard }     from '../components/PlanetContextCard'
import { LocationPrompt }        from '../components/LocationPrompt'
import { FloatingTopBar }        from '../components/FloatingTopBar'
import { ActivityFeed }          from '../components/ActivityFeed'
import { MetricsRibbon }         from '../components/MetricsRibbon'
import { QuickNavBar }           from '../components/QuickNavBar'
import { CommandPalette }        from '../components/CommandPalette'
import { useGlobeStore }         from '../stores/globeStore'
import { useTrackingStore }      from '../stores/trackingStore'
import { useChatStore }          from '../stores/chatStore'
import { useSkyStore }           from '../stores/skyStore'
import { formatNumber }          from '../utils/format'
import './GlobePage.css'

export function GlobePage() {
  const selected        = useGlobeStore(s => s.selected)
  const mapStyle        = useGlobeStore(s => s.mapStyle)
  const setMapStyle     = useGlobeStore(s => s.setMapStyle)
  const isLoading       = useGlobeStore(s => s.isLoading)
  const loadProgress    = useGlobeStore(s => s.loadProgress)
  const add             = useTrackingStore(s => s.add)
  const remove          = useTrackingStore(s => s.remove)
  const isTracked       = useTrackingStore(s => s.isTracked)
  const isChatOpen      = useChatStore(s => s.isOpen)
  const viewMode        = useSkyStore(s => s.viewMode)
  const isZenith        = viewMode === 'zenith'

  const [isInfoCollapsed, setIsInfoCollapsed] = useState(false)
  const [showTutorial,    setShowTutorial]    = useState(true)
  const [toast,           setToast]           = useState<'tracked' | 'untracked' | null>(null)
  const [cmdOpen,         setCmdOpen]         = useState(false)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  // Ctrl+K opens command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const toggleTrack = useCallback(() => {
    if (!selected) return
    if (isTracked(selected.catalogNumber)) {
      remove(selected.catalogNumber)
      setToast('untracked')
    } else {
      add({ catalogNumber: selected.catalogNumber, name: selected.name })
      setToast('tracked')
    }
  }, [selected, isTracked, remove, add])

  return (
    <div className="globe-page">
      {/* ── Core Globe ─────────────────────────────────── */}
      <CesiumGlobe />
      <LocationPrompt />
      <PlanetContextCard />

      {/* ── Floating Top Bar ───────────────────────────── */}
      <FloatingTopBar onOpenCommandPalette={() => setCmdOpen(true)} />

      {/* ── Activity Feed (left) ───────────────────────── */}
      {!isZenith && <ActivityFeed isChatOpen={isChatOpen} />}

      {/* ── Info Panel (right) ─────────────────────────── */}
      {!isZenith && (
        <AnimatePresence>
          <motion.aside
            key="info-panel"
            className={`gp-info-panel glass ${isChatOpen ? 'gp-info-shifted' : ''}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35, delay: 0.2 }}
          >
            {isInfoCollapsed ? (
              <motion.button
                className="gp-expand-btn btn-ghost btn-icon"
                onClick={() => setIsInfoCollapsed(false)}
                title="Expand panel"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Maximize2 size={16} />
              </motion.button>
            ) : (
              <>
                {/* Panel header */}
                <div className="gp-panel-header">
                  <span className="gp-panel-title">
                    {selected ? (
                      <><Satellite size={13} /> Asset Details</>
                    ) : (
                      <><Globe2 size={13} /> Overview</>
                    )}
                  </span>
                  <motion.button
                    className="btn-ghost btn-icon"
                    onClick={() => setIsInfoCollapsed(true)}
                    title="Collapse panel"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Minimize2 size={14} />
                  </motion.button>
                </div>

                <AnimatePresence mode="wait">
                  {selected ? (
                    <motion.div
                      key={selected.catalogNumber}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Asset name */}
                      <div className="gp-asset-name">
                        <h2>{selected.name ?? `Object ${selected.catalogNumber}`}</h2>
                        <span className={`gp-class-badge gp-class-${selected.assetClass.toLowerCase()}`}>
                          {selected.assetClass}
                        </span>
                      </div>

                      {/* Metrics */}
                      <div className="gp-metrics-grid">
                        <div className="gp-metric">
                          <span className="gp-metric-label">NORAD ID</span>
                          <span className="gp-metric-value gp-metric-mono">{selected.catalogNumber}</span>
                        </div>
                        <div className="gp-metric">
                          <span className="gp-metric-label">Altitude</span>
                          <span className="gp-metric-value">
                            {formatNumber(selected.altitudeKm, 0)}
                            <span className="gp-metric-unit">km</span>
                          </span>
                        </div>
                        <div className="gp-metric">
                          <span className="gp-metric-label">Velocity</span>
                          <span className="gp-metric-value">
                            {formatNumber(selected.velocityKmps, 2)}
                            <span className="gp-metric-unit">km/s</span>
                          </span>
                        </div>
                        <div className="gp-metric">
                          <span className="gp-metric-label">Country</span>
                          <span className="gp-metric-value">{selected.originCountry ?? '—'}</span>
                        </div>
                        <div className="gp-metric gp-metric-wide">
                          <span className="gp-metric-label">Operator</span>
                          <span className="gp-metric-value">{selected.operatorName ?? '—'}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="gp-asset-actions">
                        <motion.button
                          className={`gp-track-btn ${isTracked(selected.catalogNumber) ? 'gp-track-btn--tracked' : ''}`}
                          onClick={toggleTrack}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <Star size={14} fill={isTracked(selected.catalogNumber) ? 'currentColor' : 'none'} />
                          {isTracked(selected.catalogNumber) ? 'Tracked' : 'Track Asset'}
                        </motion.button>
                      </div>

                      {/* Toast */}
                      <AnimatePresence>
                        {toast && (
                          <motion.div
                            className={`gp-toast gp-toast--${toast}`}
                            initial={{ opacity: 0, y: -6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                          >
                            <CheckCircle size={12} />
                            {toast === 'tracked' ? 'Tracked successfully' : 'Removed from tracked'}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="gp-empty-state"
                    >
                      <Radio size={32} opacity={0.2} />
                      <p>Select a satellite on the globe to inspect its orbital state.</p>
                      <div className="gp-hint-row">
                        <span className="gp-hint-chip"><MousePointer2 size={11} /> Click</span>
                        <span className="gp-hint-text">to select</span>
                        <span className="gp-hint-chip"><Hand size={11} /> Space+Drag</span>
                        <span className="gp-hint-text">to pan</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.aside>
        </AnimatePresence>
      )}

      {/* ── Quick Navigation + Map Style ───────────────── */}
      {!isZenith && (
        <QuickNavBar mapStyle={mapStyle} onSetMapStyle={setMapStyle} />
      )}

      {/* ── Metrics Ribbon ─────────────────────────────── */}
      {!isZenith && <MetricsRibbon />}

      {/* ── Altitude Indicator ─────────────────────────── */}
      {!isZenith && (
        <div id="altitude-indicator" className="gp-altitude-indicator" />
      )}

      {/* ── Zenith Panel ───────────────────────────────── */}
      {isZenith && <ZenithPanel />}

      {/* ── Celestial Events Panel ─────────────────────── */}
      <CelestialEventsPanel />

      {/* ── Loading Overlay ────────────────────────────── */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="gp-loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="gp-loading-card glass"
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
            >
              <div className="gp-loading-header">
                <div className="gp-loading-spinner" />
                <span className="gp-loading-label">Loading Orbital Data</span>
                <span className="gp-loading-pct">{loadProgress}%</span>
              </div>
              <div className="gp-progress-track">
                <motion.div
                  className="gp-progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${loadProgress}%` }}
                  transition={{ ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tutorial ───────────────────────────────────── */}
      <AnimatePresence>
        {showTutorial && !isLoading && (
          <motion.div
            className="gp-tutorial-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              className="gp-tutorial-card glass"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.6 }}
            >
              <div className="gp-tutorial-header">
                <Globe2 size={20} color="var(--accent)" />
                <h3>Globe Controls</h3>
              </div>

              <div className="gp-tutorial-items">
                {[
                  { icon: <MousePointer2 size={16} />, label: 'Rotate',   hint: 'Left click + drag' },
                  { icon: <Hand size={16} />,          label: 'Pan',      hint: 'Space + drag' },
                  { icon: <ZoomIn size={16} />,        label: 'Zoom',     hint: 'Scroll wheel' },
                  { icon: <X size={16} />,             label: 'Deselect', hint: 'Double click space' },
                ].map(item => (
                  <div key={item.label} className="gp-tutorial-item">
                    <span className="gp-tutorial-icon">{item.icon}</span>
                    <div className="gp-tutorial-text">
                      <strong>{item.label}</strong>
                      <span>{item.hint}</span>
                    </div>
                  </div>
                ))}
              </div>

              <motion.button
                className="gp-tutorial-btn btn-primary"
                onClick={() => setShowTutorial(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <ChevronRight size={16} /> Explore the Globe
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Command Palette (Globe-scoped fallback) ────── */}
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  )
}
