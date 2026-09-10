import { Crown, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import StatusChip from '../components/StatusChip'
import { useDirectory } from '../data/directory'
import type { SubscriptionLocationState } from '../types'

const TABS = ['Subscribers', 'Plans'] as const

export default function Subscriptions() {
  const navigate = useNavigate()
  const location = useLocation()
  const { subscriptionPlans, userSubscriptions, professionals, cancelSubscription } = useDirectory()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Subscribers')
  const [query, setQuery] = useState('')
  const notice = (location.state as SubscriptionLocationState | null)?.justActivated

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

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>Manage subscriptions</h3>
          <p>View plans, active subscribers, and manually activate a subscription for any user.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/subscriptions/create')}>
          <Plus size={16} />
          Activate for user
        </button>
      </div>

      {notice && (
        <div className="notice">
          Subscription activated for <strong>{notice}</strong>. It is live in the mobile app.
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
          <div className="stat-value">{subscriptionPlans.filter((p) => p.active).length}</div>
          <div className="stat-meta">Basic, Professional, Premium</div>
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
              {p.name === 'Professional' && (
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
    </div>
  )
}
