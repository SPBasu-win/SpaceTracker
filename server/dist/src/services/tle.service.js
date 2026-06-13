import { prisma } from "../lib/prisma.js";
export async function getLatestTleFromDatabase(catalogNumber) {
    const asset = await prisma.orbitalAsset.findUnique({
        where: { catalogNumber },
        include: {
            elementArchive: {
                orderBy: { epochTimestamp: "desc" },
                take: 1,
            },
        },
    });
    const tle = asset?.elementArchive[0];
    if (!asset || !tle)
        return null;
    return {
        catalogNumber: asset.catalogNumber,
        name: asset.displayName,
        line1: tle.elementLine1,
        line2: tle.elementLine2,
        epochTimestamp: tle.epochTimestamp,
    };
}
export async function fetchFallbackTleFromCelesTrak(catalogNumber) {
    const url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${catalogNumber}&FORMAT=TLE`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`CelesTrak TLE request failed with ${response.status}`);
    }
    const lines = (await response.text())
        .split(/\r?\n/)
        .map((line) => line.trimEnd())
        .filter(Boolean);
    const line1Index = lines.findIndex((line) => line.startsWith("1 "));
    if (line1Index < 0 || !lines[line1Index + 1]?.startsWith("2 "))
        return null;
    return {
        catalogNumber,
        name: line1Index > 0 ? lines[line1Index - 1].trim() : null,
        line1: lines[line1Index],
        line2: lines[line1Index + 1],
        epochTimestamp: parseTleEpoch(lines[line1Index]),
    };
}
export async function getLatestTleByCatalogNumber(catalogNumber) {
    const databaseTle = await getLatestTleFromDatabase(catalogNumber);
    const maxAgeHours = Number(process.env.TLE_MAX_AGE_HOURS ?? 24);
    const isFresh = databaseTle &&
        Date.now() - databaseTle.epochTimestamp.getTime() < Math.max(maxAgeHours, 1) * 3_600_000;
    if (isFresh)
        return databaseTle;
    try {
        const fallback = await fetchFallbackTleFromCelesTrak(catalogNumber);
        if (fallback)
            return fallback;
    }
    catch (error) {
        console.warn("tle.celestrak_failed", { catalogNumber, error });
    }
    return databaseTle;
}
function parseTleEpoch(line1) {
    const year = Number(line1.slice(18, 20));
    const dayOfYear = Number(line1.slice(20, 32));
    const fullYear = year < 57 ? 2000 + year : 1900 + year;
    const start = Date.UTC(fullYear, 0, 1, 0, 0, 0, 0);
    return new Date(start + (dayOfYear - 1) * 86_400_000);
}
