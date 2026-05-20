import {
  Navigate,
} from 'react-router-dom'

import {
  getSubdomain,
} from '../utils/domain'

import {
  useAuth,
} from '../context/AuthContext'

export default function TenantRoute({
  children,
}) {

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
    // client context → client login
    if (subdomain) {
      window.location.replace(`http://${subdomain}.lvh.me:5173/client-login`)
      return null
    }
    // provider context → provider login
    return <Navigate to="/login" replace />
  }

  // no workspace yet
  if (!tenant?.slug) {
    return (
      <Navigate
        to="/setup-workspace"
        replace
      />
    )
  }

  // subdomain missing or wrong — redirect inline, no effect needed.
  // using window.location.pathname preserves the current path
  // so /requests, /clients etc. all redirect correctly, not just /dashboard
  if (tenant.slug !== subdomain) {
    window.location.replace(
      `http://${tenant.slug}.lvh.me:5173${window.location.pathname}`
    )
    return null
  }

  return children
}