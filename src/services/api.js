import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Token auto-renewal setup
let refreshTokenTimeout = null

const setupTokenRefresh = (expiresIn) => {
  // Clear existing timeout
  if (refreshTokenTimeout) {
    clearTimeout(refreshTokenTimeout)
  }

  // Set timeout to refresh token 1 minute before expiration
  const refreshTime = (expiresIn - 60) * 1000 // Convert to milliseconds

  refreshTokenTimeout = setTimeout(async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.data.success) {
          localStorage.setItem('token', response.data.data.token)
          localStorage.setItem('user', JSON.stringify(response.data.data.user))
          setupTokenRefresh(response.data.data.expires_in)
        }
      }
      } catch (error) {
        console.error('Token refresh failed:', error)
        // If refresh fails, logout user
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('audit_session_id')
        window.location.href = '/login'
      }
  }, refreshTime)
}

// Generate audit session ID (UUID v4) for tracking activities within a user session
function getOrCreateAuditSessionId() {
  let id = localStorage.getItem('audit_session_id')
  if (!id && typeof crypto !== 'undefined' && crypto.randomUUID) {
    id = crypto.randomUUID()
    localStorage.setItem('audit_session_id', id)
  }
  return id || null
}

// Request interceptor to add token and X-Session-ID for audit tracking
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    const sessionId = getOrCreateAuditSessionId()
    if (sessionId) {
      config.headers['X-Session-ID'] = sessionId
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // If token expired and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const token = localStorage.getItem('token')
        if (token) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (response.data.success) {
            localStorage.setItem('token', response.data.data.token)
            localStorage.setItem('user', JSON.stringify(response.data.data.user))
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${response.data.data.token}`
            return api(originalRequest)
          }
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('audit_session_id')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => {
    return api.post('/auth/login', data).then((response) => {
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.data.user))
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          localStorage.setItem('audit_session_id', crypto.randomUUID())
        }
        setupTokenRefresh(response.data.data.expires_in)
      }
      return response
    })
  },
  logout: () => {
    return api.post('/auth/logout').finally(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('audit_session_id')
      if (refreshTokenTimeout) {
        clearTimeout(refreshTokenTimeout)
      }
    })
  },
  me: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
}

// IP Address API (gateway routes /api/ip-addresses -> IP management service)
export const ipAddressAPI = {
  getAll: () => api.get('/ip-addresses'),
  getOne: (id) => api.get(`/ip-addresses/${id}`),
  create: (data) => api.post('/ip-addresses', data),
  update: (id, data) => api.put(`/ip-addresses/${id}`, data),
  delete: (id) => api.delete(`/ip-addresses/${id}`),
}

// Audit Log API (gateway routes /api/audit-logs -> IP management service)
export const auditLogAPI = {
  getAll: (params) => api.get('/audit-logs', { params }),
  getDashboard: () => api.get('/audit-logs/dashboard'),
  getIpAddressLogs: (ipId, params = {}) => api.get(`/audit-logs/ip-address/${ipId}`, { params }),
  getUserLogs: (userId, params = {}) => api.get(`/audit-logs/user/${userId}`, { params }),
  getSessionLogs: (sessionId) => api.get(`/audit-logs/session/${sessionId}`),
}

/** Current audit session ID (for “Use my session” in Audit Dashboard). */
export { getOrCreateAuditSessionId }

export default api
