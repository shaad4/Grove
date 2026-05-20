import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import {
  useDispatch,
  useSelector,
} from 'react-redux'

import {
  setCredentials,
  clearAuth,
  selectCurrentUser,
  selectTenant,
  selectIsAuth,
} from '../features/auth/authSlice'

import { authApi } from '../api/auth.api'

const AuthContext = createContext(null)

// Pages where we skip silent restore entirely —
// these are pre-auth flows with no session to restore
const SKIP_RESTORE_PATHS = [
  '/client-login',
  '/accept-invite',
]

export function AuthProvider({ children }) {

  const dispatch = useDispatch()

  const [loading, setLoading] = useState(true)

  const user   = useSelector(selectCurrentUser)
  const tenant = useSelector(selectTenant)
  const isAuth = useSelector(selectIsAuth)

  const saveSession = ({
    accessToken,
    user,
    tenant,
  }) => {
    dispatch(setCredentials({
      accessToken,
      user,
      tenant,
    }))
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (_) {}

    dispatch(clearAuth())

    window.location.replace('http://lvh.me:5173/login')
  }

  // SILENT AUTH RESTORE
  useEffect(() => {

    const restoreSession = async () => {

      // Skip restore on pre-auth pages — no cookie exists yet
      // and a failed refresh would just clear state unnecessarily
      if (SKIP_RESTORE_PATHS.includes(window.location.pathname)) {
        setLoading(false)
        return
      }

      try {
        // Sends httpOnly refresh cookie automatically via withCredentials
        const refreshRes = await authApi.refreshToken()
        const accessToken = refreshRes.data.access

        // Store token first so the /me/ request has auth
        dispatch(setCredentials({
          accessToken,
          user: null,
          tenant: null,
        }))

        // Then hydrate user + tenant
        const meRes = await authApi.me()

        dispatch(setCredentials({
          accessToken,
          user: meRes.data.user,
          tenant: meRes.data.tenant,
        }))

      } catch (err) {
        // Refresh failed — no valid session, clear everything
        dispatch(clearAuth())

      } finally {
        setLoading(false)
      }
    }

    restoreSession()

  }, [dispatch])

  // Render children immediately — route guards handle
  // the loading state themselves via `if (loading) return null`
  // Blocking here causes a full blank screen on every page load
  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        isAuth,
        saveSession,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)