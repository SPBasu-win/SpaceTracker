import { create } from 'zustand'
import dataset from '../data/history_missions.json'
import type { HistoryDataset, HistoryEra, HistoryMission } from '../types/history'

const data = dataset as HistoryDataset

type HistoryState = {
  eras: HistoryEra[]
  missions: HistoryMission[]
  /** Index of the currently selected era (chapter). */
  eraIndex: number
  /** Mission selected for the detail card, if any. */
  selectedMissionId: string | null
  setEraIndex: (index: number) => void
  nextEra: () => void
  prevEra: () => void
  selectMission: (missionId: string | null) => void
  missionsForEra: (eraId: string) => HistoryMission[]
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  eras: data.eras,
  missions: data.missions,
  eraIndex: 0,
  selectedMissionId: null,
  setEraIndex: (eraIndex) =>
    set({ eraIndex: Math.max(0, Math.min(data.eras.length - 1, eraIndex)), selectedMissionId: null }),
  nextEra: () =>
    set((state) => ({
      eraIndex: Math.min(data.eras.length - 1, state.eraIndex + 1),
      selectedMissionId: null,
    })),
  prevEra: () =>
    set((state) => ({
      eraIndex: Math.max(0, state.eraIndex - 1),
      selectedMissionId: null,
    })),
  selectMission: (selectedMissionId) => set({ selectedMissionId }),
  missionsForEra: (eraId) => get().missions.filter((m) => m.eraId === eraId),
}))
