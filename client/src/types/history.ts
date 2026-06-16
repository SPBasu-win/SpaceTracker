export type MissionStatus = 'active' | 'deorbited' | 'debris'

export interface LaunchSite {
  name: string
  latitude: number
  longitude: number
}

export interface GhostOrbit {
  inclinationDeg: number
  altitudeKm: number
  raanDeg?: number
}

export interface HistoryMission {
  id: string
  eraId: string
  name: string
  year: number
  launchDate: string
  country: string
  type: string
  status: MissionStatus
  noradId?: number
  launchSite: LaunchSite
  orbit?: GhostOrbit
  description: string
}

export interface HistoryEra {
  id: string
  name: string
  period: string
  blurb: string
  objectsInOrbit: number
  focus: { latitude: number; longitude: number; label: string }
}

export interface HistoryDataset {
  eras: HistoryEra[]
  missions: HistoryMission[]
}
