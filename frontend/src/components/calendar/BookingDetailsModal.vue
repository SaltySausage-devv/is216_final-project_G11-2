<template>
  <div class="modal fade show" style="display: block; background-color: rgba(0, 0, 0, 0.5);">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Booking Details</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <!-- Booking Status Badge -->
          <div class="mb-3">
            <span :class="getStatusClass(booking.status)" class="badge">
              {{ formatStatus(booking.status) }}
            </span>
          </div>

          <!-- Booking Information -->
          <div class="row mb-4">
            <div class="col-md-6">
              <h6 class="text-muted">Session Details</h6>
              <p class="mb-2">
                <strong>Title:</strong> {{ booking.title }}
              </p>
              <p class="mb-2">
                <strong>Date:</strong> {{ formatDate(booking.start || booking.start_time) }}
              </p>
              <p class="mb-2">
                <strong>Time:</strong> {{ formatTime(booking.start || booking.start_time) }} - {{ formatTime(booking.end || booking.end_time) }}
              </p>
              <p class="mb-2">
                <strong>Duration:</strong> {{ calculateDuration(booking.start || booking.start_time, booking.end || booking.end_time) }}
              </p>
              <p v-if="booking.is_online" class="mb-2">
                <strong>Type:</strong> <i class="fas fa-video me-1"></i> Online Session
              </p>
              <p v-else class="mb-2">
                <strong>Type:</strong> <i class="fas fa-map-marker-alt me-1"></i> In-person Session
              </p>
              <p v-if="booking.location && !booking.is_online" class="mb-2">
                <strong>Location:</strong> {{ booking.location }}
              </p>
            </div>
            <div class="col-md-6">
              <h6 class="text-muted">Participants</h6>
              <div class="mb-3">
                <div class="d-flex align-items-center mb-2">
                  <div class="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px;">
                    {{ getInitials(booking.tutor?.first_name + ' ' + booking.tutor?.last_name) }}
                  </div>
                  <div>
                    <strong>Tutor:</strong><br>
                    {{ booking.tutor?.first_name }} {{ booking.tutor?.last_name }}
                  </div>
                </div>
                <div class="d-flex align-items-center">
                  <div class="avatar-sm bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px;">
                    {{ getInitials(booking.student?.first_name + ' ' + booking.student?.last_name) }}
                  </div>
                  <div>
                    <strong>Student:</strong><br>
                    {{ booking.student?.first_name }} {{ booking.student?.last_name }}
                  </div>
                </div>
              </div>

              <h6 class="text-muted">Payment</h6>
              <p class="mb-2">
                <strong>Hourly Rate:</strong> ${{ booking.hourly_rate }}
              </p>
              <p class="mb-2">
                <strong>Total Amount:</strong> ${{ booking.total_amount }}
              </p>
              <span :class="getPaymentStatusClass(booking.payment_status)" class="badge">
                {{ formatPaymentStatus(booking.payment_status) }}
              </span>
            </div>
          </div>

          <!-- Meeting Links -->
          <div v-if="booking.is_online && (booking.google_meet_link || booking.zoom_meeting_link)" class="mb-4">
            <h6 class="text-muted">Meeting Links</h6>
            <div v-if="booking.google_meet_link" class="mb-2">
              <a :href="booking.google_meet_link" target="_blank" class="btn btn-outline-primary btn-sm me-2">
                <i class="fab fa-google me-1"></i> Join Google Meet
              </a>
            </div>
            <div v-if="booking.zoom_meeting_link" class="mb-2">
              <a :href="booking.zoom_meeting_link" target="_blank" class="btn btn-outline-primary btn-sm me-2">
                <i class="fab fa-zoom me-1"></i> Join Zoom Meeting
              </a>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="booking.notes" class="mb-4">
            <h6 class="text-muted">Notes</h6>
            <p class="text-muted">{{ booking.notes }}</p>
          </div>

          <!-- Action Buttons based on status and user role -->
          <div class="d-flex gap-2 flex-wrap">
            <button
              v-if="canReschedule"
              class="btn btn-outline-warning"
              @click="showRescheduleModal = true"
            >
              <i class="fas fa-calendar-alt me-2"></i>Reschedule
            </button>

            <button
              v-if="canCancel"
              class="btn btn-outline-danger"
              @click="showCancelModal = true"
            >
              <i class="fas fa-times me-2"></i>Cancel
            </button>

            <button
              v-if="canConfirm"
              class="btn btn-success"
              @click="confirmBooking"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              <i class="fas fa-check me-2"></i>Confirm Booking
            </button>

            <button
              v-if="canComplete"
              class="btn btn-primary"
              @click="completeBooking"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              <i class="fas fa-check-double me-2"></i>Mark as Completed
            </button>

            <button
              v-if="canJoinMeeting"
              class="btn btn-success"
              @click="joinMeeting"
            >
              <i class="fas fa-video me-2"></i>Join Meeting
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Reschedule Modal -->
    <RescheduleModal
      v-if="showRescheduleModal"
      :booking="booking"
      @close="showRescheduleModal = false"
      @rescheduled="handleRescheduled"
    />

    <!-- Cancel Modal -->
    <CancelModal
      v-if="showCancelModal"
      :booking="booking"
      @close="showCancelModal = false"
      @cancelled="handleCancelled"
    />
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useToast } from '../../composables/useToast'
import RescheduleModal from './RescheduleModal.vue'
import CancelModal from './CancelModal.vue'

