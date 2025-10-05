<template>
  <div class="search-page min-vh-100 position-relative" style="background: #1a1a1a !important;">
    <!-- Animated World Globe Background -->
    <div class="globe-background">
      <svg class="world-globe" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet">
        <!-- Main Globe Circle -->
        <circle ref="globeCircle" class="globe-circle" cx="500" cy="500" r="400" fill="none" stroke="rgba(200,200,200,0.3)" stroke-width="2"/>
        
        <!-- Continental paths removed - keeping only clean lines -->
        
        <!-- Longitude Lines -->
        <path ref="longitude1" class="longitude" d="M500,100 Q520,300 500,500 Q480,700 500,900" stroke="rgba(200,200,200,0.2)" stroke-width="1" fill="none"/>
        <path ref="longitude2" class="longitude" d="M300,500 Q400,480 500,500 Q600,520 700,500" stroke="rgba(200,200,200,0.2)" stroke-width="1" fill="none"/>
        <path ref="longitude3" class="longitude" d="M200,300 Q350,400 500,500 Q650,600 800,700" stroke="rgba(200,200,200,0.2)" stroke-width="1" fill="none"/>
        
        <!-- Latitude Lines -->
        <path ref="latitude1" class="latitude" d="M200,300 Q500,300 800,300" stroke="rgba(200,200,200,0.2)" stroke-width="1" fill="none"/>
        <path ref="latitude2" class="latitude" d="M200,500 Q500,500 800,500" stroke="rgba(200,200,200,0.2)" stroke-width="1" fill="none"/>
        <path ref="latitude3" class="latitude" d="M200,700 Q500,700 800,700" stroke="rgba(200,200,200,0.2)" stroke-width="1" fill="none"/>
        
        <!-- Orbital Path for Animation -->
        <path ref="orbitPath" class="orbit-path" d="M100,500 Q500,100 900,500 Q500,900 100,500" stroke="rgba(200,200,200,0.1)" stroke-width="1" fill="none"/>
        
        <!-- Additional Motion Paths for Different Elements -->
        <path ref="motionPath1" class="motion-path" d="M200,200 Q400,300 600,200 Q800,100 1000,200" stroke="rgba(200,200,200,0.05)" stroke-width="1" fill="none"/>
        <path ref="motionPath2" class="motion-path" d="M100,400 Q300,500 500,400 Q700,300 900,400" stroke="rgba(200,200,200,0.05)" stroke-width="1" fill="none"/>
        <path ref="motionPath3" class="motion-path" d="M300,600 Q500,700 700,600 Q900,500 1100,600" stroke="rgba(200,200,200,0.05)" stroke-width="1" fill="none"/>
      </svg>
      
      <!-- No emojis - just pure globe and line animations -->
    </div>

    <div class="container py-5">
      <!-- Search Header -->
      <div class="row mb-5">
        <div class="col-12">
          <div 
            ref="searchCard"
            class="cyberpunk-search-card border-0 shadow-sm"
          >
            <div class="card-body p-4">
              <div class="text-center mb-4">
                <div 
                  ref="searchIcon"
                  class="cyberpunk-search-icon"
                >
                  <i class="fas fa-search"></i>
                </div>
                <h2 
                  ref="searchTitle"
                  class="cyberpunk-search-title"
                >
                Find Your Perfect Tutor
              </h2>
                <p 
                  ref="searchSubtitle"
                  class="cyberpunk-search-subtitle"
                >
                  Discover expert tutors tailored to your needs
                </p>
              </div>
              
              <!-- Search Form -->
              <form @submit.prevent="searchTutors" class="row g-3">
                <div class="col-md-4">
                  <label class="cyberpunk-label">Subject</label>
                  <div class="cyberpunk-input-group">
                    <div class="cyberpunk-input-icon">
                      <i class="fas fa-book"></i>
                    </div>
                    <select 
                      ref="subjectField"
                      v-model="filters.subject" 
                      class="cyberpunk-input"
                    >
                    <option value="">All Subjects</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="English">English</option>
                    <option value="Science">Science</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Additional Mathematics">Additional Mathematics</option>
                  </select>
                  </div>
                </div>
                
                <div class="col-md-4">
                  <label class="cyberpunk-label">Level</label>
                  <div class="cyberpunk-input-group">
                    <div class="cyberpunk-input-icon">
                      <i class="fas fa-graduation-cap"></i>
                    </div>
                    <select 
                      ref="levelField"
                      v-model="filters.level" 
                      class="cyberpunk-input"
                    >
                    <option value="">All Levels</option>
                    <option value="Primary">Primary</option>
                    <option value="Secondary">Secondary</option>
                    <option value="JC">JC</option>
                    <option value="IB">IB</option>
                    <option value="IGCSE">IGCSE</option>
                  </select>
                  </div>
                </div>
                
                <div class="col-md-4">
                  <label class="cyberpunk-label">Teaching Mode</label>
                  <div class="cyberpunk-input-group">
                    <div class="cyberpunk-input-icon">
                      <i class="fas fa-video"></i>
                    </div>
                    <select 
                      ref="teachingModeField"
                      v-model="filters.teachingMode" 
                      class="cyberpunk-input"
                    >
                    <option value="">Any Mode</option>
                    <option value="online">Online Only</option>
                    <option value="in-person">In-Person Only</option>
                    <option value="both">Both</option>
                  </select>
                  </div>
                </div>
                
                <div class="col-md-6">
                  <label class="cyberpunk-label">Location</label>
                  <div class="cyberpunk-input-group">
                    <div class="cyberpunk-input-icon">
                      <i class="fas fa-map-marker-alt"></i>
                    </div>
                  <input
                      ref="locationField"
                    type="text"
                    v-model="filters.location"
                      class="cyberpunk-input"
                    placeholder="Enter location or postal code"
                  />
                  </div>
                </div>
                
                <div class="col-md-3">
                  <label class="cyberpunk-label">Min Rate ($/hr)</label>
                  <div class="cyberpunk-input-group">
                    <div class="cyberpunk-input-icon">
                      <i class="fas fa-dollar-sign"></i>
                    </div>
                  <input
                      ref="minRateField"
                    type="number"
                    v-model="filters.minRate"
                      class="cyberpunk-input"
                    placeholder="0"
                  />
                  </div>
                </div>
                
                <div class="col-md-3">
                  <label class="cyberpunk-label">Max Rate ($/hr)</label>
                  <div class="cyberpunk-input-group">
                    <div class="cyberpunk-input-icon">
                      <i class="fas fa-dollar-sign"></i>
                    </div>
                  <input
                      ref="maxRateField"
                    type="number"
                    v-model="filters.maxRate"
                      class="cyberpunk-input"
                    placeholder="100"
                  />
                  </div>
                </div>
                
                <div class="col-12">
                  <button 
                    ref="searchButton"
                    type="submit" 
                    class="cyberpunk-search-btn" 
                    :disabled="isLoading"
                  >
                    <span v-if="isLoading" class="cyberpunk-spinner me-2"></span>
                    <i v-else class="fas fa-search me-2"></i>
                    {{ isLoading ? 'Searching...' : 'SEARCH TUTORS' }}
                  </button>
                  <button 
                    ref="clearButton"
                    type="button" 
                    @click="clearFilters" 
                    class="cyberpunk-clear-btn ms-2"
                  >
                    <i class="fas fa-times me-2"></i>
                    Clear Filters
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Results -->
      <div class="row">
        <!-- Filters Sidebar -->
        <div class="col-lg-3 mb-4">
          <div 
            ref="filtersCard"
            class="cyberpunk-filters-card border-0 shadow-sm"
          >
            <div class="cyberpunk-card-header">
              <h6 class="cyberpunk-filter-title mb-0">Refine Search</h6>
            </div>
            <div class="card-body">
              <!-- Rating Filter -->
              <div class="mb-4">
                <h6 class="cyberpunk-filter-label mb-3">Rating</h6>
                <div class="cyberpunk-checkbox-group" v-for="rating in [5, 4, 3, 2, 1]" :key="rating">
                  <div class="cyberpunk-checkbox">
                  <input
                      class="cyberpunk-checkbox-input"
                    type="checkbox"
                    :id="`rating-${rating}`"
                    :value="rating"
                    v-model="filters.ratings"
                  />
                    <label class="cyberpunk-checkbox-label d-flex align-items-center" :for="`rating-${rating}`">
                      <div class="cyberpunk-rating me-2">
                        <i v-for="i in 5" :key="i" :class="i <= rating ? 'fas fa-star cyberpunk-star' : 'far fa-star cyberpunk-star-empty'"></i>
                    </div>
                      <span class="cyberpunk-text-muted">({{ Math.floor(Math.random() * 50 + 10) }})</span>
                  </label>
                  </div>
                </div>
              </div>

              <!-- Experience Filter -->
              <div class="mb-4">
                <h6 class="cyberpunk-filter-label mb-3">Experience</h6>
                <div class="cyberpunk-checkbox-group">
                  <div class="cyberpunk-checkbox">
                    <input class="cyberpunk-checkbox-input" type="checkbox" id="exp-1" value="1-2" v-model="filters.experience" />
                    <label class="cyberpunk-checkbox-label" for="exp-1">1-2 years</label>
                </div>
                </div>
                <div class="cyberpunk-checkbox-group">
                  <div class="cyberpunk-checkbox">
                    <input class="cyberpunk-checkbox-input" type="checkbox" id="exp-2" value="3-5" v-model="filters.experience" />
                    <label class="cyberpunk-checkbox-label" for="exp-2">3-5 years</label>
                  </div>
                </div>
                <div class="cyberpunk-checkbox-group">
                  <div class="cyberpunk-checkbox">
                    <input class="cyberpunk-checkbox-input" type="checkbox" id="exp-3" value="5+" v-model="filters.experience" />
                    <label class="cyberpunk-checkbox-label" for="exp-3">5+ years</label>
                  </div>
                </div>
              </div>

              <!-- Availability Filter -->
              <div class="mb-4">
                <h6 class="cyberpunk-filter-label mb-3">Availability</h6>
                <div class="cyberpunk-checkbox-group">
                  <div class="cyberpunk-checkbox">
                    <input class="cyberpunk-checkbox-input" type="checkbox" id="avail-now" value="now" v-model="filters.availability" />
                    <label class="cyberpunk-checkbox-label" for="avail-now">Available Now</label>
                </div>
                </div>
                <div class="cyberpunk-checkbox-group">
                  <div class="cyberpunk-checkbox">
                    <input class="cyberpunk-checkbox-input" type="checkbox" id="avail-week" value="week" v-model="filters.availability" />
                    <label class="cyberpunk-checkbox-label" for="avail-week">This Week</label>
                  </div>
                </div>
                <div class="cyberpunk-checkbox-group">
                  <div class="cyberpunk-checkbox">
                    <input class="cyberpunk-checkbox-input" type="checkbox" id="avail-weekend" value="weekend" v-model="filters.availability" />
                    <label class="cyberpunk-checkbox-label" for="avail-weekend">Weekends</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Results -->
        <div class="col-lg-9">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="cyberpunk-results-title mb-0">
              {{ tutors.length }} tutors found
            </h5>
            <div class="d-flex align-items-center gap-3">
              <span class="cyberpunk-text-muted">Sort by:</span>
              <div class="cyberpunk-input-group" style="width: auto;">
                <select v-model="sortBy" class="cyberpunk-input" style="width: auto;">
                <option value="rating">Rating</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="experience">Experience</option>
                <option value="distance">Distance</option>
              </select>
              </div>
            </div>
          </div>

          <!-- Tutor Cards -->
          <div v-if="tutors.length === 0 && !isLoading" class="text-center py-5">
            <i class="fas fa-search cyberpunk-text-muted fs-1 mb-3"></i>
            <h5 class="cyberpunk-text-muted">No tutors found</h5>
            <p class="cyberpunk-text-muted">Try adjusting your search criteria</p>
          </div>

          <div v-else class="row g-4">
            <div
              v-for="(tutor, index) in tutors"
              :key="tutor.id"
              :ref="`tutorCard${index}`"
              class="col-lg-6"
            >
              <div class="cyberpunk-tutor-card border-0 shadow-sm h-100">
                <div class="card-body p-4">
                  <div class="d-flex align-items-start mb-3">
                    <div class="cyberpunk-tutor-avatar me-3">
                      <img 
                        :src="tutor.avatar" 
                        :alt="tutor.name"
                        class="cyberpunk-avatar-img"
                      >
                    </div>
                    <div class="flex-grow-1">
                      <h6 class="cyberpunk-tutor-name mb-1">{{ tutor.name }}</h6>
                      <p class="cyberpunk-text-muted mb-2">{{ tutor.subjects.join(', ') }}</p>
                      <div class="d-flex align-items-center mb-2">
                        <div class="cyberpunk-rating me-2">
                          <i v-for="i in 5" :key="i" :class="i <= tutor.rating ? 'fas fa-star cyberpunk-star' : 'far fa-star cyberpunk-star-empty'"></i>
                        </div>
                        <span class="cyberpunk-text-muted">({{ tutor.reviews }} reviews)</span>
                      </div>
                    </div>
                    <div class="text-end">
                      <h5 class="cyberpunk-tutor-rate mb-0">${{ tutor.hourlyRate }}/hr</h5>
                    </div>
                  </div>

                  <div class="mb-3">
                    <p class="cyberpunk-text-muted mb-2">{{ tutor.bio }}</p>
                    <div class="d-flex flex-wrap gap-1">
                      <span v-for="level in tutor.levels" :key="level" class="cyberpunk-badge">{{ level }}</span>
                    </div>
                  </div>

                  <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center cyberpunk-text-muted">
                      <i class="fas fa-map-marker-alt me-1"></i>
                      <small>{{ tutor.location }}</small>
                    </div>
                    <div class="d-flex gap-2">
                      <button class="cyberpunk-favorite-btn">
                        <i class="fas fa-heart"></i>
                      </button>
                      <router-link :to="`/tutor/${tutor.id}`" class="cyberpunk-view-btn">
                        View Profile
                      </router-link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Load More Button -->
          <div v-if="tutors.length > 0" class="text-center mt-5">
            <button 
              ref="loadMoreButton"
              class="cyberpunk-load-more-btn" 
              @click="loadMore"
            >
              <i class="fas fa-plus me-2"></i>
              Load More Tutors
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { createTimeline, animate, createAnimatable, utils, svg } from 'animejs'

