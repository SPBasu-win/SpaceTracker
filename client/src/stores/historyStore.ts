import { create } from 'zustand'
import { milestones } from '../data/historyMilestones'

export type CategoryFilter = 
  | 'Human Spaceflight'
  | 'Moon Exploration'
  | 'Space Stations'
  | 'Telescopes'
  | 'Mars Exploration'
  | 'Commercial Spaceflight'
  | 'Megaconstellations'
  | 'Deep Space Missions'
  | 'Planetary Exploration'
  | 'Orbital Growth'

type HistoryState = {
  activeYear: number
  isPlaying: boolean
  playbackSpeed: number // Years advanced per interval tick
  activeFilters: Set<CategoryFilter>
  activeMilestoneId: string | null
  setActiveYear: (year: number) => void
  setIsPlaying: (playing: boolean) => void
  setPlaybackSpeed: (speed: number) => void
  toggleFilter: (filter: CategoryFilter) => void
  setActiveMilestoneId: (id: string | null) => void
  nextMilestone: () => void
  prevMilestone: () => void
  jumpToChapter: (year: number) => void
}

const ALL_FILTERS: CategoryFilter[] = [
  'Human Spaceflight',
  'Moon Exploration',
  'Space Stations',
  'Telescopes',
  'Mars Exploration',
  'Commercial Spaceflight',
  'Megaconstellations',
  'Deep Space Missions',
  'Planetary Exploration',
  'Orbital Growth'
]

export const useHistoryStore = create<HistoryState>((set, get) => ({
  activeYear: 1957,
  isPlaying: false,
  playbackSpeed: 1,
  activeFilters: new Set<CategoryFilter>(ALL_FILTERS),
  activeMilestoneId: 'sputnik-1',

  setActiveYear: (activeYear) => {
    const clampedYear = Math.max(1957, Math.min(2026, activeYear))
    const { activeFilters, activeMilestoneId } = get()
    
    // Automatically find milestone closest to or exactly matching this year that fits active filters
    const filtered = milestones.filter(m => activeFilters.has(m.category))
    const currentMatches = filtered.filter(m => m.year === clampedYear)
    
    let nextMilestoneId = activeMilestoneId
    if (currentMatches.length > 0) {
      nextMilestoneId = currentMatches[0].id
    } else {
      // Find latest milestone before or at this year
      const pastMilestones = filtered.filter(m => m.year <= clampedYear)
      if (pastMilestones.length > 0) {
        nextMilestoneId = pastMilestones[pastMilestones.length - 1].id
      }
    }
    
    set({ activeYear: clampedYear, activeMilestoneId: nextMilestoneId })
  },

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),

  toggleFilter: (filter) => {
    const nextFilters = new Set(get().activeFilters)
    if (nextFilters.has(filter)) {
      nextFilters.delete(filter)
    } else {
      nextFilters.add(filter)
    }
    set({ activeFilters: nextFilters })
    // Re-trigger active year setter to update milestone selection based on new filters
    get().setActiveYear(get().activeYear)
  },

  setActiveMilestoneId: (activeMilestoneId) => {
    const found = milestones.find(m => m.id === activeMilestoneId)
    if (found) {
      set({ activeMilestoneId, activeYear: found.year })
    } else {
      set({ activeMilestoneId })
    }
  },

  nextMilestone: () => {
    const { activeMilestoneId, activeFilters } = get()
    const filtered = milestones.filter(m => activeFilters.has(m.category))
    const currentIndex = filtered.findIndex(m => m.id === activeMilestoneId)
    if (currentIndex >= 0 && currentIndex < filtered.length - 1) {
      const nextM = filtered[currentIndex + 1]
      set({ activeMilestoneId: nextM.id, activeYear: nextM.year })
    }
  },

  prevMilestone: () => {
    const { activeMilestoneId, activeFilters } = get()
    const filtered = milestones.filter(m => activeFilters.has(m.category))
    const currentIndex = filtered.findIndex(m => m.id === activeMilestoneId)
    if (currentIndex > 0) {
      const prevM = filtered[currentIndex - 1]
      set({ activeMilestoneId: prevM.id, activeYear: prevM.year })
    }
  },

  jumpToChapter: (year) => {
    get().setActiveYear(year)
  }
}))
