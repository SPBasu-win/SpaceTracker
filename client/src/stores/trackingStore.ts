import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type TrackedItem = { catalogNumber: number; name?: string | null }

type TrackingState = {
  tracked: TrackedItem[]
  add: (item: TrackedItem) => void
  remove: (catalogNumber: number) => void
  isTracked: (catalogNumber: number) => boolean
}

export const useTrackingStore = create<TrackingState>()(
  persist(
    (set, get) => ({
      tracked: [],
      add: (item) => set({ tracked: get().isTracked(item.catalogNumber) ? get().tracked : [...get().tracked, item] }),
      remove: (catalogNumber) => set({ tracked: get().tracked.filter((item) => item.catalogNumber !== catalogNumber) }),
      isTracked: (catalogNumber) => get().tracked.some((item) => item.catalogNumber === catalogNumber),
    }),
    { name: 'spacetrack-tracked' },
  ),
)
