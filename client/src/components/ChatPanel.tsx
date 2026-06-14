import React, { useState, useEffect, useRef } from 'react'
import { useChatStore } from '../stores/chatStore'
import { useGlobeStore } from '../stores/globeStore'
import { useObserverStore } from '../stores/observerStore'
import { Send, X, Bot, User, Orbit, AlertCircle, RefreshCw, MessageSquare, MapPin } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './ChatPanel.css'


const SUGGESTED_QUERIES = [
  "Show me the ISS on the globe",
  "Highlight all Starlink satellites",
  "Tell me some upcoming celestial events for my location",
  "What satellites are overhead from my location?",
  "When can I see the ISS tonight?",
  "Track satellite 25544"
]

export const ChatPanel: React.FC = () => {
  const { messages, isLoading, error, turnsRemaining, sendMessage, clearChat, isOpen, setIsOpen, cooldownRemaining } = useChatStore()
  const setTargetCatalogNumber = useGlobeStore((state) => state.setTargetCatalogNumber)
  const { locationName } = useObserverStore()
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSend = () => {
    if (inputText.trim() && inputText.length <= 1000 && turnsRemaining !== 0 && !isLoading) {
      sendMessage(inputText.trim())
      setInputText('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isLimitReached = turnsRemaining === 0
  const isNearCharLimit = inputText.length > 900

  return (
    <div className={`chat-panel-overlay ${isOpen ? 'open' : ''}`}>
      <div className="chat-panel">
        <div className="chat-header">
          <div className="chat-title">
            <Orbit className="chat-title-icon" />
            <h3>SpaceTracker AI</h3>
          </div>
          <div className="chat-header-actions" style={{ display: 'flex', alignItems: 'center' }}>
            {locationName && (
              <div className="location-badge" title="Using location for AI context" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#7aa2f7', background: 'rgba(122, 162, 247, 0.1)', padding: '4px 8px', borderRadius: '12px', marginRight: '8px' }}>
                <MapPin size={12} />
                <span style={{ maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{locationName.split(',')[0]}</span>
              </div>
            )}
            {messages.length > 0 && (
              <button className="icon-button" onClick={clearChat} title="Clear Chat">
                <RefreshCw size={18} />
              </button>
            )}
            <button className="icon-button" onClick={() => setIsOpen(false)} title="Close Chat">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty-state">
              <Bot size={48} className="chat-empty-icon" />
              <h4>Welcome to SpaceTracker AI</h4>
              <p>Ask me anything about satellites, orbits, and space situational awareness.</p>
              
              <div className="suggested-queries">
                {SUGGESTED_QUERIES.map((query, index) => (
                  <button 
                    key={index}
                    className="suggested-query-btn"
                    onClick={() => {
                      setInputText(query)
                      // Optionally auto-send
                    }}
                  >
                    <MessageSquare size={14} />
                    {query}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`message-wrapper ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className="message-content">
                  {msg.role === 'user' ? (
                    <div className="message-text">{msg.content}</div>
                  ) : (
                    <div className="message-markdown">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ node, ...props }) => {
                            if (props.href?.startsWith('#track-')) {
                              const catalogNumber = parseInt(props.href.replace('#track-', ''), 10)
                              return (
                                <button 
                                  className="track-link-button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    if (!isNaN(catalogNumber)) setTargetCatalogNumber(catalogNumber)
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#60a5fa',
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    padding: 0,
                                    font: 'inherit'
                                  }}
                                >
                                  {props.children}
                                </button>
                              )
                            }
                            return <a {...props} target="_blank" rel="noopener noreferrer" />
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <div className="message-tools">
                      <span className="tool-icon">🛰️</span> Used: {msg.toolsUsed.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="message-wrapper assistant thinking">
              <div className="message-avatar">
                <Bot size={16} />
              </div>
              <div className="message-content thinking-content">
                <div className="thinking-indicator">
                  <div className="orbit-spinner"></div>
                  <span>AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="chat-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          {isLimitReached ? (
            <div className="limit-reached-message">
              You've reached the session limit. Please clear chat or reload to start a new conversation.
            </div>
          ) : (
            <>
              {turnsRemaining !== null && turnsRemaining <= 5 && (
                <div className="turns-warning">
                  {turnsRemaining} {turnsRemaining === 1 ? 'message' : 'messages'} remaining
                </div>
              )}
              <div className="input-wrapper">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value.substring(0, 1000))}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about satellites..."
                  disabled={isLoading || isLimitReached || cooldownRemaining > 0}
                  rows={1}
                />
                <button 
                  className="send-button"
                  onClick={handleSend}
                  disabled={!inputText.trim() || isLoading || isLimitReached || cooldownRemaining > 0}
                >
                  <Send size={18} />
                </button>
              </div>
              <div className={`char-counter ${isNearCharLimit ? 'warning' : ''}`}>
                {inputText.length}/1000
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