export default {
  name: 'SearchTutors',
  setup() {
    // Template refs for animations
    const searchCard = ref(null)
    const searchIcon = ref(null)
    const searchTitle = ref(null)
    const searchSubtitle = ref(null)
    const subjectField = ref(null)
    const levelField = ref(null)
    const teachingModeField = ref(null)
    const locationField = ref(null)
    const minRateField = ref(null)
    const maxRateField = ref(null)
    const searchButton = ref(null)
    const clearButton = ref(null)
    const filtersCard = ref(null)
    const loadMoreButton = ref(null)
    
    // Globe SVG refs for animations
    const globeCircle = ref(null)
    const longitude1 = ref(null)
    const longitude2 = ref(null)
    const longitude3 = ref(null)
    const latitude1 = ref(null)
    const latitude2 = ref(null)
    const latitude3 = ref(null)
    const orbitPath = ref(null)
    const motionPath1 = ref(null)
    const motionPath2 = ref(null)
    const motionPath3 = ref(null)

    const filters = reactive({
      subject: '',
      level: '',
      teachingMode: '',
      location: '',
      minRate: '',
      maxRate: '',
      ratings: [],
      experience: [],
      availability: []
    })

    const sortBy = ref('rating')
    const tutors = ref([])
    const isLoading = ref(false)

    // Advanced Anime.js v4 Search Page Animations
    const initSearchAnimations = async () => {
      await nextTick()
      
      // Create main timeline with optimized settings (removed excessive callbacks)
      const searchTimeline = createTimeline({
        defaults: { 
          duration: 800,
          ease: 'out(3)',
          frameRate: 60
        },
        playbackRate: 1,
        onComplete: (self) => {
          if (searchCard.value) {
            searchCard.value.style.borderColor = 'var(--cyber-orange)'
          }
        }
      })

      // Initialize beautiful world globe animations
      initGlobeAnimations()

      // Search card entrance with 3D effects
      if (searchCard.value) {
        searchTimeline
          .label('card-entrance', 0)
          .add(searchCard.value, {
            opacity: [0, 1],
            y: [100, 0],
            scale: [0.8, 1],
            rotateX: [30, 0],
            rotateY: [15, 0],
            filter: ['blur(10px)', 'blur(0px)'],
            boxShadow: [
              '0 0 0 rgba(255, 140, 66, 0)',
              '0 0 50px rgba(255, 140, 66, 0.5)'
            ]
          }, 'card-entrance')
      }

      // Header elements with staggered 3D animations
      if (searchIcon.value) {
        searchTimeline
          .label('icon-animation', 200)
          .add(searchIcon.value, {
            scale: [0, 1.2, 1],
            opacity: [0, 1],
            filter: ['blur(5px)', 'blur(0px)']
          }, 'icon-animation')
      }

      if (searchTitle.value) {
        searchTimeline
          .add(searchTitle.value, {
            y: [50, 0],
            opacity: [0, 1],
            scale: [0.9, 1],
            rotateX: [20, 0],
            textShadow: [
              '0 0 0 rgba(255, 140, 66, 0)',
              '0 0 20px rgba(255, 140, 66, 0.8)'
            ]
          }, '+=200')
      }

      if (searchSubtitle.value) {
        searchTimeline
          .add(searchSubtitle.value, {
            y: [30, 0],
            opacity: [0, 1],
            scale: [0.95, 1],
            rotateY: [-15, 0],
            filter: ['blur(3px)', 'blur(0px)']
          }, '+=100')
      }

      // Form fields with staggered animations
      const formFields = [
        { ref: subjectField, delay: 400 },
        { ref: levelField, delay: 450 },
        { ref: teachingModeField, delay: 500 },
        { ref: locationField, delay: 550 },
        { ref: minRateField, delay: 600 },
        { ref: maxRateField, delay: 650 },
        { ref: searchButton, delay: 700 },
        { ref: clearButton, delay: 750 },
        { ref: filtersCard, delay: 800 }
      ]

      formFields.forEach(({ ref: fieldRef, delay }) => {
        if (fieldRef.value) {
          searchTimeline
            .add(fieldRef.value, {
              x: [-50, 0],
              y: [30, 0],
              opacity: [0, 1],
              scale: [0.9, 1],
              rotateY: [-10, 0],
              rotateX: [5, 0],
              filter: ['blur(3px)', 'blur(0px)'],
              boxShadow: [
                '0 0 0 rgba(255, 140, 66, 0)',
                '0 0 15px rgba(255, 140, 66, 0.3)'
              ]
            }, `+=${delay}`)
        }
      })

      // Advanced input focus animations
      const inputFields = [subjectField, levelField, teachingModeField, locationField, minRateField, maxRateField]
      
      inputFields.forEach(fieldRef => {
        if (fieldRef.value) {
          const focusTimeline = createTimeline({
            defaults: { duration: 200, ease: 'out(2)' }
          })
          
          fieldRef.value.addEventListener('focus', () => {
            focusTimeline
              .add(fieldRef.value, {
                scale: [1, 1.02],
                boxShadow: [
                  '0 0 0 rgba(255, 140, 66, 0)',
                  '0 0 20px rgba(255, 140, 66, 0.5)'
                ],
                borderColor: ['var(--cyber-orange)', 'var(--cyber-yellow)']
              }, 0)
          })
          
          fieldRef.value.addEventListener('blur', () => {
            focusTimeline
              .add(fieldRef.value, {
                scale: [1.02, 1],
                boxShadow: [
                  '0 0 20px rgba(255, 140, 66, 0.5)',
                  '0 0 0 rgba(255, 140, 66, 0)'
                ],
                borderColor: ['var(--cyber-yellow)', 'var(--cyber-orange)']
              }, 0)
          })
        }
      })

      // Advanced button hover/click animations
      if (searchButton.value) {
        const buttonHoverTimeline = createTimeline({
          defaults: { duration: 300, ease: 'out(2)' }
        })
        
        const buttonClickTimeline = createTimeline({
          defaults: { duration: 150, ease: 'out(3)' }
        })

        searchButton.value.addEventListener('mouseenter', () => {
          buttonHoverTimeline
            .add(searchButton.value, {
              scale: [1, 1.08],
              boxShadow: [
                '0 0 0 rgba(255, 140, 66, 0)',
                '0 0 35px rgba(255, 140, 66, 0.6)'
              ],
              rotateX: [0, -5]
            }, 0)
            .add(searchButton.value, {
              y: [0, -3]
            }, 0)
        })

        searchButton.value.addEventListener('mouseleave', () => {
          buttonHoverTimeline
            .add(searchButton.value, {
              scale: [1.08, 1],
              boxShadow: [
                '0 0 35px rgba(255, 140, 66, 0.6)',
                '0 0 0 rgba(255, 140, 66, 0)'
              ],
              rotateX: [-5, 0]
            }, 0)
            .add(searchButton.value, {
              y: [-3, 0]
            }, 0)
        })

        searchButton.value.addEventListener('mousedown', () => {
          buttonClickTimeline
            .add(searchButton.value, {
              scale: [1.08, 0.95],
              rotateX: [5, -5]
            }, 0)
        })

        searchButton.value.addEventListener('mouseup', () => {
          buttonClickTimeline
            .add(searchButton.value, {
              scale: [0.95, 1.08],
              rotateX: [-5, 5]
            }, 0)
        })
      }

      // Add continuous subtle animations for cyberpunk feel
      const continuousTimeline = createTimeline({
        loop: true,
        alternate: true,
        playbackRate: 0.3
      })

      if (searchCard.value) {
        continuousTimeline
          .add(searchCard.value, {
            boxShadow: [
              '0 0 30px rgba(255, 140, 66, 0.3)',
              '0 0 50px rgba(255, 140, 66, 0.5)'
            ]
          }, 0)
      }

      // Create Animatable instances for interactive effects
      if (searchIcon.value) {
        logoAnimatable = createAnimatable(searchIcon.value, {
          x: { duration: 300, ease: 'out(2)' },
          y: { duration: 300, ease: 'out(2)' },
          scale: { duration: 200, ease: 'out(3)' },
          rotate: { duration: 400, ease: 'out(2)' }
        })
      }

      if (searchCard.value) {
        cardAnimatable = createAnimatable(searchCard.value, {
          x: { duration: 200, ease: 'out(2)' },
          y: { duration: 200, ease: 'out(2)' },
          rotateX: { duration: 300, ease: 'out(2)' },
          rotateY: { duration: 300, ease: 'out(2)' },
          scale: { duration: 150, ease: 'out(3)' }
        })
      }

    }

    // Optimized World Globe Animations - removed duplicate animations to reduce lag
    const initGlobeAnimations = async () => {
      await nextTick()

      // Simple globe rotation (removed conflicting pulsing animation)
      if (globeCircle.value) {
        animate(globeCircle.value, {
          rotate: [0, 360],
          ease: 'linear',
          duration: 30000,
          loop: true
        })
      }

      // Drawable longitude and latitude lines (optimized durations)
      const longitudeLines = [longitude1.value, longitude2.value, longitude3.value].filter(Boolean)
      longitudeLines.forEach((line, index) => {
        const drawable = svg.createDrawable(line)[0]
        animate(drawable, {
          draw: ['0 0', '0 1', '1 1'],
          ease: 'inOutQuad',
          duration: 4000,
          delay: index * 600,
          loop: true
        })
      })

      const latitudeLines = [latitude1.value, latitude2.value, latitude3.value].filter(Boolean)
      latitudeLines.forEach((line, index) => {
        const drawable = svg.createDrawable(line)[0]
        animate(drawable, {
          draw: ['0 0', '0 1', '1 1'],
          ease: 'inOutQuad',
          duration: 5000,
          delay: index * 800,
          loop: true
        })
      })

      // Removed conflicting motion path animations for globe elements
      // Only animate the motion paths themselves (drawing effect)
      const motionPaths = [orbitPath.value, motionPath1.value, motionPath2.value, motionPath3.value].filter(Boolean)
      motionPaths.forEach((path, index) => {
        if (path) {
          const drawable = svg.createDrawable(path)[0]
          animate(drawable, {
            draw: '0 1',
            ease: 'linear',
            duration: 12000,
            loop: true,
            delay: index * 1500
          })
        }
      })
    }

    const searchTutors = async () => {
      isLoading.value = true

      // Advanced loading animation for button
      if (searchButton.value) {
        const loadingTimeline = createTimeline({
          loop: true,
          playbackRate: 1.5
        })

        loadingTimeline
          .add(searchButton.value, {
            scale: [1, 0.95, 1],
            rotateX: [0, 5, 0],
            boxShadow: [
              '0 0 20px rgba(255, 140, 66, 0.3)',
              '0 0 30px rgba(255, 140, 66, 0.5)',
              '0 0 20px rgba(255, 140, 66, 0.3)'
            ]
          }, 0)
          .add(searchButton.value, {
            y: [0, -2, 0]
          }, 0)
      }

      // Simulate API call with filtering
      setTimeout(() => {
        // All available tutors
        const allTutors = [
          {
            id: 1,
            name: 'Dr. Sarah Chen',
            subjects: ['Mathematics', 'Additional Mathematics'],
            levels: ['Secondary', 'JC'],
            rating: 5,
            reviews: 127,
            hourlyRate: 80,
            experience: '5+',
            bio: 'Experienced mathematics tutor with 8 years of experience. Specializes in O-Level and A-Level mathematics.',
            location: 'Orchard, Singapore',
            teachingMode: 'online',
            availability: ['now', 'week'],
            avatar: 'https://i.pravatar.cc/400?img=3'
          },
          {
            id: 2,
            name: 'Mr. David Lim',
            subjects: ['Physics', 'Chemistry'],
            levels: ['Secondary', 'JC'],
            rating: 5,
            reviews: 89,
            hourlyRate: 70,
            experience: '5+',
            bio: 'Former MOE teacher with 10 years of experience. Excellent track record with students.',
            location: 'Marina Bay, Singapore',
            teachingMode: 'in-person',
            availability: ['week', 'weekend'],
            avatar: 'https://i.pravatar.cc/400?img=5'
          },
          {
            id: 3,
            name: 'Ms. Emily Wong',
            subjects: ['English', 'Literature'],
            levels: ['Primary', 'Secondary'],
            rating: 5,
            reviews: 156,
            hourlyRate: 60,
            experience: '5+',
            bio: 'Passionate English tutor with a focus on creative writing and comprehension skills.',
            location: 'Tampines, Singapore',
            teachingMode: 'both',
            availability: ['now', 'weekend'],
            avatar: 'https://i.pravatar.cc/400?img=7'
          },
          {
            id: 4,
            name: 'Prof. Michael Tan',
            subjects: ['Biology', 'Chemistry'],
            levels: ['Secondary', 'JC', 'IB'],
            rating: 4,
            reviews: 203,
            hourlyRate: 95,
            experience: '5+',
            bio: 'University professor with expertise in life sciences. Published researcher and experienced tutor.',
            location: 'Bukit Timah, Singapore',
            teachingMode: 'online',
            availability: ['week'],
            avatar: 'https://i.pravatar.cc/400?img=8'
          },
          {
            id: 5,
            name: 'Ms. Rachel Goh',
            subjects: ['Mathematics', 'Science'],
            levels: ['Primary'],
            rating: 4,
            reviews: 78,
            hourlyRate: 45,
            experience: '3-5',
            bio: 'Patient and nurturing tutor specializing in primary school students. Focus on building strong foundations.',
            location: 'Jurong West, Singapore',
            teachingMode: 'in-person',
            availability: ['now', 'weekend'],
            avatar: 'https://i.pravatar.cc/400?img=9'
          },
          {
            id: 6,
            name: 'Mr. Jason Koh',
            subjects: ['English', 'Mathematics'],
            levels: ['Primary', 'Secondary'],
            rating: 3,
            reviews: 42,
            hourlyRate: 50,
            experience: '3-5',
            bio: 'Energetic and creative tutor who makes learning fun. Strong focus on exam techniques.',
            location: 'Bedok, Singapore',
            teachingMode: 'both',
            availability: ['now', 'week'],
            avatar: 'https://i.pravatar.cc/400?img=12'
          },
          {
            id: 7,
            name: 'Dr. Amanda Lee',
            subjects: ['Additional Mathematics', 'Physics'],
            levels: ['Secondary', 'JC', 'IGCSE'],
            rating: 2,
            reviews: 167,
            hourlyRate: 85,
            experience: '5+',
            bio: 'PhD holder with passion for teaching. Specializes in helping students overcome math anxiety.',
            location: 'Clementi, Singapore',
            teachingMode: 'online',
            availability: ['week', 'weekend'],
            avatar: 'https://i.pravatar.cc/400?img=10'
          },
          {
            id: 8,
            name: 'Mr. Benjamin Ng',
            subjects: ['Mathematics', 'Physics', 'Chemistry'],
            levels: ['JC', 'IB'],
            rating: 1,
            reviews: 94,
            hourlyRate: 75,
            experience: '3-5',
            bio: 'Former scholarship holder with strong academic background. Results-oriented teaching approach.',
            location: 'Yishun, Singapore',
            teachingMode: 'in-person',
            availability: ['now'],
            avatar: 'https://i.pravatar.cc/400?img=13'
          }
        ]

        // Apply filters
        let filtered = allTutors

        // Subject filter
        if (filters.subject) {
          filtered = filtered.filter(tutor =>
            tutor.subjects.includes(filters.subject)
          )
        }

        // Level filter
        if (filters.level) {
          filtered = filtered.filter(tutor =>
            tutor.levels.includes(filters.level)
          )
        }

        // Teaching mode filter
        if (filters.teachingMode) {
          filtered = filtered.filter(tutor =>
            tutor.teachingMode === filters.teachingMode || tutor.teachingMode === 'both'
          )
        }

        // Location filter (simple contains check)
        if (filters.location) {
          filtered = filtered.filter(tutor =>
            tutor.location.toLowerCase().includes(filters.location.toLowerCase())
          )
        }

        // Rate range filter
        if (filters.minRate) {
          filtered = filtered.filter(tutor =>
            tutor.hourlyRate >= parseInt(filters.minRate)
          )
        }
        if (filters.maxRate) {
          filtered = filtered.filter(tutor =>
            tutor.hourlyRate <= parseInt(filters.maxRate)
          )
        }

        // Rating filter
        if (filters.ratings.length > 0) {
          filtered = filtered.filter(tutor =>
            filters.ratings.includes(tutor.rating)
          )
        }

        // Experience filter
        if (filters.experience.length > 0) {
          filtered = filtered.filter(tutor =>
            filters.experience.includes(tutor.experience)
          )
        }

        // Availability filter
        if (filters.availability.length > 0) {
          filtered = filtered.filter(tutor =>
            filters.availability.some(avail => tutor.availability.includes(avail))
          )
        }

        // Apply sorting
        if (sortBy.value === 'rating') {
          filtered.sort((a, b) => b.rating - a.rating)
        } else if (sortBy.value === 'price-low') {
          filtered.sort((a, b) => a.hourlyRate - b.hourlyRate)
        } else if (sortBy.value === 'price-high') {
          filtered.sort((a, b) => b.hourlyRate - a.hourlyRate)
        } else if (sortBy.value === 'experience') {
          const expOrder = { '5+': 3, '3-5': 2, '1-2': 1 }
          filtered.sort((a, b) => expOrder[b.experience] - expOrder[a.experience])
        }

        tutors.value = filtered
        console.log(`Found ${filtered.length} tutors after filtering`)
        isLoading.value = false

        // Animate tutor cards entrance
        animateTutorCards()
      }, 1000)
    }

    // Animate tutor cards entrance
    const animateTutorCards = async () => {
      await nextTick()
      
      const tutorCards = document.querySelectorAll('.cyberpunk-tutor-card')
      tutorCards.forEach((card, index) => {
        const cardTimeline = createTimeline({
          defaults: { duration: 600, ease: 'out(3)' }
        })
        
        cardTimeline
          .add(card, {
            opacity: [0, 1],
            y: [50, 0],
            scale: [0.9, 1],
            rotateX: [15, 0],
            rotateY: [10, 0],
            filter: ['blur(5px)', 'blur(0px)'],
            boxShadow: [
              '0 0 0 rgba(255, 140, 66, 0)',
              '0 0 20px rgba(255, 140, 66, 0.3)'
            ]
          }, index * 200)
      })
    }

    const clearFilters = () => {
      Object.keys(filters).forEach(key => {
        if (Array.isArray(filters[key])) {
          filters[key] = []
        } else {
          filters[key] = ''
        }
      })
    }

    const loadMore = () => {
      // Add more tutors to the list
      tutors.value.push(...tutors.value.slice(0, 3))
      
      // Animate new tutor cards
      setTimeout(() => {
        animateTutorCards()
      }, 100)
    }

    // Dynamic speed control for animations
    let searchTimeline = null
    
    // Animatable instances for interactive animations
    let logoAnimatable = null
    let cardAnimatable = null
    
    const adjustAnimationSpeed = (speed) => {
      if (searchTimeline) {
        searchTimeline.speed = speed
      }
    }

    // Add keyboard controls for animation speed
    const handleKeyPress = (event) => {
      switch(event.key) {
        case '1':
          adjustAnimationSpeed(0.5) // Slow
          break
        case '2':
          adjustAnimationSpeed(1.0) // Normal
          break
        case '3':
          adjustAnimationSpeed(2.0) // Fast
          break
        case 'p':
          if (searchTimeline) {
            searchTimeline.paused ? searchTimeline.resume() : searchTimeline.pause()
          }
          break
      }
    }

    // Optimized Interactive mouse movement handlers with throttling
    let lastMouseMoveTime = 0
    const throttleDelay = 16 // ~60fps
    
    const handleMouseMove = (event) => {
      const now = Date.now()
      if (now - lastMouseMoveTime < throttleDelay) return
      lastMouseMoveTime = now
      
      const { clientX, clientY } = event
      const { innerWidth, innerHeight } = window
      
      // Calculate normalized mouse position (-1 to 1)
      const mouseX = (clientX / innerWidth) * 2 - 1
      const mouseY = (clientY / innerHeight) * 2 - 1
      
      // Logo interactive animation with circular boundary
      if (logoAnimatable && searchIcon.value) {
        const logoRect = searchIcon.value.getBoundingClientRect()
        const logoCenterX = logoRect.left + logoRect.width / 2
        const logoCenterY = logoRect.top + logoRect.height / 2
        
        const deltaX = clientX - logoCenterX
        const deltaY = clientY - logoCenterY
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        
        if (distance > 0) {
          const maxMovement = 8
          const movementRatio = Math.min(distance / 200, 1)
          const constrainedMovement = movementRatio * maxMovement
          
          const angle = Math.atan2(deltaY, deltaX)
          const constrainedX = Math.cos(angle) * constrainedMovement
          const constrainedY = Math.sin(angle) * constrainedMovement
          
          const scale = 1 + (movementRatio * 0.1)
          const rotate = constrainedX * 0.5
          
          logoAnimatable.x(constrainedX).y(constrainedY).scale(scale).rotate(rotate)
        }
      }
      
      // Card interactive animation (simplified - removed scale)
      if (cardAnimatable) {
        const cardX = mouseX * 5
        const cardY = mouseY * 3
        const cardRotateX = mouseY * 2
        const cardRotateY = mouseX * 3
        
        cardAnimatable.x(cardX).y(cardY).rotateX(cardRotateX).rotateY(cardRotateY)
      }
      
      // Globe interactive animation (simplified)
      if (globeCircle.value) {
        const globeRotateY = mouseX * 3
        
        globeCircle.value.style.transform = `rotateY(${globeRotateY}deg)`
      }
    }

    // Mouse leave handler to reset animations
    const handleMouseLeave = () => {
      if (logoAnimatable) {
        logoAnimatable.x(0).y(0).scale(1).rotate(0)
      }
      if (cardAnimatable) {
        cardAnimatable.x(0).y(0).rotateX(0).rotateY(0)
      }
      if (globeCircle.value) {
        globeCircle.value.style.transform = 'rotateY(0deg)'
      }
    }

    // Watch filters and sortBy to trigger automatic search
    let searchTimeout = null
    watch([filters, sortBy], () => {
      // Debounce search to avoid too many calls
      if (searchTimeout) clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        console.log('Filters changed, searching...', filters)
        searchTutors()
      }, 300)
    }, { deep: true })

    onMounted(() => {
      initSearchAnimations()

      // Add keyboard event listener for speed control
      document.addEventListener('keydown', handleKeyPress)

      // Add mouse event listeners for interactive animations
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseleave', handleMouseLeave)

      searchTutors()
    })

    return {
      // Template refs
      searchCard,
      searchIcon,
      searchTitle,
      searchSubtitle,
      subjectField,
      levelField,
      teachingModeField,
      locationField,
      minRateField,
      maxRateField,
      searchButton,
      clearButton,
      filtersCard,
      loadMoreButton,
      // Globe SVG refs
      globeCircle,
      longitude1,
      longitude2,
      longitude3,
      latitude1,
      latitude2,
      latitude3,
      orbitPath,
      motionPath1,
      motionPath2,
      motionPath3,
      // Form data
      filters,
      sortBy,
      tutors,
      isLoading,
      searchTutors,
      clearFilters,
      loadMore
    }
  }
}
</script>

