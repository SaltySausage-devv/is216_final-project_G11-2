<template>
  <div class="login-page min-vh-100 d-flex align-items-center position-relative" style="background: #1a1a1a !important;">
    <!-- Animated Background Elements -->
    <div class="login-background-elements">
      <div class="floating-icon floating-icon-1">📚</div>
      <div class="floating-icon floating-icon-2">✏️</div>
      <div class="floating-icon floating-icon-3">🧮</div>
      <div class="floating-icon floating-icon-4">📝</div>
      <div class="floating-icon floating-icon-5">🎓</div>
      <div class="floating-icon floating-icon-6">💡</div>
      <div class="floating-icon floating-icon-7">🔬</div>
      <div class="floating-icon floating-icon-8">📖</div>
    </div>

    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-5 col-md-7">
          <!-- Login Card with Cyberpunk Styling -->
          <div 
            ref="loginCard"
            class="cyberpunk-login-card"
          >
            <div class="card-body p-5">
              <!-- Header with Animation -->
              <div ref="loginHeader" class="text-center mb-4">
                <div ref="logoIcon" class="cyberpunk-logo-icon">
                  <i class="fas fa-graduation-cap"></i>
                </div>
                <h2 ref="welcomeText" class="cyberpunk-welcome-text">Welcome Back</h2>
                <p ref="subtitleText" class="cyberpunk-subtitle">Sign in to your OnlyTutor account</p>
              </div>

              <form @submit.prevent="handleLogin">
                <!-- Email Field with Animation -->
                <div ref="emailField" class="mb-4">
                  <label for="email" class="cyberpunk-label">Email Address</label>
                  <div class="cyberpunk-input-group">
                    <span class="cyberpunk-input-icon">
                      <i class="fas fa-envelope"></i>
                    </span>
                    <input
                      type="email"
                      id="email"
                      v-model="form.email"
                      class="cyberpunk-input"
                      :class="{ 'cyberpunk-input-error': errors.email }"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div v-if="errors.email" class="cyberpunk-error-message">
                    {{ errors.email }}
                  </div>
                </div>

                <!-- Password Field with Animation -->
                <div ref="passwordField" class="mb-4">
                  <label for="password" class="cyberpunk-label">Password</label>
                  <div class="cyberpunk-input-group">
                    <span class="cyberpunk-input-icon">
                      <i class="fas fa-lock"></i>
                    </span>
                    <input
                      :type="showPassword ? 'text' : 'password'"
                      id="password"
                      v-model="form.password"
                      class="cyberpunk-input"
                      :class="{ 'cyberpunk-input-error': errors.password }"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      class="cyberpunk-toggle-btn"
                      @click="showPassword = !showPassword"
                    >
                      <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                    </button>
                  </div>
                  <div v-if="errors.password" class="cyberpunk-error-message">
                    {{ errors.password }}
                  </div>
                </div>

                <!-- Remember Me with Animation -->
                <div ref="rememberField" class="mb-4">
                  <div class="cyberpunk-checkbox-group">
                    <input
                      type="checkbox"
                      id="remember"
                      v-model="form.remember"
                      class="cyberpunk-checkbox"
                    />
                    <label for="remember" class="cyberpunk-checkbox-label">
                      Remember me
                    </label>
                  </div>
                </div>

                <!-- Error Alert with Animation -->
                <div v-if="error" ref="errorAlert" class="cyberpunk-alert">
                  <i class="fas fa-exclamation-circle me-2"></i>
                  {{ error }}
                </div>

                <!-- Submit Button with Animation -->
                <button
                  ref="submitButton"
                  type="submit"
                  class="cyberpunk-submit-btn"
                  :disabled="isLoading"
                >
                  <span v-if="isLoading" class="cyberpunk-spinner me-2"></span>
                  <i v-else class="fas fa-sign-in-alt me-2"></i>
                  {{ isLoading ? 'Signing In...' : 'SIGN IN' }}
                </button>

                <!-- Sign Up Link with Animation -->
                <div ref="signupLink" class="text-center mt-4">
                  <p class="cyberpunk-signup-text">
                    Don't have an account? 
                    <router-link to="/register" class="cyberpunk-link">
                      Sign up here
                    </router-link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { createTimeline, animate, createAnimatable, utils } from 'animejs'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()

    // Template refs for animations
    const loginCard = ref(null)
    const loginHeader = ref(null)
    const logoIcon = ref(null)
    const welcomeText = ref(null)
    const subtitleText = ref(null)
    const emailField = ref(null)
    const passwordField = ref(null)
    const rememberField = ref(null)
    const submitButton = ref(null)
    const signupLink = ref(null)
    const errorAlert = ref(null)

    const form = reactive({
      email: '',
      password: '',
      remember: false
    })

    const errors = ref({})
    const error = ref('')
    const isLoading = ref(false)
    const showPassword = ref(false)

    // Advanced Anime.js v4 Login Page Animations
    const initLoginAnimations = async () => {
      await nextTick()
      
      // Create main timeline with advanced settings
      loginTimeline = createTimeline({
        defaults: { 
          duration: 800,
          ease: 'out(3)',
          frameRate: 60
        },
        playbackRate: 1,
        onBegin: (self) => {
          console.log('Login animations started', self.id)
          // Add visual feedback for animation start
          if (loginCard.value) {
            loginCard.value.style.borderColor = 'var(--cyber-orange)'
          }
        },
        onComplete: (self) => {
          console.log('Login animations completed', self.id)
          // Reset visual feedback
          if (loginCard.value) {
            loginCard.value.style.borderColor = 'var(--cyber-orange)'
          }
          // Reset logo to original state
          if (logoIcon.value) {
            logoIcon.value.style.transform = 'none'
            logoIcon.value.style.filter = 'none'
          }
        },
        onBeforeUpdate: (self) => {
          // Pre-frame processing for performance
          if (self.progress > 0.5 && loginCard.value) {
            // Add subtle glow effect at 50% progress
            loginCard.value.style.boxShadow = '0 0 40px rgba(255, 140, 66, 0.4)'
          }
        },
        onUpdate: (self) => {
          // Real-time progress monitoring
          if (self.progress > 0.8 && welcomeText.value) {
            // Add text glow at 80% progress
            welcomeText.value.style.textShadow = '0 0 20px rgba(255, 140, 66, 0.8)'
          }
        },
        onRender: (self) => {
          // Screen rendering callbacks
          if (self.currentTime > 400 && logoIcon.value) {
            // Add subtle glow effect during rendering
            logoIcon.value.style.filter = 'brightness(1.1)'
          }
        }
      })

      // Background floating elements with advanced animations
      const floatingElements = document.querySelectorAll('.floating-icon')
      floatingElements.forEach((element, index) => {
        // Create individual timeline for each floating element
        const elementTimeline = createTimeline({
          loop: true,
          alternate: true,
          playbackRate: 0.5 + (index * 0.1),
          onLoop: (self) => {
            // Add subtle color variation on each loop
            element.style.color = `hsl(${(index * 45) % 360}, 70%, 60%)`
          }
        })
        
        elementTimeline
          .add(element, {
            y: [0, -30, 0],
            rotate: [0, 10, -10, 0],
            opacity: [0.4, 1, 0.4],
            scale: [1, 1.2, 1],
            filter: ['blur(0px)', 'blur(2px)', 'blur(0px)']
          }, 0)
          .add(element, {
            x: [0, 20, 0],
            rotateZ: [0, 360, 0]
          }, 0)
      })

      // Login card entrance with 3D effects
      if (loginCard.value) {
        loginTimeline
          .label('card-entrance', 0)
          .add(loginCard.value, {
            opacity: [0, 1],
            y: [100, 0],
            scale: [0.8, 1],
            rotateX: [30, 0],
            rotateY: [15, 0],
            filter: ['blur(10px)', 'blur(0px)'],
            boxShadow: [
              '0 0 0 rgba(255, 140, 66, 0)',
              '0 0 50px rgba(255, 140, 66, 0.5)'
            ]
          }, 'card-entrance')
      }

      // Header elements with staggered 3D animations
      if (logoIcon.value) {
        loginTimeline
          .label('logo-animation', 200)
          .add(logoIcon.value, {
            scale: [0, 1.2, 1],
            opacity: [0, 1],
            filter: ['blur(5px)', 'blur(0px)']
          }, 'logo-animation')
      }

      if (welcomeText.value) {
        loginTimeline
          .add(welcomeText.value, {
            y: [50, 0],
            opacity: [0, 1],
            scale: [0.9, 1],
            rotateX: [20, 0],
            textShadow: [
              '0 0 0 rgba(255, 140, 66, 0)',
              '0 0 20px rgba(255, 140, 66, 0.8)'
            ]
          }, 'logo-animation += 200')
      }

      if (subtitleText.value) {
        loginTimeline
          .add(subtitleText.value, {
            y: [30, 0],
            opacity: [0, 1],
            scale: [0.95, 1],
            rotateX: [10, 0]
          }, 'logo-animation += 400')
      }

      // Form fields with advanced staggered animations
      if (emailField.value) {
        loginTimeline
          .label('form-animation', 600)
          .add(emailField.value, {
            x: [-100, 0],
            opacity: [0, 1],
            scale: [0.9, 1],
            rotateY: [-15, 0],
            filter: ['blur(3px)', 'blur(0px)']
          }, 'form-animation')
      }

      if (passwordField.value) {
        loginTimeline
          .add(passwordField.value, {
            x: [-100, 0],
            opacity: [0, 1],
            scale: [0.9, 1],
            rotateY: [-15, 0],
            filter: ['blur(3px)', 'blur(0px)']
          }, 'form-animation += 200')
      }

      if (rememberField.value) {
        loginTimeline
          .add(rememberField.value, {
            x: [-50, 0],
            opacity: [0, 1],
            scale: [0.95, 1],
            rotateX: [-10, 0]
          }, 'form-animation += 400')
      }

      if (submitButton.value) {
        loginTimeline
          .add(submitButton.value, {
            y: [50, 0],
            opacity: [0, 1],
            scale: [0.8, 1],
            rotateX: [20, 0],
            filter: ['blur(5px)', 'blur(0px)'],
            boxShadow: [
              '0 0 0 rgba(255, 140, 66, 0)',
              '0 0 30px rgba(255, 140, 66, 0.4)'
            ]
          }, 'form-animation += 600')
      }

      if (signupLink.value) {
        loginTimeline
          .add(signupLink.value, {
            y: [30, 0],
            opacity: [0, 1],
            scale: [0.95, 1],
            rotateX: [10, 0]
          }, 'form-animation += 800')
      }

      // Advanced input focus animations with timeline
      const inputs = document.querySelectorAll('.cyberpunk-input')
      inputs.forEach((input, index) => {
        const inputTimeline = createTimeline({
          defaults: { duration: 400, ease: 'out(2)' }
        })

        input.addEventListener('focus', () => {
          inputTimeline
            .add(input, {
              scale: [1, 1.03],
              boxShadow: [
                '0 0 0 rgba(255, 140, 66, 0)',
                '0 0 25px rgba(255, 140, 66, 0.4)'
              ],
              borderColor: [
                'rgba(255, 140, 66, 0.3)',
                'rgba(255, 140, 66, 1)'
              ]
            }, 0)
            .add(input.parentElement, {
              scale: [1, 1.01],
            }, 0)
        })

        input.addEventListener('blur', () => {
          inputTimeline
            .add(input, {
              scale: [1.03, 1],
              boxShadow: [
                '0 0 25px rgba(255, 140, 66, 0.4)',
                '0 0 0 rgba(255, 140, 66, 0)'
              ],
              borderColor: [
                'rgba(255, 140, 66, 1)',
                'rgba(255, 140, 66, 0.3)'
              ]
            }, 0)
            .add(input.parentElement, {
              scale: [1.01, 1],
            }, 0)
        })
      })

      // Advanced button interactions with multiple timelines
      if (submitButton.value) {
        const buttonHoverTimeline = createTimeline({
          defaults: { duration: 300, ease: 'out(2)' }
        })
        
        const buttonClickTimeline = createTimeline({
          defaults: { duration: 150, ease: 'out(4)' }
        })

        submitButton.value.addEventListener('mouseenter', () => {
          buttonHoverTimeline
            .add(submitButton.value, {
              scale: [1, 1.08],
              boxShadow: [
                '0 0 0 rgba(255, 140, 66, 0)',
                '0 0 35px rgba(255, 140, 66, 0.6)'
              ],
              rotateX: [0, -5]
            }, 0)
            .add(submitButton.value, {
              y: [0, -3]
            }, 0)
        })

        submitButton.value.addEventListener('mouseleave', () => {
          buttonHoverTimeline
            .add(submitButton.value, {
              scale: [1.08, 1],
              boxShadow: [
                '0 0 35px rgba(255, 140, 66, 0.6)',
                '0 0 0 rgba(255, 140, 66, 0)'
              ],
              rotateX: [-5, 0]
            }, 0)
            .add(submitButton.value, {
              y: [-3, 0]
            }, 0)
        })

        submitButton.value.addEventListener('mousedown', () => {
          buttonClickTimeline
            .add(submitButton.value, {
              scale: [1.08, 0.95],
              rotateX: [-5, 5],
            }, 0)
        })

        submitButton.value.addEventListener('mouseup', () => {
          buttonClickTimeline
            .add(submitButton.value, {
              scale: [0.95, 1.08],
              rotateX: [5, -5]
            }, 0)
        })
      }

      // Add continuous subtle animations for cyberpunk feel
      const continuousTimeline = createTimeline({
        loop: true,
        alternate: true,
        playbackRate: 0.3
      })

      if (loginCard.value) {
        continuousTimeline
          .add(loginCard.value, {
            boxShadow: [
              '0 0 30px rgba(255, 140, 66, 0.3)',
              '0 0 50px rgba(255, 140, 66, 0.5)'
            ]
          }, 0)
      }

      // Create Animatable instances for interactive effects
      if (logoIcon.value) {
        logoAnimatable = createAnimatable(logoIcon.value, {
          x: { duration: 300, ease: 'out(2)' },
          y: { duration: 300, ease: 'out(2)' },
          scale: { duration: 200, ease: 'out(3)' },
          rotate: { duration: 400, ease: 'out(2)' }
        })
      }

      if (loginCard.value) {
        cardAnimatable = createAnimatable(loginCard.value, {
          x: { duration: 200, ease: 'out(2)' },
          y: { duration: 200, ease: 'out(2)' },
          rotateX: { duration: 300, ease: 'out(2)' },
          rotateY: { duration: 300, ease: 'out(2)' },
          scale: { duration: 150, ease: 'out(3)' }
        })
      }

      // Create animatable instances for floating elements
      const floatingElementsForAnimatable = document.querySelectorAll('.floating-icon')
      floatingElementsForAnimatable.forEach((element, index) => {
        const animatable = createAnimatable(element, {
          x: { duration: 200 + (index * 50), ease: 'out(2)' },
          y: { duration: 200 + (index * 50), ease: 'out(2)' },
          scale: { duration: 150, ease: 'out(3)' },
          rotate: { duration: 300, ease: 'out(2)' }
        })
        floatingAnimatables.push(animatable)
      })
    }

    // Advanced Error animation with timeline
    const animateError = () => {
      if (errorAlert.value) {
        const errorTimeline = createTimeline({
          defaults: { duration: 200, ease: 'out(2)' }
        })
        
        errorTimeline
          .add(errorAlert.value, {
            x: [-20, 20, -15, 15, -10, 10, 0],
            opacity: [0, 1],
            scale: [0.8, 1.1, 1],
            rotateZ: [-5, 5, -3, 3, 0],
            filter: ['blur(3px)', 'blur(0px)'],
            boxShadow: [
              '0 0 0 rgba(239, 68, 68, 0)',
              '0 0 20px rgba(239, 68, 68, 0.6)'
            ]
          }, 0)
          .add(errorAlert.value, {
            y: [0, -5, 0]
          }, 0)
      }
    }

    const validateForm = () => {
      errors.value = {}
      
      if (!form.email) {
        errors.value.email = 'Email is required'
      } else if (!/\S+@\S+\.\S+/.test(form.email)) {
        errors.value.email = 'Please enter a valid email'
      }

      if (!form.password) {
        errors.value.password = 'Password is required'
      } else if (form.password.length < 6) {
        errors.value.password = 'Password must be at least 6 characters'
      }

      return Object.keys(errors.value).length === 0
    }

    const handleLogin = async () => {
      if (!validateForm()) {
        animateError()
        return
      }

      isLoading.value = true
      error.value = ''

      // Advanced loading animation for button
      if (submitButton.value) {
        const loadingTimeline = createTimeline({
          loop: true,
          playbackRate: 1.5
        })
        
        loadingTimeline
          .add(submitButton.value, {
            scale: [1, 0.95, 1],
            rotateX: [0, 5, 0],
            boxShadow: [
              '0 0 20px rgba(255, 140, 66, 0.3)',
              '0 0 30px rgba(255, 140, 66, 0.5)',
              '0 0 20px rgba(255, 140, 66, 0.3)'
            ]
          }, 0)
          .add(submitButton.value, {
            y: [0, -2, 0]
          }, 0)
      }

      try {
        const result = await authStore.login(form.email, form.password)
        
        if (result.success) {
          // Advanced success animation with promise-based chaining
          if (loginCard.value) {
            const successTimeline = createTimeline({
              defaults: { duration: 300, ease: 'out(3)' },
              onBegin: (self) => {
                console.log('Success animation started', self.id)
                // Add success visual feedback
                loginCard.value.style.borderColor = 'var(--cyber-yellow)'
              },
              onComplete: (self) => {
                console.log('Success animation completed', self.id)
                // Reset visual feedback
                loginCard.value.style.borderColor = 'var(--cyber-orange)'
              }
            })
            
            successTimeline
              .add(loginCard.value, {
                scale: [1, 1.1, 0.7],
                opacity: [1, 1, 0],
                rotateY: [0, 15, 90],
                rotateX: [0, 10, 45],
                filter: ['blur(0px)', 'blur(2px)', 'blur(10px)'],
                boxShadow: [
                  '0 0 30px rgba(255, 140, 66, 0.3)',
                  '0 0 50px rgba(255, 140, 66, 0.8)',
                  '0 0 0 rgba(255, 140, 66, 0)'
                ]
              }, 0)
              .add(loginCard.value, {
                y: [0, -20, 50]
              }, 0)
            
            // Use promise-based chaining for navigation
            successTimeline.then(() => {
              console.log('Success animation promise resolved')
              router.push('/dashboard')
            })
          } else {
            // Fallback if no login card
            setTimeout(() => {
              router.push('/dashboard')
            }, 800)
          }
        } else {
          error.value = result.error
          animateError()
        }
      } catch (err) {
        error.value = 'An unexpected error occurred. Please try again.'
        animateError()
      } finally {
        isLoading.value = false
      }
    }

    // Dynamic speed control for animations
    let loginTimeline = null
    
    // Animatable instances for interactive animations
    let logoAnimatable = null
    let cardAnimatable = null
    let floatingAnimatables = []
    
    const adjustAnimationSpeed = (speed) => {
      if (loginTimeline) {
        loginTimeline.speed = speed
        console.log(`Animation speed set to: ${speed}x`)
      }
    }

    // Add keyboard controls for animation speed
    const handleKeyPress = (event) => {
      switch(event.key) {
        case '1':
          adjustAnimationSpeed(0.5) // Slow
          break
        case '2':
          adjustAnimationSpeed(1.0) // Normal
          break
        case '3':
          adjustAnimationSpeed(2.0) // Fast
          break
        case 'p':
          if (loginTimeline) {
            loginTimeline.paused ? loginTimeline.resume() : loginTimeline.pause()
            console.log(`Animation ${loginTimeline.paused ? 'paused' : 'resumed'}`)
          }
          break
      }
    }

    // Interactive mouse movement handlers
    const handleMouseMove = (event) => {
      const { clientX, clientY } = event
      const { innerWidth, innerHeight } = window
      
      // Calculate normalized mouse position (-1 to 1)
      const mouseX = (clientX / innerWidth) * 2 - 1
      const mouseY = (clientY / innerHeight) * 2 - 1
      
      // Logo interactive animation
      if (logoAnimatable) {
        const logoX = mouseX * 10 // Move logo slightly with mouse
        const logoY = mouseY * 5
        const logoScale = 1 + (Math.abs(mouseX) + Math.abs(mouseY)) * 0.1
        const logoRotate = mouseX * 5
        
        logoAnimatable.x(logoX).y(logoY).scale(logoScale).rotate(logoRotate)
      }
      
      // Card interactive animation
      if (cardAnimatable) {
        const cardX = mouseX * 5
        const cardY = mouseY * 3
        const cardRotateX = mouseY * 2
        const cardRotateY = mouseX * 3
        const cardScale = 1 + (Math.abs(mouseX) + Math.abs(mouseY)) * 0.05
        
        cardAnimatable.x(cardX).y(cardY).rotateX(cardRotateX).rotateY(cardRotateY).scale(cardScale)
      }
      
      // Floating elements interactive animation
      floatingAnimatables.forEach((animatable, index) => {
        const intensity = 0.5 + (index * 0.1)
        const elementX = mouseX * (10 + index * 2)
        const elementY = mouseY * (8 + index * 1.5)
        const elementScale = 1 + (Math.abs(mouseX) + Math.abs(mouseY)) * (0.05 + index * 0.01)
        const elementRotate = mouseX * (3 + index)
        
        animatable.x(elementX).y(elementY).scale(elementScale).rotate(elementRotate)
      })
    }

    // Mouse leave handler to reset animations
    const handleMouseLeave = () => {
      if (logoAnimatable) {
        logoAnimatable.x(0).y(0).scale(1).rotate(0)
      }
      if (cardAnimatable) {
        cardAnimatable.x(0).y(0).rotateX(0).rotateY(0).scale(1)
      }
      floatingAnimatables.forEach(animatable => {
        animatable.x(0).y(0).scale(1).rotate(0)
      })
    }

    onMounted(() => {
      initLoginAnimations()

      // Add keyboard event listener for speed control
      document.addEventListener('keydown', handleKeyPress)

      // Add mouse event listeners for interactive animations
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseleave', handleMouseLeave)

      // Add speed control instructions
      console.log('Animation Speed Controls:')
      console.log('Press 1 for slow (0.5x)')
      console.log('Press 2 for normal (1.0x)')
      console.log('Press 3 for fast (2.0x)')
      console.log('Press P to pause/resume')
      console.log('Move your mouse to see interactive animations!')
    })

    onUnmounted(() => {
      // Clean up event listeners
      document.removeEventListener('keydown', handleKeyPress)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      
      // Clean up floating elements
      const floatingElements = document.querySelectorAll('.floating-icon')
      floatingElements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element)
        }
      })
      
      // Clean up background elements
      const backgroundElements = document.querySelector('.login-background-elements')
      if (backgroundElements && backgroundElements.parentNode) {
        backgroundElements.parentNode.removeChild(backgroundElements)
      }
    })

    return {
      // Template refs
      loginCard,
      loginHeader,
      logoIcon,
      welcomeText,
      subtitleText,
      emailField,
      passwordField,
      rememberField,
      submitButton,
      signupLink,
      errorAlert,
      // Form data
      form,
      errors,
      error,
      isLoading,
      showPassword,
      handleLogin
    }
  }
}
</script>

