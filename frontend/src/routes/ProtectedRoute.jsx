import { Navigate, Outlet } from 'react-router-dom'
import { getSubdomain } from '../utils/domain'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute() {
  const { isAuth, loading } = useAuth()

  if (loading) return null

  if (!isAuth) {
    if (getSubdomain()) {
      window.location.replace('http://lvh.me:5173/login')
      return null
    }
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

// Guards /setup-workspace:
// - not logged in → login
// - logged in + workspace exists → dashboard
// - logged in + no workspace → allow through
export function SetupRoute() {
  const { isAuth, tenant, loading } = useAuth()

  if (loading) return null

  if (!isAuth) {
    if (getSubdomain()) {
      window.location.replace('http://lvh.me:5173/login')
      return null
    }
    return <Navigate to="/login" replace />
  }

  if (tenant?.slug) {
    window.location.replace(`http://${tenant.slug}.lvh.me:5173/dashboard`)
    return null
  }

  return <Outlet />
}

export function GuestRoute() {
  const { isAuth, tenant, loading } = useAuth()

  if (loading) return null

  if (isAuth && !tenant?.slug) {
    return <Navigate to="/setup-workspace" replace />
  }

  if (isAuth && tenant?.slug) {
    window.location.replace(`http://${tenant.slug}.lvh.me:5173/dashboard`)
    return null
  }

  return <Outlet />
}