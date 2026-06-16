import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const baseURL =
  (import.meta as ImportMeta & { env: Record<string, string> }).env
    .VITE_API_BASE_URL ?? '/api'

export const apiClient = axios.create({
  baseURL,
  withCredentials: true, // send httpOnly cookies automatically
})

// ---------------------------------------------------------------------------
// Request interceptor — attach bearer token
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ---------------------------------------------------------------------------
// Response interceptor — transparent 401 → refresh → retry
// ---------------------------------------------------------------------------
let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token!)
    }
  })
  pendingQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return apiClient(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post<{ access_token: string }>(
        `${baseURL}/v1/auth/refresh`,
        {},
        { withCredentials: true },
      )
      const newToken = data.access_token
      const currentUser = useAuthStore.getState().user
      if (currentUser) {
        useAuthStore.getState().setAuth(currentUser, newToken)
      }
      apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`
      processQueue(null, newToken)
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default apiClient
