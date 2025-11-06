<template>
  <div
    class="modal fade show"
    style="display: block; background-color: rgba(0, 0, 0, 0.5)"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Cancel Booking</h5>
          <button
            type="button"
            class="btn-close"
            @click="$emit('close')"
          ></button>
        </div>
        <div class="modal-body">
          <!-- Warning Alert -->
          <div class="alert alert-warning" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>Warning:</strong> This action cannot be undone. The booking
            will be cancelled and credit refunds will be processed according to
            the 24-hour policy.
          </div>

          <!-- Booking Details -->
          <div class="mb-3">
            <strong>Booking Details:</strong><br />
            <div class="text-muted">
              {{ formatDate(booking.start || booking.start_time) }} at
              {{ formatTime(booking.start || booking.start_time) }}<br />
              Duration:
              {{
                calculateDuration(
                  booking.start || booking.start_time,
                  booking.end || booking.end_time
                )
              }}<br />
              Total: {{ actualCredits }} credits
              <br />
              <small class="text-info">
                (Rate: {{ booking.hourly_rate || "N/A" }} credits/hour)
              </small>
            </div>
          </div>

          <!-- Cancellation Reason -->
          <form @submit.prevent="handleSubmit">
            <div class="mb-3">
              <label class="form-label"
                >Cancellation Reason <span class="text-danger">*</span></label
              >
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
            <div class="alert alert-info" role="alert" v-if="!isTutor">
              <i class="fas fa-info-circle me-2"></i>
              <strong>Credit Refund Policy:</strong><br />
              <span v-if="isMoreThan24Hours">
                ✅ <strong>Full credit refund:</strong> You will receive back
                {{ actualCredits }} credits since cancellation is more than 24
                hours before the session. The tutor will lose their credits for
                this session.
              </span>
              <span v-else>
                ❌ <strong>No credit refund:</strong> You will not receive
                credits back since cancellation is less than 24 hours before the
                session. The tutor will still lose their credits for this
                session.
              </span>
            </div>

            <!-- Tutor Penalty Points Policy -->
            <div class="alert alert-warning" role="alert" v-if="isTutor">
              <i class="fas fa-exclamation-triangle me-2"></i>
              <strong>Tutor Cancellation Policy:</strong><br />
              <span v-if="isMoreThan24Hours">
                ✅ <strong>No penalty points:</strong> Since you are cancelling
                more than 24 hours before the session, you will receive no
                penalty points. The student will receive a full credit refund.
              </span>
              <span v-else>
                ⚠️ <strong>1 penalty point:</strong> Since you are cancelling
                less than 24 hours before the session, you will receive 1
                penalty point. The student will not receive a credit refund.
              </span>
              <br /><br />
              <div class="alert alert-danger" role="alert">
                <i class="fas fa-ban me-2"></i>
                <strong>Account Suspension Warning:</strong> If you accumulate 5
                penalty points, your account will be suspended.
              </div>
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
                />
                <label class="form-check-label" for="confirmCancel">
                  <span v-if="!isTutor">
                    I understand that this cancellation is permanent and
                    {{
                      isMoreThan24Hours
                        ? "I will receive a full credit refund"
                        : "I will not receive any credit refund"
                    }}.
                  </span>
                  <span v-else>
                    I understand that this cancellation is permanent and
                    {{
                      isMoreThan24Hours
                        ? "I will receive no penalty points"
                        : "I will receive 1 penalty point"
                    }}.
                  </span>
                </label>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="$emit('close')"
          >
            Keep Booking
          </button>
          <button
            type="button"
            class="btn btn-danger"
            @click="
              () => {
                console.log('🚨 FRONTEND: Cancel button clicked!');
                handleSubmit();
              }
            "
            :disabled="loading || !canSubmit"
          >
            <span
              v-if="loading"
              class="spinner-border spinner-border-sm me-2"
            ></span>
            Cancel Booking
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from "vue";
import { useAuthStore } from "../../stores/auth";
import { useToast } from "../../composables/useToast";

