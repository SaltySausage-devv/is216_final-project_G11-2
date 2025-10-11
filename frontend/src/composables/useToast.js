import { ref } from 'vue'

const toasts = ref([])

export function useToast() {
  function showToast(message, type = 'info', duration = 5000) {
    const id = Date.now() + Math.random()
    const toast = {
      id,
      message,
      type,
      duration,
      show: true
    }

    toasts.value.push(toast)

    // Auto remove after duration
    setTimeout(() => {
      removeToast(id)
    }, duration)

    return id
  }

  function removeToast(id) {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  function clearAllToasts() {
    toasts.value = []
  }

  return {
    toasts,
    showToast,
    removeToast,
    clearAllToasts
  }
}