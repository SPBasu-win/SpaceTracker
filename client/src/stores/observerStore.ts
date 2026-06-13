import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ObserverState = {
  latitude: number
  longitude: number
  status: 'idle' | 'locating' | 'ready' | 'denied' | 'error'
  setLocation: (latitude: number, longitude: number) => void
  locate: () => void
}

export const useObserverStore = create<ObserverState>()(
  persist(
    (set) => ({
      latitude: 28.6139,
      longitude: 77.209,
      status: 'idle',
      setLocation: (latitude, longitude) => set({ latitude, longitude, status: 'ready' }),
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
