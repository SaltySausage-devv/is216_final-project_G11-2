<template>
  <div
    class="modal fade show"
    style="display: block; background-color: rgba(0, 0, 0, 0.5)"
  >
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Booking Details</h5>
          <button
            type="button"
            class="btn-close"
            @click="$emit('close')"
          ></button>
        </div>
        <div class="modal-body">
          <!-- Booking Status Badge -->
          <div class="mb-3">
            <span :class="getStatusClass(booking.status)" class="badge">
              {{ formatStatus(booking.status) }}
            </span>
          </div>

          <!-- Pending Reschedule Request Alert -->
          <div
            v-if="booking.reschedule_status === 'pending'"
            class="alert alert-warning mb-3"
          >
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <i class="fas fa-clock me-2"></i>
                <strong>Reschedule Request Pending</strong>
                <p class="mb-0 mt-1">
                  {{ getRescheduleRequestMessage }}
                </p>
              </div>
              <button
                class="btn btn-sm btn-outline-warning"
                @click="showRescheduleRequestModal = true"
              >
                View Request
              </button>
            </div>
          </div>

          <!-- Booking Information -->
          <div class="row mb-4">
            <div class="col-md-6">
              <h6 class="text-muted">Session Details</h6>
              <p class="mb-2"><strong>Title:</strong> {{ booking.title }}</p>
              <p class="mb-2">
                <strong>Date:</strong>
                {{ formatDate(booking.start || booking.start_time) }}
              </p>
              <p class="mb-2">
                <strong>Time:</strong>
                {{ formatTime(booking.start || booking.start_time) }} -
                {{ formatTime(booking.end || booking.end_time) }}
              </p>
              <p class="mb-2">
                <strong>Duration:</strong>
                {{
                  calculateDuration(
                    booking.start || booking.start_time,
                    booking.end || booking.end_time
                  )
                }}
              </p>
              <p v-if="booking.is_online" class="mb-2">
                <strong>Type:</strong> <i class="fas fa-video me-1"></i> Online
                Session
              </p>
              <p v-else class="mb-2">
                <strong>Type:</strong>
                <i class="fas fa-map-marker-alt me-1"></i> In-person Session
              </p>
              <p v-if="booking.location && !booking.is_online" class="mb-2">
                <strong>Location:</strong> {{ booking.location }}
              </p>
            </div>
            <div class="col-md-6">
              <h6 class="text-muted">Participants</h6>
              <div class="mb-3">
                <div class="d-flex align-items-center mb-2">
                  <div
                    class="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                    style="width: 32px; height: 32px"
                  >
                    {{
                      getInitials(
                        booking.tutor?.first_name +
                          " " +
                          booking.tutor?.last_name
                      )
                    }}
                  </div>
                  <div>
                    <strong>Tutor:</strong><br />
                    {{ booking.tutor?.first_name }}
                    {{ booking.tutor?.last_name }}
                  </div>
                </div>
                <div class="d-flex align-items-center">
                  <div
                    class="avatar-sm bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                    style="width: 32px; height: 32px"
                  >
                    {{
                      getInitials(
                        booking.student?.first_name +
                          " " +
                          booking.student?.last_name
                      )
                    }}
                  </div>
                  <div>
                    <strong>Student:</strong><br />
                    {{ booking.student?.first_name }}
                    {{ booking.student?.last_name }}
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
              <span
                :class="getPaymentStatusClass(booking.payment_status)"
                class="badge"
              >
                {{ formatPaymentStatus(booking.payment_status) }}
              </span>
            </div>
          </div>

          <!-- Meeting Links -->
          <div
            v-if="
              booking.is_online &&
              (booking.google_meet_link || booking.zoom_meeting_link)
            "
            class="mb-4"
          >
            <h6 class="text-muted">Meeting Links</h6>
            <div v-if="booking.google_meet_link" class="mb-2">
              <a
                :href="booking.google_meet_link"
                target="_blank"
                class="btn btn-outline-primary btn-sm me-2"
              >
                <i class="fab fa-google me-1"></i> Join Google Meet
              </a>
            </div>
            <div v-if="booking.zoom_meeting_link" class="mb-2">
              <a
                :href="booking.zoom_meeting_link"
                target="_blank"
                class="btn btn-outline-primary btn-sm me-2"
              >
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
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-2"
              ></span>
              <i class="fas fa-check me-2"></i>Confirm Booking
            </button>

            <button
              v-if="canComplete"
              class="btn btn-primary"
              @click="completeBooking"
              :disabled="loading"
            >
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-2"
              ></span>
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
          <button
            type="button"
            class="btn btn-secondary"
            @click="$emit('close')"
          >
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

    <!-- Reschedule Request Modal -->
    <RescheduleRequestModal
      v-if="
        showRescheduleRequestModal && booking.reschedule_status === 'pending'
      "
      :booking="booking"
      @close="showRescheduleRequestModal = false"
      @responded="handleRescheduleRequestResponded"
    />
  </div>
