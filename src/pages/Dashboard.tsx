import type { LucideIcon } from 'lucide-react'
import { Ambulance, Briefcase, Building2, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchDashboardStats, type DashboardStats } from '../api/admin'
import LocationFilters from '../components/LocationFilters'
import StatusChip from '../components/StatusChip'
import { hasApiBackend } from '../config/api'
import { useDirectory } from '../data/directory'
import { matchesLocation } from '../utils/locationFilter'

export default function Dashboard() {
  const navigate = useNavigate()
  const { hospitals, jobs, applications, bookings, loading, error } = useDirectory()
  const [stateFilter, setStateFilter] = useState('All')
  const [districtFilter, setDistrictFilter] = useState('All')
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    if (!hasApiBackend()) return
    const state = stateFilter === 'All' ? undefined : stateFilter
    const district = districtFilter === 'All' ? undefined : districtFilter
    void fetchDashboardStats({ state, district }).then(setStats).catch(() => setStats(null))
  }, [stateFilter, districtFilter])

  const filteredJobs = useMemo(
    () => jobs.filter((j) => matchesLocation(j, stateFilter, districtFilter)),
    [jobs, stateFilter, districtFilter],
  )
  const filteredApplications = useMemo(
    () => applications.filter((a) => matchesLocation(a, stateFilter, districtFilter)),
    [applications, stateFilter, districtFilter],
  )
  const filteredBookings = useMemo(
    () => bookings.filter((b) => matchesLocation(b, stateFilter, districtFilter)),
    [bookings, stateFilter, districtFilter],
  )
  const filteredHospitals = useMemo(
    () => hospitals.filter((h) => matchesLocation(h, stateFilter, districtFilter)),
    [hospitals, stateFilter, districtFilter],
  )

  const activeJobs = stats?.activeJobs ?? filteredJobs.filter((j) => j.status === 'Active').length
  const liveBookings = stats?.liveBookings ??
    filteredBookings.filter((b) => b.status === 'On the way' || b.status === 'Assigned')
  const partnerHospitals =
    stats?.partnerHospitals ?? filteredHospitals.filter((h) => h.status === 'Partner').length
  const pendingHospitals =
    stats?.pendingHospitals ?? filteredHospitals.filter((h) => h.status === 'Pending').length
  const interviewsToday =
    stats?.interviewsScheduled ??
    filteredApplications.filter((a) => a.status === 'Interview Scheduled').length
  const alsOnWay =
    stats?.alsOnWay ??
    liveBookings.filter((b) => b.serviceType.includes('Advanced Life Support')).length

  const chartStats = stats?.weeklyStats ?? []
  const maxVal = Math.max(1, ...chartStats.flatMap((d) => [d.jobs, d.bookings]))

  const recentJobs = stats?.recentJobs ?? filteredJobs.slice(0, 4)

  const locationLabel =
    stateFilter === 'All'
      ? statesLabel(hospitals, jobs)
      : districtFilter === 'All'
        ? stateFilter
        : `${districtFilter}, ${stateFilter}`

  return (
    <div className="page">
      {loading ? <p className="hint">Loading live data from API…</p> : null}
      {error ? <p className="hint" style={{ color: '#b91c1c' }}>{error}</p> : null}
      <section className="hero">
        <div>
          <h3>Good morning, Admin</h3>
          <p>
            iv mediz is live across {locationLabel} — jobs, ambulances and partner hospitals in one view.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" style={{ background: '#fff', color: '#116a9b' }} onClick={() => navigate('/hospitals/onboard')}>
            Onboard hospital
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/ambulances/onboard')}>
            Onboard ambulance
          </button>
        </div>
      </section>

      <div className="toolbar" style={{ marginBottom: 18 }}>
        <LocationFilters
          state={stateFilter}
          district={districtFilter}
          onStateChange={setStateFilter}
          onDistrictChange={setDistrictFilter}
        />
      </div>

      <section className="stats">
        <Stat icon={Briefcase} color="#e7f7f8" accent="#0097a7" label="Active jobs" value={activeJobs} meta={`${filteredJobs.length} in region`} />
        <Stat
          icon={Users}
          color="#e8f0fe"
          accent="#2563eb"
          label="Applications"
          value={filteredApplications.length}
          meta={interviewsToday ? `${interviewsToday} interviews scheduled` : 'No interviews scheduled'}
        />
        <Stat
          icon={Ambulance}
          color="#fee8e8"
          accent="#dc2626"
          label="Live ambulances"
          value={liveBookings.length}
          meta={alsOnWay ? `${alsOnWay} ALS on the way` : 'No ALS active'}
        />
        <Stat
          icon={Building2}
          color="#e8f8ee"
          accent="#16a34a"
          label="Partner hospitals"
          value={partnerHospitals}
          meta={pendingHospitals ? `${pendingHospitals} pending request${pendingHospitals > 1 ? 's' : ''}` : 'All approved'}
        />
      </section>

      <div className="grid-2">
        <article className="card card-pad">
          <div className="card-head">
            <h4>This week</h4>
            <div className="legend">
              <span>
                <i style={{ background: 'var(--navy)' }} /> Jobs posted
              </span>
              <span>
                <i style={{ background: 'var(--primary)' }} /> Ambulance trips
              </span>
            </div>
          </div>
          <div className="bars">
            {chartStats.length === 0 ? (
              <p className="muted">No chart data yet.</p>
            ) : (
              chartStats.map((d) => (
                <div className="bar-col" key={d.label}>
                  <div className="bar-stack">
                    <div className="bar jobs" style={{ height: `${(d.jobs / maxVal) * 100}%` }} />
                    <div className="bar bookings" style={{ height: `${(d.bookings / maxVal) * 100}%` }} />
                  </div>
                  <span>{d.label}</span>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card card-pad">
          <div className="card-head">
            <h4>Live ambulance</h4>
            <button className="link" onClick={() => navigate('/ambulances')}>
              See all
            </button>
          </div>
          {liveBookings.length === 0 ? (
            <p className="muted">No active ambulance bookings.</p>
          ) : (
            liveBookings.map((b) => (
              <div className="list-item" key={b.id}>
                <div className="icon-box" style={{ background: '#fee8e8', color: '#dc2626' }}>
                  <Ambulance size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="cell-title">
                    {b.id} · {b.serviceType}
                  </div>
                  <div className="cell-sub">
                    {b.pickup} → {b.drop}
                  </div>
                  <div className="cell-sub">{b.driver}</div>
                </div>
                <StatusChip label={b.status} />
              </div>
            ))
          )}
        </article>
      </div>

      <div className="grid-2" style={{ marginTop: 14 }}>
        <article className="card card-pad">
          <div className="card-head">
            <h4>Recent jobs</h4>
            <button className="link" onClick={() => navigate('/jobs')}>
              See all
            </button>
          </div>
          {recentJobs.map((job) => (
            <div className="list-item" key={job.id}>
              <div className="icon-box" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                <Briefcase size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="cell-title">{job.title}</div>
                <div className="cell-sub">
                  {job.hospital} · {job.location}
                </div>
              </div>
              <StatusChip label={job.type} />
            </div>
          ))}
        </article>
      </div>
    </div>
  )
}

function statesLabel(hospitals: { state: string }[], jobs: { state: string }[]) {
  const names = [...new Set([...hospitals, ...jobs].map((x) => x.state).filter(Boolean))]
  if (names.length === 0) return 'your regions'
  if (names.length <= 2) return names.join(' and ')
  return `${names.slice(0, 2).join(', ')} and more`
}

function Stat({
  icon: Icon,
  color,
  accent,
  label,
  value,
  meta,
  up = true,
}: {
  icon: LucideIcon
  color: string
  accent: string
  label: string
  value: number | string
  meta: string
  up?: boolean
}) {
  return (
    <article className="stat-card">
      <div className="stat-icon" style={{ background: color, color: accent }}>
        <Icon size={18} />
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className={`stat-meta ${up ? 'up' : 'down'}`}>{meta}</div>
    </article>
  )
}
