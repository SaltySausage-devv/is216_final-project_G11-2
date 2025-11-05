<template>
  <nav
    class="navbar navbar-expand-lg navbar-dark cyberpunk-navbar fixed-top shadow-sm"
  >
    <div class="container">
      <router-link to="/" class="navbar-brand d-flex align-items-center">
        <i
          class="fas fa-graduation-cap me-2"
          style="color: var(--cyber-orange)"
        ></i>
        <span class="fw-bold">TutorConnect</span>
      </router-link>

      <!-- Mobile Navigation Items Container -->
      <div class="mobile-nav-items d-lg-none">
        <!-- Penalty Points for Tutors - Mobile: Visible in top bar (left of credits) -->
        <div
          class="navbar-penalty-container"
          v-if="isAuthenticated && userType === 'tutor'"
        >
          <a
            class="nav-link d-flex align-items-center"
            href="#"
            role="button"
            data-bs-toggle="tooltip"
            data-bs-placement="bottom"
            :title="`Penalty Points: ${penaltyPoints}`"
          >
            <i class="fas fa-exclamation-triangle fs-5 text-warning"></i>
            <span class="penalty-points-text text-warning ms-1">
              {{ penaltyPoints }}
            </span>
          </a>
        </div>

        <!-- Credits Icon for Students - Mobile: Visible, Desktop: In navbar collapse -->
        <div
          class="navbar-credits-container"
          v-if="isAuthenticated && userType === 'student'"
        >
          <CreditsIcon />
        </div>

        <!-- Credits Icon for Tutors - Mobile: Visible in top bar -->
        <div
          class="navbar-credits-container"
          v-if="isAuthenticated && userType === 'tutor'"
        >
          <CreditsIcon />
        </div>

        <!-- Notifications Icon - Mobile: Visible, Desktop: In navbar collapse -->
        <div class="navbar-notification-container" v-if="isAuthenticated">
          <div class="nav-item dropdown">
            <a
              class="nav-link position-relative d-flex align-items-center"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i class="fas fa-bell fs-5"></i>
              <span v-if="unreadCount > 0" class="notification-badge">
                {{ unreadCount > 9 ? "9+" : unreadCount }}
              </span>
            </a>
            <div class="dropdown-menu dropdown-menu-end notifications-dropdown">
              <div class="notifications-header">
                <h6 class="mb-0">Notifications</h6>
                <span class="text-muted small"
                  >{{ notifications.length }} total</span
                >
              </div>
              <div class="notifications-body">
                <div v-if="notifications.length === 0" class="text-center py-4">
                  <i class="fas fa-bell-slash text-muted fs-1 mb-2"></i>
                  <p class="text-muted mb-0 small">No notifications</p>
                </div>
                <div v-else>
                  <div
                    v-for="notification in displayedNotifications"
                    :key="notification.id"
                    class="notification-item"
                    :class="{ 'notification-unread': notification.unread }"
                    @click.stop="handleNotificationClick(notification)"
                  >
                    <div class="notification-icon-wrapper">
                      <i :class="notification.icon"></i>
                    </div>
                    <div class="notification-content">
                      <p class="notification-title">{{ notification.title }}</p>
                      <small class="notification-time">{{
                        notification.time
                      }}</small>
                    </div>
                    <div
                      v-if="notification.unread"
                      class="notification-dot"
                    ></div>
                  </div>
                  <div
                    v-if="hasMoreNotifications"
                    class="notification-view-all"
                    @click.stop="toggleShowAllNotifications"
                  >
                    <button class="btn btn-sm w-100" type="button">
                      <i
                        :class="
                          showAllNotifications
                            ? 'fas fa-chevron-up'
                            : 'fas fa-chevron-down'
                        "
                        class="me-2"
                      ></i>
                      {{
                        showAllNotifications
                          ? "Show Less"
                          : `View All (${notifications.length})`
                      }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          class="navbar-toggler cyberpunk-hamburger"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          @click="toggleNavbar"
          :aria-expanded="isNavbarExpanded"
          aria-controls="navbarNav"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
      </div>

      <div
        class="collapse navbar-collapse"
        :class="{ show: isNavbarExpanded }"
        id="navbarNav"
        @click.self="toggleNavbar"
      >
        <ul class="navbar-nav me-auto">
          <li
            class="nav-item"
            v-if="userType === 'student' || !isAuthenticated"
          >
            <router-link to="/search" class="nav-link" @click="closeNavbar">
              <i class="fas fa-search me-1"></i>
              Find Tutors
            </router-link>
          </li>
          <li class="nav-item">
            <router-link
              to="/dashboard"
              class="nav-link"
              v-if="isAuthenticated"
              @click="closeNavbar"
            >
              <i class="fas fa-tachometer-alt me-1"></i>
              Dashboard
            </router-link>
          </li>
        </ul>

        <ul class="navbar-nav">
          <!-- Credits Icon for Students - Desktop view -->
          <li
            class="nav-item d-none d-lg-block"
            v-if="isAuthenticated && userType === 'student'"
          >
            <CreditsIcon />
          </li>

          <li class="nav-item" v-if="!isAuthenticated">
            <router-link to="/login" class="nav-link" @click="closeNavbar">
              <i class="fas fa-sign-in-alt me-1"></i>
              Login
            </router-link>
          </li>
          <li class="nav-item" v-if="!isAuthenticated">
            <router-link to="/register" class="nav-link" @click="closeNavbar">
              <i class="fas fa-user-plus me-1"></i>
              Sign Up
            </router-link>
          </li>

          <!-- Penalty Points (Tutors Only) - Desktop only (mobile shows in top bar) -->
          <li
            class="nav-item d-none d-lg-block"
            v-if="isAuthenticated && userType === 'tutor'"
          >
            <a
              class="nav-link d-flex align-items-center"
              href="#"
              role="button"
              data-bs-toggle="tooltip"
              data-bs-placement="bottom"
              :title="`Penalty Points: ${penaltyPoints}`"
            >
              <i class="fas fa-exclamation-triangle fs-5 me-1 text-warning"></i>
              <span class="penalty-points-text text-warning">
                {{ penaltyPoints }}
              </span>
            </a>
          </li>

          <!-- Credits Icon for Tutors - Desktop view (between penalty points and notifications) -->
          <li
            class="nav-item d-none d-lg-block"
            v-if="isAuthenticated && userType === 'tutor'"
          >
            <CreditsIcon />
          </li>

          <!-- Notifications Dropdown - Desktop only -->
          <li
            class="nav-item dropdown d-none d-lg-block"
            v-if="isAuthenticated"
          >
            <a
              class="nav-link position-relative d-flex align-items-center"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i class="fas fa-bell fs-5 me-2"></i>
              <span class="notification-text">Notifications</span>
              <span v-if="unreadCount > 0" class="notification-badge">
                {{ unreadCount > 9 ? "9+" : unreadCount }}
              </span>
            </a>
            <div class="dropdown-menu dropdown-menu-end notifications-dropdown">
              <div class="notifications-header">
                <h6 class="mb-0">Notifications</h6>
                <span class="text-muted small"
                  >{{ notifications.length }} total</span
                >
              </div>
              <div class="notifications-body">
                <div v-if="notifications.length === 0" class="text-center py-4">
                  <i class="fas fa-bell-slash text-muted fs-1 mb-2"></i>
                  <p class="text-muted mb-0 small">No notifications</p>
                </div>
                <div v-else>
                  <div
                    v-for="notification in displayedNotifications"
                    :key="notification.id"
                    class="notification-item"
                    :class="{ 'notification-unread': notification.unread }"
                    @click.stop="handleNotificationClick(notification)"
                  >
                    <div class="notification-icon-wrapper">
                      <i :class="notification.icon"></i>
                    </div>
                    <div class="notification-content">
                      <p class="notification-title">{{ notification.title }}</p>
                      <small class="notification-time">{{
                        notification.time
                      }}</small>
                    </div>
                    <div
                      v-if="notification.unread"
                      class="notification-dot"
                    ></div>
                  </div>
                  <!-- View All Button -->
                  <div
                    v-if="hasMoreNotifications"
                    class="notification-view-all"
                    @click.stop="toggleShowAllNotifications"
                  >
                    <button class="btn btn-sm w-100" type="button">
                      <i
                        :class="
                          showAllNotifications
                            ? 'fas fa-chevron-up'
                            : 'fas fa-chevron-down'
                        "
                        class="me-2"
                      ></i>
                      {{
                        showAllNotifications
                          ? "Show Less"
                          : `View All (${notifications.length})`
                      }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </li>

          <li class="nav-item dropdown" v-if="isAuthenticated">
            <a
              class="nav-link dropdown-toggle d-flex align-items-center"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i class="fas fa-user-circle me-2"></i>
              {{ user?.firstName }}
            </a>
            <ul class="dropdown-menu">
              <li>
                <router-link to="/profile" class="dropdown-item" @click="closeNavbar">
                  <i class="fas fa-user me-2"></i>
                  Profile
                </router-link>
              </li>
              <li>
                <router-link to="/messages" class="dropdown-item" @click="closeNavbar">
                  <i class="fas fa-envelope me-2"></i>
                  Messages
                </router-link>
              </li>
              <li>
                <router-link to="/calendar" class="dropdown-item" @click="closeNavbar">
                  <i class="fas fa-calendar me-2"></i>
                  Calendar
                </router-link>
              </li>
              <li>
                <router-link to="/analytics" class="dropdown-item" @click="closeNavbar">
                  <i class="fas fa-chart-line me-2"></i>
                  Analytics
                </router-link>
              </li>
              <li><hr class="dropdown-divider" /></li>
              <li>
                <a
                  href="#"
                  @click.prevent="logout"
                  class="dropdown-item text-danger"
                >
                  <i class="fas fa-sign-out-alt me-2"></i>
                  Logout
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { animate, stagger, spring } from "animejs";
import messagingService from "../services/messaging.js";
import CreditsIcon from "./CreditsIcon.vue";

export default {
  name: "Navbar",
  components: {
    CreditsIcon,
  },
  setup() {
    const authStore = useAuthStore();
    const router = useRouter();
    const isNavbarExpanded = ref(false);

    const isAuthenticated = computed(() => authStore.isAuthenticated);
    const user = computed(() => authStore.user);
    const userType = computed(() => authStore.userType);
    const currentUserId = computed(() => authStore.user?.id);
    const penaltyPoints = computed(() => authStore.user?.penalty_points || 0);

    // Notification state
    const NOTIFICATIONS_STORAGE_KEY = "tutorconnect_notifications";
    const notifications = ref([]);
    const showAllNotifications = ref(false);
    let messageHandler = null;

    // Watch for any changes to notifications array (debugging)
    watch(
      () => notifications.value.length,
      (newCount, oldCount) => {
        console.log(`🔔 NAVBAR: 🔄 Notifications count changed: ${oldCount} → ${newCount}`);
        if (newCount < oldCount) {
          console.warn(`🔔 NAVBAR: ⚠️ Notifications DECREASED! Possible clear/overwrite`);
          console.trace("Stack trace:");
        }
      }
    );

    // Helper function to get correct icon based on notification type
    const getIconForNotificationType = (notification) => {
      const messageType = notification.type || notification.message_type;
      
      if (messageType === 'booking_offer' || messageType === 'booking_request') {
        return "fas fa-calendar-alt";
      } else if (messageType === 'booking_proposal') {
        return "fas fa-calendar-alt";
      } else if (messageType === 'booking_confirmation') {
        return "fas fa-calendar-check text-success";
      } else if (messageType === 'booking_cancelled') {
        return "fas fa-calendar-times text-danger";
      } else if (messageType === 'reschedule_request') {
        return "fas fa-calendar-alt text-warning";
      } else if (messageType === 'reschedule_accepted') {
        return "fas fa-calendar-check text-success";
      } else if (messageType === 'reschedule_rejected') {
        return "fas fa-calendar-times text-danger";
      } else if (messageType === 'session_completed') {
        return "fas fa-check-double text-success";
      } else if (messageType === 'image') {
        return "fas fa-image";
      } else {
        // Default: calendar icon for regular messages
        return "fas fa-calendar-alt";
      }
    };

    // Load notifications from localStorage on init
    const loadNotificationsFromStorage = () => {
      try {
        console.log("🔔 NAVBAR: 📖 Loading notifications from localStorage...");
        const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        console.log("🔔 NAVBAR: Raw stored data:", stored ? stored.substring(0, 100) + '...' : 'null');
        
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log("🔔 NAVBAR: Parsed array length:", parsed.length);
          
          // Filter out notifications older than 7 days and recalculate time
          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          notifications.value = parsed
            .filter((n) => {
              const notifTime = new Date(n.timestamp || n.created_at || 0).getTime();
              return notifTime > sevenDaysAgo;
            })
            .map((n) => {
              // Recalculate time from timestamp (fixes "Just now" issue for old notifications)
              const timestamp = n.timestamp || n.created_at;
              if (timestamp) {
                n.time = formatTime(timestamp);
                // Ensure timestamp field exists
                if (!n.timestamp) {
                  n.timestamp = timestamp;
                }
              }
              // Update icon based on notification type (fixes old mail icons)
              n.icon = getIconForNotificationType(n);
              return n;
            });
          
          console.log(
            "🔔 NAVBAR: ✅ Loaded",
            notifications.value.length,
            "notifications from storage"
          );
          console.log("🔔 NAVBAR: Loaded IDs:", notifications.value.map(n => n.id).join(', '));
        } else {
          console.log("🔔 NAVBAR: No stored notifications found");
        }
      } catch (error) {
        console.error(
          "🔔 NAVBAR: ❌ Error loading notifications from storage:",
          error
        );
        notifications.value = [];
      }
    };

    // Save notifications to localStorage
    const saveNotificationsToStorage = () => {
      try {
        console.log("🔔 NAVBAR: 💾 Starting save...");
        console.log("🔔 NAVBAR: Saving", notifications.value.length, "notifications");
        console.log("🔔 NAVBAR: IDs to save:", notifications.value.map(n => n.id));
        
        const notificationsData = JSON.stringify(notifications.value);
        console.log("🔔 NAVBAR: Stringified data size:", notificationsData.length, "bytes");
        
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, notificationsData);
        console.log("🔔 NAVBAR: ✅ localStorage.setItem() completed");
        
        // Verify the save worked by reading back
        const verifyRead = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (!verifyRead) {
          console.error("🔔 NAVBAR: ❌ Storage verification failed - data not persisted!");
          return;
        }
        
        const verifyParsed = JSON.parse(verifyRead);
        console.log("🔔 NAVBAR: ✅ Verified:", verifyParsed.length, "notifications in storage");
        console.log("🔔 NAVBAR: ✅ Verified IDs:", verifyParsed.map(n => n.id));
        
        if (verifyParsed.length !== notifications.value.length) {
          console.error("🔔 NAVBAR: ❌ COUNT MISMATCH! Tried to save", notifications.value.length, "but storage has", verifyParsed.length);
        }
      } catch (error) {
        console.error(
          "🔔 NAVBAR: ❌ Error saving notifications to storage:",
          error
        );
        // Check if it's a quota exceeded error
        if (error.name === 'QuotaExceededError') {
          console.error("🔔 NAVBAR: ⚠️ LocalStorage quota exceeded! Clearing old notifications...");
          // Keep only the 5 most recent notifications if quota exceeded
          notifications.value = notifications.value.slice(0, 5);
          try {
            localStorage.setItem(
              NOTIFICATIONS_STORAGE_KEY,
              JSON.stringify(notifications.value)
            );
            console.log("🔔 NAVBAR: ✅ Saved reduced notification set (5 notifications)");
          } catch (retryError) {
            console.error("🔔 NAVBAR: ❌ Still failed after reducing notifications:", retryError);
          }
        }
      }
    };

    // Notification computed properties
    const displayedNotifications = computed(() => {
      if (showAllNotifications.value) {
        return notifications.value;
      }
      return notifications.value.slice(0, 5);
    });

    const hasMoreNotifications = computed(() => {
      return notifications.value.length > 5;
    });

    const unreadCount = computed(() => {
      return notifications.value.filter((n) => n.unread).length;
    });

    const toggleShowAllNotifications = () => {
      showAllNotifications.value = !showAllNotifications.value;
    };

    // Calculates: current time - timestamp, rounds to 2 decimal places
    const formatTime = (timestamp) => {
      if (!timestamp) return "Just now";

      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "Just now";

      const now = new Date();
      const diff = now - date;

      // Calculate precise differences
      const diffSecs = diff / 1000;
      const diffMins = diff / 60000;
      const diffHours = diff / 3600000;
      const diffDays = diff / 86400000;

      // Show "Just now" for less than 5 seconds
      if (diffSecs < 5) return "Just now";
      
      // For less than 1 minute: show seconds with 2 decimal places
      if (diffMins < 1) {
        const roundedSecs = Math.round(diffSecs * 100) / 100; // Round to 2dp
        return `${roundedSecs.toFixed(2)}s ago`;
      }
      
      // For less than 1 hour: show minutes with 2 decimal places
      if (diffHours < 1) {
        const roundedMins = Math.round(diffMins * 100) / 100; // Round to 2dp
        return `${roundedMins.toFixed(2)} min ago`;
      }
      
      // For less than 24 hours: show hours with 2 decimal places
      if (diffDays < 1) {
        const roundedHours = Math.round(diffHours * 100) / 100; // Round to 2dp
        return `${roundedHours.toFixed(2)}h ago`;
      }
      
      // For yesterday: show "Yesterday"
      if (diffDays < 2) return "Yesterday";
      
      // For older: show the actual date
      return date.toLocaleDateString();
    };

    const handleNotificationClick = async (notification) => {
      // For session_completed notifications, navigate to calendar
      if (notification.type === 'session_completed' && notification.bookingId) {
        console.log(
          "🔔 NAVBAR: Clicked session_completed notification, navigating to calendar with bookingId:",
          notification.bookingId
        );

        // Mark the message as read in the database
        if (notification.conversationId) {
          try {
            console.log(`🔔 NAVBAR: Marking session_completed message as read for conversation: ${notification.conversationId}`);
            await messagingService.markAsRead(notification.conversationId);
            console.log(`🔔 NAVBAR: ✅ Session_completed message marked as read`);
          } catch (error) {
            console.error(`🔔 NAVBAR: ❌ Error marking session_completed message as read:`, error);
          }
        }

        // Remove this notification
        notifications.value = notifications.value.filter(
          (n) => n.id !== notification.id
        );

        // Save updated state to localStorage
        saveNotificationsToStorage();

        // Close dropdown
        const dropdowns = document.querySelectorAll(".dropdown-menu.show");
        dropdowns.forEach((dropdown) => dropdown.classList.remove("show"));

        // Navigate to calendar page
        router.push(`/calendar`);
        return;
      }

      // For all other notifications, navigate to messages to show the card
      if (notification.conversationId) {
        console.log(
          "🔔 NAVBAR: Clicked notification for conversation:",
          notification.conversationId
        );

        // Mark messages as read in the database
        try {
          console.log(`🔔 NAVBAR: Marking messages as read for conversation: ${notification.conversationId}`);
          await messagingService.markAsRead(notification.conversationId);
          console.log(`🔔 NAVBAR: ✅ Messages marked as read`);
        } catch (error) {
          console.error(`🔔 NAVBAR: ❌ Error marking messages as read:`, error);
        }

        // Remove this specific notification
        notifications.value = notifications.value.filter(
          (n) => n.id !== notification.id
        );

        // Save updated state to localStorage
        saveNotificationsToStorage();

        // Close dropdown
        const dropdowns = document.querySelectorAll(".dropdown-menu.show");
        dropdowns.forEach((dropdown) => dropdown.classList.remove("show"));

        // Navigate to messages page with conversation
        router.push(`/messages?conversation=${notification.conversationId}`);
      }
    };

    // Load unread messages from conversations and add to notifications
    const loadUnreadMessagesAsNotifications = async () => {
      try {
        console.log("🔔 NAVBAR: 📥 Loading unread messages from conversations...");
        console.log("🔔 NAVBAR: Current notifications count BEFORE loading unread:", notifications.value.length);
        
        const response = await messagingService.getConversations();

        if (!response.conversations || response.conversations.length === 0) {
          console.log("🔔 NAVBAR: No conversations found");
          // Clear all notifications if no conversations exist
          notifications.value = [];
          saveNotificationsToStorage();
          return;
        }

        console.log(
          `🔔 NAVBAR: Found ${response.conversations.length} conversations`
        );

        // Track message IDs that are currently read on the server
        const readMessageIds = new Set();
        let removedCount = 0;

        // Find conversations with unread messages OR conversations that have existing notifications
        const conversationsWithUnread = response.conversations.filter(
          (conv) => conv.unreadCount > 0
        );
        
        // Get conversation IDs that have existing notifications (to check their read status)
        const conversationIdsWithNotifications = new Set(
          notifications.value
            .map(n => n.conversationId)
            .filter(Boolean)
        );

        // Check conversations that have existing notifications OR unread messages to verify read status
        const conversationsToCheck = response.conversations.filter(conv => 
          conversationIdsWithNotifications.has(conv.id) || conversationsWithUnread.find(c => c.id === conv.id)
        );

        for (const conv of conversationsToCheck) {
          try {
            // Fetch messages for this conversation to check read status
            const messagesResponse = await messagingService.getMessages(conv.id, 1, 50);
            
            if (messagesResponse.messages && messagesResponse.messages.length > 0) {
              // Find all messages that are read by current user
              messagesResponse.messages.forEach(msg => {
                const isRead = msg.read_at && (
                  msg.read_by?.includes(currentUserId.value) || 
                  (Array.isArray(msg.read_by) && msg.read_by.some(id => String(id) === String(currentUserId.value)))
                );
                if (isRead) {
                  readMessageIds.add(msg.id);
                }
              });
            }
          } catch (msgError) {
            console.error(
              `🔔 NAVBAR: ❌ Error fetching messages for conversation ${conv.id}:`,
              msgError
            );
            // Continue with next conversation even if one fails
          }
        }

        // Remove notifications for messages that are now read
        // BUT keep reschedule and session_completed notifications visible - they're important status updates
        if (readMessageIds.size > 0) {
          const beforeCount = notifications.value.length;
          notifications.value = notifications.value.filter(
            (n) =>
              !readMessageIds.has(n.id) ||
              n.type === "reschedule_request" ||
              n.type === "reschedule_accepted" ||
              n.type === "reschedule_rejected" ||
              n.type === "session_completed"
          );
          removedCount = beforeCount - notifications.value.length;
          
          if (removedCount > 0) {
            console.log(
              `🔔 NAVBAR: 🗑️ Removed ${removedCount} notification(s) for read messages (kept reschedule notifications)`
            );
          }
        }

        // Also check for unread session_completed messages and add them as notifications
        // This ensures students see notifications even if they weren't connected when the message was sent
        console.log(`🔔 NAVBAR: Checking for unread session_completed messages...`);
        let addedNotifications = 0;
        // Check ALL conversations for session_completed messages, not just those with unreadCount > 0
        // because session_completed might be the only message in a conversation
        for (const conv of response.conversations) {
          try {
            const messagesResponse = await messagingService.getMessages(conv.id, 1, 50);
            
            if (messagesResponse.messages && messagesResponse.messages.length > 0) {
              messagesResponse.messages.forEach(msg => {
                // Check if this is a session_completed message
                if (msg.message_type === 'session_completed') {
                  // Check if current user is NOT the sender (should be student, not tutor)
                  const isSender = String(msg.sender_id) === String(currentUserId.value);
                  
                  if (!isSender) {
                    // Check if message is already read
                    // If read_at is set, it means the recipient (current user) has read it
                    const isAlreadyRead = msg.read_at !== null && msg.read_at !== undefined;
                    
                    if (isAlreadyRead) {
                      console.log(`🔔 NAVBAR: Skipping session_completed message - already read (read_at: ${msg.read_at}):`, msg.id);
                      return;
                    }
                    
                    // Check if we already have this notification
                    const existingNotification = notifications.value.find(
                      (n) => n.id === msg.id
                    );
                    
                    if (!existingNotification) {
                      console.log(`🔔 NAVBAR: Found unread session_completed message, creating notification:`, msg.id);
                      
                      // Parse message content
                      let messagePreview = "✅ Session marked as completed";
                      let bookingId = null;
                      try {
                        const messageData = JSON.parse(msg.content);
                        const tutorName = messageData.tutorName || 'Your tutor';
                        messagePreview = `✅ ${tutorName} marked your session as completed`;
                        bookingId = messageData.bookingId || null;
                      } catch (error) {
                        console.error('Failed to parse session_completed message:', error);
                      }
                      
                      // Create notification
                      const notification = {
                        id: msg.id,
                        icon: "fas fa-check-double text-success",
                        title: messagePreview,
                        message: messagePreview,
                        time: formatTime(msg.created_at),
                        timestamp: msg.created_at,
                        conversationId: msg.conversation_id,
                        bookingId: bookingId,
                        type: msg.message_type,
                        unread: true,
                      };
                      
                      // Add to notifications
                      notifications.value = [notification, ...notifications.value];
                      addedNotifications++;
                      console.log(`🔔 NAVBAR: ✅ Added session_completed notification from database`);
                    }
                  }
                }
              });
            }
          } catch (msgError) {
            console.error(`🔔 NAVBAR: Error checking messages for session_completed:`, msgError);
          }
        }
        
        if (addedNotifications > 0) {
          console.log(`🔔 NAVBAR: Added ${addedNotifications} session_completed notification(s) from database`);
        }
        
        console.log(
          `🔔 NAVBAR: ${conversationsWithUnread.length} conversations have unread messages`
        );

        // Sort notifications by timestamp (most recent first)
        notifications.value.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        console.log("🔔 NAVBAR: Current notifications count AFTER sync:", notifications.value.length);
        console.log("🔔 NAVBAR: Removed", removedCount, "read notifications");

        // Limit to last 20 notifications
        if (notifications.value.length > 20) {
          console.log("🔔 NAVBAR: Trimming from", notifications.value.length, "to 20");
          notifications.value = notifications.value.slice(0, 20);
        }

        // Save to localStorage if there were any changes (removed read notifications or added new ones)
        if (removedCount > 0 || addedNotifications > 0) {
          console.log("🔔 NAVBAR: 💾 Saving notifications after sync");
          saveNotificationsToStorage();
          console.log(
            `🔔 NAVBAR: ✅ Sync complete - ${removedCount} read notification(s) removed, ${addedNotifications} session_completed notification(s) added, total now: ${notifications.value.length}`
          );
        }
      } catch (error) {
        console.error("🔔 NAVBAR: ❌ Error loading unread messages:", error);
      }
    };

    const setupMessageNotifications = () => {
      console.log("🔔 NAVBAR: Setting up message notifications");
      console.log("🔔 NAVBAR: Current userId:", currentUserId.value);
      console.log(
        "🔔 NAVBAR: Messaging service connected?",
        messagingService.isConnected
      );
      console.log(
        "🔔 NAVBAR: Auth token exists?",
        !!authStore.session?.access_token
      );

      // Remove old handler if it exists
      if (messageHandler) {
        console.log("🔔 NAVBAR: Removing existing handler");
        messagingService.off("new_message", messageHandler);
        messageHandler = null;
      }

      // Create new handler for navbar notifications
      messageHandler = (message) => {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🔔 NAVBAR: 📨 SOCKET.IO MESSAGE RECEIVED!");
        console.log("🔔 NAVBAR: Message ID:", message.id);
        console.log("🔔 NAVBAR: Message type:", message.message_type);
        console.log("🔔 NAVBAR: Message sender_id:", message.sender_id);
        console.log("🔔 NAVBAR: Current user_id:", currentUserId.value);
        console.log("🔔 NAVBAR: Full message:", message);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        // Check if this is a system message (reschedule_request, booking_cancelled, etc.)
        const isSystemMessage = 
          message.message_type === 'reschedule_request' ||
          message.message_type === 'reschedule_accepted' ||
          message.message_type === 'reschedule_rejected' ||
          message.message_type === 'booking_cancelled' ||
          message.message_type === 'session_completed';

        // For booking-related messages (proposal, confirmation, offer), only notify the receiver (not the sender)
        const isBookingMessage =
          message.message_type === 'booking_cancelled' ||
          message.message_type === 'booking_proposal' ||
          message.message_type === 'booking_confirmation' ||
          message.message_type === 'booking_offer' ||
          message.message_type === 'session_completed';

        // For reschedule requests, only notify the RECEIVER (not the requester/sender)
        const isRescheduleMessage = 
          message.message_type === 'reschedule_request' ||
          message.message_type === 'reschedule_accepted' ||
          message.message_type === 'reschedule_rejected';

        // Check if current user is the sender (using String() to handle UUID type mismatches)
        const isSender = String(message.sender_id) === String(currentUserId.value);

        // Extra logging for reschedule messages
        if (isRescheduleMessage) {
          console.log("🔔 NAVBAR: Reschedule message details:", {
            messageType: message.message_type,
            senderId: message.sender_id,
            currentUserId: currentUserId.value,
            isSender: isSender,
            senderIdType: typeof message.sender_id,
            currentUserIdType: typeof currentUserId.value
          });
        }

        // Determine if we should show notification
        let shouldShow = false;
        if (isBookingMessage) {
          // Booking messages: only show to receiver (not sender)
          shouldShow = !isSender;
        } else if (isRescheduleMessage) {
          // Reschedule messages: only notify receiver (not sender)
          // EXTRA SAFETY: Never show reschedule_accepted or reschedule_rejected to the person who clicked the button
          if (message.message_type === 'reschedule_accepted' || message.message_type === 'reschedule_rejected') {
            // These are responses - only show to the person who SENT the original request (not the responder)
            shouldShow = !isSender;
            console.log("🔔 NAVBAR: Reschedule response - shouldShow (not sender):", shouldShow);
          } else {
            // reschedule_request - show to receiver
            shouldShow = !isSender;
            console.log("🔔 NAVBAR: Reschedule request - shouldShow:", shouldShow);
          }
        } else if (isSystemMessage) {
          // Other system messages: notify receiver (not sender)
          // For session_completed, only show to student (not the tutor who marked it)
          if (message.message_type === 'session_completed') {
            shouldShow = !isSender;
            console.log("🔔 NAVBAR: session_completed MESSAGE DETECTED!");
            console.log("🔔 NAVBAR: sender_id:", message.sender_id, "(type:", typeof message.sender_id, ")");
            console.log("🔔 NAVBAR: currentUserId:", currentUserId.value, "(type:", typeof currentUserId.value, ")");
            console.log("🔔 NAVBAR: isSender:", isSender);
            console.log("🔔 NAVBAR: userType:", userType.value);
            console.log("🔔 NAVBAR: shouldShow:", shouldShow);
            console.log("🔔 NAVBAR: message content:", message.content);
          } else {
            shouldShow = !isSender;
          }
        } else {
          // Regular messages: notify if not from yourself and has sender
          shouldShow = !isSender && message.sender;
        }

        if (shouldShow) {
          // Check if message has already been read by current user
          // BUT: Don't filter out session_completed messages even if read - they're important status updates
          const isSessionCompleted = message.message_type === 'session_completed';
          const isAlreadyRead = !isSessionCompleted && message.read_at && (
            message.read_by?.includes(currentUserId.value) || 
            (Array.isArray(message.read_by) && message.read_by.some(id => String(id) === String(currentUserId.value)))
          );

          if (isAlreadyRead) {
            console.log(
              "🔔 NAVBAR: ⏭️ Skipping notification - message already read by current user:",
              message.id
            );
            return; // Don't add notification if message is already read
          }
          
          if (isSessionCompleted) {
            console.log("🔔 NAVBAR: ✅ session_completed passed all checks, proceeding to create notification");
          }

          console.log("🔔 NAVBAR: Message is from another user or system message, creating notification");

          // Format sender name
          let senderName = "System";
          if (message.sender) {
            senderName = `${message.sender.first_name} ${message.sender.last_name}`;
          } else if (isSystemMessage) {
            senderName = "System";
          }

          // Format message preview based on message type
          let messagePreview;
          if (message.message_type === "image") {
            messagePreview = "📷 Sent an image";
          } else if (message.message_type === "reschedule_request") {
            messagePreview = "📅 Reschedule booking request";
          } else if (message.message_type === "reschedule_accepted") {
            messagePreview = "✅ Reschedule request accepted";
          } else if (message.message_type === "reschedule_rejected") {
            messagePreview = "❌ Reschedule request declined";
          } else if (message.message_type === "booking_offer" || message.message_type === "booking_request") {
            messagePreview = "📋 Booking request";
          } else if (message.message_type === "booking_proposal") {
            messagePreview = "📝 Booking proposal";
          } else if (message.message_type === "booking_confirmation") {
            messagePreview = "✅ Booking confirmed";
          } else if (message.message_type === "booking_cancelled") {
            messagePreview = "❌ Booking cancelled";
          } else if (message.message_type === "session_completed") {
            try {
              const messageData = JSON.parse(message.content);
              const tutorName = messageData.tutorName || 'Your tutor';
              messagePreview = `✅ ${tutorName} marked your session as completed`;
            } catch (error) {
              messagePreview = "✅ Session marked as completed";
            }
          } else if (message.content) {
            messagePreview = message.content.substring(0, 50);
          } else {
            messagePreview = "New message";
          }

          // Format title based on message type
          let title;
          if (isSystemMessage) {
            title = messagePreview;
          } else if (message.message_type === "booking_offer" || message.message_type === "booking_request") {
            // Booking request: show "Booking request" as title
            title = "Booking request";
          } else if (message.message_type === "booking_proposal") {
            // Booking proposal: show "Booking proposal" as title
            title = "Booking proposal";
          } else if (message.message_type === "booking_confirmation") {
            // Booking confirmation: show "New booking confirmed" as title
            title = "New booking confirmed";
          } else {
            // Regular messages: show "New message from sender"
            title = `New message from ${senderName}`;
          }

          // Extract bookingId from reschedule and session_completed messages for calendar navigation
          let bookingId = null;
          if ((message.message_type === 'reschedule_request' || 
               message.message_type === 'reschedule_accepted' || 
               message.message_type === 'reschedule_rejected' ||
               message.message_type === 'session_completed') && message.content) {
            try {
              const messageData = JSON.parse(message.content);
              bookingId = messageData.bookingId || null;
            } catch (error) {
              console.error('Failed to parse message content:', error);
            }
          }

          // Determine icon based on message type
          // Use calendar icons for booking-related notifications
          let iconClass = "fas fa-calendar-alt"; // Default calendar icon for regular messages
          if (message.message_type === 'booking_offer' || message.message_type === 'booking_request') {
            // Booking request: use calendar icon
            iconClass = "fas fa-calendar-alt";
          } else if (message.message_type === 'booking_proposal') {
            // Booking proposal: use calendar icon
            iconClass = "fas fa-calendar-alt";
          } else if (message.message_type === 'booking_confirmation') {
            // New booking confirmed: use green calendar with checkmark
            iconClass = "fas fa-calendar-check text-success";
          } else if (message.message_type === 'booking_cancelled') {
            iconClass = "fas fa-calendar-times text-danger";
          } else if (message.message_type === 'reschedule_request') {
            iconClass = "fas fa-calendar-alt text-warning";
          } else if (message.message_type === 'reschedule_accepted') {
            iconClass = "fas fa-calendar-check text-success";
          } else if (message.message_type === 'reschedule_rejected') {
            iconClass = "fas fa-calendar-times text-danger";
          } else if (message.message_type === 'session_completed') {
            iconClass = "fas fa-check-double text-success";
          } else if (isSystemMessage) {
            iconClass = "fas fa-bell";
          } else if (message.message_type === 'image') {
            iconClass = "fas fa-image";
          } else {
            // Default: calendar icon for regular messages
            iconClass = "fas fa-calendar-alt";
          }

          // Check if we already have this notification (prevent duplicates)
          const existingNotificationIndex = notifications.value.findIndex(
            (n) => n.id === message.id
          );

          if (existingNotificationIndex !== -1) {
            console.log(
              "🔔 NAVBAR: Notification already exists, skipping duplicate:",
              message.id
            );
            return; // Skip adding duplicate
          }

          // Add to notifications list
          const notification = {
            id: message.id,
            icon: iconClass,
            title: title,
            message: messagePreview,
            time: formatTime(message.created_at),
            timestamp: message.created_at,
            conversationId: message.conversation_id,
            bookingId: bookingId, // Store bookingId for reschedule_request and session_completed notifications
            type: message.message_type, // Store message type to filter reschedule responses
            unread: true,
          };

          console.log("🔔 NAVBAR: Before adding - current count:", notifications.value.length);
          console.log("🔔 NAVBAR: Current IDs:", notifications.value.map(n => n.id));
          console.log("🔔 NAVBAR: New notification to add:", {
            id: notification.id,
            title: notification.title,
            type: message.message_type,
            messageType: message.message_type,
            bookingId: bookingId
          });
          
          if (message.message_type === 'session_completed') {
            console.log("🔔 NAVBAR: ⭐⭐⭐ SESSION_COMPLETED NOTIFICATION CREATED ⭐⭐⭐");
            console.log("🔔 NAVBAR: Notification details:", notification);
            console.log("🔔 NAVBAR: Message details:", {
              id: message.id,
              sender_id: message.sender_id,
              message_type: message.message_type,
              content: message.content
            });
          }

          // Add to beginning of notifications array (most recent first)
          // Create a NEW array to ensure Vue reactivity
          notifications.value = [notification, ...notifications.value];

          console.log("🔔 NAVBAR: After adding - new count:", notifications.value.length);
          console.log("🔔 NAVBAR: New IDs:", notifications.value.map(n => n.id));
          
          // Verify the notification was actually added
          const wasAdded = notifications.value.some(n => n.id === notification.id);
          if (!wasAdded) {
            console.error("🔔 NAVBAR: ❌ CRITICAL: Notification was NOT added to array!");
            return;
          }
          console.log("🔔 NAVBAR: ✅ Verified notification was added");

          // Limit to last 20 notifications
          if (notifications.value.length > 20) {
            console.log("🔔 NAVBAR: Trimming from", notifications.value.length, "to 20");
            notifications.value = notifications.value.slice(0, 20);
          }

          console.log(
            "🔔 NAVBAR: ✅ Final total before save:",
            notifications.value.length
          );

          // Save to localStorage
          saveNotificationsToStorage();

          console.log("🔔 NAVBAR: All notification IDs after save:", 
            notifications.value.map(n => n.id).join(', ')
          );
          
          // Toast notifications completely disabled - only navbar notifications inbox is used
          console.log("🔔 NAVBAR: Notification added to inbox only (no toast)");
        } else {
          console.log(
            "🔔 NAVBAR: ⏭️ Skipping notification (message from self or conditions not met)"
          );
        }
      };

      // Register the new_message handler
      console.log("🔔 NAVBAR: 🎯 Registering new_message handler...");
      messagingService.on("new_message", messageHandler);
      console.log("🔔 NAVBAR: ✅ Message handler registered successfully");
      console.log("🔔 NAVBAR: Handler function:", messageHandler ? "EXISTS" : "NULL");

      // Also listen for messages_read event to clear notifications when user opens conversation
      messagingService.on("messages_read", (data) => {
        console.log(
          "🔔 NAVBAR: Messages marked as read for conversation:",
          data.conversationId
        );

        // Remove notifications from this conversation
        // BUT keep reschedule and session_completed notifications visible - they're important status updates
        const beforeCount = notifications.value.length;
        notifications.value = notifications.value.filter(
          (n) =>
            n.conversationId !== data.conversationId ||
            (n.type === "reschedule_request" ||
              n.type === "reschedule_accepted" ||
              n.type === "reschedule_rejected" ||
              n.type === "session_completed")
        );
        const afterCount = notifications.value.length;
        const removedCount = beforeCount - afterCount;

          if (removedCount > 0) {
            console.log(
              `🔔 NAVBAR: Auto-cleared ${removedCount} notification(s) from conversation ${data.conversationId} (kept reschedule notifications)`
            );
          saveNotificationsToStorage();
        }
      });

      // Verify handler was registered
      const handlerCount =
        messagingService.messageHandlers?.get("new_message")?.length || 0;
      console.log("🔔 NAVBAR: Total new_message handlers:", handlerCount);
    };

    const logout = async () => {
      console.log("🚪 Navbar: Starting logout process...");

      // Clear auth state and wait for Supabase to sign out
      await authStore.logout();

      console.log("🚪 Navbar: Logout completed, redirecting to home...");

      // Navigate to home page with full page reload
      window.location.assign("/");
    };

    // Custom toggle function as fallback
    const toggleNavbar = () => {
      isNavbarExpanded.value = !isNavbarExpanded.value;
      const navbarCollapse = document.getElementById("navbarNav");
      if (navbarCollapse) {
        if (isNavbarExpanded.value) {
          navbarCollapse.classList.add("show");
        } else {
          navbarCollapse.classList.remove("show");
        }
      }
    };

    // Close navbar
    const closeNavbar = () => {
      isNavbarExpanded.value = false;
      const navbarCollapse = document.getElementById("navbarNav");
      if (navbarCollapse) {
        navbarCollapse.classList.remove("show");
      }
    };

    onMounted(async () => {
      // Load notifications from localStorage first
      loadNotificationsFromStorage();

      // Animations disabled

      // Set up message notifications if authenticated
      if (authStore.isAuthenticated) {
        console.log("🔔 NAVBAR: Setting up notifications on mount");
        console.log(
          "🔔 NAVBAR: Messaging connected?",
          messagingService.isConnected
        );

        // Set up message notifications immediately - don't wait
        // The messaging service will be connected by App.vue
        setupMessageNotifications();

        // Load unread messages as notifications
        await loadUnreadMessagesAsNotifications();

        // Retry setup after a delay if service isn't connected
        if (!messagingService.isConnected) {
          console.log("🔔 NAVBAR: Messaging not connected, retrying in 2s...");
          setTimeout(async () => {
            if (messagingService.isConnected) {
              console.log(
                "🔔 NAVBAR: Retry successful, setting up notifications"
              );
              setupMessageNotifications();
              await loadUnreadMessagesAsNotifications();
            }
          }, 2000);
        }
      }
    });

    // Watch for auth state changes to set up notifications
    watch(
      () => authStore.isAuthenticated,
      async (isAuth) => {
        console.log("🔔 NAVBAR: Auth state changed:", isAuth);
        if (isAuth) {
          console.log("🔔 NAVBAR: User logged in, setting up notifications");
          // Load notifications from storage
          loadNotificationsFromStorage();
          // Set up notifications immediately - don't wait
          setupMessageNotifications();
          // Load unread messages as notifications
          await loadUnreadMessagesAsNotifications();
        } else {
          // Clean up on logout
          if (messageHandler) {
            messagingService.off("new_message", messageHandler);
            messageHandler = null;
          }
          // Clear notifications and storage
          notifications.value = [];
          localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
        }
      }
    );

    // Set up periodic check to ensure handler is registered when connection is ready
    // This ensures we receive real-time messages even if the connection wasn't ready on mount
    const ensureHandlerRegistered = () => {
      if (authStore.isAuthenticated && messagingService.isConnected) {
        // Check if handler is registered
        const handlers = messagingService.messageHandlers?.get('new_message') || [];
        const handlerRegistered = handlers.includes(messageHandler);
        
        if (!handlerRegistered || !messageHandler) {
          console.log("🔔 NAVBAR: Connection ready but handler missing or not registered, setting up now");
          console.log("🔔 NAVBAR: Current handlers count:", handlers.length);
          console.log("🔔 NAVBAR: messageHandler exists?", !!messageHandler);
          setupMessageNotifications();
        }
      }
    };
    
    // Check periodically (every 2 seconds) to ensure handler is registered when connection is ready
    const handlerCheckInterval = setInterval(ensureHandlerRegistered, 2000);

    onUnmounted(() => {
      // Clean up message handlers
      if (messageHandler) {
        messagingService.off("new_message", messageHandler);
        messageHandler = null;
      }
      // Clear the handler check interval
      if (handlerCheckInterval) {
        clearInterval(handlerCheckInterval);
      }
      // Note: messages_read handler is anonymous, so it stays registered
      // This is okay as it's a global handler for notification clearing
    });

    const setupNavbarInteractions = () => {
      // All animations disabled
    };

    return {
      isAuthenticated,
      user,
      userType,
      penaltyPoints,
      logout,
      toggleNavbar,
      closeNavbar,
      isNavbarExpanded,
      notifications,
      displayedNotifications,
      hasMoreNotifications,
      showAllNotifications,
      toggleShowAllNotifications,
      handleNotificationClick,
      unreadCount,
    };
  },
};
</script>

