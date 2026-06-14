import { create } from 'zustand'
import type { GlobeAsset } from '../types/orbital'

export type MapStyle = 'satellite' | 'map' | 'base' | 'ion'

type GlobeState = {
  selected?: GlobeAsset
  followMode: boolean
  mapStyle: MapStyle
  isLoading: boolean
  loadProgress: number
  setSelected: (selected?: GlobeAsset) => void
  setFollowMode: (followMode: boolean) => void
  setMapStyle: (mapStyle: MapStyle) => void
  setIsLoading: (isLoading: boolean) => void
  setLoadProgress: (loadProgress: number) => void
}

export const useGlobeStore = create<GlobeState>((set) => ({
  followMode: false,
  mapStyle: 'satellite', // Default to satellite imagery
  isLoading: true,
  loadProgress: 0,
  setSelected: (selected) => set({ selected }),
  setFollowMode: (followMode) => set({ followMode }),
  setMapStyle: (mapStyle) => set({ mapStyle }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setLoadProgress: (loadProgress) => set({ loadProgress }),
}))
