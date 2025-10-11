<template>
  <div class="tutor-profile-page">
    <!-- Floating Background Elements -->
    <div class="floating-elements">
      <div class="floating-icon" ref="floatingIcon1">
        <i class="fas fa-graduation-cap"></i>
      </div>
      <div class="floating-icon" ref="floatingIcon2">
        <i class="fas fa-book"></i>
      </div>
      <div class="floating-icon" ref="floatingIcon3">
        <i class="fas fa-star"></i>
      </div>
      <div class="floating-icon" ref="floatingIcon4">
        <i class="fas fa-chalkboard-teacher"></i>
      </div>
      <div class="floating-icon" ref="floatingIcon5">
        <i class="fas fa-lightbulb"></i>
      </div>
      <div class="floating-icon" ref="floatingIcon6">
        <i class="fas fa-calculator"></i>
      </div>
    </div>

    <!-- Hero Section -->
    <section class="cyberpunk-hero-section">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-md-8">
            <h1 class="cyberpunk-hero-title" ref="heroTitle">Tutor Profile</h1>
            <p class="cyberpunk-hero-subtitle" ref="heroSubtitle">Connect with experienced tutors for personalized learning</p>
          </div>
          <div class="col-md-4 text-end">
            <i class="fas fa-user-graduate cyberpunk-hero-icon" ref="heroIcon"></i>
          </div>
        </div>
      </div>
    </section>

    <!-- Booking Modal -->
    <div v-if="showBookingModal" class="cyberpunk-modal-overlay" @click="closeBookingModal">
      <div class="cyberpunk-modal" @click.stop>
        <div class="cyberpunk-modal-header">
          <h3 class="cyberpunk-modal-title">
            <i class="fas fa-calendar-plus me-2"></i>Book Session with {{ tutor.name }}
          </h3>
          <button class="cyberpunk-modal-close" @click="closeBookingModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="cyberpunk-modal-body">
          <!-- Step 1: Select Date -->
          <div v-if="bookingStep === 1" class="cyberpunk-booking-step">
            <h5 class="cyberpunk-step-title">Select Date</h5>
            <div class="cyberpunk-calendar">
              <div class="cyberpunk-calendar-header">
                <button @click="previousMonth" class="cyberpunk-calendar-nav">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <h6 class="cyberpunk-calendar-month">{{ currentMonthYear }}</h6>
                <button @click="nextMonth" class="cyberpunk-calendar-nav">
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>
              <div class="cyberpunk-calendar-grid">
                <div class="cyberpunk-calendar-day-header" v-for="day in dayHeaders" :key="day">
                  {{ day }}
                </div>
                <div 
                  v-for="day in calendarDays" 
                  :key="day.date"
                  class="cyberpunk-calendar-day"
                  :class="{ 
                    'cyberpunk-calendar-day-selected': selectedDate === day.date,
                    'cyberpunk-calendar-day-available': day.available,
                    'cyberpunk-calendar-day-other-month': !day.currentMonth
                  }"
                  @click="selectDate(day.date, day.available)"
                >
                  {{ day.day }}
                </div>
              </div>
            </div>
            <div class="cyberpunk-booking-actions">
              <button class="cyberpunk-btn cyberpunk-btn-outline" @click="closeBookingModal">
                Cancel
              </button>
              <button 
                class="cyberpunk-btn cyberpunk-btn-primary" 
                @click="nextStep"
                :disabled="!selectedDate"
              >
                Next: Select Time
              </button>
            </div>
          </div>

          <!-- Step 2: Select Time -->
          <div v-if="bookingStep === 2" class="cyberpunk-booking-step">
            <h5 class="cyberpunk-step-title">Select Time</h5>
            <p class="cyberpunk-selected-date">
              <i class="fas fa-calendar me-2"></i>{{ formatSelectedDate(selectedDate) }}
            </p>
            <div class="cyberpunk-time-slots">
              <div 
                v-for="timeSlot in availableTimeSlots" 
                :key="timeSlot"
                class="cyberpunk-time-slot"
                :class="{ 'cyberpunk-time-slot-selected': selectedTime === timeSlot }"
                @click="selectTime(timeSlot)"
              >
                {{ timeSlot }}
              </div>
            </div>
            <div class="cyberpunk-booking-actions">
              <button class="cyberpunk-btn cyberpunk-btn-outline" @click="previousStep">
                Back to Date
              </button>
              <button 
                class="cyberpunk-btn cyberpunk-btn-primary" 
                @click="nextStep"
                :disabled="!selectedTime"
              >
                Next: Confirm Booking
              </button>
            </div>
          </div>

          <!-- Step 3: Confirm Booking -->
          <div v-if="bookingStep === 3" class="cyberpunk-booking-step">
            <h5 class="cyberpunk-step-title">Confirm Booking</h5>
            <div class="cyberpunk-booking-summary">
              <div class="cyberpunk-booking-details">
                <h6 class="cyberpunk-booking-tutor">{{ tutor.name }}</h6>
                <p class="cyberpunk-booking-subject">{{ tutor.subject }} • {{ tutor.level }}</p>
                <div class="cyberpunk-booking-datetime">
                  <i class="fas fa-calendar me-2"></i>{{ formatSelectedDate(selectedDate) }}
                </div>
                <div class="cyberpunk-booking-datetime">
                  <i class="fas fa-clock me-2"></i>{{ selectedTime }}
                </div>
                <div class="cyberpunk-booking-price">
                  <i class="fas fa-dollar-sign me-2"></i>${{ tutor.hourlyRate }}/hour
                </div>
              </div>
            </div>
            <div class="cyberpunk-booking-actions">
              <button class="cyberpunk-btn cyberpunk-btn-outline" @click="previousStep">
                Back to Time
              </button>
              <button class="cyberpunk-btn cyberpunk-btn-primary" @click="confirmBooking">
                <i class="fas fa-check me-2"></i>Confirm Booking
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tutor Profile Content -->
    <section class="cyberpunk-content-section">
      <div class="container">
        <div class="row">
          <!-- Tutor Info Card -->
          <div class="col-lg-4 mb-4">
            <div class="cyberpunk-tutor-card" ref="tutorCard">
              <div class="cyberpunk-card-body text-center">
                <div class="cyberpunk-tutor-avatar mb-3">
                  <img 
                    :src="tutor.avatar" 
                    :alt="tutor.name"
                    class="cyberpunk-avatar-img"
                    ref="tutorAvatar"
                  >
                </div>
                <h3 class="cyberpunk-tutor-name">{{ tutor.name }}</h3>
                <div class="cyberpunk-rating mb-3">
                  <i v-for="n in 5" :key="n" :class="n <= tutor.rating ? 'fas fa-star cyberpunk-star' : 'far fa-star cyberpunk-star-empty'"></i>
                  <span class="cyberpunk-rating-text">({{ tutor.reviews }})</span>
                </div>
                <div class="cyberpunk-button-group">
                  <button class="cyberpunk-btn cyberpunk-btn-primary" ref="bookButton" @click="bookSession">
                    <i class="fas fa-calendar-plus me-2"></i>Book Session
                  </button>
                  <button class="cyberpunk-btn cyberpunk-btn-outline" ref="messageButton" @click="sendMessage">
                    <i class="fas fa-comment me-2"></i>Send Message
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Tutor Details -->
          <div class="col-lg-8">
            <!-- About Section -->
            <div class="cyberpunk-detail-card mb-4" ref="aboutCard">
              <div class="cyberpunk-card-header">
                <h4 class="cyberpunk-card-title">
                  <i class="fas fa-user me-2"></i>About {{ tutor.name }}
                </h4>
              </div>
              <div class="cyberpunk-card-body">
                <p class="cyberpunk-card-text">{{ tutor.bio }}</p>
                <div class="row">
                  <div class="col-md-6">
                    <h6 class="cyberpunk-info-title"><i class="fas fa-graduation-cap me-2"></i>Education</h6>
                    <p class="cyberpunk-info-text">{{ tutor.education }}</p>
                  </div>
                  <div class="col-md-6">
                    <h6 class="cyberpunk-info-title"><i class="fas fa-briefcase me-2"></i>Experience</h6>
                    <p class="cyberpunk-info-text">{{ tutor.experience }} years</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Subjects & Levels -->
            <div class="cyberpunk-detail-card mb-4" ref="subjectsCard">
              <div class="cyberpunk-card-header">
                <h4 class="cyberpunk-card-title">
                  <i class="fas fa-book me-2"></i>Subjects & Levels
                </h4>
              </div>
              <div class="cyberpunk-card-body">
                <div class="row">
                  <div class="col-md-6">
                    <h6 class="cyberpunk-section-title">Subjects</h6>
                    <div class="cyberpunk-tags">
                      <span 
                        class="cyberpunk-tag cyberpunk-tag-primary" 
                        v-for="subject in tutor.subjects" 
                        :key="subject"
                      >
                        {{ subject }}
                      </span>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <h6 class="cyberpunk-section-title">Levels</h6>
                    <div class="cyberpunk-tags">
                      <span 
                        class="cyberpunk-tag cyberpunk-tag-success" 
                        v-for="level in tutor.levels" 
                        :key="level"
                      >
                        {{ level }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pricing -->
            <div class="cyberpunk-detail-card mb-4" ref="pricingCard">
              <div class="cyberpunk-card-header">
                <h4 class="cyberpunk-card-title">
                  <i class="fas fa-dollar-sign me-2"></i>Pricing
                </h4>
              </div>
              <div class="cyberpunk-card-body">
                <div class="row">
                  <div class="col-md-4">
                    <div class="cyberpunk-pricing-item">
                      <h5 class="cyberpunk-price cyberpunk-price-primary">${{ tutor.hourlyRate }}/hour</h5>
                      <small class="cyberpunk-price-label">Individual Session</small>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="cyberpunk-pricing-item">
                      <h5 class="cyberpunk-price cyberpunk-price-success">${{ tutor.groupRate }}/hour</h5>
                      <small class="cyberpunk-price-label">Group Session</small>
                    </div>
                  </div>
                                  </div>
              </div>
            </div>

            <!-- Reviews -->
            <div class="cyberpunk-detail-card" ref="reviewsCard">
              <div class="cyberpunk-card-header">
                <h4 class="cyberpunk-card-title">
                  <i class="fas fa-star me-2"></i>Reviews ({{ tutor.reviews }})
                </h4>
              </div>
              <div class="cyberpunk-card-body">
                <div v-for="review in displayedReviews" :key="review.id" class="cyberpunk-review-item">
                  <div class="cyberpunk-review-content">
                    <div>
                      <h6 class="cyberpunk-review-name">{{ review.studentName }}</h6>
                      <div class="cyberpunk-review-rating">
                        <i
                          class="fas fa-star"
                          :class="n <= review.rating ? 'cyberpunk-star-filled' : 'cyberpunk-star-empty'"
                          v-for="n in 5"
                          :key="n"
                        ></i>
                      </div>
                      <p class="cyberpunk-review-comment">{{ review.comment }}</p>
                    </div>
                    <small class="cyberpunk-review-date">{{ formatDate(review.createdAt) }}</small>
                  </div>
                </div>
                <div v-if="reviews.length > 3" class="text-center mt-3">
                  <button v-if="!showAllReviews" class="cyberpunk-btn cyberpunk-btn-outline" @click="showAllReviews = true">
                    <i class="fas fa-chevron-down me-2"></i>Show All Reviews ({{ reviews.length }})
                  </button>
                  <button v-else class="cyberpunk-btn cyberpunk-btn-outline" @click="showAllReviews = false">
                    <i class="fas fa-chevron-up me-2"></i>Show Less
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createTimeline, animate, createAnimatable, utils } from 'animejs'

