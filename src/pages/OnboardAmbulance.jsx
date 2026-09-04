import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDirectory } from '../data/directory'

const STEPS = ['Operator', 'Vehicle', 'Review']

const empty = {
  operator: '',
  city: '',
  base: '',
  serviceType: 'Basic Life Support',
  vehicle: '',
  driver: '',
  phone: '',
  license: '',
  notes: '',
}

export default function OnboardAmbulance() {
  const navigate = useNavigate()
  const { addVehicle } = useDirectory()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(empty)

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function next(e) {
    e.preventDefault()
    if (step < 2) {
      setStep(step + 1)
      return
    }
    addVehicle({
      id: `v${Date.now()}`,
      operator: form.operator,
      vehicle: form.vehicle,
      serviceType: form.serviceType,
      driver: form.driver,
      phone: form.phone,
      city: form.city,
      base: form.base,
      status: 'Pending',
    })
    navigate('/ambulances', { replace: true, state: { justOnboarded: form.vehicle } })
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>Onboard an ambulance</h3>
          <p>Register an operator and vehicle so it can take BLS, ALS or neonatal bookings</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/ambulances')}>
          Back to fleet
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
            <Field label="Operator / company" value={form.operator} onChange={(v) => set('operator', v)} placeholder="e.g. Mediz Care Ambulance" />
            <Field label="Base area" value={form.base} onChange={(v) => set('base', v)} placeholder="e.g. Koramangala" />
            <Field label="City" value={form.city} onChange={(v) => set('city', v)} />
            <div className="field">
              <label>Service type</label>
              <select value={form.serviceType} onChange={(e) => set('serviceType', e.target.value)}>
                <option>Basic Life Support</option>
                <option>Advanced Life Support</option>
                <option>Neonatal Ambulance</option>
              </select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="form-grid">
            <Field label="Vehicle number" value={form.vehicle} onChange={(v) => set('vehicle', v)} placeholder="KA 01 AB 2148" />
            <Field label="Driver name" value={form.driver} onChange={(v) => set('driver', v)} />
            <Field label="Driver phone" value={form.phone} onChange={(v) => set('phone', v)} />
            <Field label="Driving licence no." value={form.license} onChange={(v) => set('license', v)} optional />
            <div className="field full">
              <label>Notes (optional)</label>
              <textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="muted" style={{ marginBottom: 14 }}>
              Confirm details. The vehicle stays <strong>Pending</strong> until you approve it from Ambulance fleet.
            </p>
            <div className="detail-grid">
              <Meta label="Operator" value={form.operator} />
              <Meta label="Service" value={form.serviceType} />
              <Meta label="Vehicle" value={form.vehicle} />
              <Meta label="Driver" value={form.driver} />
              <Meta label="Phone" value={form.phone} />
              <Meta label="Base" value={`${form.base}, ${form.city}`} />
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

function Field({ label, value, onChange, placeholder, optional }) {
  return (
    <div className="field">
      <label>
        {label}
        {optional ? <span className="muted"> (optional)</span> : null}
      </label>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} required={!optional} />
    </div>
  )
}

function Meta({ label, value }) {
  return (
    <div className="meta">
      <span>{label}</span>
      <strong>{value || '—'}</strong>
    </div>
  )
}
