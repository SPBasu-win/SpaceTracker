import { useEffect, useMemo, useRef, useState } from 'react'
import { useObserverStore } from '../stores/observerStore'
import { useSkyStore } from '../stores/skyStore'
import { useGlobeStore } from '../stores/globeStore'
import { getOverhead } from '../api/orbitalApi'
import {
  computeSkyBodies,
  altAzToXY,
  compassPoints,
  altitudeRingRadius,
} from '../utils/skyProjection'
import type { SkyBody, OverheadSatellite } from '../types/celestial'
import './SkyMapCanvas.css'

const SIZE = 640
const CX = SIZE / 2
const CY = SIZE / 2
const RADIUS = SIZE / 2 - 36
// Project Zenith Phase 4 polish: redraw the sky at ~2fps to keep motion smooth
// without burning CPU recomputing ephemerides every animation frame.
const REDRAW_MS = 500
const OVERHEAD_REFRESH_MS = 30_000

const ASSET_COLORS: Record<string, string> = {
  DEBRIS: '#f08080',
  NAVIGATION: '#9ae66e',
  COMMUNICATION: '#56d4dd',
  WEATHER: '#ffd166',
  EARTH_OBSERVATION: '#ffd166',
  CREWED: '#ff7ad9',
}

function colorForAsset(assetClass: string): string {
  return ASSET_COLORS[assetClass] ?? '#cdd6f4'
}

/** A small SVG that renders the Moon's illuminated fraction as a phase disc. */
function MoonGlyph({ x, y, illumination = 0.5 }: { x: number; y: number; illumination?: number }) {
  const r = 9
  // Terminator offset: 0 illum -> fully dark, 1 -> fully lit.
  const k = Math.max(0, Math.min(1, illumination))
  const offset = (1 - 2 * k) * r
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#3a3f5a" stroke="#e6edf3" strokeWidth={0.75} />
      <clipPath id={`moonclip-${x}-${y}`}>
        <circle cx={x} cy={y} r={r} />
      </clipPath>
      <ellipse
        cx={x + offset / 2}
        cy={y}
        rx={Math.abs(r - Math.abs(offset) / 2)}
        ry={r}
        fill="#e6edf3"
        clipPath={`url(#moonclip-${x}-${y})`}
      />
    </g>
  )
}

