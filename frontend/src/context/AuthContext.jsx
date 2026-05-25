import { createContext, useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  setCredentials,
  setMemberships,
  clearAuth,
  selectCurrentUser,
  selectTenant,
  selectIsAuth,
} from '../features/auth/authSlice'
import { authApi } from '../api/auth.api'
import { getSubdomain } from '../utils/domain'

const SKIP_RESTORE_PATHS = ['/accept-invite', '/client-login']

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const dispatch = useDispatch()

  const user   = useSelector(selectCurrentUser)
  const tenant = useSelector(selectTenant)
  const isAuth = useSelector(selectIsAuth)

  const [loading, setLoading] = useState(true)

  const saveSession = ({ accessToken, user, tenant }) => {
    dispatch(setCredentials({ accessToken, user, tenant }))
  }

  const logout = async () => {
    try { await authApi.logout() } catch (_) {}

    const role      = user?.role
    const subdomain = getSubdomain()

    dispatch(clearAuth())

    const destination = role === 'client' && subdomain
      ? `http://${subdomain}.lvh.me:5173/client-login`
      : `http://lvh.me:5173/login`

    window.location.href = destination
  }

  useEffect(() => {
    const restore = async () => {
        if (SKIP_RESTORE_PATHS.includes(window.location.pathname)) {
            setLoading(false)
            return
        }
        
        dispatch(clearAuth())

        try {
            
            const refreshRes  = await authApi.refreshToken()
            const accessToken = refreshRes.data.access

            const meRes = await authApi.me(accessToken)

            dispatch(setCredentials({
            accessToken,
            user:   meRes.data.user,
            tenant: meRes.data.tenant,
            }))
            

            try {
                const membershipsRes = await authApi.getMemberships(accessToken)
                dispatch(setMemberships(membershipsRes.data))
            } catch (_) {}

        } catch {
            dispatch(clearAuth())
        } finally {
            setLoading(false)
        }
    }

    restore()
  }, [dispatch])

  return (
    <AuthContext.Provider value={{
      user,
      tenant,
      isAuth,
      loading,
      saveSession,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)