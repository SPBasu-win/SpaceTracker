import { useEffect, useMemo, useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, ChevronLeft, Radio, Satellite, Sparkles, AlertTriangle, Info } from 'lucide-react'
import { computeUpcomingEvents } from '../utils/celestialEvents'
import './ActivityFeed.css'

type FeedItem = {
  id: string
  type: 'pass' | 'launch' | 'celestial' | 'alert' | 'info'
  title: string
  detail: string
  time: string
  live?: boolean
}

function typeIcon(type: FeedItem['type']) {
  switch (type) {
    case 'pass':      return <Satellite size={12} />
    case 'launch':    return <Radio size={12} />
    case 'celestial': return <Sparkles size={12} />
    case 'alert':     return <AlertTriangle size={12} />
    default:          return <Info size={12} />
  }
}

function typeColor(type: FeedItem['type']) {
  switch (type) {
    case 'pass':      return 'var(--accent)'
    case 'launch':    return 'var(--success)'
    case 'celestial': return 'var(--warning)'
    case 'alert':     return 'var(--danger)'
    default:          return 'var(--info)'
  }
}

function generateStaticFeed(): FeedItem[] {
  return [
    { id: 's1', type: 'pass',      title: 'ISS pass starting',          detail: 'Max elevation 72° NNW',              time: '2m',   live: true },
    { id: 's2', type: 'launch',    title: 'Starlink launch upcoming',    detail: 'SpaceX · Cape Canaveral',            time: '4h' },
    { id: 's3', type: 'pass',      title: 'Hubble entering eclipse',     detail: 'NORAD 20580 · penumbra',             time: '6m' },
    { id: 's4', type: 'celestial', title: 'Jupiter at opposition',       detail: 'Best visibility in 3 years',         time: '2d' },
    { id: 's5', type: 'alert',     title: 'Solar activity elevated',     detail: 'Kp-index 5 · minor storm',           time: 'now', live: true },
    { id: 's6', type: 'pass',      title: 'Tiangong pass in 8 min',      detail: 'Max elevation 38° ENE',              time: '8m' },
    { id: 's7', type: 'info',      title: '25,547 objects tracked',      detail: 'Live TLE sync complete',             time: '1m',  live: true },
    { id: 's8', type: 'celestial', title: 'Perseids peak tonight',       detail: '80–100 meteors/hr expected',         time: '8h' },
  ]
}

interface ActivityFeedProps {
  isChatOpen?: boolean
}

export const ActivityFeed = memo(function ActivityFeed({ isChatOpen }: ActivityFeedProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [items, setItems] = useState<FeedItem[]>([])

  const now = useMemo(() => new Date(), [])
  const celestialEvents = useMemo(() => computeUpcomingEvents(now, 14), [now])

  useEffect(() => {
    const base = generateStaticFeed()
    // Inject real celestial events from astronomy-engine
    const celestialItems: FeedItem[] = celestialEvents.slice(0, 2).map((ev, i) => ({
      id: `cel-${i}`,
      type: 'celestial' as const,
      title: ev.title,
      detail: ev.description,
      time: `${Math.round((ev.date.getTime() - now.getTime()) / 86400000)}d`,
    }))
    setItems([...base.slice(0, 5), ...celestialItems])
  }, [celestialEvents, now])

  return (
    <motion.aside
      className={`af-panel glass ${collapsed ? 'af-collapsed' : ''} ${isChatOpen ? 'af-shifted' : ''}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35, delay: 0.3 }}
    >
      {/* Header */}
      <div className="af-header" onClick={() => setCollapsed(c => !c)}>
        {collapsed ? (
          <Activity size={16} color="var(--accent)" />
        ) : (
          <>
            <div className="af-header-left">
              <Activity size={14} color="var(--accent)" />
              <span className="af-title">Live Feed</span>
              <span className="af-live-dot" />
            </div>
            <motion.button
              className="af-toggle btn-ghost btn-icon"
              onClick={e => { e.stopPropagation(); setCollapsed(true) }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft size={14} />
            </motion.button>
          </>
        )}
      </div>

      {/* Items */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            className="af-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                className="af-item"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="af-item-dot" style={{ background: typeColor(item.type) }} />
                <div className="af-item-content">
                  <div className="af-item-header">
                    <span className="af-item-icon" style={{ color: typeColor(item.type) }}>
                      {typeIcon(item.type)}
                    </span>
                    <span className="af-item-title">{item.title}</span>
                    {item.live && <span className="af-live-badge">LIVE</span>}
                  </div>
                  <span className="af-item-detail">{item.detail}</span>
                </div>
                <span className="af-item-time">{item.time}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  )
})
