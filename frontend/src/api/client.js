import axios from 'axios'
import applyCaseMiddleware from 'axios-case-converter'
import { authRequestInterceptor }  from './interceptors/authRequestInterceptor'
import { authResponseInterceptor } from './interceptors/authResponseInterceptor'

// Store reference — injected after store is created, never imported directly
let _store
export const injectStore = (store) => { _store = store }

const api = applyCaseMiddleware(
  axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,  // sends httpOnly refresh_token cookie automatically
  })
)

api.interceptors.request.use(
  (config) => authRequestInterceptor(_store, config)
)

api.interceptors.response.use(
  (response) => response,
  (error) => authResponseInterceptor(_store, api, error)
)

export default api