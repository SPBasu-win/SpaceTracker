import { useState } from 'react'
import { motion } from 'framer-motion'
import { Crosshair, Search, Bell, Settings, Sparkles, Command } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useChatStore } from '../stores/chatStore'
import './FloatingTopBar.css'

interface FloatingTopBarProps {
  onOpenCommandPalette: () => void
}

export function FloatingTopBar({ onOpenCommandPalette }: FloatingTopBarProps) {
  const navigate = useNavigate()
  const { setIsOpen: setChatOpen } = useChatStore()
  const [notifCount] = useState(3)

  return (
    <motion.div
      className="ftb-wrapper"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.1 }}
    >
      <div className="ftb-bar glass">
        {/* Left: Logo */}
        <div className="ftb-left">
          <div className="ftb-logo">
            <Crosshair size={18} color="var(--accent)" />
            <span className="ftb-logo-text">SPACETRACKER</span>
          </div>

          {/* Live indicator */}
          <div className="ftb-live-badge">
            <span className="ftb-live-dot" />
            LIVE
          </div>
        </div>

        {/* Center: Search trigger */}
        <button
          className="ftb-search-trigger"
          onClick={onOpenCommandPalette}
          title="Open command palette (Ctrl+K)"
        >
          <Search size={14} color="var(--text-muted)" />
          <span className="ftb-search-placeholder">Search satellites, planets, launches...</span>
          <span className="ftb-search-kbd">
            <Command size={11} />K
          </span>
        </button>

        {/* Right: Actions */}
        <div className="ftb-right">
          <motion.button
            className="ftb-action-btn btn-ghost btn-icon"
            onClick={() => { setChatOpen(true) }}
            title="AI Copilot"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles size={16} color="var(--accent)" />
          </motion.button>

          <motion.button
            className="ftb-action-btn btn-ghost btn-icon ftb-notif-btn"
            title="Notifications"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell size={16} />
            {notifCount > 0 && (
              <span className="ftb-notif-badge">{notifCount}</span>
            )}
          </motion.button>

          <motion.button
            className="ftb-action-btn btn-ghost btn-icon"
            onClick={() => navigate('/settings')}
            title="Settings"
            whileHover={{ scale: 1.05, rotate: 45 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Settings size={16} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
