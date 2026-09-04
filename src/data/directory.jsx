import { createContext, useContext, useMemo, useState } from 'react'
import { fleet as seedFleet, hospitals as seedHospitals, team as seedTeam } from './mock'

const DirectoryContext = createContext(null)

export function DirectoryProvider({ children }) {
  const [hospitals, setHospitals] = useState(seedHospitals)
  const [fleet, setFleet] = useState(seedFleet)
  const [team, setTeam] = useState(seedTeam)

  const value = useMemo(
    () => ({
      hospitals,
      fleet,
      team,
      addHospital: (hospital) => setHospitals((prev) => [hospital, ...prev]),
      addVehicle: (vehicle) => setFleet((prev) => [vehicle, ...prev]),
      addMember: (member) => setTeam((prev) => [member, ...prev]),
      setHospitalStatus: (id, status) =>
        setHospitals((prev) => prev.map((h) => (h.id === id ? { ...h, status } : h))),
      setVehicleStatus: (id, status) =>
        setFleet((prev) => prev.map((v) => (v.id === id ? { ...v, status } : v))),
      setMemberStatus: (id, status) =>
        setTeam((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m))),
    }),
    [hospitals, fleet, team],
  )

  return <DirectoryContext.Provider value={value}>{children}</DirectoryContext.Provider>
}

export function useDirectory() {
  const ctx = useContext(DirectoryContext)
  if (!ctx) throw new Error('useDirectory must be used inside DirectoryProvider')
  return ctx
}
