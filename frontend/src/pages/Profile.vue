<template>
  <div class="profile-page">
    <div class="container py-5">
      <!-- Profile Header -->
      <motion.div
        :initial="{ opacity: 0, y: 30 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.6 }"
        class="row mb-5"
      >
        <div class="col-12">
          <div class="profile-header-container">
            <!-- Background Gradient -->
            <div class="profile-header-bg"></div>

            <!-- Content -->
            <div class="profile-header-content">
              <!-- Left: Avatar and Info -->
              <div class="profile-left-section">
                <!-- Avatar -->
                <div class="profile-avatar cyberpunk-avatar spring-bounce">
                  <div class="avatar-placeholder">
                    <i class="fas fa-user"></i>
                  </div>
                </div>

                <!-- User Info -->
                <div class="profile-info">
                  <h1 class="profile-title">{{ user?.firstName }} {{ user?.lastName }}</h1>
                  <p class="profile-subtitle">{{ user?.email }}</p>

                  <!-- Badges -->
                  <div class="profile-badges">
                    <span class="profile-badge" :class="user?.userType">
                      <i :class="getUserTypeIcon(user?.userType)"></i>
                      {{ userTypeLabels[user?.userType] }}
                    </span>
                    <span class="profile-badge date-badge">
                      <i class="fas fa-calendar-check"></i>
                      Oct 15, 2025
                    </span>
                  </div>
                </div>
              </div>

              <!-- Right: Edit Button -->
              <div class="profile-right-section">
                <button class="profile-edit-btn" @click="editMode = !editMode">
                  <i class="fas fa-edit"></i>
                  {{ editMode ? 'CANCEL' : 'EDIT PROFILE' }}
                </button>
              </div>

              </div>
          </div>
        </div>
      </motion.div>

      <div class="row">
        <!-- Elegant Profile Warning for Tutors -->
        <div class="col-12 mb-3" v-if="user?.userType === 'tutor' && tutorCompleteness < 70">
          <div class="elegant-warning d-flex align-items-center justify-content-between p-3">
            <div class="d-flex align-items-center">
              <i class="fas fa-eye-slash me-3"></i>
              <span><strong>Profile {{ tutorCompleteness }}%</strong> - Complete to 70% to appear in search</span>
            </div>
            <button v-if="!editMode" @click="editMode = true" class="btn btn-sm btn-light">
              Complete <i class="fas fa-arrow-right ms-1"></i>
            </button>
          </div>
        </div>

        <!-- Profile Form -->
        <div class="col-12 mb-4">
          <!-- Basic Profile Form (for Students/Parents) -->
          <motion.div
            v-if="user?.userType !== 'tutor'"
            :initial="{ opacity: 0, y: 30 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.6, delay: 0.1 }"
            class="card cyberpunk-card"
          >
            <div class="card-header cyberpunk-header">
              <h5 class="cyberpunk-title mb-0">
                <i class="fas fa-user-edit me-2"></i>
                PROFILE INFORMATION
              </h5>
              <div v-if="editMode" class="edit-mode-indicator">
                <i class="fas fa-pencil-alt me-1"></i>
                EDITING MODE
              </div>
            </div>
            <div class="card-body p-4">
              <form @submit.prevent="updateProfile">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label cyberpunk-label">FIRST NAME</label>
                    <div class="cyberpunk-input-group">
                      <input
                        type="text"
                        v-model="profileForm.firstName"
                        class="form-control cyberpunk-input"
                        :disabled="!editMode"
                        :placeholder="user?.firstName || 'First name'"
                        required
                      />
                      <i class="cyberpunk-input-icon fas fa-user"></i>
                    </div>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label cyberpunk-label">LAST NAME</label>
                    <div class="cyberpunk-input-group">
                      <input
                        type="text"
                        v-model="profileForm.lastName"
                        class="form-control cyberpunk-input"
                        :disabled="!editMode"
                        :placeholder="user?.lastName || 'Last name'"
                        required
                      />
                      <i class="cyberpunk-input-icon fas fa-user"></i>
                    </div>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label cyberpunk-label">PHONE NUMBER</label>
                  <div class="cyberpunk-input-group">
                    <input
                      type="tel"
                      v-model="profileForm.phone"
                      class="form-control cyberpunk-input"
                      :disabled="!editMode"
                      :placeholder="user?.phone || 'Enter your phone number'"
                    />
                    <i class="cyberpunk-input-icon fas fa-phone"></i>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label cyberpunk-label">DATE OF BIRTH</label>
                  <div class="cyberpunk-input-group">
                    <input
                      type="date"
                      v-model="profileForm.dateOfBirth"
                      class="form-control cyberpunk-input"
                      :disabled="!editMode"
                    />
                    <i class="cyberpunk-input-icon fas fa-calendar"></i>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label cyberpunk-label">ADDRESS</label>
                  <div class="cyberpunk-input-group">
                    <textarea
                      v-model="profileForm.address"
                      class="form-control cyberpunk-input"
                      :disabled="!editMode"
                      rows="3"
                      :placeholder="user?.address || 'Enter your address'"
                    ></textarea>
                    <i class="cyberpunk-input-icon fas fa-map-marker-alt"></i>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label cyberpunk-label">BIO</label>
                  <div class="cyberpunk-input-group">
                    <textarea
                      v-model="profileForm.bio"
                      class="form-control cyberpunk-input"
                      :disabled="!editMode"
                      rows="4"
                      :placeholder="user?.bio || 'Tell us about yourself'"
                    ></textarea>
                    <i class="cyberpunk-input-icon fas fa-align-left"></i>
                  </div>
                </div>

                <div v-if="editMode" class="d-flex gap-2 mt-4">
                  <button type="submit" class="btn btn-cyberpunk" :disabled="isLoading">
                    <i v-if="!isLoading" class="fas fa-save me-2"></i>
                    <span v-else class="spinner me-2"></span>
                    {{ isLoading ? 'SAVING...' : 'SAVE CHANGES' }}
                  </button>
                  <button type="button" @click="cancelEdit" class="btn btn-outline-light">
                    <i class="fas fa-times me-2"></i>
                    CANCEL
                  </button>
                </div>
              </form>
            </div>
          </motion.div>

          <!-- Tutor Profile Form (for Tutors only) -->
          <motion.div
            v-else
            :initial="{ opacity: 0, y: 30 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.6, delay: 0.1 }"
            class="card cyberpunk-card"
          >
            <div class="card-header cyberpunk-header">
              <h5 class="cyberpunk-title mb-0">
                <i class="fas fa-graduation-cap me-2"></i>
                TUTOR PROFILE
              </h5>
              <div v-if="editMode" class="edit-mode-indicator">
                <i class="fas fa-pencil-alt me-1"></i>
                EDITING MODE
              </div>
            </div>
            <div class="card-body p-4">
              <TutorProfileForm
                :edit-mode="editMode"
                :user-id="user?.id"
                @saved="handleTutorProfileSaved"
                @cancel="cancelEdit"
                @completeness-updated="handleCompletenessUpdate"
              />
            </div>
          </motion.div>
        </div>

        </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import TutorProfileForm from '../components/TutorProfileForm.vue'
