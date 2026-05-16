import { createContext, useContext } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setCredentials, clearAuth, selectCurrentUser, selectTenant, selectIsAuth } from '../features/auth/authSlice'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const user   = useSelector(selectCurrentUser)
  const tenant = useSelector(selectTenant)
  const isAuth = useSelector(selectIsAuth)

  const saveSession = ({ accessToken, user, tenant }) => {
    dispatch(setCredentials({ accessToken, user, tenant }))
  }

  const logout = async () => {
    try { await api.post('/auth/logout/') } catch (_) {}
    dispatch(clearAuth())
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, tenant, isAuth, saveSession, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)