<style scoped>
/* Search Page Cyberpunk Styling */
.search-page {
  background: #1a1a1a !important;
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  color-scheme: dark;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Force dark background on all elements */
.search-page * {
  background: transparent !important;
}

/* Override any white backgrounds */
.search-page .container,
.search-page .row,
.search-page .col-lg-3,
.search-page .col-lg-9 {
  background: transparent !important;
}

/* Ensure body and html are dark */
:global(.search-page),
:global(.search-page *),
:global(body),
:global(html) {
  background: #1a1a1a !important;
  color-scheme: dark !important;
  filter: none !important;
  -webkit-filter: none !important;
}

/* Override any potential white backgrounds from global styles */
:global(.container),
:global(.row),
:global([class*="col-"]) {
  background: transparent !important;
}

/* Translucent scrollbar styling */
:global(::-webkit-scrollbar) {
  width: 12px;
  height: 12px;
}

:global(::-webkit-scrollbar-track) {
  background: rgba(26, 26, 26, 0.3);
  border-radius: 6px;
}

:global(::-webkit-scrollbar-thumb) {
  background: rgba(255, 140, 66, 0.6);
  border-radius: 6px;
  border: 2px solid rgba(26, 26, 26, 0.3);
  transition: all 0.3s ease;
}

:global(::-webkit-scrollbar-thumb:hover) {
  background: rgba(255, 140, 66, 0.8);
  box-shadow: 0 0 10px rgba(255, 140, 66, 0.5);
}

:global(::-webkit-scrollbar-corner) {
  background: rgba(26, 26, 26, 0.3);
}

/* Firefox scrollbar styling */
:global(html) {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 140, 66, 0.6) rgba(26, 26, 26, 0.3);
}