<style scoped>
.navbar-brand {
  font-size: 1.5rem;
  color: var(--cyber-text) !important;
  text-decoration: none;
  text-shadow: var(--cyber-glow-faint);
}

.navbar-brand:hover {
  color: var(--cyber-orange) !important;
  text-shadow: var(--cyber-glow);
}

.nav-link {
  font-weight: 500;
  color: var(--cyber-text-muted) !important;
  transition: color 0.3s ease;
  text-shadow: none;
}

.nav-link:hover {
  color: var(--cyber-orange) !important;
  text-shadow: none;
}

.nav-link.router-link-active {
  color: var(--cyber-orange) !important;
  text-shadow: none;
  font-weight: 600;
}

.dropdown-menu {
  background: var(--cyber-grey) !important;
  border: 1px solid var(--cyber-orange) !important;
  box-shadow: var(--cyber-glow) !important;
  border-radius: 8px;
  padding: 8px 0;
}

.dropdown-item {
  padding: 8px 16px;
  transition: all 0.3s ease;
  color: var(--cyber-text) !important;
}

.dropdown-item:hover {
  background-color: var(--cyber-grey-light) !important;
  color: var(--cyber-orange) !important;
}

/* Mobile navigation items wrapper - groups credits, notifications, and hamburger */
.mobile-nav-items {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: clamp(0.4rem, 1vw, 0.8rem);
  padding-right: clamp(0.4rem, 1vw, 0.8rem);
  flex-shrink: 0;
}

