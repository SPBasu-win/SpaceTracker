import { create } from 'zustand'
import type { AssetClass, OrbitalAsset } from '../types/orbital'
import { listAssets } from '../api/orbitalApi'

type AssetState = {
  assets: OrbitalAsset[]
  selected?: OrbitalAsset
  search: string
  assetClass?: AssetClass
  page: number
  pageSize: number
  loading: boolean
  setSearch: (search: string) => void
  setAssetClass: (assetClass?: AssetClass) => void
  setPage: (page: number) => void
  load: () => Promise<void>
}

export const useAssetStore = create<AssetState>((set, get) => ({
  assets: [],
  search: '',
  page: 1,
  pageSize: 25,
  loading: false,
  setSearch: (search) => set({ search, page: 1 }),
  setAssetClass: (assetClass) => set({ assetClass, page: 1 }),
  setPage: (page) => set({ page }),
  load: async () => {
    set({ loading: true })
    const { search, assetClass } = get()
    try {
      set({ assets: await listAssets({ search, assetClass }) })
    } finally {
      set({ loading: false })
    }
  },
}))