/* Beautiful World Globe Background */
.globe-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.world-globe {
  width: 100%;
  height: 100%;
  opacity: 0.4;
  filter: drop-shadow(0 0 20px rgba(200, 200, 200, 0.1));
}

/* Globe Element Styling */
.globe-circle {
  filter: drop-shadow(0 0 10px rgba(200, 200, 200, 0.3));
  transition: all 0.3s ease;
}

.continent {
  filter: drop-shadow(0 0 5px rgba(200, 200, 200, 0.2));
  transition: all 0.5s ease;
}

.longitude,
.latitude {
  filter: drop-shadow(0 0 3px rgba(200, 200, 200, 0.2));
  stroke-linecap: round;
  stroke-linejoin: round;
}

.orbit-path {
  opacity: 0.1;
  stroke-dasharray: 5,5;
  animation: dash 20s linear infinite;
}

.motion-path {
  opacity: 0.05;
  stroke-dasharray: 3,3;
  animation: dash 15s linear infinite reverse;
}

@keyframes dash {
  to {
    stroke-dashoffset: -100;
  }
}

/* Cyberpunk Search Card */
.cyberpunk-search-card {
  background: rgba(26, 26, 26, 0.98);
  border: 2px solid var(--cyber-orange);
  border-radius: 20px;
  box-shadow: 
    0 0 30px rgba(255, 140, 66, 0.3),
    0 0 60px rgba(255, 140, 66, 0.1),
    inset 0 0 20px rgba(255, 140, 66, 0.1);
  position: relative;
  z-index: 10;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.cyberpunk-search-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent, rgba(255, 140, 66, 0.05), transparent);
  pointer-events: none;
}

