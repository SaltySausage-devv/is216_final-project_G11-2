<template>
  <div
    class="toast-container position-fixed top-0 end-0 p-3"
    style="z-index: 9999"
  >
    <div
      v-for="notification in notifications"
      :key="notification.id"
      class="toast show cyberpunk-toast"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      @click="handleClick(notification)"
    >
      <div class="toast-header">
        <i class="fas fa-envelope text-primary me-2"></i>
        <strong class="me-auto">{{ notification.title }}</strong>
        <button
          type="button"
          class="btn-close"
          @click.stop="removeNotification(notification.id)"
          aria-label="Close"
        ></button>
      </div>
      <div class="toast-body">
        {{ notification.message }}
        <div class="mt-2 pt-2 border-top">
          <small class="text-muted">Click to view message</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useNotifications } from "../composables/useNotifications";

export default {
  name: "ToastNotifications",
  setup() {
    const { notifications, removeNotification, handleNotificationClick } =
      useNotifications();

    const handleClick = (notification) => {
      handleNotificationClick(notification);
    };

    return {
      notifications,
      removeNotification,
      handleClick,
    };
  },
};
</script>

<style scoped>
.toast-container {
  z-index: 9999 !important;
}

.cyberpunk-toast {
  background: rgba(26, 26, 26, 0.95) !important;
  border: 2px solid var(--cyber-orange, #ff8c42) !important;
  box-shadow: 0 0 20px rgba(255, 140, 66, 0.5) !important;
  backdrop-filter: blur(10px);
  cursor: pointer;
  min-width: 300px;
  animation: slideIn 0.3s ease-out;
}

.cyberpunk-toast:hover {
  border-color: var(--cyber-yellow, #ffd23f) !important;
  box-shadow: 0 0 30px rgba(255, 140, 66, 0.7) !important;
  transform: translateX(-5px);
  transition: all 0.3s ease;
}

.toast-header {
  background: rgba(255, 140, 66, 0.1) !important;
  border-bottom: 1px solid var(--cyber-orange, #ff8c42) !important;
  color: var(--cyber-text, #ffffff) !important;
}

.toast-body {
  color: var(--cyber-text, #ffffff) !important;
  background: rgba(26, 26, 26, 0.8);
}

.btn-close {
  filter: invert(1) grayscale(100%) brightness(200%);
}

.text-primary {
  color: var(--cyber-orange, #ff8c42) !important;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.border-top {
  border-color: var(--cyber-grey-light, #4a4a4a) !important;
}
</style>

