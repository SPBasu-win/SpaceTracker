import { useEffect, useRef, useState } from 'react'
import { MapPin, Satellite, Globe2, Star, Clock, X, Loader2, LocateFixed, Search } from 'lucide-react'
import { useGlobeStore } from '../stores/globeStore'
import { apiClient } from '../api/client'
import { geocodeLocation } from '../api/aiApi'
import type { PassPrediction } from '../types/orbital'
import './ZenithPanel.css'

type OverheadSat = {
  asset: { catalogNumber: number; displayName: string | null; internationalDesignator: string }
  elevation: number
  azimuth: number
  altitudeKm: number
}
type SkyBody = { name: string; altitude: number; azimuth: number; distanceKm?: number; illumination?: number; phaseName?: string; visible: boolean }

function countdown(isoTime: string) {
  const diff = new Date(isoTime).getTime() - Date.now()
  if (diff <= 0) return 'Now'
  const m = Math.floor(diff / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return `${m}m ${s}s`
}

function azDir(deg: number) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

export function ZenithPanel() {
  const pinnedLocation = useGlobeStore((s) => s.pinnedLocation)
  const setPinnedLocation = useGlobeStore((s) => s.setPinnedLocation)
  const setFlyToLocation = useGlobeStore((s) => s.setFlyToLocation)

  const [sats, setSats] = useState<OverheadSat[]>([])
  const [bodies, setBodies] = useState<SkyBody[]>([])
  const [issPass, setIssPass] = useState<PassPrediction | null>(null)
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchError, setSearchError] = useState('')
  const [tick, setTick] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!pinnedLocation) { setSats([]); setBodies([]); setIssPass(null); return }
    const { latitude, longitude } = pinnedLocation
    setLoading(true)
    Promise.all([
      apiClient.get('/overhead', { params: { latitude, longitude } }),
      apiClient.get('/sky/overhead', { params: { latitude, longitude } }),
      apiClient.get('/assets/25544/passes', { params: { latitude, longitude, hoursAhead: 6 } }),
    ]).then(([satRes, skyRes, passRes]) => {
      setSats((satRes.data as OverheadSat[]).slice(0, 8))
      setBodies((skyRes.data.bodies as SkyBody[]).filter((b: SkyBody) => b.visible))
      const passes = passRes.data as PassPrediction[]
      setIssPass(passes.find((p) => new Date(p.acquisitionTime) > new Date()) ?? null)
    }).catch(console.warn).finally(() => setLoading(false))
  }, [pinnedLocation])

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])
  void tick

  const useMyLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setPinnedLocation({ latitude, longitude })
        setFlyToLocation({ latitude, longitude, label: 'My Location' })
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 8000 }
    )
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearchError('')
    setSearching(true)
    try {
      const result = await geocodeLocation(searchQuery.trim())
      setPinnedLocation({ latitude: result.latitude, longitude: result.longitude })
      setFlyToLocation({ latitude: result.latitude, longitude: result.longitude, label: result.displayName })
      setSearchQuery('')
    } catch {
      setSearchError('Location not found')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="zenith-panel">
      {/* Location controls */}
      <div className="zenith-controls">
        <form className="zenith-search-form" onSubmit={handleSearch}>
          <div className="zenith-search-wrap">
            <Search size={13} className="zenith-search-icon" />
            <input
              ref={inputRef}
              className="zenith-search-input"
              placeholder="Search location…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchError('') }}
              disabled={searching}
            />
            {searching && <Loader2 size={13} className="zenith-spin zenith-search-spinner" />}
          </div>
          {searchError && <span className="zenith-search-error">{searchError}</span>}
        </form>
        <button
          className="zenith-locate-btn"
          onClick={useMyLocation}
          disabled={locating}
          title="Use my current location"
        >
          {locating ? <Loader2 size={14} className="zenith-spin" /> : <LocateFixed size={14} />}
          {locating ? 'Locating…' : 'My Location'}
        </button>
      </div>

      {!pinnedLocation && (
        <div className="zenith-empty-hint">
          <MapPin size={22} className="zenith-pin-icon" />
          <p>Click the globe, search a city, or use your location</p>
        </div>
      )}

      {pinnedLocation && (
        <>
          <div className="zenith-panel-header">
            <div className="zenith-coords">
              <MapPin size={13} />
              <span>{pinnedLocation.latitude.toFixed(3)}°, {pinnedLocation.longitude.toFixed(3)}°</span>
            </div>
            <button className="zenith-close" onClick={() => setPinnedLocation(null)} title="Clear pin">
              <X size={14} />
            </button>
          </div>

          {loading && (
            <div className="zenith-loading">
              <Loader2 size={15} className="zenith-spin" /> Scanning zenith…
            </div>
          )}

          {!loading && (
            <>
              {issPass && (
                <div className="zenith-iss-pass">
                  <div className="zenith-section-title"><Satellite size={13} /> ISS next pass</div>
                  <div className="zenith-iss-row">
                    <span className="zenith-iss-countdown">{countdown(issPass.acquisitionTime)}</span>
                    <span className="zenith-iss-meta">peak {issPass.maxElevation?.toFixed(0) ?? '—'}° el</span>
                  </div>
                </div>
              )}

              <div className="zenith-section">
                <div className="zenith-section-title"><Globe2 size={13} /> Overhead satellites ({sats.length})</div>
                {sats.length === 0 && <p className="zenith-empty">None above horizon right now</p>}
                {sats.map((s) => (
                  <div key={s.asset.catalogNumber} className="zenith-sat-row">
                    <span className="zenith-sat-name">{s.asset.displayName ?? s.asset.internationalDesignator}</span>
                    <span className="zenith-sat-el">{s.elevation?.toFixed(0) ?? '—'}° el</span>
                  </div>
                ))}
              </div>

              <div className="zenith-section">
                <div className="zenith-section-title"><Star size={13} /> Sky bodies</div>
                {bodies.length === 0 && <p className="zenith-empty">No bodies above horizon</p>}
                {bodies.map((b) => (
                  <div key={b.name} className="zenith-body-row">
                    <span className="zenith-body-name">{b.name}</span>
                    <span className="zenith-body-pos">
                      {b.altitude.toFixed(0)}° · {azDir(b.azimuth)} ({b.azimuth.toFixed(0)}°)
                    </span>
                    {b.phaseName && <span className="zenith-body-phase">{b.phaseName}</span>}
                  </div>
                ))}
              </div>

              <div className="zenith-footer">
                <Clock size={11} /> Live · updates on pin change
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
