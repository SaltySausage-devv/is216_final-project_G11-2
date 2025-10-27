import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import { getApiUrl } from '../utils/api-helper'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// Request interceptor to rewrite URLs for production and add auth token
api.interceptors.request.use(
  (config) => {
    // Construct full path (baseURL + url)
    const fullPath = config.baseURL && config.url ? config.baseURL + config.url : config.url
    
    // Rewrite URL for production (full backend URLs)
    if (fullPath && fullPath.startsWith('/api/')) {
      config.url = getApiUrl(fullPath)
      config.baseURL = '' // Clear baseURL since we now have full URL
    }
    
    // Add auth token
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
