interface ActiveToggleProps {
  active: boolean
  onChange: (active: boolean) => void
  disabled?: boolean
  /** Shown beside the switch (e.g. Active / Inactive). */
  showLabel?: boolean
  ariaLabel?: string
}

export default function ActiveToggle({
  active,
  onChange,
  disabled = false,
  showLabel = true,
  ariaLabel = 'Toggle active',
}: ActiveToggleProps) {
  return (
    <label className={`active-toggle${disabled ? ' is-disabled' : ''}`} title={ariaLabel}>
      <input
        type="checkbox"
        checked={active}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={ariaLabel}
      />
      <span className="active-toggle-track" aria-hidden />
      {showLabel ? (
        <span className={`active-toggle-text${active ? '' : ' muted'}`}>
          {active ? 'Active' : 'Inactive'}
        </span>
      ) : null}
    </label>
  )
}