export default {
  name: 'BookingDetailsModal',
  components: {
    RescheduleModal,
    CancelModal
  },
  props: {
    booking: {
      type: Object,
      required: true
    }
  },
  emits: ['close', 'updated'],
  setup(props, { emit }) {
    const authStore = useAuthStore()
    const { showToast } = useToast()

    // Reactive data
    const loading = ref(false)
    const showRescheduleModal = ref(false)
    const showCancelModal = ref(false)

    // Computed properties
    const isTutor = computed(() => {
      return authStore.userType === 'tutor' && authStore.user?.id === props.booking.tutor_id
    })

    const isStudent = computed(() => {
      return authStore.userType === 'student' && authStore.user?.id === props.booking.student_id
    })

    const canReschedule = computed(() => {
      return ['scheduled', 'confirmed'].includes(props.booking.status) && (isTutor.value || isStudent.value)
    })

    const canCancel = computed(() => {
      return ['scheduled', 'confirmed'].includes(props.booking.status) && (isTutor.value || isStudent.value)
    })

    const canConfirm = computed(() => {
      return props.booking.status === 'scheduled' && isTutor.value
    })

    const canComplete = computed(() => {
      return props.booking.status === 'confirmed' && isTutor.value && isPastBooking()
    })

    const canJoinMeeting = computed(() => {
      return props.booking.is_online &&
             ['confirmed'].includes(props.booking.status) &&
             isWithinMeetingWindow()
    })

    // Methods
    function getInitials(name) {
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }

    function formatDate(dateString) {
      const options = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }
      return new Date(dateString).toLocaleDateString('en-US', options)
    }

    function formatTime(dateString) {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    function calculateDuration(startTime, endTime) {
      const start = new Date(startTime)
      const end = new Date(endTime)
      const duration = (end - start) / (1000 * 60 * 60) // Duration in hours

      if (duration === 1) return '1 hour'
      return `${duration} hours`
    }

    function getStatusClass(status) {
      const classes = {
        scheduled: 'bg-secondary',
        confirmed: 'bg-success',
        completed: 'bg-primary',
        cancelled: 'bg-danger',
        no_show: 'bg-warning'
      }
      return classes[status] || 'bg-secondary'
    }

    function getPaymentStatusClass(status) {
      const classes = {
        pending: 'bg-warning',
        paid: 'bg-success',
        refunded: 'bg-info',
        partially_refunded: 'bg-secondary'
      }
      return classes[status] || 'bg-secondary'
    }

    function formatStatus(status) {
      const formatted = {
        scheduled: 'Scheduled',
        confirmed: 'Confirmed',
        completed: 'Completed',
        cancelled: 'Cancelled',
        no_show: 'No Show'
      }
      return formatted[status] || status
    }

    function formatPaymentStatus(status) {
      const formatted = {
        pending: 'Pending',
        paid: 'Paid',
        refunded: 'Refunded',
        partially_refunded: 'Partially Refunded'
      }
      return formatted[status] || status
    }

    function isPastBooking() {
      return new Date(props.booking.end || props.booking.end_time) < new Date()
    }

    function isWithinMeetingWindow() {
      const now = new Date()
      const startTime = new Date(props.booking.start || props.booking.start_time)
      const endTime = new Date(props.booking.end || props.booking.end_time)

      // Allow joining 15 minutes before start time
      const joinWindow = new Date(startTime.getTime() - 15 * 60 * 1000)

      return now >= joinWindow && now <= endTime
    }

    async function confirmBooking() {
      try {
        loading.value = true

        const response = await fetch(`/api/bookings/${props.booking.id}/confirm`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authStore.token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to confirm booking')
        }

        showToast('Booking confirmed successfully', 'success')
        emit('updated')

      } catch (error) {
        console.error('Error confirming booking:', error)
        showToast('Failed to confirm booking', 'error')
      } finally {
        loading.value = false
      }
    }

    async function completeBooking() {
      try {
        loading.value = true

        const response = await fetch(`/api/bookings/${props.booking.id}/complete`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authStore.token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to complete booking')
        }

        showToast('Booking marked as completed', 'success')
        emit('updated')

      } catch (error) {
        console.error('Error completing booking:', error)
        showToast('Failed to complete booking', 'error')
      } finally {
        loading.value = false
      }
    }

    function joinMeeting() {
      const meetLink = props.booking.google_meet_link || props.booking.zoom_meeting_link
      if (meetLink) {
        window.open(meetLink, '_blank')
      }
    }

    function handleRescheduled() {
      showRescheduleModal.value = false
      emit('updated')
    }

    function handleCancelled() {
      showCancelModal.value = false
      emit('updated')
    }

    return {
      loading,
      showRescheduleModal,
      showCancelModal,
      isTutor,
      isStudent,
      canReschedule,
      canCancel,
      canConfirm,
      canComplete,
      canJoinMeeting,
      getInitials,
      formatDate,
      formatTime,
      calculateDuration,
      getStatusClass,
      getPaymentStatusClass,
      formatStatus,
      formatPaymentStatus,
      confirmBooking,
      completeBooking,
      joinMeeting,
      handleRescheduled,
      handleCancelled
    }
  }
}
</script>

