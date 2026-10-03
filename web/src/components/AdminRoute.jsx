import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute() {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to={user?.role === 'responder' ? '/responder' : '/dashboard'} replace />
  }

  return <Outlet />
}
