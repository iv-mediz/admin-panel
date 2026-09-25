import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import LocationFilters from '../components/LocationFilters'
import { resolveMediaUrl } from '../components/HospitalImageUpload'
import Modal from '../components/Modal'
import StatusChip from '../components/StatusChip'
import { useDirectory } from '../data/directory'
import type { Application, ApplicationStatus } from '../types'
import { matchesLocation } from '../utils/locationFilter'

const TABS = ['All', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Offer', 'Rejected'] as const
const EMPLOYMENT = ['All', 'Full Time', 'Part Time', 'Locum'] as const

export default function Applications() {
  const { applications: items, updateApplicationStatus, loading, error } = useDirectory()
  const [tab, setTab] = useState<(typeof TABS)[number]>('All')
  const [query, setQuery] = useState('')
  const [employment, setEmployment] = useState<(typeof EMPLOYMENT)[number]>('All')
  const [stateFilter, setStateFilter] = useState('All')
  const [districtFilter, setDistrictFilter] = useState('All')
  const [selected, setSelected] = useState<Application | null>(null)

  const filtered = useMemo(() => {
    return items.filter((app) => {
      const q = query.toLowerCase()
      const matchesQuery =
        !q || app.applicant.toLowerCase().includes(q) || app.jobTitle.toLowerCase().includes(q)
      const matchesTab = tab === 'All' || app.status === tab
      const matchesEmployment = employment === 'All' || app.employmentPreference === employment
      const matchesLoc = matchesLocation(app, stateFilter, districtFilter)
      return matchesQuery && matchesTab && matchesEmployment && matchesLoc
    })
  }, [items, tab, query, employment, stateFilter, districtFilter])

  function updateStatus(id: string, status: ApplicationStatus) {
    updateApplicationStatus(id, status)
    setSelected((cur) => (cur && cur.id === id ? { ...cur, status } : cur))
  }

  return (
    <div className="page">
      {loading ? <p className="hint">Loading applications…</p> : null}
      {error ? <p className="hint" style={{ color: '#b91c1c' }}>{error}</p> : null}
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
        <LocationFilters
          state={stateFilter}
          district={districtFilter}
          onStateChange={setStateFilter}
          onDistrictChange={setDistrictFilter}
        />
        <select
          className="select"
          value={employment}
          onChange={(e) => setEmployment(e.target.value as (typeof EMPLOYMENT)[number])}
        >
          {EMPLOYMENT.map((t) => (
            <option key={t} value={t}>
              {t === 'All' ? 'All employment' : t}
            </option>
          ))}
        </select>
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
              <th>Looking for</th>
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
                <td>
                  <StatusChip label={app.employmentPreference} />
                  {app.timeAvailability && app.timeAvailability.length > 0 && (
                    <div className="cell-sub">{app.timeAvailability.join(', ')}</div>
                  )}
                </td>
                <td>{app.jobTitle}</td>
                <td>
                  {app.hospital}
                  <div className="cell-sub">
                    {app.district}, {app.state}
                  </div>
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
        {filtered.length === 0 && (
          <div className="empty">
            {items.length === 0
              ? 'No applications yet — they appear here when candidates apply from the mobile app (Under Review).'
              : 'No applications in this tab — try All or Under Review.'}
          </div>
        )}
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
              <span>Looking for</span>
              <strong>{selected.employmentPreference}</strong>
            </div>
            <div className="meta">
              <span>Phone</span>
              <strong>{selected.phone}</strong>
            </div>
            <div className="meta">
              <span>Email</span>
              <strong>{selected.email}</strong>
            </div>
            <div className="meta">
              <span>Resume</span>
              <strong>
                {resolveMediaUrl(selected.resumeUrl) ? (
                  <a href={resolveMediaUrl(selected.resumeUrl)!} target="_blank" rel="noreferrer">
                    View resume
                  </a>
                ) : (
                  'Not uploaded'
                )}
              </strong>
            </div>
            <div className="meta">
              <span>Experience</span>
              <strong>{selected.experience}</strong>
            </div>
            <div className="meta">
              <span>Location</span>
              <strong>
                {selected.district}, {selected.state}
              </strong>
            </div>
          </div>
          {selected.timeAvailability && selected.timeAvailability.length > 0 && (
            <>
              <p className="muted" style={{ marginTop: 12, marginBottom: 6 }}>
                Time availability
              </p>
              <div className="pills">
                {selected.timeAvailability.map((slot) => (
                  <span key={slot} className="chip chip-review">
                    {slot}
                  </span>
                ))}
              </div>
            </>
          )}
          <label style={{ fontSize: 12, fontWeight: 700, marginTop: 14, display: 'block' }}>Update status</label>
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
