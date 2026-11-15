import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import LocationFilters from '../components/LocationFilters'
import Modal from '../components/Modal'
import ActiveToggle from '../components/ActiveToggle'
import StatusChip from '../components/StatusChip'
import { resolveMediaUrl } from '../components/HospitalImageUpload'
import * as adminApi from '../api/admin'
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

function registeredAtMillis(value?: string) {
  if (!value?.trim()) return 0
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function formatRegisteredAt(value?: string) {
  if (!value?.trim()) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
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
  const {
    professionals,
    states,
    cities,
    specialties,
    addProfessional,
    updateProfessional,
    removeProfessional,
    setProfessionalStatus,
  } = useDirectory()

  const specializationOptions = useMemo(() => {
    return specialties
      .filter((s) => s.status === 'Active')
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .map((s) => s.name)
  }, [specialties])
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<(typeof ROLES)[number]>('All')
  const [employment, setEmployment] = useState<(typeof EMPLOYMENT)[number]>('All')
  const [stateFilter, setStateFilter] = useState('All')
  const [districtFilter, setDistrictFilter] = useState('All')
  const [selected, setSelected] = useState<Professional | null>(null)
  const [selectedDocs, setSelectedDocs] = useState<NonNullable<Professional['documents']>>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Professional | null>(null)
  const [form, setForm] = useState<UserForm>(emptyForm)

  const filtered = useMemo(() => {
    return professionals
      .filter((u) => {
        const q = query.toLowerCase()
        const matchesQuery = !q || u.name.toLowerCase().includes(q) || u.specialization.toLowerCase().includes(q)
        const matchesRole = role === 'All' || u.role === role
        const matchesEmployment = employment === 'All' || u.employmentPreference === employment
        const matchesLoc = matchesLocation(u, stateFilter, districtFilter)
        return matchesQuery && matchesRole && matchesEmployment && matchesLoc
      })
      .sort((a, b) => registeredAtMillis(b.registeredAt) - registeredAtMillis(a.registeredAt))
  }, [professionals, query, role, employment, stateFilter, districtFilter])

  useEffect(() => {
    if (!selected) {
      setSelectedDocs([])
      return
    }
    const existing = selected.documents ?? []
    setSelectedDocs(existing)
    let cancelled = false
    setDocsLoading(true)
    adminApi
      .fetchProfessionalDocuments(selected.id)
      .then((res) => {
        if (!cancelled && res.documents?.length) setSelectedDocs(res.documents)
      })
      .catch(() => {
        if (!cancelled) setSelectedDocs(existing)
      })
      .finally(() => {
        if (!cancelled) setDocsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selected])

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

  function closeModal() {
    setOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const location = `${form.district}, ${form.state}`
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      role: form.role,
      specialization: form.specialization.trim(),
      location,
      state: form.state,
      district: form.district,
      experience: form.experience.trim(),
      employmentPreference: form.employmentPreference,
      timeAvailability:
        form.employmentPreference === 'Full Time' ? undefined : form.timeAvailability.length ? form.timeAvailability : undefined,
    }
    if (editingId) {
      updateProfessional(editingId, payload)
    } else {
      addProfessional({
        id: `u${Date.now()}`,
        ...payload,
        completion: 20,
        status: 'Pending',
        applications: 0,
        registeredAt: new Date().toISOString(),
      })
    }
    closeModal()
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>Professionals</h3>
          <p>Users who signed up on the iv mediz mobile app</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingId(null)
            setForm(emptyForm)
            setOpen(true)
          }}
        >
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
              <th>Registered</th>
              <th>Rating</th>
              <th>Profile</th>
              <th>Documents</th>
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
                <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                  {formatRegisteredAt(user.registeredAt)}
                </td>
                <td>
                  {user.ratingCount ? (
                    <>
                      <div className="cell-title">⭐ {Number(user.rating ?? 0).toFixed(1)}</div>
                      <div className="cell-sub">{user.ratingCount} reviews</div>
                    </>
                  ) : (
                    <span className="muted">No reviews</span>
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
                  <ProfessionalDocumentsCell
                    documents={user.documents}
                    onView={() => setSelected(user)}
                  />
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
                  <ActiveToggle
                    active={user.status === 'Active'}
                    ariaLabel={`${user.name} profile`}
                    onChange={(on) => setProfessionalStatus(user.id, on ? 'Active' : 'Pending')}
                  />
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setEditingId(user.id)
                        setForm({
                          name: user.name,
                          email: user.email,
                          phone: user.phone,
                          role: user.role,
                          specialization: user.specialization,
                          state: user.state,
                          district: user.district,
                          experience: user.experience,
                          employmentPreference: user.employmentPreference,
                          timeAvailability: user.timeAvailability ?? [],
                        })
                        setOpen(true)
                      }}
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
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
            <div className="meta">
              <span>Registered</span>
              <strong>{formatRegisteredAt(selected.registeredAt)}</strong>
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
          <p className="muted" style={{ marginTop: 14, marginBottom: 8 }}>
            Profile documents
          </p>
          {docsLoading && selectedDocs.length === 0 ? (
            <p className="muted">Loading documents…</p>
          ) : (
            <ProfessionalDocumentsList documents={selectedDocs} />
          )}
          <p className="muted" style={{ marginTop: 14 }}>
            Profile completion {selected.completion}% — same sections as Complete Profile in the app.
          </p>
        </Modal>
      )}

      {open && (
        <Modal title={editingId ? 'Edit professional' : 'Add professional'} onClose={closeModal}>
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
              <select
                required
                value={form.specialization}
                onChange={(e) => setField('specialization', e.target.value)}
              >
                <option value="">Select specialization…</option>
                {specializationOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <span className="hint">Manage options under Locations → Specialties</span>
            </div>
            <div className="field">
              <label>Experience</label>
              <input value={form.experience} onChange={(e) => setField('experience', e.target.value)} placeholder="e.g. 3 Years" required />
            </div>
            <div className="field">
              <label>State</label>
              <select
                value={form.state}
                onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value, district: '' }))}
              >
                {states.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>City / district</label>
              <select value={form.district} onChange={(e) => setField('district', e.target.value)} required>
                <option value="">Select city / district</option>
                {cities
                  .filter((c) => c.stateName === form.state && c.status !== 'Paused')
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
                {editingId ? 'Save changes' : 'Add user'}
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

function uploadedCount(documents?: Professional['documents']) {
  return (documents ?? []).filter((doc) => doc.uploaded || doc.fileUrl).length
}

function ProfessionalDocumentsCell({
  documents,
  onView,
}: {
  documents?: Professional['documents']
  onView: () => void
}) {
  const total = documents?.length ?? 4
  const uploaded = uploadedCount(documents)
  return (
    <button className="btn btn-ghost btn-sm" onClick={onView} type="button">
      {uploaded}/{total} uploaded
    </button>
  )
}

function ProfessionalDocumentsList({ documents }: { documents?: Professional['documents'] }) {
  const docs = documents?.length
    ? documents
    : [
        { id: 'resume', name: 'Resume' },
        { id: 'council', name: 'Medical Council Registration Certificate' },
        { id: 'aadhaar', name: 'Aadhaar Card' },
        { id: 'expLetter', name: 'Experience Letter' },
      ]
  return (
    <div className="detail-grid">
      {docs.map((doc) => {
        const href = resolveMediaUrl(doc.fileUrl)
        return (
          <div className="meta full" key={doc.id}>
            <span>{doc.name}</span>
            <strong>
              {href ? (
                <a href={href} target="_blank" rel="noreferrer">
                  View{doc.fileName ? ` (${doc.fileName})` : ''}
                </a>
              ) : (
                <span className="muted">{doc.detail || 'Not uploaded'}</span>
              )}
            </strong>
          </div>
        )
      })}
    </div>
  )
}
