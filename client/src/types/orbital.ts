export type AssetClass =
  | 'COMMUNICATION'
  | 'NAVIGATION'
  | 'EARTH_OBSERVATION'
  | 'WEATHER'
  | 'MILITARY'
  | 'SCIENTIFIC'
  | 'CREWED'
  | 'DEBRIS'
  | 'OTHER'

export type OrbitalAsset = {
  assetId: string
  catalogNumber: number
  internationalDesignator?: string | null
  displayName?: string | null
  assetClass: AssetClass
  operatorName?: string | null
  originCountry?: string | null
  launchDate?: string | null
  decayDate?: string | null
  orbitalEpoch?: string | null
  updatedAt: string
}

export type AssetPosition = {
  catalogNumber: number
  name?: string | null
  latitude: number
  longitude: number
  altitudeKm: number
  velocityKmps: number
  inclinationDeg?: number
  timestamp: string
}

export type GlobeAsset = {
  catalogNumber: number
  name?: string | null
  assetClass: AssetClass
  operatorName?: string | null
  originCountry?: string | null
  latitude: number
  longitude: number
  altitudeKm: number
  velocityKmps: number
  velocityEcf?: { x: number, y: number, z: number }
  updatedAt: string
  tleEpoch: string
}

export type PassPrediction = {
  catalogNumber: number
  acquisitionTime: string
  lossTime: string
  maxElevation: number
  azimuth: number
  direction: string
  visibility: number
}
