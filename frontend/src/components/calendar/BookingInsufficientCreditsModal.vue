<template>
  <div
    class="modal fade show"
    style="display: block; background-color: rgba(0, 0, 0, 0.5)"
    @click.self="$emit('close')"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content cyberpunk-modal">
        <div class="modal-header cyberpunk-header">
          <h5 class="modal-title">
            <i class="fas fa-exclamation-triangle text-warning me-2"></i>
            Insufficient Credits for Booking
          </h5>
          <button
            type="button"
            class="btn-close"
            @click="$emit('close')"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-warning mb-4">
            <p class="mb-0">
              <strong>You don't have enough credits to confirm this booking.</strong>
            </p>
            <p class="mb-0 mt-2">
              Please top up your credits to proceed with booking confirmation.
            </p>
          </div>

          <!-- Credit Breakdown -->
          <div class="credit-breakdown mb-4">
            <h6 class="mb-3">
              <i class="fas fa-calculator me-2"></i>
              Credit Breakdown
            </h6>

            <!-- Required Credits -->
            <div class="credit-item mb-3">
              <div class="d-flex justify-content-between align-items-center">
                <span class="credit-label">
                  <i class="fas fa-calendar-check text-primary me-2"></i>
                  Required Credits:
                </span>
                <span class="credit-value text-primary fw-bold">
                  {{ formatCredits(requiredCredits) }} Credits
                </span>
              </div>
              <small class="text-muted ms-4">
                Total cost for this booking
              </small>
            </div>

            <!-- Student Current Credits -->
            <div class="credit-item mb-3">
              <div class="d-flex justify-content-between align-items-center">
                <span class="credit-label">
                  <i class="fas fa-wallet text-info me-2"></i>
                  Your Current Credits:
                </span>
                <span class="credit-value text-info fw-bold">
                  {{ formatCredits(currentCredits) }} Credits
                </span>
              </div>
              <small class="text-muted ms-4">
                Your current credit balance
              </small>
            </div>

            <!-- Divider -->
            <hr class="my-3" />

            <!-- Shortfall -->
            <div class="credit-shortfall mt-4 p-3 bg-danger bg-opacity-10 rounded">
              <div class="d-flex justify-content-between align-items-center">
                <span class="credit-label fw-bold text-danger">
                  <i class="fas fa-exclamation-circle me-2"></i>
                  Shortfall:
                </span>
                <span class="credit-value text-danger fw-bold fs-5">
                  {{ formatCredits(shortfall) }} Credits
                </span>
              </div>
              <p class="mb-0 mt-2 text-muted small">
                You need {{ formatCredits(shortfall) }} more credits to confirm this booking.
              </p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="d-flex gap-2 justify-content-end">
            <button
              type="button"
              class="btn btn-secondary"
              @click="$emit('close')"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BookingInsufficientCreditsModal',
  props: {
    requiredCredits: {
      type: Number,
      required: true
    },
    currentCredits: {
      type: Number,
      required: true
    },
    shortfall: {
      type: Number,
      required: true
    }
  },
  emits: ['close'],
  setup() {
    const formatCredits = (credits) => {
      return parseFloat(credits).toFixed(2)
    }

    return {
      formatCredits
    }
  }
}
</script>

<style scoped>
.cyberpunk-modal {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 2px solid var(--cyber-orange);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(232, 90, 42, 0.3);
}

.cyberpunk-header {
  background: linear-gradient(135deg, rgba(232, 90, 42, 0.1) 0%, rgba(232, 90, 42, 0.05) 100%);
  border-bottom: 2px solid var(--cyber-orange);
  padding: 1rem 1.5rem;
}

.modal-title {
  color: var(--cyber-orange);
  font-weight: 600;
  text-shadow: 0 0 10px rgba(232, 90, 42, 0.5);
}

.credit-breakdown {
  background: rgba(26, 26, 26, 0.5);
  border: 1px solid rgba(232, 90, 42, 0.3);
  border-radius: 8px;
  padding: 1.5rem;
}

.credit-item {
  padding: 0.75rem;
  background: rgba(45, 45, 45, 0.3);
  border-radius: 6px;
  border-left: 3px solid var(--cyber-orange);
}

.credit-label {
  color: #ffffff;
  font-size: 0.95rem;
}

.credit-value {
  font-size: 1.1rem;
}

.credit-shortfall {
  border: 2px solid rgba(220, 53, 69, 0.5) !important;
}

.btn-close {
  filter: invert(1);
  opacity: 0.8;
}

.btn-close:hover {
  opacity: 1;
}
</style>

