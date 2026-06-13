import { AssetClass } from "@prisma/client";
import * as orbitalService from "../services/orbital.service";
import { runSyncJob } from "../jobs/sync.job";
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
    if (typeof value !== "string" || !(value in AssetClass)) {
        throw Object.assign(new Error("assetClass is invalid"), { statusCode: 400 });
    }
    return value;
}
