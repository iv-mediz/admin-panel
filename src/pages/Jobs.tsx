import { Plus, Search } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import CityDistrictSelect from '../components/CityDistrictSelect'
import LocationFilters from '../components/LocationFilters'
import Modal from '../components/Modal'
import ActiveToggle from '../components/ActiveToggle'
import StatusChip from '../components/StatusChip'
import * as adminApi from '../api/admin'
import { hasApiBackend } from '../config/api'
import { useDirectory } from '../data/directory'
import type { Hospital, Job, JobCategory, JobType } from '../types'
import { matchesLocation } from '../utils/locationFilter'

const CATEGORIES = ['All', 'Nursing', 'Doctors', 'Allied Health', 'Pharmacy'] as const
const TYPES = ['All', 'Locum', 'Part Time', 'Full Time'] as const

interface JobForm {
  title: string
  hospitalId: string
  state: string
  cityDistrict: string
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
  hospitalId: '',
  state: 'Telangana',
  cityDistrict: '',
  salary: '',
  experience: '',
  type: 'Full Time',
  category: 'Nursing',
  department: '',
  availability: '',
  description: '',
}

export default function Jobs() {
  const { jobs: items, hospitals, states, specialties, setJobs, setJobStatus, loading, error, refresh } =
    useDirectory()
  const departmentOptions = useMemo(() => {
    const names = specialties
      .filter((s) => s.status === 'Active')
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .map((s) => s.name)
    return names.length > 0
      ? names
      : ['Nursing', 'Doctors', 'Allied Health', 'Pharmacy', 'Critical Care', 'Cardiology']
  }, [specialties])
  const partnerHospitals = useMemo(
    () => hospitals.filter((h) => h.status === 'Partner' && h.isActive !== false),
    [hospitals],
  )
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All')
  const [type, setType] = useState<(typeof TYPES)[number]>('All')
  const [stateFilter, setStateFilter] = useState('All')
  const [districtFilter, setDistrictFilter] = useState('All')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Job | null>(null)
  const [form, setForm] = useState<JobForm>(emptyJob)
  const [saving, setSaving] = useState(false)

  const selectedHospital = useMemo(
    () => partnerHospitals.find((h) => h.id === form.hospitalId),
    [partnerHospitals, form.hospitalId],
  )

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

  function applyHospital(hospital: Hospital) {
    const cityDistrict = hospital.district?.trim() || hospital.city?.trim() || ''
    setForm((prev) => ({
      ...prev,
      hospitalId: hospital.id,
      state: hospital.state,
      cityDistrict,
    }))
  }

  async function saveJob(e: FormEvent) {
    e.preventDefault()
    if (!form.hospitalId) return
    const hospital = partnerHospitals.find((h) => h.id === form.hospitalId)
    if (!hospital) return

    const district = form.cityDistrict.trim() || hospital.district || hospital.city
    const stateName = form.state.trim() || hospital.state
    const payload: Partial<Job> = {
      title: form.title,
      hospitalId: form.hospitalId,
      hospital: hospital.name,
      location: `${district}, ${stateName}`,
      state: stateName,
      district,
      salary: form.salary,
      experience: form.experience,
      type: form.type,
      category: form.category,
      department: form.department,
      availability: form.availability,
      description: form.description,
      posted: 'Just now',
      status: 'Active',
      applicants: 0,
      rating: 4.5,
      responsibilities: ['To be confirmed with hiring hospital'],
      tags: [form.category, form.type],
    }
    setSaving(true)
    try {
      if (hasApiBackend()) {
        await adminApi.createJob(payload)
        await refresh()
      } else {
        setJobs((prev) => [{ ...payload, id: `j${Date.now()}` } as Job, ...prev])
      }
      setForm(emptyJob)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      {loading ? <p className="hint">Loading jobs from API…</p> : null}
      {error ? <p className="hint" style={{ color: '#b91c1c' }}>{error}</p> : null}
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
              <th>Listing</th>
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
                  <ActiveToggle
                    active={job.status === 'Active'}
                    disabled={job.status === 'Closed'}
                    ariaLabel={`${job.title} job listing`}
                    onChange={(on) => setJobStatus(job.id, on ? 'Active' : 'Paused')}
                  />
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
            {partnerHospitals.length === 0 ? (
              <p className="hint" style={{ marginBottom: 16 }}>
                Onboard and approve at least one <strong>Partner</strong> hospital before posting jobs.
              </p>
            ) : null}
            <div className="form-grid">
              <Field label="Job title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
              <div className="field">
                <label>Hospital (partner)</label>
                <select
                  required
                  value={form.hospitalId}
                  onChange={(e) => {
                    const h = partnerHospitals.find((x) => x.id === e.target.value)
                    if (h) applyHospital(h)
                  }}
                >
                  <option value="">Select hospital…</option>
                  {partnerHospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} — {h.city}, {h.state}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>State</label>
                <select
                  value={form.state}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, state: e.target.value, cityDistrict: '' }))
                  }
                  required
                >
                  {(states.length ? states : [{ id: 'ts', name: 'Telangana' }]).map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {selectedHospital ? (
                  <span className="hint">Prefilled from {selectedHospital.name}; you can change if needed.</span>
                ) : null}
              </div>
              <CityDistrictSelect
                stateName={form.state}
                value={form.cityDistrict}
                onChange={(v) => setForm({ ...form, cityDistrict: v })}
              />
              <Field label="Salary" value={form.salary} onChange={(v) => setForm({ ...form, salary: v })} />
              <Field label="Experience" value={form.experience} onChange={(v) => setForm({ ...form, experience: v })} />
              <div className="field">
                <label>Department</label>
                <select
                  required
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                >
                  <option value="">Select department…</option>
                  {departmentOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <span className="hint">Manage options under Locations → Specialties</span>
              </div>
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
              <Field
                label="Working hours"
                value={form.availability}
                onChange={(v) => setForm({ ...form, availability: v })}
                placeholder="9 am to 7 pm"
                hint="Use a time range like 9 am to 7 pm"
              />
              <div className="field full">
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={
                  saving ||
                  partnerHospitals.length === 0 ||
                  !form.hospitalId ||
                  !form.cityDistrict.trim() ||
                  !form.availability.trim()
                }
              >
                {saving ? 'Publishing…' : 'Publish job'}
              </button>
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
            {selected.availability ? (
              <div className="meta">
                <span>Working hours</span>
                <strong>{selected.availability}</strong>
              </div>
            ) : null}
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

function Field({
  label,
  value,
  onChange,
  hint,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  placeholder?: string
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        required
      />
      {hint ? <span className="hint">{hint}</span> : null}
    </div>
  )
}
