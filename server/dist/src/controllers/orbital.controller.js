import prismaPkg from "@prisma/client";
const { AssetClass: AssetClassEnum } = prismaPkg;
import * as orbitalService from "../services/orbital.service.js";
import * as astronomyService from "../services/astronomy.service.js";
import { runSyncJob } from "../jobs/sync.job.js";
export async function listAssets(req, res) {
    const catalogNumber = optionalNumber(req.query.catalogNumber);
    const assetClass = optionalAssetClass(req.query.assetClass);
    const search = optionalString(req.query.search);
    res.json(await orbitalService.listAssets({ search, catalogNumber, assetClass }));
}
export async function getAsset(req, res) {
    res.json(await orbitalService.getAssetByCatalogNumber(requiredCatalogNumber(req)));
}
export async function getPosition(req, res) {
    res.json(await orbitalService.getCurrentPosition(requiredCatalogNumber(req)));
}
export async function getGlobeAssets(req, res) {
    res.json(await orbitalService.getGlobeAssets(optionalNumber(req.query.limit) ?? 25_000));
}
export async function getPasses(req, res) {
    const latitude = requiredNumber(req.query.latitude, "latitude");
    const longitude = requiredNumber(req.query.longitude, "longitude");
    const hoursAhead = optionalNumber(req.query.hoursAhead) ?? 24;
    res.json(await orbitalService.predictPasses(requiredCatalogNumber(req), { latitude, longitude }, hoursAhead));
}
export async function getOverhead(req, res) {
    const latitude = requiredNumber(req.query.latitude, "latitude");
    const longitude = requiredNumber(req.query.longitude, "longitude");
    const minimumElevation = optionalNumber(req.query.minimumElevation) ?? 10;
    res.json(await orbitalService.getOverheadAssets({ latitude, longitude, minimumElevation }));
}
/**
 * Project Zenith: enriched sky overhead — Sun, Moon and planets with
 * alt/azimuth, distance, visibility and Moon-phase. Computed via
 * astronomy-engine, independent of the satellite TLE pipeline.
 */
export async function getSkyOverhead(req, res) {
    const latitude = requiredNumber(req.query.latitude, "latitude");
    const longitude = requiredNumber(req.query.longitude, "longitude");
    const onlyVisible = req.query.onlyVisible === "true";
    res.json({
        observer: { latitude, longitude },
        timestamp: new Date().toISOString(),
        bodies: astronomyService.getSkyOverhead({ latitude, longitude }, new Date(), { onlyVisible }),
    });
}
/** Sky position of a single solar-system body (planet/Moon/Sun) for an observer. */
export async function getPlanetPosition(req, res) {
    const name = String(req.params.name);
    const latitude = requiredNumber(req.query.latitude, "latitude");
    const longitude = requiredNumber(req.query.longitude, "longitude");
    const position = astronomyService.getBodyPosition(name, { latitude, longitude });
    if (!position) {
        throw Object.assign(new Error(`Unknown celestial body: ${name}`), { statusCode: 404 });
    }
    const riseSet = astronomyService.getRiseSet(name, { latitude, longitude });
    res.json({ ...position, ...riseSet });
}
export async function getObservations(req, res) {
    res.json(await orbitalService.listObservations(optionalNumber(req.query.limit) ?? 100));
}
export async function getVisibilityWindows(req, res) {
    res.json(await orbitalService.listVisibilityWindows(optionalNumber(req.query.limit) ?? 100));
}
export async function runSync(_req, res) {
    res.json(await runSyncJob());
}
function requiredCatalogNumber(req) {
    return requiredNumber(req.params.catalogNumber, "catalogNumber");
}
function requiredNumber(value, field) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed))
        throw Object.assign(new Error(`${field} must be a number`), { statusCode: 400 });
    return parsed;
}
function optionalNumber(value) {
    if (value === undefined)
        return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed))
        throw Object.assign(new Error("Invalid numeric query parameter"), { statusCode: 400 });
    return parsed;
}
function optionalString(value) {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
function optionalAssetClass(value) {
    if (value === undefined)
        return undefined;
    if (typeof value !== "string" || !(value in AssetClassEnum)) {
        throw Object.assign(new Error("assetClass is invalid"), { statusCode: 400 });
    }
    return value;
}
