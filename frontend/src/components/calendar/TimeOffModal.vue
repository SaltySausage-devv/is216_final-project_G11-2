<template>
  <div class="modal fade show" style="display: block; background-color: rgba(0, 0, 0, 0.5);">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Add Time Off</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <!-- Date Range -->
            <div class="mb-3">
              <label class="form-label">Date Range</label>
              <div class="row">
                <div class="col-md-6">
                  <label class="form-label text-muted small">Start Date</label>
                  <input
                    type="date"
                    v-model="startDate"
                    class="form-control"
                    :min="today"
                    required
                  >
                </div>
                <div class="col-md-6">
                  <label class="form-label text-muted small">End Date</label>
                  <input
                    type="date"
                    v-model="endDate"
                    class="form-control"
                    :min="startDate"
                    required
                  >
                </div>
              </div>
            </div>

            <!-- Recurring Annually -->
            <div class="mb-3">
              <div class="form-check">
                <input
                  type="checkbox"
                  v-model="isRecurringAnnually"
                  class="form-check-input"
                  id="recurring"
                >
                <label class="form-check-label" for="recurring">
                  Repeat annually (e.g., for holidays)
                </label>
              </div>
            </div>

            <!-- Reason -->
            <div class="mb-3">
              <label class="form-label">Reason (Optional)</label>
              <textarea
                v-model="reason"
                class="form-control"
                rows="3"
                placeholder="e.g., Vacation, Holiday, Personal time..."
              ></textarea>
            </div>

            <!-- Quick Templates -->
            <div class="mb-3">
              <label class="form-label">Quick Templates</label>
              <div class="row g-2">
                <div class="col-6">
                  <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm w-100"
                    @click="setQuickTimeOff('single')"
                  >
                    Single Day
                  </button>
                </div>
                <div class="col-6">
                  <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm w-100"
                    @click="setQuickTimeOff('weekend')"
                  >
                    This Weekend
                  </button>
                </div>
                <div class="col-6">
                  <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm w-100"
                    @click="setQuickTimeOff('week')"
                  >
                    One Week
                  </button>
                </div>
                <div class="col-6">
                  <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm w-100"
                    @click="setQuickTimeOff('two-weeks')"
                  >
                    Two Weeks
                  </button>
                </div>
              </div>
            </div>

            <!-- Conflict Warning -->
            <div v-if="hasConflicts" class="alert alert-warning" role="alert">
              <i class="fas fa-exclamation-triangle me-2"></i>
              <strong>Warning:</strong> You have existing bookings or availability during this time.
              Adding time off will override your availability.
            </div>

            <!-- Summary -->
            <div v-if="startDate && endDate" class="alert alert-info" role="alert">
              <i class="fas fa-info-circle me-2"></i>
              <strong>Time Off Summary:</strong>
              <div class="mt-2">
                <span v-if="isSameDay">
                  {{ formatDate(startDate) }} (Single day)
                </span>
                <span v-else>
                  {{ formatDate(startDate) }} to {{ formatDate(endDate) }}
                  <span class="text-muted">({{ calculateDays() }} days)</span>
                </span>
                <div v-if="isRecurringAnnually" class="small text-muted mt-1">
                  <i class="fas fa-repeat me-1"></i>
                  This will repeat every year
                </div>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-danger"
            @click="handleSubmit"
            :disabled="loading || !isValidDateRange"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            Add Time Off
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useToast } from '../../composables/useToast'

