import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { resolveMediaUrl } from '../components/HospitalImageUpload'
import Modal from '../components/Modal'
import StatusChip from '../components/StatusChip'
import { useDirectory } from '../data/directory'
import type { Application, ApplicationStatus, Job } from '../types'

const STATUS_TABS = [
  'All',
  'Under Review',
  'Shortlisted',
  'Interview Scheduled',
  'Offer',
  'Recruited',
  'Rejected',
] as const

export default function JobApplicantsModal({
  job,
  onClose,
}: {
  job: Job
  onClose: () => void
}) {
  const { applications: items, updateApplicationStatus } = useDirectory()
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]>('All')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Application | null>(null)

  const forJob = useMemo(
    () => items.filter((app) => app.jobId === job.id),
    [items, job.id],
  )

  const filtered = useMemo(() => {
    return forJob.filter((app) => {
      const q = query.toLowerCase()
      const matchesQuery = !q || app.applicant.toLowerCase().includes(q) || app.role.toLowerCase().includes(q)
      const matchesTab = tab === 'All' || app.status === tab
      return matchesQuery && matchesTab
    })
  }, [forJob, query, tab])

  function updateStatus(id: string, status: ApplicationStatus) {
    updateApplicationStatus(id, status)
    setSelected((cur) => (cur && cur.id === id ? { ...cur, status } : cur))
  }

  return (
    <>
      <Modal title={`Applicants · ${job.title}`} onClose={onClose} wide>
        <p className="muted" style={{ margin: '0 0 14px' }}>
          {job.hospital} · {job.location}
        </p>
        <div className="toolbar" style={{ marginBottom: 12 }}>
          <div className="search">
            <Search size={16} color="#98A2B3" />
            <input
              placeholder="Search applicant"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="pills" style={{ marginBottom: 14 }}>
          {STATUS_TABS.map((t) => (
            <button key={t} className={`pill ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t === 'Interview Scheduled' ? 'Interview' : t}
            </button>
          ))}
        </div>
        <div className="card table-wrap" style={{ boxShadow: 'none', border: '1px solid var(--border)' }}>
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Looking for</th>
                <th>Applied</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => (
                <tr key={app.id}>
                  <td>
                    <div className="cell-title">{app.applicant}</div>
                    <div className="cell-sub">
                      {app.role} · {app.experience}
                    </div>
                  </td>
                  <td>
                    <StatusChip label={app.employmentPreference} />
                    {app.timeAvailability && app.timeAvailability.length > 0 && (
                      <div className="cell-sub">{app.timeAvailability.join(', ')}</div>
                    )}
                  </td>
                  <td>{app.appliedOn}</td>
                  <td>
                    <StatusChip label={app.status} />
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelected(app)}>
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty">
              {forJob.length === 0
                ? 'No one has applied to this job yet.'
                : 'No applicants in this tab.'}
            </div>
          )}
        </div>
      </Modal>

      {selected && (
        <Modal title="Review application" onClose={() => setSelected(null)}>
          <div className="cell-title" style={{ fontSize: 18 }}>
            {selected.applicant}
          </div>
          <p className="muted" style={{ margin: '6px 0 14px' }}>
            {selected.jobTitle} at {selected.hospital}
          </p>
          <div className="detail-grid">
            <div className="meta">
              <span>Looking for</span>
              <strong>{selected.employmentPreference}</strong>
            </div>
            <div className="meta">
              <span>Phone</span>
              <strong>{selected.phone}</strong>
            </div>
            <div className="meta">
              <span>Email</span>
              <strong>{selected.email}</strong>
            </div>
            <div className="meta">
              <span>Resume</span>
              <strong>
                {resolveMediaUrl(selected.resumeUrl) ? (
                  <a href={resolveMediaUrl(selected.resumeUrl)!} target="_blank" rel="noreferrer">
                    View resume
                  </a>
                ) : (
                  'Not uploaded'
                )}
              </strong>
            </div>
            {selected.documents && selected.documents.length > 0 ? (
              <div className="meta full">
                <span>Documents</span>
                <strong style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600 }}>
                  {selected.documents.map((doc) => {
                    const href = resolveMediaUrl(doc.fileUrl)
                    return href ? (
                      <a key={doc.id} href={href} target="_blank" rel="noreferrer">
                        {doc.name}
                        {doc.fileName ? ` (${doc.fileName})` : ''}
                      </a>
                    ) : (
                      <span key={doc.id}>{doc.name} — metadata only (re-upload from app)</span>
                    )
                  })}
                </strong>
              </div>
            ) : null}
            <div className="meta">
              <span>Experience</span>
              <strong>{selected.experience?.trim() || '—'}</strong>
            </div>
            <div className="meta">
              <span>Location</span>
              <strong>
                {selected.district}, {selected.state}
              </strong>
            </div>
          </div>
          {selected.timeAvailability && selected.timeAvailability.length > 0 && (
            <>
              <p className="muted" style={{ marginTop: 12, marginBottom: 6 }}>
                Time availability
              </p>
              <div className="pills">
                {selected.timeAvailability.map((slot) => (
                  <span key={slot} className="chip chip-review">
                    {slot}
                  </span>
                ))}
              </div>
            </>
          )}
          <label style={{ fontSize: 12, fontWeight: 700, marginTop: 14, display: 'block' }}>Update status</label>
          <select
            className="select"
            style={{ width: '100%', marginTop: 8 }}
            value={selected.status}
            onChange={(e) => updateStatus(selected.id, e.target.value as ApplicationStatus)}
          >
            {STATUS_TABS.filter((t) => t !== 'All').map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Modal>
      )}
    </>
  )
}
