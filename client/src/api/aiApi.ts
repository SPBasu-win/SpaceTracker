import { apiClient } from './client'

export interface GlobeAction {
  type: 'FLY_TO' | 'FILTER_CATEGORY' | 'FLY_TO_PLANET' | 'FLY_TO_LOCATION'
  catalogNumber?: number
  assetClass?: string
  body?: string
  latitude?: number
  longitude?: number
  label?: string
}

export interface ChatResponse {
  reply: string
  sessionId: string
  toolsUsed?: string[]
  turnsRemaining?: number
  globeAction?: GlobeAction
}

export interface HealthResponse {
  provider: string
  model: string
  status: string
}

export async function sendChatMessage(message: string, sessionId: string, location?: { latitude: number; longitude: number; locationName?: string | null }): Promise<ChatResponse> {
  // Use timeout of 60s for AI requests since they can take a while with tool calls
  const payload: any = { message, sessionId }
  if (location) {
    payload.latitude = location.latitude
    payload.longitude = location.longitude
    payload.locationName = location.locationName
  }
  const { data } = await apiClient.post<ChatResponse>('/ai/chat', payload, { timeout: 60000 })
  return data
}

export async function checkAiHealth(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>('/ai/health')
  return data
}

export async function geocodeLocation(query: string): Promise<{ latitude: number; longitude: number; displayName: string }> {
  const { data } = await apiClient.post('/ai/geocode', { query })
  return data
}
