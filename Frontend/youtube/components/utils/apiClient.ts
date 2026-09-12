import axios from 'axios'
import { useAuthStore } from '@/store/auth.store'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle token refresh automatically
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login/') &&
      !originalRequest.url?.includes('/auth/register/') &&
      !originalRequest.url?.includes('/auth/refresh/')
    ) {
      originalRequest._retry = true
      try {
        const refreshToken = useAuthStore.getState().refreshToken
        if (refreshToken) {
          const res = await axios.post(`${API_URL}/api/auth/refresh/`, { refresh: refreshToken })
          const access = res.data.access
          
          const user = useAuthStore.getState().user
          if (user) {
            useAuthStore.getState().setAuth(user, access)
          }
          
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`
          }
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // Refresh token failed/expired — log user out
        useAuthStore.getState().clearAuth()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }

    if (error.response?.status === 429) {
      const headers = error.response.headers || {}
      const retryAfter = headers['retry-after'] || headers['Retry-After']
      const serverMsg = error.response?.data?.error?.message || error.response?.data?.detail
      const message =
        serverMsg && !String(serverMsg).toLowerCase().includes('request was throttled')
          ? serverMsg
          : retryAfter
            ? `You're making requests too fast. Please wait ${retryAfter} seconds before trying again.`
            : `You've reached the request rate limit. Please wait a moment before trying again.`

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('app:toast', {
            detail: { type: 'warning', message, duration: 6000 },
          })
        )
      }
    }

    return Promise.reject(error)
  }
)
