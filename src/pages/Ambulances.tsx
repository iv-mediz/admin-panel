import { Ambulance, Baby, Camera, HeartPulse, Plus, Search, type LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import LocationFilters from '../components/LocationFilters'
import { resolveMediaUrl } from '../components/HospitalImageUpload'
import Modal from '../components/Modal'
import StatusChip from '../components/StatusChip'
import { useDirectory } from '../data/directory'
import type { AmbulanceService, AmbulanceVehicle, OnboardLocationState } from '../types'
import { matchesLocation } from '../utils/locationFilter'

const BOOKING_TABS = ['All', 'On the way', 'Assigned', 'Completed', 'Cancelled'] as const
const FLEET_TABS = ['All', 'Active', 'Pending'] as const
const ICONS: Record<AmbulanceService['id'], LucideIcon> = { bls: Ambulance, als: HeartPulse, neo: Baby }

export default function Ambulances() {
  const navigate = useNavigate()
  const location = useLocation()
  const { fleet, bookings, setVehicleStatus, loading, error } = useDirectory()

  const services = useMemo((): AmbulanceService[] => {
    const count = (match: (s: string) => boolean) =>
      bookings.filter((b) => match(b.serviceType.toLowerCase())).length
    return [
      {
        id: 'bls',
        title: 'Basic Life Support',
        subtitle: 'Oxygen, first aid & trained EMT for stable patients',
        bookings: count((s) => s.includes('basic')),
        fareFrom: '₹980',
      },
      {
        id: 'als',
        title: 'Advanced Life Support',
        subtitle: 'ICU setup, defibrillator & critical care paramedic',
        bookings: count((s) => s.includes('advanced')),
        fareFrom: '₹2,180',
      },
      {
        id: 'neo',
        title: 'Neonatal transport',
        subtitle: 'Incubator & NICU-trained crew for newborns',
        bookings: count((s) => s.includes('neonatal') || s.includes('neo')),
        fareFrom: '₹2,480',
      },
    ]
  }, [bookings])
  const [view, setView] = useState<'Fleet' | 'Bookings'>('Fleet')
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<string>('All')
  const [stateFilter, setStateFilter] = useState('All')
  const [districtFilter, setDistrictFilter] = useState('All')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = selectedId ? fleet.find((v) => v.id === selectedId) ?? null : null
  const notice = (location.state as OnboardLocationState | null)?.justOnboarded

  const filteredFleet = useMemo(() => {
    return fleet.filter((v) => {
      const q = query.toLowerCase()
      const matchesQuery =
        !q ||
        v.vehicle.toLowerCase().includes(q) ||
        v.operator.toLowerCase().includes(q) ||
        v.driver.toLowerCase().includes(q)
      const matchesLoc = matchesLocation(v, stateFilter, districtFilter)
      return matchesQuery && matchesLoc && (tab === 'All' || v.status === tab)
    })
  }, [fleet, query, tab, stateFilter, districtFilter])

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const q = query.toLowerCase()
      const matchesQuery =
        !q || b.id.toLowerCase().includes(q) || b.pickup.toLowerCase().includes(q) || b.patientName.toLowerCase().includes(q)
      const matchesLoc = matchesLocation(b, stateFilter, districtFilter)
      return matchesQuery && matchesLoc && (tab === 'All' || b.status === tab)
    })
  }, [bookings, query, tab, stateFilter, districtFilter])

  function switchView(next: 'Fleet' | 'Bookings') {
    setView(next)
    setTab('All')
    setQuery('')
    setStateFilter('All')
    setDistrictFilter('All')
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>Onboard ambulances</h3>
          <p>This is where operators and vehicles join the iv mediz fleet. Review uploaded vehicle photos before approval.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/ambulances/onboard')}>
          <Plus size={16} />
          Onboard ambulance
        </button>
      </div>

      {loading ? <p className="hint">Loading fleet & bookings…</p> : null}
      {error ? <p className="hint" style={{ color: '#b91c1c' }}>{error}</p> : null}
      {notice && <div className="notice">{notice} was submitted and is waiting for approval.</div>}

      <div className="pills" style={{ marginBottom: 14 }}>
        {(['Fleet', 'Bookings'] as const).map((v) => (
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
        <LocationFilters
          state={stateFilter}
          district={districtFilter}
          onStateChange={setStateFilter}
          onDistrictChange={setDistrictFilter}
        />
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
                <th>Applied</th>
                <th>Photos</th>
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
                  <td>{formatApplied(v.createdAt)}</td>
                  <td>
                    {(v.vehiclePhotos?.length ?? 0) > 0 ? (
                      <span className="tag">{v.vehiclePhotos!.length} uploaded</span>
                    ) : (
                      <span className="muted">None</span>
                    )}
                  </td>
                  <td>
                    <StatusChip label={v.status} />
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelectedId(v.id)}>
                      View
                    </button>
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

      {selected && (
        <Modal title={`Vehicle ${selected.vehicle}`} wide onClose={() => setSelectedId(null)}>
          <div className="detail-grid">
            <div className="meta">
              <span>Operator</span>
              <strong>{selected.operator}</strong>
            </div>
            <div className="meta">
              <span>Service</span>
              <strong>{selected.serviceType}</strong>
            </div>
            <div className="meta">
              <span>Driver</span>
              <strong>{selected.driver}</strong>
            </div>
            <div className="meta">
              <span>Phone</span>
              <strong>{selected.phone}</strong>
            </div>
            <div className="meta">
              <span>Base</span>
              <strong>{selected.base}</strong>
            </div>
            <div className="meta">
              <span>City</span>
              <strong>{selected.city}, {selected.state}</strong>
            </div>
            <div className="meta">
              <span>Applied</span>
              <strong>{formatApplied(selected.createdAt)}</strong>
            </div>
            <div className="meta">
              <span>Licence</span>
              <strong>{selected.license || '—'}</strong>
            </div>
            <div className="meta">
              <span>Notes</span>
              <strong>{selected.notes || '—'}</strong>
            </div>
          </div>

          <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Uploaded vehicle photos</h4>
          <p className="muted" style={{ marginBottom: 8 }}>
            Photos submitted during operator registration — verify before approving the fleet.
          </p>

          {(selected.vehiclePhotos?.length ?? 0) > 0 ? (
            <div className="vehicle-photo-grid">
              {selected.vehiclePhotos!.map((photo) => {
                const src = resolveMediaUrl(photo.fileUrl)
                return (
                <div className="vehicle-photo" key={photo.label}>
                  {src ? (
                    <img
                      src={src}
                      alt={photo.label}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : null}
                  {!src ? <Camera size={28} /> : null}
                  <span>{photo.label}</span>
                  {photo.uploadedAt && <small>{new Date(photo.uploadedAt).toLocaleString()}</small>}
                  {!photo.fileUrl?.trim() ? (
                    <small style={{ color: '#b42318' }}>No image URL — re-upload from mobile or run seed-media-mocks</small>
                  ) : null}
                </div>
              )})}
            </div>
          ) : (
            <p className="muted">No photos uploaded for this vehicle yet.</p>
          )}

          {selected.status === 'Pending' && (
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setVehicleStatus(selected.id, 'Active')
                  setSelectedId(null)
                }}
              >
                Approve vehicle
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

function formatApplied(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
