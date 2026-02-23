import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import OAuthCallback from './pages/OAuthCallback'
import Onboarding from './pages/Onboarding'
import Schedule from './pages/Schedule'
import Today from './pages/Today'
import Profile from './pages/Profile'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './layouts/MainLayout'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/toss/callback" element={<OAuthCallback />} />
      <Route path="/onboarding" element={<Onboarding />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/today" element={<Today />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
  )
}
