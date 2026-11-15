import { Pencil, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import LocationFilters from '../components/LocationFilters'
import Modal from '../components/Modal'
import ActiveToggle from '../components/ActiveToggle'
import { useDirectory } from '../data/directory'
import { matchesLocation } from '../utils/locationFilter'

const TABS = ['All', 'Active', 'Pending', 'Paused'] as const

export default function Cities() {
  const [params] = useSearchParams()
  const presetState = params.get('state') ?? 'All'
  const { cities, states, hospitals, addCity, updateCity, setCityStatus } = useDirectory()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<(typeof TABS)[number]>('All')
  const presetStateName = states.find((s) => s.id === presetState)?.name ?? 'All'
  const [stateFilter, setStateFilter] = useState(presetStateName)
  const [districtFilter, setDistrictFilter] = useState('All')
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', stateId: states[0]?.id ?? '' })

  useEffect(() => {
    setStateFilter(presetStateName)
  }, [presetStateName])

  const filtered = useMemo(() => {
    return cities.filter((c) => {
      const q = query.toLowerCase()
      const matchesQuery = !q || c.name.toLowerCase().includes(q) || c.stateName.toLowerCase().includes(q)
      const matchesLoc = matchesLocation({ state: c.stateName, district: c.name }, stateFilter, districtFilter)
      return matchesQuery && matchesLoc && (tab === 'All' || c.status === tab)
    })
  }, [cities, query, tab, stateFilter, districtFilter])

  function submit(e: FormEvent) {
    e.preventDefault()
    const parent = states.find((s) => s.id === form.stateId)
    if (!parent) return
    if (editingId) {
      updateCity(editingId, {
        name: form.name.trim(),
        stateId: parent.id,
        stateName: parent.name,
      })
    } else {
      addCity({
        id: `ct-${Date.now()}`,
        name: form.name.trim(),
        stateId: parent.id,
        stateName: parent.name,
        status: 'Pending',
      })
    }
    setForm({ name: '', stateId: parent.id })
    setEditingId(null)
    setOpen(false)
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>Cities / districts</h3>
          <p>Cities and districts used for jobs, hospitals and ambulance pickup</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingId(null)
            setForm({ name: '', stateId: states[0]?.id ?? '' })
            setOpen(true)
          }}
        >
          <Plus size={16} />
          Add city / district
        </button>
      </div>

      <div className="toolbar">
        <div className="search">
          <Search size={16} color="#98A2B3" />
          <input placeholder="Search city or state" value={query} onChange={(e) => setQuery(e.target.value)} />
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
              <th>City / district</th>
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
                  <ActiveToggle
                    active={c.status === 'Active'}
                    ariaLabel={`${c.name} city`}
                    onChange={(on) => setCityStatus(c.id, on ? 'Active' : 'Paused')}
                  />
                </td>
                <td className="row-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setEditingId(c.id)
                      setForm({ name: c.name, stateId: c.stateId })
                      setOpen(true)
                    }}
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty">No cities match this search</div>}
      </div>

      {open && (
        <Modal
          title={editingId ? 'Edit city / district' : 'Add city / district'}
          onClose={() => {
            setOpen(false)
            setEditingId(null)
          }}
        >
          <form onSubmit={submit}>
            <div className="form-grid">
              <div className="field">
                <label>City / district</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Karimnagar" />
              </div>
              <div className="field">
                <label>State</label>
                <select value={form.stateId} onChange={(e) => setForm({ ...form, stateId: e.target.value })} required>
                  {states
                    .filter((s) => s.status === 'Active')
                    .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
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
              <button className="btn btn-primary">{editingId ? 'Save changes' : 'Add city / district'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