/* Cyberpunk Search Icon */
.cyberpunk-search-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(45deg, var(--cyber-orange), var(--cyber-yellow));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  box-shadow: 0 0 20px rgba(255, 140, 66, 0.5);
  border: 3px solid var(--cyber-orange);
  font-size: 2rem;
  color: white;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

/* Cyberpunk Text Elements */
.cyberpunk-search-title {
  color: var(--cyber-text);
  font-weight: 700;
  font-size: 2.5rem;
  text-shadow: 0 0 20px rgba(255, 140, 66, 0.5);
  letter-spacing: 2px;
  margin-bottom: 1rem;
}

.cyberpunk-search-subtitle {
  color: var(--cyber-text);
  font-size: 1.1rem;
  font-weight: 500;
  text-shadow: 0 0 15px rgba(255, 140, 66, 0.5);
  letter-spacing: 1px;
}

.cyberpunk-label {
  color: var(--cyber-text);
  font-weight: 600;
  text-shadow: 0 0 5px rgba(255, 140, 66, 0.3);
  letter-spacing: 1px;
  margin-bottom: 0.5rem;
}

.cyberpunk-text-muted {
  color: var(--cyber-text-muted);
  font-size: 0.95rem;
}

/* Cyberpunk Input Groups */
.cyberpunk-input-group {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(42, 42, 42, 0.8);
  border: 2px solid var(--cyber-grey-light);
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.cyberpunk-input-group:focus-within {
  border-color: var(--cyber-orange);
  box-shadow: 0 0 15px rgba(255, 140, 66, 0.3);
}

.cyberpunk-input-icon {
  padding: 0.75rem 1rem;
  color: var(--cyber-orange);
  background: rgba(255, 140, 66, 0.1);
  border-right: 1px solid var(--cyber-grey-light);
  font-size: 1.1rem;
}

.cyberpunk-input {
  flex: 1;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  color: var(--cyber-text);
  font-size: 1rem;
  outline: none;
}

.cyberpunk-input::placeholder {
  color: var(--cyber-text-dim);
}

/* Cyberpunk Buttons */
.cyberpunk-search-btn {
  background: linear-gradient(45deg, var(--cyber-orange), var(--cyber-yellow));
  border: 2px solid var(--cyber-orange);
  color: white;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 0 20px rgba(255, 140, 66, 0.3);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  padding: 0.75rem 2rem;
  border-radius: 10px;
}

.cyberpunk-search-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.cyberpunk-search-btn:hover::before {
  left: 100%;
}

.cyberpunk-search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(255, 140, 66, 0.5);
}