export default {
  name: 'TutorProfile',
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    // Refs for animations
    const heroTitle = ref(null)
    const heroSubtitle = ref(null)
    const heroIcon = ref(null)
    const tutorCard = ref(null)
    const tutorAvatar = ref(null)
    const bookButton = ref(null)
    const messageButton = ref(null)
    const aboutCard = ref(null)
    const subjectsCard = ref(null)
    const pricingCard = ref(null)
    const reviewsCard = ref(null)
    const floatingIcon1 = ref(null)
    const floatingIcon2 = ref(null)
    const floatingIcon3 = ref(null)
    const floatingIcon4 = ref(null)
    const floatingIcon5 = ref(null)
    const floatingIcon6 = ref(null)

    const tutor = ref({
      id: null,
      name: 'Loading...',
      subject: 'Loading...',
      level: 'Loading...',
      avatar: 'https://i.pravatar.cc/400?img=1',
      rating: 0,
      bio: 'Loading tutor information...',
      education: 'Loading...',
      experience: 0,
      experienceRange: 'Loading...',
      subjects: [],
      levels: [],
      hourlyRate: 0,
      groupRate: 0,
            location: 'Loading...',
      teachingMode: 'both',
      availability: [],
      reviews: 0
    })

    const reviews = ref([])
    const showAllReviews = ref(false)

    // Computed property to show first 3 reviews or all reviews
    const displayedReviews = computed(() => {
      return showAllReviews.value ? reviews.value : reviews.value.slice(0, 3)
    })

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString()
    }

    // Booking modal state
    const showBookingModal = ref(false)
    const bookingStep = ref(1) // 1: Date, 2: Time, 3: Confirm
    const selectedDate = ref(null)
    const selectedTime = ref(null)
    const currentMonth = ref(new Date().getMonth())
    const currentYear = ref(new Date().getFullYear())

    // Calendar data
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    const currentMonthYear = computed(() => {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December']
      return `${monthNames[currentMonth.value]} ${currentYear.value}`
    })

    const calendarDays = computed(() => {
      const days = []
      const firstDay = new Date(currentYear.value, currentMonth.value, 1)
      const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)
      const startDate = new Date(firstDay)
      startDate.setDate(startDate.getDate() - firstDay.getDay())
      
      for (let i = 0; i < 42; i++) {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + i)
        
        const isCurrentMonth = date.getMonth() === currentMonth.value
        const isToday = date.toDateString() === new Date().toDateString()
        const isPast = date < new Date().setHours(0, 0, 0, 0)
        
        days.push({
          day: date.getDate(),
          date: date.toISOString().split('T')[0],
          currentMonth: isCurrentMonth,
          available: isCurrentMonth && !isPast,
          isToday: isToday
        })
      }
      return days
    })

    const availableTimeSlots = computed(() => {
      // Generate time slots from 9 AM to 6 PM
      const slots = []
      for (let hour = 9; hour <= 18; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`)
        if (hour < 18) {
          slots.push(`${hour.toString().padStart(2, '0')}:30`)
        }
      }
      return slots
    })

    const bookSession = () => {
      showBookingModal.value = true
      bookingStep.value = 1
      selectedDate.value = null
      selectedTime.value = null
      
      // Animate modal entrance with anime.js
      setTimeout(() => {
        initBookingModalAnimations()
      }, 50)
    }

    const closeBookingModal = () => {
      showBookingModal.value = false
      bookingStep.value = 1
      selectedDate.value = null
      selectedTime.value = null
    }

    const selectDate = (date, available) => {
      if (available) {
        selectedDate.value = date
        
        // Animate date selection
        const selectedDay = document.querySelector('.cyberpunk-calendar-day-selected')
        if (selectedDay) {
          animate(selectedDay, {
            scale: [1, 1.1, 1],
            duration: 200,
            ease: 'easeOutBack'
          })
        }
      }
    }

    const selectTime = (time) => {
      selectedTime.value = time
      
      // Animate time selection
      const selectedSlot = document.querySelector('.cyberpunk-time-slot-selected')
      if (selectedSlot) {
        animate(selectedSlot, {
          scale: [1, 1.1, 1],
          duration: 200,
          ease: 'easeOutBack'
        })
      }
    }

    const nextStep = () => {
      if (bookingStep.value < 3) {
        animateStepTransition('next')
        setTimeout(() => {
          bookingStep.value++
        }, 150)
      }
    }

    const previousStep = () => {
      if (bookingStep.value > 1) {
        animateStepTransition('previous')
        setTimeout(() => {
          bookingStep.value--
        }, 150)
      }
    }

    const previousMonth = () => {
      if (currentMonth.value === 0) {
        currentMonth.value = 11
        currentYear.value--
      } else {
        currentMonth.value--
      }
    }

    const nextMonth = () => {
      if (currentMonth.value === 11) {
        currentMonth.value = 0
        currentYear.value++
      } else {
        currentMonth.value++
      }
    }

    const formatSelectedDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }

    const confirmBooking = () => {
      // Animate booking confirmation
      const modal = document.querySelector('.cyberpunk-modal')
      if (modal) {
        animate(modal, {
          scale: [1, 1.05, 1],
          duration: 300,
          ease: 'easeInOutQuad',
          complete: () => {
            // In a real app, this would send booking data to backend
            alert(`Booking confirmed!\n\nTutor: ${tutor.value.name}\nDate: ${formatSelectedDate(selectedDate.value)}\nTime: ${selectedTime.value}\nRate: $${tutor.value.hourlyRate}/hour\n\nThis would normally send the booking to the backend.`)
            console.log('Booking confirmed:', {
              tutor: tutor.value.name,
              date: selectedDate.value,
              time: selectedTime.value,
              rate: tutor.value.hourlyRate
            })
            closeBookingModal()
          }
        })
      }
    }

    const initBookingModalAnimations = () => {
      // Modal entrance animation
      const modal = document.querySelector('.cyberpunk-modal')
      const modalHeader = document.querySelector('.cyberpunk-modal-header')
      const bookingStep = document.querySelector('.cyberpunk-booking-step')
      const calendarDays = document.querySelectorAll('.cyberpunk-calendar-day')
      const timeSlots = document.querySelectorAll('.cyberpunk-time-slot')

      if (modal) {
        animate(modal, {
          scale: [0.8, 1],
          opacity: [0, 1],
          translateY: [-50, 0],
          duration: 400,
          ease: 'easeOutExpo'
        })
      }

      if (modalHeader) {
        animate(modalHeader, {
          translateX: [-30, 0],
          opacity: [0, 1],
          duration: 300,
          ease: 'easeOutExpo',
          delay: 200
        })
      }

      if (bookingStep) {
        animate(bookingStep, {
          translateX: [30, 0],
          opacity: [0, 1],
          duration: 300,
          ease: 'easeOutExpo',
          delay: 200
        })
      }

      // Animate calendar days with stagger
      calendarDays.forEach((day, index) => {
        animate(day, {
          scale: [0, 1],
          opacity: [0, 1],
          duration: 200,
          delay: index * 20,
          ease: 'easeOutBack'
        })
      })

      // Animate time slots with stagger
      timeSlots.forEach((slot, index) => {
        animate(slot, {
          scale: [0, 1],
          opacity: [0, 1],
          duration: 200,
          delay: index * 30,
          ease: 'easeOutBack'
        })
      })
    }

    const animateStepTransition = (direction = 'next') => {
      const currentStep = document.querySelector('.cyberpunk-booking-step')
      if (!currentStep) return

      // Exit animation
      animate(currentStep, {
        translateX: direction === 'next' ? -50 : 50,
        opacity: [1, 0],
        scale: [1, 0.9],
        duration: 150,
        ease: 'easeInOutQuad',
        complete: () => {
          // After exit animation, animate the new step
          setTimeout(() => {
            const newStep = document.querySelector('.cyberpunk-booking-step')
            if (newStep) {
              animate(newStep, {
                translateX: direction === 'next' ? [50, 0] : [-50, 0],
                opacity: [0, 1],
                scale: [0.9, 1],
                duration: 150,
                ease: 'easeInOutQuad'
              })
            }
          }, 50)
        }
      })
    }

    const sendMessage = () => {
      // Navigate to chat page with tutor ID
      router.push(`/chat/${tutor.value.id}`)
    }


    const initProfileAnimations = () => {
      // Create main timeline
      const profileTimeline = createTimeline({
        defaults: { 
          duration: 800,
          ease: 'out(3)',
          frameRate: 60
        }
      })

      // Hero section animations
      profileTimeline
        .add(heroTitle.value, {
          opacity: [0, 1],
          translateY: [50, 0],
          duration: 1000,
          delay: 0
        })
        .add(heroSubtitle.value, {
          opacity: [0, 1],
          translateY: [50, 0],
          duration: 1000,
          delay: 200
        })
        .add(heroIcon.value, {
          opacity: [0, 1],
          translateY: [50, 0],
          duration: 1000,
          delay: 400
        })

      // Tutor card animation
      profileTimeline
        .add(tutorCard.value, {
          opacity: [0, 1],
          translateX: [-100, 0],
          duration: 1200,
          delay: 800
        })

      // Avatar animation
      profileTimeline
        .add(tutorAvatar.value, {
          scale: [0, 1],
          rotate: [180, 0],
          duration: 1000,
          delay: 1000,
          ease: 'out(4)'
        })

      // Button animations
      profileTimeline
        .add(bookButton.value, {
          opacity: [0, 1],
          translateY: [30, 0],
          duration: 800,
          delay: 1200
        })
        .add(messageButton.value, {
          opacity: [0, 1],
          translateY: [30, 0],
          duration: 800,
          delay: 1300
        })

      // Detail cards animation
      profileTimeline
        .add(aboutCard.value, {
          opacity: [0, 1],
          translateX: [100, 0],
          duration: 1000,
          delay: 1400
        })
        .add(subjectsCard.value, {
          opacity: [0, 1],
          translateX: [100, 0],
          duration: 1000,
          delay: 1600
        })
        .add(pricingCard.value, {
          opacity: [0, 1],
          translateX: [100, 0],
          duration: 1000,
          delay: 1800
        })
        .add(reviewsCard.value, {
          opacity: [0, 1],
          translateX: [100, 0],
          duration: 1000,
          delay: 2000
        })

      // Floating elements animation - single animation, no loop
      const floatingElements = [
        floatingIcon1.value, floatingIcon2.value, floatingIcon3.value,
        floatingIcon4.value, floatingIcon5.value, floatingIcon6.value
      ]

      floatingElements.forEach((element, index) => {
        if (element) {
          profileTimeline.add(element, {
            opacity: [0, 0.1],
            translateY: [0, -10],
            duration: 2000,
            delay: 2200 + (index * 200),
            ease: 'out(2)'
          })
        }
      })
    }

    const handleCardHover = (cardRef) => {
      if (cardRef.value) {
        const hoverTimeline = createTimeline({
          defaults: { duration: 300, ease: 'out(2)' }
        })
        
        hoverTimeline.add(cardRef.value, {
          scale: 1.02
        })
      }
    }

    const handleCardLeave = (cardRef) => {
      if (cardRef.value) {
        const leaveTimeline = createTimeline({
          defaults: { duration: 300, ease: 'out(2)' }
        })
        
        leaveTimeline.add(cardRef.value, {
          scale: 1
        })
      }
    }

    const formatQualifications = (qualifications) => {
      if (!qualifications || qualifications.length === 0) {
        return 'Not specified'
      }

      // Format each qualification as "Institution Degree · Year"
      return qualifications.map(qual => {
        const parts = []
        if (qual.institution) parts.push(qual.institution)
        if (qual.degree) parts.push(qual.degree)
        const qualification = parts.join(' ')

        if (qual.year) {
          return `${qualification} · ${qual.year}`
        }
        return qualification
      }).join(' | ') || 'Not specified'
    }

    const loadTutorData = async (tutorId) => {
      try {
        console.log('Loading tutor profile for ID:', tutorId)

        // Fetch tutor profile from API
        const response = await fetch(`http://localhost:3003/profiles/tutor/${tutorId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch tutor profile')
        }

        const data = await response.json()
        console.log('API Response:', data)

        const profile = data.profile
        const user = profile.users

        // Transform API data to component format
        tutor.value = {
          id: profile.user_id,
          name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Unknown Tutor',
          subject: profile.subjects?.[0] || 'N/A',
          level: profile.levels?.[0] || 'N/A',
          avatar: profile.profile_image_url || `https://i.pravatar.cc/400?img=${Math.abs(profile.user_id.split('-')[0].charCodeAt(0)) % 70}`,
          rating: profile.average_rating || 5,
          bio: profile.bio || profile.headline || profile.teaching_philosophy || 'No bio available',
          education: formatQualifications(profile.qualifications),
          experience: profile.experience_years || 0,
          experienceRange: profile.experience_years >= 5 ? '5+' : profile.experience_years >= 3 ? '3-5' : '1-2',
          subjects: profile.subjects || [],
          levels: profile.levels || [],
          hourlyRate: profile.hourly_rate || 0,
          groupRate: profile.group_rate || (profile.hourly_rate ? profile.hourly_rate * 0.8 : 0),
                    location: profile.location?.address || profile.preferred_locations?.[0] || 'Singapore',
          teachingMode: profile.teaching_mode?.[0] || 'both',
          availability: ['now'], // TODO: Get from availability system
          reviews: profile.total_reviews || 0
        }

        // TODO: Fetch real reviews from reviews service
        reviews.value = []
        showAllReviews.value = false

        console.log('Loaded tutor:', tutor.value.name)
      } catch (error) {
        console.error('Error loading tutor profile:', error)

        // Show error state when tutor not found
        tutor.value = {
          id: null,
          name: 'Tutor Not Found',
          subject: 'N/A',
          level: 'N/A',
          avatar: 'https://i.pravatar.cc/400?img=0',
          rating: 0,
          bio: 'Unable to load tutor information. The tutor profile may not exist or there may be a network error.',
          education: 'Not specified',
          experience: 0,
          experienceRange: 'N/A',
          subjects: [],
          levels: [],
          hourlyRate: 0,
          groupRate: 0,
                    location: 'N/A',
          teachingMode: 'both',
          availability: [],
          reviews: 0
        }

        reviews.value = []
        showAllReviews.value = false
        console.log('Tutor profile could not be loaded:', tutorId)
      }
    }

    onMounted(() => {
      // Load tutor data based on route parameter (UUID)
      const tutorId = route.params.id
      if (tutorId) {
        loadTutorData(tutorId)
      }

      // Initialize animations
      setTimeout(() => {
        initProfileAnimations()
      }, 100)
    })

    // Watch for route changes to load different tutors
    watch(() => route.params.id, (newTutorId) => {
      if (newTutorId) {
        loadTutorData(newTutorId)

        // Re-initialize animations for new tutor
        setTimeout(() => {
          initProfileAnimations()
        }, 100)
      }
    })

    return {
      tutor,
      reviews,
      showAllReviews,
      displayedReviews,
      formatDate,
      bookSession,
      sendMessage,
      showBookingModal,
      bookingStep,
      selectedDate,
      selectedTime,
      currentMonthYear,
      calendarDays,
      dayHeaders,
      availableTimeSlots,
      selectDate,
      selectTime,
      nextStep,
      previousStep,
      previousMonth,
      nextMonth,
      formatSelectedDate,
      confirmBooking,
      closeBookingModal,
      initBookingModalAnimations,
      animateStepTransition,
      heroTitle,
      heroSubtitle,
      heroIcon,
      tutorCard,
      tutorAvatar,
      bookButton,
      messageButton,
      aboutCard,
      subjectsCard,
      pricingCard,
      reviewsCard,
      floatingIcon1,
      floatingIcon2,
      floatingIcon3,
      floatingIcon4,
      floatingIcon5,
      floatingIcon6,
      handleCardHover,
      handleCardLeave
    }
  }
}
</script>

