import { Body, Observer, Equator, Horizon, MoonPhase, Illumination } from 'astronomy-engine'
import type { SkyBody } from '../types/celestial'

/**
 * Client-side sky computation + azimuthal projection for the Zenith Sky Map.
 *
 * Uses the same astronomy-engine library as the server so the in-browser sky
 * map can redraw smoothly (no API round-trip per frame). The projection is an
 * azimuthal-equidistant "fish-eye" centred on the observer's zenith: the centre
 * is straight up (altitude 90 deg), the outer ring is the horizon (altitude 0).
 */

const AU_KM = 149_597_870.7

const BODY_COLORS: Record<string, string> = {
  Sun: '#ffd166',
  Moon: '#e6edf3',
  Mercury: '#b0a18f',
  Venus: '#f4e2b8',
  Mars: '#e07a5f',
  Jupiter: '#d9a066',
  Saturn: '#e3c98b',
  Uranus: '#8fd3d8',
  Neptune: '#6c8cff',
}

const PLANETS: { name: string; body: Body }[] = [
  { name: 'Mercury', body: Body.Mercury },
  { name: 'Venus', body: Body.Venus },
  { name: 'Mars', body: Body.Mars },
  { name: 'Jupiter', body: Body.Jupiter },
  { name: 'Saturn', body: Body.Saturn },
  { name: 'Uranus', body: Body.Uranus },
  { name: 'Neptune', body: Body.Neptune },
]

export function moonPhaseName(angle: number): string {
  if (angle < 22.5 || angle >= 337.5) return 'New Moon'
  if (angle < 67.5) return 'Waxing Crescent'
  if (angle < 112.5) return 'First Quarter'
  if (angle < 157.5) return 'Waxing Gibbous'
  if (angle < 202.5) return 'Full Moon'
  if (angle < 247.5) return 'Waning Gibbous'
  if (angle < 292.5) return 'Last Quarter'
  return 'Waning Crescent'
}

function computeBody(name: string, body: Body, obs: Observer, at: Date): SkyBody {
  const equ = Equator(body, at, obs, true, true)
  const hor = Horizon(at, obs, equ.ra, equ.dec, 'normal')
  const sky: SkyBody = {
    name,
    kind: body === Body.Sun ? 'star' : body === Body.Moon ? 'moon' : 'planet',
    altitude: hor.altitude,
    azimuth: hor.azimuth,
    distanceKm: equ.dist * AU_KM,
    color: BODY_COLORS[name] ?? '#ffffff',
  }
  if (body !== Body.Sun) {
    try {
      sky.illumination = Illumination(body, at).phase_fraction
    } catch {
      /* not available for some bodies */
    }
  }
  if (body === Body.Moon) {
    const phase = MoonPhase(at)
    sky.phaseAngle = phase
    sky.phaseName = moonPhaseName(phase)
  }
  return sky
}

/** Compute the Sun, Moon and planets for an observer at a given time. */
export function computeSkyBodies(
  observer: { latitude: number; longitude: number },
  at: Date = new Date()
): SkyBody[] {
  const obs = new Observer(observer.latitude, observer.longitude, 0)
  const bodies: SkyBody[] = [
    computeBody('Sun', Body.Sun, obs, at),
    computeBody('Moon', Body.Moon, obs, at),
    ...PLANETS.map((p) => computeBody(p.name, p.body, obs, at)),
  ]
  return bodies
}

export interface ProjectedPoint {
  x: number
  y: number
  /** True when the point is above the horizon and should be drawn. */
  onChart: boolean
}

/**
 * Project an altitude/azimuth pair onto the sky-map disc.
 * @param cx centre x   @param cy centre y   @param radius horizon radius (px)
 * North is up, East is to the right (geographic compass rose).
 */
export function altAzToXY(
  altitude: number,
  azimuth: number,
  cx: number,
  cy: number,
  radius: number
): ProjectedPoint {
  const r = radius * (1 - altitude / 90)
  const a = (azimuth * Math.PI) / 180
  return {
    x: cx + r * Math.sin(a),
    y: cy - r * Math.cos(a),
    onChart: altitude > 0,
  }
}

/** The four cardinal compass labels and their positions on the horizon ring. */
export function compassPoints(cx: number, cy: number, radius: number) {
  return [
    { label: 'N', ...edge(0, cx, cy, radius) },
    { label: 'E', ...edge(90, cx, cy, radius) },
    { label: 'S', ...edge(180, cx, cy, radius) },
    { label: 'W', ...edge(270, cx, cy, radius) },
  ]
}

function edge(azimuth: number, cx: number, cy: number, radius: number) {
  const a = (azimuth * Math.PI) / 180
  return { x: cx + radius * Math.sin(a), y: cy - radius * Math.cos(a) }
}

/** Altitude rings (e.g. 30 and 60 degrees) as radii for drawing reference circles. */
export function altitudeRingRadius(altitude: number, radius: number): number {
  return radius * (1 - altitude / 90)
}
