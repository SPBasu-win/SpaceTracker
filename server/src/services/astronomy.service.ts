import { createRequire } from "node:module";

// astronomy-engine ships a dual CJS/ESM package whose named ESM exports are not
// reliably resolved by esbuild/tsx in dev. createRequire loads the CJS build,
// which exposes every symbol consistently in both `tsx` (dev) and `node` (prod).
// `typeof import(...)` preserves full type safety on the required module.
const require = createRequire(import.meta.url);
const Astronomy = require("astronomy-engine") as typeof import("astronomy-engine");
const { Body, Observer, Equator, Horizon, MoonPhase, Illumination, SearchRiseSet } = Astronomy;
type Body = import("astronomy-engine").Body;

/**
 * Astronomy Engine wrapper for Project Zenith.
 *
 * Computes alt/azimuth, distance, visibility and Moon-phase data for the Sun,
 * Moon and planets as seen from an observer on Earth. This sits alongside the
 * existing satellite.js orbital pipeline without modifying it — celestial body
 * positions are a separate concern from TLE propagation.
 */

export type SkyBodyKind = "star" | "moon" | "planet";

export interface SkyBodyPosition {
  name: string;
  kind: SkyBodyKind;
  /** Altitude above the horizon in degrees (refraction-corrected). */
  altitude: number;
  /** Azimuth in degrees, clockwise from true North (0=N, 90=E, 180=S, 270=W). */
  azimuth: number;
  /** Distance from the observer in kilometres. */
  distanceKm: number;
  /** Right ascension in hours (J2000-of-date). */
  ra: number;
  /** Declination in degrees. */
  dec: number;
  /** True when the body is above the horizon (altitude > 0). */
  visible: boolean;
  /** Illuminated fraction (0..1) — meaningful for the Moon and planets. */
  illumination?: number;
  /** Moon phase angle in degrees (0=new, 90=first quarter, 180=full). */
  phaseAngle?: number;
  /** Human readable Moon phase label. */
  phaseName?: string;
  timestamp: string;
}

const PLANETS: { name: string; body: Body }[] = [
  { name: "Mercury", body: Body.Mercury },
  { name: "Venus", body: Body.Venus },
  { name: "Mars", body: Body.Mars },
  { name: "Jupiter", body: Body.Jupiter },
  { name: "Saturn", body: Body.Saturn },
  { name: "Uranus", body: Body.Uranus },
  { name: "Neptune", body: Body.Neptune },
];

const AU_KM = 149_597_870.7;

function bodyKind(body: Body): SkyBodyKind {
  if (body === Body.Sun) return "star";
  if (body === Body.Moon) return "moon";
  return "planet";
}

export function moonPhaseName(angle: number): string {
  // angle: 0=new, 90=first quarter, 180=full, 270=last quarter
  if (angle < 22.5 || angle >= 337.5) return "New Moon";
  if (angle < 67.5) return "Waxing Crescent";
  if (angle < 112.5) return "First Quarter";
  if (angle < 157.5) return "Waxing Gibbous";
  if (angle < 202.5) return "Full Moon";
  if (angle < 247.5) return "Waning Gibbous";
  if (angle < 292.5) return "Last Quarter";
  return "Waning Crescent";
}

/** Compute the sky position of a single named body. */
export function getBodyPosition(
  name: string,
  observer: { latitude: number; longitude: number; height?: number },
  at: Date = new Date()
): SkyBodyPosition | null {
  const body = resolveBody(name);
  if (body === null) return null;

  const obs = new Observer(observer.latitude, observer.longitude, observer.height ?? 0);

  // Equator-of-date coordinates with aberration, then horizontal alt/az.
  const equ = Equator(body, at, obs, true, true);
  const hor = Horizon(at, obs, equ.ra, equ.dec, "normal");

  const distanceKm = equ.dist * AU_KM;
  const kind = bodyKind(body);

  const result: SkyBodyPosition = {
    name,
    kind,
    altitude: round(hor.altitude, 3),
    azimuth: round(hor.azimuth, 3),
    distanceKm: round(distanceKm, 1),
    ra: round(equ.ra, 4),
    dec: round(equ.dec, 4),
    visible: hor.altitude > 0,
    timestamp: at.toISOString(),
  };

  if (body !== Body.Sun) {
    try {
      const illum = Illumination(body, at);
      result.illumination = round(illum.phase_fraction, 3);
    } catch {
      /* illumination undefined for some bodies */
    }
  }

  if (body === Body.Moon) {
    const phase = MoonPhase(at);
    result.phaseAngle = round(phase, 2);
    result.phaseName = moonPhaseName(phase);
  }

  return result;
}

/** All solar-system bodies (Sun, Moon, planets) for an observer. */
export function getSkyOverhead(
  observer: { latitude: number; longitude: number; height?: number },
  at: Date = new Date(),
  options: { onlyVisible?: boolean } = {}
): SkyBodyPosition[] {
  const bodies = [
    { name: "Sun", body: Body.Sun },
    { name: "Moon", body: Body.Moon },
    ...PLANETS,
  ];

  const out: SkyBodyPosition[] = [];
  for (const { name } of bodies) {
    const pos = getBodyPosition(name, observer, at);
    if (!pos) continue;
    if (options.onlyVisible && !pos.visible) continue;
    out.push(pos);
  }
  return out.sort((a, b) => b.altitude - a.altitude);
}

/** Next rise and set times for a body relative to `at`. */
export function getRiseSet(
  name: string,
  observer: { latitude: number; longitude: number; height?: number },
  at: Date = new Date()
): { rise: string | null; set: string | null } {
  const body = resolveBody(name);
  if (body === null) return { rise: null, set: null };
  const obs = new Observer(observer.latitude, observer.longitude, observer.height ?? 0);
  const rise = SearchRiseSet(body, obs, +1, at, 1);
  const set = SearchRiseSet(body, obs, -1, at, 1);
  return {
    rise: rise ? rise.date.toISOString() : null,
    set: set ? set.date.toISOString() : null,
  };
}

export function resolveBody(name: string): Body | null {
  const key = name.trim().toLowerCase();
  const map: Record<string, Body> = {
    sun: Body.Sun,
    moon: Body.Moon,
    mercury: Body.Mercury,
    venus: Body.Venus,
    mars: Body.Mars,
    jupiter: Body.Jupiter,
    saturn: Body.Saturn,
    uranus: Body.Uranus,
    neptune: Body.Neptune,
    pluto: Body.Pluto,
  };
  return map[key] ?? null;
}

function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}
