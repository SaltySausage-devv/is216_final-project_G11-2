import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userType = computed(() => user.value?.userType || null)

  const login = async (email, password) => {
    isLoading.value = true
    try {
      // Mock login for frontend development
      const mockToken = 'mock-jwt-token-' + Date.now()
      const mockUser = {
        id: 1,
        firstName: 'Demo',
        lastName: 'User',
        email: email,
        userType: 'student'
      }
      
      token.value = mockToken
      user.value = mockUser
      localStorage.setItem('token', mockToken)
      
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: 'Login failed' 
      }
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData) => {
    isLoading.value = true
    try {
      // Mock registration for frontend development
      const mockToken = 'mock-jwt-token-' + Date.now()
      const mockUser = {
        id: 2,
        firstName: userData.firstName || 'New',
        lastName: userData.lastName || 'User',
        email: userData.email,
        userType: userData.userType || 'student'
      }
      
      token.value = mockToken
      user.value = mockUser
      localStorage.setItem('token', mockToken)
      
      return { success: true }
    } catch (error) {
      console.error('Registration error:', error)
      return { 
        success: false, 
        error: 'Registration failed' 
      }
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }

  const initializeAuth = async () => {
    // For frontend development, skip API calls
    if (token.value) {
      // Set a mock user for development
      user.value = {
        id: 1,
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@example.com',
        userType: 'student'
      }
    }
  }

  const updateProfile = async (profileData) => {
    try {
      // Mock profile update for frontend development
      user.value = { ...user.value, ...profileData }
      return { success: true }
    } catch (error) {
      console.error('Profile update error:', error)
      return { 
        success: false, 
        error: 'Profile update failed' 
      }
    }
  }

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    userType,
    login,
    register,
    logout,
    initializeAuth,
    updateProfile
  }
})
