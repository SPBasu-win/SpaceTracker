# Satellite And Geospatial API Inventory

This inventory covers the APIs/endpoints and library calls used by Satlas to simulate satellites, calculate live positions, and place them on the globe/map.

## Browser/Globe Data Endpoints

| API | Used in | Purpose | Notes |
| --- | --- | --- | --- |
| `GET /api/tles` | `src/lib/celestrak.ts` | Primary browser TLE catalog fetch for the globe. | Vercel rewrite alias to `/api/catalog`; chosen to avoid ad-blocker false positives on "catalog". |
| `GET /api/catalog` | `api/catalog.ts`, public API | Full 3-line TLE catalog text. | Proxies CloudFront `catalog.tle`; edge cached with `s-maxage=7200`. |
| `GET https://dgsll6twimcwl.cloudfront.net/catalog.tle` | `api/catalog.ts`, `api/pass.ts`, `api/overhead.ts`, `api/satellite-info.ts`, `api/satellites.ts`, `api/chat.ts` | Cached full TLE catalog, written by the orbital worker from Space-Track. | Also configurable through `CLOUDFRONT_CATALOG`. |
| `GET https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=TLE` | `src/lib/celestrak.ts` | Browser fallback TLE source for active satellites. | Smaller than the full Space-Track-backed catalog. |
| `GET https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE` | `src/lib/celestrak.ts`, `apps/orbital/satellites.py` | Fresh ISS TLE by NORAD catalog number. | Used so the ISS marker stays current even if the larger catalog is stale. |
| `GET https://dgsll6twimcwl.cloudfront.net/satcat.json` | `src/lib/satcat.ts` | Satellite metadata: object type, owner, launch date/site, decay/tracked status. | Base can be derived from `VITE_CATALOG_URL`. |
| `GET /data/countries-50m.json` | `src/globe/Globe.ts` | Country GeoJSON for map/border mode and country picking. | Static public asset included in this extracted folder. |

## Public Satlas API Routes

| API | Source file | Purpose | Key parameters |
| --- | --- | --- | --- |
| `GET /api/catalog` | `api/catalog.ts` | Returns the full TLE catalog as text. | None. |
| `GET /api/tles` | `vercel.json` rewrite | Alias to `/api/catalog`. | None. |
| `GET /api/satellite-info` | `api/satellite-info.ts` | Current sub-satellite lat/lon, altitude, velocity, period, and inclination for one satellite. | `query` as NORAD ID or name substring. |
| `GET /api/satellites` | `api/satellites.ts` | Search catalog by name/NORAD/category. | `q`, `category`, `limit`. |
| `GET /api/overhead` | `api/overhead.ts` | Satellites currently above a ground location, sorted by elevation. | `latitude`, `longitude`, `min_elevation`, `category`, `limit`. |
| `GET /api/pass` | `api/pass.ts` | Upcoming visible passes over a ground location. | `norad_id`, `latitude`, `longitude`, `hours_ahead`. |
| `POST /api/chat` | `api/chat.ts` | AI assistant route that can call orbital tools and emit globe directives. | JSON body: `message`, optional `history`, `shownCategories`, `categoryCounts`. |

## Orbital Service APIs

| API | Source | Purpose |
| --- | --- | --- |
| `GET https://api.satlas.app/health` | `apps/orbital/main.py` | Health check for the FastAPI orbital service. |
| `GET https://api.satlas.app/predict-passes` | `apps/orbital/main.py`, called by `api/pass.ts` | Pass prediction using the orbital service. Accepts observer location and either explicit `tle1`/`tle2` or a catalog lookup. |
| `GET https://api.satlas.app/satellite-info` | `apps/orbital/main.py` | Satellite info lookup in the Python service. |
| `GET https://api.satlas.app/satellites-overhead` | `apps/orbital/main.py` | Overhead satellite lookup in the Python service. |

## External Source APIs Used By The Backend Worker

| API | Source file | Purpose |
| --- | --- | --- |
| Space-Track GP catalog query | `apps/orbital/satellites.py` | Authoritative full TLE catalog bootstrap and hourly delta updates. Requires Space-Track credentials. |
| Space-Track SATCAT query | `apps/orbital/satellites.py` | Daily satellite metadata refresh. Requires Space-Track credentials. |
| AWS S3 object APIs | `apps/orbital/satellites.py` | Writes and reads `catalog.tle` and `satcat.json`. |
| CloudFront distribution | `api/*.ts`, `src/lib/*.ts` | Public cached delivery layer for `catalog.tle` and `satcat.json`. |

## Propagation And Positioning Library APIs

These are not HTTP APIs, but they are the core API calls that simulate satellites and convert positions for the map/globe.

| Library API | Used in | Purpose |
| --- | --- | --- |
| `satellite.twoline2satrec(tle1, tle2)` | `src/globe/Globe.ts`, `src/globe/SatelliteMesh.ts`, `src/workers/propagator.worker.ts`, `api/*.ts` | Parse TLE lines into an SGP4 satellite record. |
| `satellite.propagate(satrec, date)` | `src/globe/Globe.ts`, `src/globe/SatelliteMesh.ts`, `src/workers/propagator.worker.ts`, `api/*.ts` | Propagate orbit to an ECI position/velocity at a specific time. |
| `satellite.gstime(date)` | `src/globe/Globe.ts`, `api/*.ts` | Compute Greenwich mean sidereal time for Earth rotation and ECI/ECEF conversion. |
| `satellite.eciToGeodetic(position, gmst)` | `src/globe/Globe.ts`, `api/satellite-info.ts`, `api/chat.ts` | Convert ECI satellite position to latitude, longitude, and altitude. |
| `satellite.eciToEcf(position, gmst)` | `api/overhead.ts`, `api/chat.ts` | Convert ECI to Earth-centered fixed coordinates for observer look angles. |
| `satellite.ecfToLookAngles(observerGd, ecf)` | `api/overhead.ts`, `api/chat.ts` | Compute azimuth/elevation from an observer to a satellite. |
| `satellite.degreesToRadians(value)` | `api/overhead.ts`, `api/chat.ts` | Convert observer lat/lon into radians for `satellite.js`. |
| `satellite.degreesLat(value)` and `satellite.degreesLong(value)` | `api/satellite-info.ts`, `api/chat.ts` | Convert geodetic lat/lon radians back to degrees. |
| `geoContains(feature, [lon, lat])` from `d3-geo` | `src/globe/Globe.ts` | Determine which country polygon contains a clicked/hovered globe coordinate. |
| `earcut(...)` | `src/globe/CountryFillMesh.ts` | Triangulate country polygons for the map-mode fill mesh. |

## Globe-Side Position Flow

1. `fetchSatelliteCatalog()` loads TLE text and parses it into `{ name, norad_id, tle1, tle2 }` records.
2. `Globe.initCatalog()` sends the non-ISS records to `propagator.worker.ts`.
3. The worker creates `SatRec` objects with `twoline2satrec`.
4. Every tick, the worker calls `propagate` for each satellite and emits a packed `Float32Array` of ECI-derived world positions.
5. `Globe.tick()` computes `gmst`, rotates the Earth surface group by GMST, updates lighting from `getSunDirection`, updates the ISS, and applies worker positions to `SatelliteField`.
6. Country click/hover raycasts the Earth mesh, subtracts GMST to recover geographic longitude, then uses `geoContains` to identify the country.
