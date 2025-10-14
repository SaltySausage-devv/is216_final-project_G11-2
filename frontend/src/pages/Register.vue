<template>
  <div class="register-page min-vh-100 position-relative py-4" style="background: #1a1a1a !important;">
    <!-- Animated Background Elements -->
    <div class="register-background-elements">
      <div class="floating-icon floating-icon-1">🎓</div>
      <div class="floating-icon floating-icon-2">📚</div>
      <div class="floating-icon floating-icon-3">✏️</div>
      <div class="floating-icon floating-icon-4">🧮</div>
      <div class="floating-icon floating-icon-5">📝</div>
      <div class="floating-icon floating-icon-6">💡</div>
      <div class="floating-icon floating-icon-7">🔬</div>
      <div class="floating-icon floating-icon-8">📖</div>
    </div>

    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-5 col-md-7 col-sm-10">
          <div
            ref="registerCard"
            class="cyberpunk-register-card border-0 shadow-lg"
          >
            <div class="card-body p-3">
              <div class="text-center mb-3">
                <div 
                  ref="logoIcon"
                  class="cyberpunk-logo-icon"
                >
                  <i class="fas fa-graduation-cap"></i>
                </div>
                <h2 
                  ref="welcomeText"
                  class="cyberpunk-welcome-text"
                >
                  Join OnlyTutor
                </h2>
                <p 
                  ref="subtitleText"
                  class="cyberpunk-subtitle"
                >
                  Create your account to get started
                </p>
              </div>

              <form @submit.prevent="handleRegister">
                <div class="mb-3">
                  <label for="firstName" class="cyberpunk-label">First Name</label>
                  <div class="cyberpunk-input-group">
                    <div class="cyberpunk-input-icon">
                      <i class="fas fa-user"></i>
                    </div>
                    <input
                      ref="firstNameField"
                      type="text"
                      id="firstName"
                      v-model="form.firstName"
                      class="cyberpunk-input"
                      :class="{ 'is-invalid': errors.firstName }"
                      placeholder="Enter your first name"
                      required
                    />
                  </div>
                  <div v-if="errors.firstName" class="cyberpunk-error-message">
                    {{ errors.firstName }}
                  </div>
                </div>

                <div class="mb-3">
                  <label for="lastName" class="cyberpunk-label">Last Name</label>
                  <div class="cyberpunk-input-group">
                    <div class="cyberpunk-input-icon">
                      <i class="fas fa-user"></i>
                    </div>
                    <input
                      ref="lastNameField"
                      type="text"
                      id="lastName"
                      v-model="form.lastName"
                      class="cyberpunk-input"
                      :class="{ 'is-invalid': errors.lastName }"
                      placeholder="Enter your last name"
                      required
                    />
                  </div>
                  <div v-if="errors.lastName" class="cyberpunk-error-message">
                    {{ errors.lastName }}
                  </div>
                </div>

                <div class="mb-3">
                  <label for="email" class="cyberpunk-label">Email Address</label>
                  <div class="cyberpunk-input-group">
                    <div class="cyberpunk-input-icon">
                      <i class="fas fa-envelope"></i>
                    </div>
                    <input
                      ref="emailField"
                      type="email"
                      id="email"
                      v-model="form.email"
                      class="cyberpunk-input"
                      :class="{ 'is-invalid': errors.email }"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div v-if="errors.email" class="cyberpunk-error-message">
                    {{ errors.email }}
                  </div>
                </div>

                <div class="mb-3">
                  <label for="userType" class="cyberpunk-label">I am a</label>
                  <div class="cyberpunk-input-group">
                    <div class="cyberpunk-input-icon">
                      <i class="fas fa-user-tag"></i>
                    </div>
                    <select
                      ref="userTypeField"
                      id="userType"
                      v-model="form.userType"
                      class="cyberpunk-input"
                      :class="{ 'is-invalid': errors.userType }"
                      required
                    >
                      <option value="">Select your role</option>
                      <option value="student">Student</option>
                      <option value="parent">Parent</option>
                      <option value="tutor">Tutor</option>
                    </select>
                  </div>
                  <div v-if="errors.userType" class="cyberpunk-error-message">
                    {{ errors.userType }}
                  </div>
                </div>

                <div class="mb-3">
                  <label for="phone" class="cyberpunk-label">Phone Number (Optional)</label>
                  <div class="cyberpunk-input-group">
                    <div class="cyberpunk-input-icon">
                      <i class="fas fa-phone"></i>
                    </div>
                    <input
                      ref="phoneField"
                      type="tel"
                      id="phone"
                      v-model="form.phone"
                      class="cyberpunk-input"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div class="mb-3">
                  <label for="password" class="cyberpunk-label">Password</label>
                  <div class="cyberpunk-input-group">
                    <div class="cyberpunk-input-icon">
                      <i class="fas fa-lock"></i>
                    </div>
                    <input
                      ref="passwordField"
                      :type="showPassword ? 'text' : 'password'"
                      id="password"
                      v-model="form.password"
                      class="cyberpunk-input"
                      :class="{ 'is-invalid': errors.password }"
                      placeholder="Create a password"
                      required
                    />
                    <button
                      ref="passwordToggle"
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

                <div class="mb-3">
                  <label for="confirmPassword" class="cyberpunk-label">Confirm Password</label>
                  <div class="cyberpunk-input-group">
                    <div class="cyberpunk-input-icon">
                      <i class="fas fa-lock"></i>
                    </div>
                    <input
                      ref="confirmPasswordField"
                      type="password"
                      id="confirmPassword"
                      v-model="form.confirmPassword"
                      class="cyberpunk-input"
                      :class="{ 'is-invalid': errors.confirmPassword }"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                  <div v-if="errors.confirmPassword" class="cyberpunk-error-message">
                    {{ errors.confirmPassword }}
                  </div>
                </div>

                <div class="cyberpunk-checkbox-group mb-3">
                  <div class="cyberpunk-checkbox">
                    <input
                      ref="termsField"
                      type="checkbox"
                      id="terms"
                      v-model="form.terms"
                      class="cyberpunk-checkbox-input"
                      :class="{ 'is-invalid': errors.terms }"
                      required
                    />
                    <label for="terms" class="cyberpunk-checkbox-label">
                      I agree to the <a href="#" class="cyberpunk-link">Terms of Service</a> and <a href="#" class="cyberpunk-link">Privacy Policy</a>
                    </label>
                  </div>
                  <div v-if="errors.terms" class="cyberpunk-error-message">
                    {{ errors.terms }}
                  </div>
                </div>

                <div v-if="error" ref="errorAlert" class="cyberpunk-alert" role="alert">
                  <i class="fas fa-exclamation-circle me-2"></i>
                  {{ error }}
                </div>

                <button
                  ref="submitButton"
                  type="submit"
                  class="cyberpunk-submit-btn w-100 py-3 mb-3"
                  :disabled="isLoading"
                >
                  <span v-if="isLoading" class="cyberpunk-spinner me-2"></span>
                  <i v-else class="fas fa-user-plus me-2"></i>
                  {{ isLoading ? 'Creating Account...' : 'CREATE ACCOUNT' }}
                </button>

                <div class="text-center">
                  <p class="cyberpunk-signup-text mb-0">
                    Already have an account?
                    <router-link ref="loginLink" to="/login" class="cyberpunk-link">
                      Sign in here
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
  name: 'Register',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()

    // Template refs for animations
    const registerCard = ref(null)
    const logoIcon = ref(null)
    const welcomeText = ref(null)
    const subtitleText = ref(null)
    const firstNameField = ref(null)
    const lastNameField = ref(null)
    const emailField = ref(null)
    const userTypeField = ref(null)
    const phoneField = ref(null)
    const passwordField = ref(null)
    const confirmPasswordField = ref(null)
    const passwordToggle = ref(null)
    const termsField = ref(null)
    const submitButton = ref(null)
    const loginLink = ref(null)
    const errorAlert = ref(null)

    const form = reactive({
      firstName: '',
      lastName: '',
      email: '',
      userType: '',
      phone: '',
      password: '',
      confirmPassword: '',
      terms: false
    })

    const errors = ref({})
    const error = ref('')
    const isLoading = ref(false)
    const showPassword = ref(false)

    // Advanced Anime.js v4 Register Page Animations
    const initRegisterAnimations = async () => {
      await nextTick()
      
      // Create main timeline with advanced settings
      const registerTimeline = createTimeline({
        defaults: { 
          duration: 800,
          ease: 'out(3)',
          frameRate: 60
        },
        playbackRate: 1,
        onBegin: (self) => {
          console.log('Register animations started', self.id)
          if (registerCard.value) {
            registerCard.value.style.borderColor = 'var(--cyber-orange)'
          }
        },
        onComplete: (self) => {
          console.log('Register animations completed', self.id)
          if (registerCard.value) {
            registerCard.value.style.borderColor = 'var(--cyber-orange)'
          }
        },
        onBeforeUpdate: (self) => {
          if (self.progress > 0.5 && registerCard.value) {
            registerCard.value.style.boxShadow = '0 0 40px rgba(255, 140, 66, 0.4)'
          }
        },
        onUpdate: (self) => {
          if (self.progress > 0.8 && welcomeText.value) {
            welcomeText.value.style.textShadow = '0 0 20px rgba(255, 140, 66, 0.8)'
          }
        },
        onRender: (self) => {
          if (self.currentTime > 400 && logoIcon.value) {
            logoIcon.value.style.filter = 'brightness(1.1)'
          }
        }
      })

      // Background floating elements with advanced animations
      const floatingElements = document.querySelectorAll('.floating-icon')
      floatingElements.forEach((element, index) => {
        const elementTimeline = createTimeline({
          loop: true,
          alternate: true,
          playbackRate: 0.5 + (index * 0.1),
          onLoop: (self) => {
            element.style.color = `hsl(${(index * 45) % 360}, 70%, 60%)`
          }
        })
        
        elementTimeline
          .add(element, {
            y: [0, -30, 0],
            rotate: [0, 10, -10, 0],
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.1, 1],
            filter: ['blur(0px)', 'blur(1px)', 'blur(0px)']
          }, 0)
          .add(element, {
            x: [0, 15, 0],
            rotateZ: [0, 360, 0]
          }, 0)
      })

      // Register card entrance with 3D effects
      if (registerCard.value) {
        registerTimeline
          .label('card-entrance', 0)
          .add(registerCard.value, {
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
        registerTimeline
          .label('logo-animation', 200)
          .add(logoIcon.value, {
            scale: [0, 1.2, 1],
            opacity: [0, 1],
            filter: ['blur(5px)', 'blur(0px)']
          }, 'logo-animation')
      }

      if (welcomeText.value) {
        registerTimeline
          .add(welcomeText.value, {
            y: [50, 0],
            opacity: [0, 1],
            scale: [0.9, 1],
            rotateX: [20, 0],
            textShadow: [
              '0 0 0 rgba(255, 140, 66, 0)',
              '0 0 20px rgba(255, 140, 66, 0.8)'
            ]
          }, '+=200')
      }

      if (subtitleText.value) {
        registerTimeline
          .add(subtitleText.value, {
            y: [30, 0],
            opacity: [0, 1],
            scale: [0.95, 1],
            rotateY: [-15, 0],
            filter: ['blur(3px)', 'blur(0px)']
          }, '+=100')
      }

      // Form fields with staggered animations
      const formFields = [
        { ref: firstNameField, delay: 400 },
        { ref: lastNameField, delay: 450 },
        { ref: emailField, delay: 500 },
        { ref: userTypeField, delay: 550 },
        { ref: phoneField, delay: 600 },
        { ref: passwordField, delay: 650 },
        { ref: confirmPasswordField, delay: 700 },
        { ref: termsField, delay: 750 },
        { ref: submitButton, delay: 800 },
        { ref: loginLink, delay: 850 }
      ]

      formFields.forEach(({ ref: fieldRef, delay }) => {
        if (fieldRef.value) {
          registerTimeline
            .add(fieldRef.value, {
              x: [-50, 0],
              y: [30, 0],
              opacity: [0, 1],
              scale: [0.9, 1],
              rotateY: [-10, 0],
              rotateX: [5, 0],
              filter: ['blur(3px)', 'blur(0px)'],
              boxShadow: [
                '0 0 0 rgba(255, 140, 66, 0)',
                '0 0 15px rgba(255, 140, 66, 0.3)'
              ]
            }, `+=${delay}`)
        }
      })

      // Advanced input focus animations
      const inputFields = [firstNameField, lastNameField, emailField, userTypeField, phoneField, passwordField, confirmPasswordField]
      
      inputFields.forEach(fieldRef => {
        if (fieldRef.value) {
          const focusTimeline = createTimeline({
            defaults: { duration: 200, ease: 'out(2)' }
          })
          
          fieldRef.value.addEventListener('focus', () => {
            focusTimeline
              .add(fieldRef.value, {
                scale: [1, 1.02],
                boxShadow: [
                  '0 0 0 rgba(255, 140, 66, 0)',
                  '0 0 20px rgba(255, 140, 66, 0.5)'
                ],
                borderColor: ['var(--cyber-orange)', 'var(--cyber-yellow)']
              }, 0)
          })
          
          fieldRef.value.addEventListener('blur', () => {
            focusTimeline
              .add(fieldRef.value, {
                scale: [1.02, 1],
                boxShadow: [
                  '0 0 20px rgba(255, 140, 66, 0.5)',
                  '0 0 0 rgba(255, 140, 66, 0)'
                ],
                borderColor: ['var(--cyber-yellow)', 'var(--cyber-orange)']
              }, 0)
          })
        }
      })

      // Advanced button hover/click animations
      if (submitButton.value) {
        const buttonHoverTimeline = createTimeline({
          defaults: { duration: 300, ease: 'out(2)' }
        })
        
        const buttonClickTimeline = createTimeline({
          defaults: { duration: 150, ease: 'out(3)' }
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
              rotateX: [5, -5]
            }, 0)
        })

        submitButton.value.addEventListener('mouseup', () => {
          buttonClickTimeline
            .add(submitButton.value, {
              scale: [0.95, 1.08],
              rotateX: [-5, 5]
            }, 0)
        })
      }

      // Add continuous subtle animations for cyberpunk feel
      const continuousTimeline = createTimeline({
        loop: true,
        alternate: true,
        playbackRate: 0.3
      })

      if (registerCard.value) {
        continuousTimeline
          .add(registerCard.value, {
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

      if (registerCard.value) {
        cardAnimatable = createAnimatable(registerCard.value, {
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
      
      if (!form.firstName.trim()) {
        errors.value.firstName = 'First name is required'
      }

      if (!form.lastName.trim()) {
        errors.value.lastName = 'Last name is required'
      }

      if (!form.email) {
        errors.value.email = 'Email is required'
      } else if (!/\S+@\S+\.\S+/.test(form.email)) {
        errors.value.email = 'Please enter a valid email'
      }

      if (!form.userType) {
        errors.value.userType = 'Please select your role'
      }

      if (!form.password) {
        errors.value.password = 'Password is required'
      } else if (form.password.length < 8) {
        errors.value.password = 'Password must be at least 8 characters'
      }

      if (!form.confirmPassword) {
        errors.value.confirmPassword = 'Please confirm your password'
      } else if (form.password !== form.confirmPassword) {
        errors.value.confirmPassword = 'Passwords do not match'
      }

      if (!form.terms) {
        errors.value.terms = 'You must agree to the terms and conditions'
      }

      return Object.keys(errors.value).length === 0
    }

    const handleRegister = async () => {
      console.log('🚀 handleRegister called')
      console.log('📝 Form data:', form)

      if (!validateForm()) {
        console.log('❌ Form validation failed')
        animateError()
        return
      }

      console.log('✅ Form validated, starting registration...')
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
        console.log('📞 Calling authStore.register...')
        const result = await authStore.register({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          userType: form.userType,
          phone: form.phone,
          password: form.password
        })
        console.log('📦 Registration result:', result)
        
        if (result.success) {
          console.log('✅ Registration successful!')
          // Advanced success animation with promise-based chaining
          if (registerCard.value) {
            const successTimeline = createTimeline({
              defaults: { duration: 300, ease: 'out(3)' },
              onBegin: (self) => {
                console.log('Success animation started', self.id)
                registerCard.value.style.borderColor = 'var(--cyber-yellow)'
              },
              onComplete: (self) => {
                console.log('Success animation completed', self.id)
                registerCard.value.style.borderColor = 'var(--cyber-orange)'
              }
            })
            
            successTimeline
              .add(registerCard.value, {
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
              .add(registerCard.value, {
                y: [0, -20, 50]
              }, 0)
            
            // Use promise-based chaining for navigation
            successTimeline.then(() => {
              console.log('Success animation promise resolved')
              router.push('/dashboard')
            })
          } else {
            setTimeout(() => {
              router.push('/dashboard')
            }, 800)
          }
        } else {
          console.log('❌ Registration failed:', result.error)
          error.value = result.error
          animateError()
        }
      } catch (err) {
        console.error('❌ Caught exception in handleRegister:', err)
        error.value = 'An unexpected error occurred. Please try again.'
        animateError()
      } finally {
        console.log('🏁 handleRegister finally block - setting isLoading to false')
        isLoading.value = false
      }
    }

    // Dynamic speed control for animations
    let registerTimeline = null
    
    // Animatable instances for interactive animations
    let logoAnimatable = null
    let cardAnimatable = null
    let floatingAnimatables = []
    
    const adjustAnimationSpeed = (speed) => {
      if (registerTimeline) {
        registerTimeline.speed = speed
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
          if (registerTimeline) {
            registerTimeline.paused ? registerTimeline.resume() : registerTimeline.pause()
            console.log(`Animation ${registerTimeline.paused ? 'paused' : 'resumed'}`)
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
      
      // Logo interactive animation with circular boundary (same as login page)
      if (logoAnimatable && logoIcon.value) {
        // Get logo position and size for circular boundary calculation
        const logoRect = logoIcon.value.getBoundingClientRect()
        const logoCenterX = logoRect.left + logoRect.width / 2
        const logoCenterY = logoRect.top + logoRect.height / 2
        
        // Calculate distance from mouse to logo center
        const deltaX = clientX - logoCenterX
        const deltaY = clientY - logoCenterY
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        
        // Define circular boundary (radius of the logo circle)
        const maxRadius = logoRect.width / 2
        
        // Calculate movement within circular boundary
        if (distance > 0) {
          const maxMovement = 8 // Maximum pixels the logo can move
          const movementRatio = Math.min(distance / 200, 1) // Normalize distance
          const constrainedMovement = movementRatio * maxMovement
          
          // Calculate constrained position within circle
          const angle = Math.atan2(deltaY, deltaX)
          const constrainedX = Math.cos(angle) * constrainedMovement
          const constrainedY = Math.sin(angle) * constrainedMovement
          
          // Apply smooth scaling based on mouse distance
          const scale = 1 + (movementRatio * 0.1)
          const rotate = constrainedX * 0.5
          
          logoAnimatable.x(constrainedX).y(constrainedY).scale(scale).rotate(rotate)
        }
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
      initRegisterAnimations()
      
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
      const backgroundElements = document.querySelector('.register-background-elements')
      if (backgroundElements && backgroundElements.parentNode) {
        backgroundElements.parentNode.removeChild(backgroundElements)
      }
    })

    return {
      // Template refs
      registerCard,
      logoIcon,
      welcomeText,
      subtitleText,
      firstNameField,
      lastNameField,
      emailField,
      userTypeField,
      phoneField,
      passwordField,
      confirmPasswordField,
      passwordToggle,
      termsField,
      submitButton,
      loginLink,
      errorAlert,
      // Form data
      form,
      errors,
      error,
      isLoading,
      showPassword,
      handleRegister
    }
  }
}
</script>

<style scoped>
/* Register Page Cyberpunk Styling */
.register-page {
  background: #1a1a1a !important;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
  min-height: 100vh;
  width: 100vw;
  color-scheme: dark;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Force dark background on all elements */
.register-page * {
  background: transparent !important;
}

/* Override any white backgrounds */
.register-page .container,
.register-page .row,
.register-page .col-lg-8,
.register-page .col-md-10 {
  background: transparent !important;
}

/* Ensure body and html are dark */
:global(.register-page),
:global(.register-page *),
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
.register-background-elements {
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
  opacity: 0.2;
  color: var(--cyber-orange);
  text-shadow: 0 0 10px rgba(255, 140, 66, 0.1);
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

/* Cyberpunk Register Card */
.cyberpunk-register-card {
  background: rgba(26, 26, 26, 0.98);
  border: 2px solid var(--cyber-orange);
  border-radius: 20px;
  box-shadow: 
    0 0 30px rgba(255, 140, 66, 0.3),
    0 0 60px rgba(255, 140, 66, 0.1),
    inset 0 0 20px rgba(255, 140, 66, 0.1);
  position: relative;
  z-index: 10;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.cyberpunk-register-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent, rgba(255, 140, 66, 0.05), transparent);
  pointer-events: none;
}

/* Cyberpunk Logo Icon */
.cyberpunk-logo-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(45deg, var(--cyber-orange), var(--cyber-yellow));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.5rem;
  box-shadow: 0 0 20px rgba(255, 140, 66, 0.5);
  border: 2px solid var(--cyber-orange);
  font-size: 1.25rem;
  color: white;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

/* Cyberpunk Text Elements */
.cyberpunk-welcome-text {
  color: var(--cyber-text);
  font-weight: 700;
  font-size: 1.5rem;
  text-shadow: 0 0 20px rgba(255, 140, 66, 0.5);
  letter-spacing: 1.5px;
  margin-bottom: 0.25rem;
}

.cyberpunk-subtitle {
  color: var(--cyber-text);
  font-size: 0.85rem;
  font-weight: 500;
  text-shadow: 0 0 15px rgba(255, 140, 66, 0.5);
  letter-spacing: 0.5px;
}

.cyberpunk-label {
  color: var(--cyber-text);
  font-weight: 600;
  font-size: 0.9rem;
  text-shadow: 0 0 5px rgba(255, 140, 66, 0.3);
  letter-spacing: 0.5px;
  margin-bottom: 0.35rem;
}

.cyberpunk-signup-text {
  color: var(--cyber-text-muted);
  font-size: 0.85rem;
}

.cyberpunk-link {
  color: var(--cyber-orange);
  text-decoration: none;
  font-weight: 600;
  text-shadow: 0 0 5px rgba(255, 140, 66, 0.3);
  transition: all 0.3s ease;
}

.cyberpunk-link:hover {
  color: var(--cyber-yellow);
  text-shadow: 0 0 10px rgba(255, 210, 63, 0.5);
}

/* Cyberpunk Input Groups */
.cyberpunk-input-group {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(42, 42, 42, 0.8);
  border: 2px solid var(--cyber-grey-light);
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.cyberpunk-input-group:focus-within {
  border-color: var(--cyber-orange);
  box-shadow: 0 0 15px rgba(255, 140, 66, 0.3);
}

.cyberpunk-input-icon {
  padding: 0.6rem 0.85rem;
  color: var(--cyber-orange);
  background: rgba(255, 140, 66, 0.1);
  border-right: 1px solid var(--cyber-grey-light);
  font-size: 0.95rem;
}

.cyberpunk-input {
  flex: 1;
  padding: 0.6rem 0.85rem;
  background: transparent;
  border: none;
  color: var(--cyber-text);
  font-size: 0.9rem;
  outline: none;
}

.cyberpunk-input::placeholder {
  color: var(--cyber-text-dim);
}

/* Fix select dropdown styling */
.cyberpunk-input select,
.cyberpunk-input option {
  background: rgba(42, 42, 42, 0.95) !important;
  color: var(--cyber-text) !important;
}

select.cyberpunk-input {
  cursor: pointer;
}

select.cyberpunk-input option {
  background: rgba(42, 42, 42, 0.98) !important;
  color: var(--cyber-text) !important;
  padding: 0.5rem !important;
}

select.cyberpunk-input option:hover,
select.cyberpunk-input option:focus,
select.cyberpunk-input option:checked {
  background: var(--cyber-orange) !important;
  color: white !important;
}

.cyberpunk-toggle-btn {
  padding: 0.6rem 0.85rem;
  background: rgba(255, 140, 66, 0.1);
  border: none;
  color: var(--cyber-orange);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 1px solid var(--cyber-grey-light);
  font-size: 0.9rem;
}

.cyberpunk-toggle-btn:hover {
  background: rgba(255, 140, 66, 0.2);
  color: var(--cyber-yellow);
}

/* Cyberpunk Checkbox */
.cyberpunk-checkbox-group {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.cyberpunk-checkbox {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cyberpunk-checkbox-input {
  width: 20px;
  height: 20px;
  background: rgba(42, 42, 42, 0.8);
  border: 2px solid var(--cyber-grey-light);
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  appearance: none;
  transition: all 0.3s ease;
}

.cyberpunk-checkbox-input:checked {
  background: var(--cyber-orange);
  border-color: var(--cyber-orange);
  box-shadow: 0 0 10px rgba(255, 140, 66, 0.5);
}

.cyberpunk-checkbox-input:checked::after {
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
  color: var(--cyber-text);
  font-size: 0.85rem;
  line-height: 1.3;
  cursor: pointer;
}

/* Cyberpunk Submit Button */
.cyberpunk-submit-btn {
  background: linear-gradient(45deg, var(--cyber-orange), var(--cyber-yellow));
  border: 2px solid var(--cyber-orange);
  color: white;
  font-weight: 700;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0.65rem 1.5rem;
  box-shadow: 0 0 20px rgba(255, 140, 66, 0.3);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.cyberpunk-submit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.cyberpunk-submit-btn:hover::before {
  left: 100%;
}

.cyberpunk-submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(255, 140, 66, 0.5);
}

.cyberpunk-submit-btn:disabled {
  opacity: 0.7;
  transform: none;
  cursor: not-allowed;
}

/* Cyberpunk Alert */
.cyberpunk-alert {
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid #ef4444;
  color: #ef4444;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
  text-shadow: 0 0 5px rgba(239, 68, 68, 0.3);
}

.cyberpunk-error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  text-shadow: 0 0 5px rgba(239, 68, 68, 0.3);
}

/* Cyberpunk Spinner */
.cyberpunk-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .cyberpunk-register-card {
    margin: 1rem;
    border-radius: 15px;
  }
  
  .cyberpunk-welcome-text {
    font-size: 2rem;
  }
  
  .cyberpunk-logo-icon {
    width: 60px;
    height: 60px;
    font-size: 1.5rem;
  }
  
  .floating-icon {
    font-size: 1.5rem;
  }
}
</style>
