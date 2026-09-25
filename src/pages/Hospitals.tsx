import { Plus, Search, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import * as adminApi from '../api/admin'
import HospitalImageUpload from '../components/HospitalImageUpload'
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
              <th>Open jobs</th>
              <th>Rating</th>
              <th>Contact</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px 16px', color: '#667085' }}>
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
                <td>{h.jobs}</td>
                <td>
                  {h.rating ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                      <Star size={14} color="#f59e0b" fill="#f59e0b" />
                      {h.rating}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td>{h.contact}</td>
                <td>
                  <StatusChip label={h.status} />
                </td>
                <td>
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
    </div>
  )
}
