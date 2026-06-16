import { useMemo, useState } from 'react'
import { CalendarDays, Sparkles, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'
import { computeUpcomingEvents } from '../utils/celestialEvents'
import { useChatStore } from '../stores/chatStore'
import { useObserverStore } from '../stores/observerStore'
import './CelestialEventsPanel.css'

function relativeDays(date: Date, from: Date): string {
  const days = Math.round((date.getTime() - from.getTime()) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days < 7) return `in ${days} days`
  if (days < 14) return 'in 1 week'
  return `in ${Math.round(days / 7)} weeks`
}

/**
 * Project Zenith celestial events feed: Moon phases, meteor showers and the next
 * lunar eclipse, computed locally via astronomy-engine. The "Ask the AI" action
 * delegates harder/event-specific queries (conjunctions, regional solar eclipses)
 * to the assistant's web search.
 */
export function CelestialEventsPanel() {
  const [collapsed, setCollapsed] = useState(false)
  const { setIsOpen, sendMessage } = useChatStore()
  const isChatOpen = useChatStore((s) => s.isOpen)
  const { locationName } = useObserverStore()

  // Stable "now" per mount; events update on remount/navigation.
  const now = useMemo(() => new Date(), [])
  const events = useMemo(() => computeUpcomingEvents(now, 45), [now])

  const askAi = () => {
    setIsOpen(true)
    const where = locationName ? ` from ${locationName}` : ''
    void sendMessage(`What notable celestial events are coming up${where} in the next few weeks?`)
  }

  return (
    <section className={`events-panel ${collapsed ? 'collapsed' : ''} ${isChatOpen ? 'shifted' : ''}`}>
      <header className="events-head" onClick={() => setCollapsed((c) => !c)}>
        <span className="events-title"><Sparkles size={16} /> Celestial Events</span>
        <button className="events-collapse" aria-label="Toggle events panel">
          {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </header>

      {!collapsed && (
        <>
          <ul className="events-list">
            {events.length === 0 && <li className="events-empty">No notable events in the next 45 days.</li>}
            {events.map((e, i) => (
              <li key={`${e.title}-${i}`} className={`event-row kind-${e.kind}`}>
                <span className="event-icon" aria-hidden>{e.icon}</span>
                <div className="event-body">
                  <div className="event-row-head">
                    <span className="event-title">{e.title}</span>
                    <span className="event-when">{relativeDays(e.date, now)}</span>
                  </div>
                  <div className="event-date">
                    <CalendarDays size={11} />{' '}
                    {e.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <p className="event-desc">{e.description}</p>
                </div>
              </li>
            ))}
          </ul>
          <button className="events-ask-ai" onClick={askAi}>
            <MessageSquare size={14} /> Ask the AI about events
          </button>
        </>
      )}
    </section>
  )
}
