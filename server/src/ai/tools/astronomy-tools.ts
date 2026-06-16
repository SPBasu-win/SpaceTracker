import { SpaceTool } from './tool-registry.js';
import * as astronomyService from '../../services/astronomy.service.js';

/**
 * Project Zenith celestial-body AI tools. These complement the satellite tools
 * by letting the assistant answer planet/Moon/Sun visibility questions using
 * astronomy-engine ephemeris (no TLE / database lookup required).
 */

export const getSkyObjectsOverheadTool: SpaceTool = {
  name: 'get_sky_objects_overhead',
  description:
    'Get the Sun, Moon and all major planets currently in the sky for a location, with altitude (degrees above horizon), azimuth (compass bearing), distance and visibility. Use this for "what planets are visible right now", "is the Moon up", or "what is above me" questions.',
  parameters: {
    type: 'object',
    properties: {
      latitude: { type: 'number', description: 'Observer latitude in degrees' },
      longitude: { type: 'number', description: 'Observer longitude in degrees' },
      onlyVisible: { type: 'boolean', description: 'If true, only return bodies above the horizon (altitude > 0). Default false.' }
    },
    required: ['latitude', 'longitude']
  },
  handler: async (args: any) => {
    const bodies = astronomyService.getSkyOverhead(
      { latitude: args.latitude, longitude: args.longitude },
      new Date(),
      { onlyVisible: !!args.onlyVisible }
    );
    return {
      count: bodies.length,
      bodies: bodies.map((b) => ({
        name: b.name,
        kind: b.kind,
        altitudeDeg: b.altitude,
        azimuthDeg: b.azimuth,
        compass: compassFromAzimuth(b.azimuth),
        distanceKm: b.distanceKm,
        visible: b.visible,
        illumination: b.illumination,
        moonPhase: b.phaseName
      }))
    };
  }
};

export const getPlanetPositionTool: SpaceTool = {
  name: 'get_planet_position',
  description:
    'Get the precise sky position of a single celestial body (a planet, the Moon, or the Sun) for a location: altitude, azimuth, distance, visibility, illumination, and next rise/set times. Use this for "where is Mars right now" or "when does Jupiter rise" questions.',
  parameters: {
    type: 'object',
    properties: {
      body: { type: 'string', description: 'Body name: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, or Pluto' },
      latitude: { type: 'number', description: 'Observer latitude in degrees' },
      longitude: { type: 'number', description: 'Observer longitude in degrees' }
    },
    required: ['body', 'latitude', 'longitude']
  },
  handler: async (args: any) => {
    const observer = { latitude: args.latitude, longitude: args.longitude };
    const pos = astronomyService.getBodyPosition(String(args.body), observer);
    if (!pos) {
      return { error: `Unknown celestial body: ${args.body}. Try a planet name, Moon, or Sun.` };
    }
    const riseSet = astronomyService.getRiseSet(String(args.body), observer);
    return {
      name: pos.name,
      kind: pos.kind,
      altitudeDeg: pos.altitude,
      azimuthDeg: pos.azimuth,
      compass: compassFromAzimuth(pos.azimuth),
      distanceKm: pos.distanceKm,
      visible: pos.visible,
      illumination: pos.illumination,
      moonPhase: pos.phaseName,
      nextRise: riseSet.rise,
      nextSet: riseSet.set
    };
  }
};

function compassFromAzimuth(azimuth: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(((azimuth % 360) / 22.5)) % 16];
}
