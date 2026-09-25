import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import * as adminApi from '../api/admin'
import CityDistrictSelect, { cityDistrictPayload } from '../components/CityDistrictSelect'
import HospitalImageUpload from '../components/HospitalImageUpload'
import { useDirectory } from '../data/directory'
import { hasApiBackend } from '../config/api'

const STEPS = ['Hospital', 'Contact', 'Review'] as const
const DEPARTMENTS = ['Nursing', 'Doctors', 'Allied Health', 'Pharmacy', 'Critical Care', 'Cardiology'] as const

interface HospitalForm {
  name: string
  type: string
  registration: string
  address: string
  cityDistrict: string
  state: string
  contactPerson: string
  phone: string
  email: string
  departments: string[]
  notes: string
}

const empty: HospitalForm = {
  name: '',
  type: 'Multi-speciality',
  registration: '',
  address: '',
  cityDistrict: '',
  state: 'Telangana',
  contactPerson: '',
  phone: '',
  email: '',
  departments: ['Nursing', 'Doctors'],
  notes: '',
}

export default function OnboardHospital() {
  const navigate = useNavigate()
  const { addHospital, prependHospital, states } = useDirectory()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<HospitalForm>(empty)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function setField<K extends keyof HospitalForm>(key: K, value: HospitalForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleDept(dept: string) {
    setForm((prev) => ({
      ...prev,
      departments: prev.departments.includes(dept)
        ? prev.departments.filter((d) => d !== dept)
        : [...prev.departments, dept],
    }))
  }

  async function next(e: FormEvent) {
    e.preventDefault()
    if (step < 2) {
      setStep(step + 1)
      return
    }
    const loc = cityDistrictPayload(form.cityDistrict)
    const payload = {
      name: form.name,
      type: form.type,
      city: loc.city,
      district: loc.district,
      state: form.state,
      jobs: 0,
      rating: 0,
      contact: form.phone,
      contactPerson: form.contactPerson,
      email: form.email,
      status: 'Pending' as const,
      departments: form.departments,
    }
    setSubmitting(true)
    try {
      if (hasApiBackend()) {
        let created = await adminApi.createHospital(payload)
        let logoUrl = created.logoUrl
        let coverPhotoUrl = created.coverPhotoUrl
        if (logoFile) {
          const r = await adminApi.uploadHospitalImage(created.id, 'logo', logoFile)
          logoUrl = r.url
        }
        if (coverFile) {
          const r = await adminApi.uploadHospitalImage(created.id, 'cover', coverFile)
          coverPhotoUrl = r.url
        }
        prependHospital({ ...created, ...payload, logoUrl, coverPhotoUrl })
      } else {
        addHospital({ ...payload, id: `h${Date.now()}` })
      }
      navigate('/hospitals', { replace: true, state: { justOnboarded: form.name } })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>Onboard a hospital</h3>
          <p>Add a partner so they can post jobs on the iv mediz app</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/hospitals')}>
          Back to hospitals
        </button>
      </div>

      <div className="steps">
        {STEPS.map((label, i) => (
          <button key={label} className={`step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`} onClick={() => setStep(i)}>
            <span>{i + 1}</span>
            {label}
          </button>
        ))}
      </div>

      <form className="card card-pad" onSubmit={next}>
        {step === 0 && (
          <div className="form-grid">
            <Field label="Hospital name" value={form.name} onChange={(v) => setField('name', v)} placeholder="e.g. Care Hospitals" />
            <div className="field">
              <label>Hospital type</label>
              <select value={form.type} onChange={(e) => setField('type', e.target.value)}>
                <option>Multi-speciality</option>
                <option>Super-speciality</option>
                <option>Clinic</option>
                <option>Nursing home</option>
              </select>
            </div>
            <Field label="Registration / NABH no." value={form.registration} onChange={(v) => setField('registration', v)} optional />
            <Field label="Street address" value={form.address} onChange={(v) => setField('address', v)} />
            <div className="field">
              <label>State</label>
              <select
                value={form.state}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, state: e.target.value, cityDistrict: '' }))
                }}
              >
                {(states.length ? states : [{ id: 'ts', name: 'Telangana' }, { id: 'ka', name: 'Karnataka' }]).map(
                  (s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ),
                )}
              </select>
            </div>
            <CityDistrictSelect
              stateName={form.state}
              value={form.cityDistrict}
              onChange={(v) => setField('cityDistrict', v)}
            />
            <HospitalImageUpload
              label="Hospital logo"
              kind="logo"
              onPick={setLogoFile}
              hint="Square logo shown in the app (JPEG, PNG, or WebP, max 5 MB)."
            />
            <HospitalImageUpload
              label="Cover photo"
              kind="cover"
              onPick={setCoverFile}
              hint="Wide banner for job listings and hospital profile."
            />
          </div>
        )}

        {step === 1 && (
          <div className="form-grid">
            <Field label="Contact person" value={form.contactPerson} onChange={(v) => setField('contactPerson', v)} />
            <Field label="Phone" value={form.phone} onChange={(v) => setField('phone', v)} />
            <Field label="Email" value={form.email} onChange={(v) => setField('email', v)} type="email" />
            <div className="field full">
              <label>Hiring departments</label>
              <div className="pills" style={{ marginTop: 4 }}>
                {DEPARTMENTS.map((d) => (
                  <button
                    type="button"
                    key={d}
                    className={`pill ${form.departments.includes(d) ? 'active' : ''}`}
                    onClick={() => toggleDept(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="field full">
              <label>Notes (optional)</label>
              <textarea rows={3} value={form.notes} onChange={(e) => setField('notes', e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="muted" style={{ marginBottom: 14 }}>
              Confirm details. The hospital stays <strong>Pending</strong> until you approve it from Hospitals.
              The contact phone ({form.phone || '—'}) can sign in on the mobile app with OTP to manage jobs once linked.
            </p>
            <div className="detail-grid">
              <Meta label="Hospital" value={form.name} />
              <Meta label="Type" value={form.type} />
              <Meta label="Location" value={`${form.cityDistrict}, ${form.state}`} />
              <Meta label="Contact" value={form.contactPerson} />
              <Meta label="Phone" value={form.phone} />
              <Meta label="Email" value={form.email} />
            </div>
            <div className="pills">
              {form.departments.map((d) => (
                <span key={d} className="chip chip-review">
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="modal-actions">
          {step > 0 && (
            <button type="button" className="btn btn-outline" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          <button className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting…' : step === 2 ? 'Submit for review' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  optional,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  optional?: boolean
}) {
  return (
    <div className="field">
      <label>
        {label}
        {optional ? <span className="muted"> (optional)</span> : null}
      </label>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} required={!optional} />
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="meta">
      <span>{label}</span>
      <strong>{value || '—'}</strong>
    </div>
  )
}