<style scoped>
/* Login Page Cyberpunk Styling */
.login-page {
  background: #1a1a1a !important;
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  width: 100vw;
  height: 100vh;
  color-scheme: dark;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Force dark background on all elements */
.login-page * {
  background: transparent !important;
}

/* Override any white backgrounds */
.login-page .container,
.login-page .row,
.login-page .col-lg-5,
.login-page .col-md-7 {
  background: transparent !important;
}

/* Ensure body and html are dark */
body, html {
  background: #1a1a1a !important;
}

/* Override any global styles that might cause white backgrounds */
.login-page .card,
.login-page .card-body,
.login-page .form-control,
.login-page .input-group,
.login-page .input-group-text {
  background: transparent !important;
}

/* Force dark theme on all Bootstrap elements */
.login-page .container-fluid,
.login-page .container,
.login-page .row,
.login-page [class*="col-"] {
  background: transparent !important;
}

/* Ensure no white backgrounds from any framework */
.login-page * {
  background-color: transparent !important;
}

/* Only allow specific elements to have backgrounds */
.login-page .cyberpunk-login-card {
  background: rgba(26, 26, 26, 0.95) !important;
}

.login-page .cyberpunk-input-group {
  background: rgba(42, 42, 42, 0.8) !important;
}

/* Global override for login page to prevent white backgrounds */
:global(.login-page),
:global(.login-page *),
:global(body),
:global(html) {
  background: #1a1a1a !important;
  color-scheme: dark !important;
  filter: none !important;
  -webkit-filter: none !important;
}

/* Override any potential white backgrounds from global styles */
:global(.container),
:global(.row),
:global([class*="col-"]) {
  background: transparent !important;
}

/* Animated Background Elements */
.login-background-elements {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.floating-icon {
  position: absolute;
  font-size: 2rem;
  opacity: 0.6;
  color: var(--cyber-orange);
  text-shadow: 0 0 10px rgba(255, 140, 66, 0.3);
  animation: float 6s ease-in-out infinite;
}

.floating-icon-1 { top: 10%; left: 10%; animation-delay: 0s; }
.floating-icon-2 { top: 20%; right: 15%; animation-delay: 1s; }
.floating-icon-3 { top: 60%; left: 5%; animation-delay: 2s; }
.floating-icon-4 { top: 70%; right: 10%; animation-delay: 3s; }
.floating-icon-5 { top: 30%; left: 20%; animation-delay: 4s; }
.floating-icon-6 { top: 80%; right: 20%; animation-delay: 5s; }
.floating-icon-7 { top: 40%; right: 5%; animation-delay: 6s; }
.floating-icon-8 { top: 15%; left: 30%; animation-delay: 7s; }

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

/* Cyberpunk Login Card */
.cyberpunk-login-card {
  background: rgba(26, 26, 26, 0.95);
  border: 2px solid var(--cyber-orange);
  border-radius: 20px;
  box-shadow: 
    0 0 30px rgba(255, 140, 66, 0.3),
    0 0 60px rgba(255, 140, 66, 0.1),
    inset 0 0 20px rgba(255, 140, 66, 0.1);
  position: relative;
  z-index: 10;
  overflow: hidden;
}

.cyberpunk-login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, 
    rgba(255, 140, 66, 0.1) 0%, 
    transparent 50%, 
    rgba(255, 210, 63, 0.1) 100%);
  pointer-events: none;
}

