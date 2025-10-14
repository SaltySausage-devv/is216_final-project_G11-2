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
        <span class="fw-bold">OnlyTutor</span>
      </router-link>

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

      <div
        class="collapse navbar-collapse"
        :class="{ show: isNavbarExpanded }"
        id="navbarNav"
      >
        <ul class="navbar-nav me-auto">
          <li
            class="nav-item"
            v-if="userType === 'student' || !isAuthenticated"
          >
            <router-link to="/search" class="nav-link">
              <i class="fas fa-search me-1"></i>
              Find Tutors
            </router-link>
          </li>
          <li class="nav-item">
            <router-link
              to="/dashboard"
              class="nav-link"
              v-if="isAuthenticated"
            >
              <i class="fas fa-tachometer-alt me-1"></i>
              Dashboard
            </router-link>
          </li>
        </ul>

        <ul class="navbar-nav">
          <li class="nav-item" v-if="!isAuthenticated">
            <router-link to="/login" class="nav-link">
              <i class="fas fa-sign-in-alt me-1"></i>
              Login
            </router-link>
          </li>
          <li class="nav-item" v-if="!isAuthenticated">
            <a href="http://localhost:3000/register" class="nav-link">
              <i class="fas fa-user-plus me-1"></i>
              Sign Up
            </a>
          </li>

          <!-- Notifications Dropdown -->
          <li class="nav-item dropdown" v-if="isAuthenticated">
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

