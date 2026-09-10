import { Check, Crown, Search } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusChip from '../components/StatusChip'
import { useDirectory } from '../data/directory'
import type { SubscriptionBilling, SubscriptionPlanName } from '../types'

const STEPS = ['User', 'Plan & billing', 'Review'] as const
const BILLING_OPTIONS: SubscriptionBilling[] = ['Monthly', 'Yearly', 'Manual']

interface FormState {
  userId: string
  plan: SubscriptionPlanName
  billing: SubscriptionBilling
  customExpiry: string
  notes: string
}

const empty: FormState = {
  userId: '',
  plan: 'Professional',
  billing: 'Manual',
  customExpiry: '',
  notes: '',
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function expiryFor(billing: SubscriptionBilling, customExpiry?: string): string | null {
  if (billing === 'Manual') {
    if (customExpiry) return formatDate(new Date(customExpiry))
    return null
  }
  const d = new Date()
  if (billing === 'Monthly') d.setMonth(d.getMonth() + 1)
  else d.setFullYear(d.getFullYear() + 1)
  return formatDate(d)
}

export default function CreateSubscription() {
  const navigate = useNavigate()
  const { professionals, subscriptionPlans, userSubscriptions, activateSubscription } = useDirectory()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(empty)
  const [query, setQuery] = useState('')

  const selectedUser = professionals.find((p) => p.id === form.userId)
  const selectedPlan = subscriptionPlans.find((p) => p.name === form.plan)
  const existingSub = userSubscriptions.find((s) => s.userId === form.userId)

  const filteredUsers = useMemo(() => {
    const q = query.toLowerCase()
    return professionals.filter(
      (p) => !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q),
    )
  }, [professionals, query])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function canContinue(): boolean {
    if (step === 0) return !!form.userId
    if (step === 1) return !!form.plan
    return true
  }

  function next(e: FormEvent) {
    e.preventDefault()
    if (!canContinue()) return

    if (step < 2) {
      setStep(step + 1)
      return
    }

    if (!selectedUser) return
    activateSubscription({
      userId: selectedUser.id,
      userName: selectedUser.name,
      email: selectedUser.email,
      plan: form.plan,
      billing: form.billing,
      expiresOn: expiryFor(form.billing, form.customExpiry || undefined),
      notes: form.notes.trim() || undefined,
    })
    navigate('/subscriptions', { replace: true, state: { justActivated: selectedUser.name } })
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>Activate subscription</h3>
          <p>Grant a plan to a professional — changes apply in the mobile app immediately.</p>
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
          <>
            <p className="muted" style={{ marginBottom: 14 }}>
              Select the professional who should receive this subscription.
            </p>
            <div className="search" style={{ marginBottom: 14 }}>
              <Search size={16} color="#98A2B3" />
              <input
                placeholder="Search by name or email"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="user-picker">
              {filteredUsers.map((p) => {
                const sub = userSubscriptions.find((s) => s.userId === p.id)
                const selected = form.userId === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`user-pick ${selected ? 'selected' : ''}`}
                    onClick={() => setField('userId', p.id)}
                  >
                    <div className="user-pick-main">
                      <strong>{p.name}</strong>
                      <span className="muted">{p.email}</span>
                      <span className="muted">
                        {p.specialization} · {p.location}
                      </span>
                    </div>
                    <div className="user-pick-side">
                      {sub ? (
                        <StatusChip label={sub.status} />
                      ) : (
                        <StatusChip label={p.subscriptionStatus ?? 'None'} />
                      )}
                      {selected && <Check size={18} color="#0D9488" />}
                    </div>
                  </button>
                )
              })}
              {filteredUsers.length === 0 && (
                <p className="muted" style={{ padding: '12px 0' }}>
                  No professionals match your search.
                </p>
              )}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            {selectedUser && (
              <div className="notice" style={{ marginBottom: 14 }}>
                Activating for <strong>{selectedUser.name}</strong>
                {existingSub?.status === 'Active' && (
                  <span> — this will replace their current {existingSub.plan} plan.</span>
                )}
              </div>
            )}
            <div className="form-grid">
              <div className="field full">
                <label>Plan</label>
                <div className="plan-pick-grid">
                  {subscriptionPlans
                    .filter((p) => p.active)
                    .map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={`plan-pick ${form.plan === p.name ? 'selected' : ''}`}
                        onClick={() => setField('plan', p.name)}
                      >
                        {p.name === 'Professional' && (
                          <span className="plan-badge">
                            <Crown size={12} /> Popular
                          </span>
                        )}
                        <strong>{p.name}</strong>
                        <span className="muted">{p.monthlyPrice}/mo</span>
                      </button>
                    ))}
                </div>
              </div>
              <div className="field">
                <label>Billing cycle</label>
                <select
                  value={form.billing}
                  onChange={(e) => setField('billing', e.target.value as SubscriptionBilling)}
                >
                  {BILLING_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              {form.billing === 'Manual' && (
                <div className="field">
                  <label>
                    Expiry date <span className="muted">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={form.customExpiry}
                    onChange={(e) => setField('customExpiry', e.target.value)}
                  />
                </div>
              )}
              <div className="field full">
                <label>
                  Admin notes <span className="muted">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Complimentary access for conference speaker"
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                />
              </div>
            </div>
            {selectedPlan && (
              <ul className="plan-features" style={{ marginTop: 14 }}>
                {selectedPlan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            )}
          </>
        )}

        {step === 2 && selectedUser && (
          <>
            <p className="muted" style={{ marginBottom: 14 }}>
              Review and confirm. The subscription goes live immediately in the mobile app.
            </p>
            <div className="detail-grid">
              <Meta label="User" value={selectedUser.name} />
              <Meta label="Email" value={selectedUser.email} />
              <Meta label="Plan" value={form.plan} />
              <Meta label="Billing" value={form.billing} />
              <Meta label="Expires" value={expiryFor(form.billing, form.customExpiry || undefined) ?? 'No expiry'} />
              {form.notes && <Meta label="Notes" value={form.notes} />}
            </div>
          </>
        )}

        <div className="modal-actions">
          {step > 0 && (
            <button type="button" className="btn btn-outline" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          <button className="btn btn-primary" disabled={!canContinue()}>
            {step === 2 ? 'Activate subscription' : 'Continue'}
          </button>
        </div>
      </form>
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
