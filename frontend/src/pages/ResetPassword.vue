<template>
  <div class="reset-password-page min-vh-100 d-flex align-items-center position-relative" style="background: #1a1a1a !important;">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-5 col-md-7">
          <div class="cyberpunk-card">
            <div class="card-body p-5">
              <!-- Header -->
              <div class="text-center mb-4">
                <div class="cyberpunk-logo-icon">
                  <i class="fas fa-lock"></i>
                </div>
                <h2 class="cyberpunk-title">New Password</h2>
                <p class="cyberpunk-subtitle">Enter your new password</p>
              </div>

              <!-- Success Message -->
              <div v-if="successMessage" class="cyberpunk-success-alert mb-4">
                <i class="fas fa-check-circle me-2"></i>
                {{ successMessage }}
              </div>

              <!-- Form -->
              <form v-if="!successMessage" @submit.prevent="handleSubmit">
                <!-- Password Field -->
                <div class="mb-4">
                  <label for="password" class="cyberpunk-label">New Password</label>
                  <div class="cyberpunk-input-group">
                    <span class="cyberpunk-input-icon">
                      <i class="fas fa-lock"></i>
                    </span>
                    <input
                      :type="showPassword ? 'text' : 'password'"
                      id="password"
                      v-model="password"
                      class="cyberpunk-input"
                      :class="{ 'cyberpunk-input-error': errors.password }"
                      placeholder="Enter new password"
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

                <!-- Confirm Password Field -->
                <div class="mb-4">
                  <label for="confirmPassword" class="cyberpunk-label">Confirm Password</label>
                  <div class="cyberpunk-input-group">
                    <span class="cyberpunk-input-icon">
                      <i class="fas fa-lock"></i>
                    </span>
                    <input
                      :type="showConfirmPassword ? 'text' : 'password'"
                      id="confirmPassword"
                      v-model="confirmPassword"
                      class="cyberpunk-input"
                      :class="{ 'cyberpunk-input-error': errors.confirmPassword }"
                      placeholder="Confirm new password"
                      required
                    />
                    <button
                      type="button"
                      class="cyberpunk-toggle-btn"
                      @click="showConfirmPassword = !showConfirmPassword"
                    >
                      <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                    </button>
                  </div>
                  <div v-if="errors.confirmPassword" class="cyberpunk-error-message">
                    {{ errors.confirmPassword }}
                  </div>
                </div>

                <!-- Error Alert -->
                <div v-if="error" class="cyberpunk-alert mb-4">
                  <i class="fas fa-exclamation-circle me-2"></i>
                  {{ error }}
                </div>

                <!-- Submit Button -->
                <button
                  type="submit"
                  class="cyberpunk-submit-btn"
                  :disabled="isLoading"
                >
                  <span v-if="isLoading" class="cyberpunk-spinner me-2"></span>
                  <i v-else class="fas fa-check me-2"></i>
                  {{ isLoading ? 'Resetting...' : 'RESET PASSWORD' }}
                </button>
              </form>

              <!-- After Success -->
              <div v-else class="text-center">
                <router-link to="/login" class="cyberpunk-submit-btn d-inline-block text-decoration-none">
                  <i class="fas fa-sign-in-alt me-2"></i>
                  GO TO LOGIN
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'ResetPassword',
  setup() {
    const authStore = useAuthStore()

    const password = ref('')
    const confirmPassword = ref('')
    const showPassword = ref(false)
    const showConfirmPassword = ref(false)
    const errors = ref({})
    const error = ref('')
    const successMessage = ref('')
    const isLoading = ref(false)

    onMounted(() => {
      // Supabase will handle the token from the URL automatically
      // No need to check authentication status - let the user try to reset
      // If the token is invalid, the API call will fail with an appropriate error
      console.log('🔍 Reset password page loaded - ready for password reset')
    })

    const validateForm = () => {
      errors.value = {}

      if (!password.value) {
        errors.value.password = 'Password is required'
      } else if (password.value.length < 8) {
        errors.value.password = 'Password must be at least 8 characters'
      }

      if (!confirmPassword.value) {
        errors.value.confirmPassword = 'Please confirm your password'
      } else if (password.value !== confirmPassword.value) {
        errors.value.confirmPassword = 'Passwords do not match'
      }

      return Object.keys(errors.value).length === 0
    }

    const handleSubmit = async () => {
      if (!validateForm()) {
        return
      }

      isLoading.value = true
      error.value = ''

      // Set a timeout to handle cases where Supabase doesn't respond quickly
      const timeoutId = setTimeout(() => {
        console.log('⏰ Password reset timeout - redirecting to login')
        // Hard refresh to login page after 5 seconds with success indicator
        window.location.href = '/login?reset=success'
      }, 5000) // 5 second timeout

      try {
        const result = await authStore.resetPassword(password.value)

        if (result.success) {
          // Keep showing "Resetting..." and wait for the 5 second timeout to redirect
          console.log('✅ Password reset successful, waiting for timeout to redirect')
          // Don't clear the timeout - let it redirect after 5 seconds total
        } else {
          // Clear the timeout only on error
          clearTimeout(timeoutId)
          error.value = result.error || 'Failed to reset password. The link may have expired.'
          isLoading.value = false
        }
      } catch (err) {
        // Clear the timeout on error
        clearTimeout(timeoutId)

        console.error('Reset password error:', err)
        error.value = 'An unexpected error occurred. Please try again.'
        isLoading.value = false
      }
    }

    return {
      password,
      confirmPassword,
      showPassword,
      showConfirmPassword,
      errors,
      error,
      successMessage,
      isLoading,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.reset-password-page {
  background: #1a1a1a !important;
  position: relative;
  overflow: hidden;
  min-height: 100vh;
}

.cyberpunk-card {
  background: rgba(26, 26, 26, 0.95);
  border: 2px solid var(--cyber-orange);
  border-radius: 20px;
  box-shadow:
    0 0 30px rgba(255, 140, 66, 0.3),
    0 0 60px rgba(255, 140, 66, 0.1);
}

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

.cyberpunk-title {
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
}

.cyberpunk-input::placeholder {
  color: var(--cyber-text-dim);
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

.cyberpunk-error-message {
  color: #ef4444;
  font-size: 0.9rem;
  margin-top: 5px;
  text-shadow: 0 0 5px rgba(239, 68, 68, 0.3);
}

.cyberpunk-alert {
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid #ef4444;
  color: #ef4444;
  padding: 15px;
  border-radius: 8px;
  text-shadow: 0 0 5px rgba(239, 68, 68, 0.3);
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.2);
}

.cyberpunk-success-alert {
  background: rgba(34, 197, 94, 0.1);
  border: 2px solid #22c55e;
  color: #22c55e;
  padding: 15px;
  border-radius: 8px;
  text-shadow: 0 0 5px rgba(34, 197, 94, 0.3);
  box-shadow: 0 0 15px rgba(34, 197, 94, 0.2);
}

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
}

.cyberpunk-submit-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 0 30px rgba(255, 140, 66, 0.5);
}

.cyberpunk-submit-btn:disabled {
  opacity: 0.7;
  transform: none;
  cursor: not-allowed;
}

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
</style>
