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
