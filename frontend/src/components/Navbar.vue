<template>
  <nav class="navbar navbar-expand-lg navbar-dark cyberpunk-navbar fixed-top shadow-sm">
    <div class="container">
      <router-link to="/" class="navbar-brand d-flex align-items-center">
        <i class="fas fa-graduation-cap me-2" style="color: var(--cyber-orange);"></i>
        <span class="fw-bold">OnlyTutor</span>
      </router-link>

      <button 
        class="navbar-toggler cyberpunk-hamburger" 
        type="button" 
        data-bs-toggle="collapse" 
        data-bs-target="#navbarNav"
        @click="toggleNavbar"
        :aria-expanded="isNavbarExpanded"
        aria-controls="navbarNav" 
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" :class="{ show: isNavbarExpanded }" id="navbarNav">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <router-link to="/search" class="nav-link">
              <i class="fas fa-search me-1"></i>
              Find Tutors
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/dashboard" class="nav-link" v-if="isAuthenticated">
              <i class="fas fa-tachometer-alt me-1"></i>
              Dashboard
            </router-link>
          </li>
        </ul>

        <ul class="navbar-nav">
          <li class="nav-item" v-if="!isAuthenticated">
            <router-link to="/login" class="nav-link">
              <i class="fas fa-sign-in-alt me-1"></i>
              Login
            </router-link>
          </li>
          <li class="nav-item" v-if="!isAuthenticated">
            <router-link to="/register" class="nav-link">
              <i class="fas fa-user-plus me-1"></i>
              Sign Up
            </router-link>
          </li>
          
          <li class="nav-item dropdown" v-if="isAuthenticated">
            <a 
              class="nav-link dropdown-toggle d-flex align-items-center" 
              href="#" 
              role="button" 
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i class="fas fa-user-circle me-2"></i>
              {{ user?.firstName }}
            </a>
            <ul class="dropdown-menu">
              <li>
                <router-link to="/profile" class="dropdown-item">
                  <i class="fas fa-user me-2"></i>
                  Profile
                </router-link>
              </li>
              <li>
                <router-link to="/messages" class="dropdown-item">
                  <i class="fas fa-envelope me-2"></i>
                  Messages
                </router-link>
              </li>
              <li v-if="userType === 'tutor' || userType === 'centre'">
                <router-link to="/analytics" class="dropdown-item">
                  <i class="fas fa-chart-bar me-2"></i>
                  Analytics
                </router-link>
              </li>
              <li><hr class="dropdown-divider"></li>
              <li>
                <a href="#" @click="logout" class="dropdown-item text-danger">
                  <i class="fas fa-sign-out-alt me-2"></i>
                  Logout
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { animate, stagger, spring } from 'animejs'

export default {
  name: 'Navbar',
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()
    const isNavbarExpanded = ref(false)

    const isAuthenticated = computed(() => authStore.isAuthenticated)
    const user = computed(() => authStore.user)
    const userType = computed(() => authStore.userType)

    const logout = async () => {
      await authStore.logout()
      router.push('/')
    }

    // Custom toggle function as fallback
    const toggleNavbar = () => {
      isNavbarExpanded.value = !isNavbarExpanded.value
      const navbarCollapse = document.getElementById('navbarNav')
      if (navbarCollapse) {
        if (isNavbarExpanded.value) {
          navbarCollapse.classList.add('show')
        } else {
          navbarCollapse.classList.remove('show')
        }
      }
    }

    onMounted(() => {
      // Advanced navbar brand animation with keyframes
      animate('.navbar-brand', {
        keyframes: [
          { scale: 0.5, opacity: 0, rotate: -180, ease: 'outExpo', duration: 0 },
          { scale: 1.1, opacity: 1, rotate: 10, ease: 'outBack', duration: 400 },
          { scale: 1, rotate: 0, ease: spring({ bounce: 0.4 }), duration: 300 }
        ],
        duration: 700
      })

      // Advanced nav links with complex staggered animation
      animate('.nav-link', {
        keyframes: [
          { y: -30, opacity: 0, scale: 0.8, ease: 'outExpo', duration: 0 },
          { y: 0, opacity: 1, scale: 1.05, ease: 'outBack', duration: 400 },
          { scale: 1, ease: 'outElastic', duration: 200 }
        ],
        delay: stagger(150, { start: 200 }),
        duration: 600
      })

      // Setup interactive navbar animations
      setupNavbarInteractions()
    })

    const setupNavbarInteractions = () => {
      // Nav link hover effects
      const navLinks = document.querySelectorAll('.nav-link')
      navLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
          animate(link, {
            scale: 1.1,
            y: -3,
            rotate: 2,
            duration: 200,
            ease: 'outBack'
          })
        })

        link.addEventListener('mouseleave', () => {
          animate(link, {
            scale: 1,
            y: 0,
            rotate: 0,
            duration: 200,
            ease: 'outBack'
          })
        })
      })

      // Button advanced hover effects
      const buttons = document.querySelectorAll('.btn')
      buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
          animate(button, {
            keyframes: [
              { scale: 1.05, y: -2, ease: 'outBack', duration: 150 },
              { scale: 1.1, y: -5, ease: 'outElastic', duration: 100 }
            ],
            duration: 250
          })
        })

        button.addEventListener('mouseleave', () => {
          animate(button, {
            scale: 1,
            y: 0,
            duration: 200,
            ease: 'outBack'
          })
        })
      })

      // Brand logo continuous subtle animation
      const brand = document.querySelector('.navbar-brand')
      if (brand) {
        animate(brand, {
          keyframes: [
            { rotate: 0, scale: 1, ease: 'inOutSine', duration: 2000 },
            { rotate: 2, scale: 1.02, ease: 'inOutSine', duration: 2000 },
            { rotate: 0, scale: 1, ease: 'inOutSine', duration: 2000 }
          ],
          loop: true,
          duration: 6000
        })
      }
    }

    return {
      isAuthenticated,
      user,
      userType,
      logout,
      toggleNavbar,
      isNavbarExpanded
    }
  }
}
</script>

