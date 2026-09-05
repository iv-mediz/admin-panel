export type JobType = 'Locum' | 'Part Time' | 'Full Time'
export type JobCategory = 'Nursing' | 'Doctors' | 'Allied Health' | 'Pharmacy'
export type JobStatus = 'Active' | 'Paused' | 'Closed'
export type ApplicationStatus =
  | 'Under Review'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Offer'
  | 'Rejected'
export type HospitalStatus = 'Partner' | 'Pending'
export type VehicleStatus = 'Active' | 'Pending'
export type BookingStatus = 'On the way' | 'Assigned' | 'Completed' | 'Cancelled'
export type TeamRole = 'Super Admin' | 'Recruiter' | 'Dispatch' | 'Support' | 'Hospital Relations' | 'Operations'
export type TeamStatus = 'Active' | 'Invited'
export type NotificationType = 'ambulance' | 'job' | 'profile' | 'hospital'

export interface Job {
  id: string
  title: string
  hospital: string
  location: string
  state: string
  district: string
  salary: string
  experience: string
  type: JobType
  category: JobCategory
  department: string
  availability: string
  posted: string
  status: JobStatus
  applicants: number
  rating: number
  description: string
  responsibilities: string[]
  tags: string[]
}

export interface Application {
  id: string
  jobId: string
  jobTitle: string
  hospital: string
  applicant: string
  role: string
  location: string
  appliedOn: string
  status: ApplicationStatus
  experience: string
  phone: string
  email: string
}

export interface Professional {
  id: string
  name: string
  role: string
  specialization: string
  location: string
  phone: string
  email: string
  experience: string
  completion: number
  status: 'Active' | 'Pending'
  applications: number
}

export interface Hospital {
  id: string
  name: string
  city: string
  state: string
  jobs: number
  rating: number
  contact: string
  status: HospitalStatus
  type?: string
  contactPerson?: string
  email?: string
  departments?: string[]
}

export interface AmbulanceVehicle {
  id: string
  operator: string
  vehicle: string
  serviceType: string
  driver: string
  phone: string
  city: string
  base: string
  status: VehicleStatus
}

export interface Booking {
  id: string
  serviceType: string
  pickup: string
  drop: string
  dateTime: string
  fare: string
  status: BookingStatus
  patientName: string
  driver: string
  vehicle: string
}

export interface AmbulanceService {
  id: 'bls' | 'als' | 'neo'
  title: string
  subtitle: string
  bookings: number
  fareFrom: string
}

export interface AppNotification {
  id: string
  title: string
  body: string
  time: string
  type: NotificationType
  read: boolean
}

export interface TeamMember {
  id: string
  name: string
  role: TeamRole
  email: string
  phone: string
  city: string
  joined: string
  status: TeamStatus
}

export interface WeeklyStat {
  label: string
  jobs: number
  bookings: number
}

export type LocationStatus = 'Active' | 'Paused' | 'Pending'

export interface AppState {
  id: string
  name: string
  code: string
  capital: string
  status: LocationStatus
}

export interface City {
  id: string
  name: string
  stateId: string
  stateName: string
  status: LocationStatus
}

export interface OnboardLocationState {
  justOnboarded?: string
}