export default {
  name: 'TimeOffModal',
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const { showToast } = useToast()

    // Reactive data
    const loading = ref(false)
    const startDate = ref('')
    const endDate = ref('')
    const reason = ref('')
    const isRecurringAnnually = ref(false)
    const hasConflicts = ref(false)

    // Computed properties
    const today = computed(() => {
      return new Date().toISOString().split('T')[0]
    })

    const isSameDay = computed(() => {
      return startDate.value === endDate.value
    })

    const isValidDateRange = computed(() => {
      return startDate.value && endDate.value && startDate.value <= endDate.value
    })

    // Watch for date changes to check conflicts
    watch([startDate, endDate], async () => {
      if (isValidDateRange.value) {
        await checkConflicts()
      } else {
        hasConflicts.value = false
      }
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

    function calculateDays() {
      if (!startDate.value || !endDate.value) return 0

      const start = new Date(startDate.value)
      const end = new Date(endDate.value)
      const diffTime = Math.abs(end - start)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

      return diffDays
    }

    function setQuickTimeOff(type) {
      const today = new Date()

      switch (type) {
        case 'single':
          startDate.value = today.toISOString().split('T')[0]
          endDate.value = today.toISOString().split('T')[0]
          break

        case 'weekend':
          const saturday = new Date(today)
          saturday.setDate(today.getDate() + (6 - today.getDay()))
          const sunday = new Date(saturday)
          sunday.setDate(saturday.getDate() + 1)

          startDate.value = saturday.toISOString().split('T')[0]
          endDate.value = sunday.toISOString().split('T')[0]
          break

        case 'week':
          startDate.value = today.toISOString().split('T')[0]
          const weekEnd = new Date(today)
          weekEnd.setDate(today.getDate() + 6)
          endDate.value = weekEnd.toISOString().split('T')[0]
          break

        case 'two-weeks':
          startDate.value = today.toISOString().split('T')[0]
          const twoWeeksEnd = new Date(today)
          twoWeeksEnd.setDate(today.getDate() + 13)
          endDate.value = twoWeeksEnd.toISOString().split('T')[0]
          break
      }
    }

    async function checkConflicts() {
      try {
        const response = await fetch('/api/calendar/check-conflicts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('supabase.token')}`
          },
          body: JSON.stringify({
            start_date: startDate.value,
            end_date: endDate.value
          })
        })

        if (response.ok) {
          const { hasConflicts: conflicts } = await response.json()
          hasConflicts.value = conflicts
        }
      } catch (error) {
        console.error('Error checking conflicts:', error)
        hasConflicts.value = false
      }
    }

    async function handleSubmit() {
      try {
        loading.value = true

        if (!isValidDateRange.value) {
          showToast('Please select a valid date range', 'error')
          return
        }

        const payload = {
          start_date: startDate.value,
          end_date: endDate.value,
          reason: reason.value || null,
          is_recurring_annually: isRecurringAnnually.value
        }

        const response = await fetch('/api/calendar/time-off', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('supabase.token')}`
          },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          throw new Error('Failed to add time off')
        }

        showToast('Time off added successfully', 'success')
        emit('saved')

      } catch (error) {
        console.error('Error adding time off:', error)
        showToast('Failed to add time off', 'error')
      } finally {
        loading.value = false
      }
    }

    return {
      loading,
      startDate,
      endDate,
      reason,
      isRecurringAnnually,
      hasConflicts,
      today,
      isSameDay,
      isValidDateRange,
      formatDate,
      calculateDays,
      setQuickTimeOff,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.modal {
  z-index: 1050;
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

.alert-warning {
  background-color: #fff3cd;
  border-color: #ffeaa7;
  color: #856404;
}

.alert-info {
  background-color: #d1ecf1;
  border-color: #bee5eb;
  color: #0c5460;
}

/* Quick template buttons */
.btn-outline-secondary.btn-sm {
  font-size: 0.875rem;
  padding: 0.375rem 0.5rem;
}

.btn-outline-secondary:hover {
  background-color: #6c757d;
  border-color: #6c757d;
  color: white;
}

/* Form styling */
.form-control:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-check-input:checked {
  background-color: #007bff;
  border-color: #007bff;
}

.form-check-input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

/* Summary styling */
.text-muted {
  color: #6c757d !important;
}

.small {
  font-size: 0.875em;
}

.mt-1 {
  margin-top: 0.25rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.me-1 {
  margin-right: 0.25rem;
}

.me-2 {
  margin-right: 0.5rem;
}
</style>