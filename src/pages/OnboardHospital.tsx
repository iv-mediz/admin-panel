import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDirectory } from '../data/directory'

const STEPS = ['Hospital', 'Contact', 'Review'] as const
const DEPARTMENTS = ['Nursing', 'Doctors', 'Allied Health', 'Pharmacy', 'Critical Care', 'Cardiology'] as const

interface HospitalForm {
  name: string
  type: string
  registration: string
  address: string
  city: string
  district: string
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
  city: '',
  district: '',
  state: 'Telangana',
  contactPerson: '',
  phone: '',
  email: '',
  departments: ['Nursing', 'Doctors'],
  notes: '',
}

export default function OnboardHospital() {
  const navigate = useNavigate()
  const { addHospital } = useDirectory()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<HospitalForm>(empty)

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

  function next(e: FormEvent) {
    e.preventDefault()
    if (step < 2) {
      setStep(step + 1)
      return
    }
    addHospital({
      id: `h${Date.now()}`,
      name: form.name,
      type: form.type,
      city: form.city,
      state: form.state,
      jobs: 0,
      rating: 0,
      contact: form.phone,
      contactPerson: form.contactPerson,
      email: form.email,
      status: 'Pending',
      departments: form.departments,
    })
    navigate('/hospitals', { replace: true, state: { justOnboarded: form.name } })
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
            <Field label="City" value={form.city} onChange={(v) => setField('city', v)} />
            <Field label="District" value={form.district} onChange={(v) => setField('district', v)} />
            <div className="field">
              <label>State</label>
              <select value={form.state} onChange={(e) => setField('state', e.target.value)}>
                <option>Telangana</option>
                <option>Karnataka</option>
              </select>
            </div>
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
            </p>
            <div className="detail-grid">
              <Meta label="Hospital" value={form.name} />
              <Meta label="Type" value={form.type} />
              <Meta label="Location" value={`${form.city}, ${form.state}`} />
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
          <button className="btn btn-primary">{step === 2 ? 'Submit for review' : 'Continue'}</button>
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
