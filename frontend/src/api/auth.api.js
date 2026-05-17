import api from './client'

export const authApi = {
  signup:       (data)  => api.post('/auth/register/', data),
  login:        (data)  => api.post('/auth/login/', data),
  logout:       ()      => api.post('/auth/logout/'),
  refreshToken: ()      => api.post('/auth/token/refresh/'),
  verifyEmail:  (token) => api.post('/auth/verify-email/', { token }),
  checkSlug: (slug) => api.get(`/auth/check-slug/?slug=${slug}`),
  setupWorkspace: (data) => api.post('/auth/setup-workspace/', data),
  
}