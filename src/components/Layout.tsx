import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { clearSession } from '../auth/session'
import { useDirectory } from '../data/directory'
import NewBookingAlert from './NewBookingAlert'
import type { LucideIcon } from 'lucide-react'
import {
  Ambulance,
  Bell,
  Briefcase,
  Building2,
  Images,
  LayoutDashboard,
  LogOut,
  MapPin,
  MapPinned,
  Menu,
  Settings,
  Store,
  Stethoscope,
  CreditCard,
  Users,
  UsersRound,
  X,
} from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/jobs', label: 'Jobs', icon: Briefcase },
      { to: '/professionals', label: 'Professionals', icon: Users },
      { to: '/team', label: 'Team', icon: UsersRound },
    ],
  },
  {
    label: 'Onboard',
    items: [
      { to: '/hospitals', label: 'Hospitals', icon: Building2 },
      { to: '/ambulances', label: 'Ambulances', icon: Ambulance },
    ],
  },
  {
    label: 'Locations',
    items: [
      { to: '/states', label: 'States', icon: MapPinned },
      { to: '/cities', label: 'Cities / districts', icon: MapPin },
      { to: '/specialties', label: 'Specialties', icon: Stethoscope },
      { to: '/franchises', label: 'Franchises', icon: Store },
    ],
  },
  {
    label: 'More',
    items: [
      { to: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/home-carousel', label: 'Home carousel', icon: Images },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

function pageMeta(path: string): [string, string] {
  if (path.startsWith('/hospitals/onboard')) return ['Onboard hospital', 'Register a hospital partner']
  if (path.startsWith('/ambulances/onboard')) return ['Onboard ambulance', 'Register an operator and vehicle']
  if (path.startsWith('/subscriptions/plans/create')) return ['Create plan', 'Define pricing and features for mobile users']
  if (path.startsWith('/hospitals')) return ['Hospitals', 'Onboard and approve partner hospitals']
  if (path.startsWith('/ambulances')) return ['Ambulances', 'Onboard fleet and review trip bookings']
  const map: Record<string, [string, string]> = {
    '/': ['Dashboard', 'Overview of jobs, applicants and ambulance bookings'],
    '/jobs': ['Healthcare Jobs', 'Post and manage hospital openings'],
    '/professionals': ['Professionals', 'Doctors, nurses and allied health users'],
    '/team': ['Team', 'Internal staff who run the iv mediz admin panel'],
    '/states': ['States', 'States where iv mediz is live'],
    '/cities': ['Cities / districts', 'Cities and districts for jobs and ambulance pickup'],
    '/specialties': ['Specialties', 'Job specialties shown on the mobile home screen'],
    '/franchises': ['Franchises', 'Partners who manage iv mediz in assigned locations'],
    '/subscriptions': ['Subscriptions', 'Plans and manual activation for mobile users'],
    '/notifications': ['Notifications', 'Alerts sent to the mobile app'],
    '/home-carousel': ['Home carousel', 'Banners on the employee app home screen'],
    '/settings': ['Settings', 'Admin panel and brand preferences'],
  }
  return map[path] ?? ['iv mediz', 'Admin']
}

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { bookings } = useDirectory()
  const [open, setOpen] = useState(false)
  const [title, subtitle] = pageMeta(location.pathname)
  const newBookingCount = bookings.filter((b) => b.status === 'New').length

  return (
    <div className="app-shell">
      {open && <button className="sidebar-scrim" onClick={() => setOpen(false)} aria-label="Close menu" />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/mediz_logo.jpg" alt="iv mediz" />
          <div>
            <h1>iv mediz</h1>
            <p>Admin Panel</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map((group) => (
            <div key={group.label} className="nav-group">
              <p className="nav-label">{group.label}</p>
              {group.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <Icon />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="avatar">A</div>
          <div style={{ flex: 1 }}>
            <strong>Admin</strong>
            <span>support@ivmediz.app</span>
          </div>
          <button
            className="icon-btn"
            onClick={() => {
              clearSession()
              navigate('/login')
            }}
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <div className="topbar-right">
            <button className="icon-btn menu-btn" onClick={() => setOpen((v) => !v)} aria-label="Menu">
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
            <button
              className="icon-btn"
              onClick={() => navigate('/ambulances')}
              title={newBookingCount > 0 ? `${newBookingCount} new ambulance booking${newBookingCount === 1 ? '' : 's'}` : 'Ambulance bookings'}
            >
              <Bell size={18} />
              {newBookingCount > 0 ? <span className="badge-dot" /> : null}
            </button>
            <div className="avatar">A</div>
          </div>
        </header>
        <Outlet />
        <NewBookingAlert />
      </div>
    </div>
  )
}
