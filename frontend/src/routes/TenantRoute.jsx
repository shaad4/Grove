import {
  Navigate,
} from 'react-router-dom'

import {
  useEffect,
} from 'react'

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

  const subdomain =
    getSubdomain()

  // redirect safely
  useEffect(() => {

    if (
      tenant?.slug &&
      subdomain &&
      tenant.slug !== subdomain
    ) {

      window.location.replace(
        `http://${tenant.slug}.lvh.me:5173/dashboard`
      )
    }

  }, [tenant, subdomain])

  if (loading) {
    return null
  }

  // not authenticated
  if (!isAuth) {

    return (
      <Navigate
        to="/login"
        replace
      />
    )
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

  // waiting for redirect
  if (
    tenant.slug !== subdomain
  ) {
    return null
  }

  return children
}