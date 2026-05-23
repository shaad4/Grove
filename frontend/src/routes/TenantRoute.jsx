import {
  Navigate,
} from 'react-router-dom'

import {
  getSubdomain,
} from '../utils/domain'

import {
  useAuth,
} from '../context/AuthContext'

export default function TenantRoute({ children }) {

  const {
    tenant,
    loading,
    isAuth,
  } = useAuth()

  const subdomain = getSubdomain()

  if (loading) {
    return null
  }

  // not authenticated
  if (!isAuth) {
    if (subdomain) {
      window.location.replace(`http://${subdomain}.lvh.me:5173/client-login`)
      return null
    }
    return <Navigate to="/login" replace />
  }

  if (!tenant?.slug) {
    return (
      <Navigate
        to="/setup-workspace"
        replace
      />
    )
  }

 
  if (tenant.slug !== subdomain) {
    window.location.replace(
      `http://${tenant.slug}.lvh.me:5173${window.location.pathname}`
    )
    return null
  }

  return children
}