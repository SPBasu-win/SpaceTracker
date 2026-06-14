import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, Crosshair, Globe2, List, Settings, Star, MessageSquare, Menu } from 'lucide-react'
import { ChatPanel } from '../components/ChatPanel'
import { useChatStore } from '../stores/chatStore'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/globe', label: 'Globe', icon: Globe2 },
  { to: '/assets', label: 'Assets', icon: List },
  { to: '/tracked', label: 'Tracked', icon: Star },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell() {
  const { isOpen: isChatOpen, setIsOpen: setIsChatOpen } = useChatStore()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className={`app-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="brand">
          {!isSidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Crosshair size={22} /> SpaceTracker
            </div>
          )}
          <button className="sidebar-toggle" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} title="Toggle Sidebar">
            <Menu size={20} />
          </button>
        </div>
        <nav>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')} title={isSidebarCollapsed ? label : undefined}>
              <Icon size={18} /> <span>{label}</span>
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

      <ChatPanel />
    </div>
  )
}
