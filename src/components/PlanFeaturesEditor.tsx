import { Plus, Trash2 } from 'lucide-react'
import type { SubscriptionAudience } from '../types'

const SUGGESTED: Record<SubscriptionAudience, string[]> = {
  Employee: [
    'Browse healthcare jobs',
    'Unlimited job applications',
    'Priority profile visibility',
    'Ambulance booking access',
    'Application status alerts',
    'Email support',
  ],
  Hospital: [
    'Unlimited job posts',
    'Applicant shortlist tools',
    'Hospital branding on listings',
    'Priority support',
    'Analytics dashboard',
  ],
  'Ambulance owner': [
    'Priority dispatch routing',
    'Unlimited fleet vehicles',
    'Live driver location',
    'Booking notifications',
    'Fleet performance reports',
  ],
}

export default function PlanFeaturesEditor({
  audience,
  features,
  draft,
  onDraftChange,
  onAdd,
  onRemove,
}: {
  audience: SubscriptionAudience
  features: string[]
  draft: string
  onDraftChange: (value: string) => void
  onAdd: (text?: string) => void
  onRemove: (feature: string) => void
}) {
  const suggestions = SUGGESTED[audience].filter((s) => !features.includes(s))

  return (
    <>
      <p className="muted" style={{ marginBottom: 14 }}>
        List what {audience.toLowerCase()}s get with this plan. Add at least one feature.
      </p>
      <div className="feature-add-row">
        <input
          placeholder={
            audience === 'Employee'
              ? 'e.g. Unlimited job applications'
              : audience === 'Hospital'
                ? 'e.g. Unlimited job posts'
                : 'e.g. Priority dispatch routing'
          }
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onAdd()
            }
          }}
        />
        <button type="button" className="btn btn-outline" onClick={() => onAdd()} disabled={!draft.trim()}>
          <Plus size={16} />
          Add
        </button>
      </div>
      {suggestions.length > 0 ? (
        <div className="pills" style={{ marginTop: 12, marginBottom: 4 }}>
          {suggestions.map((s) => (
            <button key={s} type="button" className="pill" onClick={() => onAdd(s)}>
              + {s}
            </button>
          ))}
        </div>
      ) : null}
      {features.length > 0 ? (
        <ul className="feature-edit-list">
          {features.map((f, index) => (
            <li key={`${f}-${index}`}>
              <span>{f}</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onRemove(f)}
                aria-label="Remove feature"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted" style={{ marginTop: 12 }}>No features added yet.</p>
      )}
    </>
  )
}
