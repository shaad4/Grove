import api from './client'

export const authApi = {
  signup:       (data)  => api.post('/auth/register/', data),
  login:        (data)  => api.post('/auth/login/', data),
  logout:       ()      => api.post('/auth/logout/'),
  refreshToken: ()      => api.post('/auth/token/refresh/'),
  verifyEmail:  (token) => api.post('/auth/verify-email/', { token }),
  checkSlug: (slug) => api.get(`/auth/check-slug/?slug=${slug}`),
  setupWorkspace: (data) => api.post('/auth/setup-workspace/', data),
  forgotPassword: (email) => api.post('/auth/forgot-password/',{email}),
  resetPassword: (token, password) => api.post('/auth/reset-password/', {token, password}),
  me: () => api.get('/auth/me/'),
  listClients: () => api.get('/clients/'),
  addClient: (data)   => api.post('/clients/', data),
  validateInviteToken: (token)  => api.get(`/clients/invite/validate/?token=${token}`),
  acceptInvite: (data)   => api.post('/clients/invite/accept/', data),
  clientLogin: (data, config)   => api.post('/clients/login/', data, config),
  checkTenantSlug : (slug) => api.get(`/tenants/validate/?slug=${slug}`)


}

