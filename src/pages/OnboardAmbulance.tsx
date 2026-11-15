import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import CityDistrictSelect, { cityDistrictPayload } from '../components/CityDistrictSelect'
import { useDirectory } from '../data/directory'

const STEPS = ['Operator', 'Vehicle', 'Review'] as const

interface AmbulanceForm {
  operator: string
  cityDistrict: string
  state: string
  base: string
  serviceType: string
  vehicle: string
  driver: string
  phone: string
  license: string
  notes: string
}

const empty: AmbulanceForm = {
  operator: '',
  cityDistrict: '',
  state: 'Telangana',
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
  const { addVehicle, states } = useDirectory()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<AmbulanceForm>(empty)

  function setField<K extends keyof AmbulanceForm>(key: K, value: AmbulanceForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function next(e: FormEvent) {
    e.preventDefault()
    if (step < 2) {
      setStep(step + 1)
      return
    }
    const loc = cityDistrictPayload(form.cityDistrict)
    addVehicle({
      id: `v${Date.now()}`,
      operator: form.operator,
      vehicle: form.vehicle,
      serviceType: form.serviceType,
      driver: form.driver,
      phone: form.phone,
      city: loc.city,
      district: loc.district,
      state: form.state,
      base: form.base,
      status: 'Pending',
      license: form.license,
      notes: form.notes,
      vehiclePhotos: [
        { label: 'Front view', uploadedAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
        { label: 'Side view', uploadedAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
        { label: 'Interior', uploadedAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
      ],
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
            <Field label="Operator / company" value={form.operator} onChange={(v) => setField('operator', v)} placeholder="e.g. Mediz Care Ambulance" />
            <Field label="Base area" value={form.base} onChange={(v) => setField('base', v)} placeholder="e.g. Koramangala" />
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
            <div className="field">
              <label>Service type</label>
              <select value={form.serviceType} onChange={(e) => setField('serviceType', e.target.value)}>
                <option>Basic Life Support</option>
                <option>Advanced Life Support</option>
                <option>Neonatal Ambulance</option>
              </select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="form-grid">
            <Field label="Vehicle number" value={form.vehicle} onChange={(v) => setField('vehicle', v)} placeholder="KA 01 AB 2148" />
            <Field label="Driver name" value={form.driver} onChange={(v) => setField('driver', v)} />
            <Field label="Driver phone" value={form.phone} onChange={(v) => setField('phone', v)} />
            <Field label="Driving licence no." value={form.license} onChange={(v) => setField('license', v)} optional />
            <div className="field full">
              <label>Notes (optional)</label>
              <textarea rows={3} value={form.notes} onChange={(e) => setField('notes', e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="muted" style={{ marginBottom: 14 }}>
              Confirm details. The vehicle stays <strong>Pending</strong> until you approve it from Ambulance fleet.
              The driver phone ({form.phone || '—'}) can sign in on the mobile app with OTP to manage bookings once linked.
            </p>
            <div className="detail-grid">
              <Meta label="Operator" value={form.operator} />
              <Meta label="Service" value={form.serviceType} />
              <Meta label="Vehicle" value={form.vehicle} />
              <Meta label="Driver" value={form.driver} />
              <Meta label="Phone" value={form.phone} />
              <Meta label="Base" value={`${form.base}, ${form.cityDistrict}, ${form.state}`} />
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
  optional,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  optional?: boolean
}) {
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

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="meta">
      <span>{label}</span>
      <strong>{value || '—'}</strong>
    </div>
  )
}
