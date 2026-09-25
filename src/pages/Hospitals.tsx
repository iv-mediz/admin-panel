import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import * as adminApi from '../api/admin'
import HospitalImageUpload, { resolveMediaUrl } from '../components/HospitalImageUpload'
import LocationFilters from '../components/LocationFilters'
import Modal from '../components/Modal'
import StatusChip from '../components/StatusChip'
import { useDirectory } from '../data/directory'
import type { Hospital, OnboardLocationState } from '../types'
import { hasApiBackend } from '../config/api'
import { matchesLocation } from '../utils/locationFilter'

const TABS = ['All', 'Partner', 'Pending'] as const

export default function Hospitals() {
  const navigate = useNavigate()
  const location = useLocation()
  const { hospitals, setHospitalStatus, setHospitals } = useDirectory()
  const [query, setQuery] = useState('')
  const [brandingHospital, setBrandingHospital] = useState<Hospital | null>(null)
  const [detailHospital, setDetailHospital] = useState<Hospital | null>(null)
  const [uploading, setUploading] = useState(false)
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
    if (!brandingHospital || !hasApiBackend()) return
    setUploading(true)
    try {
      const { url } = await adminApi.uploadHospitalImage(brandingHospital.id, kind, file)
      const patch =
        kind === 'logo' ? { logoUrl: url } : { coverPhotoUrl: url }
      setHospitals((prev) =>
        prev.map((h) => (h.id === brandingHospital.id ? { ...h, ...patch } : h)),
      )
      setBrandingHospital((cur) => (cur ? { ...cur, ...patch } : cur))
    } finally {
      setUploading(false)
    }
  }

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
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px 16px', color: '#667085' }}>
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
                  <StatusChip label={h.status} />
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => setDetailHospital(h)}>
                    Details
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    onClick={() => setBrandingHospital(h)}
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

      {brandingHospital && (
        <Modal title={`Branding — ${brandingHospital.name}`} onClose={() => setBrandingHospital(null)}>
          <p className="muted" style={{ marginBottom: 12 }}>
            Logo and cover appear in the mobile app for this hospital.
          </p>
          {uploading ? <p className="hint">Uploading…</p> : null}
          <HospitalImageUpload
            label="Logo"
            kind="logo"
            previewUrl={brandingHospital.logoUrl}
            onPick={(file) => void uploadBranding('logo', file)}
          />
          <HospitalImageUpload
            label="Cover photo"
            kind="cover"
            previewUrl={brandingHospital.coverPhotoUrl}
            onPick={(file) => void uploadBranding('cover', file)}
          />
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