export function SkyMapCanvas() {
  const { latitude, longitude } = useObserverStore()
  const showSatellites = useSkyStore((s) => s.showSatellites)
  const showPlanets = useSkyStore((s) => s.showPlanets)
  const setActivePlanet = useGlobeStore((s) => s.setActivePlanet)

  const [now, setNow] = useState(() => new Date())
  const [overhead, setOverhead] = useState<OverheadSatellite[]>([])
  const [hovered, setHovered] = useState<string | null>(null)
  const overheadRef = useRef<OverheadSatellite[]>([])

  // ~2fps redraw tick
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), REDRAW_MS)
    return () => clearInterval(id)
  }, [])

  // Periodically refresh overhead satellites from the server (alt/az propagation).
  useEffect(() => {
    if (latitude == null || longitude == null) return
    let cancelled = false
    const load = async () => {
      try {
        const data = (await getOverhead(latitude, longitude)) as Array<{
          asset: { catalogNumber: number; displayName: string | null; assetClass: string }
          azimuth: number
          elevation: number
          rangeKm: number
        }>
        if (cancelled) return
        const mapped: OverheadSatellite[] = data.map((d) => ({
          catalogNumber: d.asset.catalogNumber,
          name: d.asset.displayName,
          assetClass: d.asset.assetClass,
          elevation: d.elevation,
          azimuth: d.azimuth,
          rangeKm: d.rangeKm,
        }))
        overheadRef.current = mapped
        setOverhead(mapped)
      } catch {
        /* keep last known set */
      }
    }
    void load()
    const id = setInterval(load, OVERHEAD_REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [latitude, longitude])

  // Memoise ephemeris so it only recomputes when the redraw tick or location changes.
  const bodies = useMemo<SkyBody[]>(() => {
    if (latitude == null || longitude == null) return []
    return computeSkyBodies({ latitude, longitude }, now)
  }, [latitude, longitude, now])

  const ringR30 = altitudeRingRadius(30, RADIUS)
  const ringR60 = altitudeRingRadius(60, RADIUS)
  const compass = compassPoints(CX, CY, RADIUS)

  if (latitude == null || longitude == null) {
    return (
      <div className="sky-map-empty">
        <p>Set your location to see what's above you.</p>
      </div>
    )
  }

  const visibleBodies = bodies.filter((b) => b.altitude > 0)
  const visibleSats = overhead.filter((s) => s.elevation > 0)

  return (
    <div className="sky-map">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="sky-map-svg" role="img" aria-label="Sky map of objects overhead">
        {/* Sky disc */}
        <defs>
          <radialGradient id="skyGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0c1733" />
            <stop offset="100%" stopColor="#070b12" />
          </radialGradient>
        </defs>
        <circle cx={CX} cy={CY} r={RADIUS} fill="url(#skyGradient)" stroke="#1a2a3d" strokeWidth={1.5} />

        {/* Altitude reference rings */}
        <circle cx={CX} cy={CY} r={ringR60} fill="none" stroke="#1a2a3d" strokeDasharray="3 4" />
        <circle cx={CX} cy={CY} r={ringR30} fill="none" stroke="#1a2a3d" strokeDasharray="3 4" />
        <circle cx={CX} cy={CY} r={2} fill="#7aa2f7" />
        <text x={CX + 6} y={CY - 4} className="sky-zenith-label">zenith</text>

        {/* Cross-hair to cardinal points */}
        <line x1={CX} y1={CY - RADIUS} x2={CX} y2={CY + RADIUS} stroke="#16243a" />
        <line x1={CX - RADIUS} y1={CY} x2={CX + RADIUS} y2={CY} stroke="#16243a" />

        {/* Compass labels */}
        {compass.map((c) => (
          <text key={c.label} x={c.x} y={c.y} className="sky-compass-label" textAnchor="middle" dominantBaseline="middle">
            {c.label}
          </text>
        ))}

        {/* Overhead satellites */}
        {showSatellites &&
          visibleSats.map((s) => {
            const p = altAzToXY(s.elevation, s.azimuth, CX, CY, RADIUS)
            return (
              <circle
                key={`sat-${s.catalogNumber}`}
                cx={p.x}
                cy={p.y}
                r={hovered === `sat-${s.catalogNumber}` ? 4 : 2.4}
                fill={colorForAsset(s.assetClass)}
                opacity={0.9}
                onMouseEnter={() => setHovered(`sat-${s.catalogNumber}`)}
                onMouseLeave={() => setHovered(null)}
              >
                <title>{s.name ?? s.catalogNumber} — {s.elevation.toFixed(0)}° elev</title>
              </circle>
            )
          })}

        {/* Planets / Sun / Moon */}
        {showPlanets &&
          visibleBodies.map((b) => {
            const p = altAzToXY(b.altitude, b.azimuth, CX, CY, RADIUS)
            if (b.kind === 'moon') {
              return (
                <g
                  key={b.name}
                  className="sky-body"
                  onMouseEnter={() => setHovered(b.name)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setActivePlanet(b.name)}
                >
                  <MoonGlyph x={p.x} y={p.y} illumination={b.illumination} />
                  <text x={p.x + 12} y={p.y + 4} className="sky-body-label">{b.name}</text>
                  <title>{b.name} — {b.phaseName} ({Math.round((b.illumination ?? 0) * 100)}%)</title>
                </g>
              )
            }
            const isSun = b.kind === 'star'
            return (
              <g
                key={b.name}
                className="sky-body"
                onMouseEnter={() => setHovered(b.name)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setActivePlanet(b.name)}
              >
                <circle cx={p.x} cy={p.y} r={isSun ? 10 : hovered === b.name ? 7 : 5} fill={b.color}
                  stroke={isSun ? '#ffb703' : 'none'} strokeWidth={isSun ? 2 : 0} />
                <text x={p.x + 10} y={p.y + 4} className="sky-body-label">{b.name}</text>
                <title>{b.name} — {b.altitude.toFixed(0)}° altitude, {b.azimuth.toFixed(0)}° az</title>
              </g>
            )
          })}
      </svg>

      <div className="sky-map-legend">
        <span><i style={{ background: '#56d4dd' }} /> Comms</span>
        <span><i style={{ background: '#9ae66e' }} /> Nav</span>
        <span><i style={{ background: '#f08080' }} /> Debris</span>
        <span><i style={{ background: '#ffd166' }} /> Planets/Sun</span>
        <span className="sky-map-count">{visibleSats.length} sats · {visibleBodies.length} bodies up</span>
      </div>
    </div>
  )
}
