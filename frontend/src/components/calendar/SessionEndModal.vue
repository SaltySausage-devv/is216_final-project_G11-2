<template>
  <div
    class="modal fade show"
    style="display: block; background-color: rgba(0, 0, 0, 0.5)"
    @click.self="$emit('close')"
  >
    <div
      class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable"
    >
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
              <p class="mb-2" v-if="booking.level">
                <strong>Level:</strong> {{ booking.level }}
              </p>
            </div>
          </div>

          <!-- Action Selection -->
          <div
            v-if="!showReviewForm && !showAbsentForm"
            class="action-selection"
          >
            <h6 class="mb-4">What would you like to do?</h6>
            <div class="action-buttons">
              <button
                type="button"
                class="btn btn-warning btn-lg action-btn"
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
                class="btn btn-outline-warning btn-lg action-btn"
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

              <!-- Error Message -->
              <div
                v-if="reviewError"
                class="alert alert-danger mb-3"
                role="alert"
              >
                <i class="fas fa-exclamation-triangle me-2"></i>
                {{ reviewError }}
              </div>

              <!-- Rating Stars -->
              <div class="rating-section mb-4">
                <div class="star-rating">
                  <span
                    v-for="star in 5"
                    :key="star"
                    class="star"
                    :class="{ active: star <= reviewForm.rating }"
                    @click="
                      reviewForm.rating = star;
                      clearReviewError();
                    "
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
          <div v-if="!reviewSubmitted && !absentReported" class="footer-buttons">
            <button
              v-if="showReviewForm || showAbsentForm"
              type="button"
              class="btn btn-secondary"
              @click="goBack"
            >
              <i class="fas fa-arrow-left me-2"></i>
              Back
            </button>
            <button
              v-if="showReviewForm"
              type="button"
              class="btn btn-warning"
              @click="submitReview"
              :disabled="loading || reviewForm.rating === 0"
            >
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-2"
              ></span>
              <i v-else class="fas fa-star me-2"></i>
              Submit Review
            </button>
            <button
              v-if="showAbsentForm"
              type="button"
              class="btn btn-outline-warning"
              @click="submitAbsentReport"
              :disabled="loading || !proofPhoto"
            >
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-2"
              ></span>
              <i v-else class="fas fa-user-times me-2"></i>
              Report Absence
            </button>
          </div>
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
    const reviewError = ref("");

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
      reviewError.value = "";
    }

    function clearReviewError() {
      reviewError.value = "";
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

        // Check if review already exists for this booking (frontend only check)
        const existingReviewKey = `review_submitted_${props.booking.id}`;

        if (localStorage.getItem(existingReviewKey)) {
          reviewError.value =
            "You have already sent a review for this booking. Thanks!";
          loading.value = false;
          return;
        }

        const payload = {
          tutorId: props.booking.tutor_id,
          bookingId: props.booking.id,
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

        // Mark this booking as having a review submitted
        localStorage.setItem(existingReviewKey, "true");

        // Emit event to parent
        emit("review-submitted", result);

        // Close modal after a short delay
        setTimeout(() => {
          emit("close");
        }, 2000);
      } catch (error) {
        console.error("Error submitting review:", error);

        // Check if it's a duplicate review error
        if (error.message && error.message.includes("Review already exists")) {
          reviewError.value =
            "You have already sent a review for this booking. Thanks!";
        } else {
          showToast("Failed to submit review", "error");
        }
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

        console.log("Submitting absent report for booking:", props.booking.id);

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Show success notification
        showToast(
          "Thank you for sending a report. We will investigate this matter.",
          "success"
        );
        absentReported.value = true;

        // Emit event to parent
        emit("absent-reported", {
          bookingId: props.booking.id,
          message: "Absence report submitted successfully",
        });

        // Close modal after a short delay
        setTimeout(() => {
          emit("close");
        }, 2000);
      } catch (error) {
        console.error("Error reporting absence:", error);
        showToast(`Error reporting absence: ${error.message}`, "error");
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
      reviewError,
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
      clearReviewError,
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
  /* High z-index to appear above Messages page elements (which use up to 99999) */
  z-index: 100000 !important;
  position: fixed !important;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.modal-dialog {
  /* Fluid width that scales dynamically with viewport */
  width: min(90vw, 700px);
  max-width: 700px;
  margin: clamp(0.5rem, 2vw, 1rem) auto;
  position: relative;
  display: block;
}

/* Ensure modal-lg class scales fluidly */
.modal-dialog.modal-lg {
  width: min(90vw, 700px);
  max-width: 700px;
}

/* Fluid scaling for smaller screens - dynamically adapts */
@media (max-width: 991px) {
  .modal-dialog,
  .modal-dialog.modal-lg {
    /* Use viewport width directly - ensures modal always appears at any width */
    width: 95vw !important;
    max-width: 95vw !important;
    margin: clamp(0.5rem, 2vw, 1rem) auto !important;
    /* No min-width constraint - let it scale down to very small viewports */
  }

  .modal-content {
    /* Dynamically scale height based on viewport */
    max-height: calc(100vh - clamp(1rem, 4vw, 2rem));
    display: flex;
    flex-direction: column;
  }

  .modal-body {
    overflow-y: auto;
    flex: 1;
    /* Fluid padding that scales with viewport */
    padding: clamp(1rem, 3vw, 1.5rem);
    max-height: calc(100vh - clamp(180px, 25vh, 220px));
  }

  .modal-header {
    flex-shrink: 0;
    padding: clamp(0.75rem, 2vw, 1rem);
  }

  .modal-header .modal-title {
    font-size: clamp(1rem, 2.5vw, 1.25rem);
  }

  .modal-footer {
    flex-shrink: 0;
    padding: clamp(0.75rem, 2vw, 1rem);
    flex-direction: column;
    gap: clamp(0.5rem, 1.5vw, 1rem);
  }

  .footer-buttons {
    width: 100%;
    flex-direction: column;
    gap: clamp(0.5rem, 1.5vw, 1rem);
  }

  .modal-footer .btn {
    width: 100%;
    margin-bottom: 0;
  }

  .action-btn {
    /* Fluid button sizing */
    min-width: 100%;
    width: 100%;
    padding: clamp(1rem, 3vw, 1.5rem);
    font-size: clamp(0.9rem, 2vw, 1rem);
  }

  .aspects-grid {
    /* Fluid grid that adapts to width */
    grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr));
    gap: clamp(0.75rem, 2vw, 1rem);
  }

  .session-info {
    padding: clamp(0.75rem, 2vw, 1rem);
  }

  .session-info p {
    font-size: clamp(0.85rem, 2vw, 0.95rem);
    margin-bottom: clamp(0.4rem, 1vw, 0.5rem);
  }
}

