import {
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react'

import { useDispatch, useSelector } from 'react-redux'

import {
    setCredentials,
    clearAuth,
    selectCurrentUser,
    selectTenant,
    selectIsAuth,
} from '../features/auth/authSlice'

import { authApi } from '../api/auth.api'
import { getSubdomain } from '../utils/domain'
import { store } from '../app/store'

const AuthContext = createContext(null)

const SKIP_RESTORE_PATHS = ['/client-login', '/accept-invite']

export function AuthProvider({ children }) {

    const dispatch = useDispatch()
    const [loading, setLoading] = useState(true)

    const user   = useSelector(selectCurrentUser)
    const tenant = useSelector(selectTenant)
    const isAuth = useSelector(selectIsAuth)
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const saveSession = ({ accessToken, user, tenant }) => {
        dispatch(setCredentials({ accessToken, user, tenant }))
    }

    const logout = async () => {
        try { await authApi.logout() } catch (_) {}

        const currentUser = selectCurrentUser(store.getState())
        const role = currentUser?.role
        const subdomain = getSubdomain()


        let destination
        if (role === 'client' && subdomain ) {
            destination = `http://${subdomain}.lvh.me:5173/client-login`
        } else {
            destination = `http://lvh.me:5173/login`
        }


        setIsLoggingOut(true)
        dispatch(clearAuth())
        window.location.href = destination
                
    }

    useEffect(() => {

        const restoreSession = async () => {
            console.log('restoreSession: path =', window.location.pathname)
            console.log('restoreSession: subdomain =', getSubdomain())


            if (SKIP_RESTORE_PATHS.includes(window.location.pathname)) {
                console.log('restoreSession: skipping (pre-auth path)')
                setLoading(false)
                return
            }

            try {
                console.log('restoreSession: calling refresh...')
                const refreshRes = await authApi.refreshToken()
                console.log('restoreSession: refresh response =', refreshRes.data)


                const accessToken = refreshRes.data.access

                dispatch(setCredentials({
                    accessToken,
                    user: null,
                    tenant: null,
                }))

                const meRes = await authApi.me()
                console.log('restoreSession: me response =', meRes.data)

                dispatch(setCredentials({
                    accessToken,
                    user: meRes.data.user,
                    tenant: meRes.data.tenant,
                }))

            } catch (err) {
                console.log('restoreSession: FAILED')
                console.log('restoreSession: raw error =', err)
                console.log('restoreSession: status =', err?.response?.status)
                console.log('restoreSession: data =', err?.response?.data)
                dispatch(clearAuth())
            } finally {
                setLoading(false)
            }
        }

        restoreSession()

    }, [dispatch])

    return (
        <AuthContext.Provider value={{
            user,
            tenant,
            isAuth,
            saveSession,
            logout,
            loading,
            isLoggingOut,
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)