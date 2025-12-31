<template>
  <div :class="['results-panel', { expanded: isMobileExpanded }]">
    <!-- Mobile handle -->
    <div class="mobile-handle" @click="toggleMobilePanel">
      <div class="handle-bar"></div>
      <span class="handle-text">
        {{ results.length }} result{{ results.length !== 1 ? 's' : '' }}
      </span>
    </div>

    <div class="results-header">
      <h2 class="results-title">
        <span v-if="isLoading">Searching...</span>
        <span v-else-if="results.length">{{ results.length }} Result{{ results.length !== 1 ? 's' : '' }}</span>
        <span v-else>Search Results</span>
      </h2>
      <button
        v-if="results.length"
        class="clear-results-btn"
        @click="$emit('clear')"
      >
        Clear
      </button>
    </div>

    <div class="results-content">
      <!-- Loading state -->
      <div v-if="isLoading" class="results-loading">
        <div class="loading-spinner"></div>
        <p>Searching for places...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="results-message error">
        <span class="message-icon">⚠️</span>
        <p>{{ error }}</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="!results.length" class="results-message empty">
        <span class="message-icon">🔍</span>
        <p>Enter a search term to find places</p>
      </div>

      <!-- Results list -->
      <div v-else class="results-list">
        <POICard
          v-for="poi in results"
          :key="poi.id"
          :poi="poi"
          :is-selected="selectedPOI?.id === poi.id"
          @select="$emit('select', poi)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import POICard from './POICard.vue'

defineProps({
  results: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  selectedPOI: {
    type: Object,
    default: null
  }
})

defineEmits(['select', 'clear'])

const isMobileExpanded = ref(false)

function toggleMobilePanel() {
  isMobileExpanded.value = !isMobileExpanded.value
}
</script>

<style scoped>
.results-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--surface);
  border-left: 1px solid var(--border);
}

.mobile-handle {
  display: none;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.results-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.clear-results-btn {
  padding: 6px 12px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.875rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.clear-results-btn:hover {
  background: var(--background);
  color: var(--text-primary);
}

.results-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.results-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.results-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.message-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
}

.results-message p {
  color: var(--text-secondary);
  font-size: 0.9375rem;
}

.results-message.error p {
  color: #dc2626;
}

/* Mobile styles */
@media (max-width: 768px) {
  .results-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 120px;
    border-left: none;
    border-top: 1px solid var(--border);
    border-radius: var(--radius) var(--radius) 0 0;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
    transition: height 0.3s ease;
    z-index: 1000;
  }

  .results-panel.expanded {
    height: 70vh;
  }

  .mobile-handle {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px;
    cursor: pointer;
  }

  .handle-bar {
    width: 40px;
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    margin-bottom: 8px;
  }

  .handle-text {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .results-header {
    display: none;
  }

  .results-panel.expanded .results-header {
    display: flex;
  }

  .results-content {
    display: none;
  }

  .results-panel.expanded .results-content {
    display: block;
  }
}
</style>
