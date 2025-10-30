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
    // TOAST NOTIFICATIONS COMPLETELY DISABLED
    // All notifications now only appear in the navbar notifications inbox
    console.log('🔔 TOAST: Notification request received but DISABLED - using navbar inbox only')
    return null
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
    // TOAST NOTIFICATIONS COMPLETELY DISABLED
    console.log('🔔 TOAST: Message notification request DISABLED - using navbar inbox only')
    return null
  }
  
  const showRescheduleNotification = ({ senderName, bookingTitle, conversationId }) => {
    // TOAST NOTIFICATIONS COMPLETELY DISABLED
    console.log('🔔 TOAST: Reschedule notification request DISABLED - using navbar inbox only')
    return null
  }

  return {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications,
    handleNotificationClick,
    showMessageNotification,
    showRescheduleNotification
  }
}