/* Cyberpunk Logo Icon */
.cyberpunk-logo-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(45deg, var(--cyber-orange), var(--cyber-yellow));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 25px rgba(255, 140, 66, 0.5);
  border: 3px solid var(--cyber-orange);
}

.cyberpunk-logo-icon i {
  font-size: 2.5rem;
  color: white;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

/* Cyberpunk Text Styles */
.cyberpunk-welcome-text {
  color: var(--cyber-text);
  font-weight: bold;
  font-size: 2.5rem;
  text-shadow: 0 0 15px rgba(255, 140, 66, 0.5);
  letter-spacing: 2px;
  margin-bottom: 10px;
}

.cyberpunk-subtitle {
  color: var(--cyber-text-muted);
  font-size: 1.1rem;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

/* Cyberpunk Form Elements */
.cyberpunk-label {
  color: var(--cyber-text);
  font-weight: 600;
  font-size: 1rem;
  text-shadow: 0 0 5px rgba(255, 140, 66, 0.3);
  margin-bottom: 8px;
  display: block;
}

.cyberpunk-input-group {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(42, 42, 42, 0.8);
  border: 2px solid var(--cyber-grey-light);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.cyberpunk-input-group:focus-within {
  border-color: var(--cyber-orange);
  box-shadow: 0 0 20px rgba(255, 140, 66, 0.3);
  background: rgba(42, 42, 42, 0.9);
}

.cyberpunk-input-icon {
  padding: 15px;
  background: rgba(255, 140, 66, 0.1);
  color: var(--cyber-orange);
  border-right: 1px solid var(--cyber-grey-light);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;
}

.cyberpunk-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--cyber-text);
  padding: 15px;
  font-size: 1rem;
  outline: none;
  font-family: 'Courier New', monospace;
}

.cyberpunk-input::placeholder {
  color: var(--cyber-text-dim);
}

.cyberpunk-input:focus {
  outline: none;
}

.cyberpunk-input-error {
  border-color: #ef4444 !important;
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.3) !important;
}

