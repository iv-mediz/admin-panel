import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import Modal from '../components/Modal'
import StatusChip from '../components/StatusChip'
import { useDirectory } from '../data/directory'

const ROLES = ['All', 'Super Admin', 'Recruiter', 'Dispatch', 'Support', 'Hospital Relations', 'Operations']

const empty = {
  name: '',
  role: 'Support',
  email: '',
  phone: '',
  city: 'Hyderabad',
}

export default function Team() {
  const { team, addMember, setMemberStatus } = useDirectory()
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('All')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(empty)

  const filtered = useMemo(() => {
    return team.filter((m) => {
      const q = query.toLowerCase()
      const matchesQuery = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
      return matchesQuery && (role === 'All' || m.role === role)
    })
  }, [team, query, role])

  function submit(e) {
    e.preventDefault()
    addMember({
      id: `t${Date.now()}`,
      ...form,
      joined: 'Just now',
      status: 'Invited',
    })
    setForm(empty)
    setOpen(false)
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>Team</h3>
          <p>Internal iv mediz staff who run jobs, dispatch and hospital onboarding</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} />
          Add team member
        </button>
      </div>

      <section className="stats">
        <article className="stat-card">
          <div className="stat-label">Team members</div>
          <div className="stat-value">{team.length}</div>
          <div className="stat-meta up">{team.filter((m) => m.status === 'Active').length} active</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Recruiters</div>
          <div className="stat-value">{team.filter((m) => m.role === 'Recruiter').length}</div>
          <div className="stat-meta">Jobs & applications</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Dispatch</div>
          <div className="stat-value">{team.filter((m) => m.role === 'Dispatch').length}</div>
          <div className="stat-meta">Ambulance fleet</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Invites pending</div>
          <div className="stat-value">{team.filter((m) => m.status === 'Invited').length}</div>
          <div className="stat-meta">Waiting to join</div>
        </article>
      </section>

      <div className="toolbar">
        <div className="search">
          <Search size={16} color="#98A2B3" />
          <input placeholder="Search name or email" value={query} onChange={(e) => setQuery(e.target.value)} />
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
              <th>Member</th>
              <th>Role</th>
              <th>City</th>
              <th>Joined</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar">{m.name.slice(0, 1)}</div>
                    <div>
                      <div className="cell-title">{m.name}</div>
                      <div className="cell-sub">{m.email}</div>
                    </div>
                  </div>
                </td>
                <td>{m.role}</td>
                <td>{m.city}</td>
                <td>{m.joined}</td>
                <td>
                  <StatusChip label={m.status} />
                </td>
                <td className="row-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelected(m)}>
                    View
                  </button>
                  {m.status === 'Invited' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setMemberStatus(m.id, 'Active')}>
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty">No team members match this search</div>}
      </div>

      {open && (
        <Modal title="Add team member" onClose={() => setOpen(false)}>
          <form onSubmit={submit}>
            <div className="form-grid">
              <div className="field">
                <label>Full name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="field">
                <label>Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {ROLES.filter((r) => r !== 'All').map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="field">
                <label>Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              </div>
              <div className="field">
                <label>City</label>
                <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
                  <option>Hyderabad</option>
                  <option>Bengaluru</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary">Send invite</button>
            </div>
          </form>
        </Modal>
      )}

      {selected && (
        <Modal title="Team member" onClose={() => setSelected(null)}>
          <div className="cell-title" style={{ fontSize: 18 }}>
            {selected.name}
          </div>
          <p className="muted" style={{ margin: '6px 0 14px' }}>
            {selected.role} · {selected.city}
          </p>
          <div className="detail-grid">
            <div className="meta">
              <span>Email</span>
              <strong>{selected.email}</strong>
            </div>
            <div className="meta">
              <span>Phone</span>
              <strong>{selected.phone}</strong>
            </div>
            <div className="meta">
              <span>Joined</span>
              <strong>{selected.joined}</strong>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
