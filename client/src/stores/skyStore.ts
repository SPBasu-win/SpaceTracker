import { create } from 'zustand'

export type SkyViewMode = 'globe' | 'skymap'

type SkyState = {
  viewMode: SkyViewMode
  /** Show overhead satellites on the sky map. */
  showSatellites: boolean
  /** Show planets / Sun / Moon on the sky map. */
  showPlanets: boolean
  setViewMode: (mode: SkyViewMode) => void
  toggleViewMode: () => void
  setShowSatellites: (show: boolean) => void
  setShowPlanets: (show: boolean) => void
}

export const useSkyStore = create<SkyState>((set) => ({
  viewMode: 'globe',
  showSatellites: true,
  showPlanets: true,
  setViewMode: (viewMode) => set({ viewMode }),
  toggleViewMode: () => set((state) => ({ viewMode: state.viewMode === 'globe' ? 'skymap' : 'globe' })),
  setShowSatellites: (showSatellites) => set({ showSatellites }),
  setShowPlanets: (showPlanets) => set({ showPlanets }),
}))
