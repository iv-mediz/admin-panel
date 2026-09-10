import { Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import LocationFilters from '../components/LocationFilters'
import Modal from '../components/Modal'
import StatusChip from '../components/StatusChip'
import { useDirectory } from '../data/directory'
import type { JobType, Professional } from '../types'
import { matchesLocation } from '../utils/locationFilter'

const ROLES = ['All', 'Doctor', 'Staff Nurse', 'OT Nurse', 'Pharmacist', 'Allied Health'] as const
const EMPLOYMENT = ['All', 'Full Time', 'Part Time', 'Locum'] as const
const AVAILABILITY_OPTIONS = [
  'Weekday mornings',
  'Weekday evenings',
  'Weekends',
  'Night shift',
  'Saturday mornings',
  'Mon–Wed',
  'Flexible hours',
] as const

interface UserForm {
  name: string
  email: string
  phone: string
  role: string
  specialization: string
  state: string
  district: string
  experience: string
  employmentPreference: JobType
  timeAvailability: string[]
}

const emptyForm: UserForm = {
  name: '',
  email: '',
  phone: '',
  role: 'Staff Nurse',
  specialization: '',
  state: 'Telangana',
  district: 'Hyderabad',
  experience: '',
  employmentPreference: 'Full Time',
  timeAvailability: [],
}

export default function Professionals() {
  const { professionals, states, cities, addProfessional, removeProfessional } = useDirectory()
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<(typeof ROLES)[number]>('All')
  const [employment, setEmployment] = useState<(typeof EMPLOYMENT)[number]>('All')
  const [stateFilter, setStateFilter] = useState('All')
  const [districtFilter, setDistrictFilter] = useState('All')
  const [selected, setSelected] = useState<Professional | null>(null)
  const [open, setOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Professional | null>(null)
  const [form, setForm] = useState<UserForm>(emptyForm)

  const filtered = useMemo(() => {
    return professionals.filter((u) => {
      const q = query.toLowerCase()
      const matchesQuery = !q || u.name.toLowerCase().includes(q) || u.specialization.toLowerCase().includes(q)
      const matchesRole = role === 'All' || u.role === role
      const matchesEmployment = employment === 'All' || u.employmentPreference === employment
      const matchesLoc = matchesLocation(u, stateFilter, districtFilter)
      return matchesQuery && matchesRole && matchesEmployment && matchesLoc
    })
  }, [professionals, query, role, employment, stateFilter, districtFilter])

  function setField<K extends keyof UserForm>(key: K, value: UserForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleAvailability(slot: string) {
    setForm((prev) => ({
      ...prev,
      timeAvailability: prev.timeAvailability.includes(slot)
        ? prev.timeAvailability.filter((s) => s !== slot)
        : [...prev.timeAvailability, slot],
    }))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const location = `${form.district}, ${form.state}`
    addProfessional({
      id: `u${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      role: form.role,
      specialization: form.specialization.trim(),
      location,
      state: form.state,
      district: form.district,
      experience: form.experience.trim(),
      completion: 20,
      status: 'Pending',
      applications: 0,
      employmentPreference: form.employmentPreference,
      timeAvailability:
        form.employmentPreference === 'Full Time' ? undefined : form.timeAvailability.length ? form.timeAvailability : undefined,
    })
    setForm(emptyForm)
    setOpen(false)
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>Professionals</h3>
          <p>Users who signed up on the iv mediz mobile app</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} />
          Add user
        </button>
      </div>
      <div className="toolbar">
        <div className="search">
          <Search size={16} color="#98A2B3" />
          <input placeholder="Search name or speciality" value={query} onChange={(e) => setQuery(e.target.value)} />
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
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Professional</th>
              <th>Role</th>
              <th>Location</th>
              <th>Looking for</th>
              <th>Profile</th>
              <th>Subscription</th>
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
                <td>
                  {user.district}
                  <div className="cell-sub">{user.state}</div>
                </td>
                <td>
                  <StatusChip label={user.employmentPreference} />
                  {user.timeAvailability && user.timeAvailability.length > 0 && (
                    <div className="cell-sub">{user.timeAvailability.join(', ')}</div>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress">
                      <span style={{ width: `${user.completion}%` }} />
                    </div>
                    <span className="muted">{user.completion}%</span>
                  </div>
                </td>
                <td>
                  {user.subscriptionPlan ? (
                    <>
                      <div className="cell-title">{user.subscriptionPlan}</div>
                      <div className="cell-sub">{user.subscriptionStatus ?? 'None'}</div>
                    </>
                  ) : (
                    <span className="muted">None</span>
                  )}
                </td>
                <td>
                  <StatusChip label={user.status} />
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelected(user)}>
                      View
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setDeleteTarget(user)} aria-label="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty">No professionals match your filters</div>}
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
              <strong>
                {selected.district}, {selected.state}
              </strong>
            </div>
            <div className="meta">
              <span>Looking for</span>
              <strong>{selected.employmentPreference}</strong>
            </div>
          </div>
          {selected.timeAvailability && selected.timeAvailability.length > 0 && (
            <>
              <p className="muted" style={{ marginTop: 12, marginBottom: 6 }}>
                Time availability (visible to employers)
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
          <p className="muted" style={{ marginTop: 14 }}>
            Profile completion {selected.completion}% — same sections as Complete Profile in the app.
          </p>
        </Modal>
      )}

      {open && (
        <Modal title="Add professional" onClose={() => setOpen(false)}>
          <form className="form-grid" onSubmit={submit}>
            <div className="field">
              <label>Full name</label>
              <input value={form.name} onChange={(e) => setField('name', e.target.value)} required />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} required />
            </div>
            <div className="field">
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => setField('phone', e.target.value)} required />
            </div>
            <div className="field">
              <label>Role</label>
              <select value={form.role} onChange={(e) => setField('role', e.target.value)}>
                {ROLES.filter((r) => r !== 'All').map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Specialization</label>
              <input value={form.specialization} onChange={(e) => setField('specialization', e.target.value)} required />
            </div>
            <div className="field">
              <label>Experience</label>
              <input value={form.experience} onChange={(e) => setField('experience', e.target.value)} placeholder="e.g. 3 Years" required />
            </div>
            <div className="field">
              <label>State</label>
              <select value={form.state} onChange={(e) => setField('state', e.target.value)}>
                {states.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>District</label>
              <select value={form.district} onChange={(e) => setField('district', e.target.value)}>
                {cities
                  .filter((c) => c.stateName === form.state)
                  .map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="field full">
              <label>Looking for</label>
              <select
                value={form.employmentPreference}
                onChange={(e) => setField('employmentPreference', e.target.value as JobType)}
              >
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Locum">Locum</option>
              </select>
            </div>
            {form.employmentPreference !== 'Full Time' && (
              <div className="field full">
                <label>Time availability</label>
                <div className="pills" style={{ marginTop: 4 }}>
                  {AVAILABILITY_OPTIONS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`pill ${form.timeAvailability.includes(slot) ? 'active' : ''}`}
                      onClick={() => toggleAvailability(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="field full">
              <button className="btn btn-primary" type="submit">
                Add user
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Delete user?" onClose={() => setDeleteTarget(null)}>
          <p className="muted" style={{ marginBottom: 14 }}>
            Remove <strong>{deleteTarget.name}</strong> from the platform? Their subscription record will also be removed.
          </p>
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              style={{ background: '#d92d20' }}
              onClick={() => {
                removeProfessional(deleteTarget.id)
                setDeleteTarget(null)
                if (selected?.id === deleteTarget.id) setSelected(null)
              }}
            >
              Delete user
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
