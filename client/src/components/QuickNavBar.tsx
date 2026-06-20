import { memo } from 'react'
import { motion } from 'framer-motion'
import { Satellite, Moon, Star, Navigation, Layers, Globe2, MapPin } from 'lucide-react'
import { useGlobeStore } from '../stores/globeStore'
import { useSkyStore } from '../stores/skyStore'
import './QuickNavBar.css'

type QuickAction = {
  id: string
  label: string
  icon: React.ReactNode
  accent?: string
  action: () => void
}

interface QuickNavBarProps {
  mapStyle: string
  onSetMapStyle: (style: any) => void
}

export const QuickNavBar = memo(function QuickNavBar({ mapStyle, onSetMapStyle }: QuickNavBarProps) {
  const setTargetCatalogNumber = useGlobeStore(s => s.setTargetCatalogNumber)
  const setFilterCategory      = useGlobeStore(s => s.setFilterCategory)
  const setActivePlanet        = useGlobeStore(s => s.setActivePlanet)
  const viewMode               = useSkyStore(s => s.viewMode)
  const setViewMode            = useSkyStore(s => s.setViewMode)

  const actions: QuickAction[] = [
    {
      id: 'iss',
      label: 'ISS',
      icon: <Satellite size={14} />,
      accent: 'var(--accent)',
      action: () => { setTargetCatalogNumber(25544); setFilterCategory(null) },
    },
    {
      id: 'starlink',
      label: 'Starlink',
      icon: <Star size={14} />,
      accent: '#818CF8',
      action: () => { setFilterCategory('COMMUNICATION') },
    },
    {
      id: 'gps',
      label: 'GPS',
      icon: <Navigation size={14} />,
      accent: 'var(--success)',
      action: () => { setFilterCategory('NAVIGATION') },
    },
    {
      id: 'all',
      label: 'All',
      icon: <Layers size={14} />,
      accent: 'var(--text-secondary)',
      action: () => { setFilterCategory(null) },
    },
    {
      id: 'moon',
      label: 'Moon',
      icon: <Moon size={14} />,
      accent: 'var(--warning)',
      action: () => { setActivePlanet('Moon') },
    },
  ]

  const mapStyleActions = [
    { id: 'satellite', label: 'Satellite', icon: <Globe2 size={14} /> },
    { id: 'map',       label: 'Map',       icon: <MapPin size={14} /> },
    { id: 'base',      label: 'Space',     icon: <Star size={14} /> },
  ]

  return (
    <motion.div
      className="qnb-container"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35, delay: 0.4 }}
    >
      {/* View Mode Toggle */}
      <div className="qnb-group glass">
        <motion.button
          className={`qnb-btn ${viewMode === 'globe' ? 'qnb-btn--active' : ''}`}
          onClick={() => setViewMode('globe')}
          title="3D Globe"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Globe2 size={14} />
          <span>Globe</span>
        </motion.button>
        <motion.button
          className={`qnb-btn ${viewMode === 'zenith' ? 'qnb-btn--active-zenith' : ''}`}
          onClick={() => setViewMode('zenith')}
          title="Zenith sky view"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <MapPin size={14} />
          <span>Zenith</span>
        </motion.button>
      </div>

      {/* Quick Jump Actions */}
      <div className="qnb-group glass">
        {actions.map((action, i) => (
          <motion.button
            key={action.id}
            className="qnb-btn"
            onClick={action.action}
            title={action.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span style={{ color: action.accent }}>{action.icon}</span>
            <span>{action.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Map Style */}
      <div className="qnb-group glass">
        {mapStyleActions.map(ms => (
          <motion.button
            key={ms.id}
            className={`qnb-btn ${mapStyle === ms.id ? 'qnb-btn--active' : ''}`}
            onClick={() => onSetMapStyle(ms.id)}
            title={`${ms.label} view`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {ms.icon}
            <span>{ms.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
})
