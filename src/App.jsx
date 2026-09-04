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
import Team from './pages/Team'

function Protected({ children }) {
  const ok = localStorage.getItem('ivmediz-admin') === '1'
  if (!ok) return <Navigate to="/login" replace />
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
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
