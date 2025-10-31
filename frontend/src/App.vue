<template>
  <div id="app">
    <Navbar />
    <main>
      <router-view />
    </main>
    <Footer />
    <AlertModal
      :visible="alertState.visible"
      :title="alertState.title"
      :message="alertState.message"
      :type="alertState.type"
      @close="handleClose"
    />
  </div>
</template>

<script>
import { onMounted, onUnmounted, watch, ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "./stores/auth";
import { useAlertModal } from "./composables/useAlertModal";
import messagingService from "./services/messaging.js";
import AlertModal from "./components/AlertModal.vue";

export default {
  name: "App",
  components: {
    AlertModal,
  },
  setup() {
    const authStore = useAuthStore();
    const route = useRoute();
    const { alertState, handleClose, showAlert, showSuccess, showError, showWarning, showInfo } = useAlertModal();
    
    // Make alert functions globally available
    if (typeof window !== 'undefined') {
      window.showAlert = showAlert;
      window.showSuccess = showSuccess;
      window.showError = showError;
      window.showWarning = showWarning;
      window.showInfo = showInfo;
    }

    // Store the global message handler reference to prevent duplicates
    let globalMessageHandler = null;

    // Global cleanup function for animated backgrounds
    const cleanupAnimatedBackgrounds = () => {
      // Remove any existing animated background elements
      const existingBackground = document.querySelector(".animated-background");
      if (existingBackground) {
        existingBackground.remove();
      }

      // Remove any floating elements from other pages
      const floatingElements = document.querySelectorAll(
        ".floating-icon, .floating-study-element, .floating-elements"
      );
      floatingElements.forEach((element) => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });

      // Remove any background elements from login/register pages
      const backgroundElements = document.querySelectorAll(
        ".login-background-elements, .register-background-elements"
      );
      backgroundElements.forEach((element) => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });

      // Aggressive cleanup: Remove any elements containing emojis that shouldn't be on certain pages
      const emojiElements = document.querySelectorAll("*");
      emojiElements.forEach((element) => {
        if (
          element.textContent &&
          /[📚✏️🧮📝🎓💡🔬📖❓🌍]/.test(element.textContent)
        ) {
          // Check if this element is a floating background element
          if (
            element.classList.contains("floating-icon") ||
            element.classList.contains("floating-study-element") ||
            element.parentElement?.classList.contains(
              "login-background-elements"
            ) ||
            element.parentElement?.classList.contains(
              "register-background-elements"
            ) ||
            element.parentElement?.classList.contains("animated-background")
          ) {
            if (element.parentNode) {
              element.parentNode.removeChild(element);
            }
          }
        }
      });
    };

    // Setup global messaging for notifications
    const setupGlobalMessaging = () => {
      console.log("🌐 APP: setupGlobalMessaging called");
      console.log(
        "🌐 APP: Auth token exists?",
        !!authStore.session?.access_token
      );
      console.log("🌐 APP: User ID exists?", !!authStore.user?.id);

      if (authStore.session?.access_token && authStore.user?.id) {
        console.log("🌐 APP: Setting up global messaging for notifications");

        // Connect to messaging service if not already connected
        if (!messagingService.isConnected) {
          console.log("🌐 APP: Connecting to messaging service...");
          messagingService.connect(authStore.session.access_token);
        } else {
          console.log("🌐 APP: Already connected to messaging service");
        }

        // Remove old handler if it exists to prevent duplicates
        if (globalMessageHandler) {
          console.log(
            "🌐 APP: Removing old message handler to prevent duplicates"
          );
          messagingService.off("new_message", globalMessageHandler);
        }

        // Create and store the handler
        globalMessageHandler = (message) => {
          console.log("🌐 APP: Received new message globally:", message);
          console.log("🌐 APP: Message sender ID:", message.sender_id);
          console.log("🌐 APP: Current user ID:", authStore.user?.id);
          console.log("🌐 APP: Current route:", route.name, route.path);

          // Show notification if:
          // 1. Message is from another user (not yourself) OR it's a system message (booking_cancelled, etc.)
          // 2. You're NOT on the messages page viewing that conversation
          const isSystemMessage =
            message.message_type === "booking_cancelled" ||
            message.message_type === "reschedule_request" ||
            message.message_type === "reschedule_accepted" ||
            message.message_type === "reschedule_rejected";

          // For booking-related messages (proposal, confirmation, offer), only show notification to the receiver (not the sender)
          // Use String() conversion to handle UUID type mismatches
          const isBookingMessage =
            message.message_type === "booking_cancelled" ||
            message.message_type === "booking_proposal" ||
            message.message_type === "booking_confirmation" ||
            message.message_type === "booking_offer";
          
          // For reschedule requests, only notify the RECEIVER (not the requester/sender)
          const isRescheduleMessage = 
            message.message_type === "reschedule_request" ||
            message.message_type === "reschedule_accepted" ||
            message.message_type === "reschedule_rejected";
          
          // Check if current user is the sender (using String() to handle UUID type mismatches)
          const isSender = String(message.sender_id) === String(authStore.user?.id);
          
          let shouldShowNotification = false;
          if (isBookingMessage) {
            // Booking messages: only show to receiver (not sender)
            shouldShowNotification = !isSender;
          } else if (isRescheduleMessage) {
            // Reschedule messages: only show to receiver (not the requester/sender)
            shouldShowNotification = !isSender;
          } else if (isSystemMessage) {
            // Other system messages: show to receiver
            shouldShowNotification = !isSender;
          } else {
            // Regular messages: show if not from yourself
            shouldShowNotification = !isSender;
          }

          // For system messages (like reschedule_request), we still want to show notification even if sender is missing
          // The sender check is primarily for regular text messages
          const shouldShow = shouldShowNotification && (message.sender || isSystemMessage || isRescheduleMessage);
          
          if (shouldShow) {
            console.log(
              "🌐 APP: Message is from another user or system message"
            );
            console.log("🌐 APP: isSystemMessage:", isSystemMessage);
            console.log("🌐 APP: message.message_type:", message.message_type);
            console.log(
              "🌐 APP: isBookingMessage:",
              isBookingMessage
            );
            console.log(
              "🌐 APP: shouldShowNotification:",
              shouldShowNotification
            );
            const isOnMessagesPage =
              route.name === "Messages" || route.path === "/messages";
            console.log("🌐 APP: Is on Messages page?", isOnMessagesPage);

            // Show notification if not on messages page
            // The Messages page will handle its own notifications for conversations you're not viewing
            if (!isOnMessagesPage) {
              console.log("🌐 APP: Showing notification!");
              const senderName =
                message.message_type === "booking_cancelled" ||
                message.message_type === "reschedule_request" ||
                message.message_type === "reschedule_accepted" ||
                message.message_type === "reschedule_rejected"
                  ? "System"
                  : `${message.sender.first_name} ${message.sender.last_name}`;

              // Generate user-friendly message preview based on message type
              let messagePreview;
              if (message.message_type === "image") {
                messagePreview = "📷 Sent an image";
              } else if (message.message_type === "reschedule_request") {
                messagePreview = "📅 Reschedule booking request";
              } else if (message.message_type === "reschedule_accepted") {
                messagePreview = "✅ Reschedule request accepted";
              } else if (message.message_type === "reschedule_rejected") {
                messagePreview = "❌ Reschedule request rejected";
              } else if (message.message_type === "booking_offer") {
                messagePreview = "📋 Booking offer";
              } else if (message.message_type === "booking_proposal") {
                messagePreview = "📝 Booking proposal";
              } else if (message.message_type === "booking_confirmation") {
                messagePreview = "✅ Booking confirmed";
              } else if (message.message_type === "booking_cancelled") {
                messagePreview = "❌ Booking cancelled";
              } else {
                messagePreview = message.content;
              }

              // Toast popup disabled - user requested removal of popup toasts
              // Notification badge in navbar will still update via Navbar notification system
              // IMPORTANT: Never show toasts for reschedule_accepted or reschedule_rejected
              console.log("🌐 APP: Message notification (toast disabled, navbar badge will update)");
              console.log("🌐 APP: Message type:", message.message_type);
            } else {
              console.log(
                "🌐 APP: On Messages page, not showing notification from App.vue"
              );
            }
          } else {
            console.log(
              "🌐 APP: Message is from current user or no sender info, skipping notification"
            );
          }
        };

        // Register the handler
        console.log("🌐 APP: Registering global message handler");
        messagingService.on("new_message", globalMessageHandler);
        console.log("🌐 APP: Handler registered successfully");

        // Join all user's conversation rooms to receive messages
        console.log("🌐 APP: Fetching user's conversations to join rooms...");
        fetchAndJoinConversations();
      } else {
        console.log(
          "🌐 APP: Cannot setup messaging - missing auth token or user ID"
        );
      }
    };

    // Fetch conversations and join their rooms
    const fetchAndJoinConversations = async () => {
      try {
        console.log("🌐 APP: Fetching conversations from API...");
        const response = await messagingService.getConversations();
        console.log(
          "🌐 APP: Got conversations:",
          response.conversations?.length || 0
        );
        
        // Log all conversations with their unread counts for debugging
        if (response.conversations) {
          response.conversations.forEach((conv) => {
            console.log(`🔔 APP: Conversation ${conv.id}: unreadCount = ${conv.unreadCount || 0}`);
          });
        }

        if (response.conversations && response.conversations.length > 0) {
          // Join all conversation rooms (notification handling is now in Navbar.vue)
          response.conversations.forEach((conv) => {
            console.log("🌐 APP: Joining conversation room:", conv.id);
            messagingService.joinConversation(conv.id);
          });
          console.log("🌐 APP: Joined all conversation rooms successfully");
        } else {
          console.log("🌐 APP: No conversations to join");
        }
      } catch (error) {
        console.error("🌐 APP: Error fetching conversations:", error);
      }
    };

    onMounted(async () => {
      console.log("🌐 APP: onMounted - Component mounted");

      // Initialize auth state from localStorage
      console.log("🌐 APP: Calling authStore.initializeAuth()...");
      await authStore.initializeAuth();
      console.log("🌐 APP: authStore.initializeAuth() completed");

      // Wait a tick for reactive properties to update
      await new Promise((resolve) => setTimeout(resolve, 200));

      console.log("🌐 APP: Auth initialized");
      console.log("🌐 APP: isAuthenticated:", authStore.isAuthenticated);
      console.log("🌐 APP: Has user:", !!authStore.user);
      console.log("🌐 APP: Has session:", !!authStore.session);
      console.log(
        "🌐 APP: Session access_token:",
        authStore.session?.access_token ? "EXISTS" : "MISSING"
      );
      console.log("🌐 APP: User ID:", authStore.user?.id);
      console.log(
        "🌐 APP: Token from computed:",
        authStore.token ? "EXISTS" : "MISSING"
      );

      // Setup global messaging immediately after auth init
      if (authStore.isAuthenticated) {
        console.log(
          "🌐 APP: ✅ User is authenticated, setting up messaging now"
        );
        setupGlobalMessaging();
      } else {
        console.log("🌐 APP: ❌ User not authenticated, waiting for login");
        console.log(
          "🌐 APP: Will setup messaging when user logs in (via watch)"
        );
      }

      // Clean up any existing background elements on app start
      // But only if we're not on the Home page
      if (route.name !== "Home") {
        cleanupAnimatedBackgrounds();
      }
    });

    // Watch for route changes and clean up backgrounds when leaving pages
    watch(route, (to, from) => {
      // Clean up backgrounds when navigating away from pages that might have them
      // But don't clean up if going TO the Home page (it needs its background)
      if (
        (from.name === "Home" ||
          from.name === "Login" ||
          from.name === "Register") &&
        to.name !== "Home"
      ) {
        // Small delay to ensure the new page has loaded
        setTimeout(() => {
          cleanupAnimatedBackgrounds();
        }, 100);
      }

      // Additional cleanup for specific page transitions
      // Remove emojis from pages that shouldn't have them
      if (
        to.name === "Dashboard" ||
        to.name === "Messages" ||
        to.name === "SearchTutors"
      ) {
        setTimeout(() => {
          cleanupAnimatedBackgrounds();
        }, 200);
      }
    });

    // Track if this is the initial load to avoid treating page refresh as a new login
    let isInitialLoad = true;

    // Watch for auth changes to setup messaging when user logs in
    watch(
      () => authStore.isAuthenticated,
      (isAuth, oldIsAuth) => {
        console.log("🌐 APP: Auth state changed:", { isAuth, oldIsAuth, isInitialLoad });
        
        // On initial load, if user is authenticated, we already set up messaging in onMounted
        // So skip this watch trigger
        if (isInitialLoad && isAuth) {
          console.log("🌐 APP: Initial load with authenticated user, skipping watch setup");
          isInitialLoad = false;
          return;
        }
        
        isInitialLoad = false;
        
        if (isAuth && !oldIsAuth) {
          // User just logged in (actual login event, not page refresh)
          console.log("🌐 APP: User logged in, setting up messaging");
          setupGlobalMessaging();
        } else if (!isAuth && oldIsAuth) {
          // User just logged out
          console.log("🌐 APP: User logged out, cleaning up messaging");
          // Remove handler and disconnect when user logs out
          if (globalMessageHandler) {
            messagingService.off("new_message", globalMessageHandler);
            globalMessageHandler = null;
          }
          messagingService.disconnect();
        }
      }
    );

    onUnmounted(() => {
      // Final cleanup when app is unmounted
      cleanupAnimatedBackgrounds();

      // Remove the global message handler
      if (globalMessageHandler) {
        messagingService.off("new_message", globalMessageHandler);
        globalMessageHandler = null;
      }

      // Disconnect messaging service
      messagingService.disconnect();
    });

    // Test function to manually update credits
    const testCreditUpdate = async () => {
      console.log("🧪 Testing credit update...");
      try {
        const response = await fetch("/api/calendar/test-update-credits", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authStore.token}`,
          },
          body: JSON.stringify({
            userId: authStore.user.id,
            newCredits: Math.floor(Math.random() * 1000), // Random credits for testing
          }),
        });

        const result = await response.json();
        console.log("🧪 Credit update test result:", result);
      } catch (error) {
        console.error("🧪 Credit update test error:", error);
      }
    };

    // Test function to simulate student credit update
    const testStudentCreditUpdate = async () => {
      console.log("🧪 Testing student credit update...");
      try {
        const response = await fetch(
          "/api/calendar/test-student-credit-update",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authStore.token}`,
            },
            body: JSON.stringify({
              studentId: authStore.user.id,
              creditDifference: 10, // Simulate a +10 credit difference (longer session)
            }),
          }
        );

        const result = await response.json();
        console.log("🧪 Student credit update test result:", result);
      } catch (error) {
        console.error("🧪 Student credit update test error:", error);
      }
    };

    // Expose test functions globally for debugging
    window.testCreditUpdate = testCreditUpdate;
    window.testStudentCreditUpdate = testStudentCreditUpdate;

    return {
      alertState,
      handleClose,
    };
  },
};
</script>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}
</style>
