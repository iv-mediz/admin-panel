import { Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDirectory } from '../data/directory'
import type { SubscriptionAudience } from '../types'

const STEPS = ['Plan details', 'Features', 'Review'] as const
const AUDIENCES: SubscriptionAudience[] = ['Employee', 'Hospital', 'Ambulance owner']

interface PlanForm {
  name: string
  audience: SubscriptionAudience
  monthlyPrice: string
  yearlyPrice: string
  popular: boolean
  features: string[]
  featureDraft: string
}

const empty: PlanForm = {
  name: '',
  audience: 'Employee',
  monthlyPrice: '',
  yearlyPrice: '',
  popular: false,
  features: [],
  featureDraft: '',
}

export default function CreatePlan() {
  const navigate = useNavigate()
  const { subscriptionPlans, addSubscriptionPlan } = useDirectory()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<PlanForm>(empty)

  function setField<K extends keyof PlanForm>(key: K, value: PlanForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function addFeature() {
    const text = form.featureDraft.trim()
    if (!text || form.features.includes(text)) return
    setForm((prev) => ({ ...prev, features: [...prev.features, text], featureDraft: '' }))
  }

  function removeFeature(feature: string) {
    setForm((prev) => ({ ...prev, features: prev.features.filter((f) => f !== feature) }))
  }

  function nameTaken(name: string): boolean {
    return subscriptionPlans.some(
      (p) => p.audience === form.audience && p.name.toLowerCase() === name.trim().toLowerCase(),
    )
  }

  function canContinue(): boolean {
    if (step === 0) return !!form.name.trim() && !!form.monthlyPrice.trim() && !!form.yearlyPrice.trim() && !nameTaken(form.name)
    if (step === 1) return form.features.length > 0
    return true
  }

  function next(e: FormEvent) {
    e.preventDefault()
    if (!canContinue()) return

    if (step < 2) {
      setStep(step + 1)
      return
    }

    addSubscriptionPlan({
      id: `plan-${Date.now()}`,
      name: form.name.trim(),
      audience: form.audience,
      monthlyPrice: form.monthlyPrice.trim(),
      yearlyPrice: form.yearlyPrice.trim(),
      features: form.features,
      active: true,
      popular: form.popular,
    })
    navigate('/subscriptions', { replace: true, state: { justCreatedPlan: form.name.trim(), plansTab: true } })
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>Create subscription plan</h3>
          <p>Define pricing and features for employees, hospitals, or ambulance owners.</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/subscriptions')}>
          Back to subscriptions
        </button>
      </div>

      <div className="steps">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
            onClick={() => i < step && setStep(i)}
          >
            <span>{i + 1}</span>
            {label}
          </button>
        ))}
      </div>

      <form className="card card-pad" onSubmit={next}>
        {step === 0 && (
          <div className="form-grid">
            <div className="field full">
              <label>Plan for</label>
              <select value={form.audience} onChange={(e) => setField('audience', e.target.value as SubscriptionAudience)}>
                {AUDIENCES.map((a) => (
                  <option key={a} value={a}>
                    {a === 'Employee' ? 'Employees (healthcare professionals)' : a === 'Hospital' ? 'Hospitals (hiring partners)' : 'Ambulance owners (fleet operators)'}
                  </option>
                ))}
              </select>
            </div>
            <Field
              label="Plan name"
              value={form.name}
              onChange={(v) => setField('name', v)}
              placeholder={
                form.audience === 'Employee'
                  ? 'e.g. Professional, Premium'
                  : form.audience === 'Hospital'
                    ? 'e.g. Hospital Starter, Growth'
                    : 'e.g. Fleet Starter, Fleet Pro'
              }
            />
            {form.name.trim() && nameTaken(form.name) && (
              <p className="field-hint error full">A plan with this name already exists for {form.audience.toLowerCase()}s.</p>
            )}
            <Field
              label="Monthly price"
              value={form.monthlyPrice}
              onChange={(v) => setField('monthlyPrice', v)}
              placeholder="e.g. ₹499 or Free"
            />
            <Field
              label="Yearly price"
              value={form.yearlyPrice}
              onChange={(v) => setField('yearlyPrice', v)}
              placeholder="e.g. ₹4,999 or Free"
            />
            <div className="field full">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.popular}
                  onChange={(e) => setField('popular', e.target.checked)}
                />
                Mark as popular (shows badge in app and admin)
              </label>
            </div>
          </div>
        )}

        {step === 1 && (
          <>
            <p className="muted" style={{ marginBottom: 14 }}>
              List what {form.audience.toLowerCase()}s get with this plan. Add at least one feature.
            </p>
            <div className="feature-add-row">
              <input
                placeholder={
                  form.audience === 'Employee'
                    ? 'e.g. Unlimited job applications'
                    : form.audience === 'Hospital'
                      ? 'e.g. Unlimited job posts'
                      : 'e.g. Priority dispatch routing'
                }
                value={form.featureDraft}
                onChange={(e) => setField('featureDraft', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addFeature()
                  }
                }}
              />
              <button type="button" className="btn btn-outline" onClick={addFeature} disabled={!form.featureDraft.trim()}>
                <Plus size={16} />
                Add
              </button>
            </div>
            {form.features.length > 0 ? (
              <ul className="feature-edit-list">
                {form.features.map((f) => (
                  <li key={f}>
                    <span>{f}</span>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeFeature(f)} aria-label="Remove">
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted" style={{ marginTop: 12 }}>
                No features added yet.
              </p>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <p className="muted" style={{ marginBottom: 14 }}>
              Confirm details. The plan will be <strong>Active</strong> and visible to {form.audience.toLowerCase()}s in the mobile app immediately.
            </p>
            <div className="detail-grid">
              <Meta label="Audience" value={form.audience} />
              <Meta label="Plan name" value={form.name} />
              <Meta label="Monthly" value={form.monthlyPrice} />
              <Meta label="Yearly" value={form.yearlyPrice} />
              <Meta label="Popular" value={form.popular ? 'Yes' : 'No'} />
            </div>
            <ul className="plan-features" style={{ marginTop: 14 }}>
              {form.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </>
        )}

        <div className="modal-actions">
          {step > 0 && (
            <button type="button" className="btn btn-outline" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          <button className="btn btn-primary" disabled={!canContinue()}>
            {step === 2 ? 'Publish plan' : 'Continue'}
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
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} required />
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
