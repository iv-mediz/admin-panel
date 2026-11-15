import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as adminApi from '../api/admin'
import { ApiError } from '../api/http'
import { hasApiBackend } from '../config/api'
import type {
  AmbulanceVehicle,
  Application,
  AppNotification,
  AppState,
  Booking,
  City,
  Franchise,
  Hospital,
  Job,
  Professional,
  EntitySubscription,
  SubscriptionAudience,
  SubscriptionBilling,
  SubscriptionPlan,
  SubscriptionStatus,
  TeamMember,
  FranchiseStatus,
  HospitalStatus,
  LocationStatus,
  TeamStatus,
  VehicleStatus,
  ApplicationStatus,
  Specialty,
  AmbulanceServiceTypeConfig,
} from '../types'

interface DirectoryContextValue {
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  jobs: Job[]
  applications: Application[]
  bookings: Booking[]
  updateBooking: (booking: Booking) => void
  notifications: AppNotification[]
  hospitals: Hospital[]
  setHospitals: React.Dispatch<React.SetStateAction<Hospital[]>>
  fleet: AmbulanceVehicle[]
  ambulanceServiceTypes: AmbulanceServiceTypeConfig[]
  updateAmbulanceServiceType: (
    id: string,
    patch: Partial<AmbulanceServiceTypeConfig>,
  ) => Promise<void>
  team: TeamMember[]
  states: AppState[]
  cities: City[]
  specialties: Specialty[]
  professionals: Professional[]
  subscriptionPlans: SubscriptionPlan[]
  userSubscriptions: EntitySubscription[]
  franchises: Franchise[]
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>
  addHospital: (hospital: Hospital) => void
  prependHospital: (hospital: Hospital) => void
  addVehicle: (vehicle: AmbulanceVehicle) => void
  addMember: (member: TeamMember) => void
  addState: (state: AppState) => void
  updateState: (id: string, patch: Partial<AppState>) => void
  addCity: (city: City) => void
  updateCity: (id: string, patch: Partial<City>) => void
  addSpecialty: (specialty: Specialty) => void
  updateSpecialty: (id: string, patch: Partial<Specialty>) => void
  setSpecialtyStatus: (id: string, status: LocationStatus) => void
  removeSpecialty: (specialty: Specialty) => void
  addFranchise: (franchise: Franchise) => void
  updateFranchise: (id: string, patch: Partial<Franchise>) => void
  addProfessional: (professional: Professional) => void
  updateProfessional: (id: string, patch: Partial<Professional>) => void
  removeProfessional: (id: string) => void
  updateMember: (id: string, patch: Partial<TeamMember>) => void
  updateHospital: (id: string, patch: Partial<Hospital>) => void
  addSubscriptionPlan: (plan: SubscriptionPlan) => void
  updateSubscriptionPlan: (id: string, patch: Partial<SubscriptionPlan>) => void
  updateUserSubscription: (id: string, patch: Partial<EntitySubscription> & { planName?: string }) => void
  setHospitalStatus: (id: string, status: HospitalStatus) => void
  setHospitalActive: (id: string, isActive: boolean) => void
  setVehicleStatus: (id: string, status: VehicleStatus) => void
  setVehicleActive: (id: string, isActive: boolean) => void
  setJobStatus: (id: string, status: Job['status']) => void
  setProfessionalStatus: (id: string, status: Professional['status']) => void
  setMemberStatus: (id: string, status: TeamStatus) => void
  setStateStatus: (id: string, status: LocationStatus) => void
  setCityStatus: (id: string, status: LocationStatus) => void
  setFranchiseStatus: (id: string, status: FranchiseStatus) => void
  updateApplicationStatus: (id: string, status: ApplicationStatus) => void
  activateSubscription: (input: {
    subscriberId: string
    subscriberType: SubscriptionAudience
    subscriberName: string
    email: string
    plan: string
    billing: SubscriptionBilling
    expiresOn: string | null
    notes?: string
  }) => void
  cancelSubscription: (subscriberId: string, subscriberType: SubscriptionAudience) => void
}

