import { ref } from 'vue'

const alertState = ref({
  visible: false,
  title: '',
  message: '',
  type: 'info' // 'info', 'success', 'warning', 'error'
})

export function useAlertModal() {
  const showAlert = (title, message, type = 'info') => {
    alertState.value = {
      visible: true,
      title,
      message,
      type
    }
  }

  const showSuccess = (title, message) => {
    showAlert(title, message, 'success')
  }

  const showError = (title, message) => {
    showAlert(title, message, 'error')
  }

  const showWarning = (title, message) => {
    showAlert(title, message, 'warning')
  }

  const showInfo = (title, message) => {
    showAlert(title, message, 'info')
  }

  const hideAlert = () => {
    alertState.value.visible = false
  }

  const handleClose = () => {
    hideAlert()
  }

  return {
    alertState,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideAlert,
    handleClose
  }
}

