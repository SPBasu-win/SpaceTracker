import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Radio, MessageSquare, Rocket, X, LogOut } from 'lucide-react'
import { CesiumGlobe } from '../components/CesiumGlobe'
import { useHistoryStore } from '../stores/historyStore'
import { useGlobeStore, type GhostOrbit } from '../stores/globeStore'
import { useChatStore } from '../stores/chatStore'
import { useSkyStore } from '../stores/skyStore'
import type { HistoryMission } from '../types/history'
import './HistoryPage.css'

const ORBIT_COLORS = ['#7aa2f7', '#9ae66e', '#f08080', '#ffd166', '#56d4dd', '#ff7ad9']

function statusLabel(status: HistoryMission['status']): { text: string; cls: string } {
  if (status === 'active') return { text: 'Active', cls: 'active' }
  if (status === 'debris') return { text: 'Debris', cls: 'debris' }
  return { text: 'Deorbited', cls: 'deorbited' }
}

/** Animated counter that eases toward a target value. */
function useTicker(target: number, duration = 900): number {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)
  useEffect(() => {
    const from = fromRef.current
    const start = performance.now()
    let raf = 0
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(from + (target - from) * eased))
      if (p < 1) raf = requestAnimationFrame(step)
      else fromRef.current = target
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

export function HistoryPage() {
  const navigate = useNavigate()
  const { eras, eraIndex, setEraIndex, nextEra, prevEra, selectedMissionId, selectMission, missionsForEra } =
    useHistoryStore()
  const setFlyToLocation = useGlobeStore((s) => s.setFlyToLocation)
  const setHistoryMode = useGlobeStore((s) => s.setHistoryMode)
  const setHistoryOrbits = useGlobeStore((s) => s.setHistoryOrbits)
  const setTargetCatalogNumber = useGlobeStore((s) => s.setTargetCatalogNumber)
  const setViewMode = useSkyStore((s) => s.setViewMode)
  const { setIsOpen, sendMessage } = useChatStore()

  const era = eras[eraIndex]
  const missions = useMemo(() => missionsForEra(era.id), [era.id, missionsForEra])
  const selectedMission = missions.find((m) => m.id === selectedMissionId) ?? null
  const objectTicker = useTicker(era.objectsInOrbit)

  // Enter/leave history mode for the shared globe.
  useEffect(() => {
    setHistoryMode(true)
    setViewMode('globe')
    return () => {
      setHistoryMode(false)
      setHistoryOrbits([])
    }
  }, [setHistoryMode, setHistoryOrbits, setViewMode])

  // On era change: fly to the era focus and draw the era's ghost orbits.
  useEffect(() => {
    setFlyToLocation({ latitude: era.focus.latitude, longitude: era.focus.longitude, label: era.focus.label })
    const orbits: GhostOrbit[] = missions
      .filter((m) => m.orbit)
      .map((m, i) => ({
        id: m.id,
        inclinationDeg: m.orbit!.inclinationDeg,
        altitudeKm: m.orbit!.altitudeKm,
        raanDeg: m.orbit!.raanDeg,
        color: ORBIT_COLORS[i % ORBIT_COLORS.length],
      }))
    setHistoryOrbits(orbits)
  }, [era.id, missions, setFlyToLocation, setHistoryOrbits, era.focus])

  // Keyboard navigation between chapters.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowRight') nextEra()
      else if (e.key === 'ArrowLeft') prevEra()
      else if (e.key === 'Escape') navigate('/dashboard')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nextEra, prevEra])

  const flyToMission = (m: HistoryMission) => {
    selectMission(m.id)
    setFlyToLocation({
      latitude: m.launchSite.latitude,
      longitude: m.launchSite.longitude,
      label: m.launchSite.name,
    })
  }

  const trackLive = (m: HistoryMission) => {
    if (!m.noradId) return
    setHistoryMode(false)
    setHistoryOrbits([])
    setTargetCatalogNumber(m.noradId)
    navigate('/globe')
  }

  const askNarrator = (m?: HistoryMission) => {
    const context = `CURRENT ERA: ${era.name} (${era.period})\n${era.blurb}\nKey missions this era: ${missions
      .map((mm) => `${mm.name} (${mm.year}, ${mm.country})`)
      .join('; ')}.`
    setIsOpen(true)
    const q = m
      ? `Tell me the story of ${m.name} (${m.year}).`
      : `Give me a vivid overview of the ${era.name} era of spaceflight.`
    void sendMessage(q, context)
  }

  const progress = ((eraIndex + 1) / eras.length) * 100

  return (
    <div className="history-page">
      <CesiumGlobe />

      {/* Exit button */}
      <button className="history-exit-btn" onClick={() => navigate('/dashboard')} title="Exit History (Esc)">
        <LogOut size={16} /> Exit
      </button>

      {/* Satellite-count ticker */}
      <div className="history-ticker">
        <span className="history-ticker-value">{objectTicker.toLocaleString()}</span>
        <span className="history-ticker-label">tracked objects in orbit · {era.period}</span>
      </div>

      {/* Chapter side panel */}
      <aside className="history-panel">
        <div className="history-panel-head">
          <span className="history-kicker"><Rocket size={14} /> Space History Walkthrough</span>
          <div className="history-progress">
            <div className="history-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="history-progress-label">
            Chapter {eraIndex + 1} of {eras.length}
          </span>
        </div>

        <div className="history-era">
          <h1>{era.name}</h1>
          <span className="history-era-period">{era.period}</span>
          <p className="history-era-blurb">{era.blurb}</p>
        </div>

        <div className="history-missions">
          <h3>Missions</h3>
          {missions.map((m) => {
            const status = statusLabel(m.status)
            return (
              <button
                key={m.id}
                className={`history-mission-chip ${selectedMissionId === m.id ? 'selected' : ''}`}
                onClick={() => flyToMission(m)}
              >
                <span className="history-mission-name">{m.name}</span>
                <span className="history-mission-year">{m.year}</span>
                <span className={`history-status ${status.cls}`}>{status.text}</span>
              </button>
            )
          })}
        </div>

        <div className="history-nav">
          <button onClick={prevEra} disabled={eraIndex === 0}><ChevronLeft size={16} /> Prev</button>
          <button className="history-narrate" onClick={() => askNarrator()}>
            <MessageSquare size={15} /> Ask the narrator
          </button>
          <button onClick={nextEra} disabled={eraIndex === eras.length - 1}>Next <ChevronRight size={16} /></button>
        </div>

        <div className="history-era-dots">
          {eras.map((e, i) => (
            <button
              key={e.id}
              className={`history-dot ${i === eraIndex ? 'on' : ''}`}
              title={e.name}
              onClick={() => setEraIndex(i)}
            />
          ))}
        </div>
        <p className="history-hint">← → to navigate chapters · Esc to exit</p>
      </aside>

      {/* Mission detail card */}
      {selectedMission && (
        <aside className="history-mission-card">
          <div className="history-mission-card-head">
            <h2>{selectedMission.name}</h2>
            <button onClick={() => selectMission(null)} title="Close"><X size={18} /></button>
          </div>
          <span className={`history-status ${statusLabel(selectedMission.status).cls}`}>
            {statusLabel(selectedMission.status).text}
          </span>
          <dl className="history-mission-stats">
            <dt>Launched</dt><dd>{new Date(selectedMission.launchDate).toLocaleDateString()}</dd>
            <dt>Country</dt><dd>{selectedMission.country}</dd>
            <dt>Type</dt><dd>{selectedMission.type}</dd>
            <dt>Launch site</dt><dd>{selectedMission.launchSite.name}</dd>
            {selectedMission.orbit && (
              <>
                <dt>Inclination</dt><dd>{selectedMission.orbit.inclinationDeg}°</dd>
                <dt>Altitude</dt><dd>{selectedMission.orbit.altitudeKm.toLocaleString()} km</dd>
              </>
            )}
          </dl>
          <p className="history-mission-desc">{selectedMission.description}</p>
          <div className="history-mission-actions">
            {selectedMission.status === 'active' && selectedMission.noradId && (
              <button className="history-track-live" onClick={() => trackLive(selectedMission)}>
                <Radio size={15} /> Track Live
              </button>
            )}
            <button className="history-mission-ask" onClick={() => askNarrator(selectedMission)}>
              <MessageSquare size={15} /> Ask the narrator
            </button>
          </div>
        </aside>
      )}
    </div>
  )
}
