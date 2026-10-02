import type {
  AmbulanceVehicle,
  Application,
  AppNotification,
  AppState,
  Booking,
  City,
  EntitySubscription,
  Franchise,
  Hospital,
  Job,
  Professional,
  SubscriptionPlan,
  TeamMember,
  Specialty,
  AmbulanceServiceTypeConfig,
} from '../types'
import { apiUrl, hasApiBackend } from '../config/api'
import { getAccessToken } from '../auth/session'
import { apiRequest, ApiError } from './http'

export type LocationQuery = { state?: string; district?: string }

function qs(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== 'All') search.set(key, value)
  })
  const s = search.toString()
  return s ? `?${s}` : ''
}

export type DashboardStats = {
  jobs: number
  activeJobs: number
  applications: number
  hospitals: number
  fleet: number
  bookings: number
  professionals: number
  partnerHospitals: number
  pendingHospitals: number
  interviewsScheduled: number
  liveFleet: number
  alsOnWay: number
  recentJobs: Job[]
  recentApplications: Application[]
  liveBookings: Booking[]
  weeklyStats: { label: string; jobs: number; bookings: number }[]
}

export async function fetchDashboardStats(query: LocationQuery = {}) {
  return apiRequest<DashboardStats>(
    `dashboard/stats${qs({ state: query.state, district: query.district })}`,
  )
}

export async function fetchJobs(query: LocationQuery & { q?: string; status?: string; type?: string; category?: string } = {}) {
  return apiRequest<Job[]>(
    `jobs${qs({
      state: query.state,
      district: query.district,
      q: query.q,
      status: query.status,
      type: query.type,
      category: query.category,
    })}`,
  )
}

export async function createJob(body: Partial<Job>) {
  return apiRequest<Job>('jobs', { method: 'POST', body: JSON.stringify(body) })
}

