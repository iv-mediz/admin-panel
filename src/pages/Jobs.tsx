import { Pencil, Plus, Search } from 'lucide-react'
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
import JobApplicantsModal from './Applications'

const CATEGORIES = ['All', 'Nursing', 'Doctors', 'Allied Health', 'Pharmacy'] as const
const TYPES = ['All', 'Locum', 'Part Time', 'Full Time'] as const

const OTHER_SPECIALITY = 'Other'

interface JobForm {
  title: string
  specialitySelect: string
  hospitalId: string
  state: string
  cityDistrict: string
  salary: string
  experience: string
  type: JobType
  category: JobCategory
  department: string
  availability: string
  locumFrom: string
  locumTo: string
  description: string
}

const emptyJob: JobForm = {
  title: '',
  specialitySelect: '',
  hospitalId: '',
  state: '',
  cityDistrict: '',
  salary: '',
  experience: '',
  type: 'Full Time',
  category: 'Nursing',
  department: '',
  availability: '',
  locumFrom: '',
  locumTo: '',
  description: '',
}

export default function Jobs() {
  const {
    jobs: items,
    applications,
    hospitals,
    states,
    specialties,
    setJobs,
    setJobStatus,
    loading,
    error,
    refresh,
  } = useDirectory()
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Job | null>(null)
  const [applicantsJob, setApplicantsJob] = useState<Job | null>(null)
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
    const speciality =
      form.specialitySelect === OTHER_SPECIALITY
        ? form.title.trim()
        : form.specialitySelect.trim()
    if (!speciality) return
    const payload: Partial<Job> = {
      title: speciality,
      hospitalId: form.hospitalId,
      hospital: hospital.name,
      location: `${district}, ${stateName}`,
      state: stateName,
      district,
      salary: form.salary,
      experience: form.experience,
      type: form.type,
      category: form.category,
      department: speciality,
      availability: form.availability,
      ...(form.type === 'Locum'
        ? { locumFrom: form.locumFrom.trim(), locumTo: form.locumTo.trim() }
        : {}),
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
      if (editingId) {
        const { posted: _posted, applicants: _applicants, ...rest } = payload
        if (hasApiBackend()) {
          const updated = await adminApi.updateJob(editingId, rest)
          setJobs((prev) => prev.map((j) => (j.id === editingId ? { ...j, ...updated } : j)))
        } else {
          setJobs((prev) => prev.map((j) => (j.id === editingId ? { ...j, ...rest } : j)))
        }
      } else if (hasApiBackend()) {
        await adminApi.createJob(payload)
        await refresh()
      } else {
        setJobs((prev) => [{ ...payload, id: `j${Date.now()}` } as Job, ...prev])
      }
      setForm(emptyJob)
      setEditingId(null)
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
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingId(null)
            setForm(emptyJob)
            setOpen(true)
          }}
        >
          <Plus size={16} />
          Post job
        </button>
      </div>

      <div className="toolbar">
        <div className="search">
          <Search size={16} color="#98A2B3" />
          <input
            placeholder="Search speciality, skill or hospital"
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
              <th>Speciality</th>
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
                <td>
                  {applications.filter((a) => a.jobId === job.id).length || job.applicants}
                </td>
                <td>
                  <ActiveToggle
                    active={job.status === 'Active'}
                    disabled={job.status === 'Closed'}
                    ariaLabel={`${job.title} job listing`}
                    onChange={(on) => setJobStatus(job.id, on ? 'Active' : 'Paused')}
                  />
                </td>
                <td className="row-actions">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setEditingId(job.id)
                      setForm({
                        title: job.title,
                        specialitySelect: departmentOptions.includes(job.title)
                          ? job.title
                          : OTHER_SPECIALITY,
                        hospitalId: job.hospitalId ?? partnerHospitals.find((h) => h.name === job.hospital)?.id ?? '',
                        state: job.state,
                        cityDistrict: job.district,
                        salary: job.salary,
                        experience: job.experience,
                        type: job.type,
                        category: job.category,
                        department: job.department,
                        availability: job.availability,
                        locumFrom: job.locumFrom ?? '',
                        locumTo: job.locumTo ?? '',
                        description: job.description,
                      })
                      setOpen(true)
                    }}
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelected(job)}>
                    View
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setApplicantsJob(job)}>
                    View applicants
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty">No jobs match these filters</div>}
      </div>

      {open && (
        <Modal
          title={editingId ? 'Edit job' : 'Post a healthcare job'}
          onClose={() => {
            setOpen(false)
            setEditingId(null)
          }}
        >
          <form onSubmit={saveJob}>
            {partnerHospitals.length === 0 ? (
              <p className="hint" style={{ marginBottom: 16 }}>
                Onboard and approve at least one <strong>Partner</strong> hospital before posting jobs.
              </p>
            ) : null}
            <div className="form-grid">
              <div className="field">
                <label>Speciality</label>
                <select
                  required
                  value={form.specialitySelect}
                  onChange={(e) => {
                    const v = e.target.value
                    setForm({
                      ...form,
                      specialitySelect: v,
                      title: v === OTHER_SPECIALITY ? '' : v,
                      department: v === OTHER_SPECIALITY ? form.department : v,
                    })
                  }}
                >
                  <option value="">Select speciality…</option>
                  {departmentOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                  <option value={OTHER_SPECIALITY}>{OTHER_SPECIALITY}</option>
                </select>
                <span className="hint">Managed under Specialties in the admin panel</span>
              </div>
              {form.specialitySelect === OTHER_SPECIALITY ? (
                <Field
                  label="Enter speciality"
                  value={form.title}
                  onChange={(v) => setForm({ ...form, title: v, department: v })}
                />
              ) : null}
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
                  <option value="">Select state</option>
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
                label="District"
                stateName={form.state}
                value={form.cityDistrict}
                onChange={(v) => setForm({ ...form, cityDistrict: v })}
              />
              <Field label="Salary" value={form.salary} onChange={(v) => setForm({ ...form, salary: v })} />
              <Field label="Experience" value={form.experience} onChange={(v) => setForm({ ...form, experience: v })} />
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
              {form.type === 'Locum' ? (
                <>
                  <div className="field">
                    <label>Locum from</label>
                    <input
                      type="date"
                      required
                      value={form.locumFrom}
                      onChange={(e) => setForm({ ...form, locumFrom: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>Locum to</label>
                    <input
                      type="date"
                      required
                      value={form.locumTo}
                      min={form.locumFrom || undefined}
                      onChange={(e) => setForm({ ...form, locumTo: e.target.value })}
                    />
                  </div>
                </>
              ) : null}
              <div className="field full">
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setOpen(false)
                  setEditingId(null)
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={
                  saving ||
                  partnerHospitals.length === 0 ||
                  !form.hospitalId ||
                  !form.state.trim() ||
                  !form.cityDistrict.trim() ||
                  !form.availability.trim() ||
                  (form.type === 'Locum' && (!form.locumFrom.trim() || !form.locumTo.trim()))
                }
              >
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Publish job'}
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
            {selected.type === 'Locum' && (selected.locumFrom || selected.locumTo) ? (
              <div className="meta">
                <span>Locum period</span>
                <strong>
                  {selected.locumFrom || '—'} → {selected.locumTo || '—'}
                </strong>
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

      {applicantsJob ? (
        <JobApplicantsModal job={applicantsJob} onClose={() => setApplicantsJob(null)} />
      ) : null}
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