.cyberpunk-toggle-btn {
  background: rgba(255, 140, 66, 0.1);
  border: none;
  color: var(--cyber-orange);
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 1px solid var(--cyber-grey-light);
}

.cyberpunk-toggle-btn:hover {
  background: rgba(255, 140, 66, 0.2);
  color: var(--cyber-yellow);
}

/* Cyberpunk Checkbox */
.cyberpunk-checkbox-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cyberpunk-checkbox {
  width: 20px;
  height: 20px;
  background: rgba(42, 42, 42, 0.8);
  border: 2px solid var(--cyber-grey-light);
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
}

.cyberpunk-checkbox:checked {
  background: var(--cyber-orange);
  border-color: var(--cyber-orange);
  box-shadow: 0 0 10px rgba(255, 140, 66, 0.3);
}

.cyberpunk-checkbox:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
  font-size: 12px;
}

.cyberpunk-checkbox-label {
  color: var(--cyber-text-muted);
  cursor: pointer;
  font-size: 0.95rem;
  user-select: none;
}

/* Cyberpunk Submit Button */
.cyberpunk-submit-btn {
  width: 100%;
  background: linear-gradient(45deg, var(--cyber-orange), var(--cyber-yellow));
  border: 2px solid var(--cyber-orange);
  color: white;
  padding: 18px;
  font-size: 1.1rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(255, 140, 66, 0.3);
  position: relative;
  overflow: hidden;
}

