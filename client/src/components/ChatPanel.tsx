import React, { useState, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '../stores/chatStore'
import { useGlobeStore } from '../stores/globeStore'
import { useObserverStore } from '../stores/observerStore'
import { Send, Bot, User, RefreshCw, MapPin, Sparkles, AlertCircle, ChevronDown } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './ChatPanel.css'

const SUGGESTED_QUERIES = [
  "Show me the ISS on the globe",
  "Highlight all Starlink satellites",
  "What satellites are overhead right now?",
  "When can I see the ISS tonight?",
  "Tell me about upcoming celestial events",
  "Track satellite 25544",
]

export const ChatPanel = memo(function ChatPanel() {
  const {
    messages, isLoading, error, turnsRemaining,
    sendMessage, clearChat, isOpen, setIsOpen, cooldownRemaining
  } = useChatStore()

  const setTargetCatalogNumber = useGlobeStore(s => s.setTargetCatalogNumber)
  const setActivePlanet        = useGlobeStore(s => s.setActivePlanet)
  const { locationName }       = useObserverStore()

  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = () => {
    if (inputText.trim() && inputText.length <= 1000 && turnsRemaining !== 0 && !isLoading && cooldownRemaining === 0) {
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

  const isLimitReached  = turnsRemaining === 0
  const isNearCharLimit = inputText.length > 900

  const panelVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.96 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 400, damping: 30 } },
    exit:   { opacity: 0, y: 16, scale: 0.96, transition: { duration: 0.2 } },
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="cp-overlay"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Header */}
          <div className="cp-header">
            <div className="cp-header-left">
              <div className="cp-ai-icon">
                <Sparkles size={16} color="var(--accent)" />
              </div>
              <div>
                <div className="cp-title">AI Copilot</div>
                {locationName && (
                  <div className="cp-location">
                    <MapPin size={10} />
                    {locationName.split(',')[0]}
                  </div>
                )}
              </div>
            </div>
            <div className="cp-header-actions">
              {messages.length > 0 && (
                <motion.button
                  className="btn-ghost btn-icon"
                  onClick={clearChat}
                  title="Clear chat"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <RefreshCw size={15} />
                </motion.button>
              )}
              <motion.button
                className="btn-ghost btn-icon"
                onClick={() => setIsOpen(false)}
                title="Close"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronDown size={16} />
              </motion.button>
            </div>
          </div>

          {/* Messages */}
          <div className="cp-messages">
            {messages.length === 0 ? (
              <motion.div
                className="cp-empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="cp-empty-icon">
                  <Bot size={28} color="var(--accent)" />
                </div>
                <h4>SpaceTracker AI</h4>
                <p>Ask me anything about satellites, orbits, and space situational awareness.</p>
                <div className="cp-suggestions">
                  {SUGGESTED_QUERIES.map((query, i) => (
                    <motion.button
                      key={i}
                      className="cp-suggestion-btn"
                      onClick={() => setInputText(query)}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      whileHover={{ scale: 1.01, x: 2 }}
                    >
                      {query}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  className={`cp-message cp-message--${msg.role}`}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i === messages.length - 1 ? 0 : 0, duration: 0.2 }}
                >
                  <div className="cp-avatar">
                    {msg.role === 'user'
                      ? <User size={13} />
                      : <Bot size={13} />
                    }
                  </div>
                  <div className="cp-bubble">
                    {msg.role === 'user' ? (
                      <span className="cp-text">{msg.content}</span>
                    ) : (
                      <div className="cp-markdown">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: ({ node, ...props }) => {
                              const linkStyle = {
                                background: 'none', border: 'none',
                                color: 'var(--accent)', textDecoration: 'underline',
                                cursor: 'pointer', padding: 0, font: 'inherit', minHeight: 'unset'
                              }
                              if (props.href?.startsWith('#track-')) {
                                const catalogNumber = parseInt(props.href.replace('#track-', ''), 10)
                                return (
                                  <button onClick={e => { e.preventDefault(); if (!isNaN(catalogNumber)) setTargetCatalogNumber(catalogNumber) }} style={linkStyle}>
                                    {props.children}
                                  </button>
                                )
                              }
                              if (props.href?.startsWith('#planet-')) {
                                const body = props.href.replace('#planet-', '')
                                return (
                                  <button onClick={e => { e.preventDefault(); if (body) setActivePlanet(body) }} style={linkStyle}>
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
                      <div className="cp-tools-used">
                        🛰️ {msg.toolsUsed.join(', ')}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}

            {/* Thinking indicator */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  className="cp-message cp-message--assistant"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="cp-avatar">
                    <Bot size={13} />
                  </div>
                  <div className="cp-bubble cp-thinking">
                    <span />
                    <span />
                    <span />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            {error && (
              <motion.div
                className="cp-error"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle size={14} />
                <span>{error}</span>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="cp-input-area">
            {!isLimitReached && turnsRemaining !== null && turnsRemaining <= 5 && (
              <div className="cp-turns-warning">
                {turnsRemaining} message{turnsRemaining !== 1 ? 's' : ''} remaining
              </div>
            )}
            {isLimitReached ? (
              <div className="cp-limit-message">
                Session limit reached. Clear chat to continue.
              </div>
            ) : (
              <div className={`cp-input-wrap ${inputText.length > 0 ? 'cp-input-active' : ''}`}>
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value.substring(0, 1000))}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about satellites, orbits, passes..."
                  disabled={isLoading || isLimitReached || cooldownRemaining > 0}
                  rows={1}
                  className="cp-textarea"
                />
                <motion.button
                  className={`cp-send-btn ${inputText.trim() && !isLoading ? 'cp-send-btn--active' : ''}`}
                  onClick={handleSend}
                  disabled={!inputText.trim() || isLoading || isLimitReached || cooldownRemaining > 0}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Send size={14} />
                </motion.button>
              </div>
            )}
            {inputText.length > 0 && (
              <div className={`cp-char-count ${isNearCharLimit ? 'cp-char-count--warn' : ''}`}>
                {inputText.length}/1000
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