<style scoped>
/* Cyberpunk Tutor Profile Page */
.tutor-profile-page {
  background: var(--cyber-bg);
  color: var(--cyber-text);
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

/* Floating Background Elements */
.floating-elements {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.floating-icon {
  position: absolute;
  color: var(--cyber-orange);
  opacity: 0.1;
  font-size: 2rem;
}

.floating-icon:nth-child(1) { top: 10%; left: 10%; }
.floating-icon:nth-child(2) { top: 20%; right: 15%; }
.floating-icon:nth-child(3) { top: 60%; left: 5%; }
.floating-icon:nth-child(4) { top: 70%; right: 10%; }
.floating-icon:nth-child(5) { top: 30%; left: 50%; }
.floating-icon:nth-child(6) { top: 80%; right: 30%; }


/* Hero Section */
.cyberpunk-hero-section {
  background: linear-gradient(135deg, var(--cyber-bg-dark) 0%, var(--cyber-bg) 100%);
  border-bottom: 2px solid var(--cyber-orange);
  padding: 4rem 0;
  position: relative;
  z-index: 2;
}

.cyberpunk-hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  color: var(--cyber-orange);
  text-shadow: 0 0 20px rgba(255, 140, 66, 0.5);
  margin-bottom: 1rem;
}

.cyberpunk-hero-subtitle {
  font-size: 1.3rem;
  color: var(--cyber-text-muted);
  margin-bottom: 0;
}

.cyberpunk-hero-icon {
  font-size: 5rem;
  color: var(--cyber-orange);
  opacity: 0.8;
  filter: drop-shadow(0 0 10px rgba(255, 140, 66, 0.3));
}

/* Content Section */
.cyberpunk-content-section {
  padding: 3rem 0;
  position: relative;
  z-index: 2;
}

/* Tutor Card */
.cyberpunk-tutor-card {
  background: rgba(26, 26, 26, 0.85);
  border: 1px solid var(--cyber-orange);
  border-radius: 12px;
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.cyberpunk-tutor-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(255, 140, 66, 0.2);
}

.cyberpunk-card-body {
  padding: 2rem;
}

.cyberpunk-tutor-avatar {
  position: relative;
}

.cyberpunk-avatar-img {
  width: 120px !important;
  height: 120px !important;
  border: 3px solid var(--cyber-orange);
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 0 20px rgba(255, 140, 66, 0.3);
}

.cyberpunk-tutor-name {
  color: var(--cyber-text);
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.cyberpunk-tutor-specialization {
  color: var(--cyber-text-muted);
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.cyberpunk-rating {
  margin-bottom: 1.5rem;
}

.cyberpunk-star {
  color: var(--cyber-orange);
  font-size: 1.2rem;
  margin-right: 0.2rem;
}

.cyberpunk-star-empty {
  color: var(--cyber-grey-light);
  font-size: 1.2rem;
  margin-right: 0.2rem;
}

.cyberpunk-rating-text {
  color: var(--cyber-text-muted);
  margin-left: 0.5rem;
}

.cyberpunk-button-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cyberpunk-btn {
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.cyberpunk-btn-primary {
  background: linear-gradient(45deg, var(--cyber-orange), #ff8c42);
  color: var(--cyber-bg-dark);
  box-shadow: 0 4px 15px rgba(255, 140, 66, 0.3);
}

.cyberpunk-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 140, 66, 0.4);
}

.cyberpunk-btn-outline {
  background: transparent;
  color: var(--cyber-orange);
  border: 2px solid var(--cyber-orange);
}

.cyberpunk-btn-outline:hover {
  background: var(--cyber-orange);
  color: var(--cyber-bg-dark);
  transform: translateY(-2px);
}

/* Detail Cards */
.cyberpunk-detail-card {
  background: rgba(26, 26, 26, 0.85);
  border: 1px solid var(--cyber-grey);
  border-radius: 12px;
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  margin-bottom: 1.5rem;
}

.cyberpunk-detail-card:hover {
  transform: translateY(-3px);
  border-color: var(--cyber-orange);
  box-shadow: 0 12px 40px rgba(255, 140, 66, 0.1);
}

.cyberpunk-card-header {
  background: rgba(255, 140, 66, 0.1);
  border-bottom: 1px solid var(--cyber-orange);
  padding: 1.5rem;
  border-radius: 12px 12px 0 0;
}

.cyberpunk-card-title {
  color: var(--cyber-orange);
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
}

.cyberpunk-card-body {
  padding: 1.5rem;
}

.cyberpunk-card-text {
  color: var(--cyber-text);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.cyberpunk-info-title {
  color: var(--cyber-orange);
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.cyberpunk-info-text {
  color: var(--cyber-text-muted);
  margin-bottom: 1rem;
}

.cyberpunk-section-title {
  color: var(--cyber-text);
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

/* Tags */
.cyberpunk-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.cyberpunk-tag {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cyberpunk-tag-primary {
  background: rgba(255, 140, 66, 0.2);
  color: var(--cyber-orange);
  border: 1px solid var(--cyber-orange);
}

.cyberpunk-tag-success {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
  border: 1px solid #2ecc71;
}

/* Pricing */
.cyberpunk-pricing-item {
  text-align: center;
  padding: 1.5rem;
  background: rgba(26, 26, 26, 0.5);
  border: 1px solid var(--cyber-grey);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.cyberpunk-pricing-item:hover {
  border-color: var(--cyber-orange);
  transform: translateY(-2px);
}

.cyberpunk-price {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.cyberpunk-price-primary {
  color: var(--cyber-orange);
}

.cyberpunk-price-success {
  color: #2ecc71;
}

.cyberpunk-price-info {
  color: #3498db;
}

.cyberpunk-price-label {
  color: var(--cyber-text-muted);
  font-size: 0.9rem;
}

/* Reviews */
.cyberpunk-review-item {
  background: rgba(26, 26, 26, 0.5);
  border: 1px solid var(--cyber-grey);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.cyberpunk-review-item:hover {
  border-color: var(--cyber-orange);
  transform: translateY(-2px);
}

.cyberpunk-review-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.cyberpunk-review-name {
  color: var(--cyber-text);
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.cyberpunk-review-rating {
  margin-bottom: 0.8rem;
}

.cyberpunk-star-filled {
  color: var(--cyber-orange);
}

.cyberpunk-star-empty {
  color: var(--cyber-grey);
}

.cyberpunk-review-comment {
  color: var(--cyber-text-muted);
  line-height: 1.5;
  margin-bottom: 0;
}

.cyberpunk-review-date {
  color: var(--cyber-text-muted);
  font-size: 0.9rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .cyberpunk-hero-title {
    font-size: 2.5rem;
  }
  
  .cyberpunk-hero-subtitle {
    font-size: 1.1rem;
  }
  
  .cyberpunk-hero-icon {
    font-size: 3rem;
  }
  
  .cyberpunk-tutor-name {
    font-size: 1.5rem;
  }
  
  .cyberpunk-avatar-img {
    width: 100px !important;
    height: 100px !important;
  }
}

/* Booking Modal Styles */
.cyberpunk-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.cyberpunk-modal {
  background: rgba(26, 26, 26, 0.95);
  border: 2px solid var(--cyber-orange);
  border-radius: 12px;
  box-shadow: 0 0 30px rgba(255, 165, 0, 0.3);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.cyberpunk-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--cyber-orange);
  background: rgba(255, 165, 0, 0.1);
}

.cyberpunk-modal-title {
  color: var(--cyber-orange);
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
  text-shadow: 0 0 10px rgba(255, 165, 0, 0.5);
}

.cyberpunk-modal-close {
  background: none;
  border: 1px solid var(--cyber-orange);
  color: var(--cyber-orange);
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cyberpunk-modal-close:hover {
  background: var(--cyber-orange);
  color: var(--cyber-dark);
  box-shadow: 0 0 15px rgba(255, 165, 0, 0.5);
}

.cyberpunk-modal-body {
  padding: 1.5rem;
}

.cyberpunk-booking-step {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

.cyberpunk-step-title {
  color: var(--cyber-orange);
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  text-align: center;
}

.cyberpunk-calendar {
  margin-bottom: 2rem;
}

.cyberpunk-calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.cyberpunk-calendar-nav {
  background: rgba(255, 165, 0, 0.1);
  border: 1px solid var(--cyber-orange);
  color: var(--cyber-orange);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cyberpunk-calendar-nav:hover {
  background: var(--cyber-orange);
  color: var(--cyber-dark);
  box-shadow: 0 0 15px rgba(255, 165, 0, 0.3);
}

.cyberpunk-calendar-month {
  color: var(--cyber-text);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.cyberpunk-calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.cyberpunk-calendar-day-header {
  text-align: center;
  padding: 0.5rem;
  color: var(--cyber-orange);
  font-weight: 600;
  font-size: 0.9rem;
}

.cyberpunk-calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 165, 0, 0.2);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--cyber-text-muted);
  font-weight: 500;
}

.cyberpunk-calendar-day:hover {
  background: rgba(255, 165, 0, 0.1);
  border-color: var(--cyber-orange);
  color: var(--cyber-orange);
}

.cyberpunk-calendar-day-available {
  color: var(--cyber-text);
  border-color: rgba(255, 165, 0, 0.3);
}

.cyberpunk-calendar-day-available:hover {
  background: rgba(255, 165, 0, 0.2);
  border-color: var(--cyber-orange);
  color: var(--cyber-orange);
  box-shadow: 0 0 10px rgba(255, 165, 0, 0.2);
}

.cyberpunk-calendar-day-selected {
  background: var(--cyber-orange);
  color: var(--cyber-dark);
  border-color: var(--cyber-orange);
  box-shadow: 0 0 15px rgba(255, 165, 0, 0.4);
  font-weight: 600;
}

.cyberpunk-calendar-day-other-month {
  opacity: 0.3;
  cursor: not-allowed;
}

.cyberpunk-selected-date {
  color: var(--cyber-orange);
  font-size: 1.1rem;
  font-weight: 500;
  text-align: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(255, 165, 0, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 165, 0, 0.3);
}

.cyberpunk-time-slots {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.cyberpunk-time-slot {
  padding: 0.75rem;
  text-align: center;
  border: 1px solid rgba(255, 165, 0, 0.3);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--cyber-text);
  font-weight: 500;
}

.cyberpunk-time-slot:hover {
  background: rgba(255, 165, 0, 0.1);
  border-color: var(--cyber-orange);
  color: var(--cyber-orange);
  box-shadow: 0 0 10px rgba(255, 165, 0, 0.2);
}

.cyberpunk-time-slot-selected {
  background: var(--cyber-orange);
  color: var(--cyber-dark);
  border-color: var(--cyber-orange);
  box-shadow: 0 0 15px rgba(255, 165, 0, 0.4);
  font-weight: 600;
}

.cyberpunk-booking-summary {
  background: rgba(255, 165, 0, 0.05);
  border: 1px solid rgba(255, 165, 0, 0.3);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.cyberpunk-booking-details h6 {
  color: var(--cyber-orange);
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.cyberpunk-booking-subject {
  color: var(--cyber-text-muted);
  margin-bottom: 1rem;
}

.cyberpunk-booking-datetime {
  color: var(--cyber-text);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
}

.cyberpunk-booking-price {
  color: var(--cyber-orange);
  font-weight: 600;
  font-size: 1.1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 165, 0, 0.3);
}

.cyberpunk-booking-actions {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.cyberpunk-booking-actions .cyberpunk-btn {
  flex: 1;
}

@media (max-width: 768px) {
  .cyberpunk-modal {
    margin: 0.5rem;
    max-height: 95vh;
  }

  .cyberpunk-time-slots {
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  }

  .cyberpunk-booking-actions {
    flex-direction: column;
  }
}
</style>