export default {
  name: "CancelModal",
  props: {
    booking: {
      type: Object,
      required: true,
    },
  },
  emits: ["close", "cancelled"],
  setup(props, { emit }) {
    const authStore = useAuthStore();
    const { showToast } = useToast();

    // Reactive data
    const loading = ref(false);
    const reason = ref("");
    const details = ref("");
    const confirmed = ref(false);

    // Computed properties
    const isMoreThan24Hours = computed(() => {
      const bookingTime = new Date(
        props.booking.start || props.booking.start_time
      );
      const now = new Date();
      const timeDiff = bookingTime - now;
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      return hoursDiff > 24;
    });

    const isTutor = computed(() => {
      return authStore.userType === "tutor";
    });

    const canSubmit = computed(() => {
      const can = reason.value && confirmed.value;
      console.log("🚨 FRONTEND: canSubmit check:", {
        reason: reason.value,
        confirmed: confirmed.value,
        canSubmit: can,
      });
      return can;
    });

    // Calculate actual credits for this booking
    const actualCredits = computed(() => {
      if (
        props.booking.hourly_rate &&
        (props.booking.start_time || props.booking.start) &&
        (props.booking.end_time || props.booking.end)
      ) {
        const startTime = props.booking.start_time || props.booking.start;
        const endTime = props.booking.end_time || props.booking.end;
        const duration =
          (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60);
        const total = props.booking.hourly_rate * duration;
        // Always format to 2 decimal places
        const calculated = parseFloat(total.toFixed(2)).toFixed(2);
        return calculated;
      }
      // Fallback to total_amount if available, otherwise use a default
      // If total_amount is a number, format it to 2 decimal places
      if (props.booking.total_amount && typeof props.booking.total_amount === 'number') {
        return parseFloat(props.booking.total_amount.toFixed(2)).toFixed(2);
      }
      return props.booking.total_amount || "50.00";
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

    function calculateDuration(startTime, endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const duration = (end - start) / (1000 * 60 * 60); // Duration in hours

      if (duration === 1) return "1 hour";
      return `${duration} hours`;
    }

    async function handleSubmit() {
      try {
        loading.value = true;

        if (!canSubmit.value) {
          showToast(
            "Please fill in all required fields and confirm the cancellation",
            "error"
          );
          return;
        }

        const payload = {
          cancellation_reason: reason.value,
          cancellation_details: details.value || null,
        };

        console.log(
          "🚨 FRONTEND: Attempting to cancel booking:",
          props.booking.id
        );
        console.log("🚨 FRONTEND: Payload:", payload);
        console.log("🚨 FRONTEND: Auth token available:", !!authStore.token);

        const response = await fetch(
          `/api/calendar/bookings/${props.booking.id}/cancel`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authStore.token}`,
            },
            body: JSON.stringify(payload),
          }
        );

        console.log("🚨 FRONTEND: Response status:", response.status);
        console.log("🚨 FRONTEND: Response ok:", response.ok);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Cancel booking failed:", response.status, errorData);
          throw new Error(errorData.error || "Failed to cancel booking");
        }

        const result = await response.json();

        // Show appropriate success message based on refund policy
        let successMessage = "Booking cancelled successfully";
        if (result.refundPolicy) {
          if (result.refundPolicy.studentRefunded) {
            const refundAmount = typeof result.refundPolicy.creditsToRefund === 'number' 
              ? result.refundPolicy.creditsToRefund.toFixed(2)
              : parseFloat(result.refundPolicy.creditsToRefund || 0).toFixed(2);
            successMessage = `Booking cancelled successfully. You will receive ${refundAmount} credits back.`;
          } else {
            successMessage =
              "Booking cancelled successfully. No credit refund due to late cancellation.";
          }
        }

        // If tutor cancelled, refresh user data to update penalty points immediately
        if (isTutor.value) {
          console.log('🔄 Refreshing user data to update penalty points...');
          try {
            await authStore.refreshUserData();
            console.log('✅ User data refreshed, penalty points updated');
          } catch (error) {
            console.error('❌ Error refreshing user data:', error);
            // Don't fail the cancellation if refresh fails
          }
        }

        showToast(successMessage, "success");
        emit("cancelled");
      } catch (error) {
        console.error("Error cancelling booking:", error);
        showToast("Failed to cancel booking", "error");
      } finally {
        loading.value = false;
      }
    }

    return {
      loading,
      reason,
      details,
      confirmed,
      isMoreThan24Hours,
      isTutor,
      canSubmit,
      actualCredits,
      formatDate,
      formatTime,
      calculateDuration,
      handleSubmit,
    };
  },
};
</script>

<style scoped>
.modal {
  z-index: 1060;
}

.modal-dialog {
  max-width: 500px;
}

.modal-content {
  background: rgba(26, 26, 26, 0.98) !important;
  backdrop-filter: blur(12px);
  border: 2px solid var(--cyber-orange, #ff8c42) !important;
  border-radius: 20px;
  color: #ffffff;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0,0,0,0.1);
}

.modal-header {
  background: linear-gradient(135deg, rgba(28,28,28,0.95) 0%, rgba(24,24,24,0.95) 100%);
  border-bottom: 2px solid var(--cyber-orange, #ff8c42);
  border-radius: 20px 20px 0 0;
  padding: 1.25rem 1.5rem;
}

.modal-title {
  color: var(--cyber-orange, #ff8c42);
  font-weight: 800;
  font-size: 1.5rem;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

.btn-close {
  filter: invert(1);
  opacity: 0.7;
}

.btn-close:hover {
  opacity: 1;
}

.modal-body {
  background: rgba(26, 26, 26, 0.9);
  color: #ffffff;
  padding: 1.75rem 1.5rem;
}

.modal-footer {
  background: linear-gradient(135deg, rgba(24,24,24,0.95) 0%, rgba(28,28,28,0.95) 100%);
  border-top: 2px solid rgba(255, 140, 66, 0.3);
  border-radius: 0 0 20px 20px;
  padding: 1.25rem 1.5rem;
}

.form-label {
  font-weight: 500;
  color: #ffffff;
}

.form-control,
.form-select {
  background: rgba(42, 42, 42, 0.8) !important;
  border: 2px solid rgba(255, 140, 66, 0.3) !important;
  color: #ffffff !important;
  border-radius: 8px;
}

.form-control:focus,
.form-select:focus {
  background: rgba(42, 42, 42, 0.95) !important;
  border-color: var(--cyber-orange, #ff8c42) !important;
  color: #ffffff !important;
  box-shadow: 0 0 15px rgba(255, 140, 66, 0.3) !important;
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
  background-color: rgba(255, 140, 66, 0.15);
  border-color: rgba(255, 140, 66, 0.3);
  color: #ff8c42;
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

/* Account Suspension Warning - Make it more visible */
.alert-danger {
  background-color: #dc3545 !important;
  border: 2px solid #ff4757 !important;
  color: #ffffff !important;
  font-weight: 600 !important;
  box-shadow: 0 0 15px rgba(220, 53, 69, 0.5) !important;
  animation: pulse-warning 2s infinite !important;
}

.alert-danger i {
  color: #ffffff !important;
  font-size: 1.1em !important;
}

@keyframes pulse-warning {
  0%,
  100% {
    box-shadow: 0 0 15px rgba(220, 53, 69, 0.5);
  }
  50% {
    box-shadow: 0 0 25px rgba(220, 53, 69, 0.8);
  }
}
</style>
