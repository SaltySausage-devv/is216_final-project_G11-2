import { ref } from 'vue'
import { useRouter } from 'vue-router'

const notifications = ref([])
let notificationId = 0

// Clear notifications on page load to prevent persistence across refreshes
if (typeof window !== 'undefined') {
  notifications.value = []
}

export function useNotifications() {
  const router = useRouter()

  const showNotification = ({ title, message, conversationId, onClick }) => {
    console.log('🔔 TOAST: showNotification called but DISABLED - User requested removal of all popup toasts')
    // DISABLED - User requested complete removal of toast popups
    // Return early, do nothing
    return
  }

  const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearAllNotifications = () => {
    // DISABLED - Toast notifications removed
    notifications.value = []
  }

  const handleNotificationClick = (notification) => {
    if (notification.onClick) {
      notification.onClick()
    } else if (notification.conversationId) {
      router.push(`/messages?conversation=${notification.conversationId}`)
    }
    removeNotification(notification.id)
  }

  const showMessageNotification = ({ senderName, message, conversationId }) => {
    console.log('🔔 TOAST: showMessageNotification called with:', { senderName, message, conversationId })
    // DISABLED - User requested removal of popup toasts
    // Toast notifications are now disabled, only navbar badge will update
    return;
    
    return showNotification({
      title: `New message from ${senderName}`,
      message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
      conversationId,
      onClick: () => {
        router.push(`/messages?conversation=${conversationId}`)
      }
    })
  }

  return {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications,
    handleNotificationClick,
    showMessageNotification
  }
}


