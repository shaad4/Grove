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
  useNavigate,
} from 'react-router-dom'

import {
  setCredentials,
  clearAuth,
  selectCurrentUser,
  selectTenant,
  selectIsAuth,
} from '../features/auth/authSlice'

import { authApi } from '../api/auth.api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {

  const dispatch = useDispatch()
  const navigate = useNavigate()

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

    navigate('/login')
  }

  // SILENT AUTH RESTORE
  useEffect(() => {

    const restoreSession = async () => {

      try {



        // uses refresh cookie automatically
        const refreshRes =
          await authApi.refreshToken()



        const accessToken =
        refreshRes.data.access

        // FIRST store token
        dispatch(setCredentials({
          accessToken,
          user: null,
          tenant: null,
        }))

        // THEN call /me/
        const meRes =
          await authApi.me()

        dispatch(setCredentials({
          accessToken,
          user: meRes.data.user,
          tenant: meRes.data.tenant,
        }))

      } catch (err) {


        dispatch(clearAuth())

      } finally {

        setLoading(false)
      }
    }

    restoreSession()

  }, [dispatch])

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
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)