<template>
  <div class="analytics-page">
    <div class="container pt-4 pt-lg-5 pb-3 pb-lg-4">
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
                <div class="kpi-icon" :class="userType === 'tutor' ? 'tutor-theme' : 'student-theme'">
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
        <div class="row mb-4">
          <!-- Main Chart -->
          <div class="col-lg-6 mb-4">
            <div class="card cyberpunk-card h-100">
              <div class="card-header cyberpunk-header">
                <h5 class="cyberpunk-title mb-0">
                  <i class="fas fa-chart-area me-2"></i>
                  {{ getMainChartTitle() }}
                </h5>
              </div>
              <div class="card-body d-flex flex-column">
                <div style="position: relative; height: 400px; width: 100%; flex: 1;">
                  <canvas ref="mainChart"></canvas>
                </div>
              </div>
            </div>
          </div>

          <!-- Secondary Chart -->
          <div class="col-lg-6 mb-4">
            <div class="card cyberpunk-card h-100">
              <div class="card-header cyberpunk-header">
                <h5 class="cyberpunk-title mb-0">
                  <i class="fas fa-chart-pie me-2"></i>
                  {{ getSecondaryChartTitle() }}
                </h5>
              </div>
              <div class="card-body d-flex flex-column">
                <div style="position: relative; height: 400px; width: 100%; flex: 1;">
                  <canvas ref="secondaryChart" style="max-width: 100%; max-height: 100%;"></canvas>
                </div>
                <div v-if="!analyticsData.pieLabels || analyticsData.pieLabels.length === 0" class="text-center text-muted mt-3">
                  <p>No subject data available</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Spending Chart - Full Width -->
        <div class="row mb-5">
          <div class="col-12">
            <div class="card cyberpunk-card">
              <div class="card-header cyberpunk-header">
                <h5 class="cyberpunk-title mb-0">
                  <i class="fas fa-dollar-sign me-2"></i>
                  {{ getSpendingChartTitle() }}
                </h5>
              </div>
              <div class="card-body">
                <div style="position: relative; height: 400px; width: 100%;">
                  <canvas ref="spendingChart"></canvas>
                </div>
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
                      <tr v-if="tableData.length === 0">
                        <td colspan="6" class="text-center text-muted py-4">
                          <i class="fas fa-info-circle me-2"></i>
                          No recent activity data available
                        </td>
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
import api from '../services/api'

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
    const spendingChart = ref(null)
    let mainChartInstance = null
    let secondaryChartInstance = null
    let spendingChartInstance = null

    // Computed properties
    const userType = computed(() => authStore.userType)
    const userId = computed(() => authStore.user?.id)

    // Chart color themes based on user type
    const chartColors = computed(() => {
      if (userType.value === 'tutor') {
        // Tutor theme: Teal/Cyan gradient
        return {
          primary: '#14b8a6',      // Teal
          primaryLight: 'rgba(20, 184, 166, 0.1)',
          secondary: '#06b6d4',     // Cyan
          tertiary: '#0d9488',      // Darker teal
          accent: '#0891b2',        // Sky blue-teal
          gradient: ['#14b8a6', '#06b6d4', '#0d9488', '#0891b2', '#06b6d4', '#14b8a6'],
          pieColors: [
            '#14b8a6',  // Teal
            '#06b6d4',  // Cyan
            '#0d9488',  // Darker teal
            '#0891b2',  // Sky blue-teal
            '#10b981',  // Green
            '#22d3ee'   // Light cyan
          ],
          spending: '#06b6d4',      // Cyan for earnings
          spendingLight: 'rgba(6, 182, 212, 0.1)'
        }
      } else {
        // Student theme: Orange/Yellow (original)
        return {
          primary: '#ff8c42',      // Orange
          primaryLight: 'rgba(255, 140, 66, 0.1)',
          secondary: '#ffd23f',    // Yellow
          tertiary: '#10b981',    // Green
          accent: '#ef4444',       // Red
          gradient: ['#ff8c42', '#ffd23f', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'],
          pieColors: [
            '#ff8c42',  // Orange
            '#ffd23f',  // Yellow
            '#10b981',  // Green
            '#3b82f6',  // Blue
            '#8b5cf6',  // Purple
            '#ef4444'   // Red
          ],
          spending: '#10b981',     // Green for spending
          spendingLight: 'rgba(16, 185, 129, 0.1)'
        }
      }
    })

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
        case 'tutor': return 'Teaching Hours'
        case 'student': return 'Learning Hours'
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

    const getSpendingChartTitle = () => {
      switch (userType.value) {
        case 'tutor': return 'Daily Earnings'
        case 'student': return 'Daily Spending'
        case 'centre': return 'Daily Revenue'
        default: return 'Daily Financials'
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
      if (!analyticsData.value.recentActivity) {
        return [];
      }
      
      // Sort by date (newest first)
      const sortedActivities = [...analyticsData.value.recentActivity].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      return sortedActivities.map((activity) => {
        switch (userType.value) {
          case 'tutor':
            return [
              new Date(activity.date).toLocaleDateString(),
              activity.subject || 'N/A',
              activity.studentName || 'N/A',
              activity.duration || 'N/A',
              `$${activity.earnings || 0}`,
              activity.rating || 'N/A'
            ];
          case 'student':
            return [
              new Date(activity.date).toLocaleDateString(),
              activity.subject || 'N/A',
              activity.tutorName || 'N/A',
              activity.duration || 'N/A',
              `$${activity.cost || 0}`,
              activity.rating || 'N/A'
            ];
          case 'centre':
            return [
              new Date(activity.date).toLocaleDateString(),
              activity.tutorName || 'N/A',
              activity.subject || 'N/A',
              activity.students || 0,
              `$${activity.revenue || 0}`,
              activity.rating || 'N/A'
            ];
          default:
            return [];
        }
      });
    });

    // Mock data generation completely removed - only real data from API

    // Load analytics data
    const loadAnalytics = async () => {
      console.log('🔍 ANALYTICS DEBUG:', {
        userId: userId.value,
        userType: userType.value,
        hasToken: !!authStore.token,
        tokenPreview: authStore.token ? authStore.token.substring(0, 20) + '...' : 'none'
      });

      if (!userId.value) {
        console.log('❌ No userId available, skipping analytics load');
        return;
      }

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
            endpoint = `/analytics/student/${userId.value}`
            break
          case 'tutor':
            endpoint = `/analytics/tutor/${userId.value}`
            break
          case 'centre':
            endpoint = `/analytics/centre/${userId.value}`
            break
          default:
            throw new Error('Invalid user type for analytics')
        }

        console.log('🔍 ANALYTICS API CALL:', {
          endpoint,
          userType: userType.value,
          userId: userId.value,
          period: selectedPeriod.value
        });

        // Fetch real data from analytics service
        const response = await api.get(endpoint, {
          params: {
            period: selectedPeriod.value
          }
        })

        if (response.data.success) {
          analyticsData.value = response.data.data
          await nextTick()
          // Add a small delay to ensure DOM is fully rendered
          setTimeout(() => {
            createCharts()
          }, 100)
        } else {
          throw new Error(response.data.error || 'Failed to load analytics data')
        }
      } catch (err) {
        console.error('Analytics load error:', err)
        console.error('Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          url: err.config?.url
        })
        
        // Show specific error messages instead of falling back to mock data
        if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
          error.value = `Analytics service is not running. Please start the analytics service on port 3008.`
        } else if (err.response?.status === 401) {
          error.value = `Authentication failed. Please log in again.`
        } else if (err.response?.status === 403) {
          error.value = `Access denied. You don't have permission to view this data.`
        } else {
          error.value = `Failed to load analytics data: ${err.response?.data?.error || err.message}`
        }
      } finally {
        isLoading.value = false
      }
    }

    // Create charts
    const createCharts = () => {
      if (mainChartInstance) mainChartInstance.destroy()
      if (secondaryChartInstance) secondaryChartInstance.destroy()
      if (spendingChartInstance) spendingChartInstance.destroy()

      // Main chart (line chart)
      if (mainChart.value) {
        const ctx = mainChart.value.getContext('2d')
        // Ensure all chart data values are non-negative
        const chartData = (analyticsData.value.chartData || []).map(val => Math.max(0, parseFloat(val) || 0))
        const colors = chartColors.value
        mainChartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: analyticsData.value.chartLabels || [],
            datasets: [{
              label: getMainChartTitle(),
              data: chartData,
              borderColor: colors.primary,
              backgroundColor: colors.primaryLight,
              tension: 0.4,
              fill: true,
              pointBackgroundColor: colors.primary,
              pointBorderColor: colors.primary,
              pointHoverBackgroundColor: colors.secondary,
              pointHoverBorderColor: colors.primary
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
                beginAtZero: true,
                min: 0,
                ticks: { color: '#ffffff' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
              }
            }
          }
        })
      }

      // Secondary chart (doughnut chart)
      if (secondaryChart.value) {
        try {
          const ctx = secondaryChart.value.getContext('2d')
          const colors = chartColors.value
          
          // Prepare chart data - handle empty data gracefully
          const hasData = analyticsData.value.pieLabels && analyticsData.value.pieLabels.length > 0
          
          // Generate colors for pie chart - cycle through colors if more data points than colors
          const generatePieColors = (count) => {
            if (count === 0) return ['#666666']
            const result = []
            for (let i = 0; i < count; i++) {
              result.push(colors.pieColors[i % colors.pieColors.length])
            }
            return result
          }
          
          const chartData = {
            labels: hasData ? analyticsData.value.pieLabels : ['No Data'],
            datasets: [{
              data: hasData ? analyticsData.value.pieData : [1],
              backgroundColor: hasData 
                ? generatePieColors(analyticsData.value.pieData.length)
                : ['#666666']
            }]
          }
          
          secondaryChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                  labels: {
                    color: '#ffffff',
                    font: {
                      size: 12
                    }
                  }
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const label = context.label || '';
                      const value = context.parsed || 0;
                      const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                      return `${label}: ${value} sessions (${percentage}%)`;
                    }
                  }
                }
              }
            }
          })
        } catch (error) {
          console.error('Error creating secondary chart:', error)
        }
      }

      // Spending chart (line chart)
      if (spendingChart.value) {
        try {
          const ctx = spendingChart.value.getContext('2d')
          const colors = chartColors.value
          // Ensure all spending data values are non-negative
          const spendingData = (analyticsData.value.spendingData || []).map(val => Math.max(0, parseFloat(val) || 0))
          spendingChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
              labels: analyticsData.value.chartLabels || [],
              datasets: [{
                label: getSpendingChartTitle(),
                data: spendingData,
                borderColor: colors.spending,
                backgroundColor: colors.spendingLight,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: colors.spending,
                pointBorderColor: colors.spending,
                pointHoverBackgroundColor: userType.value === 'tutor' ? colors.primary : colors.tertiary,
                pointHoverBorderColor: colors.spending
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
                  beginAtZero: true,
                  min: 0,
                  ticks: { 
                    color: '#ffffff',
                    callback: function(value) {
                      return '$' + Math.max(0, value).toFixed(2)
                    }
                  },
                  grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
              }
            }
          })
        } catch (error) {
          console.error('Error creating spending chart:', error)
        }
      }
    }

    // Watch for user type changes
    watch(userType, () => {
      if (userId.value) {
        loadAnalytics()
      }
    })

    // Watch for color theme changes and recreate charts
    watch(chartColors, () => {
      if (mainChart.value || secondaryChart.value || spendingChart.value) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          createCharts()
        }, 100)
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
      spendingChart,
      userType,
      chartColors,
      getPageTitle,
      getMainChartTitle,
      getSecondaryChartTitle,
      getSpendingChartTitle,
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
  background: rgba(42, 42, 42, 0.95) !important;
  border: 2px solid var(--cyber-orange) !important;
  color: var(--cyber-text) !important;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.cyberpunk-select:hover {
  background: rgba(255, 140, 66, 0.1) !important;
  border-color: var(--cyber-yellow) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 140, 66, 0.3);
}

