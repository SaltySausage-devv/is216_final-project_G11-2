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

            <!-- New Location Selection -->
            <div class="mb-3">
              <label class="form-label">New Location (Optional)</label>
              <div class="position-relative">
                <input
                  type="text"
                  v-model="newLocation"
                  class="form-control"
                  placeholder="Enter new location or keep current location"
                  @input="handleLocationInput"
                  @keydown="handleLocationKeyDown"
                  @focus="handleLocationFocus"
                  @blur="handleLocationBlur"
                />
                <i
                  class="fas fa-map-marker-alt position-absolute top-50 end-0 translate-middle-y me-3 text-muted"
                ></i>

                <!-- Location Suggestions Dropdown -->
                <div
                  v-if="
                    showLocationSuggestions && locationSuggestions.length > 0
                  "
                  class="location-suggestions"
                >
                  <div
                    v-for="(suggestion, index) in locationSuggestions"
                    :key="suggestion.place_id"
                    class="suggestion-item"
                    :class="{ active: selectedLocationIndex === index }"
                    @mousedown.prevent="selectLocation(suggestion)"
                    @mouseenter="selectedLocationIndex = index"
                  >
                    <i class="fas fa-map-marker-alt me-2 text-primary"></i>
                    <div>
                      <div class="suggestion-main">
                        {{ suggestion.structured_formatting.main_text }}
                      </div>
                      <div class="suggestion-secondary">
                        {{ suggestion.structured_formatting.secondary_text }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <small class="text-muted">
                <i class="fas fa-info-circle me-1"></i>
                Leave empty to keep the current location:
                {{ booking.location || "Not specified" }}
              </small>
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

            <!-- Credits Information -->
            <div class="mb-3">
              <div v-if="loadingTutorRate" class="alert alert-info">
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
                        <span
                          class="fw-bold ms-2"
                          :class="creditChangeTextClass"
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
                  <span class="text-muted"
                    >Tutor hourly rate not available</span
                  >
                </div>
              </div>
            </div>

            <!-- Summary -->
            <div
              v-if="newDate && newStartTime && newEndTime"
              class="alert alert-success"
            >
              <strong>New Booking Details:</strong><br />
              <div class="mb-2">
                <strong>Time:</strong> {{ formatDate(newDate) }} from
                {{ newStartTime }} to {{ newEndTime }}
                <span v-if="isValidTimeRange" class="text-success ms-2">
                  ✓ Valid time range
                </span>
                <span v-else class="text-danger ms-2">
                  ✗ End time must be after start time
                </span>
              </div>
              <div v-if="newLocation">
                <strong>Location:</strong> {{ newLocation }}
              </div>
              <div v-else>
                <strong>Location:</strong>
                <span class="text-muted">{{
                  booking.location || "Current location will be kept"
                }}</span>
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
import { ref, computed, onMounted } from "vue";
import { useToast } from "../../composables/useToast";
import { useAuthStore } from "../../stores/auth";
import { useCreditService } from "../../services/creditService";

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
    const creditService = useCreditService();

    // Reactive data
    const loading = ref(false);
    const newDate = ref("");
    const newStartTime = ref("");
    const newEndTime = ref("");
    const newLocation = ref("");
    const reason = ref("");

    // Location autocomplete data
    const locationSuggestions = ref([]);
    const showLocationSuggestions = ref(false);
    const selectedLocationIndex = ref(-1);
    const locationSearchTimeout = ref(null);

    // Google Maps services
    const googleMaps = ref(null);
    const googleMapsReady = ref(false);
    const googleMapsError = ref(null);
    const autocompleteService = ref(null);
    const placesService = ref(null);

    // Credits calculation
    const tutorHourlyRate = ref(0);
    const loadingTutorRate = ref(false);

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

    // Calculate session duration in hours
    const sessionDurationInHours = computed(() => {
      if (!newStartTime.value || !newEndTime.value) return 0;

      const startTime = new Date(`2000-01-01T${newStartTime.value}`);
      const endTime = new Date(`2000-01-01T${newEndTime.value}`);
      const diffMs = endTime - startTime;
      const diffHours = diffMs / (1000 * 60 * 60);

      return Math.max(0, diffHours);
    });

    // Calculate credits based on hourly rate and duration
    const calculatedCredits = computed(() => {
      if (!tutorHourlyRate.value || !sessionDurationInHours.value)
        return "0.00";

      const total = tutorHourlyRate.value * sessionDurationInHours.value;
      return total.toFixed(2);
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

    // Google Maps initialization
    const ensureGoogleMapsLoaded = async () => {
      if (googleMapsReady.value) {
        return googleMaps.value;
      }

      if (googleMapsError.value) {
        return null;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn(
          "VITE_GOOGLE_MAPS_API_KEY is not set. Location autocomplete will fall back to manual input."
        );
        googleMapsError.value = new Error("Missing Google Maps API key");
        return null;
      }

      try {
        // Set the API key globally for the loader
        if (
          !window.google ||
          !window.google.maps ||
          !window.google.maps.places
        ) {
          // Remove any existing script tags to avoid conflicts
          const existingScript = document.querySelector(
            'script[src*="maps.googleapis.com"]'
          );
          if (existingScript) {
            existingScript.remove();
          }

          // Create callback function that will be called when Google Maps loads
          window.initGoogleMaps = () => {
            console.log("Google Maps loaded successfully");
          };

          // Load Google Maps with Places library
          const script = document.createElement("script");
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
          script.async = true;
          script.defer = true;

          await new Promise((resolve, reject) => {
            script.onload = () => {
              // Wait a bit for the libraries to fully initialize
              setTimeout(() => {
                if (
                  window.google &&
                  window.google.maps &&
                  window.google.maps.places
                ) {
                  resolve();
                } else {
                  reject(
                    new Error("Google Maps Places library failed to load")
                  );
                }
              }, 100);
            };
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        googleMaps.value = window.google;
        googleMapsReady.value = true;
        return googleMaps.value;
      } catch (error) {
        googleMapsError.value = error;
        console.error("Failed to load Google Maps:", error);
        return null;
      }
    };

    // Initialize Google Maps services
    const initializeGoogleServices = async () => {
      const google = await ensureGoogleMapsLoaded();
      if (!google) return false;

      if (!autocompleteService.value) {
        autocompleteService.value =
          new google.maps.places.AutocompleteService();
        console.log("✅ AutocompleteService initialized");
      }

      if (!placesService.value) {
        // PlacesService needs a DOM element, using a hidden div
        const div = document.createElement("div");
        placesService.value = new google.maps.places.PlacesService(div);
        console.log("✅ PlacesService initialized");
      }

      return true;
    };

    // Location-related methods
    const handleLocationInput = async (event) => {
      const query = event.target.value;

      if (!query || query.length < 3) {
        locationSuggestions.value = [];
        showLocationSuggestions.value = false;
        return;
      }

      // Debounce the API calls
      if (locationSearchTimeout.value) {
        clearTimeout(locationSearchTimeout.value);
      }

      locationSearchTimeout.value = setTimeout(async () => {
        const initialized = await initializeGoogleServices();
        if (!initialized) return;

        const request = {
          input: query,
          componentRestrictions: { country: "sg" },
        };

        autocompleteService.value.getPlacePredictions(
          request,
          (results, status) => {
            console.log("📍 Location predictions:", results, status);

            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              results
            ) {
              locationSuggestions.value = results;
              showLocationSuggestions.value = true;
              selectedLocationIndex.value = -1;
            } else {
              locationSuggestions.value = [];
              showLocationSuggestions.value = false;
            }
          }
        );
      }, 300);
    };

    const handleLocationKeyDown = (event) => {
      if (
        !showLocationSuggestions.value ||
        locationSuggestions.value.length === 0
      )
        return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          selectedLocationIndex.value = Math.min(
            selectedLocationIndex.value + 1,
            locationSuggestions.value.length - 1
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          selectedLocationIndex.value = Math.max(
            selectedLocationIndex.value - 1,
            -1
          );
          break;
        case "Enter":
          event.preventDefault();
          if (selectedLocationIndex.value >= 0) {
            selectLocation(
              locationSuggestions.value[selectedLocationIndex.value]
            );
          }
          break;
        case "Escape":
          showLocationSuggestions.value = false;
          selectedLocationIndex.value = -1;
          break;
      }
    };

    const selectLocation = (suggestion) => {
      newLocation.value = suggestion.description;
      locationSuggestions.value = [];
      showLocationSuggestions.value = false;
      selectedLocationIndex.value = -1;
    };

    const handleLocationFocus = () => {
      if (locationSuggestions.value.length > 0) {
        showLocationSuggestions.value = true;
      }
    };

    const handleLocationBlur = () => {
      // Delay hiding to allow for click events
      setTimeout(() => {
        showLocationSuggestions.value = false;
        selectedLocationIndex.value = -1;
      }, 200);
    };

    // Fetch tutor's hourly rate for credits calculation
    const loadTutorHourlyRate = async () => {
      try {
        loadingTutorRate.value = true;

        // Determine tutor ID based on user type
        let tutorId;
        if (authStore?.user?.user_type === "tutor") {
          tutorId = authStore.user.id;
        } else {
          // For students, get tutor ID from the booking
          tutorId = props.booking.tutor_id;
        }

        console.log("🔍 Loading tutor hourly rate for tutor ID:", tutorId);
        console.log("🔍 User type:", authStore?.user?.user_type);

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
        loadingTutorRate.value = false;
      }
    };

    // Load tutor hourly rate when component mounts
    onMounted(() => {
      loadTutorHourlyRate();
    });

    async function handleSubmit() {
      try {
        loading.value = true;

        if (!isValidForm.value) {
          showToast("Please fill in all required fields", "error");
          return;
        }

        // Check if user is a student and validate credits
        if (creditService.isStudent()) {
          // Calculate duration in minutes
          const newStartDateTime = new Date(
            `${newDate.value}T${newStartTime.value}`
          );
          const newEndDateTime = new Date(
            `${newDate.value}T${newEndTime.value}`
          );
          const durationMinutes =
            (newEndDateTime - newStartDateTime) / (1000 * 60);

          // Validate credits for rescheduling
          const rescheduleData = {
            tutorHourlyRate: tutorHourlyRate.value,
            durationMinutes: durationMinutes,
          };

          // Pass current session credits for proper difference calculation
          const currentSessionCredits = parseFloat(currentCredits.value);

          if (
            !creditService.validateRescheduleCredits(
              rescheduleData,
              currentSessionCredits
            )
          ) {
            loading.value = false;
            return; // Stop execution if insufficient credits
          }
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
          new_location: newLocation.value || null, // Include new location if provided
        };

        const response = await fetch(
          `/api/calendar/bookings/${props.booking.id}/reschedule`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authStore?.token}`,
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
      newLocation,
      reason,
      locationSuggestions,
      showLocationSuggestions,
      selectedLocationIndex,
      tutorHourlyRate,
      loadingTutorRate,
      sessionDurationInHours,
      calculatedCredits,
      currentDurationInHours,
      currentCredits,
      creditDifference,
      creditChangeStyle,
      creditChangeTextClass,
      creditChangeIcon,
      creditChangeText,
      today,
      isValidTimeRange,
      isValidForm,
      formatDate,
      formatTime,
      handleLocationInput,
      handleLocationKeyDown,
      handleLocationFocus,
      handleLocationBlur,
      selectLocation,
      loadTutorHourlyRate,
      handleSubmit,
      authStore,
    };
  },
};
</script>

<style scoped>
.modal {
  z-index: 1060;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    sans-serif;
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
  background: linear-gradient(
    135deg,
    rgba(58, 58, 82, 0.95) 0%,
    rgba(45, 45, 68, 0.95) 100%
  );
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
  background: linear-gradient(
    135deg,
    rgba(58, 58, 82, 0.95) 0%,
    rgba(45, 45, 68, 0.95) 100%
  );
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
  box-shadow: 0 0 0 0.25rem rgba(255, 107, 53, 0.2),
    0 1px 3px rgba(0, 0, 0, 0.3);
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
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.2) 0%,
    rgba(37, 99, 235, 0.2) 100%
  );
  color: #ffffff;
  border-left: 4px solid #3b82f6;
}

.alert-success {
  background: linear-gradient(
    135deg,
    rgba(16, 185, 129, 0.2) 0%,
    rgba(5, 150, 105, 0.2) 100%
  );
  color: #ffffff;
  border-left: 4px solid #10b981;
}

.alert-info {
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.2) 0%,
    rgba(37, 99, 235, 0.2) 100%
  );
  color: #ffffff;
  border-left: 4px solid #3b82f6;
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

/* Location Suggestions Styles */
.location-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(45, 45, 68, 0.98);
  border: 1px solid rgba(255, 107, 53, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
  backdrop-filter: blur(20px);
}

.suggestion-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 107, 53, 0.1);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover,
.suggestion-item.active {
  background: rgba(255, 107, 53, 0.1);
  transform: translateX(4px);
}

.suggestion-main {
  font-weight: 600;
  color: #ffffff;
  font-size: 0.9rem;
}

.suggestion-secondary {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.125rem;
}
</style>
