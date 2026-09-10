import { MapPinned, Plus, Search } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import LocationFilters from '../components/LocationFilters'
import Modal from '../components/Modal'
import StatusChip from '../components/StatusChip'
import { useDirectory } from '../data/directory'
import type { FranchiseStatus } from '../types'

const TABS = ['All', 'Active', 'Pending', 'Suspended'] as const

const empty = {
  name: '',
  owner: '',
  email: '',
  phone: '',
  stateId: '',
  cities: [] as string[],
  commission: '12%',
}

export default function Franchises() {
  const { franchises, states, cities, addFranchise, setFranchiseStatus } = useDirectory()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<(typeof TABS)[number]>('All')
  const [stateFilter, setStateFilter] = useState('All')
  const [districtFilter, setDistrictFilter] = useState('All')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)

  const stateCities = useMemo(() => {
    if (!form.stateId) return []
    return cities.filter((c) => c.stateId === form.stateId).map((c) => c.name)
  }, [cities, form.stateId])

  const filtered = useMemo(() => {
    return franchises.filter((f) => {
      const q = query.toLowerCase()
      const matchesQuery =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.owner.toLowerCase().includes(q) ||
        f.stateName.toLowerCase().includes(q) ||
        f.cities.some((c) => c.toLowerCase().includes(q))
      const matchesState = stateFilter === 'All' || f.stateName === stateFilter
      const matchesDistrict = districtFilter === 'All' || f.cities.includes(districtFilter)
      return matchesQuery && matchesState && matchesDistrict && (tab === 'All' || f.status === tab)
    })
  }, [franchises, query, tab, stateFilter, districtFilter])

  function toggleCity(city: string) {
    setForm((prev) => ({
      ...prev,
      cities: prev.cities.includes(city) ? prev.cities.filter((c) => c !== city) : [...prev.cities, city],
    }))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const state = states.find((s) => s.id === form.stateId)
    if (!state || form.cities.length === 0) return
    addFranchise({
      id: `fr-${Date.now()}`,
      name: form.name,
      owner: form.owner,
      email: form.email,
      phone: form.phone,
      stateId: state.id,
      stateName: state.name,
      cities: form.cities,
      commission: form.commission,
      status: 'Pending',
      joined: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    })
    setForm(empty)
    setOpen(false)
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>Franchises</h3>
          <p>Assign franchise partners to manage jobs, ambulances, and operations in specific locations.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} />
          Add franchise
        </button>
      </div>

      <section className="stats">
        <article className="stat-card">
          <div className="stat-label">Franchise partners</div>
          <div className="stat-value">{franchises.length}</div>
          <div className="stat-meta">{franchises.filter((f) => f.status === 'Active').length} active</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">States covered</div>
          <div className="stat-value">{new Set(franchises.map((f) => f.stateId)).size}</div>
          <div className="stat-meta">Location territories</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Cities managed</div>
          <div className="stat-value">{franchises.reduce((a, f) => a + f.cities.length, 0)}</div>
          <div className="stat-meta">Across all franchises</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Pending approval</div>
          <div className="stat-value">{franchises.filter((f) => f.status === 'Pending').length}</div>
          <div className="stat-meta">New applications</div>
        </article>
      </section>

      <div className="toolbar">
        <div className="search">
          <Search size={16} color="#98A2B3" />
          <input placeholder="Search franchise, owner, state or city" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <LocationFilters
          state={stateFilter}
          district={districtFilter}
          onStateChange={setStateFilter}
          onDistrictChange={setDistrictFilter}
        />
      </div>
      <div className="pills" style={{ marginBottom: 14 }}>
        {TABS.map((t) => (
          <button key={t} className={`pill ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Franchise</th>
              <th>Owner</th>
              <th>Territory</th>
              <th>Cities</th>
              <th>Commission</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id}>
                <td>
                  <div className="cell-title">{f.name}</div>
                  <div className="cell-sub">Since {f.joined}</div>
                </td>
                <td>
                  {f.owner}
                  <div className="cell-sub">{f.email}</div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPinned size={14} color="var(--primary)" />
                    {f.stateName}
                  </div>
                </td>
                <td>
                  <div className="tag-row">
                    {f.cities.map((c) => (
                      <span className="tag" key={c}>
                        {c}
                      </span>
                    ))}
                  </div>
                </td>
                <td>{f.commission}</td>
                <td>
                  <StatusChip label={f.status} />
                </td>
                <td>
                  {f.status === 'Pending' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setFranchiseStatus(f.id, 'Active')}>
                      Approve
                    </button>
                  )}
                  {f.status === 'Active' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setFranchiseStatus(f.id, 'Suspended' as FranchiseStatus)}>
                      Suspend
                    </button>
                  )}
                  {f.status === 'Suspended' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setFranchiseStatus(f.id, 'Active')}>
                      Reactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title="Add franchise partner" wide onClose={() => setOpen(false)}>
          <p className="muted" style={{ marginBottom: 14 }}>
            Franchise partners manage iv mediz operations for selected cities within a state.
          </p>
          <form className="form-grid" onSubmit={submit}>
            <Field label="Franchise name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Owner name" value={form.owner} onChange={(v) => setForm({ ...form, owner: v })} />
            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <div className="field">
              <label>State</label>
              <select
                value={form.stateId}
                onChange={(e) => setForm({ ...form, stateId: e.target.value, cities: [] })}
                required
              >
                <option value="">Select state</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Commission</label>
              <select value={form.commission} onChange={(e) => setForm({ ...form, commission: e.target.value })}>
                {['8%', '10%', '12%', '15%'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="field full">
              <label>Cities to manage</label>
              {!form.stateId ? (
                <p className="muted">Select a state first</p>
              ) : (
                <div className="tag-row" style={{ marginTop: 8 }}>
                  {stateCities.map((city) => {
                    const selected = form.cities.includes(city)
                    return (
                      <button
                        type="button"
                        key={city}
                        className={`tag tag-btn ${selected ? 'active' : ''}`}
                        onClick={() => toggleCity(city)}
                      >
                        {city}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="field full">
              <button className="btn btn-primary" type="submit" disabled={!form.stateId || form.cities.length === 0}>
                Create franchise
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} required />
    </div>
  )
}
