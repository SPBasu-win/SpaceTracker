import { useEffect, useState, memo } from 'react'
import { motion } from 'framer-motion'
import { listAssets, getOverhead } from '../api/orbitalApi'
import { useObserverStore } from '../stores/observerStore'
import './MetricsRibbon.css'

type Metric = {
  label: string
  value: number | string
  unit?: string
  accent?: string
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(value)

  useEffect(() => {
    if (displayed === value) return
    const diff = value - displayed
    const steps = 20
    const step = diff / steps
    let count = 0
    const timer = setInterval(() => {
      count++
      setDisplayed(prev => {
        const next = prev + step
        if (count >= steps) { clearInterval(timer); return value }
        return Math.round(next)
      })
    }, 25)
    return () => clearInterval(timer)
  }, [value])

  return <>{displayed.toLocaleString()}</>
}

export const MetricsRibbon = memo(function MetricsRibbon() {
  const { latitude, longitude } = useObserverStore()
  const [totalSats, setTotalSats]     = useState(0)
  const [visibleSats, setVisibleSats] = useState(0)
  const [countries, setCountries]     = useState(0)
  const [debrisCount, setDebrisCount] = useState(0)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const assets = await listAssets()
        if (!mounted) return
        setTotalSats(assets.length)
        const unique = new Set(assets.map((a: any) => a.originCountry).filter(Boolean))
        setCountries(unique.size)
        setDebrisCount(assets.filter((a: any) => a.assetClass === 'DEBRIS').length)
      } catch {/* ignore */}
    }
    load()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!latitude || !longitude) return
    let mounted = true
    getOverhead(latitude, longitude)
      .then((items: unknown[]) => { if (mounted) setVisibleSats(items.length) })
      .catch(() => {})
    return () => { mounted = false }
  }, [latitude, longitude])

  const metrics: Metric[] = [
    { label: 'Total Objects',  value: totalSats,   accent: 'var(--accent)' },
    { label: 'Visible Now',    value: visibleSats,  accent: 'var(--success)' },
    { label: 'Tracked Debris', value: debrisCount,  accent: 'var(--warning)' },
    { label: 'Countries',      value: countries,    accent: 'var(--info)' },
  ]

  return (
    <motion.div
      className="mr-ribbon glass"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35, delay: 0.5 }}
    >
      {metrics.map((m, i) => (
        <div key={m.label} className="mr-metric">
          <span className="mr-value" style={{ color: m.accent ?? 'var(--text-primary)' }}>
            {typeof m.value === 'number'
              ? <AnimatedNumber value={m.value} />
              : m.value
            }
            {m.unit && <span className="mr-unit">{m.unit}</span>}
          </span>
          <span className="mr-label">{m.label}</span>
          {i < metrics.length - 1 && <div className="mr-divider" />}
        </div>
      ))}
    </motion.div>
  )
})
