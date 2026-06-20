import { prisma } from "../lib/prisma.js";
import { deg2rad, normalizeLongitude, rad2deg, satellite } from "../lib/satellite.js";
import { getLatestTleByCatalogNumber, getClosestTleByCatalogNumber } from "./tle.service.js";
import * as astronomyService from "./astronomy.service.js";
const trackCache = new Map();
export async function listAssets(filters) {
    return prisma.orbitalAsset.findMany({
        where: {
            catalogNumber: filters.catalogNumber,
            assetClass: filters.assetClass,
            displayName: filters.search ? { contains: filters.search, mode: "insensitive" } : undefined,
        },
        orderBy: [{ updatedAt: "desc" }, { catalogNumber: "asc" }],
        take: 250,
    });
}
export async function getAssetByCatalogNumber(catalogNumber) {
    const asset = await prisma.orbitalAsset.findUnique({ where: { catalogNumber } });
    if (!asset)
        throw new Error("Satellite not found");
    return asset;
}
export async function getCurrentPosition(catalogNumber, at = new Date(), isHistorical = false) {
    const tleRes = isHistorical
        ? await getClosestTleByCatalogNumber(catalogNumber, at)
        : await getLatestTleByCatalogNumber(catalogNumber);
    if (!tleRes)
        throw new Error("No TLE available");
    const line1 = 'line1' in tleRes ? tleRes.line1 : tleRes.elementLine1;
    const line2 = 'line2' in tleRes ? tleRes.line2 : tleRes.elementLine2;
    const { satrec, position, velocity } = propagateTle(line1, line2, at);
    const gmst = satellite.gstime(at);
    const geo = satellite.eciToGeodetic(position, gmst);
    const velocityKmps = magnitude(velocity);
    return {
        catalogNumber: tleRes.catalogNumber,
        name: tleRes.name,
        latitude: satellite.degreesLat(geo.latitude),
        longitude: normalizeLongitude(satellite.degreesLong(geo.longitude)),
        altitudeKm: geo.height,
        velocityKmps,
        inclinationDeg: rad2deg(satrec.inclo),
        timestamp: at.toISOString(),
        // Add confidence scoring details for history UI
        ...(isHistorical ? {
            confidence: tleRes.confidence,
            dataAgeHours: tleRes.dataAgeHours,
            source: tleRes.source,
            tleEpoch: tleRes.epochTimestamp.toISOString(),
        } : {
            tleEpoch: tleRes.epochTimestamp.toISOString(),
        })
    };
}
export async function getGlobeAssets(limit = 25_000, at = new Date(), isHistorical = false, catalogNumbers) {
    const assets = await prisma.orbitalAsset.findMany({
        where: {
            orbitalEpoch: { not: null },
            launchDate: isHistorical ? { lte: at } : undefined,
            catalogNumber: catalogNumbers && catalogNumbers.length > 0 ? { in: catalogNumbers } : undefined,
        },
        select: {
            catalogNumber: true,
            displayName: true,
            assetClass: true,
            operatorName: true,
            originCountry: true,
            updatedAt: true,
            elementArchive: {
                select: { elementLine1: true, elementLine2: true, epochTimestamp: true },
            },
        },
        orderBy: { catalogNumber: "asc" },
        take: Math.min(Math.max(limit, 1), 25_000),
    });
    const gmst = satellite.gstime(at);
    const targetTime = at.getTime();
    const maxGapMs = 14 * 24 * 60 * 60 * 1000; // 14 days
    return {
        timestamp: at.toISOString(),
        assets: assets.flatMap((asset) => {
            let tle = null;
            let dataAgeHours = 0;
            let confidence = "INVALID";
            if (isHistorical) {
                let minDiff = Infinity;
                for (const archive of asset.elementArchive) {
                    const diff = Math.abs(archive.epochTimestamp.getTime() - targetTime);
                    if (diff < minDiff) {
                        minDiff = diff;
                        tle = archive;
                    }
                }
                if (!tle || minDiff > maxGapMs) {
                    return []; // Skip: TLE older than 14 days (INVALID confidence)
                }
                dataAgeHours = minDiff / 3_600_000;
                if (dataAgeHours <= 24) {
                    confidence = "HIGH";
                }
                else if (dataAgeHours <= 7 * 24) {
                    confidence = "MEDIUM";
                }
                else {
                    confidence = "LOW";
                }
            }
            else {
                // Retrieve the latest TLE
                tle = [...asset.elementArchive].sort((a, b) => b.epochTimestamp.getTime() - a.epochTimestamp.getTime())[0];
            }
            if (!tle)
                return [];
            try {
                const { position, velocity } = propagateTle(tle.elementLine1, tle.elementLine2, at);
                const gmst = satellite.gstime(at);
                const geo = satellite.eciToGeodetic(position, gmst);
                const atPlus1 = new Date(at.getTime() + 1000);
                const { position: pos2 } = propagateTle(tle.elementLine1, tle.elementLine2, atPlus1);
                const gmst2 = satellite.gstime(atPlus1);
                const ecf1 = satellite.eciToEcf(position, gmst);
                const ecf2 = satellite.eciToEcf(pos2, gmst2);
                const velocityEcf = {
                    x: ecf2.x - ecf1.x,
                    y: ecf2.y - ecf1.y,
                    z: ecf2.z - ecf1.z,
                };
                return [{
                        catalogNumber: asset.catalogNumber,
                        name: asset.displayName,
                        assetClass: asset.assetClass,
                        operatorName: asset.operatorName,
                        originCountry: asset.originCountry,
                        latitude: satellite.degreesLat(geo.latitude),
                        longitude: normalizeLongitude(satellite.degreesLong(geo.longitude)),
                        altitudeKm: geo.height,
                        velocityKmps: magnitude(velocity),
                        velocityEcf,
                        updatedAt: asset.updatedAt.toISOString(),
                        tleEpoch: tle.epochTimestamp.toISOString(),
                        ...(isHistorical ? { confidence, dataAgeHours: Math.round(dataAgeHours * 100) / 100 } : {}),
                    }];
            }
            catch {
                return [];
            }
        }),
    };
}
export async function getCurrentVelocity(catalogNumber, at = new Date()) {
    const tle = await getLatestTleByCatalogNumber(catalogNumber);
    if (!tle)
        throw new Error("No TLE available");
    const { velocity } = propagateTle(tle.line1, tle.line2, at);
    return { catalogNumber, velocityKmps: velocity, speedKmps: magnitude(velocity), timestamp: at.toISOString() };
}
export async function getOrbitalInformation(catalogNumber) {
    const asset = await getAssetByCatalogNumber(catalogNumber);
    const position = await getCurrentPosition(catalogNumber);
    return { asset, position };
}
export async function listObservations(limit = 100) {
    return prisma.observationLog.findMany({
        select: {
            logId: true,
            observerId: true,
            assetId: true,
            observationTime: true,
            trackingDurationSeconds: true,
            signalQuality: true,
            remarks: true,
            createdAt: true,
        },
        orderBy: { observationTime: "desc" },
        take: Math.min(Math.max(limit, 1), 500),
    });
}
export async function listVisibilityWindows(limit = 100) {
    return prisma.visibilityWindow.findMany({
        include: {
            asset: true,
            observer: true,
        },
        orderBy: { acquisitionTime: "asc" },
        take: Math.min(Math.max(limit, 1), 500),
    });
}
export async function getOverheadAssets(observer) {
    const assets = await prisma.orbitalAsset.findMany({
        where: { orbitalEpoch: { not: null } },
        include: { elementArchive: { orderBy: { epochTimestamp: "desc" }, take: 1 } },
        take: 1000,
    });
    const now = new Date();
    const visible = [];
    for (const asset of assets) {
        const tle = asset.elementArchive[0];
        if (!tle)
            continue;
        try {
            const lookAngles = lookAnglesFromTle(tle.elementLine1, tle.elementLine2, observer, now);
            if (lookAngles.elevation >= observer.minimumElevation) {
                visible.push({ asset, ...lookAngles, timestamp: now.toISOString() });
            }
        }
        catch {
            continue;
        }
    }
    return visible.sort((a, b) => b.elevation - a.elevation);
}
export async function getOrbitTrack(catalogNumber, minutesAhead = 95, at = new Date(), isHistorical = false) {
    const roundedTimestamp = Math.floor(at.getTime() / 30000) * 30000;
    const cacheKey = `${catalogNumber}_${roundedTimestamp}_${minutesAhead}`;
    if (isHistorical && trackCache.has(cacheKey)) {
        const cached = trackCache.get(cacheKey);
        if (Date.now() - cached.cachedAt < 5 * 60 * 1000) {
            return cached.points;
        }
    }
    const tle = isHistorical
        ? await getClosestTleByCatalogNumber(catalogNumber, at)
        : await getLatestTleByCatalogNumber(catalogNumber);
    if (!tle)
        throw new Error("No TLE available");
    const line1 = 'line1' in tle ? tle.line1 : tle.elementLine1;
    const line2 = 'line2' in tle ? tle.line2 : tle.elementLine2;
    const points = [];
    const startMs = at.getTime();
    const stepMs = 30_000;
    const steps = Math.ceil((minutesAhead * 60_000) / stepMs);
    for (let i = 0; i <= steps; i++) {
        const time = new Date(startMs + i * stepMs);
        try {
            const { position } = propagateTle(line1, line2, time);
            const gmst = satellite.gstime(time);
            const geo = satellite.eciToGeodetic(position, gmst);
            points.push({
                latitude: satellite.degreesLat(geo.latitude),
                longitude: normalizeLongitude(satellite.degreesLong(geo.longitude)),
                altitudeKm: geo.height,
            });
        }
        catch {
            continue;
        }
    }
    if (isHistorical) {
        trackCache.set(cacheKey, { points, cachedAt: Date.now() });
    }
    return points;
}
export async function predictPasses(catalogNumber, observer, hoursAhead) {
    const tle = await getLatestTleByCatalogNumber(catalogNumber);
    if (!tle)
        throw new Error("No TLE available");
    const minimumElevation = observer.minimumElevation ?? 10;
    const stepMs = 30_000;
    const end = Date.now() + hoursAhead * 3_600_000;
    const passes = [];
    let active = null;
    let previousAzimuth = 0;
    for (let time = Date.now(); time <= end; time += stepMs) {
        const at = new Date(time);
        let angles;
        try {
            angles = lookAnglesFromTle(tle.line1, tle.line2, observer, at);
        }
        catch {
            continue; // Skip failed propagations (e.g. decayed orbit)
        }
        if (angles.elevation >= minimumElevation) {
            if (!active)
                active = { acquisitionTime: at, maxElevation: angles.elevation, azimuthAtMax: angles.azimuth };
            if (angles.elevation > active.maxElevation) {
                active.maxElevation = angles.elevation;
                active.azimuthAtMax = angles.azimuth;
            }
        }
        else if (active) {
            passes.push({
                catalogNumber,
                acquisitionTime: active.acquisitionTime.toISOString(),
                lossTime: at.toISOString(),
                maxElevation: active.maxElevation,
                azimuth: active.azimuthAtMax,
                direction: directionFromAzimuth(previousAzimuth, angles.azimuth),
                visibility: calculateVisibilityScore(active.maxElevation, calculateIlluminationState(tle.line1, tle.line2, active.acquisitionTime)),
            });
            active = null;
        }
        previousAzimuth = angles.azimuth;
    }
    return passes.slice(0, 20);
}
export function calculateLookAngles(catalogNumber, observer) {
    return getLatestTleByCatalogNumber(catalogNumber).then((tle) => {
        if (!tle)
            throw new Error("No TLE available");
        return lookAnglesFromTle(tle.line1, tle.line2, observer, new Date());
    });
}
export function calculateVisibilityScore(maxElevation, illuminationState) {
    const elevationScore = Math.min(70, Math.max(0, maxElevation) * 0.78);
    const illuminationScore = illuminationState === "SUNLIT" ? 30 : illuminationState === "PENUMBRA" ? 15 : 0;
    return Math.round(Math.min(100, elevationScore + illuminationScore));
}
function propagateTle(line1, line2, at) {
    const satrec = satellite.twoline2satrec(line1, line2);
    const pv = satellite.propagate(satrec, at);
    if (!pv || !pv.position || !pv.velocity || typeof pv.position === "boolean" || typeof pv.velocity === "boolean") {
        throw new Error("Propagation failed");
    }
    return { satrec, position: pv.position, velocity: pv.velocity };
}
function lookAnglesFromTle(line1, line2, observer, at) {
    const { position } = propagateTle(line1, line2, at);
    const gmst = satellite.gstime(at);
    const observerGd = {
        latitude: deg2rad(observer.latitude),
        longitude: deg2rad(observer.longitude),
        height: 0,
    };
    const ecf = satellite.eciToEcf(position, gmst);
    const look = satellite.ecfToLookAngles(observerGd, ecf);
    return {
        azimuth: normalizeDegrees(rad2deg(look.azimuth)),
        elevation: rad2deg(look.elevation),
        rangeKm: look.rangeSat,
    };
}
function calculateIlluminationState(line1, line2, at) {
    const { position } = propagateTle(line1, line2, at);
    const sun = approximateSunEci(at);
    const dot = position.x * sun.x + position.y * sun.y + position.z * sun.z;
    if (dot > 0)
        return "SUNLIT";
    const crossMag = magnitude({
        x: position.y * sun.z - position.z * sun.y,
        y: position.z * sun.x - position.x * sun.z,
        z: position.x * sun.y - position.y * sun.x,
    });
    const distanceToShadowAxis = crossMag / magnitude(sun);
    return distanceToShadowAxis < 6378.137 ? "ECLIPSED" : "PENUMBRA";
}
function approximateSunEci(date) {
    const days = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86_400_000;
    const meanLongitude = deg2rad(normalizeDegrees(280.46 + 0.9856474 * days));
    const meanAnomaly = deg2rad(normalizeDegrees(357.528 + 0.9856003 * days));
    const eclipticLongitude = meanLongitude + deg2rad(1.915) * Math.sin(meanAnomaly) + deg2rad(0.02) * Math.sin(2 * meanAnomaly);
    const obliquity = deg2rad(23.439 - 0.0000004 * days);
    return {
        x: Math.cos(eclipticLongitude),
        y: Math.cos(obliquity) * Math.sin(eclipticLongitude),
        z: Math.sin(obliquity) * Math.sin(eclipticLongitude),
    };
}
function magnitude(vector) {
    return Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);
}
function normalizeDegrees(value) {
    return ((value % 360) + 360) % 360;
}
function directionFromAzimuth(start, end) {
    const delta = normalizeLongitude(end - start);
    return delta >= 0 ? "ascending" : "descending";
}
export async function getHistoryEvents(at, observer) {
    const startOfDay = new Date(at);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(at);
    endOfDay.setUTCHours(23, 59, 59, 999);
    // 1. Launches / Introductions
    const introductions = await prisma.orbitalAsset.findMany({
        where: {
            launchDate: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
        select: {
            catalogNumber: true,
            displayName: true,
            launchDate: true,
            originCountry: true,
            assetClass: true,
        },
    });
    // 2. Observations
    const observations = await prisma.observationLog.findMany({
        where: {
            observationTime: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
        include: {
            asset: {
                select: {
                    displayName: true,
                    catalogNumber: true,
                },
            },
        },
    });
    // 3. Visibility windows
    const visibilityWindows = await prisma.visibilityWindow.findMany({
        where: {
            acquisitionTime: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
        include: {
            asset: {
                select: {
                    displayName: true,
                    catalogNumber: true,
                },
            },
        },
    });
    // 4. Astronomical events
    const astroOverhead = astronomyService.getSkyOverhead(observer, at);
    const moonInfo = astroOverhead.find((b) => b.name === "Moon");
    const sunInfo = astroOverhead.find((b) => b.name === "Sun");
    return {
        historicalAssetIntroductions: introductions.map((i) => ({
            catalogNumber: i.catalogNumber,
            displayName: i.displayName,
            launchDate: i.launchDate?.toISOString(),
            originCountry: i.originCountry,
            assetClass: i.assetClass,
        })),
        observations: observations.map((o) => ({
            logId: o.logId,
            observationTime: o.observationTime.toISOString(),
            trackingDurationSeconds: o.trackingDurationSeconds,
            signalQuality: o.signalQuality,
            remarks: o.remarks,
            asset: o.asset,
        })),
        visibilityWindows: visibilityWindows.map((w) => ({
            windowId: w.windowId,
            acquisitionTime: w.acquisitionTime.toISOString(),
            lossTime: w.lossTime.toISOString(),
            peakElevation: Number(w.peakElevation),
            illuminationState: w.illuminationState,
            visibilityRating: w.visibilityRating,
            asset: w.asset,
        })),
        astronomy: {
            moonPhase: moonInfo?.phaseName ?? "Unknown",
            moonPhaseAngle: moonInfo?.phaseAngle ?? 0,
            moonVisible: moonInfo?.visible ?? false,
            sunVisible: sunInfo?.visible ?? false,
            bodies: astroOverhead.map((b) => ({
                name: b.name,
                altitude: b.altitude,
                azimuth: b.azimuth,
                visible: b.visible,
            })),
        },
    };
}