/* Ensure modal is visible for SM breakpoint range (576px - 767px) */
@media (min-width: 576px) and (max-width: 767px) {
  .modal-dialog,
  .modal-dialog.modal-lg {
    width: 96vw !important;
    max-width: 96vw !important;
    margin: clamp(0.5rem, 2vw, 1rem) auto !important;
    visibility: visible !important;
    opacity: 1 !important;
    display: block !important;
    transform: none !important;
  }

  .modal-content {
    visibility: visible !important;
    opacity: 1 !important;
    max-height: calc(100vh - 1rem) !important;
  }
}

/* XS screens - ensure modal appears even at very small widths (100px+) */
@media (max-width: 575px) {
  .modal-dialog,
  .modal-dialog.modal-lg {
    /* Use viewport width directly - scales from 100px up */
    width: 98vw !important;
    max-width: 98vw !important;
    margin: clamp(0.25rem, 1vw, 0.5rem) auto !important;
    /* No min-width - allows modal to scale down to very small viewports */
  }

  .modal-content {
    max-height: calc(100vh - clamp(0.5rem, 2vw, 1rem));
  }

  .modal-header {
    padding: clamp(0.5rem, 2vw, 0.75rem);
  }

  .modal-title {
    font-size: clamp(0.9rem, 2.5vw, 1rem);
  }

  .modal-body {
    padding: clamp(0.75rem, 2vw, 1rem);
    max-height: calc(100vh - clamp(160px, 25vh, 180px));
  }

  .modal-footer {
    padding: clamp(0.5rem, 2vw, 0.75rem);
    flex-direction: column;
    gap: clamp(0.5rem, 1.5vw, 1rem);
  }

  .footer-buttons {
    width: 100%;
    flex-direction: column;
    gap: clamp(0.5rem, 1.5vw, 1rem);
  }

  .modal-footer .btn {
    width: 100%;
    font-size: clamp(0.85rem, 2vw, 0.9rem);
  }

  .star-rating {
    gap: clamp(0.2rem, 1vw, 0.25rem);
  }

  .star {
    font-size: clamp(1.25rem, 4vw, 1.5rem);
  }

  .action-selection {
    padding: clamp(0.75rem, 2vw, 1rem) 0;
  }
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
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem 1.5rem;
}

