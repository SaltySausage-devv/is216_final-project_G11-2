<template>
  <div
    class="modal fade show"
    style="display: block; background-color: rgba(0, 0, 0, 0.5)"
  >
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="fas fa-clock me-2 text-warning"></i>
            Session Has Ended
          </h5>
          <button
            type="button"
            class="btn-close"
            @click="$emit('close')"
          ></button>
        </div>
        <div class="modal-body">
          <!-- Session Details -->
          <div class="mb-4">
            <h6 class="text-muted">Session Details</h6>
            <div class="session-info">
              <p class="mb-2">
                <strong>Date:</strong>
                {{ formatDate(booking.start_time) }}
              </p>
              <p class="mb-2">
                <strong>Time:</strong>
                {{ formatTime(booking.start_time) }} -
                {{ formatTime(booking.end_time) }}
              </p>
              <p class="mb-2">
                <strong>Tutor:</strong> {{ booking.tutor?.first_name }}
                {{ booking.tutor?.last_name }}
              </p>
              <p class="mb-2">
                <strong>Subject:</strong> {{ booking.subject }}
              </p>
              <p class="mb-2"><strong>Level:</strong> {{ booking.level }}</p>
            </div>
          </div>

          <!-- Action Selection -->
          <div
            v-if="!showReviewForm && !showAbsentForm"
            class="action-selection"
          >
            <h6 class="mb-3">What would you like to do?</h6>
            <div class="action-buttons">
              <button
                type="button"
                class="btn btn-success btn-lg action-btn"
                @click="showReviewForm = true"
              >
                <i class="fas fa-star me-2"></i>
                Leave a Review
                <small class="d-block"
                  >Rate your tutor and share feedback</small
                >
              </button>
              <button
                type="button"
                class="btn btn-danger btn-lg action-btn"
                @click="showAbsentForm = true"
              >
                <i class="fas fa-user-times me-2"></i>
                Mark Tutor as Absent
                <small class="d-block">Report if tutor didn't show up</small>
              </button>
            </div>
          </div>

          <!-- Review Form -->
          <form v-if="showReviewForm" @submit.prevent="submitReview">
            <div class="mb-4">
              <h6 class="mb-3">
                <i class="fas fa-star me-2 text-warning"></i>
                Rate Your Tutor
              </h6>

              <!-- Rating Stars -->
              <div class="rating-section mb-4">
                <div class="star-rating">
                  <span
                    v-for="star in 5"
                    :key="star"
                    class="star"
                    :class="{ active: star <= reviewForm.rating }"
                    @click="reviewForm.rating = star"
                  >
                    <i class="fas fa-star"></i>
                  </span>
                </div>
                <p class="rating-text mt-2">
                  {{ getRatingText(reviewForm.rating) }}
                </p>
              </div>

              <!-- Review Aspects -->
              <div class="mb-4">
                <label class="form-label"
                  >What was good about this session?</label
                >
                <div class="aspects-grid">
                  <div
                    v-for="aspect in reviewAspects"
                    :key="aspect.key"
                    class="form-check"
                  >
                    <input
                      type="checkbox"
                      :id="aspect.key"
                      v-model="reviewForm.aspects"
                      :value="aspect.key"
                      class="form-check-input"
                    />
                    <label class="form-check-label" :for="aspect.key">
                      <i :class="aspect.icon + ' me-2'"></i>
                      {{ aspect.label }}
                    </label>
                  </div>
                </div>
              </div>

              <!-- Comment -->
              <div class="mb-4">
                <label class="form-label">Additional Comments (Optional)</label>
                <textarea
                  v-model="reviewForm.comment"
                  class="form-control"
                  rows="4"
                  placeholder="Share your experience with this tutor..."
                ></textarea>
              </div>
            </div>
          </form>

          <!-- Absent Form -->
          <form v-if="showAbsentForm" @submit.prevent="submitAbsentReport">
            <div class="mb-4">
              <h6 class="mb-3">
                <i class="fas fa-user-times me-2 text-danger"></i>
                Report Tutor Absence
              </h6>

              <div class="alert alert-warning" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Important:</strong> Please provide proof that the tutor
                was absent. This helps us investigate the issue and take
                appropriate action.
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
                        >Take a photo showing the tutor was absent</small
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
              </div>

              <!-- Additional Notes -->
              <div class="mb-4">
                <label class="form-label">Additional Details (Optional)</label>
                <textarea
                  v-model="absentForm.notes"
                  class="form-control"
                  rows="3"
                  placeholder="Provide any additional details about the absence..."
                ></textarea>
              </div>
            </div>
          </form>

          <!-- Success Messages -->
          <div v-if="reviewSubmitted" class="success-message mb-4">
            <div class="success-content">
              <i class="fas fa-check-circle success-icon"></i>
              <h5 class="success-title">✓ Review Submitted Successfully!</h5>
              <p class="success-details">
                Thank you for your feedback. Your review helps other students
                make informed decisions.
              </p>
            </div>
          </div>

          <div v-if="absentReported" class="success-message mb-4">
            <div class="success-content">
              <i class="fas fa-check-circle success-icon"></i>
              <h5 class="success-title">✓ Absence Report Submitted!</h5>
              <p class="success-details">
                We've received your report and will investigate this matter. You
                may be eligible for a refund.
              </p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button
            v-if="!reviewSubmitted && !absentReported"
            type="button"
            class="btn btn-secondary"
            @click="goBack"
          >
            <i class="fas fa-arrow-left me-2"></i>
            Back
          </button>
          <button
            v-if="showReviewForm && !reviewSubmitted"
            type="button"
            class="btn btn-success"
            @click="submitReview"
            :disabled="loading || reviewForm.rating === 0"
          >
            <span
              v-if="loading"
              class="spinner-border spinner-border-sm me-2"
            ></span>
            <i class="fas fa-star me-2"></i>
            Submit Review
          </button>
          <button
            v-if="showAbsentForm && !absentReported"
            type="button"
            class="btn btn-danger"
            @click="submitAbsentReport"
            :disabled="loading || !proofPhoto"
          >
            <span
              v-if="loading"
              class="spinner-border spinner-border-sm me-2"
            ></span>
            <i class="fas fa-user-times me-2"></i>
            Report Absence
          </button>
          <button
            v-if="reviewSubmitted || absentReported"
            type="button"
            class="btn btn-primary"
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
  name: "SessionEndModal",
  props: {
    booking: {
      type: Object,
      required: true,
    },
  },
  emits: ["close", "review-submitted", "absent-reported"],
  setup(props, { emit }) {
    const authStore = useAuthStore();
    const { showToast } = useToast();

    // Reactive data
    const loading = ref(false);
    const showReviewForm = ref(false);
    const showAbsentForm = ref(false);
    const reviewSubmitted = ref(false);
    const absentReported = ref(false);

    // Review form data
    const reviewForm = ref({
      rating: 0,
      comment: "",
      aspects: [],
    });

    // Absent form data
    const absentForm = ref({
      notes: "",
    });

    // Photo upload data
    const proofPhoto = ref(null);
    const proofPhotoPreview = ref("");
    const fileInput = ref(null);

    // Review aspects
    const reviewAspects = ref([
      { key: "knowledge", label: "Subject Knowledge", icon: "fas fa-brain" },
      { key: "communication", label: "Communication", icon: "fas fa-comments" },
      { key: "patience", label: "Patience", icon: "fas fa-heart" },
      { key: "preparation", label: "Preparation", icon: "fas fa-book" },
      { key: "punctuality", label: "Punctuality", icon: "fas fa-clock" },
      { key: "engagement", label: "Student Engagement", icon: "fas fa-users" },
      {
        key: "clarity",
        label: "Explanation Clarity",
        icon: "fas fa-lightbulb",
      },
      {
        key: "helpfulness",
        label: "Helpfulness",
        icon: "fas fa-hands-helping",
      },
    ]);

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

    function getRatingText(rating) {
      const texts = {
        0: "Select a rating",
        1: "Poor",
        2: "Fair",
        3: "Good",
        4: "Very Good",
        5: "Excellent",
      };
      return texts[rating] || "Select a rating";
    }

    function goBack() {
      showReviewForm.value = false;
      showAbsentForm.value = false;
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

    async function submitReview() {
      try {
        loading.value = true;

        if (reviewForm.value.rating === 0) {
          showToast("Please select a rating", "error");
          return;
        }

        const payload = {
          tutor_id: props.booking.tutor_id,
          student_id: props.booking.student_id,
          booking_id: props.booking.id,
          rating: reviewForm.value.rating,
          comment: reviewForm.value.comment || null,
          aspects:
            reviewForm.value.aspects.length > 0
              ? reviewForm.value.aspects
              : null,
        };

        console.log("Submitting review:", payload);

        const response = await fetch("/api/reviews", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authStore.token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to submit review");
        }

        const result = await response.json();
        showToast("Review submitted successfully", "success");
        reviewSubmitted.value = true;

        // Emit event to parent
        emit("review-submitted", result);

        // Close modal after a short delay
        setTimeout(() => {
          emit("close");
        }, 2000);
      } catch (error) {
        console.error("Error submitting review:", error);
        showToast("Failed to submit review", "error");
      } finally {
        loading.value = false;
      }
    }

    async function submitAbsentReport() {
      try {
        loading.value = true;

        if (!proofPhoto.value) {
          showToast("Please upload a proof photo", "error");
          return;
        }

        // Create form data for file upload
        const formData = new FormData();
        formData.append("booking_id", props.booking.id);
        formData.append("tutor_id", props.booking.tutor_id);
        formData.append("student_id", props.booking.student_id);
        formData.append("notes", absentForm.value.notes || "");
        formData.append("proof_photo", proofPhoto.value);

        console.log("Submitting absent report for booking:", props.booking.id);

        const response = await fetch("/api/bookings/report-absence", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to report absence");
        }

        const result = await response.json();
        showToast("Absence report submitted successfully", "success");
        absentReported.value = true;

        // Emit event to parent
        emit("absent-reported", result);

        // Close modal after a short delay
        setTimeout(() => {
          emit("close");
        }, 2000);
      } catch (error) {
        console.error("Error reporting absence:", error);
        showToast("Failed to report absence", "error");
      } finally {
        loading.value = false;
      }
    }

    return {
      loading,
      showReviewForm,
      showAbsentForm,
      reviewSubmitted,
      absentReported,
      reviewForm,
      absentForm,
      proofPhoto,
      proofPhotoPreview,
      fileInput,
      reviewAspects,
      formatDate,
      formatTime,
      getRatingText,
      goBack,
      triggerFileInput,
      handleFileSelect,
      removePhoto,
      submitReview,
      submitAbsentReport,
    };
  },
};
</script>

