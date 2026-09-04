import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { fleet as seedFleet, hospitals as seedHospitals, team as seedTeam } from './mock'
import type { AmbulanceVehicle, Hospital, TeamMember, TeamStatus, VehicleStatus, HospitalStatus } from '../types'

interface DirectoryContextValue {
  hospitals: Hospital[]
  fleet: AmbulanceVehicle[]
  team: TeamMember[]
  addHospital: (hospital: Hospital) => void
  addVehicle: (vehicle: AmbulanceVehicle) => void
  addMember: (member: TeamMember) => void
  setHospitalStatus: (id: string, status: HospitalStatus) => void
  setVehicleStatus: (id: string, status: VehicleStatus) => void
  setMemberStatus: (id: string, status: TeamStatus) => void
}

const DirectoryContext = createContext<DirectoryContextValue | null>(null)

export function DirectoryProvider({ children }: { children: ReactNode }) {
  const [hospitals, setHospitals] = useState<Hospital[]>(seedHospitals)
  const [fleet, setFleet] = useState<AmbulanceVehicle[]>(seedFleet)
  const [team, setTeam] = useState<TeamMember[]>(seedTeam)

  const value = useMemo<DirectoryContextValue>(
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
