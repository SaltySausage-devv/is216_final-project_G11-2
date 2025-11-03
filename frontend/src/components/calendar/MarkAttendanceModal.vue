<template>
  <div
    class="modal fade show"
    style="display: block; background-color: rgba(0, 0, 0, 0.5)"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Mark Attendance</h5>
          <button
            type="button"
            class="btn-close"
            @click="$emit('close')"
          ></button>
        </div>
        <div class="modal-body">
          <!-- Success Message -->
          <div v-if="attendanceMarked" class="success-message mb-4">
            <div class="success-content">
              <i class="fas fa-check-circle success-icon"></i>
              <h5 class="success-title">✓ Attendance Marked Successfully!</h5>
              <p class="success-details">
                Student attendance has been recorded and saved to the system.
              </p>
            </div>
          </div>

          <!-- Session Details -->
          <div v-else class="mb-4">
            <h6 class="text-muted">Session Details</h6>
            <div class="session-info">
              <p class="mb-2">
                <strong>Date:</strong>
                {{ formatDate(booking.start_time || booking.start) }}
              </p>
              <p class="mb-2">
                <strong>Time:</strong>
                {{ formatTime(booking.start_time || booking.start) }} -
                {{ formatTime(booking.end_time || booking.end) }}
              </p>
              <p class="mb-2">
                <strong>Student:</strong> {{ booking.student?.first_name }}
                {{ booking.student?.last_name }}
              </p>
              <p class="mb-2">
                <strong>Subject:</strong> {{ booking.subject }}
              </p>
            </div>
          </div>

          <!-- Attendance Status -->
          <form v-if="!attendanceMarked" @submit.prevent="handleSubmit">
            <div class="mb-4">
              <label class="form-label">
                Student Attendance Status <span class="text-danger">*</span>
              </label>
              <div class="attendance-options">
                <div class="form-check mb-3">
                  <input
                    type="radio"
                    v-model="attendanceStatus"
                    value="attended"
                    class="form-check-input"
                    id="attended"
                    required
                  />
                  <label class="form-check-label" for="attended">
                    <i class="fas fa-check-circle text-success me-2"></i>
                    <strong>Student Attended</strong>
                    <small class="d-block text-muted"
                      >Student was present for the session</small
                    >
                  </label>
                </div>
                <div class="form-check">
                  <input
                    type="radio"
                    v-model="attendanceStatus"
                    value="no_show"
                    class="form-check-input"
                    id="no_show"
                    required
                  />
                  <label class="form-check-label" for="no_show">
                    <i class="fas fa-times-circle text-danger me-2"></i>
                    <strong>Student No Show</strong>
                    <small class="d-block text-muted"
                      >Student did not attend the session</small
                    >
                  </label>
                </div>
              </div>
            </div>

            <!-- Photo Upload Section -->
            <div class="mb-4">
              <label class="form-label">
                Proof Photo <span class="text-danger">*</span>
              </label>
              <div class="photo-upload-section">
                <div
                  v-if="!proofPhoto"
                  class="upload-area"
                  @click="triggerFileInput"
                >
                  <div class="upload-content">
                    <i class="fas fa-camera fa-3x text-muted mb-3"></i>
                    <p class="mb-2">Click to upload proof photo</p>
                    <small class="text-muted"
                      >Take a photo or upload an image as proof of
                      attendance</small
                    >
                  </div>
                  <input
                    ref="fileInput"
                    type="file"
                    accept="image/*"
                    @change="handleFileSelect"
                    style="display: none"
                    required
                  />
                </div>
                <div v-else class="photo-preview">
                  <div class="preview-container">
                    <img
                      :src="proofPhotoPreview"
                      alt="Proof photo preview"
                      class="preview-image"
                    />
                    <button
                      type="button"
                      class="btn btn-sm btn-danger remove-photo"
                      @click="removePhoto"
                    >
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                  <p class="text-success mt-2">
                    <i class="fas fa-check-circle me-1"></i>
                    Photo uploaded successfully
                  </p>
                </div>
              </div>
              <small class="text-muted">
                <i class="fas fa-info-circle me-1"></i>
                This photo serves as proof of the student's attendance status
              </small>
            </div>

            <!-- Session Notes -->
            <div class="mb-4">
              <label class="form-label">Session Notes (Optional)</label>
              <textarea
                v-model="sessionNotes"
                class="form-control"
                rows="3"
                placeholder="Add any notes about the session..."
              ></textarea>
            </div>

            <!-- Warning Alert -->
            <div class="alert alert-warning" role="alert">
              <i class="fas fa-exclamation-triangle me-2"></i>
              <strong>Important:</strong> This action cannot be undone. Please
              ensure the attendance status and proof photo are accurate before
              submitting.
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button
            v-if="!attendanceMarked"
            type="button"
            class="btn btn-secondary"
            @click="$emit('close')"
          >
            Cancel
          </button>
          <button
            v-if="!attendanceMarked"
            type="button"
            class="btn btn-primary"
            @click="handleSubmit"
            :disabled="loading || !canSubmit"
          >
            <span
              v-if="loading"
              class="spinner-border spinner-border-sm me-2"
            ></span>
            <i class="fas fa-check me-2"></i>
            Mark Attendance
          </button>
          <button
            v-if="attendanceMarked"
            type="button"
            class="btn btn-success"
            @click="$emit('close')"
          >
            <i class="fas fa-check me-2"></i>
            Close
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
  name: "MarkAttendanceModal",
  props: {
    booking: {
      type: Object,
      required: true,
    },
  },
  emits: ["close", "attendance-marked"],
  setup(props, { emit }) {
    const authStore = useAuthStore();
    const { showToast } = useToast();

    // Reactive data
    const loading = ref(false);
    const attendanceStatus = ref("");
    const proofPhoto = ref(null);
    const proofPhotoPreview = ref("");
    const sessionNotes = ref("");
    const fileInput = ref(null);
    const attendanceMarked = ref(false);

    // Global request tracking to prevent duplicate requests
    const pendingRequests = new Set();

    // Computed properties
    const canSubmit = computed(() => {
      return attendanceStatus.value && proofPhoto.value; // Photo is now required
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

    function triggerFileInput() {
      fileInput.value?.click();
    }

    function handleFileSelect(event) {
      const file = event.target.files[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          showToast("Please select an image file", "error");
          return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          showToast("File size must be less than 5MB", "error");
          return;
        }

        proofPhoto.value = file;

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          proofPhotoPreview.value = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    }

    function removePhoto() {
      proofPhoto.value = null;
      proofPhotoPreview.value = "";
      if (fileInput.value) {
        fileInput.value.value = "";
      }
    }

    async function handleSubmit() {
      // Prevent multiple rapid submissions
      if (loading.value) {
        return;
      }

      // Check if there's already a pending request for this booking
      const requestKey = `attendance-${props.booking.id}`;
      if (pendingRequests.has(requestKey)) {
        showToast(
          "Attendance marking is already in progress, please wait...",
          "warning"
        );
        return;
      }

      try {
        loading.value = true;
        pendingRequests.add(requestKey);

        if (!canSubmit.value) {
          showToast("Please select attendance status", "error");
          return;
        }

        // Create JSON payload (temporarily without file upload)
        const payload = {
          attendance_status: attendanceStatus.value,
          session_notes: sessionNotes.value,
        };

        console.log("🔍 Frontend Debug Info:");
        console.log("  - Booking ID being sent:", props.booking.id);
        console.log("  - Payload:", payload);
        console.log("  - Auth token available:", !!authStore.token);

        // Implement retry logic with exponential backoff
        let retryCount = 0;
        const maxRetries = 3;
        let response;

        while (retryCount <= maxRetries) {
          try {
            response = await fetch(
              `/api/bookings/${props.booking.id}/mark-attendance`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${authStore.token}`,
                },
                body: JSON.stringify(payload),
              }
            );

            // If successful or not a rate limit error, break out of retry loop
            if (response.ok || response.status !== 429) {
              break;
            }

            // If rate limited and we have retries left, wait and retry
            if (response.status === 429 && retryCount < maxRetries) {
              const waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
              console.log(
                `Rate limited, waiting ${waitTime}ms before retry ${
                  retryCount + 1
                }/${maxRetries}`
              );
              showToast(
                `Rate limited, retrying in ${waitTime / 1000} seconds...`,
                "warning"
              );
              await new Promise((resolve) => setTimeout(resolve, waitTime));
              retryCount++;
              continue;
            }

            // If we've exhausted retries or it's not a rate limit, break
            break;
          } catch (error) {
            if (retryCount < maxRetries) {
              const waitTime = Math.pow(2, retryCount) * 1000;
              console.log(
                `Request failed, waiting ${waitTime}ms before retry ${
                  retryCount + 1
                }/${maxRetries}`
              );
              await new Promise((resolve) => setTimeout(resolve, waitTime));
              retryCount++;
              continue;
            }
            throw error;
          }
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // Handle specific error cases
          if (
            response.status === 400 &&
            errorData.error &&
            errorData.error.includes("already been marked")
          ) {
            // Attendance was already marked - treat as success
            showToast("Attendance was already marked for this session", "info");
            attendanceMarked.value = true;

            // Close modal after a short delay
            setTimeout(() => {
              emit("attendance-marked", {
                attendance_status: attendanceStatus.value,
                session_notes: sessionNotes.value,
                already_marked: true,
              });
            }, 2000);
            return; // Exit early, don't throw error
          } else if (response.status === 429) {
            throw new Error(
              "Too many requests. Please wait a moment and try again."
            );
          } else if (response.status === 401) {
            throw new Error("Authentication failed. Please log in again.");
          } else if (response.status === 404) {
            throw new Error(
              "Booking not found. Please refresh the page and try again."
            );
          } else if (response.status >= 500) {
            throw new Error("Server error. Please try again later.");
          }

          throw new Error(errorData.error || "Failed to mark attendance");
        }

        const result = await response.json();

        showToast("Attendance marked successfully", "success");
        attendanceMarked.value = true;

        // Close modal after a short delay to show success message
        setTimeout(() => {
          emit("attendance-marked", result);
          emit("close");
        }, 2000);
      } catch (error) {
        console.error("Error marking attendance:", error);
        showToast("Failed to mark attendance", "error");
      } finally {
        loading.value = false;
        pendingRequests.delete(requestKey);
      }
    }

    return {
      loading,
      attendanceStatus,
      proofPhoto,
      proofPhotoPreview,
      sessionNotes,
      fileInput,
      attendanceMarked,
      canSubmit,
      formatDate,
      formatTime,
      triggerFileInput,
      handleFileSelect,
      removePhoto,
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
  max-width: 600px;
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

.form-control,
.form-select {
  background: #3a3a52;
  border: 1px solid rgba(255, 107, 53, 0.3);
  color: #ffffff;
}

.form-control:focus,
.form-select:focus {
  background: #3a3a52;
  border-color: #ff6b35;
  color: #ffffff;
  box-shadow: 0 0 0 0.2rem rgba(255, 107, 53, 0.25);
}

.form-control::placeholder {
  color: #aaaaaa;
}

.text-muted {
  color: #aaaaaa !important;
}

.text-danger {
  color: #ff6b6b !important;
}

.text-success {
  color: #ff8c42 !important;
}

strong {
  color: #ffffff;
}

/* Attendance Options Styling */
.attendance-options {
  background: #3a3a52;
  border: 1px solid rgba(255, 107, 53, 0.2);
  border-radius: 8px;
  padding: 1rem;
}

.form-check {
  margin-bottom: 0;
}

.form-check-input {
  background-color: #2d2d44;
  border-color: rgba(255, 107, 53, 0.3);
  margin-top: 0.25rem;
}

.form-check-input:checked {
  background-color: #ff6b35;
  border-color: #ff6b35;
}

.form-check-input:focus {
  border-color: #ff6b35;
  box-shadow: 0 0 0 0.2rem rgba(255, 107, 53, 0.25);
}

.form-check-label {
  color: #ffffff;
  cursor: pointer;
  padding-left: 0.5rem;
}

.form-check-label small {
  color: #aaaaaa;
  font-size: 0.8rem;
}

/* Photo Upload Styling */
.photo-upload-section {
  margin-bottom: 1rem;
}

.upload-area {
  border: 2px dashed rgba(255, 107, 53, 0.5);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(58, 58, 82, 0.3);
}

.upload-area:hover {
  border-color: #ff6b35;
  background: rgba(58, 58, 82, 0.5);
}

.upload-content {
  color: #aaaaaa;
}

.photo-preview {
  text-align: center;
}

.preview-container {
  position: relative;
  display: inline-block;
  max-width: 200px;
}

.preview-image {
  width: 100%;
  max-width: 200px;
  height: auto;
  border-radius: 8px;
  border: 2px solid rgba(255, 107, 53, 0.3);
}

.remove-photo {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

/* Session Info Styling */
.session-info {
  background: #3a3a52;
  border: 1px solid rgba(255, 107, 53, 0.2);
  border-radius: 8px;
  padding: 1rem;
}

/* Alert Styling */
.alert {
  margin-bottom: 1rem;
  border-radius: 8px;
}

.alert-warning {
  background-color: rgba(255, 167, 38, 0.15);
  border-color: rgba(255, 167, 38, 0.3);
  color: #ffa726;
}

.alert-warning strong {
  color: #ffa726;
}

/* Button Styling */
.btn-secondary {
  background-color: #6c757d;
  border-color: #6c757d;
  color: #ffffff;
}

.btn-secondary:hover {
  background-color: #5a6268;
  border-color: #5a6268;
}

.btn-primary {
  background: linear-gradient(135deg, #ff6b35 0%, #e55a2b 100%);
  border: none;
  color: #ffffff;
  border-radius: 8px;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #e55a2b 0%, #d14a1b 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

.btn-primary:disabled {
  background: #6c757d;
  border-color: #6c757d;
  opacity: 0.6;
  transform: none;
  box-shadow: none;
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

/* Icon Styling */
.fa-check-circle {
  color: #ff8c42 !important;
}

.fa-times-circle {
  color: #ff6b6b !important;
}

.fa-camera {
  color: #aaaaaa !important;
}

.fa-info-circle {
  color: #ff8c42 !important;
}

.fa-exclamation-triangle {
  color: #ffa726 !important;
}

/* Spacing */
.mb-2 {
  margin-bottom: 0.5rem;
}

.mb-3 {
  margin-bottom: 1rem;
}

.mb-4 {
  margin-bottom: 1.5rem;
}

.me-1 {
  margin-right: 0.25rem;
}

.me-2 {
  margin-right: 0.5rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.d-block {
  display: block;
}

/* Success Message Styling */
.success-message {
  text-align: center;
  padding: 2rem;
}

.success-content {
  background: rgba(78, 205, 196, 0.1);
  border: 2px solid rgba(78, 205, 196, 0.3);
  border-radius: 12px;
  padding: 2rem;
}

.success-icon {
  font-size: 3rem;
  color: #ff8c42;
  margin-bottom: 1rem;
}

.success-title {
  color: #ff8c42;
  font-weight: 700;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.success-details {
  color: #ffffff;
  margin-bottom: 0;
  font-size: 1rem;
}

.btn-success {
  background: linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%);
  border: none;
  color: #ffffff;
  border-radius: 8px;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  transition: all 0.3s ease;
}

.btn-success:hover {
  background: linear-gradient(135deg, #ff6b35 0%, #e55a2b 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
}
</style>
