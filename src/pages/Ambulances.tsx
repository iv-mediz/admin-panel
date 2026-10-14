import { Ambulance, Baby, Camera, HeartPulse, Plus, Search, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import LocationFilters from '../components/LocationFilters'
import { resolveMediaUrl } from '../components/HospitalImageUpload'
import Modal from '../components/Modal'
import ActiveToggle from '../components/ActiveToggle'
import StatusChip from '../components/StatusChip'
import * as adminApi from '../api/admin'
import { useDirectory } from '../data/directory'
import type { AmbulanceService, AmbulanceServiceTypeConfig, Booking, OnboardLocationState } from '../types'
import { sortBookingsNewestFirst } from '../utils/bookingSort'
import { matchesLocation } from '../utils/locationFilter'

const BOOKING_TABS = ['All', 'New', 'On the way', 'Assigned', 'Completed', 'Cancelled'] as const
const FLEET_TABS = ['All', 'Active', 'Pending'] as const
const ICONS: Record<AmbulanceService['id'], LucideIcon> = { bls: Ambulance, als: HeartPulse, neo: Baby }

export default function Ambulances() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    fleet,
    bookings,
    ambulanceServiceTypes,
    updateAmbulanceServiceType,
    setVehicleStatus,
    setVehicleActive,
    updateBooking,
    loading,
    error,
  } = useDirectory()
  const [pricingEdit, setPricingEdit] = useState<AmbulanceServiceTypeConfig | null>(null)
  const [pricingForm, setPricingForm] = useState({ basePrice: 0, farePerKm: 0 })
  const [pricingSaving, setPricingSaving] = useState(false)

  const services = useMemo((): AmbulanceService[] => {
    const count = (match: (s: string) => boolean) =>
      bookings.filter((b) => match(b.serviceType.toLowerCase())).length
    const types =
      ambulanceServiceTypes.length > 0
        ? ambulanceServiceTypes
        : [
            {
              id: 'bls',
              title: 'Basic Life Support',
              subtitle: 'Oxygen, first aid & trained EMT for stable patients',
              basePrice: 499,
              farePerKm: 38,
            },
            {
              id: 'als',
              title: 'Advanced Life Support',
              subtitle: 'ICU setup, defibrillator & critical care paramedic',
              basePrice: 899,
              farePerKm: 58,
            },
            {
              id: 'neo',
              title: 'Neonatal Ambulance',
              subtitle: 'Incubator & neonatal specialist for infants',
              basePrice: 1099,
              farePerKm: 65,
            },
          ]
    return types.map((t) => ({
      id: t.id as AmbulanceService['id'],
      title: t.title,
      subtitle: t.subtitle,
      bookings: count((s) => s.includes(t.title.toLowerCase().split(' ')[0])),
      fareFrom: `₹${t.basePrice} + ₹${t.farePerKm}/km`,
    }))
  }, [bookings, ambulanceServiceTypes])
  const [view, setView] = useState<'Fleet' | 'Bookings'>('Fleet')
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<string>('All')
  const [stateFilter, setStateFilter] = useState('All')
  const [districtFilter, setDistrictFilter] = useState('All')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [assignTarget, setAssignTarget] = useState<Booking | null>(null)
  const [assignFleetId, setAssignFleetId] = useState('')
  const [assignOnlineFilter, setAssignOnlineFilter] = useState<'All' | 'Online' | 'Offline'>('All')
  const [assignSaving, setAssignSaving] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const selected = selectedId ? fleet.find((v) => v.id === selectedId) ?? null : null
  const locationState = location.state as OnboardLocationState | null
  const notice = locationState?.justOnboarded

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
    const filtered = bookings.filter((b) => {
      const q = query.toLowerCase()
      const booker = (b.bookedByName ?? '').toLowerCase()
      const phone = (b.bookedByPhone ?? b.contactPhone ?? '').toLowerCase()
      const matchesQuery =
        !q ||
        b.id.toLowerCase().includes(q) ||
        b.pickup.toLowerCase().includes(q) ||
        b.patientName.toLowerCase().includes(q) ||
        booker.includes(q) ||
        phone.includes(q)
      const matchesLoc = matchesLocation(b, stateFilter, districtFilter)
      return matchesQuery && matchesLoc && (tab === 'All' || b.status === tab)
    })
    return sortBookingsNewestFirst(filtered)
  }, [bookings, query, tab, stateFilter, districtFilter])

  const assignEligibleFleet = useMemo(() => {
    if (!assignTarget) return []
    return fleet
      .filter((v) => v.status === 'Active' && v.isActive !== false)
      .sort((a, b) => {
        const onlineDelta = Number(Boolean(b.isOnline)) - Number(Boolean(a.isOnline))
        if (onlineDelta !== 0) return onlineDelta
        const sameDistrict =
          (a.district === assignTarget.district ? 0 : 1) -
          (b.district === assignTarget.district ? 0 : 1)
        if (sameDistrict !== 0) return sameDistrict
        return a.operator.localeCompare(b.operator)
      })
  }, [fleet, assignTarget])

  const fleetForAssign = useMemo(() => {
    if (assignOnlineFilter === 'Online') return assignEligibleFleet.filter((v) => v.isOnline)
    if (assignOnlineFilter === 'Offline') return assignEligibleFleet.filter((v) => !v.isOnline)
    return assignEligibleFleet
  }, [assignEligibleFleet, assignOnlineFilter])

  const assignOnlineCount = assignEligibleFleet.filter((v) => v.isOnline).length
  const assignOfflineCount = assignEligibleFleet.length - assignOnlineCount

  async function submitAssignDriver() {
    if (!assignTarget || !assignFleetId) return
    setAssignSaving(true)
    setAssignError(null)
    try {
      const updated = await adminApi.assignBooking(assignTarget.id, { fleetId: assignFleetId })
      updateBooking(updated)
      setAssignTarget(null)
      setAssignFleetId('')
      setAssignOnlineFilter('All')
    } catch (e) {
      setAssignError(e instanceof Error ? e.message : 'Could not assign driver')
    } finally {
      setAssignSaving(false)
    }
  }

  function openAssign(booking: Booking) {
    setAssignTarget(booking)
    setAssignFleetId(booking.fleetId ?? '')
    setAssignOnlineFilter('All')
    setAssignError(null)
  }

  useEffect(() => {
    const assignId = locationState?.assignBookingId
    if (!assignId) return
    const booking = bookings.find((b) => b.id === assignId)
    if (!booking) return
    setView('Bookings')
    openAssign(booking)
    navigate('.', { replace: true, state: { justOnboarded: notice } })
  }, [bookings, locationState?.assignBookingId, navigate, notice])

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
        <>
          <div className="stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {services.map((s) => {
              const Icon = ICONS[s.id]
              const count = fleet.filter((v) => v.serviceType === s.title && v.status === 'Active').length
              const pricing = ambulanceServiceTypes.find((t) => t.id === s.id)
              return (
                <article className="service-card" key={s.id}>
                  <div className="icon-box" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', marginBottom: 10 }}>
                    <Icon size={18} />
                  </div>
                  <h5>{s.title}</h5>
                  <p className="muted" style={{ margin: '6px 0 10px' }}>
                    {s.subtitle}
                  </p>
                  <p className="muted" style={{ margin: '0 0 8px', fontSize: 13 }}>
                    {s.fareFrom}
                  </p>
                  <strong style={{ color: 'var(--primary)' }}>{count} active vehicles</strong>
                  {pricing ? (
                    <button
                      type="button"
                      className="btn"
                      style={{ marginTop: 10, width: '100%' }}
                      onClick={() => {
                        setPricingEdit(pricing)
                        setPricingForm({
                          basePrice: pricing.basePrice,
                          farePerKm: pricing.farePerKm,
                        })
                      }}
                    >
                      Edit pricing
                    </button>
                  ) : null}
                </article>
              )
            })}
          </div>
          <p className="hint" style={{ marginTop: 8, marginBottom: 14 }}>
            Mobile app fare = base price + (distance km × fare per km) for the selected service type.
          </p>
        </>
      )}

      {pricingEdit ? (
        <Modal
          title={`Pricing — ${pricingEdit.title}`}
          onClose={() => setPricingEdit(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setPricingSaving(true)
              void updateAmbulanceServiceType(pricingEdit.id, {
                basePrice: pricingForm.basePrice,
                farePerKm: pricingForm.farePerKm,
              })
                .then(() => setPricingEdit(null))
                .finally(() => setPricingSaving(false))
            }}
          >
            <div className="field">
              <label>Base price (₹)</label>
              <input
                type="number"
                min={0}
                value={pricingForm.basePrice}
                onChange={(ev) =>
                  setPricingForm((f) => ({ ...f, basePrice: Number(ev.target.value) }))
                }
                required
              />
            </div>
            <div className="field">
              <label>Fare per km (₹)</label>
              <input
                type="number"
                min={0}
                value={pricingForm.farePerKm}
                onChange={(ev) =>
                  setPricingForm((f) => ({ ...f, farePerKm: Number(ev.target.value) }))
                }
                required
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={pricingSaving}>
              {pricingSaving ? 'Saving…' : 'Save pricing'}
            </button>
          </form>
        </Modal>
      ) : null}

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
                <th>On app</th>
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
                    <ActiveToggle
                      active={v.isActive !== false}
                      disabled={v.status !== 'Active'}
                      ariaLabel={`${v.vehicle} visibility on app`}
                      onChange={(on) => setVehicleActive(v.id, on)}
                    />
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
                <th>Booked by</th>
                <th>Patient</th>
                <th>Driver</th>
                <th>Fare</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => {
                const bookerName = b.bookedByName?.trim() || 'App user'
                const bookerPhone =
                  b.bookedByPhone?.trim() || b.contactPhone?.trim() || '—'
                const canAssign = b.status !== 'Completed' && b.status !== 'Cancelled'
                const driverLabel =
                  b.driver?.trim() && b.driver !== '—' ? b.driver : 'Unassigned'
                return (
                  <tr key={b.id}>
                    <td>
                      <div className="cell-title">{b.id}</div>
                      <div className="cell-sub">{b.serviceType}</div>
                    </td>
                    <td>
                      {b.pickup} → {b.drop}
                      <div className="cell-sub">{b.dateTime}</div>
                    </td>
                    <td>
                      <div className="cell-title">{bookerName}</div>
                      <div className="cell-sub">{bookerPhone}</div>
                      {b.bookedByEmail ? (
                        <div className="cell-sub">{b.bookedByEmail}</div>
                      ) : null}
                    </td>
                    <td>{b.patientName}</td>
                    <td>
                      {driverLabel}
                      <div className="cell-sub">{b.vehicle !== '—' ? b.vehicle : '—'}</div>
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--navy)' }}>{b.fare}</td>
                    <td>
                      <StatusChip label={b.status} />
                    </td>
                    <td>
                      {canAssign ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => openAssign(b)}
                        >
                          {driverLabel === 'Unassigned' ? 'Assign' : 'Reassign'}
                        </button>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
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
            Operators must upload <strong>Front view</strong>, <strong>Side view</strong>, and{' '}
            <strong>Interior</strong> (required), plus any extra photos. If you only see labels
            without images, the upload failed — ask them to submit registration again after the
            backend is updated.
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

      {assignTarget && (
        <Modal
          title={`Assign driver · ${assignTarget.id}`}
          onClose={() => {
            setAssignTarget(null)
            setAssignFleetId('')
            setAssignOnlineFilter('All')
            setAssignError(null)
          }}
        >
          <div className="detail-grid" style={{ marginBottom: 16 }}>
            <div className="meta">
              <span>Booked by</span>
              <strong>{assignTarget.bookedByName?.trim() || 'App user'}</strong>
            </div>
            <div className="meta">
              <span>Contact</span>
              <strong>
                {assignTarget.bookedByPhone?.trim() ||
                  assignTarget.contactPhone?.trim() ||
                  '—'}
              </strong>
            </div>
            <div className="meta">
              <span>Patient</span>
              <strong>{assignTarget.patientName}</strong>
            </div>
            <div className="meta">
              <span>Route</span>
              <strong>
                {assignTarget.pickup} → {assignTarget.drop}
              </strong>
            </div>
          </div>

          <label htmlFor="assign-fleet" style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>
            Fleet vehicle
          </label>
          <div className="pills" style={{ marginBottom: 10 }}>
            {(
              [
                ['All', assignEligibleFleet.length],
                ['Online', assignOnlineCount],
                ['Offline', assignOfflineCount],
              ] as const
            ).map(([label, count]) => (
              <button
                key={label}
                type="button"
                className={`pill ${assignOnlineFilter === label ? 'active' : ''}`}
                onClick={() => {
                  setAssignOnlineFilter(label)
                  const stillVisible = assignEligibleFleet.some((v) => {
                    if (v.id !== assignFleetId) return false
                    if (label === 'Online') return Boolean(v.isOnline)
                    if (label === 'Offline') return !v.isOnline
                    return true
                  })
                  if (!stillVisible) setAssignFleetId('')
                }}
              >
                {label} ({count})
              </button>
            ))}
          </div>
          <select
            id="assign-fleet"
            className="select"
            value={assignFleetId}
            onChange={(e) => setAssignFleetId(e.target.value)}
          >
            <option value="">Select a vehicle</option>
            {fleetForAssign.map((v) => (
              <option key={v.id} value={v.id}>
                {v.isOnline ? 'Online' : 'Offline'} · {v.operator} · {v.vehicle} · {v.driver} ({v.city})
              </option>
            ))}
          </select>
          {fleetForAssign.length === 0 ? (
            <p className="hint" style={{ marginTop: 8 }}>
              {assignEligibleFleet.length === 0
                ? 'No active fleet vehicles. Approve a vehicle under Fleet first.'
                : `No ${assignOnlineFilter.toLowerCase()} vehicles in this list.`}
            </p>
          ) : null}
          {assignError ? (
            <p className="hint" style={{ marginTop: 8, color: 'var(--danger)' }}>
              {assignError}
            </p>
          ) : null}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setAssignTarget(null)
                setAssignFleetId('')
                setAssignOnlineFilter('All')
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!assignFleetId || assignSaving}
              onClick={() => void submitAssignDriver()}
            >
              {assignSaving ? 'Assigning…' : 'Assign & dispatch'}
            </button>
          </div>
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
