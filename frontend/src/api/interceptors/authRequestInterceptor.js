import { selectAccessToken, selectTenant } from '../../features/auth/authSlice'

export const authRequestInterceptor = (_store, config) => {
  if (!_store) return config

  const state = _store.getState()

  const token = selectAccessToken(state)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const tenantSlug = selectTenant(state)?.slug
  if (tenantSlug) {
    config.headers['X-Tenant-Slug'] = tenantSlug
  }

  return config
}