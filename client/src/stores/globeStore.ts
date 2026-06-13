import { create } from 'zustand'
import type { GlobeAsset } from '../types/orbital'

type GlobeState = {
  selected?: GlobeAsset
  followMode: boolean
  setSelected: (selected?: GlobeAsset) => void
  setFollowMode: (followMode: boolean) => void
}

export const useGlobeStore = create<GlobeState>((set) => ({
  followMode: false,
  setSelected: (selected) => set({ selected }),
  setFollowMode: (followMode) => set({ followMode }),
}))
