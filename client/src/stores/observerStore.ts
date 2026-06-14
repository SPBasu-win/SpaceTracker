import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ObserverState = {
  latitude: number | null
  longitude: number | null
  locationName: string | null
  status: 'idle' | 'locating' | 'ready' | 'denied' | 'error'
  setLocation: (latitude: number, longitude: number) => void
  setManualLocation: (latitude: number, longitude: number, locationName: string) => void
  locate: () => void
}

export const useObserverStore = create<ObserverState>()(
  persist(
    (set) => ({
      latitude: null,
      longitude: null,
      locationName: null,
      status: 'idle',
      setLocation: (latitude, longitude) => set({ latitude, longitude, status: 'ready' }),
      setManualLocation: (latitude, longitude, locationName) => set({ latitude, longitude, locationName, status: 'ready' }),
      locate: () => {
        if (!navigator.geolocation) {
          set({ status: 'error' })
          return
        }
        set({ status: 'locating' })
        navigator.geolocation.getCurrentPosition(
          (pos) => set({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, status: 'ready' }),
          (error) => set({ status: error.code === error.PERMISSION_DENIED ? 'denied' : 'error' }),
          { enableHighAccuracy: true, timeout: 10_000 },
        )
      },
    }),
    { name: 'spacetrack-observer' },
  ),
)

// Auto-trigger locate on init if idle
if (typeof window !== 'undefined') {
  const state = useObserverStore.getState()
  if (state.status === 'idle') {
    state.locate()
  }
}