<style scoped>
.modal {
  z-index: 1060;
}

.modal-dialog {
  max-width: 700px;
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
  color: #4ecdc4 !important;
}

.text-warning {
  color: #ffa726 !important;
}

strong {
  color: #ffffff;
}

/* Session Info Styling */
.session-info {
  background: #3a3a52;
  border: 1px solid rgba(255, 107, 53, 0.2);
  border-radius: 8px;
  padding: 1rem;
}

/* Action Selection Styling */
.action-selection {
  text-align: center;
  padding: 2rem 0;
}

.action-buttons {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  min-width: 200px;
  padding: 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.action-btn small {
  display: block;
  margin-top: 0.5rem;
  opacity: 0.8;
  font-size: 0.8rem;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Rating Styling */
.rating-section {
  text-align: center;
}

.star-rating {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.star {
  font-size: 2rem;
  color: #aaaaaa;
  cursor: pointer;
  transition: all 0.2s ease;
}

.star:hover,
.star.active {
  color: #ffa726;
  transform: scale(1.1);
}

.rating-text {
  color: #ffa726;
  font-weight: 600;
  font-size: 1.1rem;
}

/* Aspects Grid */
.aspects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
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
  font-size: 0.9rem;
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

.btn-success {
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
  border: none;
  color: #ffffff;
  border-radius: 8px;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  transition: all 0.3s ease;
}

.btn-success:hover {
  background: linear-gradient(135deg, #44a08d 0%, #3a8b7a 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
}

.btn-danger {
  background: linear-gradient(135deg, #ff6b6b 0%, #e55a5a 100%);
  border: none;
  color: #ffffff;
  border-radius: 8px;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  transition: all 0.3s ease;
}

.btn-danger:hover {
  background: linear-gradient(135deg, #e55a5a 0%, #d14a4a 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
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

.btn:disabled {
  opacity: 0.6;
  transform: none;
  box-shadow: none;
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
  color: #4ecdc4;
  margin-bottom: 1rem;
}

.success-title {
  color: #4ecdc4;
  font-weight: 700;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.success-details {
  color: #ffffff;
  margin-bottom: 0;
  font-size: 1rem;
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

/* Responsive */
@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }

  .action-btn {
    min-width: 100%;
    max-width: 300px;
  }

  .aspects-grid {
    grid-template-columns: 1fr;
  }
}
</style>
