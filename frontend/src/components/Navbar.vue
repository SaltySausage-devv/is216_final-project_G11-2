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
            <router-link to="/login" class="nav-link">
              <i class="fas fa-sign-in-alt me-1"></i>
              Login
            </router-link>
          </li>
          <li class="nav-item" v-if="!isAuthenticated">
            <router-link to="/register" class="nav-link">
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
                <router-link to="/profile" class="dropdown-item">
                  <i class="fas fa-user me-2"></i>
                  Profile
                </router-link>
              </li>
              <li>
                <router-link to="/messages" class="dropdown-item">
                  <i class="fas fa-envelope me-2"></i>
                  Messages
                </router-link>
              </li>
              <li>
                <router-link to="/calendar" class="dropdown-item">
                  <i class="fas fa-calendar me-2"></i>
                  Calendar
                </router-link>
              </li>
              <li>
                <router-link to="/analytics" class="dropdown-item">
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

    // Load notifications from localStorage on init
    const loadNotificationsFromStorage = () => {
      try {
        const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Filter out notifications older than 7 days
          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          notifications.value = parsed.filter((n) => {
            const notifTime = new Date(n.timestamp).getTime();
            return notifTime > sevenDaysAgo;
          });
          console.log(
            "🔔 NAVBAR: Loaded",
            notifications.value.length,
            "notifications from storage"
          );
        }
      } catch (error) {
        console.error(
          "🔔 NAVBAR: Error loading notifications from storage:",
          error
        );
        notifications.value = [];
      }
    };

    // Save notifications to localStorage
    const saveNotificationsToStorage = () => {
      try {
        localStorage.setItem(
          NOTIFICATIONS_STORAGE_KEY,
          JSON.stringify(notifications.value)
        );
        console.log(
          "🔔 NAVBAR: Saved",
          notifications.value.length,
          "notifications to storage"
        );
      } catch (error) {
        console.error(
          "🔔 NAVBAR: Error saving notifications to storage:",
          error
        );
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

    const formatTime = (timestamp) => {
      if (!timestamp) return "Just now";

      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "Just now";

      const now = new Date();
      const diff = now - date;

      if (diff < 60000) return "Just now";
      if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      if (diff < 172800000) return "Yesterday";
      return date.toLocaleDateString();
    };

    const handleNotificationClick = (notification) => {
      if (notification.conversationId) {
        console.log(
          "🔔 NAVBAR: Clicked notification for conversation:",
          notification.conversationId
        );

        // Remove ALL notifications from the same conversation
        const conversationId = notification.conversationId;
        const beforeCount = notifications.value.length;

        notifications.value = notifications.value.filter(
          (n) => n.conversationId !== conversationId
        );

        const afterCount = notifications.value.length;
        const removedCount = beforeCount - afterCount;

        console.log(
          `🔔 NAVBAR: Removed ${removedCount} notification(s) from conversation ${conversationId}`
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
        console.log("🔔 NAVBAR: Loading unread messages from conversations...");
        const response = await messagingService.getConversations();

        if (!response.conversations || response.conversations.length === 0) {
          console.log("🔔 NAVBAR: No conversations found");
          return;
        }

        console.log(
          `🔔 NAVBAR: Found ${response.conversations.length} conversations`
        );

        // Find conversations with unread messages
        const conversationsWithUnread = response.conversations.filter(
          (conv) => conv.unreadCount > 0
        );

        console.log(
          `🔔 NAVBAR: ${conversationsWithUnread.length} conversations have unread messages`
        );

        // Add notification for each conversation with unread messages
        for (const conv of conversationsWithUnread) {
          const otherParticipant =
            conv.participant1_id === currentUserId.value
              ? conv.participant2
              : conv.participant1;

          const participantName = `${otherParticipant.first_name} ${otherParticipant.last_name}`;

          // Check if we already have a notification for this conversation
          const existingNotification = notifications.value.find(
            (n) => n.conversationId === conv.id
          );

          if (!existingNotification) {
            console.log(
              `🔔 NAVBAR: Adding notification for ${participantName} (${conv.unreadCount} unread)`
            );

            const notification = {
              id: `conv_${conv.id}_${Date.now()}`, // Unique ID
              icon: "fas fa-envelope",
              title: `${conv.unreadCount} unread message${
                conv.unreadCount > 1 ? "s" : ""
              } from ${participantName}`,
              message: conv.last_message_content || "New message",
              time: formatTime(conv.last_message_at || conv.created_at),
              timestamp: conv.last_message_at || conv.created_at,
              conversationId: conv.id,
              unread: true,
            };

            notifications.value.unshift(notification);
          }
        }

        // Limit to last 20 notifications
        if (notifications.value.length > 20) {
          notifications.value = notifications.value.slice(0, 20);
        }

        // Save to localStorage
        if (conversationsWithUnread.length > 0) {
          saveNotificationsToStorage();
          console.log(
            `🔔 NAVBAR: ✅ Added ${conversationsWithUnread.length} notification(s) for unread messages`
          );
        }
      } catch (error) {
        console.error("🔔 NAVBAR: Error loading unread messages:", error);
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
        console.log("🔔 NAVBAR: ✨ Received new message:", message);
        console.log("🔔 NAVBAR: Message sender_id:", message.sender_id);
        console.log("🔔 NAVBAR: Current user_id:", currentUserId.value);
        console.log("🔔 NAVBAR: Message type:", message.message_type);

        // Check if this is a system message (reschedule_request, booking_cancelled, etc.)
        const isSystemMessage = 
          message.message_type === 'reschedule_request' ||
          message.message_type === 'reschedule_accepted' ||
          message.message_type === 'reschedule_rejected' ||
          message.message_type === 'booking_cancelled';

        // Check if current user is the sender (using String() to handle UUID type mismatches)
        const isSender = String(message.sender_id) === String(currentUserId.value);

        // For reschedule requests, reductions, only notify the RECEIVER (not the requester/sender)
        const isRescheduleMessage = 
          message.message_type === 'reschedule_request' ||
          message.message_type === 'reschedule_accepted' ||
          message.message_type === 'reschedule_rejected';

        // Determine if we should show notification
        let shouldShow = false;
        if (isRescheduleMessage) {
          // Reschedule messages: only notify receiver (not sender)
          shouldShow = !isSender;
        } else if (isSystemMessage) {
          // Other system messages: notify receiver
          shouldShow = !isSender;
        } else {
          // Regular messages: notify if not from yourself and has sender
          shouldShow = !isSender && message.sender;
        }

        if (shouldShow) {
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
          } else if (message.message_type === "booking_proposal") {
            messagePreview = "📝 Booking proposal";
          } else if (message.message_type === "booking_confirmation") {
            messagePreview = "✅ Booking confirmed";
          } else if (message.message_type === "booking_cancelled") {
            messagePreview = "❌ Booking cancelled";
          } else if (message.content) {
            messagePreview = message.content.substring(0, 50);
          } else {
            messagePreview = "New message";
          }

          // Format title
          let title;
          if (isSystemMessage) {
            title = messagePreview;
          } else {
            title = `New message from ${senderName}`;
          }

          // Add to notifications list
          const notification = {
            id: message.id,
            icon: isSystemMessage ? "fas fa-bell" : "fas fa-envelope",
            title: title,
            message: messagePreview,
            time: formatTime(message.created_at),
            timestamp: message.created_at,
            conversationId: message.conversation_id,
            unread: true,
          };

          // Add to beginning of notifications array (most recent first)
          notifications.value.unshift(notification);

          // Limit to last 20 notifications
          if (notifications.value.length > 20) {
            notifications.value = notifications.value.slice(0, 20);
          }

          // Save to localStorage
          saveNotificationsToStorage();

          console.log(
            "🔔 NAVBAR: ✅ Added notification, total:",
            notifications.value.length
          );
          console.log("🔔 NAVBAR: Notification:", notification);
        } else {
          console.log(
            "🔔 NAVBAR: ⏭️ Skipping notification (message from self or conditions not met)"
          );
        }
      };

      // Register the new_message handler
      messagingService.on("new_message", messageHandler);
      console.log("🔔 NAVBAR: ✅ Message handler registered successfully");

      // Also listen for messages_read event to clear notifications when user opens conversation
      messagingService.on("messages_read", (data) => {
        console.log(
          "🔔 NAVBAR: Messages marked as read for conversation:",
          data.conversationId
        );

        // Remove all notifications from this conversation
        const beforeCount = notifications.value.length;
        notifications.value = notifications.value.filter(
          (n) => n.conversationId !== data.conversationId
        );
        const afterCount = notifications.value.length;
        const removedCount = beforeCount - afterCount;

        if (removedCount > 0) {
          console.log(
            `🔔 NAVBAR: Auto-cleared ${removedCount} notification(s) from conversation ${data.conversationId}`
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

      // Wait for auth and messaging to be ready
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Set up message notifications if authenticated
      if (authStore.isAuthenticated) {
        console.log("🔔 NAVBAR: Setting up notifications on mount");
        console.log(
          "🔔 NAVBAR: Messaging connected?",
          messagingService.isConnected
        );

        // Try to set up notifications even if not connected yet
        // The messaging service will be connected by App.vue
        setupMessageNotifications();

        // Load unread messages as notifications
        await new Promise((resolve) => setTimeout(resolve, 1500));
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
          // Wait a bit for messaging service to connect
          setTimeout(async () => {
            setupMessageNotifications();
            // Load unread messages as notifications after a short delay
            await new Promise((resolve) => setTimeout(resolve, 500));
            await loadUnreadMessagesAsNotifications();
          }, 1000);
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

    onUnmounted(() => {
      // Clean up message handlers
      if (messageHandler) {
        messagingService.off("new_message", messageHandler);
        messageHandler = null;
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
    top: 60px;
    left: 0;
    right: 0;
    width: 100%;
    background: rgba(26, 26, 26, 0.98);
    border: none;
    border-top: 2px solid var(--cyber-orange);
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
