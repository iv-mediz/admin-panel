import { useMemo } from 'react'
import { useDirectory } from '../data/directory'

interface CityDistrictSelectProps {
  stateName: string
  value: string
  onChange: (cityDistrict: string) => void
  required?: boolean
  className?: string
}

/** Single city/district picker backed by locations/cities from the API (via directory). */
export default function CityDistrictSelect({
  stateName,
  value,
  onChange,
  required = true,
  className,
}: CityDistrictSelectProps) {
  const { cities } = useDirectory()

  const options = useMemo(() => {
    const names = cities
      .filter((c) => c.stateName === stateName && c.status !== 'Paused')
      .map((c) => c.name)
    return [...new Set(names)].sort((a, b) => a.localeCompare(b))
  }, [cities, stateName])

  return (
    <div className={className ?? 'field'}>
      <label>City / district</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required && options.length > 0}
        disabled={!stateName || options.length === 0}
      >
        <option value="">
          {!stateName
            ? 'Select state first'
            : options.length === 0
              ? 'No cities loaded'
              : 'Select city / district'}
        </option>
        {options.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  )
}

export function cityDistrictPayload(cityDistrict: string) {
  const name = cityDistrict.trim()
  return { city: name, district: name }
}