const DirectoryContext = createContext<DirectoryContextValue | null>(null)

async function loadAllData(): Promise<{
  jobs: Job[]
  applications: Application[]
  bookings: Booking[]
  hospitals: Hospital[]
  fleet: AmbulanceVehicle[]
  ambulanceServiceTypes: AmbulanceServiceTypeConfig[]
  team: TeamMember[]
  states: AppState[]
  cities: City[]
  specialties: Specialty[]
  professionals: Professional[]
  subscriptionPlans: SubscriptionPlan[]
  userSubscriptions: EntitySubscription[]
  franchises: Franchise[]
  notifications: AppNotification[]
  loadWarnings: string[]
}> {
  type DataKey =
    | 'jobs'
    | 'applications'
    | 'bookings'
    | 'hospitals'
    | 'fleet'
    | 'ambulanceServiceTypes'
    | 'team'
    | 'states'
    | 'cities'
    | 'specialties'
    | 'professionals'
    | 'subscriptionPlans'
    | 'userSubscriptions'
    | 'franchises'
    | 'notifications'

  const entries: { key: DataKey; promise: Promise<unknown> }[] = [
    { key: 'jobs', promise: adminApi.fetchJobs() },
    { key: 'applications', promise: adminApi.fetchApplications() },
    { key: 'bookings', promise: adminApi.fetchBookings() },
    { key: 'hospitals', promise: adminApi.fetchHospitals() },
    { key: 'fleet', promise: adminApi.fetchFleet() },
    { key: 'ambulanceServiceTypes', promise: adminApi.fetchAmbulanceServiceTypes() },
    { key: 'team', promise: adminApi.fetchTeam() },
    { key: 'states', promise: adminApi.fetchStates() },
    { key: 'cities', promise: adminApi.fetchCities() },
    { key: 'specialties', promise: adminApi.fetchSpecialties() },
    { key: 'professionals', promise: adminApi.fetchProfessionals() },
    { key: 'subscriptionPlans', promise: adminApi.fetchSubscriptionPlans() },
    { key: 'userSubscriptions', promise: adminApi.fetchSubscriptions() },
    { key: 'franchises', promise: adminApi.fetchFranchises() },
    { key: 'notifications', promise: adminApi.fetchNotifications() },
  ]

  const settled = await Promise.allSettled(entries.map((e) => e.promise))
  const loadWarnings: string[] = []
  const empty = {
    jobs: [],
    applications: [],
    bookings: [],
    hospitals: [],
    fleet: [],
    ambulanceServiceTypes: [],
    team: [],
    states: [],
    cities: [],
    specialties: [],
    professionals: [],
    subscriptionPlans: [],
    userSubscriptions: [],
    franchises: [],
    notifications: [],
    loadWarnings: [],
  }

  for (let i = 0; i < settled.length; i++) {
    const result = settled[i]
    const key = entries[i].key
    if (result.status === 'fulfilled') {
      ;(empty as Record<string, unknown>)[key] = result.value
    } else {
      const reason = result.reason
      if (reason instanceof ApiError) {
        if (reason.status === 401) {
          throw reason
        }
        loadWarnings.push(`${key}: ${reason.message}`)
      } else {
        loadWarnings.push(`${key}: failed to load`)
      }
    }
  }

  return { ...empty, loadWarnings }
}

