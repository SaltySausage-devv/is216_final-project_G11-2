<template>
  <div
    class="credits-icon"
    v-if="userType === 'student' || userType === 'tutor'"
  >
    <div class="credits-display">
      <i class="fas fa-coins credits-icon-symbol"></i>
      <span class="credits-amount">{{ credits }}</span>
    </div>
  </div>
</template>

<script>
import { computed } from "vue";
import { useAuthStore } from "../stores/auth";

export default {
  name: "CreditsIcon",
  setup() {
    const authStore = useAuthStore();

    const userType = computed(() => authStore.userType);
    const credits = computed(() => authStore.user?.credits || 0);

    return {
      userType,
      credits,
    };
  },
};
</script>

<style scoped>
.credits-icon {
  display: flex;
  align-items: center;
  margin-right: 1rem;
}

.credits-display {
  display: flex;
  align-items: center;
  background: rgba(255, 140, 66, 0.1);
  border: 1px solid var(--cyber-orange);
  border-radius: 20px;
  padding: 0.5rem 0.75rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.credits-display:hover {
  background: rgba(255, 140, 66, 0.2);
  box-shadow: 0 0 10px rgba(255, 140, 66, 0.3);
  transform: translateY(-1px);
}

.credits-icon-symbol {
  color: var(--cyber-orange);
  font-size: 1rem;
  margin-right: 0.5rem;
  text-shadow: 0 0 5px rgba(255, 140, 66, 0.5);
}

.credits-amount {
  color: var(--cyber-text);
  font-weight: 600;
  font-size: 0.9rem;
  text-shadow: 0 0 3px rgba(255, 255, 255, 0.3);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .credits-icon {
    margin-right: 0.5rem;
  }

  .credits-display {
    padding: 0.4rem 0.6rem;
    border-radius: 15px;
  }

  .credits-icon-symbol {
    font-size: 0.9rem;
    margin-right: 0.4rem;
  }

  .credits-amount {
    font-size: 0.8rem;
  }
}

@media (max-width: 576px) {
  .credits-display {
    padding: 0.3rem 0.5rem;
  }

  .credits-icon-symbol {
    font-size: 0.8rem;
    margin-right: 0.3rem;
  }

  .credits-amount {
    font-size: 0.75rem;
  }
}
</style>
