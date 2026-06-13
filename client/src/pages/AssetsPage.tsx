import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAssetStore } from '../stores/assetStore'
import type { AssetClass } from '../types/orbital'
import { formatDate } from '../utils/format'

const classes: AssetClass[] = ['COMMUNICATION', 'NAVIGATION', 'EARTH_OBSERVATION', 'WEATHER', 'MILITARY', 'SCIENTIFIC', 'CREWED', 'DEBRIS', 'OTHER']

export function AssetsPage() {
  const { assets, search, assetClass, page, pageSize, loading, setSearch, setAssetClass, setPage, load } = useAssetStore()
  useEffect(() => { void load() }, [load, search, assetClass])
  const pageItems = assets.slice((page - 1) * pageSize, page * pageSize)
  const pages = Math.max(1, Math.ceil(assets.length / pageSize))

  return (
    <div>
      <div className="page-head"><h1>Assets</h1><span>{loading ? 'Loading' : `${assets.length} loaded`}</span></div>
      <div className="toolbar">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or catalog number" />
        <select value={assetClass ?? ''} onChange={(event) => setAssetClass((event.target.value || undefined) as AssetClass | undefined)}>
          <option value="">All classes</option>
          {classes.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Catalog</th><th>Class</th><th>Operator</th><th>Country</th><th>Updated</th></tr></thead>
          <tbody>
            {pageItems.map((asset) => (
              <tr key={asset.catalogNumber}>
                <td><Link to={`/assets/${asset.catalogNumber}`}>{asset.displayName ?? 'Unnamed asset'}</Link></td>
                <td>{asset.catalogNumber}</td>
                <td>{asset.assetClass}</td>
                <td>{asset.operatorName ?? 'n/a'}</td>
                <td>{asset.originCountry ?? 'n/a'}</td>
                <td>{formatDate(asset.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span>{page} / {pages}</span>
        <button disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  )
}
