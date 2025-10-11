<template>
  <div class="modal fade show" style="display: block; background-color: rgba(0, 0, 0, 0.5);">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Set Availability</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <!-- Availability Type -->
            <div class="mb-3">
              <label class="form-label">Availability Type</label>
              <div class="btn-group w-100" role="group">
                <input
                  type="radio"
                  class="btn-check"
                  id="recurring"
                  v-model="availabilityType"
                  value="recurring"
                >
                <label class="btn btn-outline-primary" for="recurring">Recurring</label>

                <input
                  type="radio"
                  class="btn-check"
                  id="specific"
                  v-model="availabilityType"
                  value="specific"
                >
                <label class="btn btn-outline-primary" for="specific">Specific Date</label>
              </div>
            </div>

            <!-- Recurring Availability -->
            <div v-if="availabilityType === 'recurring'">
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">Day of Week</label>
                  <select v-model="recurringForm.dayOfWeek" class="form-select" required>
                    <option value="">Select Day</option>
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                    <option value="0">Sunday</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Time Zone</label>
                  <select v-model="recurringForm.timezone" class="form-select">
                    <option value="Asia/Singapore">Singapore (SGT)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>

              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">Start Time</label>
                  <input
                    type="time"
                    v-model="recurringForm.startTime"
                    class="form-control"
                    required
                  >
                </div>
                <div class="col-md-6">
                  <label class="form-label">End Time</label>
                  <input
                    type="time"
                    v-model="recurringForm.endTime"
                    class="form-control"
                    required
                  >
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Recurrence</label>
                <select v-model="recurringForm.recurrenceType" class="form-select">
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <!-- Specific Date Availability -->
            <div v-if="availabilityType === 'specific'">
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">Date</label>
                  <input
                    type="date"
                    v-model="specificForm.date"
                    class="form-control"
                    required
                  >
                </div>
                <div class="col-md-6">
                  <label class="form-label">Time Zone</label>
                  <select v-model="specificForm.timezone" class="form-select">
                    <option value="Asia/Singapore">Singapore (SGT)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>

              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">Start Time</label>
                  <input
                    type="time"
                    v-model="specificForm.startTime"
                    class="form-control"
                    required
                  >
                </div>
                <div class="col-md-6">
                  <label class="form-label">End Time</label>
                  <input
                    type="time"
                    v-model="specificForm.endTime"
                    class="form-control"
                    required
                  >
                </div>
              </div>

              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">Hourly Rate ($)</label>
                  <input
                    type="number"
                    v-model="specificForm.hourlyRate"
                    class="form-control"
                    step="0.01"
                    min="0"
                    placeholder="Optional"
                  >
                </div>
                <div class="col-md-6">
                  <label class="form-label">Location</label>
                  <input
                    type="text"
                    v-model="specificForm.location"
                    class="form-control"
                    placeholder="Optional"
                  >
                </div>
              </div>
            </div>

            <!-- Common Fields -->
            <div class="mb-3">
              <label class="form-label">Notes (Optional)</label>
              <textarea
                v-model="notes"
                class="form-control"
                rows="3"
                placeholder="Add any notes about this availability..."
              ></textarea>
            </div>

            <!-- Quick Time Slots -->
            <div class="mb-3">
              <label class="form-label">Quick Time Slots</label>
              <div class="row g-2">
                <div class="col-6 col-md-3">
                  <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm w-100"
                    @click="setQuickTime('09:00', '10:00')"
                  >
                    9:00 AM - 10:00 AM
                  </button>
                </div>
                <div class="col-6 col-md-3">
                  <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm w-100"
                    @click="setQuickTime('10:00', '11:00')"
                  >
                    10:00 AM - 11:00 AM
                  </button>
                </div>
                <div class="col-6 col-md-3">
                  <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm w-100"
                    @click="setQuickTime('14:00', '15:00')"
                  >
                    2:00 PM - 3:00 PM
                  </button>
                </div>
                <div class="col-6 col-md-3">
                  <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm w-100"
                    @click="setQuickTime('16:00', '17:00')"
                  >
                    4:00 PM - 5:00 PM
                  </button>
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
            class="btn btn-primary"
            @click="handleSubmit"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            Save Availability
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue'
import { useToast } from '../../composables/useToast'

