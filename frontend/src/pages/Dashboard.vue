<template>
  <div class="dashboard-page">
    <div class="container pt-4 pt-lg-5 pb-3 pb-lg-4">
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

      <!-- Error State - Show as warning but still display stats -->
      <div v-if="error" class="alert alert-warning mb-3" role="alert">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ error }}
        <button @click="loadDashboardData" class="btn btn-sm btn-outline-warning ms-2">
          <i class="fas fa-sync-alt me-1"></i> Retry
        </button>
      </div>

      <!-- Quick Stats - Show even if there's an error -->
      <motion.div
        v-if="!isLoading"
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
    // Calculates: current time - timestamp, rounds to 2 decimal places
    const formatTimeAgo = (dateString) => {
      if (!dateString) {
        console.warn("⚠️ formatTimeAgo: Missing dateString, returning 'Just now'");
        return "Just now";
      }
      
      const date = new Date(dateString);
      const now = new Date();
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn("⚠️ formatTimeAgo: Invalid date:", dateString);
        return "Just now";
      }
      
      // Calculate difference: current time - timestamp
      const diffMs = now - date;
      
      // If date is in the future, return "Just now" (shouldn't happen but handle gracefully)
      if (diffMs < 0) {
        console.warn("⚠️ formatTimeAgo: Date is in the future:", dateString);
        return "Just now";
      }
      
      // Calculate precise differences in seconds, minutes, hours, days
      const diffSecs = diffMs / 1000;
      const diffMins = diffMs / 60000;
      const diffHours = diffMs / 3600000;
      const diffDays = diffMs / 86400000;

      // Show "Just now" for less than 5 seconds
      if (diffSecs < 5) {
        return "Just now";
      }
      
      // For less than 1 minute: show seconds (no decimals)
      if (diffMins < 1) {
        const roundedSecs = Math.round(diffSecs);
        return `${roundedSecs} ${roundedSecs === 1 ? "second" : "seconds"} ago`;
      }
      
      // For less than 1 hour: show minutes (no decimals)
      if (diffHours < 1) {
        const roundedMins = Math.round(diffMins);
        return `${roundedMins} ${roundedMins === 1 ? "minute" : "minutes"} ago`;
      }
      
      // For less than 24 hours: show hours and minutes
      if (diffDays < 1) {
        const hours = Math.floor(diffHours);
        const minutes = Math.floor((diffHours - hours) * 60);
        
        if (hours === 0) {
          return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
        } else if (minutes === 0) {
          return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
        } else {
          return `${hours} ${hours === 1 ? "hour" : "hours"} ${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
        }
      }
      
      // For less than 7 days: show days (round down)
      if (diffDays < 7) {
        const roundedDays = Math.floor(diffDays);
        return `${roundedDays} ${roundedDays === 1 ? "day" : "days"} ago`;
      }
      
      // For older than 7 days: show the actual date
      return date.toLocaleDateString();
    };

    // Load recent activity from notifications API
    const loadRecentActivity = async () => {
      if (!userId.value) {
        console.log("⏳ Waiting for userId to load notifications...");
        return;
      }

      try {
        console.log("📬 Loading recent activity for userId:", userId.value);
        
        // First, try to load from localStorage (same as Navbar uses)
        const NOTIFICATIONS_STORAGE_KEY = "tutorconnect_notifications";
        const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        let localNotifications = [];
        
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            // Filter out notifications older than 7 days
            const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            localNotifications = parsed.filter((n) => {
              const notifTime = new Date(n.timestamp || n.created_at || 0).getTime();
              return notifTime > sevenDaysAgo;
            });
            console.log("📬 Loaded notifications from localStorage:", localNotifications.length);
          } catch (e) {
            console.error("⚠️ Failed to parse localStorage notifications:", e);
          }
        }
        
        // Also fetch from API as fallback/update
        let apiNotifications = [];
        try {
          // Note: Don't include /api prefix since axios instance already has baseURL: '/api'
          const notificationsResponse = await api.get(`/notifications/${userId.value}`, {
            params: { limit: 20 } // Get more to filter relevant ones
          });
          
          if (notificationsResponse.data && notificationsResponse.data.notifications) {
            apiNotifications = notificationsResponse.data.notifications;
            console.log("📬 Received notifications from API:", apiNotifications.length);
          }
        } catch (apiError) {
          console.warn("⚠️ Could not fetch notifications from API, using localStorage:", apiError.message);
        }
        
        // Combine both sources, prioritizing API data but using localStorage as fallback
        const notifications = apiNotifications.length > 0 ? apiNotifications : localNotifications;

        if (notifications && notifications.length > 0) {

          // Also fetch reviews for the user to show in recent activity
          let reviews = [];
          try {
            if (userType.value === "tutor") {
              // Note: Don't include /api prefix since axios instance already has baseURL: '/api'
              const reviewsResponse = await api.get(`/reviews/tutor/${userId.value}`);
              if (reviewsResponse.data && reviewsResponse.data.reviews) {
                reviews = reviewsResponse.data.reviews.slice(0, 5); // Get recent 5 reviews
              }
            }
          } catch (reviewError) {
            console.log("⚠️ Could not fetch reviews for activity:", reviewError.message);
          }

          // Also fetch recent messages to include in activity
          // We'll get this from the messages/conversations endpoint
          
          // Format notifications and reviews into activities
          const activities = [];

          // Process notifications (messages, booking confirmations, booking requests)
          notifications.forEach((notification) => {
            // Use timestamp field (from localStorage) or created_at (from API)
            const notificationTimestamp = notification.timestamp || notification.created_at;
            
            // Debug logging for timestamp
            if (!notificationTimestamp) {
              console.warn("⚠️ Dashboard: Notification missing timestamp:", {
                id: notification.id,
                hasTimestamp: !!notification.timestamp,
                hasCreatedAt: !!notification.created_at,
                notification: notification
              });
            } else {
              const date = new Date(notificationTimestamp);
              const now = new Date();
              const diffMs = now - date;
              const diffHours = Math.floor(diffMs / 3600000);
              console.log("📅 Dashboard: Notification timestamp:", {
                id: notification.id,
                timestamp: notificationTimestamp,
                diffHours: diffHours,
                formatted: formatTimeAgo(notificationTimestamp)
              });
            }
            
            const message = notification.message || notification.subject || "";
            const data = notification.data || {};
            
            let icon = "fas fa-bell";
            let title = notification.subject || notification.message || "Notification";
            let status = "New";
            let badgeClass = "bg-success"; // Changed from bg-info (blue) to bg-success (green)

            // Check notification message/content for type
            if (message.includes("Booking confirmed") || message.includes("booking confirmed") || data.notificationType === "booking_confirmation") {
              icon = "fas fa-calendar-check";
              title = "New booking confirmed";
              status = "Confirmed";
              badgeClass = "bg-success";
            } else if (message.includes("Booking request") || message.includes("booking request") || message.includes("Booking offer") || data.notificationType === "booking_offer" || data.notificationType === "booking_request") {
              icon = "fas fa-calendar-plus";
              title = "Booking request sent";
              status = "Pending";
              badgeClass = "bg-warning";
            } else if (message.includes("message") || message.includes("Message") || notification.type === "push") {
              icon = "fas fa-envelope";
              title = message.includes("from") ? message : `New message${userType.value === "student" ? " from tutor" : " from student"}`;
              status = "Unread";
              badgeClass = "bg-warning";
            } else if (message.includes("review") || message.includes("Review")) {
              icon = "fas fa-star";
              // Try to extract rating from message
              const ratingMatch = message.match(/(\d+)\s*-?\s*star/i);
              const rating = ratingMatch ? ratingMatch[1] : "5";
              title = `Received ${rating}-star review`;
              status = "Completed";
              badgeClass = "bg-success";
            }

            // Use the notificationTimestamp already declared above (line 328)
            activities.push({
              icon: icon,
              title: title,
              time: formatTimeAgo(notificationTimestamp),
              status: status,
              badgeClass: badgeClass,
              timestamp: notificationTimestamp,
            });
          });

          // Process reviews (for tutors who received reviews)
          if (userType.value === "tutor" && reviews.length > 0) {
            reviews.forEach((review) => {
              // Use timestamp field (from localStorage) or created_at (from API)
              const reviewTimestamp = review.timestamp || review.created_at;
              
              activities.push({
                icon: "fas fa-star",
                title: `Received ${review.rating}-star review`,
                time: formatTimeAgo(reviewTimestamp),
                status: "Completed",
                badgeClass: "bg-success",
                timestamp: reviewTimestamp,
              });
            });
          }

          // Sort by timestamp (most recent first) and limit to 5
          activities.sort((a, b) => {
            const timeA = new Date(a.timestamp || 0);
            const timeB = new Date(b.timestamp || 0);
            return timeB - timeA;
          });

          // Limit to first 5 items
          recentActivity.value = activities.slice(0, 5);

          console.log("✅ Recent activity loaded:", recentActivity.value.length, "items");
        } else {
          recentActivity.value = [];
        }
      } catch (error) {
        console.error("❌ Error loading recent activity from notifications:", error);
        // Fallback to empty array
        recentActivity.value = [];
      }
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
        // Note: Don't include /api prefix since axios instance already has baseURL: '/api'
        let endpoint = "";
        switch (userType.value) {
          case "tutor":
            endpoint = `/analytics/tutor/${userId.value}`;
            break;
          case "student":
            endpoint = `/analytics/student/${userId.value}`;
            break;
          case "centre":
            endpoint = `/analytics/centre/${userId.value}`;
            break;
          default:
            throw new Error("Invalid user type for analytics");
        }

        console.log("📊 Fetching analytics from:", endpoint);

        const response = await api.get(endpoint, {
          params: { period: "30" } // Last 30 days
        });

        console.log("📊 Analytics response:", {
          success: response.data.success,
          hasData: !!response.data.data,
          error: response.data.error
        });

        if (response.data && response.data.success) {
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

          // Load recent activity from notifications API (not analytics)
          // Don't let activity loading failure break the dashboard
          try {
            await loadRecentActivity();
          } catch (activityError) {
            console.error("⚠️ Failed to load recent activity, but continuing:", activityError);
            // Continue with stats even if activity fails
          }

          console.log("✅ Dashboard data loaded, stats count:", stats.value.length, "activities:", recentActivity.value.length);
        } else {
          const errorMsg = response.data?.error || response.data?.message || "Failed to load dashboard data";
          console.error("❌ Analytics API returned error:", errorMsg);
          throw new Error(errorMsg);
        }
      } catch (err) {
        console.error("❌ Dashboard load error:", err);
        console.error("❌ Error details:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          url: err.config?.url
        });

        // Try to load activity even if analytics fails
        try {
          await loadRecentActivity();
        } catch (activityError) {
          console.error("❌ Also failed to load activity:", activityError);
        }

        // Set error message based on error type
        if (err.response?.status === 401) {
          error.value = "Authentication failed. Please log in again.";
        } else if (err.response?.status === 403) {
          error.value = "You don't have permission to view this data.";
        } else if (err.code === "ECONNREFUSED" || err.message?.includes("Network Error") || err.message?.includes("ERR_NETWORK")) {
          error.value = "Unable to connect to analytics service. Please check your connection.";
        } else if (err.response?.status === 500) {
          error.value = "Server error. Please try again later.";
        } else {
          error.value = err.response?.data?.error || err.message || "Failed to load dashboard data";
        }
        
        // Fallback to empty stats if API fails - but don't break the UI
        // Keep empty stats so the UI still renders
        if (stats.value.length === 0) {
          // Set default empty stats so UI doesn't break
          stats.value = userType.value === "student" ? [
            { icon: "fas fa-book", label: "Active Bookings", value: "0" },
            { icon: "fas fa-star", label: "Completed Sessions", value: "0" },
            { icon: "fas fa-clock", label: "Hours This Month", value: "0h" },
            { icon: "fas fa-dollar-sign", label: "Total Spent", value: "$0.00" },
          ] : userType.value === "tutor" ? [
            { icon: "fas fa-users", label: "Total Students", value: "0" },
            { icon: "fas fa-star", label: "Average Rating", value: "0.0" },
            { icon: "fas fa-clock", label: "Hours This Month", value: "0h" },
            { icon: "fas fa-dollar-sign", label: "Earnings", value: "$0.00" },
          ] : [
            { icon: "fas fa-users", label: "Total Students", value: "0" },
            { icon: "fas fa-star", label: "Average Rating", value: "0.0" },
            { icon: "fas fa-calendar", label: "Classes This Month", value: "0" },
            { icon: "fas fa-dollar-sign", label: "Revenue", value: "$0.00" },
          ];
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
      loadDashboardData, // Expose for retry button
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
