import { Ambulance, Baby, HeartPulse, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import StatusChip from '../components/StatusChip'
import { useDirectory } from '../data/directory'
import { bookings, services } from '../data/mock'

const BOOKING_TABS = ['All', 'On the way', 'Assigned', 'Completed', 'Cancelled']
const FLEET_TABS = ['All', 'Active', 'Pending']
const ICONS = { bls: Ambulance, als: HeartPulse, neo: Baby }

export default function Ambulances() {
  const navigate = useNavigate()
  const location = useLocation()
  const { fleet, setVehicleStatus } = useDirectory()
  const [view, setView] = useState('Fleet')
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('All')
  const notice = location.state?.justOnboarded

  const filteredFleet = useMemo(() => {
    return fleet.filter((v) => {
      const q = query.toLowerCase()
      const matchesQuery =
        !q ||
        v.vehicle.toLowerCase().includes(q) ||
        v.operator.toLowerCase().includes(q) ||
        v.driver.toLowerCase().includes(q)
      return matchesQuery && (tab === 'All' || v.status === tab)
    })
  }, [fleet, query, tab])

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const q = query.toLowerCase()
      const matchesQuery =
        !q || b.id.toLowerCase().includes(q) || b.pickup.toLowerCase().includes(q) || b.patientName.toLowerCase().includes(q)
      return matchesQuery && (tab === 'All' || b.status === tab)
    })
  }, [query, tab])

  function switchView(next) {
    setView(next)
    setTab('All')
    setQuery('')
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>Onboard ambulances</h3>
          <p>This is where operators and vehicles join the iv mediz fleet. Bookings stay under Operations.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/ambulances/onboard')}>
          <Plus size={16} />
          Onboard ambulance
        </button>
      </div>

      {notice && <div className="notice">{notice} was submitted and is waiting for approval.</div>}

      <div className="pills" style={{ marginBottom: 14 }}>
        {['Fleet', 'Bookings'].map((v) => (
          <button key={v} className={`pill ${view === v ? 'active' : ''}`} onClick={() => switchView(v)}>
            {v}
          </button>
        ))}
      </div>

      {view === 'Fleet' && (
        <div className="stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {services.map((s) => {
            const Icon = ICONS[s.id]
            const count = fleet.filter((v) => v.serviceType === s.title && v.status === 'Active').length
            return (
              <article className="service-card" key={s.id}>
                <div className="icon-box" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', marginBottom: 10 }}>
                  <Icon size={18} />
                </div>
                <h5>{s.title}</h5>
                <p className="muted" style={{ margin: '6px 0 10px' }}>
                  {s.subtitle}
                </p>
                <strong style={{ color: 'var(--primary)' }}>{count} active vehicles</strong>
              </article>
            )
          })}
        </div>
      )}

      <div className="toolbar">
        <div className="search">
          <Search size={16} color="#98A2B3" />
          <input
            placeholder={view === 'Fleet' ? 'Search operator, vehicle or driver' : 'Search booking ID, pickup or patient'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="pills" style={{ marginBottom: 14 }}>
        {(view === 'Fleet' ? FLEET_TABS : BOOKING_TABS).map((t) => (
          <button key={t} className={`pill ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {view === 'Fleet' ? (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Operator</th>
                <th>Driver</th>
                <th>Base</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredFleet.map((v) => (
                <tr key={v.id}>
                  <td>
                    <div className="cell-title">{v.vehicle}</div>
                    <div className="cell-sub">{v.serviceType}</div>
                  </td>
                  <td>{v.operator}</td>
                  <td>
                    {v.driver}
                    <div className="cell-sub">{v.phone}</div>
                  </td>
                  <td>
                    {v.base}
                    <div className="cell-sub">{v.city}</div>
                  </td>
                  <td>
                    <StatusChip label={v.status} />
                  </td>
                  <td>
                    {v.status === 'Pending' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => setVehicleStatus(v.id, 'Active')}>
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Booking</th>
                <th>Route</th>
                <th>Patient</th>
                <th>Driver</th>
                <th>Fare</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div className="cell-title">{b.id}</div>
                    <div className="cell-sub">{b.serviceType}</div>
                  </td>
                  <td>
                    {b.pickup} → {b.drop}
                    <div className="cell-sub">{b.dateTime}</div>
                  </td>
                  <td>{b.patientName}</td>
                  <td>
                    {b.driver}
                    <div className="cell-sub">{b.vehicle}</div>
                  </td>
                  <td style={{ fontWeight: 800, color: 'var(--navy)' }}>{b.fare}</td>
                  <td>
                    <StatusChip label={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
