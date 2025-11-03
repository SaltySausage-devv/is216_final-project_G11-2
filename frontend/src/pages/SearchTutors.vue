<template>
  <div
    class="search-page min-vh-100 position-relative"
    style="background: #1a1a1a !important"
  >
    <!-- Animated World Globe Background -->
    <div class="globe-background">
      <svg
        class="world-globe"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- Main Globe Circle -->
        <circle
          ref="globeCircle"
          class="globe-circle"
          cx="500"
          cy="500"
          r="400"
          fill="none"
          stroke="rgba(200,200,200,0.3)"
          stroke-width="2"
        />

        <!-- Continental paths removed - keeping only clean lines -->

        <!-- Longitude Lines -->
        <path
          ref="longitude1"
          class="longitude"
          d="M500,100 Q520,300 500,500 Q480,700 500,900"
          stroke="rgba(200,200,200,0.2)"
          stroke-width="1"
          fill="none"
        />
        <path
          ref="longitude2"
          class="longitude"
          d="M300,500 Q400,480 500,500 Q600,520 700,500"
          stroke="rgba(200,200,200,0.2)"
          stroke-width="1"
          fill="none"
        />
        <path
          ref="longitude3"
          class="longitude"
          d="M200,300 Q350,400 500,500 Q650,600 800,700"
          stroke="rgba(200,200,200,0.2)"
          stroke-width="1"
          fill="none"
        />

        <!-- Latitude Lines -->
        <path
          ref="latitude1"
          class="latitude"
          d="M200,300 Q500,300 800,300"
          stroke="rgba(200,200,200,0.2)"
          stroke-width="1"
          fill="none"
        />
        <path
          ref="latitude2"
          class="latitude"
          d="M200,500 Q500,500 800,500"
          stroke="rgba(200,200,200,0.2)"
          stroke-width="1"
          fill="none"
        />
        <path
          ref="latitude3"
          class="latitude"
          d="M200,700 Q500,700 800,700"
          stroke="rgba(200,200,200,0.2)"
          stroke-width="1"
          fill="none"
        />

        <!-- Orbital Path for Animation -->
        <path
          ref="orbitPath"
          class="orbit-path"
          d="M100,500 Q500,100 900,500 Q500,900 100,500"
          stroke="rgba(200,200,200,0.1)"
          stroke-width="1"
          fill="none"
        />

        <!-- Additional Motion Paths for Different Elements -->
        <path
          ref="motionPath1"
          class="motion-path"
          d="M200,200 Q400,300 600,200 Q800,100 1000,200"
          stroke="rgba(200,200,200,0.05)"
          stroke-width="1"
          fill="none"
        />
        <path
          ref="motionPath2"
          class="motion-path"
          d="M100,400 Q300,500 500,400 Q700,300 900,400"
          stroke="rgba(200,200,200,0.05)"
          stroke-width="1"
          fill="none"
        />
        <path
          ref="motionPath3"
          class="motion-path"
          d="M300,600 Q500,700 700,600 Q900,500 1100,600"
          stroke="rgba(200,200,200,0.05)"
          stroke-width="1"
          fill="none"
        />
      </svg>

      <!-- No emojis - just pure globe and line animations -->
    </div>

    <div class="container pt-4 pt-lg-5 pb-3 pb-lg-4">
      <!-- Search Header -->
      <div class="row mb-5">
        <div class="col-12">
          <div
            ref="searchCard"
            class="cyberpunk-search-card border-0 shadow-sm"
          >
            <div class="card-body p-4">
              <div class="text-center mb-4">
                <div ref="searchIcon" class="cyberpunk-search-icon">
                  <i class="fas fa-search"></i>
                </div>
                <h2 ref="searchTitle" class="cyberpunk-search-title">
                  Find Your Perfect Tutor
                </h2>
                <p ref="searchSubtitle" class="cyberpunk-search-subtitle">
                  Discover expert tutors tailored to your needs
                </p>
              </div>

              <!-- Search Form -->
              <form @submit.prevent="searchTutors" class="row g-3">
                <!-- Name Search - Full width for prominence -->
                <div class="col-12">
                  <label class="cyberpunk-label">
                    <i class="fas fa-user me-2"></i>Search by Name
                  </label>
                  <div class="cyberpunk-input-group">
                    <div class="cyberpunk-input-icon">
                      <i class="fas fa-user-circle"></i>
                    </div>
                    <input
                      ref="nameField"
                      type="text"
                      v-model="filters.name"
                      class="cyberpunk-input"
                      placeholder="Enter tutor's name to search..."
                      @input="applyClientSideFilters"
                    />
                    <button
                      v-if="filters.name"
                      type="button"
                      class="cyberpunk-clear-name-btn"
                      @click="filters.name = ''; applyClientSideFilters()"
                      title="Clear name search"
                    >
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>

                <div class="col-md-6">
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
                      <option value="Additional Mathematics">
                        Additional Mathematics
                      </option>
                    </select>
                  </div>
                </div>

                <div class="col-md-6">
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

                <div class="col-md-6">
                  <label class="cyberpunk-label">Location</label>
                  <div class="cyberpunk-input-group">
                    <div class="cyberpunk-input-icon">
                      <i class="fas fa-map-marker-alt"></i>
                    </div>
                    <select
                      ref="locationField"
                      v-model="filters.location"
                      class="cyberpunk-input"
                    >
                      <option value="">All Locations</option>
                      <option
                        v-for="area in singaporeAreas"
                        :key="area"
                        :value="area"
                      >
                        {{ area }}
                      </option>
                    </select>
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
                  <div class="search-buttons-container">
                    <button
                      ref="searchButton"
                      type="submit"
                      class="cyberpunk-search-btn"
                      :disabled="isLoading"
                    >
                      <span
                        v-if="isLoading"
                        class="cyberpunk-spinner me-2"
                      ></span>
                      <i v-else class="fas fa-search me-2"></i>
                      {{ isLoading ? "Searching..." : "SEARCH TUTORS" }}
                    </button>
                    <button
                      ref="clearButton"
                      type="button"
                      @click="clearFilters"
                      class="cyberpunk-clear-btn"
                    >
                      <i class="fas fa-times me-2"></i>
                      Clear Filters
                    </button>
                  </div>
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
              <div class="filters-grid">
                <!-- Rating Filter -->
                <div class="filter-section">
                  <h6 class="cyberpunk-filter-label mb-3">Rating</h6>
                  <div
                    class="cyberpunk-checkbox-group"
                    v-for="rating in [5, 4, 3, 2, 1]"
                    :key="rating"
                  >
                    <div class="cyberpunk-checkbox">
                      <input
                        class="cyberpunk-checkbox-input"
                        type="checkbox"
                        :id="`rating-${rating}`"
                        :value="rating"
                        v-model="filters.ratings"
                      />
                      <label
                        class="cyberpunk-checkbox-label d-flex align-items-center"
                        :for="`rating-${rating}`"
                      >
                        <div class="cyberpunk-rating me-2">
                          <i
                            v-for="i in 5"
                            :key="i"
                            :class="
                              i <= rating
                                ? 'fas fa-star cyberpunk-star'
                                : 'far fa-star cyberpunk-star-empty'
                            "
                          ></i>
                        </div>
                        <span class="cyberpunk-text-muted"
                          >({{ getRatingCount(rating) }})</span
                        >
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Experience Filter -->
                <div class="filter-section">
                  <h6 class="cyberpunk-filter-label mb-3">Experience</h6>
                  <div class="cyberpunk-checkbox-group">
                    <div class="cyberpunk-checkbox">
                      <input
                        class="cyberpunk-checkbox-input"
                        type="checkbox"
                        id="exp-1"
                        value="1-2"
                        v-model="filters.experience"
                      />
                      <label class="cyberpunk-checkbox-label" for="exp-1"
                        >1-2 years</label
                      >
                    </div>
                  </div>
                  <div class="cyberpunk-checkbox-group">
                    <div class="cyberpunk-checkbox">
                      <input
                        class="cyberpunk-checkbox-input"
                        type="checkbox"
                        id="exp-2"
                        value="3-5"
                        v-model="filters.experience"
                      />
                      <label class="cyberpunk-checkbox-label" for="exp-2"
                        >3-5 years</label
                      >
                    </div>
                  </div>
                  <div class="cyberpunk-checkbox-group">
                    <div class="cyberpunk-checkbox">
                      <input
                        class="cyberpunk-checkbox-input"
                        type="checkbox"
                        id="exp-3"
                        value="5+"
                        v-model="filters.experience"
                      />
                      <label class="cyberpunk-checkbox-label" for="exp-3"
                        >5+ years</label
                      >
                    </div>
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
              {{ totalFilteredTutors }} tutors found
            </h5>
            <div class="d-flex align-items-center gap-3">
              <span class="cyberpunk-text-muted">Sort by:</span>
              <div class="cyberpunk-input-group" style="width: auto">
                <select
                  v-model="sortBy"
                  class="cyberpunk-input"
                  style="width: auto"
                >
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
          <div
            v-if="tutors.length === 0 && !isLoading"
            class="text-center py-5"
          >
            <i class="fas fa-search cyberpunk-text-muted fs-1 mb-3"></i>
            <h5 class="cyberpunk-text-muted">No tutors found</h5>
            <p class="cyberpunk-text-muted">
              Try adjusting your search criteria
            </p>
          </div>

          <div v-else class="row g-4">
            <div
              v-for="(tutor, index) in tutors"
              :key="tutor.id"
              :ref="`tutorCard${index}`"
              class="col-lg-6"
            >
              <div class="cyberpunk-tutor-card h-100">
                <div class="card-body p-4">
                  <div class="d-flex align-items-start mb-3">
                    <div class="cyberpunk-tutor-avatar me-3">
                      <div class="avatar-placeholder">
                        <i class="fas fa-user"></i>
                      </div>
                    </div>
                    <div class="flex-grow-1">
                      <h6 class="cyberpunk-tutor-name mb-1">
                        {{ tutor.name }}
                      </h6>
                      <p class="cyberpunk-text-muted mb-2">
                        {{ tutor.subjects.join(", ") }}
                      </p>
                      <div class="d-flex align-items-center mb-2">
                        <div class="cyberpunk-rating me-2">
                          <i
                            v-for="i in 5"
                            :key="i"
                            :class="
                              i <= tutor.rating
                                ? 'fas fa-star cyberpunk-star'
                                : 'far fa-star cyberpunk-star-empty'
                            "
                          ></i>
                        </div>
                        <span class="cyberpunk-text-muted"
                          >({{ tutor.reviews }} reviews)</span
                        >
                      </div>
                    </div>
                    <div class="text-end">
                      <h5 class="cyberpunk-tutor-rate mb-0">
                        ${{ tutor.hourlyRate }}/hr
                      </h5>
                    </div>
                  </div>

                  <div class="mb-3 flex-grow-1">
                    <p class="cyberpunk-text-muted mb-2">{{ tutor.bio }}</p>
                    <div class="d-flex flex-wrap gap-1">
                      <span
                        v-for="level in tutor.levels"
                        :key="level"
                        class="cyberpunk-badge"
                        >{{ level }}</span
                      >
                    </div>
                  </div>

                  <div
                    class="d-flex align-items-center justify-content-between mt-auto"
                  >
                    <div class="d-flex align-items-center cyberpunk-text-muted">
                      <i class="fas fa-map-marker-alt me-1"></i>
                      <small>{{ tutor.location }}</small>
                    </div>
                    <div class="d-flex gap-2">
                      <button class="cyberpunk-favorite-btn">
                        <i class="fas fa-heart"></i>
                      </button>
                      <router-link
                        :to="`/tutor/${tutor.id}`"
                        class="cyberpunk-view-btn"
                      >
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
              v-if="hasMoreTutors"
              ref="loadMoreButton"
              class="cyberpunk-load-more-btn"
              @click="loadMore"
            >
              <i class="fas fa-plus me-2"></i>
              Load More Tutors
            </button>
            <div v-else class="cyberpunk-end-message">
              <i class="fas fa-check-circle me-2"></i>
              You've reached the end of the results
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick, watch, computed } from "vue";
import { createTimeline, animate, createAnimatable, utils, svg } from "animejs";

