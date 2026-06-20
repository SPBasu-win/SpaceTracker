import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, Crosshair, Globe2, List, Settings, Star, Clock, ChevronRight } from 'lucide-react'
import { ChatPanel } from '../components/ChatPanel'
import { CommandPalette } from '../components/CommandPalette'
import { useChatStore } from '../stores/chatStore'
import { motion } from 'framer-motion'

const links = [
  { to: '/globe',    label: 'Globe',     icon: Globe2 },
  { to: '/dashboard',label: 'Dashboard', icon: BarChart3 },
  { to: '/history',  label: 'History',   icon: Clock },
  { to: '/assets',   label: 'Assets',    icon: List },
  { to: '/tracked',  label: 'Tracked',   icon: Star },
  { to: '/settings', label: 'Settings',  icon: Settings },
]

export function AppShell() {
  const { isOpen: isChatOpen, setIsOpen: setIsChatOpen } = useChatStore()
  const [isExpanded, setIsExpanded] = useState(true)
  const [cmdOpen, setCmdOpen] = useState(false)

  // Expose Ctrl+K globally
  useState(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  return (
    <div className={`app-shell ${isExpanded ? 'sidebar-expanded' : ''}`}>
      {/* Floating Toggle Button when Sidebar is fully collapsed */}
      {!isExpanded && (
        <button 
          className="floating-sidebar-toggle"
          onClick={() => setIsExpanded(true)}
          title="Expand navigation sidebar"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* Glassmorphism Sidebar */}
      <motion.aside
        className={`sidebar ${isExpanded ? 'expanded' : ''}`}
        initial={false}
      >
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Crosshair size={20} color="var(--accent)" />
          </div>
          <span className="sidebar-brand-name">SPACETRACKER</span>
        </div>

        {/* Navigation */}
        <nav>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={!isExpanded ? label : undefined}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <span className="nav-icon">
                <Icon size={18} />
              </span>
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Expand toggle */}
        <motion.button
          className="sidebar-toggle-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <ChevronRight size={16} />
        </motion.button>
      </motion.aside>

      {/* Main Content */}
      <main>
        {/* Topbar — hidden on globe/history via page-level override */}
        <header className="topbar">
          <span style={{ color: 'var(--text-secondary)', fontSize: '12px', letterSpacing: '0.05em', fontWeight: 500 }}>
            ORBITAL OPERATIONS
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              {new Date().toUTCString().slice(0, 25)} UTC
            </span>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                color: 'var(--success)', fontSize: '11px', fontWeight: 500,
                background: 'rgba(74, 222, 128, 0.1)', padding: '3px 8px',
                borderRadius: '999px', border: '1px solid rgba(74, 222, 128, 0.2)'
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
              LIVE
            </span>
          </div>
        </header>
        <section className="content">
          <Outlet />
        </section>
      </main>

      {/* AI Chat Button */}
      <button
        className={`chat-toggle-btn ${isChatOpen ? 'hidden' : ''}`}
        onClick={() => setIsChatOpen(true)}
        title="Open AI Copilot"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
        </svg>
      </button>

      {/* Chat Panel */}
      <ChatPanel />

      {/* Global Command Palette */}
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  )
}