export default {
  name: "Navbar",
  setup() {
    const authStore = useAuthStore();
    const router = useRouter();
    const isNavbarExpanded = ref(false);

    const isAuthenticated = computed(() => authStore.isAuthenticated);
    const user = computed(() => authStore.user);
    const userType = computed(() => authStore.userType);
    const currentUserId = computed(() => authStore.user?.id);

    // Notification state
    const NOTIFICATIONS_STORAGE_KEY = "onlytutor_notifications";
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

        // Only add notification if message is from another user
        if (message.sender_id !== currentUserId.value && message.sender) {
          console.log(
            "🔔 NAVBAR: Message is from another user, creating notification"
          );
          const senderName = `${message.sender.first_name} ${message.sender.last_name}`;
          const messagePreview =
            message.message_type === "image"
              ? "Sent an image"
              : message.content.substring(0, 50);

          // Add to notifications list
          const notification = {
            id: message.id,
            icon: "fas fa-envelope",
            title: `New message from ${senderName}`,
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
            "🔔 NAVBAR: ⏭️ Skipping notification (message from self or no sender)"
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
      try {
        console.log("🚪 Navbar: Starting logout process...");
        await authStore.logout();
        console.log("🚪 Navbar: Logout completed, redirecting to home...");

        // Use replace instead of push to avoid history issues
        await router.replace("/");

        // Force page reload to ensure clean state
        window.location.reload();
      } catch (error) {
        console.error("❌ Navbar: Logout error:", error);
        // Still redirect even if there's an error
        await router.replace("/");
        window.location.reload();
      }
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

    onMounted(async () => {
      // Load notifications from localStorage first
      loadNotificationsFromStorage();

      // Advanced navbar brand animation with keyframes
      animate(".navbar-brand", {
        keyframes: [
          {
            scale: 0.5,
            opacity: 0,
            rotate: -180,
            ease: "outExpo",
            duration: 0,
          },
          {
            scale: 1.1,
            opacity: 1,
            rotate: 10,
            ease: "outBack",
            duration: 400,
          },
          { scale: 1, rotate: 0, ease: spring({ bounce: 0.4 }), duration: 300 },
        ],
        duration: 700,
      });

      // Advanced nav links with complex staggered animation
      animate(".nav-link", {
        keyframes: [
          { y: -30, opacity: 0, scale: 0.8, ease: "outExpo", duration: 0 },
          { y: 0, opacity: 1, scale: 1.05, ease: "outBack", duration: 400 },
          { scale: 1, ease: "outElastic", duration: 200 },
        ],
        delay: stagger(150, { start: 200 }),
        duration: 600,
      });

      // Setup interactive navbar animations
      setupNavbarInteractions();

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

        // Retry setup after a delay if service isn't connected
        if (!messagingService.isConnected) {
          console.log("🔔 NAVBAR: Messaging not connected, retrying in 2s...");
          setTimeout(() => {
            if (messagingService.isConnected) {
              console.log(
                "🔔 NAVBAR: Retry successful, setting up notifications"
              );
              setupMessageNotifications();
            }
          }, 2000);
        }
      }
    });

    // Watch for auth state changes to set up notifications
    watch(
      () => authStore.isAuthenticated,
      (isAuth) => {
        console.log("🔔 NAVBAR: Auth state changed:", isAuth);
        if (isAuth) {
          console.log("🔔 NAVBAR: User logged in, setting up notifications");
          // Load notifications from storage
          loadNotificationsFromStorage();
          // Wait a bit for messaging service to connect
          setTimeout(() => {
            setupMessageNotifications();
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
      // Nav link hover effects
      const navLinks = document.querySelectorAll(".nav-link");
      navLinks.forEach((link) => {
        link.addEventListener("mouseenter", () => {
          animate(link, {
            scale: 1.1,
            y: -3,
            rotate: 2,
            duration: 200,
            ease: "outBack",
          });
        });

        link.addEventListener("mouseleave", () => {
          animate(link, {
            scale: 1,
            y: 0,
            rotate: 0,
            duration: 200,
            ease: "outBack",
          });
        });
      });

      // Button advanced hover effects
      const buttons = document.querySelectorAll(".btn");
      buttons.forEach((button) => {
        button.addEventListener("mouseenter", () => {
          animate(button, {
            keyframes: [
              { scale: 1.05, y: -2, ease: "outBack", duration: 150 },
              { scale: 1.1, y: -5, ease: "outElastic", duration: 100 },
            ],
            duration: 250,
          });
        });

        button.addEventListener("mouseleave", () => {
          animate(button, {
            scale: 1,
            y: 0,
            duration: 200,
            ease: "outBack",
          });
        });
      });

      // Brand logo continuous subtle animation
      const brand = document.querySelector(".navbar-brand");
      if (brand) {
        animate(brand, {
          keyframes: [
            { rotate: 0, scale: 1, ease: "inOutSine", duration: 2000 },
            { rotate: 2, scale: 1.02, ease: "inOutSine", duration: 2000 },
            { rotate: 0, scale: 1, ease: "inOutSine", duration: 2000 },
          ],
          loop: true,
          duration: 6000,
        });
      }
    };

    return {
      isAuthenticated,
      user,
      userType,
      logout,
      toggleNavbar,
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
}

.nav-link:hover {
  color: var(--cyber-orange) !important;
}

.nav-link.router-link-active {
  color: var(--cyber-orange) !important;
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

/* Clean hamburger menu for all screen sizes */
.cyberpunk-hamburger {
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 4px;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05) !important;
  transition: all 0.3s ease;
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
    margin-right: 0;
    padding-left: 1rem;
  }

  .navbar-brand i {
    font-size: 1.2rem;
  }

  /* Force navbar items to edges */
  .navbar .container {
    padding-left: 0;
    padding-right: 0;
    max-width: 100%;
    margin: 0;
  }

  .navbar-brand {
    margin-left: 0;
  }

  .navbar-toggler {
    margin-right: 0;
    padding-right: 1rem;
  }

  /* Ensure full width navbar */
  .navbar {
    padding-left: 0;
    padding-right: 0;
  }
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .navbar-brand {
    font-size: 1.3rem;
    margin-right: 1rem;
  }

  .navbar-brand i {
    font-size: 1.2rem;
  }

  .navbar-collapse {
    background: rgba(26, 26, 26, 0.7);
    border: 1px solid var(--cyber-orange);
    border-radius: 8px;
    margin-top: 1rem;
    padding: 1rem;
    box-shadow: 0 0 20px rgba(255, 140, 66, 0.3);
    backdrop-filter: blur(15px);
  }

  .navbar-nav {
    margin-top: 0;
    gap: 0.5rem;
  }

  .nav-item {
    margin-bottom: 0.5rem;
  }

  .nav-link {
    padding: 0.75rem 1rem;
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
    position: relative !important;
    top: auto !important;
    right: auto !important;
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

/* Notification text - hide on desktop, show on mobile */
.notification-text {
  display: none;
}

/* Show on larger screens too but only in collapsed menu */
.navbar-collapse .notification-text {
  display: inline;
}

/* Notification Badge */
.notification-badge {
  position: absolute;
  top: -5px;
  right: -8px;
  background: var(--cyber-orange, #ff8c42);
  color: white;
  font-size: 0.65rem;
  font-weight: bold;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  box-shadow: 0 0 10px rgba(255, 140, 66, 0.6);
  animation: pulse 2s infinite;
}

/* Notifications Dropdown */
.notifications-dropdown {
  width: 380px;
  max-height: 500px;
  background: rgba(26, 26, 26, 0.95) !important;
  border: 2px solid var(--cyber-orange, #ff8c42) !important;
  border-radius: 12px !important;
  padding: 0 !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
  overflow: hidden;
}

.notifications-header {
  padding: 1rem;
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
  padding: 0.75rem 1rem;
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
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: rgba(255, 140, 66, 0.2);
  border: 2px solid var(--cyber-orange, #ff8c42);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
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
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
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
  padding: 0.75rem;
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

/* Responsive adjustments for notifications */
@media (max-width: 768px) {
  .notifications-dropdown {
    width: 320px;
  }
}

@media (max-width: 576px) {
  .notifications-dropdown {
    width: 280px;
    max-height: 400px;
  }

  .notifications-body {
    max-height: 300px;
  }
}
</style>
