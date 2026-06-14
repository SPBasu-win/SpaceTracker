import { create } from 'zustand'
import type { GlobeAsset } from '../types/orbital'

export type MapStyle = 'satellite' | 'map' | 'base' | 'ion'

type GlobeState = {
  selected?: GlobeAsset
  followMode: boolean
  mapStyle: MapStyle
  isLoading: boolean
  loadProgress: number
  targetCatalogNumber: number | null
  filterCategory: string | null
  setSelected: (selected?: GlobeAsset) => void
  setFollowMode: (followMode: boolean) => void
  setMapStyle: (mapStyle: MapStyle) => void
  setIsLoading: (isLoading: boolean) => void
  setLoadProgress: (loadProgress: number) => void
  setTargetCatalogNumber: (catalogNumber: number | null) => void
  setFilterCategory: (category: string | null) => void
}

export const useGlobeStore = create<GlobeState>((set) => ({
  followMode: false,
  mapStyle: 'satellite', // Default to satellite imagery
  isLoading: true,
  loadProgress: 0,
  targetCatalogNumber: null,
  filterCategory: null,
  setSelected: (selected) => set({ selected }),
  setFollowMode: (followMode) => set({ followMode }),
  setMapStyle: (mapStyle) => set({ mapStyle }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setLoadProgress: (loadProgress) => set({ loadProgress }),
  setTargetCatalogNumber: (targetCatalogNumber) => set({ targetCatalogNumber }),
  setFilterCategory: (filterCategory) => set({ filterCategory }),
}))
