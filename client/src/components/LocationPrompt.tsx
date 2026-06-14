import React, { useState } from 'react'
import { MapPin, Search, AlertTriangle } from 'lucide-react'
import { useObserverStore } from '../stores/observerStore'
import { geocodeLocation } from '../api/aiApi'
import './LocationPrompt.css'

export const LocationPrompt: React.FC = () => {
  const { status, locate, setManualLocation } = useObserverStore()
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (status !== 'denied' && status !== 'error') return null

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await geocodeLocation(query)
      setManualLocation(result.latitude, result.longitude, result.displayName)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to find location. Please try another city.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="location-prompt-overlay">
      <div className="location-prompt-card">
        <div className="location-prompt-header">
          <AlertTriangle className="location-warning-icon" size={24} />
          <h2>Location Required</h2>
        </div>
        
        <p className="location-prompt-desc">
          SpaceTracker needs your location to predict satellite passes and show overhead satellites. 
          Since GPS access was denied or failed, please enter your city manually.
        </p>

        <form onSubmit={handleSearch} className="location-search-form">
          <div className="location-input-wrapper">
            <MapPin className="location-input-icon" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. London, Tokyo, New York"
              disabled={isLoading}
            />
          </div>
          <button type="submit" disabled={!query.trim() || isLoading} className="location-search-btn">
            {isLoading ? <span className="location-spinner"></span> : <Search size={18} />}
          </button>
        </form>

        {error && <div className="location-error-msg">{error}</div>}

        <div className="location-divider"><span>OR</span></div>

        <button onClick={locate} className="location-retry-btn">
          Retry GPS Location
        </button>
      </div>
    </div>
  )
}
