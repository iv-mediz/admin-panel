const CLASS_MAP: Record<string, string> = {
  'Under Review': 'chip-review',
  Shortlisted: 'chip-shortlisted',
  'Interview Scheduled': 'chip-interview',
  Rejected: 'chip-rejected',
  Offer: 'chip-offer',
  Recruited: 'chip-recruited',
  Completed: 'chip-completed',
  Cancelled: 'chip-cancelled',
  New: 'chip-review',
  'On the way': 'chip-way',
  Assigned: 'chip-assigned',
  Active: 'chip-active',
  Paused: 'chip-paused',
  Closed: 'chip-closed',
  Pending: 'chip-pending',
  Invited: 'chip-pending',
  Partner: 'chip-partner',
  Locum: 'chip-locum',
  'Part Time': 'chip-part',
  'Full Time': 'chip-full',
  Expired: 'chip-paused',
  Suspended: 'chip-rejected',
  None: 'chip-pending',
}

export default function StatusChip({ label }: { label: string }) {
  return <span className={`chip ${CLASS_MAP[label] ?? 'chip-review'}`}>{label}</span>
}
