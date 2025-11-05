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
              <div v-else class="recent-activity-list">
                <div
                  v-for="(activity, index) in recentActivity"
                  :key="index"
                  class="d-flex align-items-center p-3 border-bottom activity-item"
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
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useAuthStore } from "../stores/auth";
import api from "../services/api";
import messagingService from "../services/messaging.js";

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
    
    // Real-time message handler for Recent Activity updates
    let dashboardMessageHandler = null;

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

        // Fetch reviews for the user to show in recent activity
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

        // Fetch recent messages from conversations to include in activity
        // This ensures regular text messages persist on page refresh
        // IMPORTANT: This is separate from notifications - messages are stored in conversations, not notifications
        let recentMessages = [];
        try {
          console.log("📬 Fetching conversations to get recent messages for Recent Activity...");
          const conversationsResponse = await messagingService.getConversations(1, 20);
          
          if (conversationsResponse && conversationsResponse.conversations) {
            const conversations = conversationsResponse.conversations;
            console.log("📬 Found conversations:", conversations.length);
            
            // For each conversation, fetch recent messages (not just the last one)
            // This ensures multiple messages from the same conversation show up
            for (const conversation of conversations) {
              try {
                // Get recent messages from this conversation (fetch last 10 messages)
                // This allows multiple messages from the same conversation to appear
                const messagesResponse = await messagingService.getMessages(conversation.id, 1, 10);
                
                if (messagesResponse && messagesResponse.messages && messagesResponse.messages.length > 0) {
                  // Process all messages, not just the first one
                  messagesResponse.messages.forEach((message) => {
                    // For booking_offer and booking_proposal, include for both sender and receiver
                    // For other system messages, only include if not from self
                    const isSender = String(message.sender_id) === String(userId.value);
                    const isSystemMessage =
                      message.message_type === "reschedule_request" ||
                      message.message_type === "reschedule_accepted" ||
                      message.message_type === "reschedule_rejected" ||
                      message.message_type === "booking_cancelled" ||
                      message.message_type === "booking_proposal" ||
                      message.message_type === "booking_confirmation" ||
                      message.message_type === "booking_offer" ||
                      message.message_type === "session_completed" ||
                      message.message_type === "credit_deducted" ||
                      message.message_type === "credit_added";
                    
                    // Include booking_offer, booking_proposal, and booking_confirmation for both sender and receiver
                    // This ensures both parties see confirmations and can match them with their requests/proposals
                    // Include other system messages only for receiver
                    // Include regular messages only if not from self
                    const isBookingOfferOrProposal = message.message_type === "booking_offer" || message.message_type === "booking_proposal";
                    const isBookingConfirmation = message.message_type === "booking_confirmation";
                    
                    if (isBookingOfferOrProposal || isBookingConfirmation) {
                      // Always include booking_offer, booking_proposal, and booking_confirmation (both sent and received)
                      // This is crucial for matching logic to work - both parties need to see the confirmation
                      recentMessages.push(message);
                    } else if (isSystemMessage && !isSender) {
                      // Other system messages: only include if not from self
                      recentMessages.push(message);
                    } else if (!isSystemMessage && !isSender) {
                      // Regular messages: only include if not from self
                      recentMessages.push(message);
                    }
                  });
                }
              } catch (msgError) {
                console.warn("⚠️ Could not fetch messages for conversation:", conversation.id, msgError.message);
                // Continue with next conversation
              }
            }
            
            console.log("📬 Extracted recent messages from conversations:", recentMessages.length);
          }
        } catch (conversationError) {
          console.warn("⚠️ Could not fetch conversations/messages for activity:", conversationError.message);
        }
        
        // Format notifications, reviews, and messages into activities
        // Process all three sources: notifications, reviews, and messages
        // IMPORTANT: Recent Activity is separate from notifications - it combines:
        // 1. Notifications (system messages, booking events)
        // 2. Messages (regular chat messages from conversations)
        // 3. Reviews (for tutors)
        const activities = [];
        
        // Process notifications (if they exist)
        if (notifications && notifications.length > 0) {
          // Process notifications (messages, booking confirmations, booking requests)
          notifications.forEach((notification) => {
            // Use created_at (from API/database) first, then timestamp (from localStorage)
            // created_at is more accurate as it comes from the database
            const notificationTimestamp = notification.created_at || notification.timestamp;
            
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
            let status = "Unread";
            let badgeClass = "bg-warning"; // Yellow badge for unread items

            // Check notification message/content for type
            // First check for message_type from notification data (for system messages)
            const notificationMessageType = notification.message_type || data.messageType || data.notificationType;
            
            if (notificationMessageType === "booking_confirmation" || message.includes("Booking confirmed") || message.includes("booking confirmed") || data.notificationType === "booking_confirmation") {
              icon = "fas fa-calendar-check text-success"; // Green calendar with checkmark for booking confirmed
              title = "New booking confirmed";
              status = "Completed";
              badgeClass = "bg-success";
            } else if (notificationMessageType === "booking_cancelled" || message.includes("Booking cancelled") || message.includes("booking cancelled") || data.notificationType === "booking_cancelled") {
              icon = "fas fa-calendar-times text-danger";
              title = "Booking cancelled";
              status = "Completed";
              badgeClass = "bg-success";
            } else if (notificationMessageType === "booking_offer" || notificationMessageType === "booking_proposal" || message.includes("Booking request") || message.includes("booking request") || message.includes("Booking offer") || message.includes("Booking proposal") || data.notificationType === "booking_offer" || data.notificationType === "booking_request" || data.notificationType === "booking_proposal") {
              icon = "fas fa-calendar-alt"; // Calendar icon for booking request/proposal
              
              // Determine if notification is from current user (sent) or to current user (received)
              // For notifications, we need to check the notification data or sender
              const notificationSenderId = notification.sender_id || notification.user_id || data.senderId;
              const isSender = notificationSenderId && String(notificationSenderId) === String(userId.value);
              
              if (notificationMessageType === "booking_offer" || data.notificationType === "booking_offer" || data.notificationType === "booking_request") {
                // Booking request: students send, tutors receive
                if (isSender && userType.value === "student") {
                  // Student sent the booking request
                  title = "Booking request sent";
                } else {
                  // Tutor received the booking request
                  title = "Booking request received";
                }
              } else if (notificationMessageType === "booking_proposal" || data.notificationType === "booking_proposal") {
                // Booking proposal: tutors send, students receive
                if (isSender && userType.value === "tutor") {
                  // Tutor sent the booking proposal
                  title = "Booking proposal sent";
                } else {
                  // Student received the booking proposal
                  title = "Booking proposal received";
                }
              } else {
                // Fallback for text-based detection
                title = message.includes("proposal") ? "Booking proposal received" : "Booking request sent";
              }
              
              // Check if booking is confirmed - will be updated if confirmation is found during merge
              status = "Unread"; 
              badgeClass = "bg-warning";
            } else if (notificationMessageType === "session_completed" || message.includes("session completed") || message.includes("Session completed") || message.includes("marked as completed") || data.notificationType === "session_completed") {
              // Parse credit information from session_completed message
              let creditInfo = "";
              try {
                const messageData = typeof notification.content === "string" ? JSON.parse(notification.content) : notification.content || {};
                const creditsAmount = messageData.creditsAmount || messageData.credits || 0;
                
                if (userType.value === "tutor" && creditsAmount > 0) {
                  creditInfo = ` - ${creditsAmount} credits added`;
                  icon = "fas fa-dollar-sign";
                  title = `Session completed${creditInfo}`;
                  status = "Completed";
                  badgeClass = "bg-success";
                } else if (userType.value === "student") {
                  // For students, credits were already deducted at booking confirmation
                  // This message just confirms session completion
                  icon = "fas fa-check-circle";
                  title = "Session marked as completed";
                  status = "Completed";
                  badgeClass = "bg-success";
                } else {
                  icon = "fas fa-check-circle";
                  title = "Session completed";
                  status = "Completed";
                  badgeClass = "bg-success";
                }
              } catch (e) {
                // If parsing fails, use default
                icon = "fas fa-check-circle";
                title = userType.value === "tutor" ? "Session completed - credits added" : "Session marked as completed";
                status = "Completed";
                badgeClass = "bg-success";
              }
            } else if (message.includes("Credit") || message.includes("credit") || message.includes("credits deducted") || message.includes("credits added") || message.includes("credits reserved")) {
              // Handle credit transaction notifications
              const creditMatch = message.match(/(\d+\.?\d*)\s*credit/i);
              const credits = creditMatch ? creditMatch[1] : "";
              
              if (message.includes("deducted") || message.includes("reserved")) {
                icon = "fas fa-minus-circle";
                title = credits ? `Credits deducted: ${credits} credits` : "Credits deducted";
                status = "Completed";
                badgeClass = "bg-success"; // Changed to green for consistency with other "Completed" statuses
              } else if (message.includes("added") || message.includes("transferred")) {
                icon = "fas fa-plus-circle";
                title = credits ? `Credits added: ${credits} credits` : "Credits added";
                status = "Completed";
                badgeClass = "bg-success";
              } else {
                icon = "fas fa-dollar-sign";
                title = "Credit transaction";
                status = "Completed";
                badgeClass = "bg-success"; // Changed to green for consistency with other "Completed" statuses
              }
            } else if (message.includes("message") || message.includes("Message") || notification.type === "push") {
              icon = "fas fa-calendar-alt"; // Use calendar icon instead of envelope
              title = message.includes("from") ? message : `New message${userType.value === "student" ? " from tutor" : " from student"}`;
              if (message.read_at != "" || message.read_at != null) {
                status = "Completed";
                badgeClass = "bg-success";
              } else {
                status = "Unread";
                badgeClass = "bg-warning";
              };
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
              // Store booking_offer_id for matching with booking_confirmation
              booking_offer_id: notification.booking_offer_id || data.bookingOfferId || null,
              message_type: notificationMessageType || data.messageType || data.notificationType || null,
            });
          });

          // Process reviews (for tutors who received reviews) - inside notifications block
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
        } // End of notifications processing block
        
        // ALWAYS process messages and reviews (even if notifications are empty)
        // This ensures messages persist on page refresh - they're separate from notifications
        // Process reviews (check for duplicates)
        if (userType.value === "tutor" && reviews.length > 0) {
          reviews.forEach((review) => {
            const reviewTimestamp = review.timestamp || review.created_at;
            
            // Check if already added from notifications
            const existingReview = activities.find(a => 
              a.title === `Received ${review.rating}-star review` && 
              a.timestamp === reviewTimestamp
            );
            
            if (!existingReview) {
              activities.push({
                icon: "fas fa-star",
                title: `Received ${review.rating}-star review`,
                time: formatTimeAgo(reviewTimestamp),
                status: "Completed",
                badgeClass: "bg-success",
                timestamp: reviewTimestamp,
              });
            }
          });
        }

        // Process recent messages from conversations
        // Convert messages to activities - this is separate from notifications
        // Regular text messages are stored in conversations, not notifications
        recentMessages.forEach((message) => {
          // Use the same createActivityFromMessage helper that's used in real-time handler
          // But we need to make it accessible here - we'll create activities manually with same logic
          const messageType = message.message_type || 'text';
          const messageTimestamp = message.created_at || new Date().toISOString();
          
          let icon = "fas fa-calendar-alt"; // Default calendar icon
          let title = `New message${userType.value === "student" ? " from tutor" : " from student"}`;
          let status = "Unread";
          let badgeClass = "bg-warning";
          
          // Use same logic as createActivityFromMessage
          if (messageType === "booking_confirmation") {
            icon = "fas fa-calendar-check text-success"; // Green calendar with checkmark for booking confirmed
            title = "New booking confirmed";
            status = "Completed";
            badgeClass = "bg-success";
          } else if (messageType === "booking_cancelled") {
            icon = "fas fa-calendar-times text-danger";
            title = "Booking cancelled";
            status = "Completed";
            badgeClass = "bg-success";
          } else if (messageType === "booking_offer" || messageType === "booking_proposal") {
            icon = "fas fa-calendar-alt"; // Calendar icon for booking request/proposal
            
            // Determine if message is from current user (sent) or to current user (received)
            const isSender = String(message.sender_id) === String(userId.value);
            
            if (messageType === "booking_offer") {
              // Booking request: students send, tutors receive
              if (isSender && userType.value === "student") {
                // Student sent the booking request
                title = "Booking request sent";
              } else {
                // Tutor received the booking request
                title = "Booking request received";
              }
            } else if (messageType === "booking_proposal") {
              // Booking proposal: tutors send, students receive
              if (isSender && userType.value === "tutor") {
                // Tutor sent the booking proposal
                title = "Booking proposal sent";
              } else {
                // Student received the booking proposal
                title = "Booking proposal received";
              }
            }
            
            // Check if booking is confirmed - if there's a booking_confirmation message for the same booking_offer_id
            // We'll check this by looking for a booking_confirmation in the activities array
            // For now, set as Unread - will be updated if confirmation is found during merge
            status = "Unread";
            badgeClass = "bg-warning";
          } else if (messageType === "credit_deducted") {
            // Credits deducted from student when booking is confirmed
            try {
              const messageData = typeof message.content === "string" ? JSON.parse(message.content) : message.content || {};
              const creditsAmount = messageData.creditsAmount || messageData.credits || 0;
              icon = "fas fa-minus-circle";
              title = creditsAmount > 0 ? `Credits deducted: ${creditsAmount} credits` : "Credits deducted";
              status = "Completed";
              badgeClass = "bg-success";
            } catch (e) {
              icon = "fas fa-minus-circle";
              title = "Credits deducted";
              status = "Completed";
              badgeClass = "bg-success";
            }
          } else if (messageType === "credit_added") {
            // Credits added to tutor when session is completed
            try {
              const messageData = typeof message.content === "string" ? JSON.parse(message.content) : message.content || {};
              const creditsAmount = messageData.creditsAmount || messageData.creditsTransfered || messageData.credits || 0;
              icon = "fas fa-plus-circle";
              title = creditsAmount > 0 ? `Credits added: ${creditsAmount} credits` : "Credits added";
              status = "Completed";
              badgeClass = "bg-success";
            } catch (e) {
              icon = "fas fa-plus-circle";
              title = "Credits added";
              status = "Completed";
              badgeClass = "bg-success";
            }
          } else if (messageType === "session_completed") {
            icon = "fas fa-check-circle";
            title = userType.value === "tutor" ? "Session completed - credits added" : "Session marked as completed";
            status = "Completed";
            badgeClass = "bg-success";
          } else if (messageType === "reschedule_request" || messageType === "reschedule_accepted" || messageType === "reschedule_rejected") {
            icon = "fas fa-calendar-alt";
            if (messageType === "reschedule_accepted") {
              title = "Reschedule request accepted";
              status = "Completed";
              badgeClass = "bg-success";
            } else if (messageType === "reschedule_rejected") {
              title = "Reschedule request rejected";
              status = "Completed";
              badgeClass = "bg-success";
            } else {
              // Reschedule request: determine if message is from current user (sent) or to current user (received)
              const isSender = String(message.sender_id) === String(userId.value);
              if (isSender) {
                // User sent the reschedule request
                title = "Reschedule booking request sent";
              } else {
                // User received the reschedule request
                title = "Reschedule booking received";
              }
              status = "Unread";
              badgeClass = "bg-warning";
            }
          } else {
            // Regular text message
            if (message.sender) {
              const senderName = `${message.sender.first_name || ''} ${message.sender.last_name || ''}`.trim();
              title = senderName ? `New message from ${senderName}` : `New message${userType.value === "student" ? " from tutor" : " from student"}`;
            }
            icon = "fas fa-calendar-alt"; // Use calendar icon instead of envelope
            const isRead = message.read_at || (message.read_by && Array.isArray(message.read_by) && message.read_by.some(id => String(id) === String(userId.value)));
            status = isRead ? "Completed" : "Unread";
            badgeClass = isRead ? "bg-success" : "bg-warning";
          }
          
          // Extract bookingId from reschedule messages for matching
          let bookingId = null;
          if (messageType === "reschedule_request" || messageType === "reschedule_accepted" || messageType === "reschedule_rejected") {
            try {
              const messageData = typeof message.content === "string" ? JSON.parse(message.content) : message.content || {};
              bookingId = messageData.bookingId || null;
            } catch (e) {
              // Ignore parsing errors
            }
          }
          
          activities.push({
            icon: icon,
            title: title,
            time: formatTimeAgo(messageTimestamp),
            status: status,
            badgeClass: badgeClass,
            timestamp: messageTimestamp,
            // Use message ID as primary identifier - this ensures proper deduplication
            // and allows read messages to update their status instead of disappearing
            id: message.id || `msg_${messageTimestamp}_${Math.random()}`,
            // Store booking_offer_id for matching with booking_confirmation
            booking_offer_id: message.booking_offer_id || null,
            // Store bookingId for matching reschedule requests with responses
            booking_id: bookingId,
            message_type: messageType, // Store message type for confirmation matching
          });
        });

        // Merge with existing real-time activities to preserve them
        // Create a map of existing activities by ID for deduplication
        // Use message ID as primary key for messages, timestamp+title for others
        const existingActivityMap = new Map();
        recentActivity.value.forEach((activity) => {
          // Use message ID if available (more reliable), otherwise use timestamp+title
          const key = activity.id || `${activity.timestamp}_${activity.title}`;
          existingActivityMap.set(key, activity);
        });

        // Add new activities from notifications, reviews, and messages if they don't already exist
        activities.forEach((activity) => {
          // Use message ID if available (more reliable), otherwise use timestamp+title
          const key = activity.id || `${activity.timestamp}_${activity.title}`;
          if (!existingActivityMap.has(key)) {
            existingActivityMap.set(key, activity);
          } else {
            // If activity exists, update it (in case read status changed)
            // This ensures read messages don't disappear - they just update to "Completed"
            const existingActivity = existingActivityMap.get(key);
            // Update status if the new one has a different status (e.g., unread -> read)
            if (activity.status !== existingActivity.status) {
              existingActivityMap.set(key, activity);
            }
          }
        });
        
        // After all activities are added, check for booking_offer/proposal that should be marked as "Completed"
        // Look for booking_confirmation and mark related booking_offer/proposal as Completed
        const confirmationActivities = Array.from(existingActivityMap.values()).filter(a => 
          a.title === "New booking confirmed" || a.message_type === "booking_confirmation"
        );
        
        console.log("📊 DASHBOARD: Found", confirmationActivities.length, "booking confirmation activities");
        console.log("📊 DASHBOARD: Confirmation activities:", confirmationActivities.map(a => ({
          title: a.title,
          message_type: a.message_type,
          booking_offer_id: a.booking_offer_id,
          timestamp: a.timestamp
        })));
        
        if (confirmationActivities.length > 0) {
          // For each confirmation, find related booking_offer/proposal and mark as Completed
          // Match by booking_offer_id if available, otherwise match by timestamp proximity
          existingActivityMap.forEach((activity, key) => {
            const isBookingRequestOrProposal = 
              (activity.title && (activity.title.includes("Booking request") || activity.title.includes("Booking proposal"))) ||
              activity.message_type === "booking_offer" || 
              activity.message_type === "booking_proposal";
            
            if (isBookingRequestOrProposal && activity.status === "Unread") {
              console.log("📊 DASHBOARD: Checking booking_offer/proposal:", {
                title: activity.title,
                message_type: activity.message_type,
                booking_offer_id: activity.booking_offer_id,
                timestamp: activity.timestamp
              });
              
              // Try to match by booking_offer_id first (most reliable)
              let hasRelatedConfirmation = false;
              
              if (activity.booking_offer_id) {
                // Match by booking_offer_id - check if confirmation has same booking_offer_id
                hasRelatedConfirmation = confirmationActivities.some(conf => {
                  // Check if confirmation has booking_offer_id and it matches
                  if (conf.booking_offer_id && String(conf.booking_offer_id) === String(activity.booking_offer_id)) {
                    console.log("📊 DASHBOARD: ✅ Matched by booking_offer_id:", activity.booking_offer_id);
                    return true;
                  }
                  return false;
                });
              }
              
              // If no booking_offer_id match, use timestamp proximity (within 24 hours, confirmation after request/proposal)
              if (!hasRelatedConfirmation) {
                hasRelatedConfirmation = confirmationActivities.some(conf => {
                  const timeDiff = Math.abs(new Date(conf.timestamp) - new Date(activity.timestamp));
                  const isAfter = new Date(conf.timestamp) > new Date(activity.timestamp);
                  const isWithin24Hours = timeDiff < 24 * 60 * 60 * 1000;
                  
                  if (isAfter && isWithin24Hours) {
                    console.log("📊 DASHBOARD: ✅ Matched by timestamp proximity");
                    return true;
                  }
                  return false;
                });
              }
              
              if (hasRelatedConfirmation) {
                console.log("📊 DASHBOARD: ✅ Marking booking_offer/proposal as Completed:", activity.title);
                activity.status = "Completed";
                activity.badgeClass = "bg-success";
                existingActivityMap.set(key, activity);
              } else {
                console.log("📊 DASHBOARD: ❌ No matching confirmation found for:", activity.title);
              }
            }
          });
        }
        
        // Also check for reschedule_request that should be marked as "Completed"
        // Look for reschedule_accepted or reschedule_rejected and mark related reschedule_request as Completed
        const rescheduleResponseActivities = Array.from(existingActivityMap.values()).filter(a => 
          a.message_type === "reschedule_accepted" || a.message_type === "reschedule_rejected"
        );
        
        if (rescheduleResponseActivities.length > 0) {
          // For each reschedule response, find related reschedule_request and mark as Completed
          // Match by bookingId if available, otherwise match by timestamp proximity
          existingActivityMap.forEach((activity, key) => {
            const isRescheduleRequest = 
              (activity.title && (activity.title.includes("Reschedule booking request") || activity.title.includes("Reschedule booking") || activity.title.includes("Reschedule booking received") || activity.title.includes("Reschedule booking request sent"))) ||
              activity.message_type === "reschedule_request";
            
            if (isRescheduleRequest && activity.status === "Unread") {
              // Try to match by bookingId first (most reliable)
              let hasRelatedResponse = false;
              
              if (activity.booking_id) {
                // Match by bookingId - check if response has same bookingId
                hasRelatedResponse = rescheduleResponseActivities.some(resp => {
                  if (resp.booking_id && String(resp.booking_id) === String(activity.booking_id)) {
                    return true;
                  }
                  return false;
                });
              }
              
              // If no bookingId match, use timestamp proximity (within 24 hours, response after request)
              if (!hasRelatedResponse) {
                hasRelatedResponse = rescheduleResponseActivities.some(resp => 
                  Math.abs(new Date(resp.timestamp) - new Date(activity.timestamp)) < 24 * 60 * 60 * 1000 &&
                  new Date(resp.timestamp) > new Date(activity.timestamp) // Response is after the request
                );
              }
              
              if (hasRelatedResponse) {
                activity.status = "Completed";
                activity.badgeClass = "bg-success";
                existingActivityMap.set(key, activity);
              }
            }
          });
        }

        // Convert map back to array and sort by timestamp
        const mergedActivities = Array.from(existingActivityMap.values());
        mergedActivities.sort((a, b) => {
          const timeA = new Date(a.timestamp || 0);
          const timeB = new Date(b.timestamp || 0);
          return timeB - timeA;
        });

        // Limit to reasonable number of items (keep last 30 to show more activities)
        // This ensures we don't show too many, but enough to see recent history
        const limitedActivities = mergedActivities.slice(0, 30);

        // Show all activities (container will scroll if more than 5)
        recentActivity.value = limitedActivities;

        // Debug: Log all booking_offer/proposal activities and their status
        const bookingActivities = recentActivity.value.filter(a => 
          a.message_type === "booking_offer" || 
          a.message_type === "booking_proposal" ||
          (a.title && (a.title.includes("Booking request") || a.title.includes("Booking proposal")))
        );
        console.log("📊 DASHBOARD: Final booking_offer/proposal activities:", bookingActivities.map(a => ({
          title: a.title,
          status: a.status,
          booking_offer_id: a.booking_offer_id,
          message_type: a.message_type
        })));

        console.log("✅ Recent activity loaded:", recentActivity.value.length, "items");
        console.log("✅ Sources: notifications:", (notifications || []).length, "reviews:", reviews.length, "messages:", recentMessages.length);
        console.log("✅ Preserved real-time activities during merge");
      } catch (error) {
        console.error("❌ Error loading recent activity from notifications:", error);
        // Don't clear existing activities on error - preserve real-time updates
        // Only clear if there are no existing activities
        if (recentActivity.value.length === 0) {
          recentActivity.value = [];
        } else {
          console.log("📊 DASHBOARD: Error loading activities, but preserving existing real-time updates:", recentActivity.value.length);
        }
      }
    };

    // Setup real-time listener for Recent Activity updates
    const setupRealTimeActivityUpdates = () => {
      console.log("📊 DASHBOARD: Setting up real-time activity updates");
      console.log("📊 DASHBOARD: User ID:", userId.value);
      console.log("📊 DASHBOARD: Messaging service connected?", messagingService.isConnected);

      // Remove old handler if it exists to prevent duplicates
      if (dashboardMessageHandler) {
        console.log("📊 DASHBOARD: Removing existing message handler");
        messagingService.off("new_message", dashboardMessageHandler);
        dashboardMessageHandler = null;
      }

      // Helper function to create activity item from message
      const createActivityFromMessage = (message) => {
        // Handle null/undefined message_type - treat as text message
        const messageType = message.message_type || 'text';
        const messageContent = message.content || '';
        const messageTimestamp = message.created_at || new Date().toISOString();
        
        let icon = "fas fa-envelope";
        let title = `New message${userType.value === "student" ? " from tutor" : " from student"}`;
        let status = "Unread";
        let badgeClass = "bg-warning";
        
        // Determine activity type based on message_type
        if (messageType === "booking_confirmation") {
          icon = "fas fa-calendar-check";
          title = "New booking confirmed";
          status = "Completed";
          badgeClass = "bg-success";
        } else if (messageType === "booking_cancelled") {
          icon = "fas fa-calendar-times";
          title = "Booking cancelled";
          status = "Completed";
          badgeClass = "bg-success";
        } else if (messageType === "booking_offer" || messageType === "booking_proposal") {
          icon = "fas fa-calendar-plus";
          
          // Determine if message is from current user (sent) or to current user (received)
          const isSender = String(message.sender_id) === String(userId.value);
          
          if (messageType === "booking_offer") {
            // Booking request: students send, tutors receive
            if (isSender && userType.value === "student") {
              // Student sent the booking request
              title = "Booking request sent";
            } else {
              // Tutor received the booking request
              title = "Booking request received";
            }
          } else if (messageType === "booking_proposal") {
            // Booking proposal: tutors send, students receive
            if (isSender && userType.value === "tutor") {
              // Tutor sent the booking proposal
              title = "Booking proposal sent";
            } else {
              // Student received the booking proposal
              title = "Booking proposal received";
            }
          }
          
          // Check if booking is confirmed - if there's a booking_confirmation message for the same booking_offer_id
          // We'll check this by looking for a booking_confirmation in the activities array
          // For now, set as Unread - will be updated if confirmation is found during merge
          status = "Unread";
          badgeClass = "bg-warning";
        } else if (messageType === "credit_deducted") {
          // Credits deducted from student when booking is confirmed
          try {
            const messageData = typeof messageContent === "string" ? JSON.parse(messageContent) : messageContent || {};
            const creditsAmount = messageData.creditsAmount || messageData.credits || 0;
            icon = "fas fa-minus-circle";
            title = creditsAmount > 0 ? `Credits deducted: ${creditsAmount} credits` : "Credits deducted";
            status = "Completed";
            badgeClass = "bg-success";
          } catch (e) {
            icon = "fas fa-minus-circle";
            title = "Credits deducted";
            status = "Completed";
            badgeClass = "bg-success";
          }
        } else if (messageType === "credit_added") {
          // Credits added to tutor when session is completed
          try {
            const messageData = typeof messageContent === "string" ? JSON.parse(messageContent) : messageContent || {};
            const creditsAmount = messageData.creditsAmount || messageData.creditsTransfered || messageData.credits || 0;
            icon = "fas fa-plus-circle";
            title = creditsAmount > 0 ? `Credits added: ${creditsAmount} credits` : "Credits added";
            status = "Completed";
            badgeClass = "bg-success";
          } catch (e) {
            icon = "fas fa-plus-circle";
            title = "Credits added";
            status = "Completed";
            badgeClass = "bg-success";
          }
        } else if (messageType === "session_completed") {
          try {
            const messageData = typeof messageContent === "string" ? JSON.parse(messageContent) : messageContent || {};
            const creditsAmount = messageData.creditsAmount || messageData.credits || 0;
            
            if (userType.value === "tutor" && creditsAmount > 0) {
              icon = "fas fa-dollar-sign";
              title = `Session completed - ${creditsAmount} credits added`;
              status = "Completed";
              badgeClass = "bg-success";
            } else if (userType.value === "student") {
              icon = "fas fa-check-circle";
              title = "Session marked as completed";
              status = "Completed";
              badgeClass = "bg-success";
            } else {
              icon = "fas fa-check-circle";
              title = "Session completed";
              status = "Completed";
              badgeClass = "bg-success";
            }
          } catch (e) {
            icon = "fas fa-check-circle";
            title = userType.value === "tutor" ? "Session completed - credits added" : "Session marked as completed";
            status = "Completed";
            badgeClass = "bg-success";
          }
        } else if (messageType === "reschedule_request" || messageType === "reschedule_accepted" || messageType === "reschedule_rejected") {
          icon = "fas fa-calendar-alt";
          if (messageType === "reschedule_accepted") {
            title = "Reschedule request accepted";
            status = "Completed";
            badgeClass = "bg-success";
          } else if (messageType === "reschedule_rejected") {
            title = "Reschedule request rejected";
            status = "Completed";
            badgeClass = "bg-success";
          } else {
            // Reschedule request: determine if message is from current user (sent) or to current user (received)
            const isSender = String(message.sender_id) === String(userId.value);
            if (isSender) {
              // User sent the reschedule request
              title = "Reschedule booking request sent";
            } else {
              // User received the reschedule request
              title = "Reschedule booking received";
            }
            status = "Unread";
            badgeClass = "bg-warning";
          }
        } else {
          // Regular text message (or any unrecognized type - default to text message)
          if (message.sender) {
            const senderName = `${message.sender.first_name || ''} ${message.sender.last_name || ''}`.trim();
            title = senderName ? `New message from ${senderName}` : `New message${userType.value === "student" ? " from tutor" : " from student"}`;
          } else {
            // No sender object, use generic message
            title = `New message${userType.value === "student" ? " from tutor" : " from student"}`;
          }
          icon = "fas fa-envelope";
          // Check if message is read (use read_at or read_by array)
          const isRead = message.read_at || (message.read_by && message.read_by.includes && Array.isArray(message.read_by) && message.read_by.some(id => String(id) === String(userId.value)));
          status = isRead ? "Completed" : "Unread";
          badgeClass = isRead ? "bg-success" : "bg-warning";
        }
        
        // Extract bookingId from reschedule messages for matching
        let bookingId = null;
        if (messageType === "reschedule_request" || messageType === "reschedule_accepted" || messageType === "reschedule_rejected") {
          try {
            const messageData = typeof messageContent === "string" ? JSON.parse(messageContent) : messageContent || {};
            bookingId = messageData.bookingId || null;
          } catch (e) {
            // Ignore parsing errors
          }
        }
        
        return {
          icon: icon,
          title: title,
          time: formatTimeAgo(messageTimestamp),
          status: status,
          badgeClass: badgeClass,
          timestamp: messageTimestamp,
          id: message.id || `msg_${Date.now()}`, // Use message ID or generate one
          // Store booking_offer_id for matching with booking_confirmation
          booking_offer_id: message.booking_offer_id || null,
          // Store bookingId for matching reschedule requests with responses
          booking_id: bookingId,
          message_type: messageType, // Store message type for confirmation matching
        };
      };

      // Create new handler for dashboard activity updates
      dashboardMessageHandler = (message) => {
        console.log("📊 DASHBOARD: ✨ Received new message for activity update:", message);
        console.log("📊 DASHBOARD: Message sender_id:", message.sender_id);
        console.log("📊 DASHBOARD: Current user_id:", userId.value);
        console.log("📊 DASHBOARD: Message type:", message.message_type);
        console.log("📊 DASHBOARD: Message created_at:", message.created_at);

        // Only update activity if message is from another user or is a system message
        const isSystemMessage =
          message.message_type === "reschedule_request" ||
          message.message_type === "reschedule_accepted" ||
          message.message_type === "reschedule_rejected" ||
          message.message_type === "booking_cancelled" ||
          message.message_type === "booking_proposal" ||
          message.message_type === "booking_confirmation" ||
          message.message_type === "booking_offer" ||
          message.message_type === "session_completed" ||
          message.message_type === "credit_deducted" ||
          message.message_type === "credit_added";

        const isSender = String(message.sender_id) === String(userId.value);

        // For booking_offer and booking_proposal, show for both sender and receiver
        // For other system messages, update activity for receiver
        // For regular messages, only update if not from self
        // Allow messages even if sender object is missing (fallback for Socket.IO messages)
        const isBookingOfferOrProposal = message.message_type === "booking_offer" || message.message_type === "booking_proposal";
        const isRescheduleResponse = message.message_type === "reschedule_accepted" || message.message_type === "reschedule_rejected";
        const shouldShow = isBookingOfferOrProposal || isSystemMessage || (!isSender && (message.sender || message.message_type === 'text' || message.content || message.message_type === null || message.message_type === undefined));
        
        // Always process reschedule responses to mark related requests as Completed
        // This needs to run even if the message itself doesn't create an activity
        if (isRescheduleResponse) {
          console.log("📊 DASHBOARD: Processing reschedule response to mark related request as Completed");
          console.log("📊 DASHBOARD: Response message type:", message.message_type);
          console.log("📊 DASHBOARD: Response message content:", message.content);
          
          // Extract bookingId from the response message
          let responseBookingId = null;
          try {
            const messageData = typeof message.content === "string" ? JSON.parse(message.content) : message.content || {};
            responseBookingId = messageData.bookingId || null;
            console.log("📊 DASHBOARD: Extracted bookingId from response:", responseBookingId);
          } catch (e) {
            console.warn("📊 DASHBOARD: Error parsing response message content:", e);
          }
          
          console.log("📊 DASHBOARD: Checking", recentActivity.value.length, "activities for matching reschedule requests");
          
          recentActivity.value.forEach((activity, index) => {
            const isRescheduleRequest = 
              activity.message_type === "reschedule_request" ||
              (activity.title && (activity.title.includes("Reschedule booking request") || activity.title.includes("Reschedule booking") || activity.title.includes("Reschedule booking received") || activity.title.includes("Reschedule booking request sent")));
            
            if (isRescheduleRequest) {
              console.log("📊 DASHBOARD: Found reschedule request activity:", activity.title, "status:", activity.status, "booking_id:", activity.booking_id);
              
              if (activity.status === "Unread") {
                // Check if this reschedule_request is related to the response
                // Match by bookingId if available, otherwise by timestamp proximity
                let isRelated = false;
                
                if (activity.booking_id && responseBookingId) {
                  isRelated = String(activity.booking_id) === String(responseBookingId);
                  console.log("📊 DASHBOARD: Matching by bookingId:", activity.booking_id, "===", responseBookingId, "→", isRelated);
                } else {
                  // Fallback: check if response is within 24 hours after the request
                  const responseTimestamp = message.created_at || new Date().toISOString();
                  isRelated = Math.abs(new Date(responseTimestamp) - new Date(activity.timestamp)) < 24 * 60 * 60 * 1000 &&
                             new Date(responseTimestamp) > new Date(activity.timestamp);
                  console.log("📊 DASHBOARD: Matching by timestamp proximity:", isRelated, "response:", responseTimestamp, "request:", activity.timestamp);
                }
                
                if (isRelated) {
                  console.log("📊 DASHBOARD: ✅ Marking related reschedule_request as Completed:", activity.title);
                  activity.status = "Completed";
                  activity.badgeClass = "bg-success";
                  recentActivity.value[index] = activity;
                } else {
                  console.log("📊 DASHBOARD: ❌ Not related - booking_id mismatch or timestamp too far");
                }
              } else {
                console.log("📊 DASHBOARD: Activity already Completed, skipping");
              }
            }
          });
          
          // Re-sort after updates
          recentActivity.value.sort((a, b) => {
            const timeA = new Date(a.timestamp || 0);
            const timeB = new Date(b.timestamp || 0);
            return timeB - timeA;
          });
          
          console.log("📊 DASHBOARD: ✅ Finished checking reschedule requests");
        }
        
        if (shouldShow) {
          console.log("📊 DASHBOARD: Message qualifies for activity update");
          console.log("📊 DASHBOARD: Message details:", {
            id: message.id,
            type: message.message_type,
            sender_id: message.sender_id,
            hasSender: !!message.sender,
            hasContent: !!message.content
          });
          
          // Create activity item directly from the message for immediate real-time update
          const activityItem = createActivityFromMessage(message);
          console.log("📊 DASHBOARD: Created activity item:", activityItem);
          
          // Check if this activity already exists (prevent duplicates)
          // Use message ID as primary identifier for proper deduplication
          const existingIndex = recentActivity.value.findIndex(
            (a) => {
              // If both have message IDs, match by ID (most reliable)
              if (activityItem.id && a.id && activityItem.id === a.id) {
                return true;
              }
              // Fallback to timestamp+title for non-message activities
              return a.timestamp === activityItem.timestamp && a.title === activityItem.title;
            }
          );
          
          if (existingIndex === -1) {
            console.log("📊 DASHBOARD: Adding new activity item directly:", activityItem);
            // Add to beginning of array (most recent first)
            recentActivity.value = [activityItem, ...recentActivity.value];
            
            // Sort by timestamp to ensure correct order
            recentActivity.value.sort((a, b) => {
              const timeA = new Date(a.timestamp || 0);
              const timeB = new Date(b.timestamp || 0);
              return timeB - timeA;
            });
            
            // Limit to reasonable number of items (keep last 30 to show more activities)
            // Increased from 20 to 30 to accommodate multiple messages and read messages
            if (recentActivity.value.length > 30) {
              recentActivity.value = recentActivity.value.slice(0, 30);
            }
            
            console.log("📊 DASHBOARD: ✅ Activity updated in real-time, new count:", recentActivity.value.length);
            console.log("📊 DASHBOARD: Activity title:", activityItem.title);
            console.log("📊 DASHBOARD: Activity status:", activityItem.status);
            } else {
              // Activity already exists - update it if status changed (e.g., unread -> read)
              // This ensures read messages update their status instead of disappearing
              const existingActivity = recentActivity.value[existingIndex];
              if (existingActivity.status !== activityItem.status) {
                console.log("📊 DASHBOARD: Updating existing activity status:", existingActivity.status, "->", activityItem.status);
                // Update the existing activity
                recentActivity.value[existingIndex] = activityItem;
                // Re-sort to maintain correct order
                recentActivity.value.sort((a, b) => {
                  const timeA = new Date(a.timestamp || 0);
                  const timeB = new Date(b.timestamp || 0);
                  return timeB - timeA;
                });
                console.log("📊 DASHBOARD: ✅ Activity status updated in real-time");
              } else {
                console.log("📊 DASHBOARD: Activity already exists with same status, skipping duplicate");
              }
            }
            
            // After adding/updating activity, check if this is a booking_confirmation
            // If so, mark related booking_offer/proposal as "Completed"
            if (message.message_type === "booking_confirmation") {
              console.log("📊 DASHBOARD: Booking confirmed, checking for related booking_offer/proposal to mark as Completed");
              console.log("📊 DASHBOARD: Confirmation booking_offer_id:", message.booking_offer_id);
              console.log("📊 DASHBOARD: Checking", recentActivity.value.length, "activities");
              
              recentActivity.value.forEach((activity, index) => {
                const isBookingRequestOrProposal = 
                  activity.message_type === "booking_offer" || 
                  activity.message_type === "booking_proposal" ||
                  (activity.title && (activity.title.includes("Booking request") || activity.title.includes("Booking proposal")));
                
                if (isBookingRequestOrProposal && activity.status === "Unread") {
                  console.log("📊 DASHBOARD: Found booking_offer/proposal:", {
                    title: activity.title,
                    message_type: activity.message_type,
                    booking_offer_id: activity.booking_offer_id
                  });
                  
                  // Check if this booking_offer/proposal is related to the confirmation
                  // Match by booking_offer_id if available, otherwise by timestamp proximity
                  let isRelated = false;
                  
                  if (activity.booking_offer_id && message.booking_offer_id) {
                    isRelated = String(activity.booking_offer_id) === String(message.booking_offer_id);
                    console.log("📊 DASHBOARD: Matching by booking_offer_id:", activity.booking_offer_id, "===", message.booking_offer_id, "→", isRelated);
                  } else {
                    // Fallback: check if confirmation is within 24 hours after the request/proposal
                    const timeDiff = Math.abs(new Date(activityItem.timestamp) - new Date(activity.timestamp));
                    const isAfter = new Date(activityItem.timestamp) > new Date(activity.timestamp);
                    isRelated = timeDiff < 24 * 60 * 60 * 1000 && isAfter;
                    console.log("📊 DASHBOARD: Matching by timestamp proximity:", isRelated, "timeDiff:", timeDiff);
                  }
                  
                  if (isRelated) {
                    console.log("📊 DASHBOARD: ✅ Marking related booking_offer/proposal as Completed:", activity.title);
                    activity.status = "Completed";
                    activity.badgeClass = "bg-success";
                    recentActivity.value[index] = activity;
                  } else {
                    console.log("📊 DASHBOARD: ❌ Not related");
                  }
                }
              });
              
              // Re-sort after updates
              recentActivity.value.sort((a, b) => {
                const timeA = new Date(a.timestamp || 0);
                const timeB = new Date(b.timestamp || 0);
                return timeB - timeA;
              });
              
              console.log("📊 DASHBOARD: ✅ Finished checking booking_offer/proposal");
            }
            
            // If this is a session_completed message, refresh dashboard metrics in real-time
            // This ensures Active Bookings, Completed Sessions, Hours This Month, and Total Spent update immediately
            if (message.message_type === "session_completed") {
              console.log("📊 DASHBOARD: Session completed, refreshing dashboard metrics in real-time...");
              // Refresh dashboard metrics to reflect the new completed session
              // This will update Active Bookings (decrease), Completed Sessions (increase),
              // Hours This Month (increase), and Total Spent (increase)
              loadDashboardData().catch(err => {
                console.error("📊 DASHBOARD: Failed to refresh dashboard metrics:", err);
              });
            }
        } else {
          // Even if the message doesn't create an activity, we should still refresh metrics
          // if it's a session_completed message (for real-time updates)
          if (message.message_type === "session_completed") {
            console.log("📊 DASHBOARD: Session completed (no activity created), refreshing dashboard metrics...");
            loadDashboardData().catch(err => {
              console.error("📊 DASHBOARD: Failed to refresh dashboard metrics:", err);
            });
          } else {
            console.log("📊 DASHBOARD: Skipping activity update (message from self or no sender)");
            console.log("📊 DASHBOARD: isSystemMessage:", isSystemMessage);
            console.log("📊 DASHBOARD: isSender:", isSender);
            console.log("📊 DASHBOARD: hasSender:", !!message.sender);
            console.log("📊 DASHBOARD: message_type:", message.message_type);
            console.log("📊 DASHBOARD: hasContent:", !!message.content);
          }
        }
      };

      // Register the handler
      console.log("📊 DASHBOARD: Registering new_message handler");
      messagingService.on("new_message", dashboardMessageHandler);
      console.log("📊 DASHBOARD: ✅ Real-time activity handler registered");
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
        
        // Setup real-time activity updates - ensure it's set up when messaging service connects
        if (authStore.isAuthenticated) {
          // Try to setup immediately if already connected
          if (messagingService.isConnected) {
            console.log("📊 DASHBOARD: Messaging service already connected, setting up real-time updates");
            setupRealTimeActivityUpdates();
          } else {
            // If not connected yet, wait and retry multiple times
            console.log("📊 DASHBOARD: Messaging service not connected yet, will retry...");
            let retryCount = 0;
            const maxRetries = 5;
            const retryInterval = setInterval(() => {
              retryCount++;
              if (messagingService.isConnected) {
                console.log("📊 DASHBOARD: Messaging service connected after retry, setting up real-time updates");
                setupRealTimeActivityUpdates();
                clearInterval(retryInterval);
              } else if (retryCount >= maxRetries) {
                console.warn("📊 DASHBOARD: Messaging service not connected after", maxRetries, "retries");
                clearInterval(retryInterval);
              }
            }, 1000); // Check every 1 second
          }
        }
      }
    });

    // Watch for authentication changes to setup real-time updates
    watch(
      () => authStore.isAuthenticated,
      (isAuth) => {
        console.log("📊 DASHBOARD: Auth state changed:", isAuth);
        if (isAuth && userId.value) {
          // Setup real-time updates when user logs in
          if (messagingService.isConnected) {
            console.log("📊 DASHBOARD: Messaging service connected, setting up real-time updates");
            setupRealTimeActivityUpdates();
          } else {
            // Wait for connection with retries
            console.log("📊 DASHBOARD: Messaging service not connected, will retry...");
            let retryCount = 0;
            const maxRetries = 5;
            const retryInterval = setInterval(() => {
              retryCount++;
              if (messagingService.isConnected) {
                console.log("📊 DASHBOARD: Messaging service connected after retry, setting up real-time updates");
                setupRealTimeActivityUpdates();
                clearInterval(retryInterval);
              } else if (retryCount >= maxRetries) {
                console.warn("📊 DASHBOARD: Messaging service not connected after", maxRetries, "retries");
                clearInterval(retryInterval);
              }
            }, 1000); // Check every 1 second
          }
        } else if (!isAuth) {
          // Clean up on logout
          if (dashboardMessageHandler) {
            messagingService.off("new_message", dashboardMessageHandler);
            dashboardMessageHandler = null;
          }
        }
      }
    );

    // Also watch for messaging service connection state changes
    // This ensures real-time updates are set up when the service connects
    watch(
      () => authStore.isAuthenticated && messagingService.isConnected,
      (isConnected) => {
        if (isConnected && userId.value && !dashboardMessageHandler) {
          console.log("📊 DASHBOARD: Messaging service connection detected, setting up real-time updates");
          setupRealTimeActivityUpdates();
        }
      },
      { immediate: true }
    );

    // Cleanup on unmount
    onUnmounted(() => {
      console.log("📊 DASHBOARD: Component unmounting, cleaning up handlers");
      if (dashboardMessageHandler) {
        messagingService.off("new_message", dashboardMessageHandler);
        dashboardMessageHandler = null;
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

/* Recent Activity List - Scrollable */
.recent-activity-list {
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
}

.recent-activity-list::-webkit-scrollbar {
  width: 8px;
}

.recent-activity-list::-webkit-scrollbar-track {
  background: rgba(74, 74, 74, 0.3);
  border-radius: 4px;
}

.recent-activity-list::-webkit-scrollbar-thumb {
  background: var(--cyber-orange, #ff8c42);
  border-radius: 4px;
}

.recent-activity-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 140, 66, 0.8);
}

.activity-item {
  transition: all 0.3s ease;
}

.activity-item:hover {
  background: rgba(255, 140, 66, 0.05) !important;
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
