<template>
  <div class="tutor-profile-form">
    <!-- Profile Completeness Indicator -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body p-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="fw-bold">Profile Completeness</span>
          <span class="fw-bold text-primary">{{ profileCompleteness }}%</span>
        </div>
        <div class="progress" style="height: 10px;">
          <div
            class="progress-bar bg-primary"
            :style="{ width: profileCompleteness + '%' }"
          ></div>
        </div>
        <small class="text-muted mt-2 d-block">
          Complete your profile to appear in search results and attract more students
        </small>
      </div>
    </div>

    <!-- Basic Information -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-header bg-white border-bottom">
        <h6 class="fw-bold mb-0">
          <i class="fas fa-user me-2 text-primary"></i>
          Basic Information
        </h6>
      </div>
      <div class="card-body p-4">
        <div class="mb-3">
          <label class="form-label">Professional Headline</label>
          <input
            type="text"
            v-model="tutorProfile.headline"
            class="form-control"
            :disabled="!editMode"
            placeholder="e.g., Experienced Math Tutor | 8+ Years | O/A-Level Specialist"
            maxlength="200"
          />
          <small class="text-muted">A catchy headline to grab attention ({{ tutorProfile.headline?.length || 0 }}/200)</small>
        </div>

        <div class="mb-3">
          <label class="form-label">Bio</label>
          <textarea
            v-model="tutorProfile.bio"
            class="form-control"
            :disabled="!editMode"
            rows="5"
            placeholder="Tell students about yourself, your teaching experience, and what makes you unique..."
          ></textarea>
          <small class="text-muted">Minimum 50 characters recommended</small>
        </div>

        <div class="mb-3">
          <label class="form-label">Teaching Philosophy</label>
          <textarea
            v-model="tutorProfile.teachingPhilosophy"
            class="form-control"
            :disabled="!editMode"
            rows="4"
            placeholder="Describe your teaching approach and philosophy..."
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Teaching Details -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-header bg-white border-bottom">
        <h6 class="fw-bold mb-0">
          <i class="fas fa-chalkboard-teacher me-2 text-primary"></i>
          Teaching Details
        </h6>
      </div>
      <div class="card-body p-4">
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label">Subjects Taught *</label>
            <div class="subjects-selector">
              <div v-for="subject in availableSubjects" :key="subject" class="form-check">
                <input
                  type="checkbox"
                  class="form-check-input"
                  :id="'subject-' + subject"
                  :value="subject"
                  v-model="tutorProfile.subjects"
                  :disabled="!editMode"
                />
                <label class="form-check-label" :for="'subject-' + subject">
                  {{ subject }}
                </label>
              </div>
            </div>
          </div>

          <div class="col-md-6 mb-3">
            <label class="form-label">Education Levels *</label>
            <div class="levels-selector">
              <div v-for="level in availableLevels" :key="level" class="form-check">
                <input
                  type="checkbox"
                  class="form-check-input"
                  :id="'level-' + level"
                  :value="level"
                  v-model="tutorProfile.levels"
                  :disabled="!editMode"
                />
                <label class="form-check-label" :for="'level-' + level">
                  {{ level }}
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label">Teaching Mode *</label>
            <div class="teaching-mode-selector">
              <div v-for="mode in teachingModes" :key="mode.value" class="form-check">
                <input
                  type="checkbox"
                  class="form-check-input"
                  :id="'mode-' + mode.value"
                  :value="mode.value"
                  v-model="tutorProfile.teachingMode"
                  :disabled="!editMode"
                />
                <label class="form-check-label" :for="'mode-' + mode.value">
                  {{ mode.label }}
                </label>
              </div>
            </div>
          </div>

          <div class="col-md-6 mb-3">
            <label class="form-label">Languages Spoken</label>
            <select multiple v-model="tutorProfile.languages" class="form-select" :disabled="!editMode">
              <option v-for="lang in availableLanguages" :key="lang" :value="lang">
                {{ lang }}
              </option>
            </select>
            <small class="text-muted">Hold Ctrl (Cmd on Mac) to select multiple</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Qualifications & Experience -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-header bg-white border-bottom">
        <h6 class="fw-bold mb-0">
          <i class="fas fa-graduation-cap me-2 text-primary"></i>
          Qualifications & Experience
        </h6>
      </div>
      <div class="card-body p-4">
        <div class="mb-3">
          <label class="form-label">Years of Experience</label>
          <input
            type="number"
            v-model.number="tutorProfile.experienceYears"
            class="form-control"
            :disabled="!editMode"
            min="0"
            placeholder="0"
          />
        </div>

        <div class="mb-3">
          <label class="form-label">Qualifications</label>
          <div v-for="(qual, index) in tutorProfile.qualifications" :key="index" class="qualification-item mb-4">
            <!-- Degree Row - Full Width -->
            <div class="row mb-3">
              <div class="col-12">
                <label class="form-label text-muted small">Degree/Certification</label>
                <input
                  type="text"
                  v-model="qual.degree"
                  class="form-control"
                  :disabled="!editMode"
                  placeholder="e.g., Bachelor of Science, Master of Arts, PhD"
                />
              </div>
            </div>

            <!-- University & Year Row - 70% / 30% split -->
            <div class="row">
              <!-- University - 70% width -->
              <div class="col-md-8 mb-2 mb-md-0">
                <label class="form-label text-muted small">Institution</label>
                <input
                  type="text"
                  v-model="qual.institution"
                  class="form-control"
                  :disabled="!editMode"
                  placeholder="e.g., National University of Singapore, NUS, NTU"
                />
              </div>

              <!-- Year & Delete - 30% width -->
              <div class="col-md-4">
                <label class="form-label text-muted small">Year</label>
                <div class="input-group">
                  <input
                    type="number"
                    v-model.number="qual.year"
                    class="form-control"
                    :disabled="!editMode"
                    placeholder="Year"
                    min="1950"
                    :max="new Date().getFullYear()"
                  />
                  <button
                    v-if="editMode"
                    @click="removeQualification(index)"
                    class="btn btn-outline-danger"
                    type="button"
                    title="Remove qualification"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button
            v-if="editMode"
            @click="addQualification"
            class="btn btn-outline-primary btn-sm mt-2"
            type="button"
          >
            <i class="fas fa-plus me-1"></i> Add Qualification
          </button>
        </div>

        <div class="mb-3">
          <label class="form-label">Previous Experience</label>
          <textarea
            v-model="tutorProfile.previousExperience"
            class="form-control"
            :disabled="!editMode"
            rows="3"
            placeholder="Describe your work history, previous teaching positions, etc..."
          ></textarea>
        </div>

        <div class="mb-3">
          <label class="form-label">Specialties</label>
          <input
            type="text"
            v-model="specialtiesInput"
            class="form-control"
            :disabled="!editMode"
            placeholder="e.g., Exam preparation, Weak foundation, Advanced topics (comma-separated)"
            @blur="updateSpecialties"
          />
          <div class="mt-2">
            <span
              v-for="(specialty, index) in tutorProfile.specialties"
              :key="index"
              class="badge bg-primary me-1 mb-1"
            >
              {{ specialty }}
              <i
                v-if="editMode"
                @click="removeSpecialty(index)"
                class="fas fa-times ms-1 cursor-pointer"
              ></i>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Rates & Pricing -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-header bg-white border-bottom">
        <h6 class="fw-bold mb-0">
          <i class="fas fa-dollar-sign me-2 text-primary"></i>
          Rates & Pricing
        </h6>
      </div>
      <div class="card-body p-4">
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label">Hourly Rate (Individual) *</label>
            <div class="input-group">
              <span class="input-group-text">$</span>
              <input
                type="number"
                v-model.number="tutorProfile.hourlyRate"
                class="form-control"
                :disabled="!editMode"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>

          <div class="col-md-6 mb-3">
            <label class="form-label">Group Rate (Per Hour)</label>
            <div class="input-group">
              <span class="input-group-text">$</span>
              <input
                type="number"
                v-model.number="tutorProfile.groupRate"
                class="form-control"
                :disabled="!editMode"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        </div>
    </div>

    <!-- Location -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-header bg-white border-bottom">
        <h6 class="fw-bold mb-0">
          <i class="fas fa-map-marker-alt me-2 text-primary"></i>
          Location & Availability
        </h6>
      </div>
      <div class="card-body p-4">
        <div class="mb-3">
          <label class="form-label">Primary Location/Area</label>
          <input
            type="text"
            v-model="tutorProfile.locationAddress"
            class="form-control"
            :disabled="!editMode"
            placeholder="e.g., Orchard, Singapore"
          />
        </div>

        <div class="mb-3">
          <label class="form-label">Preferred Teaching Locations</label>
          <input
            type="text"
            v-model="preferredLocationsInput"
            class="form-control"
            :disabled="!editMode"
            placeholder="e.g., Orchard, Novena, Toa Payoh (comma-separated)"
            @blur="updatePreferredLocations"
          />
          <div class="mt-2">
            <span
              v-for="(location, index) in tutorProfile.preferredLocations"
              :key="index"
              class="badge bg-info me-1 mb-1"
            >
              {{ location }}
              <i
                v-if="editMode"
                @click="removePreferredLocation(index)"
                class="fas fa-times ms-1 cursor-pointer"
              ></i>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Save/Cancel Buttons -->
    <div v-if="editMode" class="d-flex gap-2">
      <button @click="saveTutorProfile" class="btn btn-primary" :disabled="isSaving">
        <span v-if="isSaving" class="spinner-border spinner-border-sm me-2"></span>
        <i v-else class="fas fa-save me-2"></i>
        {{ isSaving ? 'Saving...' : 'Save Tutor Profile' }}
      </button>
      <button @click="$emit('cancel')" class="btn btn-outline-secondary">
        <i class="fas fa-times me-2"></i>
        Cancel
      </button>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'TutorProfileForm',
  props: {
    editMode: {
      type: Boolean,
      default: false
    },
    userId: {
      type: String,
      required: true
    }
  },
  emits: ['saved', 'cancel'],
  setup(props, { emit }) {
    const authStore = useAuthStore()
    const isSaving = ref(false)

    const availableSubjects = [
      'Mathematics',
      'English',
      'Science',
      'Physics',
      'Chemistry',
      'Biology',
      'Additional Mathematics',
      'Literature',
      'History',
      'Geography',
      'Economics',
      'Accounting',
      'Chinese',
      'Malay',
      'Tamil'
    ]

    const availableLevels = [
      'Primary',
      'Secondary',
      'JC',
      'IB',
      'IGCSE'
    ]

    const teachingModes = [
      { value: 'online', label: 'Online' },
      { value: 'in-person', label: 'In-Person' },
      { value: 'both', label: 'Both' }
    ]

    const availableLanguages = [
      'English',
      'Mandarin',
      'Malay',
      'Tamil',
      'Hindi',
      'Cantonese',
      'Hokkien'
    ]

    const tutorProfile = reactive({
      headline: '',
      bio: '',
      teachingPhilosophy: '',
      subjects: [],
      levels: [],
      teachingMode: [],
      languages: ['English'],
      experienceYears: 0,
      qualifications: [],
      previousExperience: '',
      specialties: [],
      hourlyRate: null,
      groupRate: null,
      locationAddress: '',
      preferredLocations: []
    })

    const specialtiesInput = ref('')
    const preferredLocationsInput = ref('')

    const profileCompleteness = computed(() => {
      let completeness = 0

      // Basic info (30 points)
      if (tutorProfile.bio && tutorProfile.bio.length > 50) completeness += 10
      if (tutorProfile.headline) completeness += 5
      if (tutorProfile.teachingPhilosophy) completeness += 5
      if (tutorProfile.bio && tutorProfile.bio.length > 200) completeness += 10

      // Teaching details (25 points)
      if (tutorProfile.subjects.length > 0) completeness += 10
      if (tutorProfile.levels.length > 0) completeness += 5
      if (tutorProfile.teachingMode.length > 0) completeness += 5
      if (tutorProfile.languages.length > 0) completeness += 5

      // Qualifications (20 points)
      if (tutorProfile.qualifications.length > 0) completeness += 10
      if (tutorProfile.experienceYears > 0) completeness += 10

      // Rates (12 points)
      if (tutorProfile.hourlyRate) completeness += 10
      if (tutorProfile.groupRate) completeness += 2

      // Location (10 points)
      if (tutorProfile.locationAddress) completeness += 10

      return Math.min(completeness, 100)
    })

    const addQualification = () => {
      tutorProfile.qualifications.push({
        degree: '',
        institution: '',
        year: new Date().getFullYear()
      })
    }

    const removeQualification = (index) => {
      tutorProfile.qualifications.splice(index, 1)
    }

    const updateSpecialties = () => {
      if (specialtiesInput.value) {
        const newSpecialties = specialtiesInput.value
          .split(',')
          .map(s => s.trim())
          .filter(s => s && !tutorProfile.specialties.includes(s))

        tutorProfile.specialties.push(...newSpecialties)
        specialtiesInput.value = ''
      }
    }

    const removeSpecialty = (index) => {
      tutorProfile.specialties.splice(index, 1)
    }

    const updatePreferredLocations = () => {
      if (preferredLocationsInput.value) {
        const newLocations = preferredLocationsInput.value
          .split(',')
          .map(l => l.trim())
          .filter(l => l && !tutorProfile.preferredLocations.includes(l))

        tutorProfile.preferredLocations.push(...newLocations)
        preferredLocationsInput.value = ''
      }
    }

    const removePreferredLocation = (index) => {
      tutorProfile.preferredLocations.splice(index, 1)
    }

    
    const loadTutorProfile = async () => {
      try {
        const token = authStore.token
        const response = await axios.get(`http://localhost:3003/profiles/tutor/${props.userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (response.data.profile) {
          const profile = response.data.profile
          Object.assign(tutorProfile, {
            headline: profile.headline || '',
            bio: profile.bio || '',
            teachingPhilosophy: profile.teaching_philosophy || '',
            subjects: profile.subjects || [],
            levels: profile.levels || [],
            teachingMode: profile.teaching_mode || [],
            languages: profile.languages || ['English'],
            experienceYears: profile.experience_years || 0,
            qualifications: profile.qualifications || [],
            previousExperience: profile.previous_experience || '',
            specialties: profile.specialties || [],
            hourlyRate: profile.hourly_rate || null,
            groupRate: profile.group_rate || null,
            locationAddress: profile.location?.address || '',
            preferredLocations: profile.preferred_locations || []
          })

          // Ensure there's always at least one qualification field visible after loading
          if (tutorProfile.qualifications.length === 0) {
            addQualification()
          }
        }
      } catch (error) {
        // Profile doesn't exist yet, that's okay
        console.log('No existing tutor profile found')
        // Still ensure there's at least one qualification field for new profiles
        if (tutorProfile.qualifications.length === 0) {
          addQualification()
        }
      }
    }

    const saveTutorProfile = async () => {
      isSaving.value = true
      try {
        const token = authStore.token

        const payload = {
          headline: tutorProfile.headline,
          bio: tutorProfile.bio,
          teachingPhilosophy: tutorProfile.teachingPhilosophy,
          subjects: tutorProfile.subjects,
          levels: tutorProfile.levels,
          teachingMode: tutorProfile.teachingMode,
          languages: tutorProfile.languages,
          experienceYears: tutorProfile.experienceYears,
          qualifications: tutorProfile.qualifications.filter(qual =>
            qual.degree.trim() || qual.institution.trim() || qual.year
          ),
          previousExperience: tutorProfile.previousExperience,
          specialties: tutorProfile.specialties,
          hourlyRate: tutorProfile.hourlyRate,
          groupRate: tutorProfile.groupRate,
          location: {
            address: tutorProfile.locationAddress
          },
          preferredLocations: tutorProfile.preferredLocations
        }

        await axios.post('http://localhost:3003/profiles/tutor', payload, {
          headers: { Authorization: `Bearer ${token}` }
        })

        emit('saved')
      } catch (error) {
        console.error('Failed to save tutor profile:', error)
        alert('Failed to save tutor profile. Please try again.')
      } finally {
        isSaving.value = false
      }
    }

    onMounted(() => {
      console.log('🎓 TutorProfileForm mounted - placeholders should be visible')
      loadTutorProfile()
      // Ensure there's always at least one qualification field visible
      if (tutorProfile.qualifications.length === 0) {
        addQualification()
      }
    })

    return {
      tutorProfile,
      isSaving,
      availableSubjects,
      availableLevels,
      teachingModes,
      availableLanguages,
      specialtiesInput,
      preferredLocationsInput,
      profileCompleteness,
      addQualification,
      removeQualification,
      updateSpecialties,
      removeSpecialty,
      updatePreferredLocations,
      removePreferredLocation,
      saveTutorProfile
    }
  }
}
</script>

<style scoped>
/* Same cyberpunk styling as Profile.vue */
.tutor-profile-form {
  color: var(--cyber-text, #ffffff);
}

.card {
  background: rgba(26, 26, 26, 0.85) !important;
  border: 2px solid var(--cyber-grey-light, #4a4a4a) !important;
  border-radius: 15px;
  box-shadow: 0 0 15px rgba(255, 140, 66, 0.1), 0 0 30px rgba(255, 140, 66, 0.05) !important;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
  color: var(--cyber-text, #ffffff) !important;
}

.card:hover {
  border-color: var(--cyber-orange, #ff8c42) !important;
  box-shadow: 0 0 25px rgba(255, 140, 66, 0.3) !important;
  transform: translateY(-2px);
}

.card-header {
  background: rgba(255, 140, 66, 0.1) !important;
  border-bottom: 1px solid var(--cyber-orange, #ff8c42) !important;
  color: var(--cyber-text, #ffffff) !important;
}

.form-label {
  color: var(--cyber-text, #ffffff) !important;
  font-weight: 500;
}

.form-control, .form-select {
  background: rgba(42, 42, 42, 0.8) !important;
  border: 2px solid var(--cyber-grey-light, #4a4a4a) !important;
  color: var(--cyber-text, #ffffff) !important;
  border-radius: 8px;
}

.form-control:focus, .form-select:focus {
  background: rgba(42, 42, 42, 0.95) !important;
  border-color: var(--cyber-orange, #ff8c42) !important;
  box-shadow: 0 0 15px rgba(255, 140, 66, 0.3) !important;
  color: var(--cyber-text, #ffffff) !important;
}

.form-control:disabled, .form-select:disabled {
  background: rgba(42, 42, 42, 0.5) !important;
  opacity: 0.7;
}

/* Fix placeholder visibility */
.form-control::placeholder {
  color: #999999 !important;
  opacity: 1 !important;
}

.form-control:disabled::placeholder {
  color: #666666 !important;
  opacity: 0.7 !important;
}

.btn-primary {
  background: linear-gradient(45deg, var(--cyber-orange, #ff8c42), var(--cyber-yellow, #ffd23f)) !important;
  border: 2px solid var(--cyber-orange, #ff8c42) !important;
  color: white !important;
  font-weight: 600;
  border-radius: 10px;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(255, 140, 66, 0.5) !important;
}

.badge {
  background: rgba(255, 140, 66, 0.2) !important;
  color: var(--cyber-orange, #ff8c42) !important;
  border: 1px solid var(--cyber-orange, #ff8c42) !important;
}

.progress {
  background: rgba(42, 42, 42, 0.8) !important;
  border: 1px solid var(--cyber-grey-light, #4a4a4a) !important;
}

.progress-bar {
  background: linear-gradient(45deg, var(--cyber-orange, #ff8c42), var(--cyber-yellow, #ffd23f)) !important;
}

.cursor-pointer {
  cursor: pointer;
}

.input-group-text {
  background: rgba(255, 140, 66, 0.1) !important;
  border: 2px solid var(--cyber-grey-light, #4a4a4a) !important;
  color: var(--cyber-orange, #ff8c42) !important;
}

.form-check-input {
  background-color: rgba(42, 42, 42, 0.8) !important;
  border-color: var(--cyber-grey-light, #4a4a4a) !important;
}

.form-check-input:checked {
  background-color: var(--cyber-orange, #ff8c42) !important;
  border-color: var(--cyber-orange, #ff8c42) !important;
}

.text-muted {
  color: var(--cyber-text-muted, #cccccc) !important;
}
</style>
