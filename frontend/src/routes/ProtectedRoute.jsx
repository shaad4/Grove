import { Navigate, Outlet } from 'react-router-dom'
import { getSubdomain } from '../utils/domain'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute() {
    const { isAuth, loading, isLoggingOut } = useAuth()

    if (loading || isLoggingOut) return null  

    if (!isAuth) {
        const subdomain = getSubdomain()
        if (subdomain) {
            window.location.replace(`http://${subdomain}.lvh.me:5173/client-login`)
            return null
        }
        return <Navigate to="/login" replace />
    }

    return <Outlet />
}

export function SetupRoute() {
  const { isAuth, tenant, loading, isLoggingOut } = useAuth()  

  if (loading || isLoggingOut) return null 

  if (!isAuth) {
    const subdomain = getSubdomain()
    if (subdomain) {
    
      window.location.replace(`http://${subdomain}.lvh.me:5173/client-login`)
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
  const { isAuth, tenant, user, loading } = useAuth()

  if (loading) return null

  if (isAuth && user?.role === 'provider') {
    if (!tenant?.slug) {
      return <Navigate to="/setup-workspace" replace />
    }
    window.location.replace(`http://${tenant.slug}.lvh.me:5173/dashboard`)
    return null
  }

  if (isAuth && user?.role === 'client') {
    const subdomain = getSubdomain()
    window.location.replace(
      `http://${subdomain || tenant?.slug}.lvh.me:5173/dashboard`
    )
    return null
  }

  return <Outlet />
}