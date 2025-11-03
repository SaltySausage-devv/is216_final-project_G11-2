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
              <div class="info-table mb-2">
                <div class="info-label">Title:</div>
                <div class="info-value">{{ booking.title }}</div>

                <div class="info-label">Date:</div>
                <div class="info-value">{{ formatDate(booking.start || booking.start_time) }}</div>

                <div class="info-label">Time:</div>
                <div class="info-value">{{ formatTime(booking.start || booking.start_time) }} - {{ formatTime(booking.end || booking.end_time) }}</div>

                <div class="info-label">Duration:</div>
                <div class="info-value">{{ calculateDuration(booking.start || booking.start_time, booking.end || booking.end_time) }}</div>

                <div class="info-label">Type:</div>
                <div class="info-value">
                  <template v-if="booking.is_online">
                    <i class="fas fa-video me-1"></i> Online Session
                  </template>
                  <template v-else>
                    <i class="fas fa-map-marker-alt me-1"></i> In-person Session
                  </template>
                </div>

                <template v-if="booking.location && !booking.is_online">
                  <div class="info-label">Location:</div>
                  <div class="info-value">{{ booking.location }}</div>
                </template>
              </div>
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
                  <div class="participant-info">
                    <strong class="participant-label">Tutor:</strong>
                    <span class="participant-name">{{ booking.tutor?.first_name }} {{ booking.tutor?.last_name }}</span>
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
                  <div class="participant-info">
                    <strong class="participant-label">Student:</strong>
                    <span class="participant-name">{{ booking.student?.first_name }} {{ booking.student?.last_name }}</span>
                  </div>
                </div>
              </div>

              <h6 class="text-muted">Payment</h6>
              <p class="mb-2">
                <strong>Hourly Rate:</strong>
                {{ booking.hourly_rate ? parseFloat(booking.hourly_rate).toFixed(2) : "N/A" }} Credits/hour
              </p>
              <p class="mb-2">
                <strong>Total Amount:</strong>
                {{ booking.total_amount ? parseFloat(booking.total_amount).toFixed(2) : "N/A" }} Credits
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
              class="btn btn-cyberpunk"
              @click="showRescheduleModal = true"
            >
              <i class="fas fa-calendar-alt me-2"></i>Reschedule
            </button>

            <button
              v-if="canCancel"
              class="btn btn-cyberpunk"
              @click="showCancelModal = true"
            >
              <i class="fas fa-times me-2"></i>Cancel
            </button>

            <button
              v-if="canConfirm"
              class="btn btn-cyberpunk"
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
              class="btn btn-cyberpunk"
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
              class="btn btn-cyberpunk"
              @click="joinMeeting"
            >
              <i class="fas fa-video me-2"></i>Join Meeting
            </button>

            <button
              v-if="canMarkAttendance"
              class="btn btn-cyberpunk"
              @click="showMarkAttendanceModal = true"
            >
              <i class="fas fa-check-circle me-2"></i>Mark Attendance
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-cyberpunk"
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

    <!-- Mark Attendance Modal -->
    <MarkAttendanceModal
      v-if="showMarkAttendanceModal"
      :booking="booking"
      @close="showMarkAttendanceModal = false"
      @attendance-marked="handleAttendanceMarked"
    />
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, reactive, nextTick } from "vue";
import { useAuthStore } from "../../stores/auth";
import { useToast } from "../../composables/useToast";
import RescheduleModal from "./RescheduleModal.vue";
import CancelModal from "./CancelModal.vue";
import RescheduleRequestModal from "./RescheduleRequestModal.vue";
import MarkAttendanceModal from "./MarkAttendanceModal.vue";

