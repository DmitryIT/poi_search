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

    it('should have categories sorted alphabetically by label', () => {
      const { categories } = useSearch()
      // Categories should be sorted alphabetically by label
      // Cafes, Hotels, Parks, Restaurants (from mock data)
      expect(categories.value[0].key).toBe('cafe')
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

    it('should use current map viewport for location-aware search', async () => {
      // Scenario: User zooms to Frankfurt and searches for "airport"
      // The search should pass the current viewport to limit results
      const mockFrankfurtAirport = [{ id: 1, name: 'Frankfurt Airport' }]
      searchPOI.mockResolvedValueOnce(mockFrankfurtAirport)

      const { search, results, updateMapViewport } = useSearch()

      // Simulate user zooming to Frankfurt area
      const frankfurtBounds = { south: 49.9, west: 8.4, north: 50.2, east: 8.8 }
      const frankfurtCenter = { lat: 50.05, lng: 8.6 }
      updateMapViewport(frankfurtBounds, frankfurtCenter)

      await search('airport')

      // Verify viewport is passed to search function
      expect(searchPOI).toHaveBeenCalledWith('airport', {
        category: '',
        viewbox: frankfurtBounds
      })
      expect(results.value).toEqual(mockFrankfurtAirport)
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

    it('should maintain alphabetical order after category search', async () => {
      searchByCategory.mockResolvedValueOnce([{ id: 1 }])

      const { searchCategory, categories } = useSearch()

      await searchCategory('park')

      // Categories remain alphabetically sorted after search
      // (cafe is first alphabetically in the mock data)
      expect(categories.value[0].key).toBe('cafe')
    })
  })

  describe('alphabetical category ordering', () => {
    it('should maintain alphabetical order after search', async () => {
      searchPOI.mockResolvedValue([{ id: 1 }])

      const { search, categories } = useSearch()
      const initialOrder = categories.value.map(c => c.key)

      // Search with any category
      await search('test', 'cafe')

      // Order should remain alphabetical (unchanged)
      expect(categories.value.map(c => c.key)).toEqual(initialOrder)
    })

    it('should maintain alphabetical order for searches without category', async () => {
      searchPOI.mockResolvedValue([{ id: 1 }])

      const { search, categories } = useSearch()
      const initialOrder = categories.value.map(c => c.key)

      await search('test', '')

      expect(categories.value.map(c => c.key)).toEqual(initialOrder)
    })

    it('should sort all categories by label alphabetically', () => {
      const { categories } = useSearch()

      // Verify the list is sorted alphabetically by label
      for (let i = 1; i < categories.value.length; i++) {
        const prev = categories.value[i - 1].label
        const curr = categories.value[i].label
        expect(prev.localeCompare(curr)).toBeLessThan(0)
      }
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
