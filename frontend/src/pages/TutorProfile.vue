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
            <p class="cyberpunk-hero-subtitle" ref="heroSubtitle">
              Connect with experienced tutors for personalized learning
            </p>
          </div>
          <div class="col-md-4 text-end">
            <i
              class="fas fa-user-graduate cyberpunk-hero-icon"
              ref="heroIcon"
            ></i>
          </div>
        </div>
      </div>
    </section>

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
                  />
                </div>
                <h3 class="cyberpunk-tutor-name">{{ tutor.name }}</h3>
                <div class="cyberpunk-rating mb-3">
                  <i
                    v-for="n in 5"
                    :key="n"
                    :class="
                      n <= tutor.rating
                        ? 'fas fa-star cyberpunk-star'
                        : 'far fa-star cyberpunk-star-empty'
                    "
                  ></i>
                  <span class="cyberpunk-rating-text"
                    >({{ tutor.reviews }})</span
                  >
                </div>
                <div class="cyberpunk-button-group">
                  <button
                    class="cyberpunk-btn cyberpunk-btn-primary"
                    ref="messageButton"
                    @click="sendMessage"
                  >
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
                    <h6 class="cyberpunk-info-title">
                      <i class="fas fa-graduation-cap me-2"></i>Education
                    </h6>
                    <p class="cyberpunk-info-text">{{ tutor.education }}</p>
                  </div>
                  <div class="col-md-6">
                    <h6 class="cyberpunk-info-title">
                      <i class="fas fa-briefcase me-2"></i>Experience
                    </h6>
                    <p class="cyberpunk-info-text">
                      {{ tutor.experience }} years
                    </p>
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
                <div class="cyberpunk-pricing-item">
                  <h5 class="cyberpunk-price cyberpunk-price-primary">
                    ${{ tutor.hourlyRate }}/hour
                  </h5>
                  <small class="cyberpunk-price-label"
                    >Individual Session</small
                  >
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
                <div
                  v-for="review in displayedReviews"
                  :key="review.id"
                  class="cyberpunk-review-item"
                >
                  <div class="cyberpunk-review-content">
                    <div>
                      <h6 class="cyberpunk-review-name">
                        {{ review.studentName }}
                      </h6>
                      <div class="cyberpunk-review-rating">
                        <i
                          class="fas fa-star"
                          :class="
                            n <= review.rating
                              ? 'cyberpunk-star-filled'
                              : 'cyberpunk-star-empty'
                          "
                          v-for="n in 5"
                          :key="n"
                        ></i>
                      </div>
                      <p class="cyberpunk-review-comment">
                        {{ review.comment }}
                      </p>
                      <div
                        v-if="review.aspects && review.aspects.length > 0"
                        class="cyberpunk-review-aspects"
                      >
                        <span
                          v-for="aspect in review.aspects"
                          :key="aspect"
                          class="cyberpunk-aspect-tag"
                        >
                          {{ aspect }}
                        </span>
                      </div>
                    </div>
                    <small class="cyberpunk-review-date">{{
                      formatDate(review.createdAt)
                    }}</small>
                  </div>
                </div>
                <div v-if="reviews.length > 3" class="text-center mt-3">
                  <button
                    v-if="!showAllReviews"
                    class="cyberpunk-btn cyberpunk-btn-outline"
                    @click="showAllReviews = true"
                  >
                    <i class="fas fa-chevron-down me-2"></i>Show All Reviews ({{
                      reviews.length
                    }})
                  </button>
                  <button
                    v-else
                    class="cyberpunk-btn cyberpunk-btn-outline"
                    @click="showAllReviews = false"
                  >
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
import { ref, onMounted, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { createTimeline, animate, createAnimatable, utils } from "animejs";

export default {
  name: "TutorProfile",
  setup() {
    const route = useRoute();
    const router = useRouter();

    // Refs for animations
    const heroTitle = ref(null);
    const heroSubtitle = ref(null);
    const heroIcon = ref(null);
    const tutorCard = ref(null);
    const tutorAvatar = ref(null);
    const messageButton = ref(null);
    const aboutCard = ref(null);
    const subjectsCard = ref(null);
    const pricingCard = ref(null);
    const reviewsCard = ref(null);
    const floatingIcon1 = ref(null);
    const floatingIcon2 = ref(null);
    const floatingIcon3 = ref(null);
    const floatingIcon4 = ref(null);
    const floatingIcon5 = ref(null);
    const floatingIcon6 = ref(null);

    const tutor = ref({
      id: null,
      name: "Loading...",
      subject: "Loading...",
      level: "Loading...",
      avatar:
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE0MCIgcj0iNTUiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE2MCAyNDBDMTYwIDIyMC45MDkgMTgwLjkwOSAyMDAgMjA3IDIwMEgyMTlDMjQ1LjA5MSAyMDAgMjY2IDIyMC45MDkgMjY2IDI0MFYzMjBIMTYwVjI0MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg==",
      rating: 0,
      bio: "Loading tutor information...",
      education: "Loading...",
      experience: 0,
      experienceRange: "Loading...",
      subjects: [],
      levels: [],
      hourlyRate: 0,
      location: "Loading...",
      teachingMode: "both",
      availability: [],
      reviews: 0,
    });

    const reviews = ref([]);
    const showAllReviews = ref(false);

    // Computed property to show first 3 reviews or all reviews
    const displayedReviews = computed(() => {
      return showAllReviews.value ? reviews.value : reviews.value.slice(0, 3);
    });

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString();
    };

    const sendMessage = () => {
      // Navigate to chat page with tutor ID
      router.push(`/chat/${tutor.value.id}`);
    };

    const initProfileAnimations = () => {
      // Create main timeline
      const profileTimeline = createTimeline({
        defaults: {
          duration: 800,
          ease: "out(3)",
          frameRate: 60,
        },
      });

      // Hero section animations
      profileTimeline
        .add(heroTitle.value, {
          opacity: [0, 1],
          translateY: [50, 0],
          duration: 1000,
          delay: 0,
        })
        .add(heroSubtitle.value, {
          opacity: [0, 1],
          translateY: [50, 0],
          duration: 1000,
          delay: 200,
        })
        .add(heroIcon.value, {
          opacity: [0, 1],
          translateY: [50, 0],
          duration: 1000,
          delay: 400,
        });

      // Tutor card animation
      profileTimeline.add(tutorCard.value, {
        opacity: [0, 1],
        translateX: [-100, 0],
        duration: 1200,
        delay: 800,
      });

      // Avatar animation
      profileTimeline.add(tutorAvatar.value, {
        scale: [0, 1],
        rotate: [180, 0],
        duration: 1000,
        delay: 1000,
        ease: "out(4)",
      });

      // Button animation
      profileTimeline.add(messageButton.value, {
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 800,
        delay: 1200,
      });

      // Detail cards animation
      profileTimeline
        .add(aboutCard.value, {
          opacity: [0, 1],
          translateX: [100, 0],
          duration: 1000,
          delay: 1400,
        })
        .add(subjectsCard.value, {
          opacity: [0, 1],
          translateX: [100, 0],
          duration: 1000,
          delay: 1600,
        })
        .add(pricingCard.value, {
          opacity: [0, 1],
          translateX: [100, 0],
          duration: 1000,
          delay: 1800,
        })
        .add(reviewsCard.value, {
          opacity: [0, 1],
          translateX: [100, 0],
          duration: 1000,
          delay: 2000,
        });

      // Floating elements animation - single animation, no loop
      const floatingElements = [
        floatingIcon1.value,
        floatingIcon2.value,
        floatingIcon3.value,
        floatingIcon4.value,
        floatingIcon5.value,
        floatingIcon6.value,
      ];

      floatingElements.forEach((element, index) => {
        if (element) {
          profileTimeline.add(element, {
            opacity: [0, 0.1],
            translateY: [0, -10],
            duration: 2000,
            delay: 2200 + index * 200,
            ease: "out(2)",
          });
        }
      });
    };

    const handleCardHover = (cardRef) => {
      if (cardRef.value) {
        const hoverTimeline = createTimeline({
          defaults: { duration: 300, ease: "out(2)" },
        });

        hoverTimeline.add(cardRef.value, {
          scale: 1.02,
        });
      }
    };

    const handleCardLeave = (cardRef) => {
      if (cardRef.value) {
        const leaveTimeline = createTimeline({
          defaults: { duration: 300, ease: "out(2)" },
        });

        leaveTimeline.add(cardRef.value, {
          scale: 1,
        });
      }
    };

    const formatQualifications = (qualifications) => {
      if (!qualifications || qualifications.length === 0) {
        return "Not specified";
      }

      // Format each qualification as "Institution Degree · Year"
      return (
        qualifications
          .map((qual) => {
            const parts = [];
            if (qual.institution) parts.push(qual.institution);
            if (qual.degree) parts.push(qual.degree);
            const qualification = parts.join(" ");

            if (qual.year) {
              return `${qualification} · ${qual.year}`;
            }
            return qualification;
          })
          .join(" | ") || "Not specified"
      );
    };

    const loadReviews = async (tutorId) => {
      try {
        console.log("Loading reviews for tutor:", tutorId);
        const response = await fetch(
          `/api/reviews/tutor/${tutorId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch reviews");
        }

        const data = await response.json();
        console.log("Reviews data:", data);

        // Transform reviews data to match the expected format
        reviews.value = data.reviews.map((review, index) => ({
          id: review.id,
          studentName: `Review ${index + 1}`, // Anonymize reviewer names
          rating: review.rating,
          comment: review.comment || "No comment provided",
          createdAt: review.created_at,
          aspects: review.aspects || [],
        }));

        console.log("Loaded reviews:", reviews.value.length);
      } catch (error) {
        console.error("Error loading reviews:", error);
        reviews.value = [];
      }
    };

    const loadTutorData = async (tutorId) => {
      try {
        console.log("Loading tutor profile for ID:", tutorId);

        // Fetch tutor profile from API
        const response = await fetch(
          `/api/profiles/tutor/${tutorId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch tutor profile");
        }

        const data = await response.json();
        console.log("API Response:", data);

        const profile = data.profile;
        const user = profile.users;

        // Transform API data to component format
        tutor.value = {
          id: profile.user_id,
          name:
            `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
            "Unknown Tutor",
          subject: profile.subjects?.[0] || "N/A",
          level: profile.levels?.[0] || "N/A",
          avatar:
            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE0MCIgcj0iNTUiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE2MCAyNDBDMTYwIDIyMC45MDkgMTgwLjkwOSAyMDAgMjA3IDIwMEgyMTlDMjQ1LjA5MSAyMDAgMjY2IDIyMC45MDkgMjY2IDI0MFYzMjBIMTYwVjI0MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg==",
          rating: profile.average_rating || 0,
          bio:
            profile.bio ||
            profile.headline ||
            profile.teaching_philosophy ||
            "No bio available",
          education: formatQualifications(profile.qualifications),
          experience: profile.experience_years || 0,
          experienceRange:
            profile.experience_years >= 5
              ? "5+"
              : profile.experience_years >= 3
              ? "3-5"
              : "1-2",
          subjects: profile.subjects || [],
          levels: profile.levels || [],
          hourlyRate: profile.hourly_rate || 0,
          location:
            profile.location?.address ||
            profile.preferred_locations?.[0] ||
            "Singapore",
          teachingMode: profile.teaching_mode?.[0] || "both",
          availability: ["now"], // TODO: Get from availability system
          reviews: profile.total_reviews || 0,
        };

        // Fetch real reviews from reviews service
        await loadReviews(profile.user_id);
        showAllReviews.value = false;

        console.log("Loaded tutor:", tutor.value.name);
      } catch (error) {
        console.error("Error loading tutor profile:", error);

        // Show error state when tutor not found
        tutor.value = {
          id: null,
          name: "Tutor Not Found",
          subject: "N/A",
          level: "N/A",
          avatar:
            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE0MCIgcj0iNTUiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE2MCAyNDBDMTYwIDIyMC45MDkgMTgwLjkwOSAyMDAgMjA3IDIwMEgyMTlDMjQ1LjA5MSAyMDAgMjY2IDIyMC45MDkgMjY2IDI0MFYzMjBIMTYwVjI0MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg==",
          rating: 0,
          bio: "Unable to load tutor information. The tutor profile may not exist or there may be a network error.",
          education: "Not specified",
          experience: 0,
          experienceRange: "N/A",
          subjects: [],
          levels: [],
          hourlyRate: 0,
          location: "N/A",
          teachingMode: "both",
          availability: [],
          reviews: 0,
        };

        reviews.value = [];
        showAllReviews.value = false;
        console.log("Tutor profile could not be loaded:", tutorId);
      }
    };

    onMounted(() => {
      // Load tutor data based on route parameter (UUID)
      const tutorId = route.params.id;
      if (tutorId) {
        loadTutorData(tutorId);
      }

      // All animations disabled
    });

    // Watch for route changes to load different tutors
    watch(
      () => route.params.id,
      (newTutorId) => {
        if (newTutorId) {
          loadTutorData(newTutorId);

          // All animations disabled
        }
      }
    );

    return {
      tutor,
      reviews,
      showAllReviews,
      displayedReviews,
      formatDate,
      sendMessage,
      heroTitle,
      heroSubtitle,
      heroIcon,
      tutorCard,
      tutorAvatar,
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
      handleCardLeave,
    };
  },
};
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

.floating-icon:nth-child(1) {
  top: 10%;
  left: 10%;
}
.floating-icon:nth-child(2) {
  top: 20%;
  right: 15%;
}
.floating-icon:nth-child(3) {
  top: 60%;
  left: 5%;
}
.floating-icon:nth-child(4) {
  top: 70%;
  right: 10%;
}
.floating-icon:nth-child(5) {
  top: 30%;
  left: 50%;
}
.floating-icon:nth-child(6) {
  top: 80%;
  right: 30%;
}

/* Hero Section */
.cyberpunk-hero-section {
  background: linear-gradient(
    135deg,
    var(--cyber-bg-dark) 0%,
    var(--cyber-bg) 100%
  );
  border-bottom: 2px solid var(--cyber-orange);
  padding: 1rem 0;
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
  padding: 2rem 0;
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

.cyberpunk-review-aspects {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.cyberpunk-aspect-tag {
  background: var(--cyber-bg-dark); /* Dark background */
  color: var(--cyber-orange); /* Orange text */
  padding: 0.4rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: capitalize;
  border: 1px solid var(--cyber-orange); /* Orange border */
  transition: all 0.3s ease;
}

.cyberpunk-aspect-tag:hover {
  background: var(--cyber-orange); /* Orange background on hover */
  color: var(--cyber-bg-dark); /* Dark text on hover */
  transform: translateY(-1px);
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

  /* Improve spacing between Subjects and Levels on mobile */
  /* Target the first column in rows within detail cards (Subjects column) */
  .cyberpunk-detail-card .row .col-md-6:first-child {
    margin-bottom: 2rem !important;
  }

  .cyberpunk-section-title {
    margin-bottom: 1rem !important;
  }

  .cyberpunk-tags {
    margin-bottom: 0.5rem;
  }
}
</style>
