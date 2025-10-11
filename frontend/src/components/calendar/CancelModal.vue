<template>
  <div class="modal fade show" style="display: block; background-color: rgba(0, 0, 0, 0.5);">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Cancel Booking</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <!-- Warning Alert -->
          <div class="alert alert-warning" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>Warning:</strong> This action cannot be undone. The booking will be cancelled and may affect payment processing.
          </div>

          <!-- Booking Details -->
          <div class="mb-3">
            <strong>Booking Details:</strong><br>
            <div class="text-muted">
              {{ formatDate(booking.start || booking.start_time) }} at {{ formatTime(booking.start || booking.start_time) }}<br>
              Duration: {{ calculateDuration(booking.start || booking.start_time, booking.end || booking.end_time) }}<br>
              Total: ${{ booking.total_amount || '50' }}
            </div>
          </div>

          <!-- Cancellation Reason -->
          <form @submit.prevent="handleSubmit">
            <div class="mb-3">
              <label class="form-label">Cancellation Reason <span class="text-danger">*</span></label>
              <select v-model="reason" class="form-select" required>
                <option value="">Select a reason</option>
                <option value="tutor_unavailable">Tutor unavailable</option>
                <option value="student_unavailable">Student unavailable</option>
                <option value="emergency">Emergency</option>
                <option value="scheduling_conflict">Scheduling conflict</option>
                <option value="technical_issue">Technical issue</option>
                <option value="personal_reason">Personal reason</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Additional Details</label>
              <textarea
                v-model="details"
                class="form-control"
                rows="3"
                placeholder="Please provide more details about the cancellation..."
              ></textarea>
            </div>

            <!-- Refund Information -->
            <div class="alert alert-info" role="alert">
              <i class="fas fa-info-circle me-2"></i>
              <strong>Refund Policy:</strong><br>
              <span v-if="isMoreThan24Hours">
                Full refund will be processed since cancellation is more than 24 hours before the session.
              </span>
              <span v-else>
                Partial refund may apply since cancellation is less than 24 hours before the session.
              </span>
            </div>

            <!-- Confirmation Checkbox -->
            <div class="mb-3">
              <div class="form-check">
                <input
                  type="checkbox"
                  v-model="confirmed"
                  class="form-check-input"
                  id="confirmCancel"
                  required
                >
                <label class="form-check-label" for="confirmCancel">
                  I understand that this cancellation is permanent and may affect my refund eligibility.
                </label>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            Keep Booking
          </button>
          <button
            type="button"
            class="btn btn-danger"
            @click="handleSubmit"
            :disabled="loading || !canSubmit"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            Cancel Booking
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useToast } from '../../composables/useToast'

export default {
  name: 'CancelModal',
  props: {
    booking: {
      type: Object,
      required: true
    }
  },
  emits: ['close', 'cancelled'],
  setup(props, { emit }) {
    const authStore = useAuthStore()
    const { showToast } = useToast()

    // Reactive data
    const loading = ref(false)
    const reason = ref('')
    const details = ref('')
    const confirmed = ref(false)

    // Computed properties
    const isMoreThan24Hours = computed(() => {
      const bookingTime = new Date(props.booking.start || props.booking.start_time)
      const now = new Date()
      const timeDiff = bookingTime - now
      const hoursDiff = timeDiff / (1000 * 60 * 60)
      return hoursDiff > 24
    })

    const canSubmit = computed(() => {
      return reason.value && confirmed.value
    })

    // Methods
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

    async function handleSubmit() {
      try {
        loading.value = true

        if (!canSubmit.value) {
          showToast('Please fill in all required fields and confirm the cancellation', 'error')
          return
        }

        const payload = {
          cancellation_reason: reason.value,
          cancellation_details: details.value || null
        }

        const response = await fetch(`/api/calendar/bookings/${props.booking.id}/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authStore.token}`
          },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Cancel booking failed:', response.status, errorData)
          throw new Error(errorData.error || 'Failed to cancel booking')
        }

        const result = await response.json()

        showToast(result.message || 'Booking cancelled successfully', 'success')
        emit('cancelled')

      } catch (error) {
        console.error('Error cancelling booking:', error)
        showToast('Failed to cancel booking', 'error')
      } finally {
        loading.value = false
      }
    }

    return {
      loading,
      reason,
      details,
      confirmed,
      isMoreThan24Hours,
      canSubmit,
      formatDate,
      formatTime,
      calculateDuration,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.modal {
  z-index: 1060;
}

.modal-dialog {
  max-width: 500px;
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

.form-label {
  font-weight: 500;
  color: #ffffff;
}

.form-control, .form-select {
  background: #3a3a52;
  border: 1px solid rgba(255, 107, 53, 0.3);
  color: #ffffff;
}

.form-control:focus, .form-select:focus {
  background: #3a3a52;
  border-color: #ff6b35;
  color: #ffffff;
  box-shadow: 0 0 0 0.2rem rgba(255, 107, 53, 0.25);
}

.form-control::placeholder {
  color: #aaaaaa;
}

.form-select option {
  background: #2d2d44;
  color: #ffffff;
}

.alert {
  margin-bottom: 1rem;
  border-radius: 8px;
}

.alert-warning {
  background-color: rgba(255, 167, 38, 0.15);
  border-color: rgba(255, 167, 38, 0.3);
  color: #ffa726;
}

.alert-info {
  background-color: rgba(78, 205, 196, 0.15);
  border-color: rgba(78, 205, 196, 0.3);
  color: #4ecdc4;
}

.text-danger {
  color: #ff6b6b !important;
}

.text-muted {
  color: #aaaaaa !important;
}

strong {
  color: #ffffff;
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

.btn-danger {
  background-color: #dc3545;
  border-color: #dc3545;
  color: #ffffff;
}

.btn-danger:hover {
  background-color: #c82333;
  border-color: #c82333;
}

.btn-danger:disabled {
  background-color: #dc3545;
  border-color: #dc3545;
  opacity: 0.6;
}

.form-check-input {
  background-color: #3a3a52;
  border-color: rgba(255, 107, 53, 0.3);
}

.form-check-input:checked {
  background-color: #dc3545;
  border-color: #dc3545;
}

.form-check-input:focus {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.form-check-label {
  color: #ffffff;
}

.me-2 {
  margin-right: 0.5rem;
}
</style>