<template>
  <div
    class="modal fade show"
    style="display: block; background-color: rgba(0, 0, 0, 0.5)"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Reschedule Booking</h5>
          <button
            type="button"
            class="btn-close"
            @click="$emit('close')"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <!-- Current Booking Info -->
            <div class="alert alert-info mb-3">
              <strong>Current Booking:</strong><br />
              {{ formatDate(booking.start_time) }} at
              {{ formatTime(booking.start_time) }}
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
              />
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
                />
              </div>
              <div class="col-md-6">
                <label class="form-label">End Time</label>
                <input
                  type="time"
                  v-model="newEndTime"
                  class="form-control"
                  required
                />
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
            <div
              v-if="newDate && newStartTime && newEndTime"
              class="alert alert-success"
            >
              <strong>New Time:</strong><br />
              {{ formatDate(newDate) }} from {{ newStartTime }} to
              {{ newEndTime }}
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
          <button
            type="button"
            class="btn btn-secondary"
            @click="$emit('close')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-warning"
            @click="handleSubmit"
            :disabled="loading || !isValidForm"
          >
            <span
              v-if="loading"
              class="spinner-border spinner-border-sm me-2"
            ></span>
            Send Reschedule Request
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from "vue";
import { useToast } from "../../composables/useToast";
import { useAuthStore } from "../../stores/auth";

export default {
  name: "RescheduleModal",
  props: {
    booking: {
      type: Object,
      required: true,
    },
  },
  emits: ["close", "rescheduled"],
  setup(props, { emit }) {
    const { showToast } = useToast();
    const authStore = useAuthStore();

    // Reactive data
    const loading = ref(false);
    const newDate = ref("");
    const newStartTime = ref("");
    const newEndTime = ref("");
    const reason = ref("");

    // Computed properties
    const today = computed(() => {
      return new Date().toISOString().split("T")[0];
    });

    const isValidTimeRange = computed(() => {
      return (
        newStartTime.value &&
        newEndTime.value &&
        newStartTime.value < newEndTime.value
      );
    });

    const isValidForm = computed(() => {
      return (
        newDate.value &&
        newStartTime.value &&
        newEndTime.value &&
        reason.value &&
        isValidTimeRange.value
      );
    });

    // Methods
    function formatDate(dateString) {
      const options = {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      };
      return new Date(dateString).toLocaleDateString("en-US", options);
    }

    function formatTime(dateString) {
      return new Date(dateString).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    async function handleSubmit() {
      try {
        loading.value = true;

        if (!isValidForm.value) {
          showToast("Please fill in all required fields", "error");
          return;
        }

        // Create new datetime strings
        const newStartDateTime = new Date(
          `${newDate.value}T${newStartTime.value}`
        );
        const newEndDateTime = new Date(`${newDate.value}T${newEndTime.value}`);

        const payload = {
          start_time: newStartDateTime.toISOString(),
          end_time: newEndDateTime.toISOString(),
          reschedule_reason: reason.value,
        };

        const response = await fetch(
          `/api/calendar/bookings/${props.booking.id}/reschedule`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authStore.token}`,
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to send reschedule request"
          );
        }

        const result = await response.json();
        showToast(
          result.message ||
            "Reschedule request sent successfully. Waiting for confirmation.",
          "success"
        );
        emit("rescheduled");
      } catch (error) {
        console.error("Error rescheduling booking:", error);
        showToast("Failed to reschedule booking", "error");
      } finally {
        loading.value = false;
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
      handleSubmit,
    };
  },
};
</script>

<style scoped>
.modal {
  z-index: 1060;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.modal-dialog {
  max-width: 600px;
  margin: 2rem auto;
}

.modal-content {
  background: rgba(45, 45, 68, 0.98) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 107, 53, 0.2);
  border-radius: 20px;
  color: #ffffff;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 107, 53, 0.1);
  overflow: hidden;
}

.modal-header {
  background: linear-gradient(135deg, rgba(58, 58, 82, 0.95) 0%, rgba(45, 45, 68, 0.95) 100%);
  border-bottom: 1px solid rgba(255, 107, 53, 0.2);
  border-radius: 20px 20px 0 0;
  padding: 1.75rem 2rem;
}

.modal-title {
  color: #ff6b35;
  font-weight: 800;
  font-size: 1.5rem;
  letter-spacing: -0.02em;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.btn-close {
  filter: invert(1);
  opacity: 0.6;
  transition: all 0.2s ease;
  font-size: 1.5rem;
}

.btn-close:hover {
  opacity: 1;
  transform: scale(1.1);
}

.modal-body {
  background: rgba(45, 45, 68, 0.98);
  color: #ffffff;
  padding: 2rem;
  font-size: 0.95rem;
  line-height: 1.6;
}

.modal-footer {
  background: linear-gradient(135deg, rgba(58, 58, 82, 0.95) 0%, rgba(45, 45, 68, 0.95) 100%);
  border-top: 1px solid rgba(255, 107, 53, 0.2);
  border-radius: 0 0 20px 20px;
  padding: 1.5rem 2rem;
}

.form-label {
  font-weight: 700;
  color: #ff6b35;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-control {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 107, 53, 0.3);
  color: #ffffff;
  border-radius: 12px;
  padding: 0.875rem 1rem;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.form-control:focus {
  background: rgba(255, 255, 255, 0.15);
  border-color: #ff6b35;
  color: #ffffff;
  box-shadow: 0 0 0 0.25rem rgba(255, 107, 53, 0.2), 0 1px 3px rgba(0, 0, 0, 0.3);
  outline: none;
  transform: translateY(-1px);
}

.form-control::placeholder {
  color: rgba(255, 255, 255, 0.6);
  font-weight: 400;
}

.alert {
  margin-bottom: 1.5rem;
  border-radius: 12px;
  padding: 1.25rem;
  border: none;
  font-size: 0.9rem;
  backdrop-filter: blur(10px);
}

.alert-info {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%);
  color: #ffffff;
  border-left: 4px solid #3b82f6;
}

.alert-success {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%);
  color: #ffffff;
  border-left: 4px solid #10b981;
}

.text-success {
  color: #10b981 !important;
  font-weight: 700;
}

.text-danger {
  color: #dc2626 !important;
  font-weight: 700;
}

.btn-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
  color: #ffffff;
  font-weight: 700;
  padding: 0.875rem 1.75rem;
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  font-size: 0.9rem;
  letter-spacing: 0.02em;
}

.btn-warning:hover {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
  color: #ffffff;
}

.btn-warning:disabled {
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  border: none;
  color: #ffffff;
  font-weight: 700;
  padding: 0.875rem 1.75rem;
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
  font-size: 0.9rem;
  letter-spacing: 0.02em;
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(107, 114, 128, 0.4);
}

textarea.form-control {
  resize: vertical;
  min-height: 100px;
}

/* Custom styling for time inputs */
input[type="date"],
input[type="time"] {
  color-scheme: dark;
}

input[type="date"]::-webkit-calendar-picker-indicator,
input[type="time"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
}
</style>
