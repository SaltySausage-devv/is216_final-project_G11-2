import { ref } from 'vue'
import { useRouter } from 'vue-router'

const notifications = ref([])
let notificationId = 0

export function useNotifications() {
  const router = useRouter()

  const showNotification = ({ title, message, conversationId, onClick }) => {
    const id = notificationId++
    const notification = {
      id,
      title,
      message,
      conversationId,
      onClick,
      show: true
    }

    notifications.value.push(notification)

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(id)
    }, 5000)

    return id
  }

  const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
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
    handleNotificationClick,
    showMessageNotification
  }
}


