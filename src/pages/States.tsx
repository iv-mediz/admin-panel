import { Pencil, Plus, Search } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import LocationFilters from '../components/LocationFilters'
import Modal from '../components/Modal'
import ActiveToggle from '../components/ActiveToggle'
import { useDirectory } from '../data/directory'

const TABS = ['All', 'Active', 'Pending', 'Paused'] as const

const empty = {
  name: '',
  code: '',
  capital: '',
}

export default function States() {
  const navigate = useNavigate()
  const { states, cities, hospitals, addState, updateState, setStateStatus } = useDirectory()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<(typeof TABS)[number]>('All')
  const [stateFilter, setStateFilter] = useState('All')
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(empty)

  const filtered = useMemo(() => {
    return states.filter((s) => {
      const q = query.toLowerCase()
      const matchesQuery = !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
      const matchesState = stateFilter === 'All' || s.name === stateFilter
      return matchesQuery && matchesState && (tab === 'All' || s.status === tab)
    })
  }, [states, query, tab, stateFilter])

  function submit(e: FormEvent) {
    e.preventDefault()
    if (editingId) {
      updateState(editingId, {
        name: form.name.trim(),
        code: form.code.toUpperCase(),
        capital: form.capital.trim(),
      })
    } else {
      addState({
        id: `st-${Date.now()}`,
        name: form.name.trim(),
        code: form.code.toUpperCase(),
        capital: form.capital.trim(),
        status: 'Pending',
      })
    }
    setForm(empty)
    setEditingId(null)
    setOpen(false)
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>States</h3>
          <p>States where iv mediz lists jobs and ambulance services</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingId(null)
            setForm(empty)
            setOpen(true)
          }}
        >
          <Plus size={16} />
          Add state
        </button>
      </div>

      <section className="stats">
        <article className="stat-card">
          <div className="stat-label">States</div>
          <div className="stat-value">{states.length}</div>
          <div className="stat-meta up">{states.filter((s) => s.status === 'Active').length} live</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Cities</div>
          <div className="stat-value">{cities.length}</div>
          <div className="stat-meta">Across all states</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value">{states.filter((s) => s.status === 'Pending').length}</div>
          <div className="stat-meta">Waiting to go live</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Hospitals</div>
          <div className="stat-value">{hospitals.length}</div>
          <div className="stat-meta">Mapped to these states</div>
        </article>
      </section>

      <div className="toolbar">
        <div className="search">
          <Search size={16} color="#98A2B3" />
          <input placeholder="Search state or code" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <LocationFilters
          state={stateFilter}
          district="All"
          onStateChange={setStateFilter}
          onDistrictChange={() => {}}
          showDistrict={false}
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
              <th>State</th>
              <th>Code</th>
              <th>Capital</th>
              <th>Cities</th>
              <th>Hospitals</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td className="cell-title">{s.name}</td>
                <td>{s.code}</td>
                <td>{s.capital}</td>
                <td>{cities.filter((c) => c.stateId === s.id).length}</td>
                <td>{hospitals.filter((h) => h.state === s.name).length}</td>
                <td>
                  <ActiveToggle
                    active={s.status === 'Active'}
                    ariaLabel={`${s.name} state`}
                    onChange={(on) => setStateStatus(s.id, on ? 'Active' : 'Paused')}
                  />
                </td>
                <td className="row-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setEditingId(s.id)
                      setForm({ name: s.name, code: s.code, capital: s.capital })
                      setOpen(true)
                    }}
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/cities?state=${s.id}`)}>
                    Cities / districts
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty">No states match this search</div>}
      </div>

      {open && (
        <Modal
          title={editingId ? 'Edit state' : 'Add state'}
          onClose={() => {
            setOpen(false)
            setEditingId(null)
          }}
        >
          <form onSubmit={submit}>
            <div className="form-grid">
              <div className="field">
                <label>State name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Kerala" />
              </div>
              <div className="field">
                <label>Code</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required placeholder="KL" maxLength={3} />
              </div>
              <div className="field">
                <label>Capital</label>
                <input value={form.capital} onChange={(e) => setForm({ ...form, capital: e.target.value })} required placeholder="Thiruvananthapuram" />
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setOpen(false)
                  setEditingId(null)
                }}
              >
                Cancel
              </button>
              <button className="btn btn-primary">{editingId ? 'Save changes' : 'Add state'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
