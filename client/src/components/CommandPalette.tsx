import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Satellite, Globe2, Zap, Command, ArrowRight, X } from 'lucide-react'
import { useGlobeStore } from '../stores/globeStore'
import { useChatStore } from '../stores/chatStore'
import { useNavigate } from 'react-router-dom'
import './CommandPalette.css'

type CommandItem = {
  id: string
  category: 'satellite' | 'planet' | 'ai' | 'navigate' | 'filter'
  label: string
  description?: string
  icon?: React.ReactNode
  action: () => void
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

const STATIC_COMMANDS: Omit<CommandItem, 'action'>[] = [
  { id: 'iss',        category: 'satellite', label: 'Show ISS',                description: 'Fly to International Space Station (NORAD 25544)',   icon: <Satellite size={14} /> },
  { id: 'hubble',     category: 'satellite', label: 'Fly to Hubble',           description: 'Navigate to Hubble Space Telescope (NORAD 20580)',    icon: <Satellite size={14} /> },
  { id: 'starlink',   category: 'filter',    label: 'Show Starlink Satellites', description: 'Filter globe to Starlink constellation',              icon: <Globe2 size={14} /> },
  { id: 'military',   category: 'filter',    label: 'Show Military Satellites', description: 'Filter to military assets',                           icon: <Globe2 size={14} /> },
  { id: 'geo-ring',   category: 'ai',        label: 'Show GEO Ring',           description: 'Highlight geostationary orbit belt',                  icon: <Zap size={14} /> },
  { id: 'visible',    category: 'ai',        label: 'Visible Tonight',         description: 'Find satellites visible from your location',          icon: <Zap size={14} /> },
  { id: 'moon',       category: 'planet',    label: 'Fly to Moon',             description: 'Navigate to Moon in sky view',                        icon: <Globe2 size={14} /> },
  { id: 'mars',       category: 'planet',    label: 'Fly to Mars',             description: 'Navigate to Mars in sky view',                        icon: <Globe2 size={14} /> },
  { id: 'globe',      category: 'navigate',  label: 'Go to Globe',             description: 'Open the 3D satellite globe',                         icon: <Globe2 size={14} /> },
  { id: 'history',    category: 'navigate',  label: 'Space History',           description: 'Explore the history of spaceflight',                  icon: <ArrowRight size={14} /> },
  { id: 'assets',     category: 'navigate',  label: 'Browse Assets',           description: 'Search the satellite catalog',                        icon: <ArrowRight size={14} /> },
  { id: 'dashboard',  category: 'navigate',  label: 'Dashboard',               description: 'View platform statistics',                            icon: <ArrowRight size={14} /> },
]

const CATEGORY_LABELS: Record<string, string> = {
  satellite: 'Satellites',
  filter:    'Quick Filters',
  planet:    'Planets & Bodies',
  ai:        'AI Commands',
  navigate:  'Navigate',
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const setTargetCatalogNumber = useGlobeStore(s => s.setTargetCatalogNumber)
  const setFilterCategory = useGlobeStore(s => s.setFilterCategory)
  const setActivePlanet = useGlobeStore(s => s.setActivePlanet)
  const { sendMessage, setIsOpen: setChatOpen } = useChatStore()
  const navigate = useNavigate()

  const buildCommands = useCallback((): CommandItem[] => {
    return STATIC_COMMANDS.map(cmd => ({
      ...cmd,
      action: () => {
        onClose()
        switch (cmd.id) {
          case 'iss':       setTargetCatalogNumber(25544);              navigate('/globe'); break
          case 'hubble':    setTargetCatalogNumber(20580);              navigate('/globe'); break
          case 'starlink':  setFilterCategory('COMMUNICATION');         navigate('/globe'); break
          case 'military':  setFilterCategory('MILITARY');              navigate('/globe'); break
          case 'geo-ring':
            setChatOpen(true)
            sendMessage('Show me the GEO ring and highlight geostationary satellites')
            navigate('/globe')
            break
          case 'visible':
            setChatOpen(true)
            sendMessage('Which satellites are visible from my location tonight?')
            navigate('/globe')
            break
          case 'moon':      setActivePlanet('Moon');                    navigate('/globe'); break
          case 'mars':      setActivePlanet('Mars');                    navigate('/globe'); break
          case 'globe':     navigate('/globe');       break
          case 'history':   navigate('/history');     break
          case 'assets':    navigate('/assets');      break
          case 'dashboard': navigate('/dashboard');   break
        }
      }
    }))
  }, [onClose, setTargetCatalogNumber, setFilterCategory, setActivePlanet, sendMessage, setChatOpen, navigate])

  const filtered = buildCommands().filter(cmd =>
    !query || cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description?.toLowerCase().includes(query.toLowerCase())
  )

  // Group by category
  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = []
    acc[cmd.category].push(cmd)
    return acc
  }, {})

  const flatList = filtered

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, flatList.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      flatList[selectedIndex]?.action()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  // Track global index across groups
  let globalIdx = 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="cmd-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            className="cmd-palette"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          >
            {/* Search Input */}
            <div className="cmd-search-wrap">
              <Search size={16} className="cmd-search-icon" />
              <input
                ref={inputRef}
                className="cmd-search-input"
                placeholder="Search satellites, planets, launches, operators..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className="cmd-close-btn btn-ghost btn-icon" onClick={onClose} title="Close">
                <X size={14} />
              </button>
            </div>

            {/* Keyboard hint */}
            <div className="cmd-hint-bar">
              <span className="cmd-kbd"><Command size={11} />K</span>
              <span className="cmd-hint-text">to toggle · </span>
              <span className="cmd-kbd">↑↓</span>
              <span className="cmd-hint-text">to navigate · </span>
              <span className="cmd-kbd">↵</span>
              <span className="cmd-hint-text">to select</span>
            </div>

            {/* Results */}
            <div className="cmd-results">
              {flatList.length === 0 ? (
                <div className="cmd-empty">
                  <Satellite size={32} opacity={0.3} />
                  <p>No results for "{query}"</p>
                </div>
              ) : (
                Object.entries(grouped).map(([category, items]) => (
                  <div key={category} className="cmd-group">
                    <div className="cmd-group-label">{CATEGORY_LABELS[category] ?? category}</div>
                    {items.map(item => {
                      const idx = globalIdx++
                      return (
                        <motion.button
                          key={item.id}
                          className={`cmd-item ${selectedIndex === idx ? 'selected' : ''}`}
                          onClick={item.action}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          whileHover={{ x: 2 }}
                          transition={{ duration: 0.1 }}
                        >
                          <span className="cmd-item-icon">{item.icon}</span>
                          <span className="cmd-item-content">
                            <span className="cmd-item-label">{item.label}</span>
                            {item.description && (
                              <span className="cmd-item-desc">{item.description}</span>
                            )}
                          </span>
                          <ArrowRight size={12} className="cmd-item-arrow" />
                        </motion.button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
