import * as satellite from "satellite.js";
import { prisma } from "./prisma";

export async function getCurrentPosition(
  catalogNumber: number
) {
  const asset = await prisma.orbitalAsset.findUnique({
    where: {
      catalogNumber,
    },
    include: {
      elementArchive: {
        orderBy: {
          epochTimestamp: "desc",
        },
        take: 1,
      },
    },
  });

  if (!asset) {
    throw new Error("Satellite not found");
  }

  const tle = asset.elementArchive[0];

  if (!tle) {
    throw new Error("No TLE available");
  }

  const satrec = satellite.twoline2satrec(
    tle.elementLine1,
    tle.elementLine2
  );

  const now = new Date();
  const pv = satellite.propagate(satrec, now);

  if (!pv || !pv.position || !pv.velocity) {
    throw new Error("Propagation failed");
  }

  const gmst = satellite.gstime(now);
  const geo = satellite.eciToGeodetic(pv.position, gmst);

  const velocity = Math.sqrt(
    pv.velocity.x ** 2 +
    pv.velocity.y ** 2 +
    pv.velocity.z ** 2
  );

  return {
    catalogNumber: asset.catalogNumber,
    name: asset.displayName,
    latitude: satellite.degreesLat(geo.latitude),
    longitude: satellite.degreesLong(geo.longitude),
    altitudeKm: geo.height,
    velocityKmps: velocity,
    inclinationDeg: satrec.inclo * (180 / Math.PI),
    timestamp: now.toISOString(),
  };
}