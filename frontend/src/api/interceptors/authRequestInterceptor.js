import { selectAccessToken } from '../../features/auth/authSlice'

export const authRequestInterceptor = (_store, config) => {
  // _store might not be injected yet during app boot — guard it
  if (!_store) return config

  const token = selectAccessToken(_store.getState())
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
}