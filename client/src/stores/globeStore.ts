import { create } from 'zustand'
import type { GlobeAsset } from '../types/orbital'

export type MapStyle = 'satellite' | 'map' | 'base' | 'ion'

type GlobeState = {
  selected?: GlobeAsset
  followMode: boolean
  mapStyle: MapStyle
  setSelected: (selected?: GlobeAsset) => void
  setFollowMode: (followMode: boolean) => void
  setMapStyle: (mapStyle: MapStyle) => void
}

export const useGlobeStore = create<GlobeState>((set) => ({
  followMode: false,
  mapStyle: 'satellite', // Default to satellite imagery
  setSelected: (selected) => set({ selected }),
  setFollowMode: (followMode) => set({ followMode }),
  setMapStyle: (mapStyle) => set({ mapStyle }),
}))