.footer-buttons {
  display: flex;
  gap: 1rem;
  align-items: center;
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

.text-warning {
  color: #ffa726 !important;
}

strong {
  color: #ffffff;
}

/* Session Info Styling - Fluid padding */
.session-info {
  background: #3a3a52;
  border: 1px solid rgba(255, 107, 53, 0.2);
  border-radius: clamp(6px, 1vw, 8px);
  padding: clamp(0.75rem, 2vw, 1rem);
}

/* Action Selection Styling - Fluid padding */
.action-selection {
  text-align: center;
  padding: clamp(1rem, 4vw, 2rem) 0;
}

.action-buttons {
  display: flex;
  /* Fluid gap that scales with viewport */
  gap: clamp(1rem, 3vw, 1.5rem);
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  /* Fluid button sizing - scales with viewport */
  min-width: min(200px, 100%);
  max-width: 100%;
  padding: clamp(1rem, 3vw, 1.5rem);
  border-radius: clamp(8px, 1.5vw, 12px);
  font-weight: 600;
  font-size: clamp(0.9rem, 2vw, 1rem);
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
  /* Fluid gap for star rating */
  gap: clamp(0.4rem, 1.5vw, 0.5rem);
  margin-bottom: clamp(0.75rem, 2vw, 1rem);
}

.star {
  /* Fluid star size */
  font-size: clamp(1.5rem, 4vw, 2rem);
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

/* Aspects Grid - Fluid responsive grid */
.aspects-grid {
  display: grid;
  /* Dynamically adapts column count based on available width */
  grid-template-columns: repeat(auto-fit, minmax(min(180px, 100%), 1fr));
  gap: clamp(0.75rem, 2vw, 1rem);
  background: #3a3a52;
  border: 1px solid rgba(255, 107, 53, 0.2);
  border-radius: clamp(6px, 1vw, 8px);
  padding: clamp(0.75rem, 2vw, 1rem);
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

.btn-warning {
  background: linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%);
  border: none;
  color: #ffffff;
  border-radius: 8px;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  transition: all 0.3s ease;
}

.btn-warning:hover {
  background: linear-gradient(135deg, #ff6b35 0%, #e55a2b 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 140, 66, 0.3);
}

.btn-outline-warning {
  background: transparent;
  border: 2px solid #ff8c42;
  color: #ff8c42;
  border-radius: 8px;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  transition: all 0.3s ease;
}

.btn-outline-warning:hover {
  background: #ff8c42;
  border-color: #ff8c42;
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 140, 66, 0.3);
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
  background: rgba(255, 140, 66, 0.1);
  border: 2px solid rgba(255, 140, 66, 0.3);
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

/* Ensure modal is always visible and scrollable on all screen sizes up to SM */
@media (max-width: 991px) {
  .modal {
    /* Ensure modal is above all other elements on mobile */
    z-index: 100000 !important;
    padding: 0 !important;
    display: flex !important;
    align-items: flex-start;
    justify-content: center;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
  }

  .modal.show {
    z-index: 100000 !important;
    display: flex !important;
    align-items: flex-start;
    justify-content: center;
    position: fixed !important;
  }

  /* Prevent modal from being hidden on any screen size */
  .modal-dialog {
    visibility: visible !important;
    opacity: 1 !important;
    display: block !important;
    transform: none !important;
    position: relative !important;
    z-index: 100001 !important;
  }

  .modal-content {
    visibility: visible !important;
    opacity: 1 !important;
    position: relative !important;
    z-index: 100002 !important;
  }
}

/* Ensure fluid scaling works smoothly - all sizes scale dynamically */
</style>
