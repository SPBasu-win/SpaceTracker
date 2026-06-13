import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, Crosshair, Globe2, List, Settings, Star, MessageSquare } from 'lucide-react'
import { ChatPanel } from '../components/ChatPanel'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/globe', label: 'Globe', icon: Globe2 },
  { to: '/assets', label: 'Assets', icon: List },
  { to: '/tracked', label: 'Tracked', icon: Star },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell() {
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><Crosshair size={22} /> SpaceTracker</div>
        <nav>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main>
        <header className="topbar">
          <span>Orbital operations</span>
          <span>{new Date().toLocaleDateString()}</span>
        </header>
        <section className="content"><Outlet /></section>
      </main>
      
      <button 
        className={`chat-toggle-btn ${isChatOpen ? 'hidden' : ''}`}
        onClick={() => setIsChatOpen(true)}
        title="Open AI Assistant"
      >
        <MessageSquare size={24} />
      </button>

      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  )
}
