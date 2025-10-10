<template>
  <div id="app">
    <Navbar />
    <main>
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script>
import { onMounted, onUnmounted, watch, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'

export default {
  name: 'App',
  setup() {
    const authStore = useAuthStore()
    const route = useRoute()

    // Global cleanup function for animated backgrounds
    const cleanupAnimatedBackgrounds = () => {
      // Remove any existing animated background elements
      const existingBackground = document.querySelector('.animated-background')
      if (existingBackground) {
        existingBackground.remove()
      }
      
      // Remove any floating elements from other pages
      const floatingElements = document.querySelectorAll('.floating-icon, .floating-study-element, .floating-elements')
      floatingElements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element)
        }
      })
      
      // Remove any background elements from login/register pages
      const backgroundElements = document.querySelectorAll('.login-background-elements, .register-background-elements')
      backgroundElements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element)
        }
      })
      
      // Aggressive cleanup: Remove any elements containing emojis that shouldn't be on certain pages
      const emojiElements = document.querySelectorAll('*')
      emojiElements.forEach(element => {
        if (element.textContent && /[📚✏️🧮📝🎓💡🔬📖❓🌍]/.test(element.textContent)) {
          // Check if this element is a floating background element
          if (element.classList.contains('floating-icon') || 
              element.classList.contains('floating-study-element') ||
              element.parentElement?.classList.contains('login-background-elements') ||
              element.parentElement?.classList.contains('register-background-elements') ||
              element.parentElement?.classList.contains('animated-background')) {
            if (element.parentNode) {
              element.parentNode.removeChild(element)
            }
          }
        }
      })
    }

    onMounted(() => {
      // Initialize auth state from localStorage
      authStore.initializeAuth()

      // Clean up any existing background elements on app start
      // But only if we're not on the Home page
      if (route.name !== 'Home') {
        cleanupAnimatedBackgrounds()
      }
    })

    // Watch for route changes and clean up backgrounds when leaving pages
    watch(route, (to, from) => {
      // Clean up backgrounds when navigating away from pages that might have them
      // But don't clean up if going TO the Home page (it needs its background)
      if ((from.name === 'Home' || from.name === 'Login' || from.name === 'Register') && to.name !== 'Home') {
        // Small delay to ensure the new page has loaded
        setTimeout(() => {
          cleanupAnimatedBackgrounds()
        }, 100)
      }

      // Additional cleanup for specific page transitions
      // Remove emojis from pages that shouldn't have them
      if (to.name === 'Dashboard' || to.name === 'Messages' || to.name === 'SearchTutors') {
        setTimeout(() => {
          cleanupAnimatedBackgrounds()
        }, 200)
      }
    })

    onUnmounted(() => {
      // Final cleanup when app is unmounted
      cleanupAnimatedBackgrounds()
    })

    return {}
  }
}
</script>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
  padding-top: 80px; /* Account for fixed navbar */
}
</style>