</template>

<script>
import { ref, computed } from "vue";
import { useAuthStore } from "../../stores/auth";
import { useToast } from "../../composables/useToast";
import RescheduleModal from "./RescheduleModal.vue";
import CancelModal from "./CancelModal.vue";
import RescheduleRequestModal from "./RescheduleRequestModal.vue";

export default {
  name: "BookingDetailsModal",
  components: {
    RescheduleModal,
    CancelModal,
    RescheduleRequestModal,
  },
  props: {
    booking: {
      type: Object,
      required: true,
    },
  },
  emits: ["close", "updated"],
  setup(props, { emit }) {
    const authStore = useAuthStore();
    const { showToast } = useToast();

    // Reactive data
    const loading = ref(false);
    const showRescheduleModal = ref(false);
    const showCancelModal = ref(false);
    const showRescheduleRequestModal = ref(false);

    // Computed properties
    const isTutor = computed(() => {
      return (
        authStore.userType === "tutor" &&
        authStore.user?.id === props.booking.tutor_id
      );
    });

    const isStudent = computed(() => {
      return (
        authStore.userType === "student" &&
        authStore.user?.id === props.booking.student_id
      );
    });

    const canReschedule = computed(() => {
      return (
        ["scheduled", "confirmed"].includes(props.booking.status) &&
        (isTutor.value || isStudent.value)
      );
    });

    const canCancel = computed(() => {
      return (
        ["scheduled", "confirmed"].includes(props.booking.status) &&
        (isTutor.value || isStudent.value)
      );
    });

    const canConfirm = computed(() => {
      return props.booking.status === "scheduled" && isTutor.value;
    });

    const canComplete = computed(() => {
      return (
        props.booking.status === "confirmed" && isTutor.value && isPastBooking()
      );
    });

    const canJoinMeeting = computed(() => {
      return (
        props.booking.is_online &&
        ["confirmed"].includes(props.booking.status) &&
        isWithinMeetingWindow()
      );
    });

    const getRescheduleRequestMessage = computed(() => {
      if (props.booking.reschedule_status !== "pending") return "";

      const isRequester =
        props.booking.reschedule_requested_by === authStore.user?.id;
      if (isRequester) {
        return "Waiting for the other party to respond to your reschedule request.";
      } else {
        const requesterType = props.booking.reschedule_requester_type;
        return `The ${requesterType} has requested to reschedule this session.`;
      }
    });

    // Methods
    function getInitials(name) {
      return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }

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

    function getStatusClass(status) {
      const classes = {
        scheduled: "bg-secondary",
        confirmed: "bg-success",
        completed: "bg-primary",
        cancelled: "bg-danger",
        no_show: "bg-warning",
      };
      return classes[status] || "bg-secondary";
    }

    function getPaymentStatusClass(status) {
      const classes = {
        pending: "bg-warning",
        paid: "bg-success",
        refunded: "bg-info",
        partially_refunded: "bg-secondary",
      };
      return classes[status] || "bg-secondary";
    }

    function formatStatus(status) {
      const formatted = {
        scheduled: "Scheduled",
        confirmed: "Confirmed",
        completed: "Completed",
        cancelled: "Cancelled",
        no_show: "No Show",
      };
      return formatted[status] || status;
    }

    function formatPaymentStatus(status) {
      const formatted = {
        pending: "Pending",
        paid: "Paid",
        refunded: "Refunded",
        partially_refunded: "Partially Refunded",
      };
      return formatted[status] || status;
    }

    function isPastBooking() {
      return new Date(props.booking.end || props.booking.end_time) < new Date();
    }

    function isWithinMeetingWindow() {
      const now = new Date();
      const startTime = new Date(
        props.booking.start || props.booking.start_time
      );
      const endTime = new Date(props.booking.end || props.booking.end_time);

      // Allow joining 15 minutes before start time
      const joinWindow = new Date(startTime.getTime() - 15 * 60 * 1000);

      return now >= joinWindow && now <= endTime;
    }

    async function confirmBooking() {
      try {
        loading.value = true;

        const response = await fetch(
          `/api/bookings/${props.booking.id}/confirm`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to confirm booking");
        }

        showToast("Booking confirmed successfully", "success");
        emit("updated");
      } catch (error) {
        console.error("Error confirming booking:", error);
        showToast("Failed to confirm booking", "error");
      } finally {
        loading.value = false;
      }
    }

    async function completeBooking() {
      try {
        loading.value = true;

        const response = await fetch(
          `/api/bookings/${props.booking.id}/complete`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to complete booking");
        }

        showToast("Booking marked as completed", "success");
        emit("updated");
      } catch (error) {
        console.error("Error completing booking:", error);
        showToast("Failed to complete booking", "error");
      } finally {
        loading.value = false;
      }
    }

    function joinMeeting() {
      const meetLink =
        props.booking.google_meet_link || props.booking.zoom_meeting_link;
      if (meetLink) {
        window.open(meetLink, "_blank");
      }
    }

    function handleRescheduled() {
      showRescheduleModal.value = false;
      emit("updated");
    }

    function handleCancelled() {
      showCancelModal.value = false;
      emit("updated");
    }

    function handleRescheduleRequestResponded() {
      showRescheduleRequestModal.value = false;
      emit("updated");
    }

    return {
      loading,
      showRescheduleModal,
      showCancelModal,
      showRescheduleRequestModal,
      isTutor,
      isStudent,
      canReschedule,
      canCancel,
      canConfirm,
      canComplete,
      canJoinMeeting,
      getRescheduleRequestMessage,
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
      handleCancelled,
      handleRescheduleRequestResponded,
    };
  },
};
</script>

