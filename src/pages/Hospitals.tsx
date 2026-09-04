import { Plus, Search, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import StatusChip from '../components/StatusChip'
import { useDirectory } from '../data/directory'
import type { OnboardLocationState } from '../types'

const TABS = ['All', 'Partner', 'Pending'] as const

export default function Hospitals() {
  const navigate = useNavigate()
  const location = useLocation()
  const { hospitals, setHospitalStatus } = useDirectory()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<(typeof TABS)[number]>('All')
  const [state, setState] = useState('All')
  const notice = (location.state as OnboardLocationState | null)?.justOnboarded

  const filtered = useMemo(() => {
    return hospitals.filter((h) => {
      const q = query.toLowerCase()
      const matchesQuery = !q || h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q)
      const matchesTab = tab === 'All' || h.status === tab
      return matchesQuery && matchesTab && (state === 'All' || h.state === state)
    })
  }, [hospitals, query, tab, state])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>Onboard hospitals</h3>
          <p>This is where hospitals join iv mediz and become hiring partners</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/hospitals/onboard')}>
          <Plus size={16} />
          Onboard hospital
        </button>
      </div>

      {notice && <div className="notice">{notice} was submitted and is waiting for approval.</div>}

      <div className="toolbar">
        <div className="search">
          <Search size={16} color="#98A2B3" />
          <input placeholder="Search hospital or city" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="select" value={state} onChange={(e) => setState(e.target.value)}>
          <option>All</option>
          <option>Karnataka</option>
          <option>Telangana</option>
        </select>
      </div>
      <div className="pills" style={{ marginBottom: 14 }}>
        {TABS.map((t) => (
          <button key={t} className={`pill ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Hospital</th>
              <th>City</th>
              <th>Open jobs</th>
              <th>Rating</th>
              <th>Contact</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((h) => (
              <tr key={h.id}>
                <td>
                  <div className="cell-title">{h.name}</div>
                  {h.type && <div className="cell-sub">{h.type}</div>}
                </td>
                <td>
                  {h.city}
                  <div className="cell-sub">{h.state}</div>
                </td>
                <td>{h.jobs}</td>
                <td>
                  {h.rating ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                      <Star size={14} color="#f59e0b" fill="#f59e0b" />
                      {h.rating}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td>{h.contact}</td>
                <td>
                  <StatusChip label={h.status} />
                </td>
                <td>
                  {h.status === 'Pending' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setHospitalStatus(h.id, 'Partner')}>
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
