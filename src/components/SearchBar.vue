<template>
  <div class="search-bar">
    <div class="search-input-group">
      <span class="search-icon">🔍</span>
      <input
        v-model="query"
        type="text"
        placeholder="Search for places..."
        class="search-input"
        @keyup.enter="handleSearch"
      />
      <button
        v-if="query"
        class="clear-btn"
        @click="clearInput"
        title="Clear search"
      >
        ✕
      </button>
    </div>

    <select
      v-model="category"
      class="category-select"
    >
      <option value="">All Categories</option>
      <option
        v-for="cat in categories"
        :key="cat.key"
        :value="cat.key"
      >
        {{ cat.icon }} {{ cat.label }}
      </option>
    </select>

    <button
      class="search-btn"
      :disabled="isLoading || !query.trim()"
      @click="handleSearch"
    >
      <span v-if="isLoading" class="spinner"></span>
      <span v-else>Search</span>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  categories: {
    type: Array,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['search', 'clear'])

const query = ref('')
const category = ref('')

function handleSearch() {
  if (query.value.trim()) {
    emit('search', query.value.trim(), category.value)
  }
}

function clearInput() {
  query.value = ''
  category.value = ''
  emit('clear')
}
</script>

<style scoped>
.search-bar {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.search-input-group {
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--background);
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0 12px;
  transition: border-color 0.2s ease;
}

.search-input-group:focus-within {
  border-color: var(--primary);
}

.search-icon {
  font-size: 1rem;
  margin-right: 8px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 0;
  font-size: 1rem;
  color: var(--text-primary);
  outline: none;
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.clear-btn {
  background: none;
  color: var(--text-secondary);
  padding: 4px 8px;
  font-size: 0.875rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  background: var(--border);
  color: var(--text-primary);
}

.category-select {
  padding: 12px 16px;
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--background);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  min-width: 160px;
  transition: border-color 0.2s ease;
}

.category-select:focus {
  outline: none;
  border-color: var(--primary);
}

.search-btn {
  padding: 12px 24px;
  background: var(--primary);
  color: white;
  font-weight: 600;
  border-radius: var(--radius-sm);
  transition: background-color 0.2s ease;
  min-width: 100px;
}

.search-btn:hover:not(:disabled) {
  background: var(--primary-dark);
}

.search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .search-bar {
    flex-wrap: wrap;
    padding: 12px;
    gap: 8px;
  }

  .search-input-group {
    width: 100%;
    order: 1;
  }

  .category-select {
    flex: 1;
    order: 2;
    min-width: 0;
  }

  .search-btn {
    order: 3;
    min-width: 80px;
  }
}
</style>
