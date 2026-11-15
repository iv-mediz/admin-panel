export function matchesLocation(
  item: { state?: string; district?: string },
  stateFilter: string,
  districtFilter: string,
): boolean {
  const stateOk = stateFilter === 'All' || item.state === stateFilter
  const districtOk = districtFilter === 'All' || item.district === districtFilter
  return stateOk && districtOk
}
