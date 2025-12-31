import { ref, computed } from 'vue'
import { searchPOI, searchByCategory, getInitialCategories, CATEGORIES } from '../services/nominatim.js'

/**
 * Composable for managing POI search state
 */
export function useSearch() {
  const results = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const searchQuery = ref('')
  const selectedCategory = ref('')
  const selectedPOI = ref(null)

  // Current map viewport
  const mapBounds = ref(null)
  const mapCenter = ref(null)

  // Category order with LIFO - most recently used on top
  const categoryOrder = ref(getInitialCategories().map(c => c.key))

  // Computed sorted categories
  const categories = computed(() => {
    const allCategories = getInitialCategories()
    return categoryOrder.value.map(key =>
      allCategories.find(c => c.key === key)
    ).filter(Boolean)
  })

  /**
   * Move a category to the top of the list (LIFO)
   */
  function promoteCategory(categoryKey) {
    if (!categoryKey) return

    const currentIndex = categoryOrder.value.indexOf(categoryKey)
    if (currentIndex > 0) {
      const newOrder = [...categoryOrder.value]
      newOrder.splice(currentIndex, 1)
      newOrder.unshift(categoryKey)
      categoryOrder.value = newOrder
    }
  }

  /**
   * Update map viewport info
   */
  function updateMapViewport(bounds, center) {
    mapBounds.value = bounds
    mapCenter.value = center
  }

  /**
   * Perform POI search with location bias
   */
  async function search(query, category = '') {
    if (!query.trim()) {
      error.value = 'Please enter a search term'
      return
    }

    searchQuery.value = query
    selectedCategory.value = category
    isLoading.value = true
    error.value = null
    results.value = []
    selectedPOI.value = null

    // Promote used category to top
    if (category) {
      promoteCategory(category)
    }

    try {
      const data = await searchPOI(query, {
        category,
        viewbox: mapBounds.value
      })
      results.value = data

      if (data.length === 0) {
        error.value = 'No results found. Try a different search term.'
      }
    } catch (err) {
      console.error('Search error:', err)
      error.value = 'Search failed. Please try again.'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Search for POIs by category only (in current map view)
   */
  async function searchCategory(category) {
    if (!category || !CATEGORIES[category]) {
      error.value = 'Please select a category'
      return
    }

    selectedCategory.value = category
    searchQuery.value = ''
    isLoading.value = true
    error.value = null
    results.value = []
    selectedPOI.value = null

    // Promote used category to top
    promoteCategory(category)

    try {
      const data = await searchByCategory(
        category,
        mapBounds.value,
        mapCenter.value
      )
      results.value = data

      if (data.length === 0) {
        const catLabel = CATEGORIES[category].label
        error.value = `No ${catLabel.toLowerCase()} found in this area. Try panning the map.`
      }
    } catch (err) {
      console.error('Category search error:', err)
      error.value = 'Search failed. Please try again.'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Select a POI to highlight
   */
  function selectPOI(poi) {
    selectedPOI.value = poi
  }

  /**
   * Clear selection
   */
  function clearSelection() {
    selectedPOI.value = null
  }

  /**
   * Clear all search state
   */
  function clearSearch() {
    results.value = []
    error.value = null
    searchQuery.value = ''
    selectedCategory.value = ''
    selectedPOI.value = null
  }

  return {
    // State
    results,
    isLoading,
    error,
    searchQuery,
    selectedCategory,
    selectedPOI,
    categories,
    mapBounds,
    mapCenter,

    // Actions
    search,
    searchCategory,
    selectPOI,
    clearSelection,
    clearSearch,
    promoteCategory,
    updateMapViewport
  }
}
