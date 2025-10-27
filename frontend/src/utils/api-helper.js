// API Helper - Constructs full URLs for backend services
// Works in both development (with Vite proxy) and production (Railway)

const API_SERVICES = {
  auth: import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:3001',
  users: import.meta.env.VITE_USERS_SERVICE_URL || 'http://localhost:3002',
  profiles: import.meta.env.VITE_PROFILES_SERVICE_URL || 'http://localhost:3003',
  bookings: import.meta.env.VITE_BOOKINGS_SERVICE_URL || 'http://localhost:3004',
  messaging: import.meta.env.VITE_MESSAGING_SERVICE_URL || 'http://localhost:3005',
  reviews: import.meta.env.VITE_REVIEWS_SERVICE_URL || 'http://localhost:3006',
  notifications: import.meta.env.VITE_NOTIFICATIONS_SERVICE_URL || 'http://localhost:3007',
  analytics: import.meta.env.VITE_ANALYTICS_SERVICE_URL || 'http://localhost:3008',
  calendar: import.meta.env.VITE_CALENDAR_SERVICE_URL || 'http://localhost:3011',
  maps: import.meta.env.VITE_MAPS_SERVICE_URL || 'http://localhost:3012'
}

// Check if we're in production (has VITE_ env vars set)
const isProduction = !!import.meta.env.VITE_AUTH_SERVICE_URL

/**
 * Get the full API URL for a service endpoint
 * @param {string} path - The API path (e.g., '/api/messaging/conversations')
 * @returns {string} - Full URL (e.g., 'https://messaging-production.up.railway.app/messaging/conversations')
 */
export function getApiUrl(path) {
  console.log('🔗 API Helper: Converting path:', path)
  console.log('🔗 isProduction:', isProduction)
  console.log('🔗 VITE_AUTH_SERVICE_URL:', import.meta.env.VITE_AUTH_SERVICE_URL)
  
  // In development, use relative paths (Vite proxy handles routing)
  if (!isProduction) {
    console.log('🔗 Development mode - returning original path')
    return path
  }

  // In production, construct full URL
  // Extract service name from path: /api/{service}/...
  const match = path.match(/^\/api\/([^\/]+)/)
  
  if (!match) {
    console.warn('❌ API path does not match expected format:', path)
    return path
  }

  const serviceName = match[1]
  const serviceUrl = API_SERVICES[serviceName]
  
  if (!serviceUrl) {
    console.warn('❌ Unknown service:', serviceName)
    return path
  }

  // Replace /api/{service} with the full service URL
  // /api/messaging/conversations -> https://messaging-xxx.railway.app/messaging/conversations
  const apiPath = path.replace('/api/', '/')
  const finalUrl = serviceUrl + apiPath.replace(`/${serviceName}`, `/${serviceName}`)
  console.log('🔗 Converted to:', finalUrl)
  return finalUrl
}

/**
 * Fetch wrapper that automatically uses correct URLs
 */
export async function apiFetch(path, options = {}) {
  const url = getApiUrl(path)
  return fetch(url, options)
}

export default {
  getApiUrl,
  apiFetch,
  services: API_SERVICES,
  isProduction
}

