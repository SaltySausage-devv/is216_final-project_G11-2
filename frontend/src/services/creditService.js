import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'
import { useNotifications } from '../composables/useNotifications'

/**
 * Credit Service Composable - Handles credit balance validation and notifications
 */
export function useCreditService() {
  const authStore = useAuthStore()
  const toast = useToast()
  const notifications = useNotifications()

  /**
   * Check if student has sufficient credits for a booking
   * @param {number} requiredCredits - Credits needed for the booking
   * @param {string} action - Action being performed (booking, reschedule, etc.)
   * @returns {boolean} - Whether student has sufficient credits
   */
  const hasSufficientCredits = (requiredCredits, action = 'booking') => {
    const currentCredits = authStore.user?.credits || 0
    
    if (currentCredits < requiredCredits) {
      showInsufficientCreditsNotification(requiredCredits, currentCredits, action)
      return false
    }
    
    return true
  }

  /**
   * Check if student has any credits at all
   * @returns {boolean} - Whether student has any credits
   */
  const hasAnyCredits = () => {
    const currentCredits = authStore.user?.credits || 0
    
    if (currentCredits <= 0) {
      showZeroCreditsNotification()
      return false
    }
    
    return true
  }

  /**
   * Calculate credits needed for a booking based on hourly rate and duration
   * @param {number} hourlyRate - Tutor's hourly rate
   * @param {number} durationMinutes - Duration in minutes
   * @returns {number} - Credits needed
   */
  const calculateCreditsNeeded = (hourlyRate, durationMinutes) => {
    const durationHours = durationMinutes / 60
    const total = hourlyRate * durationHours
    // Always round to 2 decimal places to prevent values like 213.166666666667
    return parseFloat(total.toFixed(2))
  }

  /**
   * Show insufficient credits notification
   * @param {number} requiredCredits - Credits needed
   * @param {number} currentCredits - Current credit balance
   * @param {string} action - Action being performed
   */
  const showInsufficientCreditsNotification = (requiredCredits, currentCredits, action) => {
    const shortfall = requiredCredits - currentCredits
    const actionText = action === 'reschedule' ? 'reschedule this booking' : 'make this booking'
    
    // For reschedule, show the difference amount, not the total
    const creditMessage = action === 'reschedule' 
      ? `You need ${shortfall} more Credits to ${actionText}. Click to top up your Credits.`
      : `You need ${requiredCredits} Credits to ${actionText}, but only have ${currentCredits}. Please top up ${shortfall} more Credits.`
    
    // Show toast notification
    toast.showToast(
      action === 'reschedule' 
        ? `Insufficient Credits! You need ${shortfall} more Credits to ${actionText}. Please top up your Credits.`
        : `Insufficient Credits! You need ${requiredCredits} Credits to ${actionText}, but only have ${currentCredits}. Please top up ${shortfall} more Credits.`,
      'warning',
      8000
    )

    // Show system notification
    notifications.showNotification({
      title: 'Insufficient Credits',
      message: creditMessage,
      onClick: () => {
        // Navigate to profile page where they can top up credits
        window.location.href = '/profile'
      }
    })
  }

  /**
   * Show zero credits notification
   */
  const showZeroCreditsNotification = () => {
    // Show toast notification
    toast.showToast(
      'You have no Credits remaining! Please top up your Credits to continue booking sessions.',
      'error',
      8000
    )

    // Show system notification
    notifications.showNotification({
      title: 'No Credits Remaining',
      message: 'You have 0 Credits. Please top up your Credits to book sessions.',
      onClick: () => {
        // Navigate to profile page where they can top up credits
        window.location.href = '/profile'
      }
    })
  }

  /**
   * Validate credits before booking creation
   * @param {Object} bookingData - Booking data containing tutor info and duration
   * @returns {boolean} - Whether validation passed
   */
  const validateBookingCredits = (bookingData) => {
    const { tutorHourlyRate, durationMinutes } = bookingData
    const requiredCredits = calculateCreditsNeeded(tutorHourlyRate, durationMinutes)
    
    return hasSufficientCredits(requiredCredits, 'booking')
  }

  /**
   * Validate credits before rescheduling
   * @param {Object} rescheduleData - Reschedule data containing new booking info
   * @param {number} currentSessionCredits - Credits used by current session
   * @returns {boolean} - Whether validation passed
   */
  const validateRescheduleCredits = (rescheduleData, currentSessionCredits = 0) => {
    const { tutorHourlyRate, durationMinutes } = rescheduleData
    const newSessionCredits = calculateCreditsNeeded(tutorHourlyRate, durationMinutes)
    const creditDifference = newSessionCredits - currentSessionCredits
    
    // Only check if there's an additional cost (credit difference > 0)
    if (creditDifference > 0) {
      return hasSufficientCredits(creditDifference, 'reschedule')
    }
    
    // If credit difference is 0 or negative, no additional credits needed
    return true
  }

  /**
   * Check if user is a student (only students need credit validation)
   * @returns {boolean} - Whether user is a student
   */
  const isStudent = () => {
    return authStore.userType === 'student'
  }

  /**
   * Get current credit balance
   * @returns {number} - Current credit balance
   */
  const getCurrentCredits = () => {
    return authStore.user?.credits || 0
  }

  /**
   * Refresh user data to get latest credit balance
   * This should be called after credit transactions
   * @param {number} delay - Delay in milliseconds before refreshing (default: 500ms)
   */
  const refreshCredits = async (delay = 500) => {
    try {
      console.log('🔄 Refreshing credit balance...')
      
      // Add a small delay to ensure database update has completed
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
      
      // Refresh user data
      await authStore.refreshUserData()
      
      // Force an additional refresh after a short delay to ensure we get the latest data
      setTimeout(async () => {
        await authStore.refreshUserData()
        console.log('✅ Credit balance refreshed (second pass)')
      }, 1000)
      
      console.log('✅ Credit balance refreshed')
    } catch (error) {
      console.error('❌ Error refreshing credits:', error)
    }
  }

  return {
    hasSufficientCredits,
    hasAnyCredits,
    calculateCreditsNeeded,
    showInsufficientCreditsNotification,
    showZeroCreditsNotification,
    validateBookingCredits,
    validateRescheduleCredits,
    isStudent,
    getCurrentCredits,
    refreshCredits
  }
}
