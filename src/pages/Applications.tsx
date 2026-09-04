import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import Modal from '../components/Modal'
import StatusChip from '../components/StatusChip'
import { applications as seed } from '../data/mock'
import type { Application, ApplicationStatus } from '../types'

const TABS = ['All', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Offer', 'Rejected'] as const

export default function Applications() {
  const [items, setItems] = useState<Application[]>(seed)
  const [tab, setTab] = useState<(typeof TABS)[number]>('All')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Application | null>(null)

  const filtered = useMemo(() => {
    return items.filter((app) => {
      const q = query.toLowerCase()
      const matchesQuery =
        !q || app.applicant.toLowerCase().includes(q) || app.jobTitle.toLowerCase().includes(q)
      return matchesQuery && (tab === 'All' || app.status === tab)
    })
  }, [items, tab, query])

  function updateStatus(id: string, status: ApplicationStatus) {
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    setSelected((cur) => (cur && cur.id === id ? { ...cur, status } : cur))
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>My Applications</h3>
          <p>Candidate pipeline from the mobile job applications flow</p>
        </div>
      </div>
      <div className="toolbar">
        <div className="search">
          <Search size={16} color="#98A2B3" />
          <input placeholder="Search applicant or role" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>
      <div className="pills" style={{ marginBottom: 14 }}>
        {TABS.map((t) => (
          <button key={t} className={`pill ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'Interview Scheduled' ? 'Interview' : t}
          </button>
        ))}
      </div>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Role</th>
              <th>Hospital</th>
              <th>Applied</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((app) => (
              <tr key={app.id}>
                <td>
                  <div className="cell-title">{app.applicant}</div>
                  <div className="cell-sub">
                    {app.role} · {app.experience}
                  </div>
                </td>
                <td>{app.jobTitle}</td>
                <td>
                  {app.hospital}
                  <div className="cell-sub">{app.location}</div>
                </td>
                <td>{app.appliedOn}</td>
                <td>
                  <StatusChip label={app.status} />
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelected(app)}>
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty">No applications in this tab</div>}
      </div>

      {selected && (
        <Modal title="Review application" onClose={() => setSelected(null)}>
          <div className="cell-title" style={{ fontSize: 18 }}>
            {selected.applicant}
          </div>
          <p className="muted" style={{ margin: '6px 0 14px' }}>
            {selected.jobTitle} at {selected.hospital}
          </p>
          <div className="detail-grid">
            <div className="meta">
              <span>Phone</span>
              <strong>{selected.phone}</strong>
            </div>
            <div className="meta">
              <span>Email</span>
              <strong>{selected.email}</strong>
            </div>
            <div className="meta">
              <span>Experience</span>
              <strong>{selected.experience}</strong>
            </div>
          </div>
          <label style={{ fontSize: 12, fontWeight: 700 }}>Update status</label>
          <select
            className="select"
            style={{ width: '100%', marginTop: 8 }}
            value={selected.status}
            onChange={(e) => updateStatus(selected.id, e.target.value as ApplicationStatus)}
          >
            {TABS.filter((t) => t !== 'All').map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Modal>
      )}
    </div>
  )
}
