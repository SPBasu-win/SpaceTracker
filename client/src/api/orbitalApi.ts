import { apiClient } from './client'
import type { AssetClass, AssetPosition, GlobeAsset, OrbitalAsset, PassPrediction } from '../types/orbital'

export type AssetQuery = {
  search?: string
  catalogNumber?: number
  assetClass?: AssetClass
}

export async function listAssets(params: AssetQuery = {}) {
  const { data } = await apiClient.get<OrbitalAsset[]>('/assets', { params })
  return data
}

export async function getAsset(catalogNumber: number) {
  const { data } = await apiClient.get<OrbitalAsset>(`/assets/${catalogNumber}`)
  return data
}

export async function getPosition(catalogNumber: number) {
  const { data } = await apiClient.get<AssetPosition>(`/assets/${catalogNumber}/position`)
  return data
}

export async function getPasses(catalogNumber: number, latitude: number, longitude: number) {
  const { data } = await apiClient.get<PassPrediction[]>(`/assets/${catalogNumber}/passes`, {
    params: { latitude, longitude },
  })
  return data
}

export async function getGlobeAssets(limit = 25_000) {
  const { data } = await apiClient.get<{ timestamp: string; assets: GlobeAsset[] }>('/globe/assets', { params: { limit } })
  return data
}

export async function getOverhead(latitude: number, longitude: number) {
  const { data } = await apiClient.get('/overhead', { params: { latitude, longitude } })
  return data
}

export async function fetchGlobeAsset(catalogNumber: number): Promise<GlobeAsset | null> {
  try {
    const [asset, position] = await Promise.all([
      getAsset(catalogNumber),
      getPosition(catalogNumber)
    ])
    if (!asset || !position) return null

    return {
      catalogNumber: asset.catalogNumber,
      name: asset.displayName || asset.internationalDesignator,
      assetClass: asset.assetClass,
      operatorName: asset.operatorName,
      originCountry: asset.originCountry,
      latitude: position.latitude,
      longitude: position.longitude,
      altitudeKm: position.altitudeKm,
      velocityKmps: position.velocityKmps,
      updatedAt: asset.updatedAt,
      tleEpoch: asset.orbitalEpoch || asset.updatedAt
    }
  } catch (error) {
    console.warn(`Failed to fetch globe asset ${catalogNumber}:`, error)
    return null
  }
}