export default {
  name: "SearchTutors",
  setup() {
    // Template refs for animations
    const searchCard = ref(null);
    const searchIcon = ref(null);
    const searchTitle = ref(null);
    const searchSubtitle = ref(null);
    const nameField = ref(null);
    const subjectField = ref(null);
    const levelField = ref(null);
    const locationField = ref(null);
    const minRateField = ref(null);
    const maxRateField = ref(null);
    const searchButton = ref(null);
    const clearButton = ref(null);
    const filtersCard = ref(null);
    const loadMoreButton = ref(null);

    // Globe SVG refs for animations
    const globeCircle = ref(null);
    const longitude1 = ref(null);
    const longitude2 = ref(null);
    const longitude3 = ref(null);
    const latitude1 = ref(null);
    const latitude2 = ref(null);
    const latitude3 = ref(null);
    const orbitPath = ref(null);
    const motionPath1 = ref(null);
    const motionPath2 = ref(null);
    const motionPath3 = ref(null);

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
    ];

    const filters = reactive({
      name: "",
      subject: "",
      level: "",
      location: "",
      minRate: "",
      maxRate: "",
      ratings: [],
      experience: [],
      availability: [],
    });

    const sortBy = ref("rating");
    const tutors = ref([]);
    const allTutors = ref([]);
    const isLoading = ref(false);
    const currentPage = ref(1);
    const tutorsPerPage = 8;
    const totalFilteredTutors = ref(0);

    // Computed property to check if there are more tutors to load
    const hasMoreTutors = computed(() => {
      return tutors.value.length < totalFilteredTutors.value;
    });

    // Advanced Anime.js v4 Search Page Animations
    const initSearchAnimations = async () => {
      await nextTick();

      // Create main timeline with optimized settings (removed excessive callbacks)
      const searchTimeline = createTimeline({
        defaults: {
          duration: 800,
          ease: "out(3)",
          frameRate: 60,
        },
        playbackRate: 1,
        onComplete: (self) => {
          if (searchCard.value) {
            searchCard.value.style.borderColor = "var(--cyber-orange)";
          }
        },
      });

      // Initialize beautiful world globe animations
      initGlobeAnimations();

      // Search card entrance with 3D effects
      if (searchCard.value) {
        searchTimeline.label("card-entrance", 0).add(
          searchCard.value,
          {
            opacity: [0, 1],
            y: [100, 0],
            scale: [0.8, 1],
            rotateX: [30, 0],
            rotateY: [15, 0],
            filter: ["blur(10px)", "blur(0px)"],
            boxShadow: [
              "0 0 0 rgba(255, 140, 66, 0)",
              "0 0 50px rgba(255, 140, 66, 0.5)",
            ],
          },
          "card-entrance"
        );
      }

      // Header elements with staggered 3D animations
      if (searchIcon.value) {
        searchTimeline.label("icon-animation", 200).add(
          searchIcon.value,
          {
            scale: [0, 1.2, 1],
            opacity: [0, 1],
            filter: ["blur(5px)", "blur(0px)"],
          },
          "icon-animation"
        );
      }

      if (searchTitle.value) {
        searchTimeline.add(
          searchTitle.value,
          {
            y: [50, 0],
            opacity: [0, 1],
            scale: [0.9, 1],
            rotateX: [20, 0],
            textShadow: [
              "0 0 0 rgba(255, 140, 66, 0)",
              "0 0 20px rgba(255, 140, 66, 0.8)",
            ],
          },
          "+=200"
        );
      }

      if (searchSubtitle.value) {
        searchTimeline.add(
          searchSubtitle.value,
          {
            y: [30, 0],
            opacity: [0, 1],
            scale: [0.95, 1],
            rotateY: [-15, 0],
            filter: ["blur(3px)", "blur(0px)"],
          },
          "+=100"
        );
      }

      // Form fields with staggered animations
      const formFields = [
        { ref: nameField, delay: 350 },
        { ref: subjectField, delay: 400 },
        { ref: levelField, delay: 450 },
        { ref: locationField, delay: 500 },
        { ref: minRateField, delay: 600 },
        { ref: maxRateField, delay: 650 },
        { ref: searchButton, delay: 700 },
        { ref: clearButton, delay: 750 },
        { ref: filtersCard, delay: 800 },
      ];

      formFields.forEach(({ ref: fieldRef, delay }) => {
        if (fieldRef.value) {
          // Skip animation for buttons completely
          const isButton = fieldRef === searchButton || fieldRef === clearButton;
          
          if (isButton) {
            // Just make it visible without animation
            fieldRef.value.style.opacity = '1';
            return;
          }
          
          searchTimeline.add(
            fieldRef.value,
            {
              x: [-50, 0],
              y: [30, 0],
              opacity: [0, 1],
              scale: [0.9, 1],
              rotateY: [-10, 0],
              rotateX: [5, 0],
              filter: ["blur(3px)", "blur(0px)"],
              boxShadow: ["0 0 0 rgba(255, 140, 66, 0)", "0 0 15px rgba(255, 140, 66, 0.3)"],
            },
            `+=${delay}`
          );
        }
      });

      // Advanced input focus animations
      const inputFields = [
        nameField,
        subjectField,
        levelField,
        locationField,
        minRateField,
        maxRateField,
      ];

      inputFields.forEach((fieldRef) => {
        if (fieldRef.value) {
          const focusTimeline = createTimeline({
            defaults: { duration: 200, ease: "out(2)" },
          });

          fieldRef.value.addEventListener("focus", () => {
            focusTimeline.add(
              fieldRef.value,
              {
                scale: [1, 1.02],
                boxShadow: [
                  "0 0 0 rgba(255, 140, 66, 0)",
                  "0 0 20px rgba(255, 140, 66, 0.5)",
                ],
                borderColor: ["var(--cyber-orange)", "var(--cyber-yellow)"],
              },
              0
            );
          });

          fieldRef.value.addEventListener("blur", () => {
            focusTimeline.add(
              fieldRef.value,
              {
                scale: [1.02, 1],
                boxShadow: [
                  "0 0 20px rgba(255, 140, 66, 0.5)",
                  "0 0 0 rgba(255, 140, 66, 0)",
                ],
                borderColor: ["var(--cyber-yellow)", "var(--cyber-orange)"],
              },
              0
            );
          });
        }
      });

      // Advanced button hover/click animations
      // Search button animations removed for cleaner UI

      // Add continuous subtle animations for cyberpunk feel
      const continuousTimeline = createTimeline({
        loop: true,
        alternate: true,
        playbackRate: 0.3,
      });

      if (searchCard.value) {
        continuousTimeline.add(
          searchCard.value,
          {
            boxShadow: [
              "0 0 30px rgba(255, 140, 66, 0.3)",
              "0 0 50px rgba(255, 140, 66, 0.5)",
            ],
          },
          0
        );
      }

      // Create Animatable instances for interactive effects
      if (searchIcon.value) {
        logoAnimatable = createAnimatable(searchIcon.value, {
          x: { duration: 300, ease: "out(2)" },
          y: { duration: 300, ease: "out(2)" },
          scale: { duration: 200, ease: "out(3)" },
          rotate: { duration: 400, ease: "out(2)" },
        });
      }

      if (searchCard.value) {
        cardAnimatable = createAnimatable(searchCard.value, {
          x: { duration: 200, ease: "out(2)" },
          y: { duration: 200, ease: "out(2)" },
          rotateX: { duration: 300, ease: "out(2)" },
          rotateY: { duration: 300, ease: "out(2)" },
          scale: { duration: 150, ease: "out(3)" },
        });
      }
    };

    // Optimized World Globe Animations - removed duplicate animations to reduce lag
    const initGlobeAnimations = async () => {
      await nextTick();

      // Simple globe rotation (removed conflicting pulsing animation)
      if (globeCircle.value) {
        animate(globeCircle.value, {
          rotate: [0, 360],
          ease: "linear",
          duration: 30000,
          loop: true,
        });
      }

      // Drawable longitude and latitude lines (optimized durations)
      const longitudeLines = [
        longitude1.value,
        longitude2.value,
        longitude3.value,
      ].filter(Boolean);
      longitudeLines.forEach((line, index) => {
        const drawable = svg.createDrawable(line)[0];
        animate(drawable, {
          draw: ["0 0", "0 1", "1 1"],
          ease: "inOutQuad",
          duration: 4000,
          delay: index * 600,
          loop: true,
        });
      });

      const latitudeLines = [
        latitude1.value,
        latitude2.value,
        latitude3.value,
      ].filter(Boolean);
      latitudeLines.forEach((line, index) => {
        const drawable = svg.createDrawable(line)[0];
        animate(drawable, {
          draw: ["0 0", "0 1", "1 1"],
          ease: "inOutQuad",
          duration: 5000,
          delay: index * 800,
          loop: true,
        });
      });

      // Removed conflicting motion path animations for globe elements
      // Only animate the motion paths themselves (drawing effect)
      const motionPaths = [
        orbitPath.value,
        motionPath1.value,
        motionPath2.value,
        motionPath3.value,
      ].filter(Boolean);
      motionPaths.forEach((path, index) => {
        if (path) {
          const drawable = svg.createDrawable(path)[0];
          animate(drawable, {
            draw: "0 1",
            ease: "linear",
            duration: 12000,
            loop: true,
            delay: index * 1500,
          });
        }
      });
    };

    const searchTutors = async () => {
      isLoading.value = true;
      currentPage.value = 1;

      // Loading animation removed

      try {
        // Build query parameters
        const params = new URLSearchParams();
        params.append("type", "tutor");
        params.append("page", currentPage.value);
        params.append("limit", tutorsPerPage);

        if (filters.subject) params.append("subject", filters.subject);
        if (filters.level) params.append("level", filters.level);
        if (filters.location) params.append("location", filters.location);
        if (filters.minRate) params.append("minRate", filters.minRate);
        if (filters.maxRate) params.append("maxRate", filters.maxRate);

        // Fetch tutors from API
        const response = await fetch(
          `/api/profiles/search?${params}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch tutors");
        }

        const data = await response.json();
        console.log("API Response:", data);

        // Transform API data to frontend format
        allTutors.value = data.profiles.map((profile) => ({
          id: profile.user_id,
          name:
            `${profile.users?.first_name || ""} ${
              profile.users?.last_name || ""
            }`.trim() || "Unknown Tutor",
          subjects: profile.subjects || [],
          levels: profile.levels || [],
          rating: profile.average_rating || 0,
          reviews: profile.total_reviews || 0,
          hourlyRate: profile.hourly_rate || 0,
          experience:
            profile.experience_years >= 5
              ? "5+"
              : profile.experience_years >= 3
              ? "3-5"
              : "1-2",
          bio: profile.bio || profile.headline || "No bio available",
          location:
            profile.location?.address ||
            profile.preferred_locations?.[0] ||
            "Singapore",
          preferredLocations: profile.preferred_locations || [],
          teachingMode: profile.teaching_mode?.[0] || "both",
          availability: ["now"], // TODO: Get from availability system
        }));

        // Apply client-side filters for ratings, experience, availability
        let filtered = allTutors.value;

        // Name filter (case-insensitive partial match)
        if (filters.name && filters.name.trim()) {
          const nameQuery = filters.name.trim().toLowerCase();
          filtered = filtered.filter((tutor) => {
            const tutorName = tutor.name.toLowerCase();
            return tutorName.includes(nameQuery);
          });
        }

        // Location filter (exact match with primary location or preferred locations)
        if (filters.location && filters.location.trim()) {
          const locationQuery = filters.location.trim();
          filtered = filtered.filter((tutor) => {
            // Check if tutor's primary location matches
            if (tutor.location === locationQuery) {
              return true;
            }
            // Check if any preferred location matches
            if (tutor.preferredLocations && tutor.preferredLocations.length > 0) {
              return tutor.preferredLocations.includes(locationQuery);
            }
            return false;
          });
        }

        // Rating filter
        if (filters.ratings.length > 0) {
          filtered = filtered.filter((tutor) => {
            // Floor the average rating to map to the appropriate star rating bucket
            const flooredRating = Math.floor(tutor.rating || 0);
            return filters.ratings.includes(flooredRating);
          });
        }

        // Experience filter
        if (filters.experience.length > 0) {
          filtered = filtered.filter((tutor) =>
            filters.experience.includes(tutor.experience)
          );
        }

        // Availability filter
        if (filters.availability.length > 0) {
          filtered = filtered.filter((tutor) =>
            filters.availability.some((avail) =>
              tutor.availability.includes(avail)
            )
          );
        }

        // Apply sorting
        if (sortBy.value === "rating") {
          filtered.sort((a, b) => b.rating - a.rating);
        } else if (sortBy.value === "price-low") {
          filtered.sort((a, b) => a.hourlyRate - b.hourlyRate);
        } else if (sortBy.value === "price-high") {
          filtered.sort((a, b) => b.hourlyRate - a.hourlyRate);
        } else if (sortBy.value === "experience") {
          const expOrder = { "5+": 3, "3-5": 2, "1-2": 1 };
          filtered.sort(
            (a, b) => expOrder[b.experience] - expOrder[a.experience]
          );
        }

        // Paginate results
        totalFilteredTutors.value = filtered.length;
        tutors.value = filtered.slice(0, tutorsPerPage);
        console.log(
          `Found ${filtered.length} tutors after filtering, showing ${tutors.value.length}`
        );

        // Animate tutor cards entrance
        animateTutorCards();
      } catch (error) {
        console.error("Error fetching tutors:", error);
        tutors.value = [];
        allTutors.value = [];
        totalFilteredTutors.value = 0;
      } finally {
        isLoading.value = false;
      }
    };

    // Apply client-side filters to already loaded tutors (for name search real-time filtering)
    const applyClientSideFilters = () => {
      let filtered = allTutors.value;

      // Name filter (case-insensitive partial match)
      if (filters.name && filters.name.trim()) {
        const nameQuery = filters.name.trim().toLowerCase();
        filtered = filtered.filter((tutor) => {
          const tutorName = tutor.name.toLowerCase();
          return tutorName.includes(nameQuery);
        });
      }

      // Rating filter
      if (filters.ratings.length > 0) {
        filtered = filtered.filter((tutor) => {
          const flooredRating = Math.floor(tutor.rating || 0);
          return filters.ratings.includes(flooredRating);
        });
      }

      // Experience filter
      if (filters.experience.length > 0) {
        filtered = filtered.filter((tutor) =>
          filters.experience.includes(tutor.experience)
        );
      }

      // Availability filter
      if (filters.availability.length > 0) {
        filtered = filtered.filter((tutor) =>
          filters.availability.some((avail) =>
            tutor.availability.includes(avail)
          )
        );
      }

      // Apply sorting
      if (sortBy.value === "rating") {
        filtered.sort((a, b) => b.rating - a.rating);
      } else if (sortBy.value === "price-low") {
        filtered.sort((a, b) => a.hourlyRate - b.hourlyRate);
      } else if (sortBy.value === "price-high") {
        filtered.sort((a, b) => b.hourlyRate - a.hourlyRate);
      } else if (sortBy.value === "experience") {
        const expOrder = { "5+": 3, "3-5": 2, "1-2": 1 };
        filtered.sort(
          (a, b) => expOrder[b.experience] - expOrder[a.experience]
        );
      }

      // Update results
      totalFilteredTutors.value = filtered.length;
      tutors.value = filtered.slice(0, tutorsPerPage);
      
      // Reset to first page when filtering
      currentPage.value = 1;
    };

    // Get dynamic count of tutors by rating
    // Count tutors whose average rating floors to the specified star rating
    const getRatingCount = (rating) => {
      return allTutors.value.filter((tutor) => {
        // Floor the average rating to map to the appropriate star rating bucket
        const flooredRating = Math.floor(tutor.rating || 0);
        return flooredRating === rating;
      }).length;
    };

    // Animate tutor cards entrance
    const animateTutorCards = async () => {
      await nextTick();

      const tutorCards = document.querySelectorAll(".cyberpunk-tutor-card");
      tutorCards.forEach((card, index) => {
        const cardTimeline = createTimeline({
          defaults: { duration: 600, ease: "out(3)" },
        });

        cardTimeline.add(
          card,
          {
            opacity: [0, 1],
            y: [50, 0],
            scale: [0.9, 1],
            rotateX: [15, 0],
            rotateY: [10, 0],
            filter: ["blur(5px)", "blur(0px)"],
            boxShadow: [
              "0 0 0 rgba(255, 140, 66, 0)",
              "0 0 20px rgba(255, 140, 66, 0.3)",
            ],
          },
          index * 200
        );
      });
    };

    const clearFilters = () => {
      Object.keys(filters).forEach((key) => {
        if (Array.isArray(filters[key])) {
          filters[key] = [];
        } else {
          filters[key] = "";
        }
      });
    };

    const loadMore = () => {
      // Apply client-side filters for ratings, experience, availability
      let filtered = allTutors.value;

      // Name filter (case-insensitive partial match)
      if (filters.name && filters.name.trim()) {
        const nameQuery = filters.name.trim().toLowerCase();
        filtered = filtered.filter((tutor) => {
          const tutorName = tutor.name.toLowerCase();
          return tutorName.includes(nameQuery);
        });
      }

      // Location filter (exact match with primary location or preferred locations)
      if (filters.location && filters.location.trim()) {
        const locationQuery = filters.location.trim();
        filtered = filtered.filter((tutor) => {
          // Check if tutor's primary location matches
          if (tutor.location === locationQuery) {
            return true;
          }
          // Check if any preferred location matches
          if (tutor.preferredLocations && tutor.preferredLocations.length > 0) {
            return tutor.preferredLocations.includes(locationQuery);
          }
          return false;
        });
      }

      // Rating filter
      if (filters.ratings.length > 0) {
        filtered = filtered.filter((tutor) => {
          // Floor the average rating to map to the appropriate star rating bucket
          const flooredRating = Math.floor(tutor.rating || 0);
          return filters.ratings.includes(flooredRating);
        });
      }

      // Experience filter
      if (filters.experience.length > 0) {
        filtered = filtered.filter((tutor) =>
          filters.experience.includes(tutor.experience)
        );
      }

      // Availability filter
      if (filters.availability.length > 0) {
        filtered = filtered.filter((tutor) =>
          filters.availability.some((avail) =>
            tutor.availability.includes(avail)
          )
        );
      }

      // Apply sorting
      if (sortBy.value === "rating") {
        filtered.sort((a, b) => b.rating - a.rating);
      } else if (sortBy.value === "price-low") {
        filtered.sort((a, b) => a.hourlyRate - b.hourlyRate);
      } else if (sortBy.value === "price-high") {
        filtered.sort((a, b) => b.hourlyRate - a.hourlyRate);
      } else if (sortBy.value === "experience") {
        const expOrder = { "5+": 3, "3-5": 2, "1-2": 1 };
        filtered.sort(
          (a, b) => expOrder[b.experience] - expOrder[a.experience]
        );
      }

      // Load next page
      currentPage.value++;
      const startIndex = (currentPage.value - 1) * tutorsPerPage;
      const endIndex = currentPage.value * tutorsPerPage;
      const newTutors = filtered.slice(startIndex, endIndex);

      tutors.value.push(...newTutors);

      // Animate new tutor cards
      setTimeout(() => {
        animateTutorCards();
      }, 100);
    };

    // Dynamic speed control for animations
    let searchTimeline = null;

    // Animatable instances for interactive animations
    let logoAnimatable = null;
    let cardAnimatable = null;

    const adjustAnimationSpeed = (speed) => {
      if (searchTimeline) {
        searchTimeline.speed = speed;
      }
    };

    // Add keyboard controls for animation speed
    const handleKeyPress = (event) => {
      switch (event.key) {
        case "1":
          adjustAnimationSpeed(0.5); // Slow
          break;
        case "2":
          adjustAnimationSpeed(1.0); // Normal
          break;
        case "3":
          adjustAnimationSpeed(2.0); // Fast
          break;
        case "p":
          if (searchTimeline) {
            searchTimeline.paused
              ? searchTimeline.resume()
              : searchTimeline.pause();
          }
          break;
      }
    };

    // Optimized Interactive mouse movement handlers with throttling
    let lastMouseMoveTime = 0;
    const throttleDelay = 16; // ~60fps

    const handleMouseMove = (event) => {
      const now = Date.now();
      if (now - lastMouseMoveTime < throttleDelay) return;
      lastMouseMoveTime = now;

      const { clientX, clientY } = event;
      const { innerWidth, innerHeight } = window;

      // Calculate normalized mouse position (-1 to 1)
      const mouseX = (clientX / innerWidth) * 2 - 1;
      const mouseY = (clientY / innerHeight) * 2 - 1;

      // Logo interactive animation with circular boundary
      if (logoAnimatable && searchIcon.value) {
        const logoRect = searchIcon.value.getBoundingClientRect();
        const logoCenterX = logoRect.left + logoRect.width / 2;
        const logoCenterY = logoRect.top + logoRect.height / 2;

        const deltaX = clientX - logoCenterX;
        const deltaY = clientY - logoCenterY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > 0) {
          const maxMovement = 8;
          const movementRatio = Math.min(distance / 200, 1);
          const constrainedMovement = movementRatio * maxMovement;

          const angle = Math.atan2(deltaY, deltaX);
          const constrainedX = Math.cos(angle) * constrainedMovement;
          const constrainedY = Math.sin(angle) * constrainedMovement;

          const scale = 1 + movementRatio * 0.1;
          const rotate = constrainedX * 0.5;

          logoAnimatable
            .x(constrainedX)
            .y(constrainedY)
            .scale(scale)
            .rotate(rotate);
        }
      }

      // Card interactive animation (simplified - removed scale)
      if (cardAnimatable) {
        const cardX = mouseX * 5;
        const cardY = mouseY * 3;
        const cardRotateX = mouseY * 2;
        const cardRotateY = mouseX * 3;

        cardAnimatable
          .x(cardX)
          .y(cardY)
          .rotateX(cardRotateX)
          .rotateY(cardRotateY);
      }

      // Globe interactive animation (simplified)
      if (globeCircle.value) {
        const globeRotateY = mouseX * 3;

        globeCircle.value.style.transform = `rotateY(${globeRotateY}deg)`;
      }
    };

    // Mouse leave handler to reset animations
    const handleMouseLeave = () => {
      if (logoAnimatable) {
        logoAnimatable.x(0).y(0).scale(1).rotate(0);
      }
      if (cardAnimatable) {
        cardAnimatable.x(0).y(0).rotateX(0).rotateY(0);
      }
      if (globeCircle.value) {
        globeCircle.value.style.transform = "rotateY(0deg)";
      }
    };

    // Watch filters and sortBy to trigger automatic search
    let searchTimeout = null;
    watch(
      [filters, sortBy],
      () => {
        // Debounce search to avoid too many calls
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          console.log("Filters changed, searching...", filters);
          searchTutors();
        }, 300);
      },
      { deep: true }
    );

    onMounted(() => {
      // All animations disabled
      searchTutors();
    });

    return {
      // Template refs
      searchCard,
      searchIcon,
      searchTitle,
      searchSubtitle,
      nameField,
      subjectField,
      levelField,
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
      singaporeAreas,
      filters,
      sortBy,
      tutors,
      totalFilteredTutors,
      isLoading,
      hasMoreTutors,
      searchTutors,
      applyClientSideFilters,
      clearFilters,
      loadMore,
      getRatingCount,
    };
  },
};
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
  opacity: 0.3;
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
  stroke-dasharray: 5, 5;
  animation: dash 20s linear infinite;
}

.motion-path {
  opacity: 0.05;
  stroke-dasharray: 3, 3;
  animation: dash 15s linear infinite reverse;
}

@keyframes dash {
  to {
    stroke-dashoffset: -100;
  }
}

/* Cyberpunk Search Card */
.cyberpunk-search-card {
  background: rgba(26, 26, 26, 1) !important;
  border: 1px solid var(--cyber-orange);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 10;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.cyberpunk-search-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    45deg,
    transparent,
    rgba(255, 140, 66, 0.05),
    transparent
  );
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
  font-weight: 600;
  font-size: 2rem;
  text-shadow: none;
  letter-spacing: -0.5px;
  margin-bottom: 0.5rem;
}

.cyberpunk-search-subtitle {
  color: var(--cyber-text-muted);
  font-size: 1rem;
  font-weight: 400;
  text-shadow: none;
  letter-spacing: 0;
}

.cyberpunk-label {
  color: var(--cyber-text);
  font-weight: 500;
  font-size: 0.875rem;
  text-shadow: none;
  letter-spacing: 0;
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
  box-shadow: none;
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

/* Clear name button */
.cyberpunk-clear-name-btn {
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  color: var(--cyber-text-muted);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 1px solid var(--cyber-grey-light);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cyberpunk-clear-name-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* Style select dropdowns */
select.cyberpunk-input {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23ff8c42' d='M1.41 0L6 4.58 10.59 0 12 1.41l-6 6-6-6z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 12px;
  padding-right: 3rem;
  cursor: pointer;
}

select.cyberpunk-input option {
  background: #2a2a2a !important;
  color: var(--cyber-text) !important;
  padding: 0.5rem;
}

select.cyberpunk-input option:hover,
select.cyberpunk-input option:focus,
select.cyberpunk-input option:checked,
select.cyberpunk-input option:active {
  background: var(--cyber-orange) !important;
  color: #1a1a1a !important;
}

/* Additional styling for dropdown options to ensure visibility */
select.cyberpunk-input {
  color: var(--cyber-text) !important;
}

select.cyberpunk-input option {
  background-color: #2a2a2a !important;
  color: #ffffff !important;
}

/* Filters Grid Layout - Side by side on PHONE view */
.filters-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

/* Single column on very small screens only */
@media (max-width: 400px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }
}

/* Single column in sidebar on large desktop screens */
@media (min-width: 992px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }
}

.filter-section {
  min-width: 0;
}

.filter-section .cyberpunk-filter-label {
  font-size: 0.85rem;
}

/* Search Buttons Container */
.search-buttons-container {
  display: flex;
  gap: 0.75rem;
  flex-wrap: nowrap;
}

.search-buttons-container .cyberpunk-search-btn,
.search-buttons-container .cyberpunk-clear-btn {
  flex: 1;
}

/* Mobile view - side by side with smaller size */
@media (max-width: 768px) {
  .search-buttons-container {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    gap: 0.5rem !important;
    width: 100% !important;
  }
  
  .search-buttons-container .cyberpunk-search-btn,
  .search-buttons-container .cyberpunk-clear-btn {
    flex: 1 1 50% !important;
    max-width: 50% !important;
    min-width: 0 !important;
    width: auto !important;
    display: inline-block !important;
    padding: 0.65rem 0.75rem !important;
    font-size: 0.8rem !important;
    white-space: nowrap !important;
  }
}

/* Cyberpunk Buttons - Match Clear Filters style */
.cyberpunk-search-btn {
  background: transparent !important;
  border: 2px solid var(--cyber-grey-light) !important;
  color: var(--cyber-text) !important;
  font-weight: 600 !important;
  letter-spacing: 1px !important;
  box-shadow: none !important;
  transform: none !important;
  transition: all 0.3s ease !important;
  padding: 0.75rem 2rem !important;
  border-radius: 10px !important;
  filter: none !important;
}

.cyberpunk-search-btn:hover {
  background: transparent !important;
  border-color: var(--cyber-orange) !important;
  color: var(--cyber-orange) !important;
  transform: none !important;
  box-shadow: 0 0 15px rgba(255, 140, 66, 0.3) !important;
}

.cyberpunk-search-btn:active {
  transform: none !important;
}

.cyberpunk-search-btn:focus {
  box-shadow: none !important;
  outline: none !important;
}

.cyberpunk-search-btn:disabled {
  opacity: 0.6 !important;
  cursor: not-allowed !important;
  transform: none !important;
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

.cyberpunk-clear-btn:focus {
  box-shadow: none;
  outline: none;
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

/* Cyberpunk End Message */
.cyberpunk-end-message {
  color: var(--cyber-text-muted);
  font-size: 1rem;
  font-weight: 500;
  padding: 1rem 2rem;
  border: 1px solid var(--cyber-grey-light);
  border-radius: 10px;
  background: rgba(42, 42, 42, 0.5);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.cyberpunk-end-message i {
  color: var(--cyber-orange);
}

/* Cyberpunk Filters Card */
.cyberpunk-filters-card {
  background: rgba(26, 26, 26, 1) !important;
  border: 1px solid var(--cyber-grey-light);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
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
  font-weight: 600;
  font-size: 1.125rem;
  text-shadow: none;
  letter-spacing: -0.25px;
}

.cyberpunk-filter-label {
  color: var(--cyber-text);
  font-weight: 500;
  font-size: 0.875rem;
  text-shadow: none;
  letter-spacing: 0;
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
  content: "✓";
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
  background: rgba(26, 26, 26, 1) !important;
  border: 1px solid var(--cyber-grey-light);
  border-radius: 12px;
  box-shadow: none !important;
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
}

.cyberpunk-tutor-card .card-body {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.cyberpunk-tutor-card:hover {
  transform: translateY(-2px);
  border-color: var(--cyber-orange);
  box-shadow: none !important;
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

.cyberpunk-tutor-avatar .avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, var(--cyber-orange, #ff8c42), var(--cyber-yellow, #ffd23f)) !important;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.cyberpunk-tutor-card:hover .cyberpunk-tutor-avatar {
  transform: scale(1.05);
  box-shadow: none;
}

.cyberpunk-tutor-name {
  color: var(--cyber-text);
  font-weight: 600;
  font-size: 1.125rem;
  text-shadow: none;
}

.cyberpunk-tutor-rate {
  color: var(--cyber-orange);
  font-weight: 600;
  font-size: 1.25rem;
  text-shadow: none;
}

.cyberpunk-badge {
  background: rgba(255, 140, 66, 0.1);
  color: var(--cyber-orange);
  border: 1px solid rgba(255, 140, 66, 0.3);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.cyberpunk-favorite-btn {
  background: transparent;
  border: 1px solid var(--cyber-grey-light);
  color: var(--cyber-text);
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.cyberpunk-favorite-btn:hover {
  border-color: var(--cyber-orange);
  color: var(--cyber-orange);
  box-shadow: none;
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
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
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