export async function updateJob(id: string, body: Partial<Job>) {
  return apiRequest<Job>(`jobs/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
}

export async function deleteJob(id: string) {
  return apiRequest<{ success: boolean }>(`jobs/${id}`, { method: 'DELETE' })
}

export async function fetchApplications(query: LocationQuery & { status?: string } = {}) {
  return apiRequest<Application[]>(
    `applications${qs({ state: query.state, district: query.district, status: query.status })}`,
  )
}

export async function updateApplicationStatus(id: string, status: Application['status']) {
  return apiRequest<Application>(`applications/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function fetchHospitals(query: LocationQuery & { status?: string } = {}) {
  return apiRequest<Hospital[]>(
    `hospitals${qs({ state: query.state, district: query.district, status: query.status })}`,
  )
}

export async function createHospital(body: Partial<Hospital>) {
  return apiRequest<Hospital>('hospitals', { method: 'POST', body: JSON.stringify(body) })
}

export async function updateHospital(id: string, body: Partial<Hospital>) {
  return apiRequest<Hospital>(`hospitals/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
}

export async function uploadHospitalImage(
  hospitalId: string,
  kind: 'logo' | 'cover',
  file: File,
): Promise<{ url: string }> {
  if (!hasApiBackend()) {
    throw new ApiError('VITE_API_BASE_URL is not configured', 0)
  }
  const form = new FormData()
  form.append('file', file)
  const headers = new Headers({ Accept: 'application/json' })
  const token = getAccessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(apiUrl(`media/hospitals/${hospitalId}/${kind}`), {
    method: 'POST',
    headers,
    body: form,
  })
  const text = await response.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }
  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'message' in data
        ? String((data as { message: unknown }).message)
        : `Upload failed (${response.status})`
    throw new ApiError(message, response.status)
  }
  return data as { url: string }
}

export async function fetchAmbulanceServiceTypes() {
  return apiRequest<AmbulanceServiceTypeConfig[]>('ambulance-services')
}

export async function updateAmbulanceServiceType(
  id: string,
  body: Partial<AmbulanceServiceTypeConfig>,
) {
  return apiRequest<AmbulanceServiceTypeConfig>(`ambulance-services/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function fetchFleet(query: LocationQuery & { status?: string } = {}) {
  return apiRequest<AmbulanceVehicle[]>(
    `fleet${qs({ state: query.state, district: query.district, status: query.status })}`,
  )
}

export async function createFleetVehicle(body: Partial<AmbulanceVehicle>) {
  return apiRequest<AmbulanceVehicle>('fleet', { method: 'POST', body: JSON.stringify(body) })
}

export async function updateFleetVehicle(id: string, body: Partial<AmbulanceVehicle>) {
  return apiRequest<AmbulanceVehicle>(`fleet/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
}

export async function fetchBookings(query: LocationQuery & { status?: string } = {}) {
  return apiRequest<Booking[]>(
    `bookings${qs({ state: query.state, district: query.district, status: query.status })}`,
  )
}

export async function fetchProfessionals(query: LocationQuery = {}) {
  return apiRequest<Professional[]>(
    `professionals${qs({ state: query.state, district: query.district })}`,
  )
}

export async function deleteProfessional(id: string) {
  return apiRequest<{ success: boolean }>(`professionals/${id}`, { method: 'DELETE' })
}

export async function updateProfessional(id: string, body: Partial<Professional>) {
  return apiRequest<Professional>(`professionals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function fetchStates() {
  return apiRequest<AppState[]>('locations/states')
}

export async function fetchCities(stateId?: string) {
  return apiRequest<City[]>(`locations/cities${stateId ? `?stateId=${encodeURIComponent(stateId)}` : ''}`)
}

export async function createState(body: Partial<AppState>) {
  return apiRequest<AppState>('locations/states', { method: 'POST', body: JSON.stringify(body) })
}

export async function createCity(body: Partial<City>) {
  return apiRequest<City>('locations/cities', { method: 'POST', body: JSON.stringify(body) })
}

export async function fetchSpecialties() {
  return apiRequest<Specialty[]>('specialties')
}

export async function createSpecialty(body: Partial<Specialty>) {
  return apiRequest<Specialty>('specialties', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateSpecialty(id: string, body: Partial<Specialty>) {
  return apiRequest<Specialty>(`specialties/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function deleteSpecialty(id: string) {
  return apiRequest<{ success: boolean }>(`specialties/${id}`, { method: 'DELETE' })
}

export async function fetchFranchises() {
  return apiRequest<Franchise[]>('franchises')
}

export async function updateFranchise(id: string, body: Partial<Franchise>) {
  return apiRequest<Franchise>(`franchises/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
}

export async function fetchTeam() {
  return apiRequest<TeamMember[]>('team')
}

export async function createTeamMember(body: Partial<TeamMember>) {
  return apiRequest<TeamMember>('team', { method: 'POST', body: JSON.stringify(body) })
}

export async function updateTeamMember(id: string, body: Partial<TeamMember>) {
  return apiRequest<TeamMember>(`team/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
}

export async function fetchSubscriptionPlans(audience?: string) {
  const q = audience ? `?audience=${encodeURIComponent(audience)}` : ''
  return apiRequest<SubscriptionPlan[]>(`subscriptions/plans${q}`)
}

export async function createSubscriptionPlan(body: Partial<SubscriptionPlan>) {
  return apiRequest<SubscriptionPlan>('subscriptions/plans', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function fetchSubscriptions() {
  return apiRequest<EntitySubscription[]>('subscriptions')
}

export async function activateSubscription(body: {
  subscriberId: string
  subscriberType: string
  planName: string
  billing?: string
}) {
  return apiRequest<EntitySubscription>('subscriptions/activate', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function cancelSubscription(id: string) {
  return apiRequest<EntitySubscription>(`subscriptions/${id}/cancel`, { method: 'PATCH' })
}

export async function fetchNotifications() {
  return apiRequest<AppNotification[]>('notifications/admin/all')
}

export async function markNotificationRead(id: string) {
  return apiRequest<{ success: boolean }>(`notifications/${id}/read`, { method: 'PATCH' })
}
