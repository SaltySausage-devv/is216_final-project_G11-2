<template>
  <div class="analytics-page">
    <div class="container py-5">
      <!-- Header Section -->
      <div class="row mb-5">
        <div class="col-12">
          <div class="card cyberpunk-card">
            <div class="card-header cyberpunk-header">
              <h2 class="cyberpunk-title mb-0">
                <i class="fas fa-chart-line me-2"></i>
                {{ getPageTitle() }}
              </h2>
              <div class="analytics-controls">
                <select v-model="selectedPeriod" @change="loadAnalytics" class="cyberpunk-select">
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-5">
        <div class="cyberpunk-spinner-large"></div>
        <p class="cyberpunk-text-muted mt-3">Loading analytics data...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="alert alert-danger cyberpunk-alert">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ error }}
      </div>

      <!-- Analytics Content -->
      <div v-else>
        <!-- KPI Cards -->
        <div class="row mb-5">
          <div
            v-for="(kpi, index) in kpiCards"
            :key="index"
            class="col-lg-3 col-md-6 mb-4"
          >
            <div class="card cyberpunk-card h-100">
              <div class="card-body text-center">
                <div class="kpi-icon">
                  <i :class="kpi.icon"></i>
                </div>
                <h3 class="kpi-value">{{ kpi.value }}</h3>
                <p class="kpi-label">{{ kpi.label }}</p>
                <div v-if="kpi.change" class="kpi-change" :class="kpi.changeType">
                  <i :class="kpi.changeType === 'positive' ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
                  {{ kpi.change }}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="row mb-5">
          <!-- Main Chart -->
          <div class="col-lg-8 mb-4">
            <div class="card cyberpunk-card">
              <div class="card-header cyberpunk-header">
                <h5 class="cyberpunk-title mb-0">
                  <i class="fas fa-chart-area me-2"></i>
                  {{ getMainChartTitle() }}
                </h5>
              </div>
              <div class="card-body">
                <canvas ref="mainChart" width="400" height="200"></canvas>
              </div>
            </div>
          </div>

          <!-- Secondary Chart -->
          <div class="col-lg-4 mb-4">
            <div class="card cyberpunk-card">
              <div class="card-header cyberpunk-header">
                <h5 class="cyberpunk-title mb-0">
                  <i class="fas fa-chart-pie me-2"></i>
                  {{ getSecondaryChartTitle() }}
                </h5>
              </div>
              <div class="card-body">
                <canvas ref="secondaryChart" width="300" height="200"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- Data Tables -->
        <div class="row">
          <div class="col-12">
            <div class="card cyberpunk-card">
              <div class="card-header cyberpunk-header">
                <h5 class="cyberpunk-title mb-0">
                  <i class="fas fa-table me-2"></i>
                  Detailed Analytics
                </h5>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table cyberpunk-table">
                    <thead>
                      <tr>
                        <th v-for="header in tableHeaders" :key="header">{{ header }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, index) in tableData" :key="index">
                        <td v-for="(cell, cellIndex) in row" :key="cellIndex">{{ cell }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useAuthStore } from '../stores/auth'
import Chart from 'chart.js/auto'
import axios from 'axios'

