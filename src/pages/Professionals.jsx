import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import Modal from '../components/Modal'
import StatusChip from '../components/StatusChip'
import { professionals } from '../data/mock'

const ROLES = ['All', 'Doctor', 'Staff Nurse', 'OT Nurse', 'Pharmacist', 'Allied Health']

export default function Professionals() {
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('All')
  const [selected, setSelected] = useState(null)

  const filtered = useMemo(() => {
    return professionals.filter((u) => {
      const q = query.toLowerCase()
      const matchesQuery = !q || u.name.toLowerCase().includes(q) || u.specialization.toLowerCase().includes(q)
      return matchesQuery && (role === 'All' || u.role === role)
    })
  }, [query, role])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>Professionals</h3>
          <p>Users who signed up on the iv mediz mobile app</p>
        </div>
      </div>
      <div className="toolbar">
        <div className="search">
          <Search size={16} color="#98A2B3" />
          <input placeholder="Search name or speciality" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r === 'All' ? 'All roles' : r}
            </option>
          ))}
        </select>
      </div>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Professional</th>
              <th>Role</th>
              <th>Location</th>
              <th>Profile</th>
              <th>Applications</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar">{user.name.replace('Dr. ', '').slice(0, 1)}</div>
                    <div>
                      <div className="cell-title">{user.name}</div>
                      <div className="cell-sub">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  {user.role}
                  <div className="cell-sub">{user.specialization}</div>
                </td>
                <td>{user.location}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress">
                      <span style={{ width: `${user.completion}%` }} />
                    </div>
                    <span className="muted">{user.completion}%</span>
                  </div>
                </td>
                <td>{user.applications}</td>
                <td>
                  <StatusChip label={user.status} />
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelected(user)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <Modal title="Professional profile" onClose={() => setSelected(null)}>
          <div className="cell-title" style={{ fontSize: 18 }}>
            {selected.name}
          </div>
          <p className="muted">
            {selected.role} · {selected.specialization}
          </p>
          <div className="detail-grid">
            <div className="meta">
              <span>Phone</span>
              <strong>{selected.phone}</strong>
            </div>
            <div className="meta">
              <span>Experience</span>
              <strong>{selected.experience}</strong>
            </div>
            <div className="meta">
              <span>Location</span>
              <strong>{selected.location}</strong>
            </div>
          </div>
          <p className="muted">Profile completion {selected.completion}% — same sections as Complete Profile in the app.</p>
        </Modal>
      )}
    </div>
  )
}
