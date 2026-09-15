import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

// Read base URL from env or default to relative /api for transparent Vite proxy
export const API_BASE = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api'

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: Attach Bearer Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('railopt_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Auto-Refresh Token on 401
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // If 401 Unauthorized and not already retried
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // If the 401 was from the refresh or login endpoint itself, trigger logout immediately
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error)
      }

      const refreshToken = localStorage.getItem('railopt_refresh_token')
      if (!refreshToken) {
        // No refresh token available, force logout
        handleForceLogout()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {
          refresh_token: refreshToken,
        })

        const { access_token, refresh_token: newRefresh } = refreshResponse.data

        localStorage.setItem('railopt_token', access_token)
        if (newRefresh) {
          localStorage.setItem('railopt_refresh_token', newRefresh)
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${access_token}`
        originalRequest.headers.Authorization = `Bearer ${access_token}`

        processQueue(null, access_token)
        return apiClient(originalRequest)
      } catch (refreshErr) {
        processQueue(refreshErr as AxiosError, null)
        handleForceLogout()
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export function handleForceLogout() {
  localStorage.removeItem('railopt_token')
  localStorage.removeItem('railopt_refresh_token')
  localStorage.removeItem('railopt_user')
  window.dispatchEvent(new Event('railopt_logout'))
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}