export default {
  name: "BookingDetailsModal",
  components: {
    RescheduleModal,
    CancelModal,
    RescheduleRequestModal,
    MarkAttendanceModal,
  },
  props: {
    booking: {
      type: Object,
      required: true,
    },
    showRescheduleRequest: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["close", "updated"],
  setup(props, { emit }) {
    const authStore = useAuthStore();
    const { showToast } = useToast();

    // Create a reactive local copy of the booking prop to ensure reactivity
    // This ensures computed properties update when the prop changes
    const localBooking = reactive({ ...props.booking });
    
    // Track if we're updating locally to prevent watch from overwriting
    let isLocalUpdate = false;
    
    // Watch the booking prop and update localBooking whenever it changes
    // But skip if we just made a local update (to preserve our immediate changes)
    watch(() => props.booking, (newBooking) => {
      // Don't overwrite if we just made a local update
      if (isLocalUpdate) {
        isLocalUpdate = false;
        // Merge in any new properties from prop update, but preserve our local changes
        const currentAttendanceStatus = localBooking.attendance_status;
        const currentSessionNotes = localBooking.session_notes;
        const currentStatus = localBooking.status;
        
        // Update from prop
        Object.assign(localBooking, newBooking);
        
        // Restore local changes if they exist (they're more recent)
        if (currentAttendanceStatus) {
          localBooking.attendance_status = currentAttendanceStatus;
        }
        if (currentSessionNotes) {
          localBooking.session_notes = currentSessionNotes;
        }
        if (currentStatus) {
          localBooking.status = currentStatus;
        }
      } else {
        // Normal prop update - merge all properties
        Object.assign(localBooking, newBooking);
      }
    }, { deep: true, immediate: true });

    // Reactive data
    const loading = ref(false);
    const showRescheduleModal = ref(false);
    const showCancelModal = ref(false);
    const showRescheduleRequestModal = ref(false);
    const showMarkAttendanceModal = ref(false);

    // Computed properties
    const isTutor = computed(() => {
      return (
        authStore.userType === "tutor" &&
        authStore.user?.id === localBooking.tutor_id
      );
    });

    const isStudent = computed(() => {
      return (
        authStore.userType === "student" &&
        authStore.user?.id === localBooking.student_id
      );
    });

    // Helper: Check if session is locked (attendance marked)
    const isSessionLocked = computed(() => {
      // Once attendance is marked, session becomes locked and cannot be rescheduled or cancelled
      const hasAttendanceMarked = localBooking.attendance_status && 
        (localBooking.attendance_status === 'attended' || localBooking.attendance_status === 'no_show');
      return hasAttendanceMarked;
    });

    const canReschedule = computed(() => {
      // Cannot reschedule if:
      // 1. Status is not scheduled or confirmed
      // 2. Attendance has been marked (session is locked)
      return (
        ["scheduled", "confirmed"].includes(localBooking.status) &&
        (isTutor.value || isStudent.value) &&
        !isSessionLocked.value // Cannot reschedule after attendance is marked
      );
    });

    const canCancel = computed(() => {
      // Cannot cancel if:
      // 1. Status is not scheduled or confirmed
      // 2. Attendance has been marked (session is locked)
      return (
        ["scheduled", "confirmed"].includes(localBooking.status) &&
        (isTutor.value || isStudent.value) &&
        !isSessionLocked.value // Cannot cancel after attendance is marked
      );
    });

    const canConfirm = computed(() => {
      return localBooking.status === "scheduled" && isTutor.value;
    });

    const canMarkAttendance = computed(() => {
      // Tutors can mark attendance for confirmed bookings AFTER the session starts
      // Only show if attendance hasn't been marked yet (sequential requirement)
      // Cannot mark attendance if booking is already completed
      return (
        localBooking.status === "confirmed" &&
        isTutor.value &&
        isSessionStarted() && // Session has started (changed from isPastBooking)
        !localBooking.attendance_status && // Attendance not yet marked
        localBooking.status !== "completed" // Not already completed
      );
    });

    const canComplete = computed(() => {
      // Tutors can mark as completed only after attendance has been marked
      // Sequential requirement: attendance must be marked first
      // Cannot complete if already completed
      const hasAttendanceMarked = localBooking.attendance_status && 
        (localBooking.attendance_status === 'attended' || localBooking.attendance_status === 'no_show');
      const pastBooking = isPastBooking();
      
      return (
        localBooking.status === "confirmed" &&
        isTutor.value &&
        pastBooking &&
        hasAttendanceMarked && // Must have attendance marked first (sequential flow)
        localBooking.status !== "completed" // Not already completed
      );
    });

    const canJoinMeeting = computed(() => {
      return (
        localBooking.is_online &&
        ["confirmed"].includes(localBooking.status) &&
        isWithinMeetingWindow()
      );
    });

    const getRescheduleRequestMessage = computed(() => {
      if (localBooking.reschedule_status !== "pending") return "";

      const isRequester =
        localBooking.reschedule_requested_by === authStore.user?.id;
      if (isRequester) {
        return "Waiting for the other party to respond to your reschedule request.";
      } else {
        const requesterType = localBooking.reschedule_requester_type;
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
      return new Date(localBooking.end || localBooking.end_time) < new Date();
    }

    function isSessionStarted() {
      return new Date(localBooking.start || localBooking.start_time) <= new Date();
    }

    function isWithinMeetingWindow() {
      const now = new Date();
      const startTime = new Date(
        localBooking.start || localBooking.start_time
      );
      const endTime = new Date(localBooking.end || localBooking.end_time);

      // Allow joining 15 minutes before start time
      const joinWindow = new Date(startTime.getTime() - 15 * 60 * 1000);

      return now >= joinWindow && now <= endTime;
    }

    async function confirmBooking() {
      try {
        loading.value = true;

        const response = await fetch(
          `/api/bookings/${localBooking.id}/confirm`,
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
          `/api/bookings/${localBooking.id}/complete`,
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

        const result = await response.json();
        
        // Mark that we're doing a local update to prevent watch from overwriting
        isLocalUpdate = true;
        
        // Immediately update local booking status to "completed" so UI updates without refresh
        if (result.data) {
          localBooking.status = "completed";
          // Also update any other fields from the response
          Object.assign(localBooking, result.data);
        } else {
          // Fallback: just set status to completed
          localBooking.status = "completed";
        }

        showToast("Booking marked as completed", "success");
        
        // Emit update with status change so parent component updates too
        emit("updated", { 
          status: "completed",
          ...result.data 
        });
      } catch (error) {
        console.error("Error completing booking:", error);
        showToast("Failed to complete booking", "error");
      } finally {
        loading.value = false;
      }
    }

    function joinMeeting() {
      const meetLink =
        localBooking.google_meet_link || localBooking.zoom_meeting_link;
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

    async function handleAttendanceMarked(attendanceData) {
      // Extract attendance_status from the response
      // The backend returns { message, booking: { attendance_status, ... } }
      // But if already_marked, it's directly in attendanceData
      const attendanceStatus = attendanceData.booking?.attendance_status || 
                               attendanceData.attendance_status || 
                               attendanceData.attendanceStatus;
      
      // Mark that we're doing a local update to prevent watch from overwriting
      isLocalUpdate = true;
      
      // Immediately update localBooking reactively so the "Mark as Completed" button appears instantly
      if (attendanceStatus) {
        localBooking.attendance_status = attendanceStatus;
        // Also update session_notes if provided
        const sessionNotes = attendanceData.booking?.session_notes || attendanceData.session_notes;
        if (sessionNotes) {
          localBooking.session_notes = sessionNotes;
        }
        console.log("✅ Updated localBooking with attendance_status:", attendanceStatus);
        
        // Wait for next tick to ensure reactivity is processed
        await nextTick();
        
        // Log computed property state for debugging
        console.log("✅ canComplete value:", canComplete.value);
        console.log("✅ localBooking.attendance_status:", localBooking.attendance_status);
        console.log("✅ localBooking.status:", localBooking.status);
        console.log("✅ isTutor:", isTutor.value);
        console.log("✅ isPastBooking:", isPastBooking());
      }
      
      // Emit the attendance data along with the update event after local update
      // so the parent can update the booking reactively too
      // The MarkAttendanceModal will close itself after emitting
      emit("updated", { 
        attendance_status: attendanceStatus,
        session_notes: attendanceData.booking?.session_notes || attendanceData.session_notes,
        ...attendanceData 
      });
    }

    // Watch for showRescheduleRequest prop to open modal
    watch(() => props.showRescheduleRequest, (shouldShow) => {
      if (shouldShow && localBooking.reschedule_status === 'pending') {
        showRescheduleRequestModal.value = true;
      }
    }, { immediate: true });

    // Lifecycle
    onMounted(() => {
      // If prop says to show reschedule request, open it
      if (props.showRescheduleRequest && localBooking.reschedule_status === 'pending') {
        showRescheduleRequestModal.value = true;
      }
    });

    return {
      loading,
      showRescheduleModal,
      showCancelModal,
      showRescheduleRequestModal,
      showMarkAttendanceModal,
      canMarkAttendance,
      handleAttendanceMarked,
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
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    sans-serif;
}

.modal-dialog {
  max-width: 800px;
  margin: 2rem auto;
}

.modal-content {
  /* Match calendar theme: darker background with orange border */
  background: rgba(26, 26, 26, 0.9) !important;
  backdrop-filter: blur(12px);
  border: 2px solid var(--cyber-orange, #ff8c42);
  border-radius: 20px;
  color: #ffffff;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0,0,0,0.1);
  overflow: hidden;
}

.modal-header {
  /* Header uses subtle darker strip and orange separator to match calendar */
  background: linear-gradient(135deg, rgba(28,28,28,0.95) 0%, rgba(24,24,24,0.95) 100%);
  border-bottom: 1px solid rgba(255, 140, 66, 0.08);
  border-radius: 20px 20px 0 0;
  padding: 1.25rem 1.5rem;
}

.modal-title {
  color: var(--cyber-orange, #ff8c42);
  font-weight: 800;
  font-size: 1.5rem;
  letter-spacing: -0.02em;
  margin: 0;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
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
  /* Body matches the darker calendar container */
  background: rgba(26, 26, 26, 0.9);
  color: #ffffff;
  padding: 1.75rem 1.5rem;
  font-size: 0.95rem;
  line-height: 1.6;
}

/* Improve detail typography: labels and values */
.modal-body p {
  margin-bottom: 0.9rem;
  font-size: 1.02rem;
  line-height: 1.45;
  color: rgba(255,255,255,0.95);
}

.modal-body p strong {
  display: inline-block;
  min-width: 150px;
  color: var(--cyber-orange);
  font-weight: 900;
  font-size: 1.02rem;
  text-transform: none;
}

/* Participants block styling */
.modal-body .avatar-sm {
  width: 40px;
  height: 40px;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}

.modal-body .col-md-6 > h6 {
  margin-bottom: 1rem;
  color: var(--cyber-text-muted);
  font-size: 0.85rem;
  letter-spacing: 0.08em;
}

/* Payment numbers emphasis */
.modal-body p strong + span, .modal-body p strong + em, .modal-body p strong + small {
  font-weight: 700;
}

.modal-body .payment-value {
  font-weight: 800;
  color: #ffffff;
}

.modal-footer {
  background: linear-gradient(135deg, rgba(28,28,28,0.95) 0%, rgba(24,24,24,0.95) 100%);
  border-top: 1px solid rgba(255, 140, 66, 0.08);
  border-radius: 0 0 20px 20px;
  padding: 1rem 1.25rem;
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
  background: linear-gradient(
    135deg,
    rgba(245, 158, 11, 0.2) 0%,
    rgba(217, 119, 6, 0.2) 100%
  );
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