export default {
  name: 'Analytics',
  setup() {
    const authStore = useAuthStore()
    const isLoading = ref(false)
    const error = ref('')
    const selectedPeriod = ref('30')
    const analyticsData = ref({})
    
    // Chart refs
    const mainChart = ref(null)
    const secondaryChart = ref(null)
    let mainChartInstance = null
    let secondaryChartInstance = null

    // Computed properties
    const userType = computed(() => authStore.userType)
    const userId = computed(() => authStore.user?.id)

    const getPageTitle = () => {
      switch (userType.value) {
        case 'tutor': return 'TUTOR ANALYTICS'
        case 'student': return 'LEARNING ANALYTICS'
        case 'centre': return 'CENTRE ANALYTICS'
        default: return 'ANALYTICS'
      }
    }

    const getMainChartTitle = () => {
      switch (userType.value) {
        case 'tutor': return 'Earnings Over Time'
        case 'student': return 'Learning Progress'
        case 'centre': return 'Revenue Trends'
        default: return 'Performance Metrics'
      }
    }

    const getSecondaryChartTitle = () => {
      switch (userType.value) {
        case 'tutor': return 'Subject Distribution'
        case 'student': return 'Subject Focus'
        case 'centre': return 'Tutor Performance'
        default: return 'Breakdown'
      }
    }

    // KPI Cards based on user type
    const kpiCards = computed(() => {
      if (!analyticsData.value) return []

      switch (userType.value) {
        case 'tutor':
          return [
            {
              icon: 'fas fa-dollar-sign',
              value: `$${analyticsData.value.totalEarnings || 0}`,
              label: 'Total Earnings',
              change: analyticsData.value.earningsChange,
              changeType: analyticsData.value.earningsChange >= 0 ? 'positive' : 'negative'
            },
            {
              icon: 'fas fa-calendar-check',
              value: analyticsData.value.totalBookings || 0,
              label: 'Total Bookings',
              change: analyticsData.value.bookingsChange,
              changeType: analyticsData.value.bookingsChange >= 0 ? 'positive' : 'negative'
            },
            {
              icon: 'fas fa-star',
              value: analyticsData.value.averageRating || 0,
              label: 'Average Rating',
              change: analyticsData.value.ratingChange,
              changeType: analyticsData.value.ratingChange >= 0 ? 'positive' : 'negative'
            },
            {
              icon: 'fas fa-users',
              value: analyticsData.value.totalStudents || 0,
              label: 'Students Taught',
              change: analyticsData.value.studentsChange,
              changeType: analyticsData.value.studentsChange >= 0 ? 'positive' : 'negative'
            }
          ]
        case 'student':
          return [
            {
              icon: 'fas fa-book',
              value: analyticsData.value.totalSessions || 0,
              label: 'Sessions Completed',
              change: analyticsData.value.sessionsChange,
              changeType: analyticsData.value.sessionsChange >= 0 ? 'positive' : 'negative'
            },
            {
              icon: 'fas fa-clock',
              value: `${analyticsData.value.totalHours || 0}h`,
              label: 'Hours Learned',
              change: analyticsData.value.hoursChange,
              changeType: analyticsData.value.hoursChange >= 0 ? 'positive' : 'negative'
            },
            {
              icon: 'fas fa-dollar-sign',
              value: `$${analyticsData.value.totalSpent || 0}`,
              label: 'Total Spent',
              change: analyticsData.value.spendingChange,
              changeType: analyticsData.value.spendingChange >= 0 ? 'positive' : 'negative'
            },
            {
              icon: 'fas fa-user-graduate',
              value: analyticsData.value.tutorsWorkedWith || 0,
              label: 'Tutors Worked With',
              change: analyticsData.value.tutorsChange,
              changeType: analyticsData.value.tutorsChange >= 0 ? 'positive' : 'negative'
            }
          ]
        case 'centre':
          return [
            {
              icon: 'fas fa-dollar-sign',
              value: `$${analyticsData.value.totalRevenue || 0}`,
              label: 'Total Revenue',
              change: analyticsData.value.revenueChange,
              changeType: analyticsData.value.revenueChange >= 0 ? 'positive' : 'negative'
            },
            {
              icon: 'fas fa-users',
              value: analyticsData.value.totalStudents || 0,
              label: 'Total Students',
              change: analyticsData.value.studentsChange,
              changeType: analyticsData.value.studentsChange >= 0 ? 'positive' : 'negative'
            },
            {
              icon: 'fas fa-chalkboard-teacher',
              value: analyticsData.value.totalTutors || 0,
              label: 'Active Tutors',
              change: analyticsData.value.tutorsChange,
              changeType: analyticsData.value.tutorsChange >= 0 ? 'positive' : 'negative'
            },
            {
              icon: 'fas fa-star',
              value: analyticsData.value.averageRating || 0,
              label: 'Average Rating',
              change: analyticsData.value.ratingChange,
              changeType: analyticsData.value.ratingChange >= 0 ? 'positive' : 'negative'
            }
          ]
        default:
          return []
      }
    })

    // Table headers and data
    const tableHeaders = computed(() => {
      switch (userType.value) {
        case 'tutor':
          return ['Date', 'Subject', 'Student', 'Duration', 'Earnings', 'Rating']
        case 'student':
          return ['Date', 'Subject', 'Tutor', 'Duration', 'Cost', 'Rating']
        case 'centre':
          return ['Date', 'Tutor', 'Subject', 'Students', 'Revenue', 'Rating']
        default:
          return []
      }
    })

    const tableData = computed(() => {
      if (!analyticsData.value.recentActivity) return []
      return analyticsData.value.recentActivity.map(activity => {
        switch (userType.value) {
          case 'tutor':
            return [
              new Date(activity.date).toLocaleDateString(),
              activity.subject || 'N/A',
              activity.studentName || 'N/A',
              `${activity.duration || 0}h`,
              `$${activity.earnings || 0}`,
              activity.rating || 'N/A'
            ]
          case 'student':
            return [
              new Date(activity.date).toLocaleDateString(),
              activity.subject || 'N/A',
              activity.tutorName || 'N/A',
              `${activity.duration || 0}h`,
              `$${activity.cost || 0}`,
              activity.rating || 'N/A'
            ]
          case 'centre':
            return [
              new Date(activity.date).toLocaleDateString(),
              activity.tutorName || 'N/A',
              activity.subject || 'N/A',
              activity.students || 0,
              `$${activity.revenue || 0}`,
              activity.rating || 'N/A'
            ]
          default:
            return []
        }
      })
    })

    // Generate mock data based on user type
    const generateMockData = () => {
      const period = parseInt(selectedPeriod.value)
      const chartData = []
      const chartLabels = []
      
      // Generate chart data for the period
      for (let i = period - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        chartLabels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
        
        // Generate random data based on user type
        if (userType.value === 'tutor') {
          chartData.push(Math.floor(Math.random() * 200) + 50) // Earnings
        } else if (userType.value === 'student') {
          chartData.push(Math.floor(Math.random() * 100) + 20) // Spending
        } else if (userType.value === 'centre') {
          chartData.push(Math.floor(Math.random() * 500) + 100) // Revenue
        }
      }

      // Generate pie chart data
      const subjects = ['Mathematics', 'Science', 'English', 'History', 'Physics', 'Chemistry']
      const pieLabels = subjects.slice(0, Math.floor(Math.random() * 4) + 2)
      const pieData = pieLabels.map(() => Math.floor(Math.random() * 20) + 5)

      // Generate recent activity
      const recentActivity = []
      for (let i = 0; i < 10; i++) {
        const date = new Date()
        date.setDate(date.getDate() - Math.floor(Math.random() * 30))
        recentActivity.push({
          date: date.toISOString(),
          subject: subjects[Math.floor(Math.random() * subjects.length)],
          studentName: `Student ${i + 1}`,
          tutorName: `Tutor ${i + 1}`,
          duration: Math.floor(Math.random() * 3) + 1,
          earnings: Math.floor(Math.random() * 100) + 50,
          cost: Math.floor(Math.random() * 80) + 30,
          revenue: Math.floor(Math.random() * 200) + 100,
          rating: Math.floor(Math.random() * 2) + 4
        })
      }

      // Return data based on user type
      if (userType.value === 'tutor') {
        return {
          totalEarnings: (Math.random() * 2000 + 500).toFixed(2),
          totalBookings: Math.floor(Math.random() * 50) + 20,
          averageRating: (Math.random() * 2 + 3).toFixed(1),
          totalStudents: Math.floor(Math.random() * 20) + 10,
          totalHours: (Math.random() * 100 + 50).toFixed(1),
          totalProfileViews: Math.floor(Math.random() * 200) + 100,
          earningsChange: (Math.random() * 40 - 20).toFixed(1),
          bookingsChange: (Math.random() * 30 - 15).toFixed(1),
          studentsChange: (Math.random() * 25 - 10).toFixed(1),
          ratingChange: (Math.random() * 10 - 5).toFixed(1),
          chartLabels,
          chartData,
          pieLabels,
          pieData,
          recentActivity
        }
      } else if (userType.value === 'student') {
        return {
          totalSessions: Math.floor(Math.random() * 30) + 15,
          totalHours: (Math.random() * 50 + 25).toFixed(1),
          totalSpent: (Math.random() * 1000 + 300).toFixed(2),
          tutorsWorkedWith: Math.floor(Math.random() * 10) + 5,
          sessionsChange: (Math.random() * 30 - 15).toFixed(1),
          hoursChange: (Math.random() * 25 - 10).toFixed(1),
          spendingChange: (Math.random() * 35 - 15).toFixed(1),
          tutorsChange: (Math.random() * 20 - 10).toFixed(1),
          chartLabels,
          chartData,
          pieLabels,
          pieData,
          recentActivity
        }
      } else if (userType.value === 'centre') {
        return {
          totalRevenue: (Math.random() * 5000 + 1000).toFixed(2),
          totalStudents: Math.floor(Math.random() * 100) + 50,
          totalTutors: Math.floor(Math.random() * 20) + 10,
          averageRating: (Math.random() * 2 + 3).toFixed(1),
          totalBookings: Math.floor(Math.random() * 100) + 50,
          totalHours: (Math.random() * 200 + 100).toFixed(1),
          revenueChange: (Math.random() * 40 - 20).toFixed(1),
          bookingsChange: (Math.random() * 30 - 15).toFixed(1),
          studentsChange: (Math.random() * 25 - 10).toFixed(1),
          tutorsChange: (Math.random() * 20 - 10).toFixed(1),
          ratingChange: (Math.random() * 10 - 5).toFixed(1),
          chartLabels,
          chartData,
          pieLabels,
          pieData,
          recentActivity
        }
      }

      return {}
    }

    // Load analytics data
    const loadAnalytics = async () => {
      if (!userId.value) return

      isLoading.value = true
      error.value = ''

      try {
        // Get auth token
        const token = authStore.token
        if (!token) {
          throw new Error('No authentication token available')
        }

        // Determine the correct endpoint based on user type
        let endpoint = ''
        switch (userType.value) {
          case 'student':
            endpoint = `/api/analytics/student/${userId.value}`
            break
          case 'tutor':
            endpoint = `/api/analytics/tutor/${userId.value}`
            break
          case 'centre':
            endpoint = `/api/analytics/centre/${userId.value}`
            break
          default:
            throw new Error('Invalid user type for analytics')
        }

        // Fetch real data from analytics service
        const response = await axios.get(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            period: selectedPeriod.value
          }
        })

        if (response.data.success) {
          analyticsData.value = response.data.data
          await nextTick()
          createCharts()
        } else {
          throw new Error(response.data.error || 'Failed to load analytics data')
        }
      } catch (err) {
        console.error('Analytics load error:', err)
        
        // Fallback to mock data if real data fails
        console.warn('Falling back to mock data due to error:', err.message)
        const mockData = generateMockData()
        analyticsData.value = mockData
        await nextTick()
        createCharts()
        
        // Show error but don't block the UI
        error.value = `Using demo data: ${err.response?.data?.error || err.message}`
      } finally {
        isLoading.value = false
      }
    }

    // Create charts
    const createCharts = () => {
      if (mainChartInstance) mainChartInstance.destroy()
      if (secondaryChartInstance) secondaryChartInstance.destroy()

      // Main chart (line chart)
      if (mainChart.value) {
        const ctx = mainChart.value.getContext('2d')
        mainChartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: analyticsData.value.chartLabels || [],
            datasets: [{
              label: getMainChartTitle(),
              data: analyticsData.value.chartData || [],
              borderColor: '#ff8c42',
              backgroundColor: 'rgba(255, 140, 66, 0.1)',
              tension: 0.4,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: {
                  color: '#ffffff'
                }
              }
            },
            scales: {
              x: {
                ticks: { color: '#ffffff' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
              },
              y: {
                ticks: { color: '#ffffff' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
              }
            }
          }
        })
      }

      // Secondary chart (doughnut chart)
      if (secondaryChart.value) {
        const ctx = secondaryChart.value.getContext('2d')
        secondaryChartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: analyticsData.value.pieLabels || [],
            datasets: [{
              data: analyticsData.value.pieData || [],
              backgroundColor: [
                '#ff8c42',
                '#ffd23f',
                '#10b981',
                '#3b82f6',
                '#8b5cf6',
                '#ef4444'
              ]
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: {
                  color: '#ffffff'
                }
              }
            }
          }
        })
      }
    }

    // Watch for user type changes
    watch(userType, () => {
      if (userId.value) {
        loadAnalytics()
      }
    })

    // Load data on mount
    onMounted(() => {
      if (userId.value) {
        loadAnalytics()
      }
    })

    return {
      isLoading,
      error,
      selectedPeriod,
      analyticsData,
      kpiCards,
      tableHeaders,
      tableData,
      mainChart,
      secondaryChart,
      userType,
      getPageTitle,
      getMainChartTitle,
      getSecondaryChartTitle,
      loadAnalytics
    }
  }
}
</script>