<style scoped>
.navbar-brand {
  font-size: 1.5rem;
  color: var(--cyber-text) !important;
  text-decoration: none;
  text-shadow: var(--cyber-glow-faint);
}

.navbar-brand:hover {
  color: var(--cyber-orange) !important;
  text-shadow: var(--cyber-glow);
}

.nav-link {
  font-weight: 500;
  color: var(--cyber-text-muted) !important;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: var(--cyber-orange) !important;
}

.nav-link.router-link-active {
  color: var(--cyber-orange) !important;
}

.dropdown-menu {
  background: var(--cyber-grey) !important;
  border: 1px solid var(--cyber-orange) !important;
  box-shadow: var(--cyber-glow) !important;
  border-radius: 8px;
  padding: 8px 0;
}

.dropdown-item {
  padding: 8px 16px;
  transition: all 0.3s ease;
  color: var(--cyber-text) !important;
}

.dropdown-item:hover {
  background-color: var(--cyber-grey-light) !important;
  color: var(--cyber-orange) !important;
}

/* Clean hamburger menu for all screen sizes */
.cyberpunk-hamburger {
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 4px;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05) !important;
  transition: all 0.3s ease;
}

.cyberpunk-hamburger:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.1);
}

.cyberpunk-hamburger .navbar-toggler-icon {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%28255, 255, 255, 0.8%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e") !important;
}

/* Fix for 744px and below - navbar positioning */
@media (max-width: 744px) {
  .navbar-brand {
    font-size: 1.3rem;
    margin-right: 0;
    padding-left: 1rem;
  }
  
  .navbar-brand i {
    font-size: 1.2rem;
  }
  
  /* Force navbar items to edges */
  .navbar .container {
    padding-left: 0;
    padding-right: 0;
    max-width: 100%;
    margin: 0;
  }
  
  .navbar-brand {
    margin-left: 0;
  }
  
  .navbar-toggler {
    margin-right: 0;
    padding-right: 1rem;
  }
  
  /* Ensure full width navbar */
  .navbar {
    padding-left: 0;
    padding-right: 0;
  }
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .navbar-brand {
    font-size: 1.3rem;
    margin-right: 1rem;
  }
  
  .navbar-brand i {
    font-size: 1.2rem;
  }
  
  .navbar-collapse {
    background: rgba(26, 26, 26, 0.7);
    border: 1px solid var(--cyber-orange);
    border-radius: 8px;
    margin-top: 1rem;
    padding: 1rem;
    box-shadow: 0 0 20px rgba(255, 140, 66, 0.3);
    backdrop-filter: blur(15px);
  }
  
  .navbar-nav {
    margin-top: 0;
    gap: 0.5rem;
  }
  
  .nav-item {
    margin-bottom: 0.5rem;
  }
  
  .nav-link {
    padding: 0.75rem 1rem;
    border-radius: 6px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    text-align: left;
    color: var(--cyber-text-muted) !important;
    font-weight: 500;
  }
  
  .nav-link:hover {
    background: rgba(255, 140, 66, 0.1);
    transform: translateX(5px);
    color: var(--cyber-orange) !important;
  }
  
  /* Removed mobile button styling - nav links now have consistent format */
  
  .dropdown-menu {
    position: static !important;
    transform: none !important;
    box-shadow: none !important;
    border: 1px solid var(--cyber-orange);
    background: rgba(26, 26, 26, 0.8);
    margin-top: 0.5rem;
  }
}

@media (max-width: 576px) {
  .navbar-brand {
    font-size: 1.1rem;
  }
  
  .navbar-brand i {
    font-size: 1rem;
  }
  
  .display-4 {
    font-size: 1.8rem;
  }
}
</style>
