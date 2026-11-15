import { useMemo } from 'react'
import { useDirectory } from '../data/directory'

interface LocationFiltersProps {
  state: string
  district: string
  onStateChange: (value: string) => void
  onDistrictChange: (value: string) => void
  showDistrict?: boolean
}

export default function LocationFilters({
  state,
  district,
  onStateChange,
  onDistrictChange,
  showDistrict = true,
}: LocationFiltersProps) {
  const { states, cities } = useDirectory()

  const districts = useMemo(() => {
    if (state === 'All') {
      return [...new Set(cities.map((c) => c.name))].sort()
    }
    const stateId = states.find((s) => s.name === state)?.id
    return cities.filter((c) => c.stateId === stateId).map((c) => c.name)
  }, [states, cities, state])

  return (
    <>
      <select
        className="select"
        value={state}
        onChange={(e) => {
          onStateChange(e.target.value)
          onDistrictChange('All')
        }}
      >
        <option value="All">All states</option>
        {states.map((s) => (
          <option key={s.id} value={s.name}>
            {s.name}
          </option>
        ))}
      </select>
      {showDistrict && (
        <select className="select" value={district} onChange={(e) => onDistrictChange(e.target.value)}>
          <option value="All">All cities / districts</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      )}
    </>
  )
}
