import { setAccessToken, clearAuth } from '../../features/auth/authSlice'

// Queue of requests that came in while refresh was in-flight
let isRefreshing  = false
let pendingQueue  = []

const resolveQueue = (token) =>
  pendingQueue.forEach(({ resolve }) => resolve(token))

const rejectQueue = (error) =>
  pendingQueue.forEach(({ reject }) => reject(error))

export const authResponseInterceptor = async (_store, api, error) => {
  const original = error.config

  const is401          = error.response?.status === 401
  const isRetry        = original._retry
  const isRefreshCall  = original.url?.includes('/auth/token/refresh/')

  // Only attempt silent refresh on 401, once, and not on the refresh call itself
  if (!is401 || isRetry || isRefreshCall) {
    return Promise.reject(error)
  }

  // If refresh already in-flight, queue this request
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      pendingQueue.push({ resolve, reject })
    }).then((newToken) => {
      original.headers.Authorization = `Bearer ${newToken}`
      return api(original)
    })
  }

  // Start refresh
  original._retry  = true
  isRefreshing     = true

  try {
    // Browser sends httpOnly refresh_token cookie automatically (withCredentials: true)
    const { data } = await api.post('/auth/token/refresh/')
    const newToken = data.access

    _store.dispatch(setAccessToken(newToken))
    resolveQueue(newToken)

    original.headers.Authorization = `Bearer ${newToken}`
    return api(original)

  } catch (refreshError) {
    rejectQueue(refreshError)
    _store.dispatch(clearAuth())
    window.location.replace('http://lvh.me:5173/login')  
    return Promise.reject(refreshError)

  } finally {
    isRefreshing  = false
    pendingQueue  = []
  }
}