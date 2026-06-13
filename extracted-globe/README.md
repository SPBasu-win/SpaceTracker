# Extracted 3D Globe

This folder contains the reusable Satlas globe implementation copied from `apps/web`.

## Contents

- `src/globe/`: Three.js globe engine, Earth/cloud/atmosphere/sun/star meshes, satellite meshes, country/map overlays, shaders, and search utilities.
- `src/workers/propagator.worker.ts`: Web Worker that propagates TLEs into live satellite positions with `satellite.js`.
- `src/hooks/useGlobe.ts`: React integration hook that mounts `Globe` into a container element and exposes controls/callbacks.
- `src/lib/celestrak.ts`: TLE catalog and ISS TLE fetch/cache helpers.
- `src/lib/satcat.ts`: Satellite metadata fetch/cache helpers.
- `src/lib/solar.ts`: Sun direction helper used for Earth lighting.
- `src/types/chat.ts`: Minimal shared directive types referenced by `useGlobe`.
- `public/textures/`: Earth day/night/specular/normal/cloud textures used by the globe.
- `public/data/countries-50m.json`: Country GeoJSON used by border/map mode.
- `API_INVENTORY.md`: APIs/endpoints and propagation/geospatial library calls used by the satellite simulation.

## Main Entry Points

Use `src/globe/Globe.ts` directly if the target project is not React.

Use `src/hooks/useGlobe.ts` if the target project is React and you want the same mount/unmount, resize, hover, selection, filtering, time-scale, and callback behavior as Satlas.

The original UI wrapper is `apps/web/src/components/GlobeView.tsx`. It was not copied here because it includes Satlas-specific overlay controls, routing, agent directives, and styling. Copy it separately only if the other project also wants the full Satlas UI.

## Required Runtime Dependencies

The globe code expects these packages:

```json
{
  "dependencies": {
    "d3-geo": "^3.1.1",
    "earcut": "^3.0.2",
    "satellite.js": "^4.1.4",
    "three": "^0.184.0"
  }
}
```

For `useGlobe.ts`, the target app also needs React.

## Static Asset Paths

The mesh classes load assets from absolute public paths:

- `/textures/earth-day.jpg`
- `/textures/earth-night.jpg`
- `/textures/earth-specular.jpg`
- `/textures/earth-normal.jpg`
- `/textures/earth-clouds.jpg`
- `/data/countries-50m.json`

In a Vite/React app, copy `public/textures` and `public/data` into the target app's public directory.

## Catalog Configuration

`src/lib/celestrak.ts` reads TLE data from:

- `import.meta.env.VITE_CATALOG_URL`, when set
- otherwise `/api/tles`
- fallback: `https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=TLE`

`src/lib/satcat.ts` reads metadata from:

- the same CloudFront base as `VITE_CATALOG_URL`, replacing `/catalog.tle` with `/satcat.json`
- otherwise `https://dgsll6twimcwl.cloudfront.net/satcat.json`

If the target project does not provide Satlas API routes, set `VITE_CATALOG_URL` to a hosted `catalog.tle` file or keep the CelesTrak fallback with the smaller active catalog.