import { useAlertModal } from '../composables/useAlertModal.js'

export default {
  name: 'Profile',
  components: {
    TutorProfileForm
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const { showSuccess, showError } = useAlertModal()

    const user = computed(() => {
      console.log('🔍 Profile.vue computed user called:', {
        authStoreUser: authStore.user,
        authStoreRawUser: authStore.rawUser,
        isAuthenticated: authStore.isAuthenticated
      })
      return authStore.user
    })
    const editMode = ref(false)
    const isLoading = ref(false)
    const tutorCompleteness = ref(0)

    const userTypeLabels = {
      student: 'STUDENT',
      parent: 'PARENT',
      tutor: 'TUTOR',
    }

    const profileForm = reactive({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      address: '',
      bio: ''
    })

    const tutorStats = reactive({
      totalReviews: 0,
      averageRating: 0,
      hourlyRate: 0,
      profileCompletion: 0
    })

    const profileCompletion = ref(0)

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A'
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    const getUserTypeIcon = (userType) => {
      const icons = {
        student: 'fas fa-user-graduate',
        parent: 'fas fa-users',
        tutor: 'fas fa-chalkboard-teacher'
      }
      return icons[userType] || 'fas fa-user'
    }

    const viewPublicProfile = () => {
      if (user.value?.id) {
        router.push(`/tutor/${user.value.id}`)
      }
    }

    const loadProfile = () => {
      console.log('🔍 Profile.loadProfile called')
      console.log('   User data:', user.value)
      console.log('   User type:', user.value?.userType)

      if (user.value) {
        profileForm.firstName = user.value.firstName || ''
        profileForm.lastName = user.value.lastName || ''
        profileForm.email = user.value.email || ''
        profileForm.phone = user.value.phone || ''
        profileForm.dateOfBirth = user.value.dateOfBirth || ''
        profileForm.address = user.value.address || ''
        profileForm.bio = user.value.bio || ''

        // Load tutor-specific data if user is a tutor
        if (user.value.userType === 'tutor') {
          console.log('✅ User is a tutor, loading tutor profile...')
          loadTutorProfile()
        } else {
          console.log('❌ User is not a tutor, showing basic profile form')
          console.log('   User type:', user.value.userType)
        }
      } else {
        console.log('❌ No user data available')
      }
    }

    const loadTutorProfile = async () => {
      try {
        const response = await fetch(`/api/profiles/tutor/${user.value.id}`, {
          headers: {
            'Authorization': `Bearer ${user.value.token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          const profile = data.profile
          console.log('Loaded tutor profile:', profile)

          // Store tutor profile data for the TutorProfileForm component
          if (profile) {
            // This will be available for the TutorProfileForm component
            window.tutorProfileData = profile

            // Update stats
            tutorStats.totalReviews = profile.total_reviews || 0
            tutorStats.averageRating = profile.average_rating || 0
            tutorStats.hourlyRate = profile.hourly_rate || 0
            profileCompletion.value = profile.profile_completeness || 0
          }
        }
      } catch (error) {
        console.error('Error loading tutor profile:', error)
      }
    }

    const updateProfile = async () => {
      isLoading.value = true

      try {
        console.log('💾 Saving profile changes...')
        const result = await authStore.updateProfile(profileForm)

        if (result.success) {
          console.log('✅ Profile saved successfully')
          editMode.value = false

          // Reload profile to show updated data
          loadProfile()

          // Show success message
          showSuccess('Success', 'Profile updated successfully!')
        } else {
          console.error('❌ Profile save failed:', result.error)
          // Show error message
          showError('Error', `Error: ${result.error || 'Failed to update profile'}`)
        }
      } catch (error) {
        console.error('❌ Profile update error:', error)
        showError('Error', 'An unexpected error occurred while saving your profile.')
      } finally {
        isLoading.value = false
      }
    }

    const cancelEdit = () => {
      editMode.value = false
      loadProfile()
    }

    const logout = async () => {
      await authStore.logout()
      router.push('/')
    }

    const handleTutorProfileSaved = () => {
      editMode.value = false
      // Optionally show a success message
      showSuccess('Success', 'Tutor profile saved successfully!')
    }

    const handleCompletenessUpdate = (completeness) => {
      tutorCompleteness.value = completeness
    }

    onMounted(() => {
      console.log('🚀 Profile.vue onMounted called')
      console.log('   Auth store state:', {
        isAuthenticated: authStore.isAuthenticated,
        hasUser: !!authStore.user,
        hasRawUser: !!authStore.rawUser,
        user: authStore.user
      })

      // Load profile data (auth is already initialized by main.js)
      loadProfile()
    })

    // Watch for user data changes (for auth initialization)
    watch(user, (newUser, oldUser) => {
      if (newUser && !oldUser) {
        console.log('🔄 User data changed, reloading profile...')
        loadProfile()
      }
    }, { immediate: false })

    return {
      user,
      editMode,
      isLoading,
      tutorCompleteness,
      userTypeLabels,
      profileForm,
      tutorStats,
      profileCompletion,
      formatDate,
      getUserTypeIcon,
      viewPublicProfile,
      updateProfile,
      cancelEdit,
      logout,
      handleTutorProfileSaved,
      handleCompletenessUpdate
    }
  }
}
</script>

<style scoped>
/* Cyberpunk Profile Page */
.profile-page {
  background: transparent !important;
  min-height: 100vh;
  position: relative;
  z-index: 10;
}

/* Elegant Warning Banner */
.elegant-warning {
  background: rgba(255, 193, 7, 0.15);
  border-left: 4px solid #ffc107;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  color: var(--cyber-text, #ffffff);
  font-size: 0.95rem;
}

.elegant-warning i {
  color: #ffc107;
  font-size: 1.2rem;
}

.elegant-warning .btn-light {
  background: rgba(50, 50, 50, 0.9) !important;
  border: 1px solid rgba(255, 140, 66, 0.5) !important;
  color: var(--cyber-text, #ffffff) !important;
  font-weight: 600;
  padding: 6px 16px;
}

.elegant-warning .btn-light:hover {
  background: rgba(70, 70, 70, 0.95) !important;
  border-color: var(--cyber-orange, #ff8c42) !important;
  transform: translateX(3px);
  transition: all 0.2s ease;
}

/* Profile Header Card */
.cyberpunk-profile-header {
  background: rgba(42, 42, 42, 0.9) !important;
  border: 2px solid var(--cyber-orange) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.cyberpunk-profile-header:hover {
  border-color: var(--cyber-yellow) !important;
  transform: translateY(-3px);
}

/* Avatar Styles */
.cyberpunk-avatar {
  position: relative;
  width: 120px !important;
  height: 120px !important;
  background: rgba(255, 140, 66, 0.2) !important;
  border: 3px solid var(--cyber-orange) !important;
  border-radius: 50% !important;
  overflow: hidden;
  transition: all 0.3s ease;
}

.cyberpunk-avatar:hover {
  transform: scale(1.1);
  border-color: var(--cyber-yellow) !important;
}

.avatar-image {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
  aspect-ratio: 1 / 1;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, var(--cyber-orange), var(--cyber-yellow)) !important;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2.5rem;
}

/* Profile Badges */
.profile-badges {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.user-type-badge {
  background: rgba(255, 140, 66, 0.2) !important;
  color: var(--cyber-orange) !important;
  border: 1px solid var(--cyber-orange) !important;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.75rem;
}

.user-type-badge.student {
  background: rgba(59, 130, 246, 0.2) !important;
  color: #3b82f6 !important;
  border-color: #3b82f6 !important;
}

.user-type-badge.parent {
  background: rgba(16, 185, 129, 0.2) !important;
  color: #10b981 !important;
  border-color: #10b981 !important;
}

.cyberpunk-badge {
  background: rgba(255, 255, 255, 0.1) !important;
  color: var(--cyber-text-muted) !important;
  border: 1px solid var(--cyber-grey-light) !important;
  font-weight: 500;
  font-size: 0.75rem;
}

/* Profile Name and Email */
.cyberpunk-name {
  color: var(--cyber-text) !important;
  font-weight: 700;
  letter-spacing: 1px;
  margin-bottom: 0.5rem !important;
}

.cyberpunk-email {
  color: var(--cyber-text-muted) !important;
  margin-bottom: 0 !important;
}

/* Card Styles */
.cyberpunk-card {
  background: rgba(42, 42, 42, 0.9) !important;
  border: 2px solid var(--cyber-orange) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.cyberpunk-card:hover {
  border-color: var(--cyber-yellow) !important;
  transform: translateY(-3px);
}

/* Card Header */
.cyberpunk-header {
  background: rgba(255, 140, 66, 0.1) !important;
  border-bottom: 2px solid var(--cyber-orange) !important;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cyberpunk-title {
  color: var(--cyber-orange) !important;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0;
  font-size: 1rem;
}

.edit-mode-indicator {
  color: var(--cyber-yellow) !important;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  background: rgba(255, 210, 63, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  border: 1px solid var(--cyber-yellow);
}

/* Form Styles */
.cyberpunk-label {
  color: var(--cyber-text) !important;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
  display: block;
}

.cyberpunk-input-group {
  position: relative;
}

.cyberpunk-input {
  background: var(--cyber-grey) !important;
  border: 2px solid var(--cyber-grey-light) !important;
  color: var(--cyber-text) !important;
  border-radius: 8px !important;
  padding: 0.75rem 1rem 0.75rem 2.5rem !important;
  font-family: 'Inter', sans-serif;
  transition: all 0.3s ease;
}

.cyberpunk-input:focus {
  background: var(--cyber-grey-light) !important;
  border-color: var(--cyber-orange) !important;
  color: var(--cyber-text) !important;
  outline: none;
}

.cyberpunk-input:disabled {
  background: var(--cyber-darker) !important;
  color: var(--cyber-text-dim) !important;
  cursor: not-allowed;
  opacity: 0.7;
}

.cyberpunk-input::placeholder {
  color: var(--cyber-text-dim) !important;
  font-style: italic;
}

.cyberpunk-input-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--cyber-text-muted);
  font-size: 0.875rem;
}

/* Icon alignment for textareas - align with text */
.cyberpunk-input-group:has(textarea) .cyberpunk-input-icon {
  top: 1rem;
  transform: none;
}

/* Action Buttons */
.cyberpunk-action-btn {
  background: var(--cyber-grey) !important;
  border: 1px solid var(--cyber-grey-light) !important;
  color: var(--cyber-text) !important;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-decoration: none;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  transition: all 0.3s ease;
  text-align: left;
  display: flex;
  align-items: center;
}

.cyberpunk-action-btn:hover {
  background: var(--cyber-grey-light) !important;
  border-color: var(--cyber-orange) !important;
  color: var(--cyber-orange) !important;
  text-decoration: none;
  transform: translateX(3px);
}

/* Stats */
.stat-item {
  padding: 1rem 0;
  border-bottom: 1px solid var(--cyber-grey-light);
}

.stat-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.stat-label {
  color: var(--cyber-text-muted) !important;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0.5rem;
}

.stat-value {
  color: var(--cyber-text) !important;
  font-size: 1.25rem;
  font-weight: 700;
}

.cyberpunk-stat {
  color: var(--cyber-orange) !important;
}

/* Progress Bar */
.cyberpunk-progress {
  width: 100%;
  height: 6px;
  background: var(--cyber-darker) !important;
  border: 1px solid var(--cyber-grey-light);
  overflow: hidden;
  margin-top: 0.5rem;
}

.cyberpunk-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--cyber-orange), var(--cyber-yellow)) !important;
  transition: width 0.3s ease;
}

/* Rating */
.cyberpunk-rating {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0.25rem;
}

.cyberpunk-star {
  color: var(--cyber-yellow) !important;
  font-size: 0.875rem;
}

.cyberpunk-star-empty {
  color: var(--cyber-text-dim) !important;
  font-size: 0.875rem;
}

/* Spinner */
.spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .profile-badges {
    justify-content: center;
  }

  .cyberpunk-avatar {
    width: 80px !important;
    height: 80px !important;
    border-radius: 50% !important;
  }

  .cyberpunk-name {
    font-size: 1.5rem;
  }

  .cyberpunk-header {
    flex-direction: column;
    gap: 0.75rem;
    text-align: center;
  }

  .cyberpunk-title {
    font-size: 0.875rem;
  }
}

@media (max-width: 480px) {
  .cyberpunk-avatar {
    width: 60px !important;
    height: 60px !important;
    border-radius: 50% !important;
  }

  .cyberpunk-name {
    font-size: 1.25rem;
  }

  .profile-badges {
    flex-direction: column;
    align-items: center;
  }

  .btn {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
  }
}

/* Clean Profile Header */
.profile-header-container {
  background: rgba(42, 42, 42, 0.9);
  border: 1px solid rgba(255, 152, 0, 0.2);
  border-radius: 12px;
  padding: 2.5rem;
  margin-bottom: 2rem;
}

.profile-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 3rem;
}

.profile-left-section {
  display: flex;
  align-items: center;
  gap: 3rem;
  flex: 1;
}

.cyberpunk-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffc107, #ff9800);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1a1a1a;
  font-size: 3rem;
  font-weight: 600;
  flex-shrink: 0;
  border: 3px solid var(--cyber-orange);
  overflow: hidden;
}

.profile-info {
  flex: 1;
}

.profile-right-section {
  flex-shrink: 0;
}

.profile-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.5rem 0;
  text-transform: capitalize;
  letter-spacing: 0.5px;
}

.profile-subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  font-family: 'Inter', sans-serif;
}

.profile-details {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.25rem;
}

.profile-badges {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.profile-edit-btn {
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
  border: 2px solid #ffc107;
  background: transparent;
  color: #ffc107;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 60px;
}

.profile-edit-btn:hover {
  background: rgba(255, 152, 0, 0.1);
  border-color: #ff9800;
  color: #ff9800;
}

.profile-edit-btn i {
  font-size: 0.8rem;
}

.profile-badge {
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid;
}

.profile-badge.tutor {
  background: rgba(255, 152, 0, 0.15);
  border-color: rgba(255, 152, 0, 0.3);
  color: #ffc107;
}

.profile-badge.student {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
  color: #3b82f6;
}

.profile-badge.parent {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.3);
  color: #10b981;
}

.profile-badge.date-badge {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
}


.profile-quick-stats {
  display: flex;
  gap: 2rem;
}

.quick-stat {
  text-align: center;
  min-width: 80px;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.quick-stat-value {
  display: block;
  font-size: 1.75rem;
  font-weight: 700;
  color: #ffc107;
  margin-bottom: 0.25rem;
}

.quick-stat-label {
  display: block;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .profile-header-content {
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    text-align: center;
  }

  .profile-left-section {
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  .profile-header-container {
    padding: 1.5rem;
  }

  .profile-badges {
    justify-content: center;
    flex-wrap: wrap;
  }

  .profile-quick-stats {
    justify-content: center;
    gap: 1.5rem;
  }

  .profile-title {
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
  }

  .profile-subtitle {
    font-size: 0.95rem;
  }

  .cyberpunk-avatar {
    width: 100px !important;
    height: 100px !important;
    font-size: 2.5rem;
  }

  .quick-stat {
    min-width: 70px;
    padding: 0.5rem;
  }

  .quick-stat-value {
    font-size: 1.5rem;
  }

  .profile-edit-btn {
    width: 100%;
    justify-content: center;
    min-height: 50px;
    padding: 0.75rem 1.5rem;
  }
}

@media (max-width: 480px) {
  .profile-header-container {
    padding: 1rem;
  }

  .profile-header-content {
    gap: 1rem;
  }

  .profile-left-section {
    gap: 1rem;
  }

  .profile-title {
    font-size: 1.5rem;
    line-height: 1.3;
  }

  .profile-subtitle {
    font-size: 0.85rem;
  }

  .cyberpunk-avatar {
    width: 80px !important;
    height: 80px !important;
    font-size: 2rem;
  }

  .profile-badges {
    gap: 0.5rem;
    flex-direction: column;
    width: 100%;
  }

  .profile-badge {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
    width: 100%;
    text-align: center;
  }

  .profile-quick-stats {
    gap: 1rem;
    flex-wrap: wrap;
  }

  .quick-stat {
    min-width: 60px;
    padding: 0.5rem;
  }

  .quick-stat-value {
    font-size: 1.25rem;
  }

  .quick-stat-label {
    font-size: 0.7rem;
  }

  .profile-edit-btn {
    font-size: 0.85rem;
    padding: 0.65rem 1.25rem;
    min-height: 45px;
  }
}
</style>