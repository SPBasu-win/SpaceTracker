import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { useTrackingStore } from '../stores/trackingStore'

export function TrackedPage() {
  const tracked = useTrackingStore((state) => state.tracked)
  const remove = useTrackingStore((state) => state.remove)

  return (
    <div>
      <div className="page-head"><h1>Tracked</h1><span>{tracked.length} bookmarks</span></div>
      <div className="list">
        {tracked.length === 0 ? <p>No tracked satellites yet. Add them from the globe or asset detail views.</p> : null}
        {tracked.map((item) => (
          <div className="list-row" key={item.catalogNumber}>
            <Link to={`/assets/${item.catalogNumber}`}>{item.name ?? item.catalogNumber}</Link>
            <button title="Remove bookmark" onClick={() => remove(item.catalogNumber)}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  )
}
