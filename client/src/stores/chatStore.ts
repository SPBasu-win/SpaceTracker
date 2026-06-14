import { create } from 'zustand'
import { sendChatMessage } from '../api/aiApi'
import { useGlobeStore } from './globeStore'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  toolsUsed?: string[]
}

interface ChatState {
  messages: ChatMessage[]
  sessionId: string
  isLoading: boolean
  turnsRemaining: number | null
  error: string | null
  sendMessage: (text: string) => Promise<void>
  clearChat: () => void
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  sessionId: crypto.randomUUID(),
  isLoading: false,
  turnsRemaining: null,
  error: null,
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
  
  sendMessage: async (text: string) => {
    const { sessionId, messages } = get()
    
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    
    set({ 
      messages: [...messages, userMessage],
      isLoading: true,
      error: null
    })
    
    try {
      const response = await sendChatMessage(text, sessionId)
      
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(),
        toolsUsed: response.toolsUsed,
      }
      
      set((state) => ({
        messages: [...state.messages, assistantMessage],
        turnsRemaining: response.turnsRemaining ?? state.turnsRemaining,
        isLoading: false,
      }))
      
      if (response.globeAction) {
        if (response.globeAction.type === 'FLY_TO' && response.globeAction.catalogNumber) {
          useGlobeStore.getState().setTargetCatalogNumber(response.globeAction.catalogNumber)
        } else if (response.globeAction.type === 'FILTER_CATEGORY' && response.globeAction.assetClass) {
          useGlobeStore.getState().setFilterCategory(response.globeAction.assetClass)
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error)
      let errorMessage = 'An unexpected error occurred. Please try again.'
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.'
      }
      
      set({ error: errorMessage, isLoading: false })
    }
  },
  
  clearChat: () => {
    set({
      messages: [],
      sessionId: crypto.randomUUID(),
      isLoading: false,
      turnsRemaining: null,
      error: null
    })
  }
}))
