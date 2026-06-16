import { create } from 'zustand'
import type { GlobeAsset } from '../types/orbital'

export type MapStyle = 'satellite' | 'map' | 'base' | 'ion'

export type FlyToLocation = { latitude: number; longitude: number; label?: string }

/** A representative historic orbit drawn as a "ghost" ring in History mode. */
export type GhostOrbit = {
  id: string
  inclinationDeg: number
  altitudeKm: number
  raanDeg?: number
  color: string
}

type GlobeState = {
  selected?: GlobeAsset
  followMode: boolean
  mapStyle: MapStyle
  isLoading: boolean
  loadProgress: number
  targetCatalogNumber: number | null
  flyToTrigger: number
  filterCategory: string | null
  // Project Zenith: camera fly-to an arbitrary geographic location (AI / history mode)
  flyToLocation: FlyToLocation | null
  locationFlyTrigger: number
  // Project Zenith: celestial body selected for a sky context card
  activePlanet: string | null
  // Project Zenith History mode: hide live billboards + draw ghost orbits
  historyMode: boolean
  historyOrbits: GhostOrbit[]
  setSelected: (selected?: GlobeAsset) => void
  setFollowMode: (followMode: boolean) => void
  setMapStyle: (mapStyle: MapStyle) => void
  setIsLoading: (isLoading: boolean) => void
  setLoadProgress: (loadProgress: number) => void
  setTargetCatalogNumber: (catalogNumber: number | null) => void
  setFilterCategory: (category: string | null) => void
  setFlyToLocation: (location: FlyToLocation | null) => void
  setActivePlanet: (body: string | null) => void
  setHistoryMode: (on: boolean) => void
  setHistoryOrbits: (orbits: GhostOrbit[]) => void
}

export const useGlobeStore = create<GlobeState>((set) => ({
  followMode: false,
  mapStyle: 'satellite', // Default to satellite imagery
  isLoading: true,
  loadProgress: 0,
  targetCatalogNumber: null,
  flyToTrigger: 0,
  filterCategory: null,
  flyToLocation: null,
  locationFlyTrigger: 0,
  activePlanet: null,
  historyMode: false,
  historyOrbits: [],
  setSelected: (selected) => set({ selected }),
  setFollowMode: (followMode) => set({ followMode }),
  setMapStyle: (mapStyle) => set({ mapStyle }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setLoadProgress: (loadProgress) => set({ loadProgress }),
  setTargetCatalogNumber: (targetCatalogNumber) => set((state) => ({ targetCatalogNumber, flyToTrigger: state.flyToTrigger + 1 })),
  setFilterCategory: (filterCategory) => set({ filterCategory }),
  setFlyToLocation: (flyToLocation) => set((state) => ({ flyToLocation, locationFlyTrigger: state.locationFlyTrigger + 1 })),
  setActivePlanet: (activePlanet) => set({ activePlanet }),
  setHistoryMode: (historyMode) => set({ historyMode }),
  setHistoryOrbits: (historyOrbits) => set({ historyOrbits }),
}))