.cyberpunk-select option {
  background: rgba(26, 26, 26, 0.98) !important;
  color: var(--cyber-text) !important;
  padding: 0.5rem;
}

/* Table styling to match dark theme */
.table {
  background: rgba(42, 42, 42, 0.9) !important;
  color: var(--cyber-text) !important;
}

.table thead th {
  background: rgba(255, 140, 66, 0.2) !important;
  color: var(--cyber-orange) !important;
  border-color: var(--cyber-orange) !important;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.table tbody tr {
  background: rgba(42, 42, 42, 0.9) !important;
  color: var(--cyber-text) !important;
  border-color: rgba(255, 140, 66, 0.3) !important;
}

.table tbody tr:hover {
  background: rgba(255, 140, 66, 0.1) !important;
}

.table tbody td {
  background: transparent !important;
  color: var(--cyber-text) !important;
  border-color: rgba(255, 140, 66, 0.3) !important;
  padding: 0.75rem;
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
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  font-size: 1.5rem;
  color: white;
}

.kpi-icon.student-theme {
  background: linear-gradient(45deg, var(--cyber-orange), var(--cyber-yellow));
  box-shadow: 0 0 20px rgba(255, 140, 66, 0.5);
}

.kpi-icon.tutor-theme {
  background: linear-gradient(45deg, #14b8a6, #06b6d4);
  box-shadow: 0 0 20px rgba(20, 184, 166, 0.5);
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