/* Credits container - visible on mobile, hidden on desktop */
.navbar-credits-container {
  margin: 0;
  display: flex;
  align-items: center;
  height: 40px;
}

/* Penalty points container - visible on mobile, hidden on desktop */
.navbar-penalty-container {
  margin: 0;
  display: flex;
  align-items: center;
  height: 40px;
}

.navbar-penalty-container .nav-link {
  padding: 0;
  color: var(--cyber-text) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin: 0;
  font-size: 0.9rem;
}

.navbar-penalty-container .nav-link i {
  font-size: 1.2rem !important;
  line-height: 1 !important;
  margin: 0;
  padding: 0;
}

/* Notification container - visible on mobile, hidden on desktop */
.navbar-notification-container {
  margin: 0;
  display: flex;
  align-items: center;
  height: 40px;
}

.navbar-notification-container .nav-item {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
}

.navbar-notification-container .nav-link {
  padding: 0;
  color: var(--cyber-text) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 40px;
  height: 40px;
  margin: 0;
}

.navbar-notification-container .nav-link i {
  font-size: 1.5rem !important;
  line-height: 1 !important;
  margin: 0;
  padding: 0;
}

.navbar-notification-container .notification-badge {
  position: absolute;
  top: 6px;
  right: 6px;
}

.navbar-notification-container .dropdown-menu {
  right: 0;
}