export function DirectoryProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(hasApiBackend())
  const [error, setError] = useState<string | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [fleet, setFleet] = useState<AmbulanceVehicle[]>([])
  const [ambulanceServiceTypes, setAmbulanceServiceTypes] = useState<
    AmbulanceServiceTypeConfig[]
  >([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [states, setStates] = useState<AppState[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([])
  const [userSubscriptions, setUserSubscriptions] = useState<EntitySubscription[]>([])
  const [franchises, setFranchises] = useState<Franchise[]>([])

  const refresh = useCallback(async () => {
    if (!hasApiBackend()) return
    setLoading(true)
    setError(null)
    try {
      const data = await loadAllData()
      setJobs(data.jobs)
      setApplications(data.applications)
      setBookings(data.bookings)
      setHospitals(data.hospitals)
      setFleet(data.fleet)
      setAmbulanceServiceTypes(data.ambulanceServiceTypes)
      setTeam(data.team)
      setStates(data.states)
      setCities(data.cities)
      setSpecialties(data.specialties)
      setProfessionals(data.professionals)
      setSubscriptionPlans(data.subscriptionPlans)
      setUserSubscriptions(
        data.userSubscriptions.map((s) => ({
          ...s,
          email: s.email ?? '',
        })),
      )
      setFranchises(data.franchises)
      setNotifications(data.notifications)
      setError(
        data.loadWarnings.length > 0 ? data.loadWarnings.join(' · ') : null,
      )
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError(null)
        return
      }
      setError(e instanceof ApiError ? e.message : 'Failed to load data from API')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const updateBooking = useCallback((booking: Booking) => {
    setBookings((prev) => {
      const next = prev.map((b) => (b.id === booking.id ? { ...b, ...booking } : b))
      return next.some((b) => b.id === booking.id) ? next : [booking, ...next]
    })
  }, [])

  const value = useMemo<DirectoryContextValue>(
    () => ({
      loading,
      error,
      refresh,
      jobs,
      applications,
      bookings,
      updateBooking,
      notifications,
      hospitals,
      setHospitals,
      fleet,
      ambulanceServiceTypes,
      updateAmbulanceServiceType: async (id, patch) => {
        const updated = await adminApi.updateAmbulanceServiceType(id, patch)
        setAmbulanceServiceTypes((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...updated } : t)),
        )
      },
      team,
      states,
      cities,
      specialties,
      professionals,
      subscriptionPlans,
      userSubscriptions,
      franchises,
      setJobs,
      setApplications,
      addHospital: (hospital) => {
        if (hasApiBackend()) {
          void adminApi.createHospital(hospital).then((created) => {
            setHospitals((prev) => [created, ...prev])
          })
          return
        }
        setHospitals((prev) => [hospital, ...prev])
      },
      prependHospital: (hospital) => {
        setHospitals((prev) => [hospital, ...prev])
      },
      addVehicle: (vehicle) => {
        if (hasApiBackend()) {
          void adminApi.createFleetVehicle(vehicle).then((created) => {
            setFleet((prev) => [created, ...prev])
          })
          return
        }
        setFleet((prev) => [vehicle, ...prev])
      },
      addMember: (member) => {
        if (hasApiBackend()) {
          void adminApi.createTeamMember(member).then((created) => {
            setTeam((prev) => [created, ...prev])
          })
          return
        }
        setTeam((prev) => [member, ...prev])
      },
      addState: (state) => {
        if (hasApiBackend()) {
          void adminApi.createState(state).then((created) => {
            setStates((prev) => [created, ...prev])
          })
          return
        }
        setStates((prev) => [state, ...prev])
      },
      addCity: (city) => {
        if (hasApiBackend()) {
          void adminApi.createCity(city).then((created) => {
            setCities((prev) => [created, ...prev])
          })
          return
        }
        setCities((prev) => [city, ...prev])
      },
      updateState: (id, patch) => {
        setStates((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
        if (hasApiBackend()) {
          void adminApi.updateState(id, patch).then((updated) => {
            setStates((prev) => prev.map((s) => (s.id === id ? updated : s)))
            if (updated.name) {
              setCities((prev) =>
                prev.map((c) => (c.stateId === id ? { ...c, stateName: updated.name } : c)),
              )
            }
          })
        }
      },
      updateCity: (id, patch) => {
        setCities((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
        if (hasApiBackend()) {
          void adminApi.updateCity(id, patch).then((updated) => {
            setCities((prev) => prev.map((c) => (c.id === id ? updated : c)))
          })
        }
      },
      addSpecialty: (specialty) => {
        if (hasApiBackend()) {
          void adminApi.createSpecialty(specialty).then((created) => {
            setSpecialties((prev) => [...prev, created])
          })
          return
        }
        setSpecialties((prev) => [...prev, specialty])
      },
      updateSpecialty: (id, patch) => {
        setSpecialties((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
        if (hasApiBackend()) {
          void adminApi.updateSpecialty(id, patch).then((updated) => {
            setSpecialties((prev) => prev.map((s) => (s.id === id ? updated : s)))
          })
        }
      },
      setSpecialtyStatus: (id, status) => {
        setSpecialties((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)))
        if (hasApiBackend()) {
          void adminApi.updateSpecialty(id, { status })
        }
      },
      removeSpecialty: (specialty) => {
        setSpecialties((prev) => prev.filter((s) => s.id !== specialty.id))
        if (hasApiBackend()) {
          void adminApi.deleteSpecialty(specialty.id)
        }
      },
      addFranchise: (franchise) => {
        setFranchises((prev) => [franchise, ...prev])
      },
      updateFranchise: (id, patch) => {
        setFranchises((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
        if (hasApiBackend()) {
          void adminApi.updateFranchise(id, patch).then((updated) => {
            setFranchises((prev) => prev.map((f) => (f.id === id ? updated : f)))
          })
        }
      },
      addProfessional: (professional) => {
        setProfessionals((prev) => [professional, ...prev])
      },
      updateProfessional: (id, patch) => {
        setProfessionals((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
        if (hasApiBackend()) {
          void adminApi.updateProfessional(id, patch).then((updated) => {
            setProfessionals((prev) => prev.map((p) => (p.id === id ? updated : p)))
          })
        }
      },
      updateMember: (id, patch) => {
        setTeam((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
        if (hasApiBackend()) {
          void adminApi.updateTeamMember(id, patch).then((updated) => {
            setTeam((prev) => prev.map((m) => (m.id === id ? updated : m)))
          })
        }
      },
      updateHospital: (id, patch) => {
        setHospitals((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h)))
        if (hasApiBackend()) {
          void adminApi.updateHospital(id, patch).then((updated) => {
            setHospitals((prev) => prev.map((h) => (h.id === id ? updated : h)))
          })
        }
      },
      removeProfessional: (id) => {
        if (hasApiBackend()) {
          void adminApi.deleteProfessional(id).then(() => {
            setProfessionals((prev) => prev.filter((p) => p.id !== id))
            void refresh()
          })
          return
        }
        setProfessionals((prev) => prev.filter((p) => p.id !== id))
      },
      setHospitalStatus: (id, status) => {
        setHospitals((prev) => prev.map((h) => (h.id === id ? { ...h, status } : h)))
        if (hasApiBackend()) {
          void adminApi.updateHospital(id, { status })
        }
      },
      setHospitalActive: (id, isActive) => {
        setHospitals((prev) => prev.map((h) => (h.id === id ? { ...h, isActive } : h)))
        if (hasApiBackend()) {
          void adminApi.updateHospital(id, { isActive })
        }
      },
      setVehicleStatus: (id, status) => {
        const isActive = status === 'Active'
        setFleet((prev) =>
          prev.map((v) =>
            v.id === id ? { ...v, status, ...(isActive ? { isActive: true } : {}) } : v,
          ),
        )
        if (hasApiBackend()) {
          void adminApi.updateFleetVehicle(
            id,
            isActive ? { status, isActive: true } : { status },
          )
        }
      },
      setVehicleActive: (id, isActive) => {
        setFleet((prev) => prev.map((v) => (v.id === id ? { ...v, isActive } : v)))
        if (hasApiBackend()) {
          void adminApi.updateFleetVehicle(id, { isActive })
        }
      },
      setJobStatus: (id, status) => {
        setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status } : j)))
        if (hasApiBackend()) {
          void adminApi.updateJob(id, { status })
        }
      },
      setProfessionalStatus: (id, status) => {
        setProfessionals((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
        if (hasApiBackend()) {
          void adminApi.updateProfessional(id, { status })
        }
      },
      setMemberStatus: (id, status) => {
        setTeam((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)))
        if (hasApiBackend()) {
          void adminApi.updateTeamMember(id, { status })
        }
      },
      setStateStatus: (id, status) => {
        setStates((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)))
        if (hasApiBackend()) {
          void adminApi.updateState(id, { status })
        }
      },
      setCityStatus: (id, status) => {
        setCities((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
        if (hasApiBackend()) {
          void adminApi.updateCity(id, { status })
        }
      },
      setFranchiseStatus: (id, status) => {
        setFranchises((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)))
        if (hasApiBackend()) {
          void adminApi.updateFranchise(id, { status })
        }
      },
      addSubscriptionPlan: (plan) => {
        if (hasApiBackend()) {
          void adminApi.createSubscriptionPlan(plan).then((created) => {
            setSubscriptionPlans((prev) => [...prev, created])
          })
          return
        }
        setSubscriptionPlans((prev) => [...prev, plan])
      },
      updateSubscriptionPlan: (id, patch) => {
        setSubscriptionPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
        if (hasApiBackend()) {
          void adminApi.updateSubscriptionPlan(id, patch).then((updated) => {
            setSubscriptionPlans((prev) => prev.map((p) => (p.id === id ? updated : p)))
          })
        }
      },
      updateUserSubscription: (id, patch) => {
        setUserSubscriptions((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch, ...(patch.planName ? { plan: patch.planName } : {}) } : s)))
        if (hasApiBackend()) {
          void adminApi.updateSubscription(id, patch).then((updated) => {
            setUserSubscriptions((prev) => prev.map((s) => (s.id === id ? updated : s)))
          })
        }
      },
      updateApplicationStatus: (id, status) => {
        setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
        if (hasApiBackend()) {
          void adminApi.updateApplicationStatus(id, status)
        }
      },
      activateSubscription: (input) => {
        if (hasApiBackend()) {
          void adminApi
            .activateSubscription({
              subscriberId: input.subscriberId,
              subscriberType: input.subscriberType,
              planName: input.plan,
              billing: input.billing,
            })
            .then(() => refresh())
          return
        }
        const startedOn = new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
        const status: SubscriptionStatus = 'Active'
        setUserSubscriptions((prev) => {
          const existing = prev.find(
            (s) => s.subscriberId === input.subscriberId && s.subscriberType === input.subscriberType,
          )
          const next: EntitySubscription = {
            id: existing?.id ?? `sub-${Date.now()}`,
            subscriberId: input.subscriberId,
            subscriberType: input.subscriberType,
            subscriberName: input.subscriberName,
            email: input.email,
            plan: input.plan,
            billing: input.billing,
            status,
            startedOn,
            expiresOn: input.expiresOn,
            activatedBy: input.billing === 'Manual' ? 'Admin' : existing?.activatedBy,
            notes: input.notes,
          }
          return existing
            ? prev.map((s) =>
                s.subscriberId === input.subscriberId && s.subscriberType === input.subscriberType
                  ? next
                  : s,
              )
            : [next, ...prev]
        })
      },
      cancelSubscription: (subscriberId, subscriberType) => {
        const sub = userSubscriptions.find(
          (s) => s.subscriberId === subscriberId && s.subscriberType === subscriberType,
        )
        if (hasApiBackend() && sub) {
          void adminApi.cancelSubscription(sub.id).then(() => refresh())
          return
        }
        setUserSubscriptions((prev) =>
          prev.map((s) =>
            s.subscriberId === subscriberId && s.subscriberType === subscriberType
              ? { ...s, status: 'Cancelled' as SubscriptionStatus }
              : s,
          ),
        )
      },
    }),
    [
      loading,
      error,
      refresh,
      updateBooking,
      jobs,
      applications,
      bookings,
      notifications,
      hospitals,
      fleet,
      ambulanceServiceTypes,
      team,
      states,
      cities,
      specialties,
      professionals,
      subscriptionPlans,
      userSubscriptions,
      franchises,
    ],
  )

  return <DirectoryContext.Provider value={value}>{children}</DirectoryContext.Provider>
}

export function useDirectory() {
  const ctx = useContext(DirectoryContext)
  if (!ctx) throw new Error('useDirectory must be used inside DirectoryProvider')
  return ctx
}