<style scoped>
.modal {
  z-index: 1050;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.modal-dialog {
  max-width: 800px;
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

.badge {
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.bg-secondary {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%) !important;
  color: #ffffff !important;
  border: none;
}

.bg-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  color: #ffffff !important;
  border: none;
}

.bg-primary {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
  color: #ffffff !important;
  border: none;
}

.bg-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
  color: #ffffff !important;
  border: none;
}

.bg-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
  color: #ffffff !important;
  border: none;
}

.bg-info {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%) !important;
  color: #ffffff !important;
  border: none;
}

.btn-outline-warning {
  border: 2px solid #f59e0b;
  color: #f59e0b;
  background: transparent;
  border-radius: 10px;
  font-weight: 700;
  padding: 0.75rem 1.5rem;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  letter-spacing: 0.02em;
}

.btn-outline-warning:hover {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-color: #d97706;
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
}

.btn-outline-danger {
  border: 2px solid #ef4444;
  color: #ef4444;
  background: transparent;
  border-radius: 10px;
  font-weight: 700;
  padding: 0.75rem 1.5rem;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  letter-spacing: 0.02em;
}

.btn-outline-danger:hover {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border-color: #dc2626;
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3);
}

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  color: #ffffff;
  border-radius: 10px;
  font-weight: 700;
  padding: 0.75rem 1.5rem;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  letter-spacing: 0.02em;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-success:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
}

.btn-secondary {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  border: none;
  color: #ffffff;
  border-radius: 10px;
  font-weight: 700;
  padding: 0.75rem 1.5rem;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  letter-spacing: 0.02em;
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(107, 114, 128, 0.4);
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  border: none;
  color: #ffffff;
  border-radius: 10px;
  font-weight: 700;
  padding: 0.75rem 1.5rem;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  letter-spacing: 0.02em;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
}

.text-muted {
  color: rgba(255, 255, 255, 0.7) !important;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

h6 {
  color: #ff6b35;
  font-weight: 800;
  font-size: 1.125rem;
  margin-bottom: 1rem;
  letter-spacing: -0.01em;
}

strong {
  color: #ffffff;
  font-weight: 700;
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

.alert-warning {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%);
  border: 1px solid rgba(245, 158, 11, 0.5);
  color: #ffffff;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
}

.alert-warning .btn-outline-warning {
  border-color: #f59e0b;
  color: #f59e0b;
  background: transparent;
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.alert-warning .btn-outline-warning:hover {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-color: #d97706;
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.alert-warning strong {
  color: #f59e0b;
  font-weight: 800;
}

.alert-warning p {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
  margin: 0.5rem 0 0 0;
}

.alert-warning i {
  color: #f59e0b;
  font-size: 1.25rem;
}
</style>
