import { useEffect, useMemo, useState } from 'react'
import { X, Compass, MessageSquare, ArrowUp, ArrowDown } from 'lucide-react'
import { useGlobeStore } from '../stores/globeStore'
import { useObserverStore } from '../stores/observerStore'
import { useSkyStore } from '../stores/skyStore'
import { useChatStore } from '../stores/chatStore'
import { computeSkyBody } from '../utils/skyProjection'
import { formatNumber } from '../utils/format'
import './PlanetContextCard.css'

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
function compass(azimuth: number): string {
  return COMPASS[Math.round((azimuth % 360) / 22.5) % 16]
}

/**
 * Project Zenith context card for a celestial body (planet / Moon / Sun).
 * Opened by clicking a #planet-NAME link in an AI reply or a body on the Sky Map.
 * Computes the live sky position client-side via astronomy-engine.
 */
export function PlanetContextCard() {
  const activePlanet = useGlobeStore((s) => s.activePlanet)
  const setActivePlanet = useGlobeStore((s) => s.setActivePlanet)
  const { latitude, longitude } = useObserverStore()
  const setViewMode = useSkyStore((s) => s.setViewMode)
  const { setIsOpen, sendMessage } = useChatStore()

  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!activePlanet) return
    const id = setInterval(() => setNow(new Date()), 5000)
    return () => clearInterval(id)
  }, [activePlanet])

  const body = useMemo(() => {
    if (!activePlanet || latitude == null || longitude == null) return null
    return computeSkyBody(activePlanet, { latitude, longitude }, now)
  }, [activePlanet, latitude, longitude, now])

  if (!activePlanet) return null

  const askAi = () => {
    setIsOpen(true)
    void sendMessage(`Tell me about ${activePlanet} and when it is best visible from my location tonight.`)
  }

  const viewOnSkyMap = () => {
    setViewMode('skymap')
    setActivePlanet(null)
  }

  return (
    <aside className="planet-card">
      <div className="planet-card-head">
        <h2>{activePlanet}</h2>
        <button className="planet-card-close" onClick={() => setActivePlanet(null)} title="Close">
          <X size={18} />
        </button>
      </div>

      {latitude == null || longitude == null ? (
        <p className="planet-card-note">Set your location to compute the live sky position.</p>
      ) : !body ? (
        <p className="planet-card-note">No ephemeris available for “{activePlanet}”.</p>
      ) : (
        <>
          <div className={`planet-visibility ${body.altitude > 0 ? 'up' : 'down'}`}>
            {body.altitude > 0 ? (
              <><ArrowUp size={14} /> Above the horizon</>
            ) : (
              <><ArrowDown size={14} /> Below the horizon</>
            )}
          </div>
          <dl className="planet-card-stats">
            <dt>Altitude</dt><dd>{formatNumber(body.altitude, 1)}°</dd>
            <dt>Azimuth</dt><dd>{formatNumber(body.azimuth, 1)}° ({compass(body.azimuth)})</dd>
            <dt>Distance</dt><dd>{formatNumber(body.distanceKm, 0)} km</dd>
            {body.illumination != null && (
              <><dt>Illumination</dt><dd>{Math.round(body.illumination * 100)}%</dd></>
            )}
            {body.phaseName && (
              <><dt>Phase</dt><dd>{body.phaseName}</dd></>
            )}
          </dl>
          <div className="planet-card-actions">
            <button onClick={viewOnSkyMap}><Compass size={15} /> View on Sky Map</button>
            <button onClick={askAi}><MessageSquare size={15} /> Ask the AI</button>
          </div>
        </>
      )}
    </aside>
  )
}
