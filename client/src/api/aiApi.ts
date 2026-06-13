import { apiClient } from './client'

export interface ChatResponse {
  reply: string
  sessionId: string
  toolsUsed?: string[]
  turnsRemaining?: number
}

export interface HealthResponse {
  provider: string
  model: string
  status: string
}

export async function sendChatMessage(message: string, sessionId: string): Promise<ChatResponse> {
  // Use timeout of 60s for AI requests since they can take a while with tool calls
  const { data } = await apiClient.post<ChatResponse>('/ai/chat', { message, sessionId }, { timeout: 60000 })
  return data
}

export async function checkAiHealth(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>('/ai/health')
  return data
}