/* Clean hamburger menu for all screen sizes */
.cyberpunk-hamburger {
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 4px;
  padding: 0.5rem;
  margin: 0 !important;
  background: rgba(255, 255, 255, 0.05) !important;
  transition: all 0.3s ease;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cyberpunk-hamburger:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.1);
}

.cyberpunk-hamburger .navbar-toggler-icon {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%28255, 255, 255, 0.8%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e") !important;
}

/* Fix for 744px and below - navbar positioning */
@media (max-width: 744px) {
  .navbar-brand {
    font-size: 1.3rem;
    margin-right: auto;
    padding-left: 0.5rem;
  }

  .navbar-brand i {
    font-size: 1.2rem;
  }

  /* Force navbar items with proper spacing */
  .navbar .container {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    max-width: 100%;
    margin: 0;
    display: flex;
    align-items: center;
  }

  .mobile-nav-items {
    gap: 0.4rem;
    padding-right: 0.4rem;
  }

  /* Ensure full width navbar */
  .navbar {
    padding-left: 0;
    padding-right: 0;
  }
}

/* Specific breakpoint for 745px to 768px range */
@media (min-width: 745px) and (max-width: 768px) {
  .mobile-nav-items {
    gap: 0.5rem;
    padding-right: 0.5rem;
  }

  .navbar .container {
    padding-left: 0.6rem;
    padding-right: 0.6rem;
  }
}

