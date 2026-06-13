import { Star } from 'lucide-react'
import { CesiumGlobe } from '../components/CesiumGlobe'
import { useGlobeStore } from '../stores/globeStore'
import { useTrackingStore } from '../stores/trackingStore'
import { formatNumber } from '../utils/format'

export function GlobePage() {
  const selected = useGlobeStore((state) => state.selected)
  const add = useTrackingStore((state) => state.add)

  return (
    <div className="globe-page">
      <CesiumGlobe />
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
