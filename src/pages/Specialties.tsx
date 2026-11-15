import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import Modal from '../components/Modal'
import ActiveToggle from '../components/ActiveToggle'
import { useDirectory } from '../data/directory'
import type { JobCategory } from '../types'

const TABS = ['All', 'Active', 'Paused'] as const
const CATEGORIES: JobCategory[] = ['Nursing', 'Doctors', 'Allied Health', 'Pharmacy']
const ICONS = [
  { id: 'nursing', label: 'Nursing' },
  { id: 'lab', label: 'Lab' },
  { id: 'pharmacy', label: 'Pharmacy' },
  { id: 'receptionist', label: 'Reception' },
  { id: 'doctors', label: 'Doctors' },
  { id: 'allied', label: 'Allied health' },
]
const COLORS = ['#2F80ED', '#7C3AED', '#DB2777', '#EA580C', '#0F766E', '#2563EB']

const empty = {
  name: '',
  jobCategory: 'Nursing' as JobCategory,
  query: '',
  icon: 'nursing',
  color: '#2F80ED',
  sortOrder: 10,
}

export default function Specialties() {
  const { specialties, addSpecialty, updateSpecialty, setSpecialtyStatus, removeSpecialty } = useDirectory()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<(typeof TABS)[number]>('All')
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(empty)

  const filtered = useMemo(() => {
    return specialties
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .filter((s) => {
        const q = query.toLowerCase()
        const matchesQuery =
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.jobCategory.toLowerCase().includes(q)
        return matchesQuery && (tab === 'All' || s.status === tab)
      })
  }, [specialties, query, tab])

  function closeModal() {
    setOpen(false)
    setEditingId(null)
    setForm(empty)
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const payload = {
      name: form.name.trim(),
      jobCategory: form.jobCategory,
      query: form.query.trim(),
      icon: form.icon,
      color: form.color,
      sortOrder: Number(form.sortOrder) || 99,
    }
    if (editingId) {
      updateSpecialty(editingId, payload)
    } else {
      addSpecialty({
        id: `sp-${Date.now()}`,
        ...payload,
        status: 'Active',
      })
    }
    closeModal()
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>Specialties</h3>
          <p>
            These names appear as the Speciality dropdown when posting a job (plus Other for a
            custom value), on home specialty chips, and in profile specialization lists.
          </p>
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
          Add specialty
        </button>
      </div>

      <div className="toolbar">
        <div className="search">
          <Search size={16} color="#98A2B3" />
          <input
            placeholder="Search specialty"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
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
              <th>Specialty</th>
              <th>Job category</th>
              <th>Search keyword</th>
              <th>Order</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td className="cell-title">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 99,
                        background: s.color,
                        display: 'inline-block',
                      }}
                    />
                    {s.name}
                  </span>
                </td>
                <td>{s.jobCategory}</td>
                <td>{s.query || '—'}</td>
                <td>{s.sortOrder}</td>
                <td>
                  <ActiveToggle
                    active={s.status === 'Active'}
                    ariaLabel={`${s.name} on home screen`}
                    onChange={(on) => setSpecialtyStatus(s.id, on ? 'Active' : 'Paused')}
                  />
                </td>
                <td className="row-actions">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setEditingId(s.id)
                      setForm({
                        name: s.name,
                        jobCategory: s.jobCategory,
                        query: s.query,
                        icon: s.icon,
                        color: s.color,
                        sortOrder: s.sortOrder,
                      })
                      setOpen(true)
                    }}
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      if (confirm(`Remove ${s.name} from the app?`)) removeSpecialty(s)
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty">No specialties yet. Add ones for the home screen.</div>}
      </div>

      {open && (
        <Modal title={editingId ? 'Edit specialty' : 'Add specialty'} onClose={closeModal}>
          <form onSubmit={submit}>
            <div className="form-grid">
              <div className="field">
                <label>Name on app</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="e.g. Lab Technician"
                />
              </div>
              <div className="field">
                <label>Job category</label>
                <select
                  value={form.jobCategory}
                  onChange={(e) => setForm({ ...form, jobCategory: e.target.value as JobCategory })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Search keyword (optional)</label>
                <input
                  value={form.query}
                  onChange={(e) => setForm({ ...form, query: e.target.value })}
                  placeholder="e.g. Lab, Reception, ICU"
                />
              </div>
              <div className="field">
                <label>Sort order</label>
                <input
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                />
              </div>
              <div className="field">
                <label>Icon</label>
                <select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
                  {ICONS.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Chip color</label>
                <select value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}>
                  {COLORS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn btn-primary">{editingId ? 'Save changes' : 'Add specialty'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
