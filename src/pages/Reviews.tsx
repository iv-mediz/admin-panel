import { Eye, EyeOff, Search, Star, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchReviews, updateReviewStatus } from '../api/admin'
import Modal from '../components/Modal'
import StatusChip from '../components/StatusChip'
import type { Review, ReviewStatus, ReviewTargetType } from '../types'

const TABS = ['All', 'published', 'hidden', 'removed'] as const
const TYPES: Array<ReviewTargetType | 'All'> = ['All', 'hospital', 'ambulance', 'employee']

function stars(value: number) {
  return '★'.repeat(value) + '☆'.repeat(Math.max(0, 5 - value))
}

function formatWhen(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function typeLabel(type: ReviewTargetType) {
  if (type === 'ambulance') return 'Ambulance'
  if (type === 'employee') return 'Employee'
  return 'Hospital'
}

export default function Reviews() {
  const [rows, setRows] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<(typeof TABS)[number]>('All')
  const [type, setType] = useState<(typeof TYPES)[number]>('All')
  const [selected, setSelected] = useState<Review | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchReviews({
        status: tab === 'All' ? undefined : tab,
        targetType: type === 'All' ? undefined : type,
        q: query.trim() || undefined,
      })
      setRows(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load reviews')
    } finally {
      setLoading(false)
    }
  }, [query, tab, type])

  useEffect(() => {
    void load()
  }, [load])

  const stats = useMemo(() => {
    return {
      total: rows.length,
      published: rows.filter((r) => r.status === 'published').length,
      hidden: rows.filter((r) => r.status === 'hidden').length,
      flagged: rows.filter((r) => r.status !== 'published').length,
    }
  }, [rows])

  async function setStatus(id: string, status: ReviewStatus) {
    const updated = await updateReviewStatus(id, status)
    setRows((current) => current.map((row) => (row.id === id ? updated : row)))
    setSelected((current) => (current?.id === id ? updated : current))
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>Ratings & reviews</h3>
          <p>Monitor feedback for hospitals, ambulance services, and employees</p>
        </div>
      </div>

      <section className="stats">
        <article className="stat-card">
          <div className="stat-label">Loaded</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-meta">Matching current filters</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Published</div>
          <div className="stat-value">{stats.published}</div>
          <div className="stat-meta">Visible on profiles</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Hidden / removed</div>
          <div className="stat-value">{stats.flagged}</div>
          <div className="stat-meta">{stats.hidden} hidden</div>
        </article>
      </section>

      <div className="toolbar">
        <label className="search">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reviewer, target, or comment"
          />
        </label>
        <select value={type} onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}>
          {TYPES.map((item) => (
            <option key={item} value={item}>
              {item === 'All' ? 'All targets' : typeLabel(item)}
            </option>
          ))}
        </select>
        <div className="tabs">
          {TABS.map((item) => (
            <button
              key={item}
              className={`tab ${tab === item ? 'active' : ''}`}
              onClick={() => setTab(item)}
            >
              {item === 'All' ? 'All' : item}
            </button>
          ))}
        </div>
      </div>

      {loading ? <p className="hint">Loading reviews…</p> : null}
      {error ? <p className="hint" style={{ color: '#b91c1c' }}>{error}</p> : null}

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Target</th>
              <th>Reviewer</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>When</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px 16px', color: '#667085' }}>
                  No reviews yet.
                </td>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className="cell-title">{row.targetName || row.targetId}</div>
                  <div className="cell-sub">{typeLabel(row.targetType)}</div>
                </td>
                <td>
                  <div className="cell-title">{row.reviewerName}</div>
                  <div className="cell-sub">{row.reviewerRole || '—'}</div>
                </td>
                <td>
                  <span style={{ color: '#d97706', letterSpacing: 1 }}>{stars(row.rating)}</span>
                  <div className="cell-sub">{row.rating} / 5</div>
                </td>
                <td style={{ maxWidth: 320 }}>
                  <div className="cell-title" style={{ fontWeight: 500 }}>
                    {row.comment || <span className="muted">No written feedback</span>}
                  </div>
                </td>
                <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                  {formatWhen(row.createdAt)}
                </td>
                <td>
                  <StatusChip label={row.status === 'published' ? 'Active' : row.status === 'hidden' ? 'Paused' : 'Closed'} />
                </td>
                <td>
                  <div className="row-actions">
                    <button className="icon-btn" title="View" onClick={() => setSelected(row)}>
                      <Star size={16} />
                    </button>
                    {row.status !== 'published' ? (
                      <button className="icon-btn" title="Publish" onClick={() => void setStatus(row.id, 'published')}>
                        <Eye size={16} />
                      </button>
                    ) : (
                      <button className="icon-btn" title="Hide" onClick={() => void setStatus(row.id, 'hidden')}>
                        <EyeOff size={16} />
                      </button>
                    )}
                    {row.status !== 'removed' ? (
                      <button className="icon-btn" title="Remove" onClick={() => void setStatus(row.id, 'removed')}>
                        <Trash2 size={16} />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected ? (
        <Modal title="Review detail" onClose={() => setSelected(null)}>
          <p className="muted">{typeLabel(selected.targetType)} · {selected.targetName}</p>
          <p style={{ color: '#d97706', letterSpacing: 1 }}>{stars(selected.rating)} ({selected.rating}/5)</p>
          <p>{selected.comment || 'No written feedback'}</p>
          <p className="muted">By {selected.reviewerName} · {formatWhen(selected.createdAt)}</p>
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
            {selected.status !== 'published' ? (
              <button className="btn btn-primary" onClick={() => void setStatus(selected.id, 'published')}>
                Publish
              </button>
            ) : (
              <button className="btn btn-outline" onClick={() => void setStatus(selected.id, 'hidden')}>
                Hide
              </button>
            )}
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
