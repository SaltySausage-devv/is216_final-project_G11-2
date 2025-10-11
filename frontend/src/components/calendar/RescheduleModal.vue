<template>
  <div class="modal fade show" style="display: block; background-color: rgba(0, 0, 0, 0.5);">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Reschedule Booking</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <!-- Current Booking Info -->
            <div class="alert alert-info mb-3">
              <strong>Current Booking:</strong><br>
              {{ formatDate(booking.start_time) }} at {{ formatTime(booking.start_time) }}
            </div>

            <!-- New Date Selection -->
            <div class="mb-3">
              <label class="form-label">New Date</label>
              <input
                type="date"
                v-model="newDate"
                class="form-control"
                :min="today"
                required
              >
            </div>

            <!-- New Time Selection -->
            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">Start Time</label>
                <input
                  type="time"
                  v-model="newStartTime"
                  class="form-control"
                  required
                >
              </div>
              <div class="col-md-6">
                <label class="form-label">End Time</label>
                <input
                  type="time"
                  v-model="newEndTime"
                  class="form-control"
                  required
                >
              </div>
            </div>

            <!-- Reason for Rescheduling -->
            <div class="mb-3">
              <label class="form-label">Reason for Rescheduling</label>
              <textarea
                v-model="reason"
                class="form-control"
                rows="3"
                placeholder="Please explain why you need to reschedule..."
                required
              ></textarea>
            </div>

            <!-- Summary -->
            <div v-if="newDate && newStartTime && newEndTime" class="alert alert-success">
              <strong>New Time:</strong><br>
              {{ formatDate(newDate) }} from {{ newStartTime }} to {{ newEndTime }}
              <span v-if="isValidTimeRange" class="text-success">
                ✓ Valid time range
              </span>
              <span v-else class="text-danger">
                ✗ End time must be after start time
              </span>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-warning"
            @click="handleSubmit"
            :disabled="loading || !isValidForm"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            Reschedule Booking
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useToast } from '../../composables/useToast'

export default {
  name: 'RescheduleModal',
  props: {
    booking: {
      type: Object,
      required: true
    }
  },
  emits: ['close', 'rescheduled'],
  setup(props, { emit }) {
    const { showToast } = useToast()

    // Reactive data
    const loading = ref(false)
    const newDate = ref('')
    const newStartTime = ref('')
    const newEndTime = ref('')
    const reason = ref('')

    // Computed properties
    const today = computed(() => {
      return new Date().toISOString().split('T')[0]
    })

    const isValidTimeRange = computed(() => {
      return newStartTime.value && newEndTime.value && newStartTime.value < newEndTime.value
    })

    const isValidForm = computed(() => {
      return newDate.value && newStartTime.value && newEndTime.value && reason.value && isValidTimeRange.value
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

    async function handleSubmit() {
      try {
        loading.value = true

        if (!isValidForm.value) {
          showToast('Please fill in all required fields', 'error')
          return
        }

        // Create new datetime strings
        const newStartDateTime = new Date(`${newDate.value}T${newStartTime.value}`)
        const newEndDateTime = new Date(`${newDate.value}T${newEndTime.value}`)

        const payload = {
          start_time: newStartDateTime.toISOString(),
          end_time: newEndDateTime.toISOString(),
          reschedule_reason: reason.value
        }

        const response = await fetch(`/api/bookings/${props.booking.id}/reschedule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('supabase.token')}`
          },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          throw new Error('Failed to reschedule booking')
        }

        showToast('Booking rescheduled successfully', 'success')
        emit('rescheduled')

      } catch (error) {
        console.error('Error rescheduling booking:', error)
        showToast('Failed to reschedule booking', 'error')
      } finally {
        loading.value = false
      }
    }

    return {
      loading,
      newDate,
      newStartTime,
      newEndTime,
      reason,
      today,
      isValidTimeRange,
      isValidForm,
      formatDate,
      formatTime,
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

.form-label {
  font-weight: 500;
  color: #495057;
}

.alert {
  margin-bottom: 1rem;
}

.alert-info {
  background-color: #d1ecf1;
  border-color: #bee5eb;
  color: #0c5460;
}

.alert-success {
  background-color: #d4edda;
  border-color: #c3e6cb;
  color: #155724;
}

.text-success {
  color: #28a745 !important;
}

.text-danger {
  color: #dc3545 !important;
}

.btn-warning {
  background-color: #ffc107;
  border-color: #ffc107;
  color: #212529;
}

.btn-warning:hover {
  background-color: #e0a800;
  border-color: #e0a800;
  color: #212529;
}

.btn-warning:disabled {
  background-color: #ffc107;
  border-color: #ffc107;
  opacity: 0.6;
}
</style>