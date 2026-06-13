"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentPosition = getCurrentPosition;
const satellite = __importStar(require("satellite.js"));
const prisma_1 = require("./prisma");
async function getCurrentPosition(catalogNumber) {
    const asset = await prisma_1.prisma.orbitalAsset.findUnique({
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
    const satrec = satellite.twoline2satrec(tle.elementLine1, tle.elementLine2);
    const now = new Date();
    const pv = satellite.propagate(satrec, now);
    if (!pv || !pv.position || !pv.velocity) {
        throw new Error("Propagation failed");
    }
    const gmst = satellite.gstime(now);
    const geo = satellite.eciToGeodetic(pv.position, gmst);
    const velocity = Math.sqrt(pv.velocity.x ** 2 +
        pv.velocity.y ** 2 +
        pv.velocity.z ** 2);
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
