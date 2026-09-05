import { Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import Modal from '../components/Modal'
import StatusChip from '../components/StatusChip'
import { useDirectory } from '../data/directory'
import type { LocationStatus } from '../types'

const TABS = ['All', 'Active', 'Pending', 'Paused'] as const

export default function Cities() {
  const [params] = useSearchParams()
  const presetState = params.get('state') ?? 'All'
  const { cities, states, hospitals, addCity, setCityStatus } = useDirectory()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<(typeof TABS)[number]>('All')
  const [stateId, setStateId] = useState(presetState)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', stateId: states[0]?.id ?? '' })

  useEffect(() => {
    setStateId(presetState)
  }, [presetState])

  const filtered = useMemo(() => {
    return cities.filter((c) => {
      const q = query.toLowerCase()
      const matchesQuery = !q || c.name.toLowerCase().includes(q) || c.stateName.toLowerCase().includes(q)
      const matchesState = stateId === 'All' || c.stateId === stateId
      return matchesQuery && matchesState && (tab === 'All' || c.status === tab)
    })
  }, [cities, query, tab, stateId])

  function submit(e: FormEvent) {
    e.preventDefault()
    const parent = states.find((s) => s.id === form.stateId)
    if (!parent) return
    addCity({
      id: `ct-${Date.now()}`,
      name: form.name,
      stateId: parent.id,
      stateName: parent.name,
      status: 'Pending',
    })
    setForm({ name: '', stateId: parent.id })
    setOpen(false)
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>Cities</h3>
          <p>Cities and districts used for jobs, hospitals and ambulance pickup</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} />
          Add city
        </button>
      </div>

      <div className="toolbar">
        <div className="search">
          <Search size={16} color="#98A2B3" />
          <input placeholder="Search city or state" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="select" value={stateId} onChange={(e) => setStateId(e.target.value)}>
          <option value="All">All states</option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
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
              <th>City</th>
              <th>State</th>
              <th>Hospitals</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td className="cell-title">{c.name}</td>
                <td>{c.stateName}</td>
                <td>{hospitals.filter((h) => h.city === c.name).length}</td>
                <td>
                  <StatusChip label={c.status} />
                </td>
                <td className="row-actions">
                  {c.status !== 'Active' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setCityStatus(c.id, 'Active')}>
                      Activate
                    </button>
                  )}
                  {c.status === 'Active' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setCityStatus(c.id, 'Paused' as LocationStatus)}>
                      Pause
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty">No cities match this search</div>}
      </div>

      {open && (
        <Modal title="Add city" onClose={() => setOpen(false)}>
          <form onSubmit={submit}>
            <div className="form-grid">
              <div className="field">
                <label>City / district</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Karimnagar" />
              </div>
              <div className="field">
                <label>State</label>
                <select value={form.stateId} onChange={(e) => setForm({ ...form, stateId: e.target.value })} required>
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary">Add city</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
