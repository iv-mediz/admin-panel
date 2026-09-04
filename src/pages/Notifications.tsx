import { Ambulance, Bell, Building2, Briefcase, UserRound, type LucideIcon } from 'lucide-react'
import { notifications } from '../data/mock'
import type { NotificationType } from '../types'

const META: Record<NotificationType, { bg: string; color: string; icon: LucideIcon }> = {
  ambulance: { bg: '#fee8e8', color: '#dc2626', icon: Ambulance },
  job: { bg: '#e7f7f8', color: '#0097a7', icon: Briefcase },
  profile: { bg: '#e8f0fe', color: '#2563eb', icon: UserRound },
  hospital: { bg: '#e8f8ee', color: '#16a34a', icon: Building2 },
}

export default function Notifications() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>Notifications</h3>
          <p>Same alerts the mobile app shows under Notifications</p>
        </div>
        <button className="btn btn-outline">
          <Bell size={16} />
          Compose
        </button>
      </div>
      <div className="card card-pad">
        {notifications.map((n) => {
          const meta = META[n.type]
          const Icon = meta.icon
          return (
            <div className="list-item" key={n.id}>
              <div className="icon-box" style={{ background: meta.bg, color: meta.color }}>
                <Icon size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="cell-title">{n.title}</div>
                <div className="cell-sub">{n.body}</div>
                <div className="cell-sub">{n.time}</div>
              </div>
              {!n.read && <span className="chip chip-review">New</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
