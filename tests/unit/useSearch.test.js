import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSearch } from '../../src/composables/useSearch.js'

// Mock the nominatim service
vi.mock('../../src/services/nominatim.js', () => ({
  searchPOI: vi.fn(),
  searchByCategory: vi.fn(),
  getInitialCategories: () => [
    { key: 'restaurant', label: 'Restaurants', icon: '🍽️' },
    { key: 'hotel', label: 'Hotels', icon: '🏨' },
    { key: 'cafe', label: 'Cafes', icon: '☕' },
    { key: 'park', label: 'Parks', icon: '🌳' }
  ],
  CATEGORIES: {
    restaurant: { label: 'Restaurants', amenity: 'restaurant', icon: '🍽️' },
    hotel: { label: 'Hotels', tourism: 'hotel', icon: '🏨' },
    cafe: { label: 'Cafes', amenity: 'cafe', icon: '☕' },
    park: { label: 'Parks', leisure: 'park', icon: '🌳' }
  }
}))

import { searchPOI, searchByCategory } from '../../src/services/nominatim.js'

describe('useSearch Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have empty results initially', () => {
      const { results } = useSearch()
      expect(results.value).toEqual([])
    })

    it('should not be loading initially', () => {
      const { isLoading } = useSearch()
      expect(isLoading.value).toBe(false)
    })

    it('should have no error initially', () => {
      const { error } = useSearch()
      expect(error.value).toBeNull()
    })

    it('should have categories in initial order', () => {
      const { categories } = useSearch()
      expect(categories.value[0].key).toBe('restaurant')
      expect(categories.value[1].key).toBe('hotel')
    })

    it('should have null map bounds initially', () => {
      const { mapBounds, mapCenter } = useSearch()
      expect(mapBounds.value).toBeNull()
      expect(mapCenter.value).toBeNull()
    })
  })

  describe('updateMapViewport', () => {
    it('should update map bounds and center', () => {
      const { updateMapViewport, mapBounds, mapCenter } = useSearch()

      const bounds = { south: 52.4, west: 13.3, north: 52.6, east: 13.5 }
      const center = { lat: 52.5, lng: 13.4 }

      updateMapViewport(bounds, center)

      expect(mapBounds.value).toEqual(bounds)
      expect(mapCenter.value).toEqual(center)
    })
  })

  describe('search', () => {
    it('should set error for empty query', async () => {
      const { search, error } = useSearch()

      await search('   ')

      expect(error.value).toBe('Please enter a search term')
      expect(searchPOI).not.toHaveBeenCalled()
    })

    it('should call searchPOI with query, category, and viewbox', async () => {
      const mockResults = [{ id: 1, name: 'Test POI' }]
      searchPOI.mockResolvedValueOnce(mockResults)

      const { search, results, updateMapViewport } = useSearch()

      // Set map viewport
      const bounds = { south: 52.4, west: 13.3, north: 52.6, east: 13.5 }
      updateMapViewport(bounds, null)

      await search('coffee shop', 'cafe')

      expect(searchPOI).toHaveBeenCalledWith('coffee shop', {
        category: 'cafe',
        viewbox: bounds
      })
      expect(results.value).toEqual(mockResults)
    })

    it('should pass map viewport to searchPOI for location-aware results', async () => {
      // Test case for the Frankfurt airport scenario
      // Ensures that when searching for common terms like "airport",
      // the results are limited to the current map viewport
      const mockResults = [{ id: 1, name: 'Frankfurt Airport', lat: 50.0379, lon: 8.5622 }]
      searchPOI.mockResolvedValueOnce(mockResults)

      const { search, updateMapViewport } = useSearch()

      // Simulate zooming to Frankfurt area
      const frankfurtBounds = { south: 50.0, west: 8.5, north: 50.2, east: 8.8 }
      updateMapViewport(frankfurtBounds, { lat: 50.1, lng: 8.65 })

      await search('airport')

      // Verify searchPOI was called with the Frankfurt viewbox
      expect(searchPOI).toHaveBeenCalledWith('airport', {
        category: '',
        viewbox: frankfurtBounds
      })
      expect(searchPOI).toHaveBeenCalledTimes(1)
    })

    it('should set isLoading during search', async () => {
      let resolveSearch
      searchPOI.mockReturnValueOnce(new Promise(resolve => {
        resolveSearch = resolve
      }))

      const { search, isLoading } = useSearch()

      const searchPromise = search('test')
      expect(isLoading.value).toBe(true)

      resolveSearch([])
      await searchPromise

      expect(isLoading.value).toBe(false)
    })

    it('should set error message when no results found', async () => {
      searchPOI.mockResolvedValueOnce([])

      const { search, error } = useSearch()

      await search('nonexistent place xyz')

      expect(error.value).toBe('No results found. Try a different search term.')
    })

    it('should set error on search failure', async () => {
      searchPOI.mockRejectedValueOnce(new Error('Network error'))

      const { search, error } = useSearch()

      await search('test')

      expect(error.value).toBe('Search failed. Please try again.')
    })
  })

  describe('searchCategory', () => {
    it('should search by category with map viewport', async () => {
      const mockResults = [{ id: 1, name: 'Test Cafe' }]
      searchByCategory.mockResolvedValueOnce(mockResults)

      const { searchCategory, results, updateMapViewport } = useSearch()

      const bounds = { south: 52.4, west: 13.3, north: 52.6, east: 13.5 }
      const center = { lat: 52.5, lng: 13.4 }
      updateMapViewport(bounds, center)

      await searchCategory('cafe')

      expect(searchByCategory).toHaveBeenCalledWith('cafe', bounds, center)
      expect(results.value).toEqual(mockResults)
    })

    it('should set error for invalid category', async () => {
      const { searchCategory, error } = useSearch()

      await searchCategory('')

      expect(error.value).toBe('Please select a category')
      expect(searchByCategory).not.toHaveBeenCalled()
    })

    it('should show area-specific error when no results', async () => {
      searchByCategory.mockResolvedValueOnce([])

      const { searchCategory, error } = useSearch()

      await searchCategory('cafe')

      expect(error.value).toContain('No cafes found in this area')
    })

    it('should promote category to top after search', async () => {
      searchByCategory.mockResolvedValueOnce([{ id: 1 }])

      const { searchCategory, categories } = useSearch()

      await searchCategory('park')

      expect(categories.value[0].key).toBe('park')
    })
  })

  describe('LIFO category ordering', () => {
    it('should promote used category to top', async () => {
      searchPOI.mockResolvedValue([{ id: 1 }])

      const { search, categories } = useSearch()

      // Initial order: restaurant, hotel, cafe, park
      expect(categories.value[0].key).toBe('restaurant')

      // Search with cafe category
      await search('test', 'cafe')

      // Cafe should now be first
      expect(categories.value[0].key).toBe('cafe')
      expect(categories.value[1].key).toBe('restaurant')
    })

    it('should not change order if category is already first', async () => {
      searchPOI.mockResolvedValue([{ id: 1 }])

      const { search, categories } = useSearch()

      await search('test', 'restaurant')

      expect(categories.value[0].key).toBe('restaurant')
    })

    it('should maintain order for searches without category', async () => {
      searchPOI.mockResolvedValue([{ id: 1 }])

      const { search, categories } = useSearch()
      const initialOrder = categories.value.map(c => c.key)

      await search('test', '')

      expect(categories.value.map(c => c.key)).toEqual(initialOrder)
    })

    it('should stack multiple category uses correctly', async () => {
      searchPOI.mockResolvedValue([{ id: 1 }])

      const { search, categories } = useSearch()

      await search('test', 'park')
      expect(categories.value[0].key).toBe('park')

      await search('test', 'hotel')
      expect(categories.value[0].key).toBe('hotel')
      expect(categories.value[1].key).toBe('park')
    })
  })

  describe('POI selection', () => {
    it('should select and clear POI', () => {
      const { selectPOI, clearSelection, selectedPOI } = useSearch()

      const poi = { id: 1, name: 'Test' }
      selectPOI(poi)

      expect(selectedPOI.value).toEqual(poi)

      clearSelection()
      expect(selectedPOI.value).toBeNull()
    })
  })

  describe('clearSearch', () => {
    it('should reset all state', async () => {
      searchPOI.mockResolvedValueOnce([{ id: 1 }])

      const { search, clearSearch, results, error, searchQuery, selectedPOI } = useSearch()

      await search('test')

      clearSearch()

      expect(results.value).toEqual([])
      expect(error.value).toBeNull()
      expect(searchQuery.value).toBe('')
      expect(selectedPOI.value).toBeNull()
    })
  })
})