.cyberpunk-clear-btn {
  background: transparent;
  border: 2px solid var(--cyber-grey-light);
  color: var(--cyber-text);
  font-weight: 600;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  padding: 0.75rem 2rem;
  border-radius: 10px;
}

.cyberpunk-clear-btn:hover {
  border-color: var(--cyber-orange);
  color: var(--cyber-orange);
  box-shadow: 0 0 15px rgba(255, 140, 66, 0.3);
}

.cyberpunk-load-more-btn {
  background: linear-gradient(45deg, var(--cyber-orange), var(--cyber-yellow));
  border: 2px solid var(--cyber-orange);
  color: white;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 0 20px rgba(255, 140, 66, 0.3);
  transition: all 0.3s ease;
  padding: 0.75rem 2rem;
  border-radius: 10px;
}

.cyberpunk-load-more-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(255, 140, 66, 0.5);
}

/* Cyberpunk Filters Card */
.cyberpunk-filters-card {
  background: rgba(26, 26, 26, 0.85);
  border: 2px solid var(--cyber-orange);
  border-radius: 15px;
  box-shadow: 
    0 0 20px rgba(255, 140, 66, 0.2),
    0 0 40px rgba(255, 140, 66, 0.1),
    inset 0 0 20px rgba(255, 140, 66, 0.05);
  overflow: hidden;
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 10;
}

