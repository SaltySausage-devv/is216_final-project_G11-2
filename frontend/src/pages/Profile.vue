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
          <div class="card border-0 shadow-sm">
            <div class="card-body p-4">
              <div class="d-flex align-items-center">
                <div class="profile-avatar bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-4 spring-bounce" style="width: 80px; height: 80px;">
                  <i class="fas fa-user text-primary fs-2"></i>
                </div>
                <div class="flex-grow-1">
                  <h2 class="fw-bold mb-1">{{ user?.firstName }} {{ user?.lastName }}</h2>
                  
                  <div class="d-flex align-items-center gap-3">
                    <span class="badge bg-primary">{{ userTypeLabels[user?.userType] }}</span>
                    <span class="text-muted">
                      <i class="fas fa-calendar-alt me-1"></i>
                      Member since {{ formatDate(user?.createdAt) }}
                    </span>
                  </div>
                </div>
                <div>
                  <button class="btn btn-outline-primary" @click="editMode = !editMode">
                    <i class="fas fa-edit me-2"></i>
                    {{ editMode ? 'Cancel' : 'Edit Profile' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div class="row">
        <!-- Profile Form -->
        <div class="col-lg-8 mb-4">
          <motion.div
            :initial="{ opacity: 0, y: 30 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.6, delay: 0.1 }"
            class="card border-0 shadow-sm"
          >
            <div class="card-header bg-white border-bottom">
              <h5 class="fw-bold mb-0">
                <i class="fas fa-user-edit me-2 text-primary"></i>
                Profile Information
              </h5>
            </div>
            <div class="card-body p-4">
              <form @submit.prevent="updateProfile">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">First Name</label>
                    <input
                      type="text"
                      v-model="profileForm.firstName"
                      class="form-control"
                      :disabled="!editMode"
                      :placeholder="user?.firstName || 'First name'"
                      required
                    />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Last Name</label>
                    <input
                      type="text"
                      v-model="profileForm.lastName"
                      class="form-control"
                      :disabled="!editMode"
                      :placeholder="user?.lastName || 'Last name'"
                      required
                    />
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Phone Number</label>
                  <input
                    type="tel"
                    v-model="profileForm.phone"
                    class="form-control"
                    :disabled="!editMode"
                    :placeholder="user?.phone || 'Enter your phone number'"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div class="mb-3">
                  <label class="form-label">Date of Birth</label>
                  <input
                    type="date"
                    v-model="profileForm.dateOfBirth"
                    class="form-control"
                    :disabled="!editMode"
                  />
                </div>

                <div class="mb-3">
                  <label class="form-label">Address</label>
                  <textarea
                    v-model="profileForm.address"
                    class="form-control"
                    :disabled="!editMode"
                    rows="3"
                    :placeholder="user?.address || 'Enter your address'"
                    placeholder="Enter your address"
                  ></textarea>
                </div>

                <div class="mb-3">
                  <label class="form-label">Bio</label>
                  <textarea
                    v-model="profileForm.bio"
                    class="form-control"
                    :disabled="!editMode"
                    rows="4"
                    :placeholder="user?.bio || 'Tell us about yourself'"
                    placeholder="Tell us about yourself"
                  ></textarea>
                </div>

                <div v-if="editMode" class="d-flex gap-2">
                  <button type="submit" class="btn btn-primary" :disabled="isLoading">
                    <span v-if="isLoading" class="spinner me-2"></span>
                    <i v-else class="fas fa-save me-2"></i>
                    {{ isLoading ? 'Saving...' : 'Save Changes' }}
                  </button>
                  <button type="button" @click="cancelEdit" class="btn btn-outline-secondary">
                    <i class="fas fa-times me-2"></i>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>

        <!-- Stats and Actions -->
        <div class="col-lg-4">
          <!-- Stats Card -->
          <motion.div
            :initial="{ opacity: 0, y: 30 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.6, delay: 0.2 }"
            class="card border-0 shadow-sm mb-4"
          >
            <div class="card-header bg-white border-bottom">
              <h6 class="fw-bold mb-0">Your Stats</h6>
            </div>
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="text-muted">Total Bookings</span>
                <span class="fw-bold">24</span>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="text-muted">Completed Sessions</span>
                <span class="fw-bold">18</span>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="text-muted">Average Rating</span>
                <div class="d-flex align-items-center">
                  <div class="rating me-2">
                    <i class="fas fa-star star"></i>
                    <i class="fas fa-star star"></i>
                    <i class="fas fa-star star"></i>
                    <i class="fas fa-star star"></i>
                    <i class="fas fa-star star"></i>
                  </div>
                  <span class="fw-bold">4.8</span>
                </div>
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <span class="text-muted">Member Since</span>
                <span class="fw-bold">{{ formatDate(user?.createdAt) }}</span>
              </div>
            </div>
          </motion.div>

          <!-- Quick Actions -->
          <motion.div
            :initial="{ opacity: 0, y: 30 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.6, delay: 0.3 }"
            class="card border-0 shadow-sm"
          >
            <div class="card-header bg-white border-bottom">
              <h6 class="fw-bold mb-0">Quick Actions</h6>
            </div>
            <div class="card-body">
              <div class="d-grid gap-2">
                <router-link to="/search" class="btn btn-outline-primary">
                  <i class="fas fa-search me-2"></i>
                  Find Tutors
                </router-link>
                <router-link to="/messages" class="btn btn-outline-primary">
                  <i class="fas fa-envelope me-2"></i>
                  Messages
                </router-link>
                <router-link to="/dashboard" class="btn btn-outline-primary">
                  <i class="fas fa-tachometer-alt me-2"></i>
                  Dashboard
                </router-link>
                <button class="btn btn-outline-danger" @click="logout">
                  <i class="fas fa-sign-out-alt me-2"></i>
                  Logout
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'Profile',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const user = computed(() => authStore.user)
    const editMode = ref(false)
    const isLoading = ref(false)
    
    const userTypeLabels = {
      student: 'Student',
      parent: 'Parents',
      tutor: 'Tutor',
      centre: 'Tuition Centre',
      admin: 'Administrator'
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

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A'
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const loadProfile = () => {
      if (user.value) {
        profileForm.firstName = user.value.firstName || ''
        profileForm.lastName = user.value.lastName || ''
        profileForm.email = user.value.email || ''
        profileForm.phone = user.value.phone || ''
        profileForm.dateOfBirth = user.value.dateOfBirth || ''
        profileForm.address = user.value.address || ''
        profileForm.bio = user.value.bio || ''
      }
    }

    const updateProfile = async () => {
      isLoading.value = true
      
      try {
        const result = await authStore.updateProfile(profileForm)
        
        if (result.success) {
          editMode.value = false
          // Show success message
        } else {
          // Show error message
        }
      } catch (error) {
        console.error('Profile update error:', error)
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

    onMounted(() => {
      loadProfile()
    })

    return {
      user,
      editMode,
      isLoading,
      userTypeLabels,
      profileForm,
      formatDate,
      updateProfile,
      cancelEdit,
      logout
    }
  }
}
</script>

<style scoped>
/* Cyberpunk Profile Page */
.profile-page {
  background: #1a1a1a !important;
  min-height: 100vh;
  color: var(--cyber-text, #ffffff);
}

/* Cards */
.card {
  background: rgba(26, 26, 26, 0.85) !important;
  border: 2px solid var(--cyber-grey-light, #4a4a4a) !important;
  border-radius: 15px;
  box-shadow:
    0 0 15px rgba(255, 140, 66, 0.1),
    0 0 30px rgba(255, 140, 66, 0.05) !important;
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

.card-body {
  color: var(--cyber-text, #ffffff) !important;
}

/* Headings and Text */
h2, h3, h4, h5, h6 {
  color: var(--cyber-text, #ffffff) !important;
  text-shadow: 0 0 5px rgba(255, 140, 66, 0.3);
}

.text-muted {
  color: var(--cyber-text-muted, #cccccc) !important;
}

.fw-bold {
  color: var(--cyber-text, #ffffff) !important;
}

/* Profile Avatar */
.profile-avatar {
  background: rgba(255, 140, 66, 0.2) !important;
  border: 2px solid var(--cyber-orange, #ff8c42);
  transition: all 0.3s ease;
}

.profile-avatar:hover {
  transform: scale(1.1);
  background: linear-gradient(45deg, var(--cyber-orange, #ff8c42), var(--cyber-yellow, #ffd23f)) !important;
  box-shadow: 0 0 20px rgba(255, 140, 66, 0.5);
}

.profile-avatar:hover i {
  color: white !important;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.profile-avatar i {
  color: var(--cyber-orange, #ff8c42) !important;
}

/* Badges */
.badge {
  border: 1px solid var(--cyber-orange, #ff8c42);
  font-weight: 600;
  padding: 0.5em 0.8em;
  border-radius: 6px;
}

.badge.bg-primary {
  background: rgba(255, 140, 66, 0.2) !important;
  color: var(--cyber-orange, #ff8c42) !important;
  border-color: var(--cyber-orange, #ff8c42) !important;
}

/* Rating Stars */
.rating .star {
  color: var(--cyber-yellow, #ffd23f);
  font-size: 0.9rem;
  text-shadow: 0 0 5px rgba(255, 210, 63, 0.5);
}

/* Form Controls */
.form-label {
  color: var(--cyber-text, #ffffff) !important;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.form-control {
  background: rgba(42, 42, 42, 0.8) !important;
  border: 2px solid var(--cyber-grey-light, #4a4a4a) !important;
  color: var(--cyber-text, #ffffff) !important;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.form-control:focus {
  background: rgba(42, 42, 42, 0.95) !important;
  border-color: var(--cyber-orange, #ff8c42) !important;
  box-shadow: 0 0 15px rgba(255, 140, 66, 0.3) !important;
  color: var(--cyber-text, #ffffff) !important;
}

.form-control:disabled {
  background: rgba(42, 42, 42, 0.5) !important;
  opacity: 0.7;
  cursor: not-allowed;
}

.form-control::placeholder {
  color: var(--cyber-text-dim, #888888) !important;
}

/* Buttons */
.btn-primary {
  background: linear-gradient(45deg, var(--cyber-orange, #ff8c42), var(--cyber-yellow, #ffd23f)) !important;
  border: 2px solid var(--cyber-orange, #ff8c42) !important;
  color: white !important;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(255, 140, 66, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(255, 140, 66, 0.5) !important;
  border-color: var(--cyber-orange, #ff8c42) !important;
}

.btn-primary:disabled {
  opacity: 0.7;
  transform: none;
  cursor: not-allowed;
}

.btn-outline-primary {
  background: transparent !important;
  border: 2px solid var(--cyber-orange, #ff8c42) !important;
  color: var(--cyber-text, #ffffff) !important;
  transition: all 0.3s ease;
  border-radius: 10px;
  font-weight: 600;
}

.btn-outline-primary:hover {
  background: linear-gradient(45deg, var(--cyber-orange, #ff8c42), var(--cyber-yellow, #ffd23f)) !important;
  border-color: var(--cyber-orange, #ff8c42) !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(255, 140, 66, 0.5) !important;
}

.btn-outline-secondary {
  background: transparent !important;
  border: 2px solid var(--cyber-grey-light, #4a4a4a) !important;
  color: var(--cyber-text, #ffffff) !important;
  transition: all 0.3s ease;
  border-radius: 10px;
  font-weight: 600;
}

.btn-outline-secondary:hover {
  background: rgba(74, 74, 74, 0.3) !important;
  border-color: var(--cyber-grey-light, #4a4a4a) !important;
  color: var(--cyber-text, #ffffff) !important;
  transform: translateY(-2px);
}

.btn-outline-danger {
  background: transparent !important;
  border: 2px solid #ef4444 !important;
  color: #ef4444 !important;
  transition: all 0.3s ease;
  border-radius: 10px;
  font-weight: 600;
}

.btn-outline-danger:hover {
  background: rgba(239, 68, 68, 0.2) !important;
  border-color: #ef4444 !important;
  color: #ef4444 !important;
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.3) !important;
}

/* Icons */
i.text-primary {
  color: var(--cyber-orange, #ff8c42) !important;
}

/* Background Elements */
.bg-white {
  background: rgba(26, 26, 26, 0.5) !important;
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

/* Responsive */
@media (max-width: 768px) {
  .profile-avatar {
    width: 60px !important;
    height: 60px !important;
  }

  .card-body {
    padding: 1.5rem !important;
  }
}
</style>
