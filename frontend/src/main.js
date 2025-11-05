import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { MotionPlugin } from '@vueuse/motion'
import App from './App.vue'
import './style.css'
import { useAuthStore } from './stores/auth'
import { getApiUrl } from './utils/api-helper'

// Global fetch wrapper for production backend URLs
const originalFetch = window.fetch
window.fetch = function(url, options) {
  // Rewrite /api/ URLs to full backend URLs in production
  if (typeof url === 'string' && url.startsWith('/api/')) {
    console.log('🌐 FETCH: Intercepting URL:', url)
    url = getApiUrl(url)
    console.log('🌐 FETCH: Rewritten to:', url)
  }
  return originalFetch(url, options)
}

// Import pages
import Home from './pages/Home.vue'
import Login from './pages/Login.vue'
import Register from './pages/Register.vue'
import ForgotPassword from './pages/ForgotPassword.vue'
import ResetPassword from './pages/ResetPassword.vue'
import Dashboard from './pages/Dashboard.vue'
import SearchTutors from './pages/SearchTutors.vue'
import TutorProfile from './pages/TutorProfile.vue'
import Messages from './pages/Messages.vue'
import Calendar from './pages/Calendar.vue'
import Profile from './pages/Profile.vue'
import Analytics from './pages/Analytics.vue'

// Import components
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/login', name: 'Login', component: Login, meta: { requiresGuest: true } },
  { path: '/register', name: 'Register', component: Register, meta: { requiresGuest: true } },
  { path: '/forgot-password', name: 'ForgotPassword', component: ForgotPassword },
  { path: '/reset-password', name: 'ResetPassword', component: ResetPassword },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/search', name: 'SearchTutors', component: SearchTutors },
  { path: '/tutor/:id', name: 'TutorProfile', component: TutorProfile },
  { path: '/messages', name: 'Messages', component: Messages, meta: { requiresAuth: true } },
  { path: '/chat/:id', name: 'Chat', component: Messages, meta: { requiresAuth: true } },
  { path: '/calendar', name: 'Calendar', component: Calendar, meta: { requiresAuth: true } },
  { path: '/profile', name: 'Profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/analytics', name: 'Analytics', component: Analytics, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // If there's a saved position (e.g., back button), restore it
    if (savedPosition) {
      return savedPosition
    }
    // If navigating to a hash anchor, scroll to it
    if (to.hash) {
      return { el: to.hash }
    }
    // For /messages route, prevent scrolling on refresh/navigation
    if (to.path === '/messages' || to.path.startsWith('/chat/')) {
      return { top: 0, left: 0 }
    }
    // Otherwise, scroll to top - return a promise to ensure DOM is ready
    return new Promise((resolve) => {
      // Use nextTick to ensure the new route component is rendered
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
        resolve({ top: 0, left: 0 })
      }, 50)
    })
  }
})

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(MotionPlugin)

// Global components
app.component('Navbar', Navbar)
app.component('Footer', Footer)

app.mount('#app')

// Initialize auth store after app is mounted
const authStore = useAuthStore()
console.log('🚀 App mounted, initializing auth store...')

// Initialize auth and set up navigation guards after initialization
let authInitialized = false

authStore.initializeAuth().then(() => {
  authInitialized = true
  console.log('✅ Auth initialization complete, guards are now active')
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  console.log('🛣️ Navigation:', from.path, '→', to.path)

  // Wait for auth initialization on first navigation
  if (!authInitialized) {
    console.log('⏳ Waiting for auth initialization...')
    await authStore.initializeAuth()
    authInitialized = true
    console.log('✅ Auth initialized')
  }

  const isAuthenticated = authStore.isAuthenticated

  console.log('🔐 Auth check:', {
    isAuthenticated,
    hasSession: !!authStore.session,
    hasUser: !!authStore.user,
    requiresAuth: to.meta.requiresAuth,
    requiresGuest: to.meta.requiresGuest
  })

  // Check if route requires authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('❌ Access denied: requires authentication')
    console.log('🔀 Redirecting to /login')
    next('/login')
  }
  // Check if route requires guest (logged out)
  else if (to.meta.requiresGuest && isAuthenticated) {
    console.log('❌ Access denied: already authenticated')
    console.log('🔀 Redirecting to /dashboard')
    next('/dashboard')
  }
  // Allow navigation
  else {
    console.log('✅ Access granted')
    next()
  }
})
