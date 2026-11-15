import { Crown, Pencil, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import LocationFilters from '../components/LocationFilters'
import Modal from '../components/Modal'
import StatusChip from '../components/StatusChip'
import { useDirectory } from '../data/directory'
import type {
  EntitySubscription,
  SubscriptionAudience,
  SubscriptionBilling,
  SubscriptionLocationState,
  SubscriptionPlan,
} from '../types'
import { matchesLocation } from '../utils/locationFilter'

const TABS = ['Subscribers', 'Plans'] as const
const AUDIENCES: SubscriptionAudience[] = ['Employee', 'Hospital', 'Ambulance owner']
const BILLING_OPTIONS: SubscriptionBilling[] = ['Monthly', 'Yearly', 'Manual']

function expiryFor(billing: SubscriptionBilling): string | null {
  const d = new Date()
  if (billing === 'Monthly') d.setMonth(d.getMonth() + 1)
  else if (billing === 'Yearly') d.setFullYear(d.getFullYear() + 1)
  else return null
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function subscriberLocation(
  sub: EntitySubscription,
  professionals: ReturnType<typeof useDirectory>['professionals'],
  hospitals: ReturnType<typeof useDirectory>['hospitals'],
  fleet: ReturnType<typeof useDirectory>['fleet'],
) {
  if (sub.subscriberType === 'Employee') return professionals.find((p) => p.id === sub.subscriberId)
  if (sub.subscriberType === 'Hospital') return hospitals.find((h) => h.id === sub.subscriberId)
  return fleet.find((v) => v.id === sub.subscriberId)
}

export default function Subscriptions() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    subscriptionPlans,
    userSubscriptions,
    professionals,
    hospitals,
    fleet,
    activateSubscription,
    cancelSubscription,
    updateSubscriptionPlan,
    updateUserSubscription,
  } = useDirectory()
  const state = location.state as SubscriptionLocationState | null
  const [tab, setTab] = useState<(typeof TABS)[number]>(state?.plansTab ? 'Plans' : 'Subscribers')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [editingSub, setEditingSub] = useState<EntitySubscription | null>(null)
  const [editPlanName, setEditPlanName] = useState('')
  const [editBilling, setEditBilling] = useState<SubscriptionBilling>('Manual')
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [planForm, setPlanForm] = useState({
    name: '',
    audience: 'Employee' as SubscriptionAudience,
    monthlyPrice: '',
    yearlyPrice: '',
    popular: false,
    active: true,
    featuresText: '',
  })
  const [subscriberType, setSubscriberType] = useState<SubscriptionAudience>('Employee')
  const [subscriberId, setSubscriberId] = useState('')
  const [plan, setPlan] = useState('')
  const [billing, setBilling] = useState<SubscriptionBilling>('Manual')
  const [audienceFilter, setAudienceFilter] = useState<SubscriptionAudience | 'All'>('All')
  const [stateFilter, setStateFilter] = useState('All')
  const [districtFilter, setDistrictFilter] = useState('All')

  useEffect(() => {
    if (state?.plansTab) setTab('Plans')
  }, [state?.plansTab])

  const activePlans = subscriptionPlans.filter((p) => p.active)
  const plansForAudience = useMemo(
    () => activePlans.filter((p) => p.audience === subscriberType),
    [activePlans, subscriberType],
  )

  useEffect(() => {
    if (plan && !plansForAudience.some((p) => p.name === plan)) {
      setPlan(plansForAudience[0]?.name ?? '')
    }
  }, [subscriberType, plansForAudience, plan])

  const filteredPlans = useMemo(() => {
    return subscriptionPlans.filter((p) => audienceFilter === 'All' || p.audience === audienceFilter)
  }, [subscriptionPlans, audienceFilter])

  const filtered = useMemo(() => {
    return userSubscriptions.filter((s) => {
      const q = query.toLowerCase()
      const matchesQuery =
        !q ||
        s.subscriberName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.plan.toLowerCase().includes(q)
      const matchesAudience = audienceFilter === 'All' || s.subscriberType === audienceFilter
      const loc = subscriberLocation(s, professionals, hospitals, fleet)
      const matchesLoc = loc ? matchesLocation(loc, stateFilter, districtFilter) : stateFilter === 'All' && districtFilter === 'All'
      return matchesQuery && matchesAudience && matchesLoc
    })
  }, [userSubscriptions, professionals, hospitals, fleet, query, audienceFilter, stateFilter, districtFilter])

  const activeCount = userSubscriptions.filter((s) => s.status === 'Active').length
  const manualCount = userSubscriptions.filter((s) => s.billing === 'Manual').length
  const hospitalSubs = userSubscriptions.filter((s) => s.subscriberType === 'Hospital' && s.status === 'Active').length
  const fleetSubs = userSubscriptions.filter((s) => s.subscriberType === 'Ambulance owner' && s.status === 'Active').length

  function openActivate() {
    setSubscriberType('Employee')
    setSubscriberId('')
    setPlan(activePlans.find((p) => p.audience === 'Employee')?.name ?? '')
    setBilling('Manual')
    setOpen(true)
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!subscriberId || !plan) return

    if (subscriberType === 'Employee') {
      const user = professionals.find((p) => p.id === subscriberId)
      if (!user) return
      activateSubscription({
        subscriberId: user.id,
        subscriberType: 'Employee',
        subscriberName: user.name,
        email: user.email,
        plan,
        billing,
        expiresOn: expiryFor(billing),
      })
    } else if (subscriberType === 'Hospital') {
      const hospital = hospitals.find((h) => h.id === subscriberId)
      if (!hospital) return
      activateSubscription({
        subscriberId: hospital.id,
        subscriberType: 'Hospital',
        subscriberName: hospital.name,
        email: hospital.email ?? `${hospital.contact.replace(/\s+/g, '')}@hospital.ivmediz.in`,
        plan,
        billing,
        expiresOn: expiryFor(billing),
      })
    } else {
      const vehicle = fleet.find((v) => v.id === subscriberId)
      if (!vehicle) return
      activateSubscription({
        subscriberId: vehicle.id,
        subscriberType: 'Ambulance owner',
        subscriberName: vehicle.operator,
        email: vehicle.email ?? `${vehicle.phone.replace(/\s+/g, '')}@fleet.ivmediz.in`,
        plan,
        billing,
        expiresOn: expiryFor(billing),
      })
    }

    setOpen(false)
    setSubscriberId('')
    setPlan('')
    setBilling('Manual')
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>Manage subscriptions</h3>
          <p>Create plans and activate subscriptions for employees, hospitals, and ambulance owners.</p>
        </div>
        {tab === 'Subscribers' ? (
          <button className="btn btn-primary" onClick={openActivate}>
            <Plus size={16} />
            Activate subscription
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
          <div className="stat-meta">{AUDIENCES.map((a) => `${activePlans.filter((p) => p.audience === a).length} ${a.toLowerCase()}`).join(' · ')}</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Hospital partners</div>
          <div className="stat-value">{hospitalSubs}</div>
          <div className="stat-meta">Active hospital subscriptions</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Ambulance fleets</div>
          <div className="stat-value">{fleetSubs}</div>
          <div className="stat-meta">Active fleet subscriptions</div>
        </article>
      </section>

      <div className="pills" style={{ marginBottom: 14 }}>
        {TABS.map((t) => (
          <button key={t} className={`pill ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="pills" style={{ marginBottom: 14 }}>
        <button className={`pill ${audienceFilter === 'All' ? 'active' : ''}`} onClick={() => setAudienceFilter('All')}>
          All audiences
        </button>
        {AUDIENCES.map((a) => (
          <button key={a} className={`pill ${audienceFilter === a ? 'active' : ''}`} onClick={() => setAudienceFilter(a)}>
            {a === 'Ambulance owner' ? 'Ambulance owners' : `${a}s`}
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
            <LocationFilters
              state={stateFilter}
              district={districtFilter}
              onStateChange={setStateFilter}
              onDistrictChange={setDistrictFilter}
            />
          </div>
          <div className="card table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Subscriber</th>
                  <th>Type</th>
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
                      <div className="cell-title">{s.subscriberName}</div>
                      <div className="cell-sub">{s.email}</div>
                    </td>
                    <td>
                      <StatusChip label={s.subscriberType} />
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
                    <td className="row-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        type="button"
                        onClick={() => {
                          setEditingSub(s)
                          setEditPlanName(s.plan)
                          setEditBilling(s.billing)
                        }}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      {s.status === 'Active' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => cancelSubscription(s.subscriberId, s.subscriberType)}
                        >
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
          {filteredPlans.map((p) => (
            <article className="plan-card" key={p.id}>
              {p.popular && (
                <span className="plan-badge">
                  <Crown size={12} /> Popular
                </span>
              )}
              <StatusChip label={p.audience} />
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
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ marginTop: 12 }}
                onClick={() => {
                  setEditingPlan(p)
                  setPlanForm({
                    name: p.name,
                    audience: p.audience,
                    monthlyPrice: p.monthlyPrice,
                    yearlyPrice: p.yearlyPrice,
                    popular: !!p.popular,
                    active: p.active,
                    featuresText: p.features.join('\n'),
                  })
                }}
              >
                <Pencil size={14} />
                Edit plan
              </button>
            </article>
          ))}
        </div>
      )}

      {open && (
        <Modal title="Activate subscription" onClose={() => setOpen(false)}>
          <p className="muted" style={{ marginBottom: 14 }}>
            Grant a plan to an employee, hospital, or ambulance owner. Manual activations appear in the app immediately.
          </p>
          <form className="form-grid" onSubmit={submit}>
            <div className="field full">
              <label>Subscriber type</label>
              <select
                value={subscriberType}
                onChange={(e) => {
                  const next = e.target.value as SubscriptionAudience
                  setSubscriberType(next)
                  setSubscriberId('')
                  setPlan(activePlans.find((p) => p.audience === next)?.name ?? '')
                }}
              >
                {AUDIENCES.map((a) => (
                  <option key={a} value={a}>
                    {a === 'Ambulance owner' ? 'Ambulance owner (fleet operator)' : a}
                  </option>
                ))}
              </select>
            </div>
            <div className="field full">
              <label>
                {subscriberType === 'Employee' ? 'Professional' : subscriberType === 'Hospital' ? 'Hospital' : 'Fleet operator'}
              </label>
              <select value={subscriberId} onChange={(e) => setSubscriberId(e.target.value)} required>
                <option value="">Select {subscriberType === 'Employee' ? 'employee' : subscriberType === 'Hospital' ? 'hospital' : 'operator'}</option>
                {subscriberType === 'Employee' &&
                  professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.email}
                    </option>
                  ))}
                {subscriberType === 'Hospital' &&
                  hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} — {h.city}, {h.state}
                    </option>
                  ))}
                {subscriberType === 'Ambulance owner' &&
                  fleet.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.operator} — {v.vehicle}
                    </option>
                  ))}
              </select>
            </div>
            <div className="field">
              <label>Plan</label>
              <select value={plan} onChange={(e) => setPlan(e.target.value)} required>
                <option value="">Select plan</option>
                {plansForAudience.map((p) => (
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
              <button className="btn btn-primary" type="submit" disabled={!subscriberId || !plan}>
                Activate subscription
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editingSub && (
        <Modal title={`Edit subscription — ${editingSub.subscriberName}`} onClose={() => setEditingSub(null)}>
          <form
            className="form-grid"
            onSubmit={(e) => {
              e.preventDefault()
              updateUserSubscription(editingSub.id, {
                planName: editPlanName,
                billing: editBilling,
              })
              setEditingSub(null)
            }}
          >
            <div className="field full">
              <label>Plan</label>
              <select value={editPlanName} onChange={(e) => setEditPlanName(e.target.value)} required>
                {subscriptionPlans
                  .filter((p) => p.audience === editingSub.subscriberType)
                  .map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="field full">
              <label>Billing</label>
              <select value={editBilling} onChange={(e) => setEditBilling(e.target.value as SubscriptionBilling)}>
                {BILLING_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setEditingSub(null)}>
                Cancel
              </button>
              <button className="btn btn-primary">Save changes</button>
            </div>
          </form>
        </Modal>
      )}

      {editingPlan && (
        <Modal title="Edit plan" onClose={() => setEditingPlan(null)}>
          <form
            className="form-grid"
            onSubmit={(e) => {
              e.preventDefault()
              updateSubscriptionPlan(editingPlan.id, {
                name: planForm.name.trim(),
                audience: planForm.audience,
                monthlyPrice: planForm.monthlyPrice.trim(),
                yearlyPrice: planForm.yearlyPrice.trim(),
                popular: planForm.popular,
                active: planForm.active,
                features: planForm.featuresText
                  .split('\n')
                  .map((f) => f.trim())
                  .filter(Boolean),
              })
              setEditingPlan(null)
            }}
          >
            <div className="field">
              <label>Plan name</label>
              <input
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Audience</label>
              <select
                value={planForm.audience}
                onChange={(e) => setPlanForm({ ...planForm, audience: e.target.value as SubscriptionAudience })}
              >
                {AUDIENCES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Monthly price</label>
              <input
                value={planForm.monthlyPrice}
                onChange={(e) => setPlanForm({ ...planForm, monthlyPrice: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Yearly price</label>
              <input
                value={planForm.yearlyPrice}
                onChange={(e) => setPlanForm({ ...planForm, yearlyPrice: e.target.value })}
                required
              />
            </div>
            <div className="field full">
              <label>Features (one per line)</label>
              <textarea
                rows={5}
                value={planForm.featuresText}
                onChange={(e) => setPlanForm({ ...planForm, featuresText: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={planForm.popular}
                  onChange={(e) => setPlanForm({ ...planForm, popular: e.target.checked })}
                />
                Popular
              </label>
            </div>
            <div className="field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={planForm.active}
                  onChange={(e) => setPlanForm({ ...planForm, active: e.target.checked })}
                />
                Active
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setEditingPlan(null)}>
                Cancel
              </button>
              <button className="btn btn-primary">Save plan</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