<style scoped>
.analytics-page {
  background: transparent !important;
  min-height: 100vh;
  position: relative;
  z-index: 10;
}

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
  font-size: 1.2rem;
}

.analytics-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.cyberpunk-select {
  background: rgba(42, 42, 42, 0.8) !important;
  border: 2px solid var(--cyber-grey-light) !important;
  color: var(--cyber-text) !important;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.cyberpunk-select:focus {
  border-color: var(--cyber-orange) !important;
  box-shadow: 0 0 15px rgba(255, 140, 66, 0.3) !important;
  outline: none;
}

.cyberpunk-spinner-large {
  display: inline-block;
  width: 3rem;
  height: 3rem;
  border: 4px solid rgba(255, 140, 66, 0.3);
  border-top: 4px solid var(--cyber-orange);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.cyberpunk-alert {
  background: rgba(239, 68, 68, 0.1) !important;
  border: 2px solid #ef4444 !important;
  color: #ef4444 !important;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.kpi-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(45deg, var(--cyber-orange), var(--cyber-yellow));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  font-size: 1.5rem;
  color: white;
  box-shadow: 0 0 20px rgba(255, 140, 66, 0.5);
}

.kpi-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--cyber-text);
  margin-bottom: 0.5rem;
}

.kpi-label {
  color: var(--cyber-text-muted);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.kpi-change {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.kpi-change.positive {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.kpi-change.negative {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.cyberpunk-table {
  color: var(--cyber-text) !important;
  background: transparent !important;
}

.cyberpunk-table th {
  background: rgba(255, 140, 66, 0.1) !important;
  color: var(--cyber-orange) !important;
  border-color: var(--cyber-grey-light) !important;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.8rem;
}

.cyberpunk-table td {
  border-color: var(--cyber-grey-light) !important;
  color: var(--cyber-text) !important;
}

.cyberpunk-table tbody tr:hover {
  background: rgba(255, 140, 66, 0.05) !important;
}

.cyberpunk-text-muted {
  color: var(--cyber-text-muted) !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .cyberpunk-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .analytics-controls {
    justify-content: center;
  }
  
  .kpi-value {
    font-size: 1.5rem;
  }
  
  .kpi-icon {
    width: 50px;
    height: 50px;
    font-size: 1.2rem;
  }
}
</style>