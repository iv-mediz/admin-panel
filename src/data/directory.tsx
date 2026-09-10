import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  cities as seedCities,
  fleet as seedFleet,
  franchises as seedFranchises,
  hospitals as seedHospitals,
  professionals as seedProfessionals,
  states as seedStates,
  subscriptionPlans as seedPlans,
  team as seedTeam,
  userSubscriptions as seedSubscriptions,
} from './mock'
import type {
  AmbulanceVehicle,
  AppState,
  City,
  Franchise,
  FranchiseStatus,
  Hospital,
  HospitalStatus,
  LocationStatus,
  Professional,
  SubscriptionBilling,
  SubscriptionPlan,
  SubscriptionStatus,
  TeamMember,
  TeamStatus,
  UserSubscription,
  VehicleStatus,
} from '../types'

interface DirectoryContextValue {
  hospitals: Hospital[]
  fleet: AmbulanceVehicle[]
  team: TeamMember[]
  states: AppState[]
  cities: City[]
  professionals: Professional[]
  subscriptionPlans: SubscriptionPlan[]
  userSubscriptions: UserSubscription[]
  franchises: Franchise[]
  addHospital: (hospital: Hospital) => void
  addVehicle: (vehicle: AmbulanceVehicle) => void
  addMember: (member: TeamMember) => void
  addState: (state: AppState) => void
  addCity: (city: City) => void
  addFranchise: (franchise: Franchise) => void
  setHospitalStatus: (id: string, status: HospitalStatus) => void
  setVehicleStatus: (id: string, status: VehicleStatus) => void
  setMemberStatus: (id: string, status: TeamStatus) => void
  setStateStatus: (id: string, status: LocationStatus) => void
  setCityStatus: (id: string, status: LocationStatus) => void
  setFranchiseStatus: (id: string, status: FranchiseStatus) => void
  addSubscriptionPlan: (plan: SubscriptionPlan) => void
  activateSubscription: (input: {
    userId: string
    userName: string
    email: string
    plan: string
    billing: SubscriptionBilling
    expiresOn: string | null
    notes?: string
  }) => void
  cancelSubscription: (userId: string) => void
}

const DirectoryContext = createContext<DirectoryContextValue | null>(null)

export function DirectoryProvider({ children }: { children: ReactNode }) {
  const [hospitals, setHospitals] = useState<Hospital[]>(seedHospitals)
  const [fleet, setFleet] = useState<AmbulanceVehicle[]>(seedFleet)
  const [team, setTeam] = useState<TeamMember[]>(seedTeam)
  const [states, setStates] = useState<AppState[]>(seedStates)
  const [cities, setCities] = useState<City[]>(seedCities)
  const [professionals, setProfessionals] = useState<Professional[]>(seedProfessionals)
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>(seedPlans)
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>(seedSubscriptions)
  const [franchises, setFranchises] = useState<Franchise[]>(seedFranchises)

  const value = useMemo<DirectoryContextValue>(
    () => ({
      hospitals,
      fleet,
      team,
      states,
      cities,
      professionals,
      subscriptionPlans,
      userSubscriptions,
      franchises,
      addHospital: (hospital) => setHospitals((prev) => [hospital, ...prev]),
      addVehicle: (vehicle) => setFleet((prev) => [vehicle, ...prev]),
      addMember: (member) => setTeam((prev) => [member, ...prev]),
      addState: (state) => setStates((prev) => [state, ...prev]),
      addCity: (city) => setCities((prev) => [city, ...prev]),
      addFranchise: (franchise) => setFranchises((prev) => [franchise, ...prev]),
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
      setFranchiseStatus: (id, status) =>
        setFranchises((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f))),
      addSubscriptionPlan: (plan) => setSubscriptionPlans((prev) => [...prev, plan]),
      activateSubscription: ({ userId, userName, email, plan, billing, expiresOn, notes }) => {
        const startedOn = new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
        const status: SubscriptionStatus = 'Active'
        setUserSubscriptions((prev) => {
          const existing = prev.find((s) => s.userId === userId)
          const next: UserSubscription = {
            id: existing?.id ?? `sub-${Date.now()}`,
            userId,
            userName,
            email,
            plan,
            billing,
            status,
            startedOn,
            expiresOn,
            activatedBy: billing === 'Manual' ? 'Admin' : existing?.activatedBy,
            notes,
          }
          return existing ? prev.map((s) => (s.userId === userId ? next : s)) : [next, ...prev]
        })
        setProfessionals((prev) =>
          prev.map((p) =>
            p.id === userId ? { ...p, subscriptionPlan: plan, subscriptionStatus: status } : p,
          ),
        )
      },
      cancelSubscription: (userId) => {
        setUserSubscriptions((prev) =>
          prev.map((s) => (s.userId === userId ? { ...s, status: 'Cancelled' as SubscriptionStatus } : s)),
        )
        setProfessionals((prev) =>
          prev.map((p) =>
            p.id === userId ? { ...p, subscriptionStatus: 'Cancelled' as SubscriptionStatus } : p,
          ),
        )
      },
    }),
    [hospitals, fleet, team, states, cities, professionals, subscriptionPlans, userSubscriptions, franchises],
  )

  return <DirectoryContext.Provider value={value}>{children}</DirectoryContext.Provider>
}

export function useDirectory() {
  const ctx = useContext(DirectoryContext)
  if (!ctx) throw new Error('useDirectory must be used inside DirectoryProvider')
  return ctx
}