.cyberpunk-submit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.cyberpunk-submit-btn:hover::before {
  left: 100%;
}

.cyberpunk-submit-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 0 30px rgba(255, 140, 66, 0.5);
  border-color: var(--cyber-yellow);
}

.cyberpunk-submit-btn:disabled {
  opacity: 0.7;
  transform: none;
  cursor: not-allowed;
}

/* Cyberpunk Success Alert */
.cyberpunk-success-alert {
  background: rgba(34, 197, 94, 0.1);
  border: 2px solid #22c55e;
  color: #22c55e;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-shadow: 0 0 5px rgba(34, 197, 94, 0.3);
  box-shadow: 0 0 15px rgba(34, 197, 94, 0.2);
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Cyberpunk Alert */
.cyberpunk-alert {
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid #ef4444;
  color: #ef4444;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-shadow: 0 0 5px rgba(239, 68, 68, 0.3);
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.2);
}

/* Cyberpunk Error Message */
.cyberpunk-error-message {
  color: #ef4444;
  font-size: 0.9rem;
  margin-top: 5px;
  text-shadow: 0 0 5px rgba(239, 68, 68, 0.3);
}

/* Cyberpunk Signup Link */
.cyberpunk-signup-text {
  color: var(--cyber-text-muted);
  font-size: 1rem;
  margin: 0;
}

.cyberpunk-link {
  color: var(--cyber-orange);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  text-shadow: 0 0 5px rgba(255, 140, 66, 0.3);
}

.cyberpunk-link:hover {
  color: var(--cyber-yellow);
  text-shadow: 0 0 10px rgba(255, 210, 63, 0.5);
  text-decoration: none;
}

/* Cyberpunk Spinner */
.cyberpunk-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .cyberpunk-login-card {
    margin: 20px;
    border-radius: 15px;
  }
  
  .cyberpunk-welcome-text {
    font-size: 2rem;
  }
  
  .floating-icon {
    font-size: 1.5rem;
  }
  
  .cyberpunk-logo-icon {
    width: 60px;
    height: 60px;
  }
  
  .cyberpunk-logo-icon i {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .cyberpunk-login-card {
    margin: 10px;
  }
  
  .cyberpunk-welcome-text {
    font-size: 1.8rem;
  }
  
  .cyberpunk-submit-btn {
    padding: 15px;
    font-size: 1rem;
  }
}
</style>