export default {
  name: 'AvailabilityModal',
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const { showToast } = useToast()

    // Reactive data
    const loading = ref(false)
    const availabilityType = ref('recurring')
    const notes = ref('')

    // Form data
    const recurringForm = reactive({
      dayOfWeek: '',
      startTime: '',
      endTime: '',
      timezone: 'Asia/Singapore',
      recurrenceType: 'weekly'
    })

    const specificForm = reactive({
      date: '',
      startTime: '',
      endTime: '',
      timezone: 'Asia/Singapore',
      hourlyRate: '',
      location: ''
    })

    // Computed properties
    const currentForm = computed(() => {
      return availabilityType.value === 'recurring' ? recurringForm : specificForm
    })

    // Methods
    function setQuickTime(startTime, endTime) {
      if (availabilityType.value === 'recurring') {
        recurringForm.startTime = startTime
        recurringForm.endTime = endTime
      } else {
        specificForm.startTime = startTime
        specificForm.endTime = endTime
      }
    }

    async function handleSubmit() {
      try {
        loading.value = true

        // Validate time range
        const startTime = currentForm.value.startTime
        const endTime = currentForm.value.endTime

        if (!startTime || !endTime) {
          showToast('Please select both start and end times', 'error')
          return
        }

        if (startTime >= endTime) {
          showToast('End time must be after start time', 'error')
          return
        }

        // Prepare payload
        let payload = {
          is_available: true,
          notes: notes.value || null
        }

        if (availabilityType.value === 'recurring') {
          if (!recurringForm.dayOfWeek) {
            showToast('Please select a day of the week', 'error')
            return
          }

          payload = {
            ...payload,
            day_of_week: parseInt(recurringForm.dayOfWeek),
            start_time: recurringForm.startTime,
            end_time: recurringForm.endTime,
            timezone: recurringForm.timezone,
            recurrence_type: recurringForm.recurrenceType
          }

          // Create recurring availability
          const response = await fetch('/api/calendar/availability', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('supabase.token')}`
            },
            body: JSON.stringify(payload)
          })

          if (!response.ok) {
            throw new Error('Failed to create recurring availability')
          }

        } else {
          if (!specificForm.date) {
            showToast('Please select a date', 'error')
            return
          }

          payload = {
            ...payload,
            specific_date: specificForm.date,
            start_time: specificForm.startTime,
            end_time: specificForm.endTime,
            timezone: specificForm.timezone,
            hourly_rate: specificForm.hourlyRate ? parseFloat(specificForm.hourlyRate) : null,
            location: specificForm.location || null
          }

          // Create specific date availability
          const response = await fetch('/api/calendar/date-availability', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('supabase.token')}`
            },
            body: JSON.stringify(payload)
          })

          if (!response.ok) {
            throw new Error('Failed to create date availability')
          }
        }

        showToast('Availability saved successfully', 'success')
        emit('saved')

      } catch (error) {
        console.error('Error saving availability:', error)
        showToast('Failed to save availability', 'error')
      } finally {
        loading.value = false
      }
    }

    return {
      loading,
      availabilityType,
      notes,
      recurringForm,
      specificForm,
      setQuickTime,
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
  max-width: 600px;
}

.form-label {
  font-weight: 500;
  color: #495057;
}

.btn-group .btn-check:checked + .btn {
  background-color: #007bff;
  border-color: #007bff;
}

.btn-outline-secondary:hover {
  background-color: #6c757d;
  border-color: #6c757d;
}

/* Quick time slot buttons */
.btn-outline-secondary.btn-sm {
  font-size: 0.875rem;
  padding: 0.375rem 0.5rem;
}

/* Form validation styling */
.form-control:invalid {
  border-color: #dc3545;
}

.form-select:invalid {
  border-color: #dc3545;
}
</style>