/* Medium screen responsive styles (769px to 849px) */
@media (min-width: 769px) and (max-width: 849px) {
  .mobile-nav-items {
    gap: 0.6rem;
    padding-right: 0.6rem;
  }

  .navbar-brand {
    margin-right: auto;
  }

  .navbar .container {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
}

/* Larger medium screens (850px to 899px) */
@media (min-width: 850px) and (max-width: 899px) {
  .mobile-nav-items {
    gap: 0.7rem;
    padding-right: 0.7rem;
  }

  .navbar .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .navbar-brand {
    margin-right: 1rem;
  }
}

/* Near-desktop screens (900px to 991px) */
@media (min-width: 900px) and (max-width: 991px) {
  .mobile-nav-items {
    gap: 0.8rem;
    padding-right: 0.8rem;
  }

  .navbar .container {
    padding-left: 1.2rem;
    padding-right: 1.2rem;
  }

  .navbar-brand {
    margin-right: 1.5rem;
  }
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .navbar {
    z-index: 1050 !important;
  }

  .navbar-brand {
    font-size: 1.3rem;
    margin-right: 1rem;
  }

  .navbar-brand i {
    font-size: 1.2rem;
  }

  .navbar-collapse {
    position: fixed;
    top: 60px !important; 
    left: 0;
    right: 0;
    width: 100%;
    background: rgba(26, 26, 26, 0.98);
    border: none;
    border-top: 1px solid var(--cyber-orange);
    border-radius: 0;
    margin: 0;
    padding: 1rem 1.5rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(20px);
    z-index: 1040;
    max-height: calc(100vh - 60px);
    overflow-y: auto;
  }

  .navbar-collapse.collapsing {
    transition: none;
  }

  /* Backdrop overlay */
  .navbar-collapse.show::before {
    content: "";
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: -1;
    backdrop-filter: blur(4px);
  }

  .navbar-nav {
    margin-top: 0;
    margin-right: 0 !important;
    gap: 0;
  }

  .nav-item {
    margin-bottom: 0;
  }

  .nav-link {
    padding: 0.75rem 1rem;
    margin-bottom: 0.5rem;
    border-radius: 6px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    text-align: left;
    color: var(--cyber-text-muted) !important;
    font-weight: 500;
  }

  .nav-link:hover {
    background: rgba(255, 140, 66, 0.1);
    transform: translateX(5px);
    color: var(--cyber-orange) !important;
  }

  /* Show notification text on mobile in collapsed menu */
  .navbar-collapse .notification-text {
    display: inline !important;
    font-weight: 500;
    color: var(--cyber-text-muted) !important;
  }

  /* Adjust notification badge position for mobile */
  .navbar-collapse .notification-badge {
    margin-left: auto;
  }

  /* Adjust bell icon on mobile */
  .navbar-collapse .nav-item.dropdown .nav-link i.fa-bell {
    font-size: 1rem !important;
  }

  /* Make sure the notification link displays properly */
  .navbar-collapse .nav-item.dropdown .nav-link {
    position: relative;
  }

  /* Removed mobile button styling - nav links now have consistent format */

  .dropdown-menu {
    position: static !important;
    transform: none !important;
    box-shadow: none !important;
    border: 1px solid var(--cyber-orange);
    background: rgba(26, 26, 26, 0.8);
    margin-top: 0.5rem;
  }
}

@media (max-width: 576px) {
  .navbar-brand {
    font-size: 1.1rem;
  }

  .navbar-brand i {
    font-size: 1rem;
  }

  .display-4 {
    font-size: 1.8rem;
  }

  .navbar-collapse{
    top: 55px !important; 
  }
}

/* Add spacing between navbar items on larger screens */
@media (min-width: 992px) {
  .navbar-nav {
    gap: 1rem;
  }

  .navbar-nav .nav-item {
    display: flex;
    align-items: center;
  }

  /* Even spacing for all nav items */
  .navbar-nav.me-auto {
    margin-right: 2rem;
  }
}

/* Notification text - hide on desktop, show on mobile */
.notification-text {
  display: none;
}

/* Show on larger screens too but only in collapsed menu */
.navbar-collapse .notification-text {
  display: inline;
}

/* Notification Badge - Redesigned to be less intrusive */
.notification-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--cyber-orange, #ff8c42);
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 12px;
  min-width: 20px;
  height: 20px;
  margin-left: 6px;
  text-align: center;
  box-shadow: 0 0 8px rgba(255, 140, 66, 0.4);
  animation: pulse 2s infinite;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Notifications Dropdown */
.notifications-dropdown {
  width: min(380px, 90vw) !important;
  max-width: 380px !important;
  max-height: 500px;
  background: rgba(26, 26, 26, 0.95) !important;
  border: 2px solid var(--cyber-orange, #ff8c42) !important;
  border-radius: 12px !important;
  padding: 0 !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
  overflow: hidden;
}

/* Desktop-specific: Wider dropdown for better readability */
@media (min-width: 992px) {
  .notifications-dropdown {
    width: 380px !important;
    max-width: 380px !important;
  }
}

/* Desktop notification dropdown positioning - prevent right-side clipping */
@media (min-width: 992px) {
  .dropdown-menu-end.notifications-dropdown {
    right: max(10px, 2vw) !important;
    left: auto !important;
  }
}

/* User profile dropdown positioning - prevent right-side clipping */
@media (min-width: 992px) {
  .nav-item.dropdown .dropdown-menu {
    right: max(5px, 1vw) !important;
    left: auto !important;
    min-width: 180px;
    max-width: min(220px, 18vw);
  }
}

.notifications-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--cyber-orange, #ff8c42);
  background: rgba(255, 140, 66, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notifications-header h6 {
  color: var(--cyber-orange, #ff8c42);
  font-weight: 600;
  margin: 0;
}

.notifications-body {
  max-height: 400px;
  overflow-y: auto;
}

/* Empty state styling */
.notifications-body .text-center {
  padding: 3rem 2rem !important;
}

.notifications-body .text-center i {
  margin-bottom: 1rem !important;
}

.notifications-body .text-center p {
  font-size: 0.9rem !important;
}

.notifications-body::-webkit-scrollbar {
  width: 6px;
}

.notifications-body::-webkit-scrollbar-track {
  background: rgba(74, 74, 74, 0.3);
}

.notifications-body::-webkit-scrollbar-thumb {
  background: var(--cyber-orange, #ff8c42);
  border-radius: 3px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(74, 74, 74, 0.5);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.notification-item:hover {
  background: rgba(255, 140, 66, 0.15) !important;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-unread {
  background: rgba(255, 140, 66, 0.05);
}

.notification-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 140, 66, 0.2);
  border: 2px solid var(--cyber-orange, #ff8c42);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
}

.notification-icon-wrapper i {
  color: var(--cyber-orange, #ff8c42);
  font-size: 0.9rem;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  color: var(--cyber-text, #ffffff);
  font-size: 0.95rem;
  font-weight: 500;
  margin: 0 0 0.35rem 0;
  line-height: 1.4;
}

.notification-time {
  color: var(--cyber-text-muted, #cccccc);
  font-size: 0.75rem;
}

.notification-dot {
  width: 8px;
  height: 8px;
  background: var(--cyber-orange, #ff8c42);
  border-radius: 50%;
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  box-shadow: 0 0 10px rgba(255, 140, 66, 0.5);
  animation: pulse 2s infinite;
}

.notification-view-all {
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(74, 74, 74, 0.5);
  background: rgba(26, 26, 26, 0.5);
}

.notification-view-all .btn {
  background: transparent !important;
  border: 2px solid var(--cyber-orange, #ff8c42) !important;
  color: var(--cyber-text, #ffffff) !important;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.875rem;
}

.notification-view-all .btn:hover {
  background: linear-gradient(
    45deg,
    var(--cyber-orange, #ff8c42),
    var(--cyber-yellow, #ffd23f)
  ) !important;
  color: white !important;
  transform: translateY(-1px);
  box-shadow: 0 0 15px rgba(255, 140, 66, 0.5) !important;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Responsive adjustments for notifications - Full screen overlay on mobile */
@media (max-width: 991px) {
  .navbar-notification-container .notifications-dropdown {
    position: fixed !important;
    top: 60px !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    max-height: calc(100vh - 60px) !important;
    margin: 0 !important;
    border-radius: 0 !important;
    border: none !important;
    border-top: 2px solid var(--cyber-orange) !important;
    transform: none !important;
    z-index: 1050 !important;
  }

  /* Backdrop when notifications open on mobile */
  .navbar-notification-container .dropdown.show::before {
    content: "";
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1045;
    backdrop-filter: blur(4px);
  }

  .navbar-notification-container .notifications-dropdown.show {
    z-index: 1050 !important;
  }

  .navbar-notification-container .notifications-body {
    max-height: calc(100vh - 180px) !important;
  }
}

/* Penalty Points Styling */
.penalty-points-text {
  font-weight: 600;
  font-size: 0.9rem;
  transition: color 0.3s ease;
}

.nav-link:hover .penalty-points-text {
  color: var(--cyber-orange) !important;
  text-shadow: var(--cyber-glow);
}

.nav-link:hover .fas.fa-exclamation-triangle {
  color: var(--cyber-orange) !important;
  text-shadow: var(--cyber-glow);
}

/* Penalty points tooltip styling */
.tooltip {
  font-size: 0.875rem;
}

.tooltip-inner {
  background-color: var(--cyber-dark);
  color: var(--cyber-text);
  border: 1px solid var(--cyber-orange);
  border-radius: 6px;
}

/* iPhone SE and very small screens */
@media (max-width: 375px) {
  .navbar {
    min-height: 56px;
  }

  .navbar .container {
    min-height: 56px;
    padding-left: 0.25rem;
    padding-right: 0.25rem;
  }

  .navbar-brand {
    font-size: 1rem;
    margin-right: auto;
    padding-left: 0.25rem;
  }

  .navbar-brand i {
    font-size: 0.9rem;
  }

  .mobile-nav-items {
    gap: 0.3rem;
    padding-right: 0.3rem;
  }

  .navbar-credits-container {
    transform: scale(0.9);
  }

  .navbar-penalty-container {
    transform: scale(0.9);
  }

  .navbar-penalty-container .nav-link i {
    font-size: 1rem !important;
  }

  .navbar-penalty-container .penalty-points-text {
    font-size: 0.75rem;
  }

  .navbar-notification-container .nav-link {
    width: 34px;
    height: 34px;
  }

  .navbar-notification-container .nav-link i {
    font-size: 1.1rem !important;
  }

  .navbar-notification-container .notification-badge {
    font-size: 0.6rem;
    padding: 0.15rem 0.35rem;
    min-width: 16px;
    height: 16px;
    top: 4px;
    right: 4px;
  }

  .cyberpunk-hamburger {
    padding: 0.25rem 0.4rem;
    height: 34px;
  }

  .cyberpunk-hamburger .navbar-toggler-icon {
    width: 20px;
    height: 20px;
  }

  .navbar-collapse {
    top: 56px;
    padding: 0.75rem 1rem;
    max-height: calc(100vh - 56px);
  }

  .navbar-notification-container .notifications-dropdown {
    top: 56px !important;
    max-height: calc(100vh - 56px) !important;
  }
}
</style>
