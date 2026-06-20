import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Pause, ChevronLeft, ChevronRight, LogOut, MessageSquare, Compass, Layers } from 'lucide-react'
import { CesiumGlobe } from '../components/CesiumGlobe'
import { useHistoryStore, type CategoryFilter } from '../stores/historyStore'
import { useGlobeStore } from '../stores/globeStore'
import { useSkyStore } from '../stores/skyStore'
import { useChatStore } from '../stores/chatStore'
import { milestones } from '../data/historyMilestones'
import './HistoryPage.css'

export function HistoryPage() {
  const navigate = useNavigate()
  const {
    activeYear, isPlaying, playbackSpeed, activeFilters, activeMilestoneId,
    setActiveYear, setIsPlaying, setPlaybackSpeed, toggleFilter,
    nextMilestone, prevMilestone, jumpToChapter
  } = useHistoryStore()

  const setHistoryMode = useGlobeStore((s) => s.setHistoryMode)
  const setViewMode = useSkyStore((s) => s.setViewMode)
  const setSelected = useGlobeStore((s) => s.setSelected)
  const { setIsOpen: setChatOpen, sendMessage } = useChatStore()

  // Setup history mode on mount
  useEffect(() => {
    setHistoryMode(true)
    setViewMode('globe')
    return () => {
      setHistoryMode(false)
      setSelected(undefined)
    }
  }, [setHistoryMode, setViewMode, setSelected])

  // Playback timer ticking through years
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      const nextYear = activeYear + 1
      if (nextYear > 2026) {
        setIsPlaying(false)
      } else {
        setActiveYear(nextYear)
      }
    }, 1500 / playbackSpeed)
    return () => clearInterval(interval)
  }, [isPlaying, activeYear, playbackSpeed, setActiveYear, setIsPlaying])

  const currentMilestone = useMemo(() => {
    return milestones.find((m) => m.id === activeMilestoneId) || null
  }, [activeMilestoneId])

  const chapterShortcuts = [
    { label: 'Space Age', year: 1957 },
    { label: 'Moon Race', year: 1961 },
    { label: 'Space Stations', year: 1971 },
    { label: 'Space Shuttle', year: 1981 },
    { label: 'Commercial Space', year: 2004 },
    { label: 'Megaconstellations', year: 2019 },
    { label: 'Modern Flight', year: 2021 }
  ]

  const layers: { label: string; value: CategoryFilter }[] = [
    { label: 'Human Spaceflight', value: 'Human Spaceflight' },
    { label: 'Moon Exploration', value: 'Moon Exploration' },
    { label: 'Space Stations', value: 'Space Stations' },
    { label: 'Telescopes', value: 'Telescopes' },
    { label: 'Commercial Space', value: 'Commercial Spaceflight' },
    { label: 'Megaconstellations', value: 'Megaconstellations' },
    { label: 'Deep Space', value: 'Deep Space Missions' },
    { label: 'Planetary Exploration', value: 'Planetary Exploration' },
    { label: 'Orbital Growth', value: 'Orbital Growth' }
  ]

  const askNarrator = () => {
    if (!currentMilestone) return
    const context = `CURRENT MILESTONE:\nTitle: ${currentMilestone.title}\nYear: ${currentMilestone.year}\nSummary: ${currentMilestone.summary}\nWhy it mattered: ${currentMilestone.whyThisMattered}`
    setChatOpen(true)
    void sendMessage(`Tell me more about the historical significance of ${currentMilestone.title} (${currentMilestone.year}).`, context)
  }

  return (
    <div className="history-page">
      <CesiumGlobe />

      {/* Exit Button */}
      <button className="history-exit-btn" onClick={() => navigate('/dashboard')} title="Exit History (Esc)">
        <LogOut size={16} /> Exit
      </button>

      {/* Left Sidebar: Narrative Museum Exhibit */}
      <aside className="history-narrative-panel glass">
        {currentMilestone ? (
          <div className="museum-card">
            <span className="museum-kicker">{currentMilestone.category}</span>
            <span className="museum-date">{currentMilestone.year}</span>
            <h1>{currentMilestone.title}</h1>
            
            <div className="museum-divider" />
            
            <p className="museum-summary">{currentMilestone.summary}</p>
            
            <div className="museum-significance">
              <h4>Why This Mattered</h4>
              <p>{currentMilestone.whyThisMattered}</p>
            </div>

            {currentMilestone.illustration && (
              <div className="museum-illustration">
                <img src={currentMilestone.illustration} alt={currentMilestone.title} />
              </div>
            )}

            <button className="btn-narrate" onClick={askNarrator}>
              <MessageSquare size={14} /> Discuss with Copilot
            </button>
          </div>
        ) : (
          <div className="museum-empty">
            <Compass size={32} className="empty-icon" />
            <h3>Humanity in Space</h3>
            <p>Press Play or scrub the timeline to explore major milestones of space flight.</p>
          </div>
        )}
      </aside>

      {/* Right Sidebar: Layer Filters */}
      <aside className="history-layers-panel glass">
        <div className="layers-header">
          <Layers size={16} color="var(--accent)" />
          <h3>Timeline Layers</h3>
        </div>
        <div className="layers-list">
          {layers.map((l) => (
            <label key={l.value} className="layer-checkbox-wrap">
              <input 
                type="checkbox" 
                checked={activeFilters.has(l.value)}
                onChange={() => toggleFilter(l.value)}
              />
              <span className="checkbox-custom" />
              <span className="layer-label">{l.label}</span>
            </label>
          ))}
        </div>
      </aside>

      {/* Bottom Panel: Scrubber, Chapters & Controls */}
      <div className="history-bottom-bar glass">
        {/* Chapter Shortcuts */}
        <div className="chapter-shortcuts">
          {chapterShortcuts.map((c) => (
            <button
              key={c.label}
              className={`chapter-btn ${activeYear >= c.year ? 'passed' : ''}`}
              onClick={() => jumpToChapter(c.year)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Timeline Control Row */}
        <div className="timeline-control-row">
          {/* Milestone skip controls */}
          <div className="milestone-controls">
            <button className="btn-skip" onClick={prevMilestone} title="Previous Milestone">
              <ChevronLeft size={18} />
            </button>
            <button 
              className={`btn-play-pause ${isPlaying ? 'playing' : ''}`}
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>
            <button className="btn-skip" onClick={nextMilestone} title="Next Milestone">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Year Scrubber */}
          <div className="scrubber-wrapper">
            <span className="scrubber-year start">1957</span>
            <input
              type="range"
              min="1957"
              max="2026"
              value={activeYear}
              onChange={(e) => setActiveYear(parseInt(e.target.value, 10))}
              className="timeline-slider"
            />
            <span className="scrubber-year end">2026</span>
          </div>

          {/* Speed selector */}
          <div className="speed-controls">
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                className={`speed-btn ${playbackSpeed === s ? 'active' : ''}`}
                onClick={() => setPlaybackSpeed(s)}
              >
                {s}x
              </button>
            ))}
          </div>

          <div className="active-year-display">
            {activeYear}
          </div>
        </div>
      </div>
    </div>
  )
}