.cyberpunk-card-header {
  background: rgba(255, 140, 66, 0.1);
  border-bottom: 1px solid var(--cyber-orange);
  padding: 1rem;
}

.cyberpunk-filter-title {
  color: var(--cyber-text);
  font-weight: 700;
  text-shadow: 0 0 10px rgba(255, 140, 66, 0.5);
  letter-spacing: 1px;
}

.cyberpunk-filter-label {
  color: var(--cyber-text);
  font-weight: 600;
  text-shadow: 0 0 5px rgba(255, 140, 66, 0.3);
  letter-spacing: 1px;
}

/* Cyberpunk Checkbox */
.cyberpunk-checkbox-group {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.cyberpunk-checkbox {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cyberpunk-checkbox-input {
  width: 20px;
  height: 20px;
  background: rgba(42, 42, 42, 0.8);
  border: 2px solid var(--cyber-grey-light);
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  appearance: none;
  transition: all 0.3s ease;
}

.cyberpunk-checkbox-input:checked {
  background: var(--cyber-orange);
  border-color: var(--cyber-orange);
  box-shadow: 0 0 10px rgba(255, 140, 66, 0.5);
}

.cyberpunk-checkbox-input:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
  font-size: 12px;
}

.cyberpunk-checkbox-label {
  color: var(--cyber-text);
  font-size: 0.9rem;
  line-height: 1.4;
  cursor: pointer;
}

/* Cyberpunk Rating */
.cyberpunk-rating .cyberpunk-star {
  color: var(--cyber-yellow);
  font-size: 0.9rem;
  text-shadow: 0 0 5px rgba(255, 210, 63, 0.5);
}

.cyberpunk-rating .cyberpunk-star-empty {
  color: var(--cyber-grey-light);
}

/* Cyberpunk Tutor Cards */
.cyberpunk-tutor-card {
  background: rgba(26, 26, 26, 0.85);
  border: 2px solid var(--cyber-grey-light);
  border-radius: 15px;
  box-shadow: 
    0 0 15px rgba(255, 140, 66, 0.1),
    0 0 30px rgba(255, 140, 66, 0.05),
    inset 0 0 15px rgba(255, 140, 66, 0.03);
  transition: all 0.3s ease;
  overflow: hidden;
  backdrop-filter: blur(8px);
  position: relative;
  z-index: 10;
}

.cyberpunk-tutor-card:hover {
  transform: translateY(-5px);
  border-color: var(--cyber-orange);
  box-shadow: 0 0 25px rgba(255, 140, 66, 0.3);
}

.cyberpunk-tutor-avatar {
  width: 60px !important;
  height: 60px !important;
  min-width: 60px !important;
  min-height: 60px !important;
  max-width: 60px !important;
  max-height: 60px !important;
  border: 2px solid var(--cyber-orange);
  border-radius: 50%;
  transition: transform 0.3s ease;
  flex-shrink: 0;
  overflow: hidden;
}

.cyberpunk-avatar-img {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
  aspect-ratio: 1 / 1;
}

.cyberpunk-tutor-card:hover .cyberpunk-tutor-avatar {
  transform: scale(1.1);
  box-shadow: 0 0 15px rgba(255, 140, 66, 0.3);
}

.cyberpunk-tutor-name {
  color: var(--cyber-text);
  font-weight: 700;
  text-shadow: 0 0 5px rgba(255, 140, 66, 0.3);
}

.cyberpunk-tutor-rate {
  color: var(--cyber-orange);
  font-weight: 700;
  text-shadow: 0 0 10px rgba(255, 140, 66, 0.5);
}

.cyberpunk-badge {
  background: rgba(255, 140, 66, 0.1);
  color: var(--cyber-orange);
  border: 1px solid var(--cyber-orange);
  padding: 0.25rem 0.5rem;
  border-radius: 5px;
  font-size: 0.8rem;
  font-weight: 600;
}

.cyberpunk-favorite-btn {
  background: transparent;
  border: 2px solid var(--cyber-grey-light);
  color: var(--cyber-text);
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.cyberpunk-favorite-btn:hover {
  border-color: var(--cyber-orange);
  color: var(--cyber-orange);
  box-shadow: 0 0 10px rgba(255, 140, 66, 0.3);
}

.cyberpunk-view-btn {
  background: linear-gradient(45deg, var(--cyber-orange), var(--cyber-yellow));
  border: 2px solid var(--cyber-orange);
  color: white;
  font-weight: 600;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: inline-block;
}

.cyberpunk-view-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 15px rgba(255, 140, 66, 0.5);
  color: white;
}

.cyberpunk-results-title {
  color: var(--cyber-text);
  font-weight: 700;
  text-shadow: 0 0 10px rgba(255, 140, 66, 0.5);
}

/* Cyberpunk Spinner */
.cyberpunk-spinner {
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
  .cyberpunk-search-card {
    margin: 1rem;
    border-radius: 15px;
  }
  
  .cyberpunk-search-title {
    font-size: 2rem;
  }
  
  .cyberpunk-search-icon {
    width: 60px;
    height: 60px;
    font-size: 1.5rem;
  }
  
  /* Removed unused floating-icon styles */
  
  .cyberpunk-tutor-card .card-body {
    padding: 1.5rem !important;
  }
  
  /* Avatar dimensions are now consistent across all screen sizes */
}
</style>