<style scoped>
.modal {
  z-index: 1050;
}

.modal-dialog {
  max-width: 700px;
}

.modal-content {
  background: #2d2d44 !important;
  border: 1px solid rgba(255, 107, 53, 0.3);
  border-radius: 12px;
  color: #ffffff;
}

.modal-header {
  background: #3a3a52;
  border-bottom: 1px solid rgba(255, 107, 53, 0.2);
  border-radius: 12px 12px 0 0;
}

.modal-title {
  color: #ff6b35;
  font-weight: 700;
}

.btn-close {
  filter: invert(1);
  opacity: 0.7;
}

.btn-close:hover {
  opacity: 1;
}

.modal-body {
  background: #2d2d44;
  color: #ffffff;
}

.modal-footer {
  background: #3a3a52;
  border-top: 1px solid rgba(255, 107, 53, 0.2);
  border-radius: 0 0 12px 12px;
}

.badge {
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
}

.bg-secondary {
  background-color: #6c757d !important;
}

.bg-success {
  background-color: #ff6b35 !important;
  color: #ffffff !important;
}

.bg-primary {
  background-color: #4ecdc4 !important;
}

.bg-danger {
  background-color: #dc3545 !important;
}

.bg-warning {
  background-color: #ffa726 !important;
  color: #212529;
}

.bg-info {
  background-color: #17a2b8 !important;
}

.btn-outline-warning {
  border-color: #ffa726;
  color: #ffa726;
  background: transparent;
}

.btn-outline-warning:hover {
  background-color: #ffa726;
  border-color: #ffa726;
  color: #212529;
}

.btn-outline-danger {
  border-color: #dc3545;
  color: #dc3545;
  background: transparent;
}

.btn-outline-danger:hover {
  background-color: #dc3545;
  border-color: #dc3545;
  color: white;
}

.btn-success {
  background-color: #ff6b35;
  border-color: #ff6b35;
  color: #ffffff;
}

.btn-success:hover {
  background-color: #e85a2a;
  border-color: #e85a2a;
}

.btn-secondary {
  background-color: #6c757d;
  border-color: #6c757d;
  color: #ffffff;
}

.btn-secondary:hover {
  background-color: #5a6268;
  border-color: #5a6268;
}

.text-muted {
  color: #aaaaaa !important;
}

h6 {
  color: #ff6b35;
  font-weight: 600;
}

strong {
  color: #ffffff;
}

.avatar-sm {
  font-size: 0.875rem;
  font-weight: 500;
}

.d-flex {
  display: flex;
}

.align-items-center {
  align-items: center;
}

.me-1 {
  margin-right: 0.25rem;
}

.me-2 {
  margin-right: 0.5rem;
}

.mb-1 {
  margin-bottom: 0.25rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.mb-3 {
  margin-bottom: 1rem;
}

.mb-4 {
  margin-bottom: 1.5rem;
}

.gap-2 {
  gap: 0.5rem;
}

.flex-wrap {
  flex-wrap: wrap;
}
</style>