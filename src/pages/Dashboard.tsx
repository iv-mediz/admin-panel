import type { LucideIcon } from 'lucide-react'
import { Ambulance, Briefcase, Building2, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LocationFilters from '../components/LocationFilters'
import StatusChip from '../components/StatusChip'
import { useDirectory } from '../data/directory'
import { applications, bookings, jobs, weeklyStats } from '../data/mock'
import { matchesLocation } from '../utils/locationFilter'

export default function Dashboard() {
  const navigate = useNavigate()
  const { hospitals } = useDirectory()
  const [stateFilter, setStateFilter] = useState('All')
  const [districtFilter, setDistrictFilter] = useState('All')

  const filteredJobs = useMemo(
    () => jobs.filter((j) => matchesLocation(j, stateFilter, districtFilter)),
    [stateFilter, districtFilter],
  )
  const filteredApplications = useMemo(
    () => applications.filter((a) => matchesLocation(a, stateFilter, districtFilter)),
    [stateFilter, districtFilter],
  )
  const filteredBookings = useMemo(
    () => bookings.filter((b) => matchesLocation(b, stateFilter, districtFilter)),
    [stateFilter, districtFilter],
  )
  const filteredHospitals = useMemo(
    () => hospitals.filter((h) => matchesLocation(h, stateFilter, districtFilter)),
    [hospitals, stateFilter, districtFilter],
  )

  const activeJobs = filteredJobs.filter((j) => j.status === 'Active').length
  const liveBookings = filteredBookings.filter((b) => b.status === 'On the way' || b.status === 'Assigned')
  const partnerHospitals = filteredHospitals.filter((h) => h.status === 'Partner').length
  const pendingHospitals = filteredHospitals.filter((h) => h.status === 'Pending').length
  const interviewsToday = filteredApplications.filter((a) => a.status === 'Interview Scheduled').length
  const alsOnWay = liveBookings.filter((b) => b.serviceType.includes('Advanced Life Support')).length

  const jobRatio = jobs.length ? filteredJobs.length / jobs.length : 0
  const bookingRatio = bookings.length ? filteredBookings.length / bookings.length : 0
  const chartStats = useMemo(
    () =>
      weeklyStats.map((d) => ({
        ...d,
        jobs: Math.max(0, Math.round(d.jobs * jobRatio)),
        bookings: Math.max(0, Math.round(d.bookings * bookingRatio)),
      })),
    [jobRatio, bookingRatio],
  )
  const maxVal = Math.max(1, ...chartStats.flatMap((d) => [d.jobs, d.bookings]))

  const locationLabel =
    stateFilter === 'All'
      ? 'Telangana and Karnataka'
      : districtFilter === 'All'
        ? stateFilter
        : `${districtFilter}, ${stateFilter}`

  return (
    <div className="page">
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
            {chartStats.map((d) => (
              <div className="bar-col" key={d.label}>
                <div className="bar-stack">
                  <div className="bar jobs" style={{ height: `${(d.jobs / maxVal) * 100}%` }} />
                  <div className="bar bookings" style={{ height: `${(d.bookings / maxVal) * 100}%` }} />
                </div>
                <span>{d.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="card card-pad">
          <div className="card-head">
            <h4>Live ambulance</h4>
            <button className="link" onClick={() => navigate('/ambulances')}>
              See all
            </button>
          </div>
          {liveBookings.map((b) => (
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
            ))}
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
          {filteredJobs.slice(0, 4).map((job) => (
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

        <article className="card card-pad">
          <div className="card-head">
            <h4>Latest applications</h4>
            <button className="link" onClick={() => navigate('/applications')}>
              See all
            </button>
          </div>
          {filteredApplications.slice(0, 4).map((app) => (
            <div className="list-item" key={app.id}>
              <div className="avatar">{app.applicant.slice(0, 1)}</div>
              <div style={{ flex: 1 }}>
                <div className="cell-title">{app.applicant}</div>
                <div className="cell-sub">
                  {app.jobTitle} · {app.hospital}
                </div>
              </div>
              <StatusChip label={app.status} />
            </div>
          ))}
        </article>
      </div>
    </div>
  )
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
