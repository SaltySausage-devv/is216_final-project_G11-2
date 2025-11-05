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
          70% required to appear in search results
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
          <small class="text-muted">Write 50+ characters to help students know you better</small>
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
        <div class="row g-4">
          <div class="col-lg-6">
            <label class="form-label fw-bold">Subjects Taught *</label>
            <div class="checkbox-container full-height">
              <div v-for="subject in availableSubjects" :key="subject" class="checkbox-item">
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

          <div class="col-lg-6">
            <label class="form-label fw-bold">Education Levels *</label>
            <div class="checkbox-container half-height mb-3">
              <div v-for="level in availableLevels" :key="level" class="checkbox-item">
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

            <label class="form-label fw-bold">Languages Spoken</label>
            <div class="checkbox-container half-height">
              <div v-for="lang in availableLanguages" :key="lang" class="checkbox-item">
                <input
                  type="checkbox"
                  class="form-check-input"
                  :id="'lang-' + lang"
                  :value="lang"
                  v-model="tutorProfile.languages"
                  :disabled="!editMode"
                />
                <label class="form-check-label" :for="'lang-' + lang">
                  {{ lang }}
                </label>
              </div>
            </div>
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

            <!-- University & Year Row - Separate elements -->
            <div class="row">
              <!-- University -->
              <div class="col-md-7 mb-2 mb-md-0">
                <label class="form-label text-muted small">Institution</label>
                <input
                  type="text"
                  v-model="qual.institution"
                  class="form-control"
                  :disabled="!editMode"
                  placeholder="e.g., National University of Singapore, NUS, NTU"
                />
              </div>

              <!-- Year -->
              <div class="col-md-3 mb-2 mb-md-0">
                <label class="form-label text-muted small">Year</label>
                <input
                  type="number"
                  v-model.number="qual.year"
                  class="form-control"
                  :disabled="!editMode"
                  placeholder="Year"
                  min="1950"
                  :max="new Date().getFullYear()"
                />
              </div>

              <!-- Delete Button - Separate element -->
              <div class="col-md-2 d-flex align-items-end mb-2 mb-md-0">
                <button
                  v-if="editMode"
                  @click="removeQualification(index)"
                  class="btn btn-cyber-delete w-100"
                  type="button"
                  title="Remove qualification"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
          <button
            v-if="editMode"
            @click="addQualification"
            class="btn btn-cyber-add btn-sm mt-2"
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
          <select
            v-model="tutorProfile.locationAddress"
            class="form-control"
            :disabled="!editMode"
          >
            <option value="">Select an area</option>
            <option
              v-for="area in singaporeAreas"
              :key="area"
              :value="area"
            >
              {{ area }}
            </option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label">Preferred Teaching Locations</label>
          <div class="d-flex gap-2 mb-2">
            <select
              v-model="preferredLocationsInput"
              class="form-control"
              :disabled="!editMode"
              @change="addPreferredLocation"
            >
              <option value="">Select an area to add</option>
              <option
                v-for="area in availablePreferredLocations"
                :key="area"
                :value="area"
              >
                {{ area }}
              </option>
            </select>
          </div>
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
import api from '../services/api'
import { useAuthStore } from '../stores/auth'
import { useAlertModal } from '../composables/useAlertModal.js'

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
  emits: ['saved', 'cancel', 'completeness-updated'],
  setup(props, { emit }) {
    const authStore = useAuthStore()
    const { showError } = useAlertModal()
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

    const availableLanguages = [
      'English',
      'Mandarin',
      'Malay',
      'Tamil',
      'Hindi',
      'Cantonese',
      'Hokkien'
    ]

    const singaporeAreas = [
      // Central
      'Orchard',
      'Marina Bay',
      'Chinatown',
      'Clarke Quay',
      'Bugis',
      'Dhoby Ghaut',
      'City Hall',
      'Raffles Place',
      'Tanjong Pagar',
      'Little India',
      'Farrer Park',
      'Rochor',
      'Novena',
      'Newton',
      'Somerset',
      'Bras Basah',
      // North
      'Woodlands',
      'Yishun',
      'Sembawang',
      'Admiralty',
      'Kranji',
      'Marsiling',
      'Choa Chu Kang',
      'Lim Chu Kang',
      'Punggol',
      'Sengkang',
      'Ang Mo Kio',
      'Bishan',
      'Toa Payoh',
      'Yio Chu Kang',
      // East
      'Geylang',
      'Bedok',
      'Tampines',
      'Pasir Ris',
      'Eunos',
      'Kembangan',
      'Simei',
      'Changi',
      'Katong',
      'Marine Parade',
      'Tanah Merah',
      'Tampines',
      'Kallang',
      'Paya Lebar',
      'Ubi',
      // West
      'Jurong',
      'Clementi',
      'Bukit Batok',
      'Bukit Panjang',
      'Boon Lay',
      'Pioneer',
      'Tuas',
      'Jurong East',
      'Jurong West',
      'Lakeside',
      'Chinese Garden',
      'Dover',
      'Boon Lay',
      'Nanyang',
      // Other
      'Queenstown',
      'Redhill',
      'Tiong Bahru',
      'Commonwealth',
      'Harbourfront',
      'Sentosa',
      'Alexandra',
      'Telok Blangah',
      'Mount Faber',
      'Henderson',
      'Ayer Rajah',
      'Buona Vista',
      'Holland Village',
      'Balmoral',
      'Tanglin',
      'Stevens',
      'Caldecott',
      'Botanic Gardens'
    ]

    const tutorProfile = reactive({
      headline: '',
      bio: '',
      teachingPhilosophy: '',
      subjects: [],
      levels: [],
      languages: [],
      experienceYears: 0,
      qualifications: [],
      previousExperience: '',
      specialties: [],
      hourlyRate: null,
      locationAddress: '',
      preferredLocations: []
    })

    const specialtiesInput = ref('')
    const preferredLocationsInput = ref('')

    const profileCompleteness = computed(() => {
      let completeness = 0

      // Basic info (25 points)
      if (tutorProfile.bio && tutorProfile.bio.length > 50) completeness += 16
      if (tutorProfile.headline) completeness += 5
      if (tutorProfile.teachingPhilosophy) completeness += 4

      // Teaching details (25 points)
      if (tutorProfile.subjects.length > 0) completeness += 10
      if (tutorProfile.levels.length > 0) completeness += 8
      if (tutorProfile.languages.length > 0) completeness += 7

      // Qualifications & Experience (30 points)
      const validQualifications = tutorProfile.qualifications.filter(q => 
        q.degree && q.degree.trim() && q.institution && q.institution.trim() && q.year
      )
      if (validQualifications.length > 0) completeness += 15
      if (tutorProfile.experienceYears > 0) completeness += 10
      if (tutorProfile.previousExperience && tutorProfile.previousExperience.trim()) completeness += 5

      // Rates (10 points) - Allow 0 as valid rate
      if (tutorProfile.hourlyRate !== null && tutorProfile.hourlyRate !== undefined) completeness += 10
      
      // Location & Additional (10 points)
      if (tutorProfile.locationAddress && tutorProfile.locationAddress.trim()) completeness += 5
      if (tutorProfile.specialties.length > 0) completeness += 5

      return Math.min(completeness, 100)
    })

    // Watch for completeness changes and emit to parent
    watch(profileCompleteness, (newVal) => {
      emit('completeness-updated', newVal)
    }, { immediate: true })

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

    // Computed property to show only areas not already selected as preferred locations
    const availablePreferredLocations = computed(() => {
      return singaporeAreas.filter(area => !tutorProfile.preferredLocations.includes(area))
    })

    const addPreferredLocation = () => {
      if (preferredLocationsInput.value && !tutorProfile.preferredLocations.includes(preferredLocationsInput.value)) {
        tutorProfile.preferredLocations.push(preferredLocationsInput.value)
        preferredLocationsInput.value = ''
      }
    }

    const updatePreferredLocations = () => {
      // Keep for backward compatibility, but addPreferredLocation is now used
      addPreferredLocation()
    }

    const removePreferredLocation = (index) => {
      tutorProfile.preferredLocations.splice(index, 1)
    }

    
    const loadTutorProfile = async () => {
      try {
        const token = authStore.token
        const response = await api.get(`/profiles/tutor/${props.userId}`)

        if (response.data.profile) {
          const profile = response.data.profile
          // If languages only contains English and profile is mostly empty, it's likely the DB default
          // Clear it so user can select their own languages
          let languages = profile.languages || []
          if (languages.length === 1 && languages[0] === 'English' && 
              (!profile.bio || profile.bio.trim() === '') && 
              (!profile.headline || profile.headline.trim() === '') &&
              (!profile.subjects || profile.subjects.length === 0)) {
            languages = [] // Clear default English if profile appears to be newly created
          }
          
          Object.assign(tutorProfile, {
            headline: profile.headline || '',
            bio: profile.bio || '',
            teachingPhilosophy: profile.teaching_philosophy || '',
            subjects: profile.subjects || [],
            levels: profile.levels || [],
            languages: languages,
            experienceYears: profile.experience_years || 0,
            qualifications: profile.qualifications || [],
            previousExperience: profile.previous_experience || '',
            specialties: profile.specialties || [],
            hourlyRate: profile.hourly_rate || null,
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
          languages: tutorProfile.languages,
          experienceYears: tutorProfile.experienceYears,
          qualifications: tutorProfile.qualifications.filter(qual =>
            qual.degree.trim() && qual.institution.trim() && qual.year
          ),
          previousExperience: tutorProfile.previousExperience,
          specialties: tutorProfile.specialties,
          hourlyRate: tutorProfile.hourlyRate,
          location: {
            address: tutorProfile.locationAddress
          },
          preferredLocations: tutorProfile.preferredLocations
        }

        await api.post('/profiles/tutor', payload)

        emit('saved')
      } catch (error) {
        console.error('Failed to save tutor profile:', error)
        showError('Save Failed', 'Failed to save tutor profile. Please try again.')
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
      availableLanguages,
      singaporeAreas,
      availablePreferredLocations,
      specialtiesInput,
      preferredLocationsInput,
      profileCompleteness,
      addQualification,
      removeQualification,
      updateSpecialties,
      removeSpecialty,
      addPreferredLocation,
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

/* Checkbox Container - Properly Contained */
.checkbox-container {
  max-height: 280px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
  background: rgba(30, 30, 30, 0.6);
  border: 1px solid rgba(255, 140, 66, 0.3);
  border-radius: 10px;
}

.checkbox-container.full-height {
  min-height: 400px;
  max-height: 500px;
}

.checkbox-container.half-height {
  min-height: 180px;
  max-height: 230px;
}

.checkbox-container::-webkit-scrollbar {
  width: 6px;
}

.checkbox-container::-webkit-scrollbar-track {
  background: rgba(20, 20, 20, 0.5);
  border-radius: 3px;
}

.checkbox-container::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #ff8c42, #ffd700);
  border-radius: 3px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  background: rgba(50, 50, 50, 0.4);
  border: 1px solid transparent;
}

.checkbox-item:last-child {
  margin-bottom: 0;
}

.checkbox-item:hover {
  background: rgba(255, 140, 66, 0.15);
  border-color: rgba(255, 140, 66, 0.5);
}

.checkbox-item .form-check-input {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin: 0;
  cursor: pointer;
}

.checkbox-item .form-check-label {
  margin-left: 12px;
  margin-bottom: 0;
  cursor: pointer;
  color: var(--cyber-text, #ffffff) !important;
  font-size: 0.95rem;
  flex-grow: 1;
}

.form-check-input:disabled ~ .form-check-label {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Cyberpunk Button Styles */
.btn-cyber-add {
  background: transparent !important;
  border: 2px solid var(--cyber-orange, #ff8c42) !important;
  color: var(--cyber-orange, #ff8c42) !important;
  font-weight: 600;
  padding: 8px 16px;
  transition: all 0.3s ease;
}

.btn-cyber-add:hover {
  background: linear-gradient(45deg, var(--cyber-orange, #ff8c42), var(--cyber-yellow, #ffd23f)) !important;
  border-color: var(--cyber-yellow, #ffd23f) !important;
  color: #000 !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 140, 66, 0.4);
}

.btn-cyber-delete {
  background: transparent !important;
  border: 2px solid rgba(255, 140, 66, 0.5) !important;
  color: var(--cyber-orange, #ff8c42) !important;
  transition: all 0.3s ease;
  padding: 0.5rem 0.75rem;
}

.btn-cyber-delete:hover {
  background: rgba(255, 140, 66, 0.15) !important;
  border-color: var(--cyber-orange, #ff8c42) !important;
  color: var(--cyber-yellow, #ffd23f) !important;
  transform: scale(1.05);
}

/* Qualifications list styling */
.list-group-item {
  background: rgba(42, 42, 42, 0.6) !important;
  border: 1px solid var(--cyber-grey-light, #4a4a4a) !important;
  color: var(--cyber-text, #ffffff) !important;
  margin-bottom: 8px;
  border-radius: 8px !important;
}

.list-group-item:hover {
  background: rgba(255, 140, 66, 0.1) !important;
  border-color: var(--cyber-orange, #ff8c42) !important;
}

/* Badge styling for specialties and locations */
.badge {
  margin: 4px;
  padding: 8px 12px;
  font-size: 0.85rem;
  font-weight: 500;
}


.btn-outline-secondary {
  border-color: var(--cyber-grey-light, #4a4a4a) !important;
  color: var(--cyber-text-muted, #cccccc) !important;
}

.btn-outline-secondary:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: var(--cyber-orange, #ff8c42) !important;
  color: var(--cyber-text, #ffffff) !important;
}

/* Responsive improvements */
@media (max-width: 768px) {
  .checkbox-container {
    max-height: 200px;
  }
  
  .checkbox-container.full-height {
    min-height: 250px;
    max-height: 300px;
  }
  
  .checkbox-container.half-height {
    min-height: 150px;
    max-height: 200px;
  }
  
  .card-body {
    padding: 1rem !important;
  }
}
</style>
