import { Plus, Search } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import LocationFilters from '../components/LocationFilters'
import Modal from '../components/Modal'
import StatusChip from '../components/StatusChip'
import { jobs as seedJobs } from '../data/mock'
import type { Job, JobCategory, JobType } from '../types'
import { matchesLocation } from '../utils/locationFilter'

const CATEGORIES = ['All', 'Nursing', 'Doctors', 'Allied Health', 'Pharmacy'] as const
const TYPES = ['All', 'Locum', 'Part Time', 'Full Time'] as const

interface JobForm {
  title: string
  hospital: string
  location: string
  salary: string
  experience: string
  type: JobType
  category: JobCategory
  department: string
  availability: string
  description: string
}

const emptyJob: JobForm = {
  title: '',
  hospital: '',
  location: '',
  salary: '',
  experience: '',
  type: 'Full Time',
  category: 'Nursing',
  department: '',
  availability: 'Day Shift',
  description: '',
}

export default function Jobs() {
  const [items, setItems] = useState<Job[]>(seedJobs)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All')
  const [type, setType] = useState<(typeof TYPES)[number]>('All')
  const [stateFilter, setStateFilter] = useState('All')
  const [districtFilter, setDistrictFilter] = useState('All')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Job | null>(null)
  const [form, setForm] = useState<JobForm>(emptyJob)

  const filtered = useMemo(() => {
    return items.filter((job) => {
      const q = query.toLowerCase()
      const matchesQuery =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.hospital.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q)
      const matchesCat = category === 'All' || job.category === category
      const matchesType = type === 'All' || job.type === type
      const matchesLoc = matchesLocation(job, stateFilter, districtFilter)
      return matchesQuery && matchesCat && matchesType && matchesLoc
    })
  }, [items, query, category, type, stateFilter, districtFilter])

  function saveJob(e: FormEvent) {
    e.preventDefault()
    setItems((prev) => [
      {
        ...form,
        id: `j${Date.now()}`,
        state: 'Telangana',
        district: form.location.split(',')[0] || form.location,
        posted: 'Just now',
        status: 'Active',
        applicants: 0,
        rating: 4.5,
        responsibilities: ['To be confirmed with hiring hospital'],
        tags: [form.category, form.type],
      },
      ...prev,
    ])
    setForm(emptyJob)
    setOpen(false)
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>Find Healthcare Jobs</h3>
          <p>Same listings that appear in the iv mediz mobile app</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} />
          Post job
        </button>
      </div>

      <div className="toolbar">
        <div className="search">
          <Search size={16} color="#98A2B3" />
          <input
            placeholder="Search job title, skill or hospital"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <LocationFilters
          state={stateFilter}
          district={districtFilter}
          onStateChange={setStateFilter}
          onDistrictChange={setDistrictFilter}
        />
        <select className="select" value={type} onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t === 'All' ? 'All job types' : t}
            </option>
          ))}
        </select>
      </div>
      <div className="pills" style={{ marginBottom: 14 }}>
        {CATEGORIES.map((c) => (
          <button key={c} className={`pill ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Hospital</th>
              <th>Type</th>
              <th>Salary</th>
              <th>Applicants</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((job) => (
              <tr key={job.id}>
                <td>
                  <div className="cell-title">{job.title}</div>
                  <div className="cell-sub">
                    {job.category} · {job.experience}
                  </div>
                </td>
                <td>
                  <div>{job.hospital}</div>
                  <div className="cell-sub">{job.location}</div>
                </td>
                <td>
                  <StatusChip label={job.type} />
                </td>
                <td style={{ fontWeight: 700 }}>{job.salary}</td>
                <td>{job.applicants}</td>
                <td>
                  <StatusChip label={job.status} />
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelected(job)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty">No jobs match these filters</div>}
      </div>

      {open && (
        <Modal title="Post a healthcare job" onClose={() => setOpen(false)}>
          <form onSubmit={saveJob}>
            <div className="form-grid">
              <Field label="Job title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
              <Field label="Hospital" value={form.hospital} onChange={(v) => setForm({ ...form, hospital: v })} />
              <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
              <Field label="Salary" value={form.salary} onChange={(v) => setForm({ ...form, salary: v })} />
              <Field label="Experience" value={form.experience} onChange={(v) => setForm({ ...form, experience: v })} />
              <Field label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
              <div className="field">
                <label>Job type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as JobType })}>
                  <option>Locum</option>
                  <option>Part Time</option>
                  <option>Full Time</option>
                </select>
              </div>
              <div className="field">
                <label>Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as JobCategory })}>
                  <option>Nursing</option>
                  <option>Doctors</option>
                  <option>Allied Health</option>
                  <option>Pharmacy</option>
                </select>
              </div>
              <div className="field full">
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary">Publish job</button>
            </div>
          </form>
        </Modal>
      )}

      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)} wide>
          <p className="muted">
            {selected.hospital} · {selected.location} · ⭐ {selected.rating}
          </p>
          <div className="detail-grid">
            <div className="meta">
              <span>Salary</span>
              <strong>{selected.salary}</strong>
            </div>
            <div className="meta">
              <span>Experience</span>
              <strong>{selected.experience}</strong>
            </div>
            <div className="meta">
              <span>Job type</span>
              <strong>{selected.type}</strong>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 14 }}>{selected.description}</p>
          <h4 style={{ marginBottom: 8 }}>Key responsibilities</h4>
          <ul className="resp-list">
            {selected.responsibilities.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Modal>
      )}
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} required />
    </div>
  )
}
