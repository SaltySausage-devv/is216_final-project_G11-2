<template>
  <div class="dashboard-page">
    <div class="container py-5">
      <!-- Welcome Section -->
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
                <div
                  class="avatar bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3"
                  style="width: 60px; height: 60px"
                >
                  <i class="fas fa-user text-primary fs-4"></i>
                </div>
                <div>
                  <h2 class="fw-bold mb-1">
                    Welcome back, {{ user?.firstName }}!
                  </h2>
                  <p class="text-muted mb-0">
                    Here's what's happening with your account
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="text-muted mt-3">Loading dashboard data...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="alert alert-warning" role="alert">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ error }}
      </div>

      <!-- Quick Stats -->
      <motion.div
        v-else
        :initial="{ opacity: 0, y: 30 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.6, delay: 0.1 }"
        class="row mb-5"
      >
        <div
          class="col-lg-3 col-md-6 mb-4"
          v-for="(stat, index) in stats"
          :key="index"
        >
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body text-center">
              <div
                class="stat-icon bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style="width: 50px; height: 50px"
              >
                <i :class="stat.icon" class="text-primary fs-5"></i>
              </div>
              <h4 class="fw-bold mb-1">{{ stat.value }}</h4>
              <p class="text-muted mb-0">{{ stat.label }}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <!-- Recent Activity -->
      <motion.div
        :initial="{ opacity: 0, y: 30 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.6, delay: 0.2 }"
        class="row"
      >
        <div class="col-lg-8 mb-4">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-white border-bottom">
              <h5 class="fw-bold mb-0">
                <i class="fas fa-clock me-2 text-primary"></i>
                Recent Activity
              </h5>
            </div>
            <div class="card-body p-0">
              <div v-if="recentActivity.length === 0" class="text-center py-5">
                <i class="fas fa-inbox text-muted fs-1 mb-3"></i>
                <p class="text-muted">No recent activity</p>
              </div>
              <div v-else>
                <div
                  v-for="(activity, index) in recentActivity"
                  :key="index"
                  class="d-flex align-items-center p-3 border-bottom"
                >
                  <div
                    class="activity-icon bg-light rounded-circle d-flex align-items-center justify-content-center me-3"
                    style="width: 40px; height: 40px"
                  >
                    <i :class="activity.icon" class="text-primary"></i>
                  </div>
                  <div class="flex-grow-1">
                    <p class="mb-1 fw-medium">{{ activity.title }}</p>
                    <small class="text-muted">{{ activity.time }}</small>
                  </div>
                  <span :class="activity.badgeClass" class="badge">{{
                    activity.status
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <!-- Quick Actions -->
          <motion.div
            :initial="{ opacity: 0, y: 30 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.6, delay: 0.3 }"
            class="card border-0 shadow-sm mb-4"
          >
            <div class="card-header bg-white border-bottom">
              <h5 class="fw-bold mb-0">
                <i class="fas fa-bolt me-2 text-primary"></i>
                Quick Actions
              </h5>
            </div>
            <div class="card-body">
              <div class="d-grid gap-2">
                <router-link
                  to="/search"
                  class="btn btn-outline-primary"
                  v-if="userType === 'student'"
                >
                  <i class="fas fa-search me-2"></i>
                  Find Tutors
                </router-link>
                <router-link to="/messages" class="btn btn-outline-primary">
                  <i class="fas fa-envelope me-2"></i>
                  Messages
                </router-link>
                  <router-link to="/analytics" class="btn btn-outline-primary" v-if="userType">
                    <i class="fas fa-chart-line me-2"></i>
                    Analytics
                  </router-link>
                <router-link to="/profile" class="btn btn-outline-primary">
                  <i class="fas fa-user me-2"></i>
                  Update Profile
                </router-link>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import { useAuthStore } from "../stores/auth";
import api from "../services/api";

export default {
  name: "Dashboard",
  setup() {
    const authStore = useAuthStore();

    const user = computed(() => authStore.user);
    const userType = computed(() => authStore.userType);
    const userId = computed(() => authStore.user?.id);

    const stats = ref([]);
    const recentActivity = ref([]);
    const isLoading = ref(false);
    const error = ref(null);

    // Helper to format time ago
    const formatTimeAgo = (dateString) => {
      if (!dateString) return "Just now";
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
      if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
      if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
      return date.toLocaleDateString();
    };

    const loadDashboardData = async () => {
      if (!userId.value || !userType.value) {
        console.log("⏳ Waiting for user data...");
        return;
      }

      isLoading.value = true;
      error.value = null;
      console.log("📊 Loading dashboard data for user type:", userType.value, "userId:", userId.value);

      try {
        // Fetch analytics data for stats
        let endpoint = "";
        switch (userType.value) {
          case "tutor":
            endpoint = `/api/analytics/tutor/${userId.value}`;
            break;
          case "student":
            endpoint = `/api/analytics/student/${userId.value}`;
            break;
          case "centre":
            endpoint = `/api/analytics/centre/${userId.value}`;
            break;
          default:
            throw new Error("Invalid user type for analytics");
        }

        const response = await api.get(endpoint, {
          params: { period: "30" } // Last 30 days
        });

        if (response.data.success) {
          const data = response.data.data;

          // Set stats based on user type and real data
          if (userType.value === "student") {
            stats.value = [
              {
                icon: "fas fa-book",
                label: "Active Bookings",
                value: data.pendingSessions || 0,
              },
              {
                icon: "fas fa-star",
                label: "Completed Sessions",
                value: data.completedSessions || 0,
              },
              {
                icon: "fas fa-clock",
                label: "Hours This Month",
                value: `${parseFloat(data.totalHours || 0).toFixed(1)}h`,
              },
              {
                icon: "fas fa-dollar-sign",
                label: "Total Spent",
                value: `$${parseFloat(data.totalSpent || 0).toFixed(2)}`,
              },
            ];
          } else if (userType.value === "tutor") {
            stats.value = [
              {
                icon: "fas fa-users",
                label: "Total Students",
                value: data.totalStudents || 0,
              },
              {
                icon: "fas fa-star",
                label: "Average Rating",
                value: parseFloat(data.averageRating || 0).toFixed(1),
              },
              {
                icon: "fas fa-clock",
                label: "Hours This Month",
                value: `${parseFloat(data.totalHours || 0).toFixed(1)}h`,
              },
              {
                icon: "fas fa-dollar-sign",
                label: "Earnings",
                value: `$${parseFloat(data.totalEarnings || 0).toFixed(2)}`,
              },
            ];
          } else if (userType.value === "centre") {
            stats.value = [
              {
                icon: "fas fa-users",
                label: "Total Students",
                value: data.totalStudents || 0,
              },
              {
                icon: "fas fa-star",
                label: "Average Rating",
                value: parseFloat(data.averageRating || 0).toFixed(1),
              },
              {
                icon: "fas fa-calendar",
                label: "Classes This Month",
                value: data.totalBookings || 0,
              },
              {
                icon: "fas fa-dollar-sign",
                label: "Revenue",
                value: `$${parseFloat(data.totalRevenue || 0).toFixed(2)}`,
              },
            ];
          }

          // Load recent activity from analytics data
          const activities = [];
          if (data.recentActivity && data.recentActivity.length > 0) {
            data.recentActivity.slice(0, 5).forEach((activity) => {
              let icon = "fas fa-calendar-check";
              let status = "Confirmed";
              let badgeClass = "bg-success";

              // Determine icon and status based on activity type
              if (activity.status === "completed") {
                icon = "fas fa-check-circle";
                status = "Completed";
                badgeClass = "bg-success";
              } else if (activity.status === "confirmed") {
                icon = "fas fa-calendar-check";
                status = "Confirmed";
                badgeClass = "bg-success";
              } else if (activity.status === "pending") {
                icon = "fas fa-clock";
                status = "Pending";
                badgeClass = "bg-warning";
              } else if (activity.status === "cancelled") {
                icon = "fas fa-times-circle";
                status = "Cancelled";
                badgeClass = "bg-danger";
              }

              // Check if it's a review
              if (activity.rating) {
                icon = "fas fa-star";
                status = `${activity.rating}-star review`;
                badgeClass = "bg-success";
              }

              activities.push({
                icon: icon,
                title: activity.subject
                  ? `${activity.subject} - ${userType.value === "student" ? activity.tutorName || "Tutor" : activity.studentName || "Student"}`
                  : "Activity",
                time: formatTimeAgo(activity.date),
                status: status,
                badgeClass: badgeClass,
              });
            });
          }

          // If no recent activity from analytics, show empty state
          recentActivity.value = activities.length > 0 ? activities : [];

          console.log("✅ Dashboard data loaded, stats count:", stats.value.length, "activities:", activities.length);
        } else {
          throw new Error(response.data.error || "Failed to load dashboard data");
        }
      } catch (err) {
        console.error("❌ Dashboard load error:", err);
        error.value = err.response?.data?.error || err.message || "Failed to load dashboard data";
        
        // Fallback to empty stats if API fails
        stats.value = [];
        recentActivity.value = [];
        
        if (err.code === "ECONNREFUSED" || err.message.includes("Network Error")) {
          error.value = "Analytics service is not available. Using default values.";
        }
      } finally {
        isLoading.value = false;
      }
    };

    // Watch for userType and userId changes and reload data
    watch(
      [userType, userId],
      ([newUserType, newUserId]) => {
        console.log("👀 UserType or userId changed:", { newUserType, newUserId });
        if (newUserType && newUserId) {
          loadDashboardData();
        }
      },
      { immediate: true }
    );

    onMounted(() => {
      console.log("🚀 Dashboard mounted, user type:", userType.value, "userId:", userId.value);
      // Load data immediately if userType and userId are available
      if (userType.value && userId.value) {
        loadDashboardData();
      }
    });

    return {
      user,
      userType,
      stats,
      recentActivity,
      isLoading,
      error,
    };
  },
};
</script>

<style scoped>
.dashboard-page {
  background: #1a1a1a !important;
  min-height: 100vh;
  color: var(--cyber-text, #ffffff);
}

/* Cards */
.card {
  background: rgba(26, 26, 26, 0.85) !important;
  border: 2px solid var(--cyber-grey-light, #4a4a4a) !important;
  border-radius: 15px;
  box-shadow: 0 0 15px rgba(255, 140, 66, 0.1),
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

/* Headings */
h2,
h3,
h4,
h5,
h6 {
  color: var(--cyber-text, #ffffff) !important;
  text-shadow: 0 0 5px rgba(255, 140, 66, 0.3);
}

/* Text */
.text-muted {
  color: var(--cyber-text-muted, #cccccc) !important;
}

.fw-bold {
  color: var(--cyber-text, #ffffff) !important;
}

.fw-medium {
  color: var(--cyber-text, #ffffff) !important;
}

/* Avatar */
.avatar {
  background: rgba(255, 140, 66, 0.2) !important;
  border: 2px solid var(--cyber-orange, #ff8c42);
  transition: transform 0.3s ease;
}

.card:hover .avatar {
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(255, 140, 66, 0.5);
}

/* Stats */
.stat-icon {
  background: rgba(255, 140, 66, 0.2) !important;
  border: 2px solid var(--cyber-orange, #ff8c42);
  transition: all 0.3s ease;
}

.card:hover .stat-icon {
  transform: scale(1.1);
  background: linear-gradient(
    45deg,
    var(--cyber-orange, #ff8c42),
    var(--cyber-yellow, #ffd23f)
  ) !important;
  box-shadow: 0 0 20px rgba(255, 140, 66, 0.5);
}

.card:hover .stat-icon i {
  color: white !important;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.stat-icon i {
  color: var(--cyber-orange, #ff8c42) !important;
}

/* Activity & Notification Icons */
.activity-icon,
.notification-icon {
  background: rgba(255, 140, 66, 0.1) !important;
  border: 1px solid var(--cyber-grey-light, #4a4a4a);
  transition: all 0.3s ease;
}

.activity-icon i,
.notification-icon i {
  color: var(--cyber-orange, #ff8c42) !important;
}

.activity-icon:hover,
.notification-icon:hover {
  background: var(--cyber-orange, #ff8c42) !important;
  border-color: var(--cyber-orange, #ff8c42);
  box-shadow: 0 0 15px rgba(255, 140, 66, 0.5);
}

.activity-icon:hover i,
.notification-icon:hover i {
  color: white !important;
}

/* Buttons */
.btn-outline-primary {
  background: transparent !important;
  border: 2px solid var(--cyber-orange, #ff8c42) !important;
  color: var(--cyber-text, #ffffff) !important;
  transition: all 0.3s ease;
  border-radius: 10px;
  font-weight: 600;
}

.btn-outline-primary:hover {
  background: linear-gradient(
    45deg,
    var(--cyber-orange, #ff8c42),
    var(--cyber-yellow, #ffd23f)
  ) !important;
  border-color: var(--cyber-orange, #ff8c42) !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(255, 140, 66, 0.5) !important;
}

/* Badges */
.badge {
  border: 1px solid var(--cyber-orange, #ff8c42);
  font-weight: 600;
  padding: 0.5em 0.8em;
  border-radius: 6px;
}

.badge-success {
  background: rgba(16, 185, 129, 0.2) !important;
  color: #10b981 !important;
  border-color: #10b981 !important;
}

.badge-warning {
  background: rgba(245, 158, 11, 0.2) !important;
  color: #f59e0b !important;
  border-color: #f59e0b !important;
}

.badge-info {
  background: rgba(59, 130, 246, 0.2) !important;
  color: #3b82f6 !important;
  border-color: #3b82f6 !important;
}

.badge-danger {
  background: rgba(239, 68, 68, 0.2) !important;
  color: #ef4444 !important;
  border-color: #ef4444 !important;
}

/* Border bottom for activity items */
.border-bottom {
  border-color: var(--cyber-grey-light, #4a4a4a) !important;
}

/* Icons color */
i.text-primary {
  color: var(--cyber-orange, #ff8c42) !important;
}

/* Background light elements */
.bg-light {
  background: rgba(255, 140, 66, 0.1) !important;
}

.bg-white {
  background: rgba(26, 26, 26, 0.5) !important;
}

/* Small text */
small {
  color: var(--cyber-text-muted, #cccccc) !important;
}
</style>
