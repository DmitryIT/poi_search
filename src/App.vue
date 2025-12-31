<template>
  <div class="app">
    <header class="app-header">
      <div class="logo">
        <span class="logo-icon">📍</span>
        <h1 class="logo-text">POI Search</h1>
      </div>
      <SearchBar
        :categories="categories"
        :is-loading="isLoading"
        @search="handleSearch"
        @clear="clearSearch"
      />
    </header>

    <main class="app-main">
      <div class="map-section">
        <MapView
          ref="mapRef"
          :pois="results"
          :selected-p-o-i="selectedPOI"
          @poi-click="selectPOI"
        />
      </div>

      <aside class="results-section">
        <ResultsList
          :results="results"
          :is-loading="isLoading"
          :error="error"
          :selected-p-o-i="selectedPOI"
          @select="handlePOISelect"
          @clear="clearSearch"
        />
      </aside>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SearchBar from './components/SearchBar.vue'
import MapView from './components/MapView.vue'
import ResultsList from './components/ResultsList.vue'
import { useSearch } from './composables/useSearch.js'

const {
  results,
  isLoading,
  error,
  selectedPOI,
  categories,
  search,
  selectPOI,
  clearSearch
} = useSearch()

const mapRef = ref(null)

function handleSearch(query, category) {
  search(query, category)
}

function handlePOISelect(poi) {
  selectPOI(poi)
  // MapView will automatically focus due to watch on selectedPOI
}
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 24px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.logo-icon {
  font-size: 1.5rem;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary);
  white-space: nowrap;
}

.app-header :deep(.search-bar) {
  flex: 1;
  border-bottom: none;
  padding: 12px 0;
}

.app-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.map-section {
  flex: 1;
  position: relative;
}

.results-section {
  width: 380px;
  flex-shrink: 0;
}

/* Mobile styles */
@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    align-items: stretch;
    padding: 12px;
    gap: 0;
  }

  .logo {
    padding-bottom: 12px;
  }

  .logo-text {
    font-size: 1.125rem;
  }

  .app-header :deep(.search-bar) {
    padding: 0;
  }

  .app-main {
    flex-direction: column;
  }

  .map-section {
    flex: 1;
  }

  .results-section {
    width: 100%;
    position: relative;
  }
}
</style>
