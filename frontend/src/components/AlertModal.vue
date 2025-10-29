<template>
  <div
    v-if="isVisible"
    class="modal fade show"
    style="display: block; background-color: rgba(0, 0, 0, 0.75)"
    @click.self="handleClose"
    tabindex="-1"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content cyberpunk-modal">
        <div class="modal-header" :class="headerClass">
          <h5 class="modal-title">
            <i :class="iconClass" class="me-2"></i>
            {{ title }}
          </h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            @click="handleClose"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <p class="mb-0">{{ message }}</p>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn cyberpunk-btn-primary"
            @click="handleClose"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'AlertModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Alert'
    },
    message: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'info', // 'info', 'success', 'warning', 'error'
      validator: (value) => ['info', 'success', 'warning', 'error'].includes(value)
    }
  },
  emits: ['close', 'update:visible'],
  setup(props, { emit }) {
    const isVisible = computed({
      get: () => props.visible,
      set: (value) => emit('update:visible', value)
    })

    const headerClass = computed(() => {
      const classes = {
        info: 'modal-header-info',
        success: 'modal-header-success',
        warning: 'modal-header-warning',
        error: 'modal-header-error'
      }
      return classes[props.type] || classes.info
    })

    const iconClass = computed(() => {
      const icons = {
        info: 'fas fa-info-circle',
        success: 'fas fa-check-circle',
        warning: 'fas fa-exclamation-triangle',
        error: 'fas fa-times-circle'
      }
      return icons[props.type] || icons.info
    })

    const handleClose = () => {
      isVisible.value = false
      emit('close')
    }

    return {
      isVisible,
      headerClass,
      iconClass,
      handleClose
    }
  }
}
</script>

<style scoped>
.modal {
  z-index: 10000 !important;
}

.modal-dialog-centered {
  min-height: calc(100% - 3.5rem);
  display: flex;
  align-items: center;
}

.cyberpunk-modal {
  background: rgba(26, 26, 26, 0.98) !important;
  border: 2px solid var(--cyber-orange, #ff8c42) !important;
  box-shadow: 0 0 30px rgba(255, 140, 66, 0.5) !important;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.modal-header {
  border-bottom: 2px solid var(--cyber-orange, #ff8c42);
  padding: 1.25rem;
}

.modal-header-info {
  background: linear-gradient(135deg, rgba(66, 153, 255, 0.2), rgba(66, 153, 255, 0.1));
  border-bottom-color: rgba(66, 153, 255, 0.5);
}

.modal-header-success {
  background: linear-gradient(135deg, rgba(46, 213, 115, 0.2), rgba(46, 213, 115, 0.1));
  border-bottom-color: rgba(46, 213, 115, 0.5);
}

.modal-header-warning {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 193, 7, 0.1));
  border-bottom-color: rgba(255, 193, 7, 0.5);
}

.modal-header-error {
  background: linear-gradient(135deg, rgba(255, 71, 87, 0.2), rgba(255, 71, 87, 0.1));
  border-bottom-color: rgba(255, 71, 87, 0.5);
}

.modal-title {
  color: var(--cyber-text, #ffffff) !important;
  font-weight: 600;
  display: flex;
  align-items: center;
  margin: 0;
}

.modal-body {
  padding: 1.5rem;
  color: var(--cyber-text, #ffffff) !important;
  font-size: 1rem;
  line-height: 1.6;
}

.modal-footer {
  border-top: 2px solid rgba(255, 140, 66, 0.3);
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: flex-end;
}

.cyberpunk-btn-primary {
  background: linear-gradient(
    45deg,
    var(--cyber-orange, #ff8c42),
    var(--cyber-yellow, #ffd23f)
  ) !important;
  border: 2px solid var(--cyber-orange, #ff8c42) !important;
  color: white !important;
  font-weight: 600;
  padding: 0.5rem 1.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(255, 140, 66, 0.3);
}

.cyberpunk-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 25px rgba(255, 140, 66, 0.5) !important;
}

.btn-close-white {
  filter: invert(1) grayscale(100%) brightness(200%);
  opacity: 0.8;
}

.btn-close-white:hover {
  opacity: 1;
}

/* Icon colors */
.modal-header-info .modal-title i {
  color: rgba(66, 153, 255, 1);
}

.modal-header-success .modal-title i {
  color: rgba(46, 213, 115, 1);
}

.modal-header-warning .modal-title i {
  color: rgba(255, 193, 7, 1);
}

.modal-header-error .modal-title i {
  color: rgba(255, 71, 87, 1);
}
</style>

