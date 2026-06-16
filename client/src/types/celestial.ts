export type SkyBodyKind = 'star' | 'moon' | 'planet'

export interface SkyBody {
  name: string
  kind: SkyBodyKind
  /** Altitude above the horizon, degrees (negative = below horizon). */
  altitude: number
  /** Azimuth, degrees clockwise from true North. */
  azimuth: number
  /** Distance from the observer, km. */
  distanceKm: number
  /** Illuminated fraction 0..1 (Moon / planets). */
  illumination?: number
  /** Moon phase angle, degrees (0=new, 180=full). */
  phaseAngle?: number
  phaseName?: string
  /** Display colour for the sky map marker. */
  color: string
}

/** A satellite currently overhead, as returned by /api/overhead. */
export interface OverheadSatellite {
  catalogNumber: number
  name: string | null
  assetClass: string
  elevation: number
  azimuth: number
  rangeKm: number
}
