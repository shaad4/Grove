import {
  Navigate,
  Outlet,
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

export function ProtectedRoute() {

  const {
    isAuth,
  } = useAuth()

  return isAuth
    ? <Outlet />
    : <Navigate to="/login" replace />
}

export function GuestRoute() {

  const {
    isAuth,
    tenant,
  } = useAuth()

  // authenticated but onboarding incomplete
  if (isAuth && !tenant) {
    return (
      <Navigate
        to="/setup-workspace"
        replace
      />
    )
  }

  // fully onboarded
  if (isAuth && tenant) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }

  return <Outlet />
}