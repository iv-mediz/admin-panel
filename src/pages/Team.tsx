import { Pencil, Plus, Search } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import CityDistrictSelect, { cityDistrictPayload } from '../components/CityDistrictSelect'
import LocationFilters from '../components/LocationFilters'
import Modal from '../components/Modal'
import ActiveToggle from '../components/ActiveToggle'
import { useDirectory } from '../data/directory'
import type { TeamMember, TeamRole } from '../types'
import { matchesLocation } from '../utils/locationFilter'

const ROLES = ['All', 'Super Admin', 'Recruiter', 'Dispatch', 'Support', 'Hospital Relations', 'Operations'] as const

interface MemberForm {
  name: string
  role: TeamRole
  email: string
  phone: string
  state: string
  cityDistrict: string
}

const empty: MemberForm = {
  name: '',
  role: 'Support',
  email: '',
  phone: '',
  state: 'Telangana',
  cityDistrict: '',
}

export default function Team() {
  const { team, addMember, updateMember, setMemberStatus, states } = useDirectory()
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<(typeof ROLES)[number]>('All')
  const [stateFilter, setStateFilter] = useState('All')
  const [districtFilter, setDistrictFilter] = useState('All')
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<TeamMember | null>(null)
  const [form, setForm] = useState<MemberForm>(empty)

  const filtered = useMemo(() => {
    return team.filter((m) => {
      const q = query.toLowerCase()
      const matchesQuery = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
      const matchesLoc = matchesLocation(m, stateFilter, districtFilter)
      return matchesQuery && matchesLoc && (role === 'All' || m.role === role)
    })
  }, [team, query, role, stateFilter, districtFilter])

  function closeModal() {
    setOpen(false)
    setEditingId(null)
    setForm(empty)
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const loc = cityDistrictPayload(form.cityDistrict)
    const patch = {
      name: form.name,
      role: form.role,
      email: form.email,
      phone: form.phone,
      city: loc.city,
      district: loc.district,
      state: form.state,
    }
    if (editingId) {
      updateMember(editingId, patch)
    } else {
      addMember({
        id: `t${Date.now()}`,
        ...patch,
        joined: 'Just now',
        status: 'Invited',
      })
    }
    closeModal()
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>Team</h3>
          <p>Internal iv mediz staff who run jobs, dispatch and hospital onboarding</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingId(null)
            setForm(empty)
            setOpen(true)
          }}
        >
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
        <LocationFilters
          state={stateFilter}
          district={districtFilter}
          onStateChange={setStateFilter}
          onDistrictChange={setDistrictFilter}
        />
        <select className="select" value={role} onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}>
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
              <th>Active</th>
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
                  <ActiveToggle
                    active={m.status === 'Active'}
                    ariaLabel={`${m.name} team access`}
                    onChange={(on) => setMemberStatus(m.id, on ? 'Active' : 'Invited')}
                  />
                </td>
                <td className="row-actions">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setEditingId(m.id)
                      setForm({
                        name: m.name,
                        role: m.role,
                        email: m.email,
                        phone: m.phone,
                        state: m.state,
                        cityDistrict: m.district || m.city,
                      })
                      setOpen(true)
                    }}
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelected(m)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty">No team members match this search</div>}
      </div>

      {open && (
        <Modal title={editingId ? 'Edit team member' : 'Add team member'} onClose={closeModal}>
          <form onSubmit={submit}>
            <div className="form-grid">
              <div className="field">
                <label>Full name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="field">
                <label>Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as TeamRole })}>
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
                <label>State</label>
                <select
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value, cityDistrict: '' })}
                >
                  {(states.length ? states : [{ id: 'ts', name: 'Telangana' }]).map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <CityDistrictSelect
                stateName={form.state}
                value={form.cityDistrict}
                onChange={(v) => setForm({ ...form, cityDistrict: v })}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn btn-primary">{editingId ? 'Save changes' : 'Send invite'}</button>
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
