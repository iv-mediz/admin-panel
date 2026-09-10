import { Crown, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import StatusChip from '../components/StatusChip'
import { useDirectory } from '../data/directory'
import type { Professional, SubscriptionBilling, SubscriptionLocationState } from '../types'

const TABS = ['Subscribers', 'Plans'] as const
const BILLING_OPTIONS: SubscriptionBilling[] = ['Monthly', 'Yearly', 'Manual']

function expiryFor(billing: SubscriptionBilling): string | null {
  const d = new Date()
  if (billing === 'Monthly') d.setMonth(d.getMonth() + 1)
  else if (billing === 'Yearly') d.setFullYear(d.getFullYear() + 1)
  else return null
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Subscriptions() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    subscriptionPlans,
    userSubscriptions,
    professionals,
    activateSubscription,
    cancelSubscription,
  } = useDirectory()
  const state = location.state as SubscriptionLocationState | null
  const [tab, setTab] = useState<(typeof TABS)[number]>(state?.plansTab ? 'Plans' : 'Subscribers')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState('')
  const [plan, setPlan] = useState('')
  const [billing, setBilling] = useState<SubscriptionBilling>('Manual')

  useEffect(() => {
    if (state?.plansTab) setTab('Plans')
  }, [state?.plansTab])

  const activePlans = subscriptionPlans.filter((p) => p.active)

  const filtered = useMemo(() => {
    return userSubscriptions.filter((s) => {
      const q = query.toLowerCase()
      return (
        !q ||
        s.userName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.plan.toLowerCase().includes(q)
      )
    })
  }, [userSubscriptions, query])

  const activeCount = userSubscriptions.filter((s) => s.status === 'Active').length
  const manualCount = userSubscriptions.filter((s) => s.billing === 'Manual').length

  function submit(e: FormEvent) {
    e.preventDefault()
    const user = professionals.find((p) => p.id === userId)
    if (!user || !plan) return
    activateSubscription({
      userId: user.id,
      userName: user.name,
      email: user.email,
      plan,
      billing,
      expiresOn: expiryFor(billing),
    })
    setOpen(false)
    setUserId('')
    setPlan(activePlans[0]?.name ?? '')
    setBilling('Manual')
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>Manage subscriptions</h3>
          <p>View plans, active subscribers, and manually activate a subscription for any user.</p>
        </div>
        {tab === 'Subscribers' ? (
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} />
            Activate for user
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => navigate('/subscriptions/plans/create')}>
            <Plus size={16} />
            Create plan
          </button>
        )}
      </div>

      {state?.justCreatedPlan && (
        <div className="notice">
          <strong>{state.justCreatedPlan}</strong> plan is now live in the mobile app.
        </div>
      )}
      {state?.justActivated && (
        <div className="notice">
          Subscription activated for <strong>{state.justActivated}</strong>. It is live in the mobile app.
        </div>
      )}

      <section className="stats">
        <article className="stat-card">
          <div className="stat-label">Active subscribers</div>
          <div className="stat-value">{activeCount}</div>
          <div className="stat-meta up">{manualCount} admin-granted</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Plans live</div>
          <div className="stat-value">{activePlans.length}</div>
          <div className="stat-meta">{activePlans.map((p) => p.name).join(', ') || 'None'}</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Professionals</div>
          <div className="stat-value">{professionals.length}</div>
          <div className="stat-meta">Mobile app users</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Expired / cancelled</div>
          <div className="stat-value">
            {userSubscriptions.filter((s) => s.status === 'Expired' || s.status === 'Cancelled').length}
          </div>
          <div className="stat-meta">Needs renewal</div>
        </article>
      </section>

      <div className="pills" style={{ marginBottom: 14 }}>
        {TABS.map((t) => (
          <button key={t} className={`pill ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Subscribers' ? (
        <>
          <div className="toolbar">
            <div className="search">
              <Search size={16} color="#98A2B3" />
              <input
                placeholder="Search subscriber, email or plan"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="card table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Billing</th>
                  <th>Started</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="cell-title">{s.userName}</div>
                      <div className="cell-sub">{s.email}</div>
                    </td>
                    <td>
                      <strong>{s.plan}</strong>
                      {s.activatedBy && <div className="cell-sub">Granted by {s.activatedBy}</div>}
                    </td>
                    <td>{s.billing}</td>
                    <td>{s.startedOn}</td>
                    <td>{s.expiresOn ?? '—'}</td>
                    <td>
                      <StatusChip label={s.status} />
                    </td>
                    <td>
                      {s.status === 'Active' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => cancelSubscription(s.userId)}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="plan-grid">
          {subscriptionPlans.map((p) => (
            <article className="plan-card" key={p.id}>
              {p.popular && (
                <span className="plan-badge">
                  <Crown size={12} /> Popular
                </span>
              )}
              <h4>{p.name}</h4>
              <div className="plan-price">
                <strong>{p.monthlyPrice}</strong>
                <span className="muted">/month</span>
              </div>
              <p className="muted" style={{ margin: '4px 0 12px' }}>
                {p.yearlyPrice}/year
              </p>
              <ul className="plan-features">
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <StatusChip label={p.active ? 'Active' : 'Paused'} />
            </article>
          ))}
        </div>
      )}

      {open && (
        <Modal title="Activate subscription for user" onClose={() => setOpen(false)}>
          <p className="muted" style={{ marginBottom: 14 }}>
            Grant a plan to an individual professional. Manual activations appear in the app immediately.
          </p>
          <form className="form-grid" onSubmit={submit}>
            <div className="field full">
              <label>Professional</label>
              <select value={userId} onChange={(e) => setUserId(e.target.value)} required>
                <option value="">Select user</option>
                {professionals.map((p: Professional) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Plan</label>
              <select value={plan} onChange={(e) => setPlan(e.target.value)} required>
                <option value="">Select plan</option>
                {activePlans.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Billing</label>
              <select value={billing} onChange={(e) => setBilling(e.target.value as SubscriptionBilling)}>
                {BILLING_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div className="field full">
              <button className="btn btn-primary" type="submit" disabled={!userId || !plan}>
                Activate subscription
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
