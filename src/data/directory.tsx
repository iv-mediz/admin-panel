import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { cities as seedCities, fleet as seedFleet, hospitals as seedHospitals, states as seedStates, team as seedTeam } from './mock'
import type {
  AmbulanceVehicle,
  AppState,
  City,
  Hospital,
  HospitalStatus,
  LocationStatus,
  TeamMember,
  TeamStatus,
  VehicleStatus,
} from '../types'

interface DirectoryContextValue {
  hospitals: Hospital[]
  fleet: AmbulanceVehicle[]
  team: TeamMember[]
  states: AppState[]
  cities: City[]
  addHospital: (hospital: Hospital) => void
  addVehicle: (vehicle: AmbulanceVehicle) => void
  addMember: (member: TeamMember) => void
  addState: (state: AppState) => void
  addCity: (city: City) => void
  setHospitalStatus: (id: string, status: HospitalStatus) => void
  setVehicleStatus: (id: string, status: VehicleStatus) => void
  setMemberStatus: (id: string, status: TeamStatus) => void
  setStateStatus: (id: string, status: LocationStatus) => void
  setCityStatus: (id: string, status: LocationStatus) => void
}

const DirectoryContext = createContext<DirectoryContextValue | null>(null)

export function DirectoryProvider({ children }: { children: ReactNode }) {
  const [hospitals, setHospitals] = useState<Hospital[]>(seedHospitals)
  const [fleet, setFleet] = useState<AmbulanceVehicle[]>(seedFleet)
  const [team, setTeam] = useState<TeamMember[]>(seedTeam)
  const [states, setStates] = useState<AppState[]>(seedStates)
  const [cities, setCities] = useState<City[]>(seedCities)

  const value = useMemo<DirectoryContextValue>(
    () => ({
      hospitals,
      fleet,
      team,
      states,
      cities,
      addHospital: (hospital) => setHospitals((prev) => [hospital, ...prev]),
      addVehicle: (vehicle) => setFleet((prev) => [vehicle, ...prev]),
      addMember: (member) => setTeam((prev) => [member, ...prev]),
      addState: (state) => setStates((prev) => [state, ...prev]),
      addCity: (city) => setCities((prev) => [city, ...prev]),
      setHospitalStatus: (id, status) =>
        setHospitals((prev) => prev.map((h) => (h.id === id ? { ...h, status } : h))),
      setVehicleStatus: (id, status) =>
        setFleet((prev) => prev.map((v) => (v.id === id ? { ...v, status } : v))),
      setMemberStatus: (id, status) =>
        setTeam((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m))),
      setStateStatus: (id, status) =>
        setStates((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s))),
      setCityStatus: (id, status) =>
        setCities((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c))),
    }),
    [hospitals, fleet, team, states, cities],
  )

  return <DirectoryContext.Provider value={value}>{children}</DirectoryContext.Provider>
}

export function useDirectory() {
  const ctx = useContext(DirectoryContext)
  if (!ctx) throw new Error('useDirectory must be used inside DirectoryProvider')
  return ctx
}
