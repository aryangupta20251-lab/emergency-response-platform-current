import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import DashboardPage from '../pages/DashboardPage'
import ReservedPage from '../pages/ReservedPage'

const reserved = {
  '/forgot-password': 'Forgot Password',
  '/reset-password': 'Reset Password',
  '/report-accident': 'Report Accident',
  '/incidents': 'Incidents',
  '/hospitals': 'Hospitals',
  '/notifications': 'Notifications',
  '/emergency-contacts': 'Emergency Contacts',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/responder': 'Responder',
  '/admin': 'Admin'
}

export default function AppRoutes() {
  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route element={<AppLayout />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      {Object.entries(reserved).map(([path, title]) => <Route key={path} path={path} element={<ReservedPage title={title} />} />)}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Route>
  </Routes>
}
