import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { MotionPlugin } from '@vueuse/motion'
import App from './App.vue'
import './style.css'

// Import pages
import Home from './pages/Home.vue'
import Login from './pages/Login.vue'
import Register from './pages/Register.vue'
import ForgotPassword from './pages/ForgotPassword.vue'
import ResetPassword from './pages/ResetPassword.vue'
import Dashboard from './pages/Dashboard.vue'
import SearchTutors from './pages/SearchTutors.vue'
import TutorProfile from './pages/TutorProfile.vue'
import Chat from './pages/Chat.vue'
import Booking from './pages/Booking.vue'
import Messages from './pages/Messages.vue'
import Analytics from './pages/Analytics.vue'
import Profile from './pages/Profile.vue'
import Gamification from './pages/Gamification.vue'

// Import components
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/forgot-password', name: 'ForgotPassword', component: ForgotPassword },
  { path: '/reset-password', name: 'ResetPassword', component: ResetPassword },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard },
  { path: '/search', name: 'SearchTutors', component: SearchTutors },
  { path: '/tutor/:id', name: 'TutorProfile', component: TutorProfile },
  { path: '/chat/:tutorId', name: 'Chat', component: Chat },
  { path: '/booking/:id', name: 'Booking', component: Booking },
  { path: '/messages', name: 'Messages', component: Messages },
  { path: '/analytics', name: 'Analytics', component: Analytics },
  { path: '/profile', name: 'Profile', component: Profile },
  { path: '/gamification', name: 'Gamification', component: Gamification },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// No navigation guards needed

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(MotionPlugin)

// Global components
app.component('Navbar', Navbar)
app.component('Footer', Footer)

app.mount('#app')
