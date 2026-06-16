import { create } from 'zustand'
import { sendChatMessage } from '../api/aiApi'
import { useGlobeStore } from './globeStore'
import { useObserverStore } from './observerStore'

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
  cooldownRemaining: number
  setCooldown: (seconds: number) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  sessionId: crypto.randomUUID(),
  isLoading: false,
  turnsRemaining: null,
  error: null,
  isOpen: false,
  cooldownRemaining: 0,
  setIsOpen: (isOpen) => set({ isOpen }),
  setCooldown: (seconds) => {
    set({ cooldownRemaining: seconds })
    if (seconds <= 0) return

    const interval = setInterval(() => {
      const { cooldownRemaining } = get()
      if (cooldownRemaining <= 1) {
        clearInterval(interval)
        set({ cooldownRemaining: 0, error: null })
      } else {
        set({ 
          cooldownRemaining: cooldownRemaining - 1, 
          error: `AI Rate Limited: Please wait ${cooldownRemaining - 1} seconds.` 
        })
      }
    }, 1000)
  },
  
  sendMessage: async (text: string) => {
    const { sessionId, messages, cooldownRemaining } = get()
    
    if (cooldownRemaining > 0) return

    
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
      const { latitude, longitude, locationName } = useObserverStore.getState()
      const location = latitude && longitude ? { latitude, longitude, locationName } : undefined
      
      const response = await sendChatMessage(text, sessionId, location)
      
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
        const action = response.globeAction
        if (action.type === 'FLY_TO' && action.catalogNumber) {
          useGlobeStore.getState().setTargetCatalogNumber(action.catalogNumber)
        } else if (action.type === 'FILTER_CATEGORY' && action.assetClass) {
          useGlobeStore.getState().setFilterCategory(action.assetClass)
        } else if (action.type === 'FLY_TO_PLANET' && action.body) {
          useGlobeStore.getState().setActivePlanet(action.body)
        } else if (action.type === 'FLY_TO_LOCATION' && action.latitude != null && action.longitude != null) {
          useGlobeStore.getState().setFlyToLocation({ latitude: action.latitude, longitude: action.longitude, label: action.label })
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error)
      let errorMessage = 'An unexpected error occurred. Please try again.'
      
      if (error.response?.status === 429) {
        const retryAfter = error.response.data?.retryAfter || 30
        get().setCooldown(retryAfter)
        errorMessage = `AI Rate Limited: Please wait ${retryAfter} seconds.`
        
        // Remove the optimistically added user message so they can retry
        set((state) => ({
          messages: state.messages.slice(0, -1),
          error: errorMessage,
          isLoading: false
        }))
        return
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
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
      error: null,
      cooldownRemaining: 0
    })
  }
}))
