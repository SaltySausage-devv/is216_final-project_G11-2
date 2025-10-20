<template>
  <div
    class="modal fade show"
    style="display: block; background-color: rgba(0, 0, 0, 0.5)"
  >
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Reschedule Request</h5>
          <button
            type="button"
            class="btn-close"
            @click="$emit('close')"
          ></button>
        </div>
        <div class="modal-body">
          <!-- Request Details -->
          <div class="alert alert-warning mb-4">
            <i class="fas fa-clock me-2"></i>
            <strong>
              {{ requesterName }} has requested to reschedule this session
            </strong>
          </div>

          <!-- Current Time -->
          <div
            class="card mb-3"
            style="
              background: rgba(108, 117, 125, 0.1);
              border: 1px solid rgba(108, 117, 125, 0.3);
            "
          >
            <div class="card-body">
              <h6 class="card-title text-muted">
                <i class="fas fa-calendar me-2"></i>Current Time
              </h6>
              <p class="mb-0">
                <strong>{{ formatDate(booking.start_time) }}</strong
                ><br />
                {{ formatTime(booking.start_time) }} -
                {{ formatTime(booking.end_time) }}
              </p>
            </div>
          </div>

          <!-- Arrow Icon -->
          <div class="text-center mb-3">
            <i class="fas fa-arrow-down fa-2x text-warning"></i>
          </div>

          <!-- New Proposed Time -->
          <div
            class="card mb-3"
            style="
              background: rgba(255, 193, 7, 0.1);
              border: 1px solid rgba(255, 193, 7, 0.5);
            "
          >
            <div class="card-body">
              <h6 class="card-title text-warning">
                <i class="fas fa-calendar-check me-2"></i>Proposed New Time
              </h6>
              <p class="mb-0">
                <strong>{{
                  formatDate(booking.pending_reschedule_start_time)
                }}</strong
                ><br />
                {{ formatTime(booking.pending_reschedule_start_time) }} -
                {{ formatTime(booking.pending_reschedule_end_time) }}
              </p>
            </div>
          </div>

          <!-- Location Comparison -->
          <div class="mb-3">
            <div class="row">
              <!-- Current Location -->
              <div class="col-md-6 mb-3">
                <div
                  class="card h-100"
                  style="
                    background: rgba(108, 117, 125, 0.1);
                    border: 1px solid rgba(108, 117, 125, 0.3);
                  "
                >
                  <div class="card-body">
                    <h6 class="card-title text-muted">
                      <i class="fas fa-map-marker-alt me-2"></i>Current Location
                    </h6>
                    <p class="mb-0 text-light">
                      {{ booking.location || "No location set" }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Proposed Location -->
              <div class="col-md-6 mb-3">
                <div
                  class="card h-100"
                  style="
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                  "
                >
                  <div class="card-body">
                    <h6 class="card-title text-info">
                      <i class="fas fa-map-marker-alt me-2"></i>Proposed
                      Location
                    </h6>
                    <p class="mb-0 text-light">
                      {{
                        booking.pending_reschedule_location ||
                        "No location change"
                      }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Reason -->
          <div v-if="booking.reschedule_reason" class="mb-4">
            <h6 class="text-muted">
              <i class="fas fa-comment me-2"></i>Reason
            </h6>
            <p class="text-light">{{ booking.reschedule_reason }}</p>
          </div>

          <!-- Credits Comparison -->
          <div class="mb-4">
            <div v-if="loadingCredits" class="alert alert-info">
              <div class="d-flex align-items-center">
                <i class="fas fa-spinner fa-spin me-2 text-warning"></i>
                <span>Loading credits comparison...</span>
              </div>
            </div>
            <div v-else-if="tutorHourlyRate > 0" class="row">
              <!-- Current Credits -->
              <div class="col-md-6 mb-3">
                <div
                  class="card h-100"
                  style="
                    background: rgba(108, 117, 125, 0.1);
                    border: 1px solid rgba(108, 117, 125, 0.3);
                  "
                >
                  <div class="card-body">
                    <h6 class="card-title text-muted">
                      <i class="fas fa-coins me-2"></i>Current Session
                    </h6>
                    <div class="d-flex align-items-center">
                      <strong v-if="authStore?.user?.user_type === 'student'"
                        >Credits Used:</strong
                      >
                      <strong v-else>Credits Earned:</strong>
                      <span class="text-warning fw-bold ms-2"
                        >${{ currentCredits }}</span
                      >
                    </div>
                    <small class="text-muted d-block mt-1">
                      {{ currentDurationInHours }} hours
                    </small>
                  </div>
                </div>
              </div>

              <!-- Proposed Credits -->
              <div class="col-md-6 mb-3">
                <div class="card h-100" :style="creditChangeStyle">
                  <div class="card-body">
                    <h6 class="card-title" :class="creditChangeTextClass">
                      <i class="fas fa-coins me-2"></i>Proposed Session
                    </h6>
                    <div class="d-flex align-items-center">
                      <strong v-if="authStore?.user?.user_type === 'student'"
                        >Credits Used:</strong
                      >
                      <strong v-else>Credits Earned:</strong>
                      <span class="fw-bold ms-2" :class="creditChangeTextClass"
                        >${{ calculatedCredits }}</span
                      >
                      <i
                        v-if="creditDifference !== 0"
                        class="ms-2"
                        :class="creditChangeIcon"
                      ></i>
                    </div>
                    <small class="text-muted d-block mt-1">
                      {{ sessionDurationInHours }} hours
                    </small>
                    <div v-if="creditDifference !== 0" class="mt-2">
                      <small :class="creditChangeTextClass">
                        <strong>{{ creditChangeText }}</strong>
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="alert alert-warning">
              <div class="d-flex align-items-center">
                <i class="fas fa-exclamation-triangle me-2 text-warning"></i>
                <span class="text-muted">Tutor hourly rate not available</span>
              </div>
            </div>
          </div>

          <!-- Response Message Input (when responding) -->
          <div v-if="!responded" class="mb-3">
            <label class="form-label">Your Response (Optional)</label>
            <textarea
              v-model="responseMessage"
              class="form-control"
              rows="2"
              placeholder="Add a message with your response..."
            ></textarea>
          </div>

          <!-- Already Responded -->
          <div
            v-if="responded"
            class="alert"
            :class="
              booking.reschedule_status === 'accepted'
                ? 'alert-success'
                : 'alert-danger'
            "
          >
            <strong>{{
              booking.reschedule_status === "accepted" ? "Accepted" : "Rejected"
            }}</strong>
            <span v-if="booking.reschedule_responded_at">
              on {{ formatDate(booking.reschedule_responded_at) }}</span
            >
            <p v-if="booking.reschedule_response_message" class="mb-0 mt-2">
              {{ booking.reschedule_response_message }}
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="$emit('close')"
          >
            Close
          </button>
          <button
            v-if="!responded && canRespond"
            type="button"
            class="btn btn-danger"
            @click="handleReject"
            :disabled="loading"
          >
            <span
              v-if="loading === 'reject'"
              class="spinner-border spinner-border-sm me-2"
            ></span>
            <i class="fas fa-times me-2"></i>Reject
          </button>
          <button
            v-if="!responded && canRespond"
            type="button"
            class="btn btn-success"
            @click="handleAccept"
            :disabled="loading"
          >
            <span
              v-if="loading === 'accept'"
              class="spinner-border spinner-border-sm me-2"
            ></span>
            <i class="fas fa-check me-2"></i>Accept
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../../stores/auth";
import { useToast } from "../../composables/useToast";
import { useCreditService } from "../../services/creditService";

export default {
  name: "RescheduleRequestModal",
  props: {
    booking: {
      type: Object,
      required: true,
    },
  },
  emits: ["close", "responded"],
  setup(props, { emit }) {
    const authStore = useAuthStore();
    const { showToast } = useToast();
    const creditService = useCreditService();

    // Reactive data
    const loading = ref(false);
    const responseMessage = ref("");
    const tutorHourlyRate = ref(0);
    const loadingCredits = ref(false);
    const currentRequest = ref(null); // Track current request for cancellation

    // Computed properties
    const responded = computed(() => {
      return props.booking.reschedule_status !== "pending";
    });

    const canRespond = computed(() => {
      // User can respond if they are NOT the requester
      return props.booking.reschedule_requested_by !== authStore.user?.id;
    });

    const requesterName = computed(() => {
      if (props.booking.reschedule_requester_type === "tutor") {
        return "The tutor";
      } else {
        return "The student";
      }
    });

    // Calculate session duration in hours
    const sessionDurationInHours = computed(() => {
      if (
        !props.booking.pending_reschedule_start_time ||
        !props.booking.pending_reschedule_end_time
      ) {
        return 0;
      }
      const start = new Date(props.booking.pending_reschedule_start_time);
      const end = new Date(props.booking.pending_reschedule_end_time);
      const durationMs = end.getTime() - start.getTime();
      return durationMs / (1000 * 60 * 60); // Convert to hours
    });

    // Calculate credits based on hourly rate and duration
    const calculatedCredits = computed(() => {
      if (tutorHourlyRate.value > 0 && sessionDurationInHours.value > 0) {
        return (tutorHourlyRate.value * sessionDurationInHours.value).toFixed(
          2
        );
      }
      return "0.00";
    });

    // Calculate current session duration in hours
    const currentDurationInHours = computed(() => {
      if (!props.booking.start_time || !props.booking.end_time) {
        return 0;
      }
      const start = new Date(props.booking.start_time);
      const end = new Date(props.booking.end_time);
      const durationMs = end.getTime() - start.getTime();
      return durationMs / (1000 * 60 * 60); // Convert to hours
    });

    // Calculate current session credits
    const currentCredits = computed(() => {
      if (tutorHourlyRate.value > 0 && currentDurationInHours.value > 0) {
        return (tutorHourlyRate.value * currentDurationInHours.value).toFixed(
          2
        );
      }
      return "0.00";
    });

    // Calculate credit difference
    const creditDifference = computed(() => {
      const current = parseFloat(currentCredits.value);
      const proposed = parseFloat(calculatedCredits.value);
      return proposed - current;
    });

    // Determine credit change styling
    const creditChangeStyle = computed(() => {
      if (creditDifference.value > 0) {
        // Increase
        if (authStore?.user?.user_type === "student") {
          // Student: more credits used = red
          return "background: rgba(220, 53, 69, 0.1); border: 1px solid rgba(220, 53, 69, 0.3);";
        } else {
          // Tutor: more credits earned = green
          return "background: rgba(40, 167, 69, 0.1); border: 1px solid rgba(40, 167, 69, 0.3);";
        }
      } else if (creditDifference.value < 0) {
        // Decrease
        if (authStore?.user?.user_type === "student") {
          // Student: fewer credits used = green
          return "background: rgba(40, 167, 69, 0.1); border: 1px solid rgba(40, 167, 69, 0.3);";
        } else {
          // Tutor: fewer credits earned = red
          return "background: rgba(220, 53, 69, 0.1); border: 1px solid rgba(220, 53, 69, 0.3);";
        }
      } else {
        // No change
        return "background: rgba(108, 117, 125, 0.1); border: 1px solid rgba(108, 117, 125, 0.3);";
      }
    });

    // Determine credit change text color
    const creditChangeTextClass = computed(() => {
      if (creditDifference.value > 0) {
        if (authStore?.user?.user_type === "student") {
          return "text-danger";
        } else {
          return "text-success";
        }
      } else if (creditDifference.value < 0) {
        if (authStore?.user?.user_type === "student") {
          return "text-success";
        } else {
          return "text-danger";
        }
      } else {
        return "text-warning";
      }
    });

    // Determine credit change icon
    const creditChangeIcon = computed(() => {
      if (creditDifference.value > 0) {
        if (authStore?.user?.user_type === "student") {
          return "fas fa-arrow-up text-danger";
        } else {
          return "fas fa-arrow-up text-success";
        }
      } else if (creditDifference.value < 0) {
        if (authStore?.user?.user_type === "student") {
          return "fas fa-arrow-down text-success";
        } else {
          return "fas fa-arrow-down text-danger";
        }
      }
      return "";
    });

    // Credit change text
    const creditChangeText = computed(() => {
      if (creditDifference.value > 0) {
        if (authStore?.user?.user_type === "student") {
          return `+$${Math.abs(creditDifference.value).toFixed(
            2
          )} more credits needed`;
        } else {
          return `+$${Math.abs(creditDifference.value).toFixed(
            2
          )} more credits earned`;
        }
      } else if (creditDifference.value < 0) {
        if (authStore?.user?.user_type === "student") {
          return `-$${Math.abs(creditDifference.value).toFixed(
            2
          )} fewer credits needed`;
        } else {
          return `-$${Math.abs(creditDifference.value).toFixed(
            2
          )} fewer credits earned`;
        }
      }
      return "No change in credits";
    });

    // Load tutor's hourly rate for credits calculation
    const loadTutorHourlyRate = async () => {
      try {
        loadingCredits.value = true;

        // Get tutor ID from the booking
        const tutorId = props.booking.tutor_id;

        console.log("🔍 Loading tutor hourly rate for tutor ID:", tutorId);

        const response = await fetch(
          `http://localhost:3003/profiles/tutor/${tutorId}`,
          {
            headers: {
              Authorization: `Bearer ${authStore?.token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("📡 API Response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("📊 Profile data received:", data);
          const profile = data.profile;
          tutorHourlyRate.value = profile.hourly_rate || 0;
          console.log("✅ Loaded tutor hourly rate:", profile.hourly_rate);
        } else {
          const errorData = await response.json();
          console.error("❌ API Error:", errorData);
          tutorHourlyRate.value = 0;
        }
      } catch (error) {
        console.error("Error loading tutor hourly rate:", error);
        tutorHourlyRate.value = 0;
      } finally {
        loadingCredits.value = false;
      }
    };

    // Check if student has sufficient credits for the rescheduled session
    async function checkStudentCreditsForReschedule() {
      try {
        // Only check if user is a student and this is a pending reschedule request
        if (!creditService.isStudent() || responded.value) {
          return;
        }

        // Only check if tutor initiated the reschedule (student is the recipient)
        if (props.booking.reschedule_requester_type !== "tutor") {
          return;
        }

        // Calculate credit difference
        const originalDurationHours = sessionDurationInHours.value;
        const newDurationHours =
          (new Date(props.booking.pending_reschedule_end_time) -
            new Date(props.booking.pending_reschedule_start_time)) /
          (1000 * 60 * 60);

        const originalCredits =
          props.booking.hourly_rate * originalDurationHours;
        const newCredits = tutorHourlyRate.value * newDurationHours;
        const creditDifference = newCredits - originalCredits;

        console.log("🔍 Credit check for reschedule:", {
          originalCredits,
          newCredits,
          creditDifference,
          tutorHourlyRate: tutorHourlyRate.value,
        });

        // If the new session costs more, check student's credits
        if (creditDifference > 0) {
          // Get student's current credits
          const response = await fetch("/api/users/profile", {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            const currentCredits = userData.credits || 0;

            if (currentCredits < creditDifference) {
              const shortfall = creditDifference - currentCredits;

              // Show insufficient credits notification
              creditService.showInsufficientCreditsNotification(
                creditDifference,
                currentCredits,
                "reschedule"
              );
            }
          }
        }
      } catch (error) {
        console.error("Error checking student credits for reschedule:", error);
        // Don't show error to user, just log it
      }
    }

    // Load tutor hourly rate when component mounts
    onMounted(async () => {
      await loadTutorHourlyRate();
      // Check credits after tutor rate is loaded
      setTimeout(() => {
        checkStudentCreditsForReschedule();
      }, 100); // Small delay to ensure tutor rate is set
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

    async function handleAccept() {
      // Prevent multiple simultaneous requests
      if (loading.value) {
        console.log(
          "🔄 FRONTEND: Request already in progress, ignoring accept"
        );
        return;
      }

      try {
        console.log(
          "🔄 FRONTEND: Starting accept process for booking:",
          props.booking.id
        );
        loading.value = "accept";

        // Cancel any existing request
        if (currentRequest.value) {
          currentRequest.value.abort();
        }

        const controller = new AbortController();
        currentRequest.value = controller;

        const response = await fetch(
          `/api/calendar/bookings/${props.booking.id}/reschedule/accept`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authStore.token}`,
            },
            body: JSON.stringify({
              response_message: responseMessage.value,
            }),
            signal: controller.signal,
          }
        );

        console.log("🔄 FRONTEND: Accept response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json();
          const error = new Error(
            errorData.error || "Failed to accept reschedule request"
          );
          error.details = errorData.details; // Attach credit details
          throw error;
        }

        const result = await response.json();

        // Refresh credit balance after successful reschedule acceptance
        await creditService.refreshCredits();

        showToast(
          result.message || "Reschedule request accepted successfully",
          "success"
        );

        emit("responded");
      } catch (error) {
        console.error("Error accepting reschedule request:", error);

        // Check if it's an insufficient credits error
        if (
          error.message &&
          error.message.includes("Insufficient credits for reschedule")
        ) {
          // Show specific credit top-up notification
          if (error.details && error.details.shortfall) {
            creditService.showInsufficientCreditsNotification(
              error.details.requiredCredits,
              error.details.currentCredits,
              "reschedule"
            );
          } else {
            showToast(error.message, "error");
          }
        } else {
          showToast(
            error.message || "Failed to accept reschedule request",
            "error"
          );
        }
      } finally {
        // Ensure loading state is always reset
        loading.value = false;
        currentRequest.value = null;
        console.log("🔄 FRONTEND: Loading state reset after accept");
      }
    }

    async function handleReject() {
      // Prevent multiple simultaneous requests
      if (loading.value) {
        console.log(
          "🔄 FRONTEND: Request already in progress, ignoring reject"
        );
        return;
      }

      try {
        console.log(
          "🔄 FRONTEND: Starting reject process for booking:",
          props.booking.id
        );
        loading.value = "reject";

        // Cancel any existing request
        if (currentRequest.value) {
          currentRequest.value.abort();
        }

        const controller = new AbortController();
        currentRequest.value = controller;

        const response = await fetch(
          `/api/calendar/bookings/${props.booking.id}/reschedule/reject`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authStore.token}`,
            },
            body: JSON.stringify({
              response_message: responseMessage.value,
            }),
            signal: controller.signal,
          }
        );

        console.log("🔄 FRONTEND: Reject response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to reject reschedule request"
          );
        }

        const result = await response.json();
        showToast(result.message || "Reschedule request rejected", "info");
        emit("responded");
      } catch (error) {
        console.error("Error rejecting reschedule request:", error);
        showToast(
          error.message || "Failed to reject reschedule request",
          "error"
        );
      } finally {
        // Ensure loading state is always reset
        loading.value = false;
        currentRequest.value = null;
        console.log("🔄 FRONTEND: Loading state reset after reject");
      }
    }

    return {
      loading,
      responseMessage,
      responded,
      canRespond,
      requesterName,
      tutorHourlyRate,
      loadingCredits,
      sessionDurationInHours,
      calculatedCredits,
      currentDurationInHours,
      currentCredits,
      creditDifference,
      creditChangeStyle,
      creditChangeTextClass,
      creditChangeIcon,
      creditChangeText,
      authStore,
      formatDate,
      formatTime,
      handleAccept,
      handleReject,
    };
  },
};
</script>

<style scoped>
.modal {
  z-index: 1060;
}

.modal-content {
  background: #2d2d44 !important;
  border: 1px solid rgba(255, 107, 53, 0.3);
  border-radius: 12px;
  color: #ffffff;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.modal-header {
  background: linear-gradient(135deg, #3a3a52 0%, #2d2d44 100%);
  border-bottom: 1px solid rgba(255, 107, 53, 0.2);
  border-radius: 12px 12px 0 0;
  padding: 1.25rem 1.5rem;
}

.modal-title {
  color: #ff6b35;
  font-weight: 700;
  font-size: 1.25rem;
}

.btn-close {
  filter: invert(1);
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.btn-close:hover {
  opacity: 1;
}

.modal-body {
  background: #2d2d44;
  color: #ffffff;
  padding: 1.5rem;
}

.modal-footer {
  background: linear-gradient(135deg, #2d2d44 0%, #3a3a52 100%);
  border-top: 1px solid rgba(255, 107, 53, 0.2);
  border-radius: 0 0 12px 12px;
  padding: 1.25rem 1.5rem;
  gap: 0.5rem;
}

.alert {
  border-radius: 10px;
  padding: 1.25rem;
  border: 1px solid;
  font-weight: 500;
}

.alert-warning {
  background: linear-gradient(
    135deg,
    rgba(255, 193, 7, 0.15) 0%,
    rgba(255, 193, 7, 0.1) 100%
  );
  border-color: rgba(255, 193, 7, 0.5);
  color: #ffc107;
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.1);
}

.alert-success {
  background: linear-gradient(
    135deg,
    rgba(40, 167, 69, 0.15) 0%,
    rgba(40, 167, 69, 0.1) 100%
  );
  border-color: rgba(40, 167, 69, 0.5);
  color: #28a745;
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.1);
}

.alert-danger {
  background: linear-gradient(
    135deg,
    rgba(220, 53, 69, 0.15) 0%,
    rgba(220, 53, 69, 0.1) 100%
  );
  border-color: rgba(220, 53, 69, 0.5);
  color: #dc3545;
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.1);
}

.alert-info {
  background: linear-gradient(
    135deg,
    rgba(23, 162, 184, 0.15) 0%,
    rgba(23, 162, 184, 0.1) 100%
  );
  border-color: rgba(23, 162, 184, 0.5);
  color: #17a2b8;
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.1);
}

.card {
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.card-body {
  padding: 1.25rem;
}

.card-title {
  margin-bottom: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.text-warning {
  color: #ffc107 !important;
}

.text-muted {
  color: #aaaaaa !important;
}

.text-light {
  color: #e0e0e0 !important;
}

.form-control {
  background: #3a3a52;
  border: 1px solid rgba(255, 107, 53, 0.3);
  color: #ffffff;
  border-radius: 8px;
  padding: 0.75rem;
  transition: all 0.3s ease;
}

.form-control:focus {
  background: #3a3a52;
  border-color: #ff6b35;
  color: #ffffff;
  box-shadow: 0 0 0 0.2rem rgba(255, 107, 53, 0.25);
  outline: none;
}

.form-control::placeholder {
  color: #888;
}

.form-label {
  color: #aaaaaa;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.btn-success {
  background: linear-gradient(135deg, #28a745 0%, #218838 100%);
  border: none;
  color: #ffffff;
  font-weight: 600;
  padding: 0.6rem 1.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.btn-success:hover {
  background: linear-gradient(135deg, #218838 0%, #1e7e34 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(40, 167, 69, 0.4);
  border: none;
  color: #ffffff;
}

.btn-danger {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  border: none;
  color: #ffffff;
  font-weight: 600;
  padding: 0.6rem 1.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.btn-danger:hover {
  background: linear-gradient(135deg, #c82333 0%, #bd2130 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(220, 53, 69, 0.4);
  border: none;
  color: #ffffff;
}

.btn-secondary {
  background-color: #6c757d;
  border-color: #6c757d;
  color: #ffffff;
  font-weight: 600;
  padding: 0.6rem 1.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background-color: #5a6268;
  border-color: #5a6268;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.fa-arrow-down {
  opacity: 0.6;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

textarea.form-control {
  resize: vertical;
  min-height: 80px;
}

/* Icon styling */
.fas {
  opacity: 0.9;
}

strong {
  font-weight: 600;
}
</style>
