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
    // Axios already combines baseURL + url internally
    // If url already starts with /api/, axios has already combined them
    // If url starts with / (but not /api/), we need to combine
    // Construct full path
    let fullPath = config.url
    
    // Check if URL already starts with /api/ (already combined by axios)
    if (config.url && config.url.startsWith('/api/')) {
      // URL already has /api/ prefix (axios combined it), use as-is
      fullPath = config.url
    } else if (config.baseURL && config.url) {
      // URL doesn't start with /api/, combine with baseURL
      if (config.url.startsWith('/')) {
        // URL starts with /, combine: /api + /analytics -> /api/analytics
        fullPath = config.baseURL + config.url
      } else {
        // URL is relative, combine with slash
        fullPath = (config.baseURL.endsWith('/') ? config.baseURL : config.baseURL + '/') + config.url
      }
    }
    
    console.log('🔧 API INTERCEPTOR:', {
      originalUrl: config.url,
      baseURL: config.baseURL,
      fullPath: fullPath,
      startsWithApi: fullPath && fullPath.startsWith('/api/')
    })
    
    // Rewrite URL for production (full backend URLs)
    if (fullPath && fullPath.startsWith('/api/')) {
      const newUrl = getApiUrl(fullPath)
      console.log('🔧 API INTERCEPTOR: Converting URL:', { from: fullPath, to: newUrl })
      config.url = newUrl
      config.baseURL = '' // Clear baseURL since we now have full URL
    } else {
      // Keep original URL if it doesn't start with /api/
      config.url = fullPath
    }
    
    // Add auth token
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    
    console.log('🔧 API INTERCEPTOR: Final config:', {
      url: config.url,
      baseURL: config.baseURL,
      hasAuth: !!config.headers.Authorization
    })
    
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
