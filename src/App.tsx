import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { DirectoryProvider } from './data/directory'
import Ambulances from './pages/Ambulances'
import Applications from './pages/Applications'
import Dashboard from './pages/Dashboard'
import Hospitals from './pages/Hospitals'
import Jobs from './pages/Jobs'
import Login from './pages/Login'
import Notifications from './pages/Notifications'
import OnboardAmbulance from './pages/OnboardAmbulance'
import OnboardHospital from './pages/OnboardHospital'
import Professionals from './pages/Professionals'
import Settings from './pages/Settings'
import States from './pages/States'
import Cities from './pages/Cities'
import Specialties from './pages/Specialties'
import Franchises from './pages/Franchises'
import CreatePlan from './pages/CreatePlan'
import Subscriptions from './pages/Subscriptions'
import Team from './pages/Team'
import { isAuthenticated } from './auth/session'

function Protected({ children }: { children: ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <Protected>
            <DirectoryProvider>
              <Layout />
            </DirectoryProvider>
          </Protected>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/professionals" element={<Professionals />} />
        <Route path="/team" element={<Team />} />
        <Route path="/hospitals" element={<Hospitals />} />
        <Route path="/hospitals/onboard" element={<OnboardHospital />} />
        <Route path="/ambulances" element={<Ambulances />} />
        <Route path="/ambulances/onboard" element={<OnboardAmbulance />} />
        <Route path="/states" element={<States />} />
        <Route path="/cities" element={<Cities />} />
        <Route path="/specialties" element={<Specialties />} />
        <Route path="/franchises" element={<Franchises />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/subscriptions/plans/create" element={<CreatePlan />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
