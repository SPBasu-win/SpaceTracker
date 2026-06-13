import * as satellite from "satellite.js";

export { satellite };

export const earthRadiusKm = 6378.137;
export const deg2rad = (degrees: number) => (degrees * Math.PI) / 180;
export const rad2deg = (radians: number) => (radians * 180) / Math.PI;

export function normalizeLongitude(degrees: number) {
  return ((((degrees + 180) % 360) + 360) % 360) - 180;
}
