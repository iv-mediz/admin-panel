import { Pencil, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import * as adminApi from '../api/admin'
import HospitalImageUpload, { resolveMediaUrl } from '../components/HospitalImageUpload'
import LocationFilters from '../components/LocationFilters'
import Modal from '../components/Modal'
import ActiveToggle from '../components/ActiveToggle'
import StatusChip from '../components/StatusChip'
import { useDirectory } from '../data/directory'
import type { Hospital, OnboardLocationState } from '../types'
import { ApiError } from '../api/http'
import { hasApiBackend } from '../config/api'
import { matchesLocation } from '../utils/locationFilter'

const TABS = ['All', 'Partner', 'Pending'] as const

export default function Hospitals() {
  const navigate = useNavigate()
  const location = useLocation()
  const { hospitals, setHospitalStatus, setHospitalActive, setHospitals, updateHospital } = useDirectory()
  const [query, setQuery] = useState('')
  const [brandingHospital, setBrandingHospital] = useState<Hospital | null>(null)
  const [detailHospital, setDetailHospital] = useState<Hospital | null>(null)
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null)
  const [hospitalForm, setHospitalForm] = useState({
    name: '',
    type: '',
    contactPerson: '',
    contact: '',
    email: '',
    address: '',
    city: '',
    district: '',
    state: '',
    registrationNo: '',
    notes: '',
  })
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [tab, setTab] = useState<(typeof TABS)[number]>('All')
  const [stateFilter, setStateFilter] = useState('All')
  const [districtFilter, setDistrictFilter] = useState('All')
  const notice = (location.state as OnboardLocationState | null)?.justOnboarded

  const filtered = useMemo(() => {
    return hospitals.filter((h) => {
      const q = query.toLowerCase()
      const matchesQuery = !q || h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q)
      const matchesTab = tab === 'All' || h.status === tab
      const matchesLoc = matchesLocation(h, stateFilter, districtFilter)
      return matchesQuery && matchesTab && matchesLoc
    })
  }, [hospitals, query, tab, stateFilter, districtFilter])

  async function uploadBranding(kind: 'logo' | 'cover', file: File) {
    if (!brandingHospital || !hasApiBackend()) {
      setUploadError('API is not configured — set VITE_API_BASE_URL or use the hosted admin URL.')
      return
    }
    setUploading(true)
    setUploadError(null)
    try {
      const { url } = await adminApi.uploadHospitalImage(brandingHospital.id, kind, file)
      if (!url?.trim()) {
        throw new Error('Upload succeeded but no image URL was returned.')
      }
      const patch =
        kind === 'logo' ? { logoUrl: url } : { coverPhotoUrl: url }
      setHospitals((prev) =>
        prev.map((h) => (h.id === brandingHospital.id ? { ...h, ...patch } : h)),
      )
      setBrandingHospital((cur) => (cur ? { ...cur, ...patch } : cur))
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Upload failed. Check you are signed in and the API is reachable.'
      setUploadError(message)
    } finally {
      setUploading(false)
    }
  }

  const brandingLive = brandingHospital
    ? hospitals.find((h) => h.id === brandingHospital.id) ?? brandingHospital
    : null

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>Onboard hospitals</h3>
          <p>This is where hospitals join iv mediz and become hiring partners</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/hospitals/onboard')}>
          <Plus size={16} />
          Onboard hospital
        </button>
      </div>

      {notice && <div className="notice">{notice} was submitted and is waiting for approval.</div>}

      <div className="toolbar">
        <div className="search">
          <Search size={16} color="#98A2B3" />
          <input placeholder="Search hospital or city" value={query} onChange={(e) => setQuery(e.target.value)} />
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
              <th>Hospital</th>
              <th>City</th>
              <th>Contact</th>
              <th>Applied</th>
              <th>Rating</th>
              <th>Status</th>
              <th>On app</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px 16px', color: '#667085' }}>
                  No hospitals yet. Use &quot;Onboard hospital&quot; to add your first partner.
                </td>
              </tr>
            ) : null}
            {filtered.map((h) => (
              <tr key={h.id}>
                <td>
                  <div className="cell-title">{h.name}</div>
                  {h.type && <div className="cell-sub">{h.type}</div>}
                </td>
                <td>
                  {h.city}
                  <div className="cell-sub">{h.state}</div>
                </td>
                <td>
                  <div className="cell-title">{h.contactPerson || '—'}</div>
                  <div className="cell-sub">{h.contact}</div>
                  {h.email ? <div className="cell-sub">{h.email}</div> : null}
                </td>
                <td>{formatApplied(h.createdAt)}</td>
                <td>
                  {h.ratingCount ? (
                    <>
                      <div className="cell-title">⭐ {h.rating.toFixed(1)}</div>
                      <div className="cell-sub">{h.ratingCount} reviews</div>
                    </>
                  ) : (
                    <span className="muted">No reviews</span>
                  )}
                </td>
                <td>
                  <StatusChip label={h.status} />
                </td>
                <td>
                  <ActiveToggle
                    active={h.isActive !== false}
                    disabled={h.status !== 'Partner'}
                    ariaLabel={`${h.name} visibility on mobile app`}
                    onChange={(on) => setHospitalActive(h.id, on)}
                  />
                </td>
                <td>
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    onClick={() => {
                      setEditingHospital(h)
                      setHospitalForm({
                        name: h.name,
                        type: h.type ?? '',
                        contactPerson: h.contactPerson ?? '',
                        contact: h.contact,
                        email: h.email ?? '',
                        address: h.address ?? '',
                        city: h.city,
                        district: h.district,
                        state: h.state,
                        registrationNo: h.registrationNo ?? '',
                        notes: h.notes ?? '',
                      })
                    }}
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => setDetailHospital(h)}>
                    Details
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    onClick={() => {
                      setUploadError(null)
                      setBrandingHospital(hospitals.find((x) => x.id === h.id) ?? h)
                    }}
                  >
                    Branding
                  </button>
                  {h.status === 'Pending' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setHospitalStatus(h.id, 'Partner')}>
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {brandingLive && (
        <Modal
          title={`Branding — ${brandingLive.name}`}
          onClose={() => {
            setBrandingHospital(null)
            setUploadError(null)
          }}
        >
          <p className="muted" style={{ marginBottom: 12 }}>
            Logo and cover appear in the mobile app for this hospital.
          </p>
          {uploading ? <p className="hint">Uploading…</p> : null}
          {uploadError ? (
            <p className="hint" style={{ color: '#b42318', marginBottom: 10 }}>{uploadError}</p>
          ) : null}
          <HospitalImageUpload
            key={`${brandingLive.id}-logo-${brandingLive.logoUrl ?? 'empty'}`}
            label="Logo"
            kind="logo"
            previewUrl={brandingLive.logoUrl}
            onPick={(file) => void uploadBranding('logo', file)}
          />
          <HospitalImageUpload
            key={`${brandingLive.id}-cover-${brandingLive.coverPhotoUrl ?? 'empty'}`}
            label="Cover photo"
            kind="cover"
            previewUrl={brandingLive.coverPhotoUrl}
            onPick={(file) => void uploadBranding('cover', file)}
          />
        </Modal>
      )}

      {editingHospital && (
        <Modal title={`Edit ${editingHospital.name}`} onClose={() => setEditingHospital(null)}>
          <form
            className="form-grid"
            onSubmit={(e) => {
              e.preventDefault()
              updateHospital(editingHospital.id, {
                name: hospitalForm.name.trim(),
                type: hospitalForm.type.trim(),
                contactPerson: hospitalForm.contactPerson.trim(),
                contact: hospitalForm.contact.trim(),
                email: hospitalForm.email.trim(),
                address: hospitalForm.address.trim(),
                city: hospitalForm.city.trim(),
                district: hospitalForm.district.trim() || hospitalForm.city.trim(),
                state: hospitalForm.state.trim(),
                registrationNo: hospitalForm.registrationNo.trim(),
                notes: hospitalForm.notes.trim(),
              })
              setEditingHospital(null)
            }}
          >
            <div className="field">
              <label>Hospital name</label>
              <input
                value={hospitalForm.name}
                onChange={(e) => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Type</label>
              <input
                value={hospitalForm.type}
                onChange={(e) => setHospitalForm({ ...hospitalForm, type: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Contact person</label>
              <input
                value={hospitalForm.contactPerson}
                onChange={(e) => setHospitalForm({ ...hospitalForm, contactPerson: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Phone</label>
              <input
                value={hospitalForm.contact}
                onChange={(e) => setHospitalForm({ ...hospitalForm, contact: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={hospitalForm.email}
                onChange={(e) => setHospitalForm({ ...hospitalForm, email: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Registration no.</label>
              <input
                value={hospitalForm.registrationNo}
                onChange={(e) => setHospitalForm({ ...hospitalForm, registrationNo: e.target.value })}
              />
            </div>
            <div className="field">
              <label>State</label>
              <input
                value={hospitalForm.state}
                onChange={(e) => setHospitalForm({ ...hospitalForm, state: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>City</label>
              <input
                value={hospitalForm.city}
                onChange={(e) => setHospitalForm({ ...hospitalForm, city: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>District</label>
              <input
                value={hospitalForm.district}
                onChange={(e) => setHospitalForm({ ...hospitalForm, district: e.target.value })}
              />
            </div>
            <div className="field full">
              <label>Address</label>
              <input
                value={hospitalForm.address}
                onChange={(e) => setHospitalForm({ ...hospitalForm, address: e.target.value })}
              />
            </div>
            <div className="field full">
              <label>Notes</label>
              <textarea
                rows={2}
                value={hospitalForm.notes}
                onChange={(e) => setHospitalForm({ ...hospitalForm, notes: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setEditingHospital(null)}>
                Cancel
              </button>
              <button className="btn btn-primary">Save changes</button>
            </div>
          </form>
        </Modal>
      )}

      {detailHospital && (
        <Modal title={detailHospital.name} onClose={() => setDetailHospital(null)}>
          <div className="detail-grid">
            <Meta label="Applied" value={formatApplied(detailHospital.createdAt)} />
            <Meta label="Type" value={detailHospital.type || '—'} />
            <Meta label="Registration" value={detailHospital.registrationNo || '—'} />
            <Meta label="Address" value={detailHospital.address || '—'} />
            <Meta
              label="Location"
              value={
                [detailHospital.address, detailHospital.city, detailHospital.state]
                    .map((part) => (part ?? '').trim())
                    .filter((part) => part.length > 0)
                    .join(', ') || '—'
              }
            />
            <Meta label="Contact person" value={detailHospital.contactPerson || '—'} />
            <Meta label="Phone" value={detailHospital.contact || '—'} />
            <Meta label="Email" value={detailHospital.email || '—'} />
            <Meta label="Departments" value={detailHospital.departments?.join(', ') || '—'} />
            <Meta label="Notes" value={detailHospital.notes || '—'} />
          </div>
          {(resolveMediaUrl(detailHospital.logoUrl) || resolveMediaUrl(detailHospital.coverPhotoUrl)) && (
            <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
              {resolveMediaUrl(detailHospital.logoUrl) ? (
                <img
                  src={resolveMediaUrl(detailHospital.logoUrl)!}
                  alt="Logo"
                  style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 12 }}
                />
              ) : null}
              {resolveMediaUrl(detailHospital.coverPhotoUrl) ? (
                <img
                  src={resolveMediaUrl(detailHospital.coverPhotoUrl)!}
                  alt="Cover"
                  style={{ height: 72, maxWidth: 180, objectFit: 'cover', borderRadius: 12 }}
                />
              ) : null}
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

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="meta">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
