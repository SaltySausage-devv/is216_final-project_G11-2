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

      <!-- Quick Stats -->
      <motion.div
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
              <button @click="setDataType(stat.label)">Show</button>
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
        <div display="inline-block"  class="col-lg-8 mb-4">
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
        </motion.div>
        <div display="inline-block" class="col-lg-4">
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
                <router-link to="/profile" class="btn btn-outline-primary">
                  <i class="fas fa-user me-2"></i>
                  Update Profile
                </router-link>
              </div>
            </div>
          </motion.div>
        </div>
        <!-- Student Retention Trend -->
        <div class="col-lg-12">
          <motion.div
            :initial="{ opacity: 0, x: -30 }"
            :animate="{ opacity: 1, x: 0 }"
            :transition="{ duration: 0.6, delay: 0.2 }"
            class="card border-0 shadow-sm h-100"
          >
            <div class="card-header bg-white border-bottom">
              <h5 class="fw-bold mb-0">
                <i class="fas fa-dollar-sign me-2 text-primary"></i>
                {{ dataType }}
              </h5>
            </div>
            <div class="card-body">
              <div class="chart-container" style="height: 300px;width:auto;">
                <LineChart :labels="labels" :datasets="datasets" />
              </div>
            </div>
          </motion.div>
        </div>
        
      </div>
    </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import { useAuthStore } from "../stores/auth";
import LineChart from '../components/LineChart.vue'

export default {
  name: "Dashboard",
  components: { LineChart },
  setup() {
    const authStore = useAuthStore();

    const user = computed(() => authStore.user);
    const userType = computed(() => authStore.userType);
    const averageRating = ref(null);
    const earnings = ref(null);
    const stats = ref([]);
    const recentActivity = ref([]);

    const loadDashboardData = async () => {
      console.log("📊 Loading dashboard data for user type:", userType.value);

      // Load stats based on user type
      if (userType.value === "student") {
        stats.value = [
          { icon: "fas fa-book", label: "Active Bookings", value: "3" },
          { icon: "fas fa-star", label: "Completed Sessions", value: "12" },
          { icon: "fas fa-clock", label: "Hours This Month", value: "24" },
          { icon: "fas fa-dollar-sign", label: "Total Spent", value: "$1,440" },
        ];
      } else if (userType.value === "tutor") {
        // will need to include code when detecting tutor, query api into rating, total.
        //query for ratings
        try{
          const response = await fetch(`http://localhost:3006/reviews/tutor/${user.value.id}`)

          if (!response.ok) {
            throw new Error('Failed to fetch reviews')
          }

          const data = await response.json()
          console.log('API Response:', data)

          // Transform API data to frontend format
          averageRating.value = data.stats.averageRating
        } catch (error) {
          console.error("Failed!", error)
        }
        // query for Earnings
                try{
          const response = await fetch(`http://localhost:3008/analytics/tutor/${user.value.id}`)

          if (!response.ok) {
            throw new Error('Failed to fetch earnings')
          }

          const data = await response.json()
          console.log('API Response:', data)

          // Transform API data to frontend format
          earnings.value = data.earnings
        } catch (error) {
          console.error("Failed!", error)
        }
        stats.value = [
          { icon: "fas fa-users", label: "Total Students", value: "25" },
          { icon: "fas fa-star", label: "Average Rating", value: averageRating.value },
          { icon: "fas fa-clock", label: "Hours This Month", value: "48" },
          { icon: "fas fa-dollar-sign", label: "Earnings", value: earnings.value },
        ];
      } else if (userType.value === "centre") {
        stats.value = [
          { icon: "fas fa-users", label: "Total Students", value: "150" },
          { icon: "fas fa-star", label: "Average Rating", value: "4.6" },
          { icon: "fas fa-calendar", label: "Classes This Month", value: "45" },
          { icon: "fas fa-dollar-sign", label: "Revenue", value: "$8,100" },
        ];
      }

      // Load recent activity
      recentActivity.value = [
        {
          icon: "fas fa-calendar-check",
          title: "New booking confirmed",
          time: "2 hours ago",
          status: "Confirmed",
          badgeClass: "bg-success",
        },
        {
          icon: "fas fa-star",
          title: "Received 5-star review",
          time: "1 day ago",
          status: "Completed",
          badgeClass: "bg-success",
        },
        {
          icon: "fas fa-envelope",
          title: "New message from student",
          time: "2 days ago",
          status: "Unread",
          badgeClass: "bg-warning",
        },
      ];

      console.log("✅ Dashboard data loaded, stats count:", stats.value.length);
    };

    const dataType = ref(null)
    // Watch for userType changes and reload data
    watch(
      userType,
      (newUserType) => {
        console.log("👀 UserType changed to:", newUserType);
        if (newUserType) {
          loadDashboardData();
        }
      },
      { immediate: true }
    );
    const charts = ref([])
    const dates = ref([])
    const labels = ref([])
    const datasets = ref([])
      // function to update chart whenever.
    async function setDataType(label){
      dataType.value = label
      console.log(dataType.value)
        try{
          const response = await fetch(`http://localhost:3006/reviews/tutor/${user.value.id}`)

          if (!response.ok) {
            throw new Error('Failed to fetch reviews')
          }

          const data = await response.json()
          console.log('API Response:', data)

          // Transform API data to frontend format
          charts.value = data.reviews.map(reviews => ({
            rating: reviews.rating
          }))
          dates.value = data.reviews.map(reviews => ({
            date: reviews.created_at
          }))
          console.error("no")
          labels.value = dates.value.map((item) =>{
            return item.date
          })
          datasets.value = [{
            label: label,
            backgroundColor: "#f87979",
            data: charts.value.map((item) => {
              return item.rating
            })
          }]
        } catch (error) {
          console.error("Failed!", error)
        }
      
    }

    onMounted(() => {
      console.log("🚀 Dashboard mounted, user type:", userType.value);
      // Load data immediately if userType is already available
      if (userType.value) {
        loadDashboardData();
      }
    });

    return {
      user,
      userType,
      stats,
      recentActivity,
      setDataType,
      datasets,
      dataType,
      labels,
      dates,
      averageRating,
      earnings
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
