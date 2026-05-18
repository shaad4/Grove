// src/hooks/useRestoreSession.js

import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setCredentials, clearAuth } from '../features/auth/authSlice'
import api from '../api/client'

export function useRestoreSession() {
  const dispatch = useDispatch()

  useEffect(() => {
    const restore = async () => {
      try {
        const { data: refreshData } = await api.post('/auth/token/refresh/')

        const { data: profileData } = await api.get('/auth/me/', {
          headers: { Authorization: `Bearer ${refreshData.access}` }
        })

        const user = profileData.user

        dispatch(setCredentials({
          accessToken: refreshData.access,
          user,
          tenant: user.tenantId
            ? { id: user.tenantId, slug: user.tenantSlug }
            : null,
        }))

      } catch {
        dispatch(clearAuth())
      }
    }

    restore()
  }, [dispatch])
}