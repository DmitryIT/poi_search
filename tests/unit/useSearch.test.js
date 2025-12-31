import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSearch } from '../../src/composables/useSearch.js'

// Mock the nominatim service
vi.mock('../../src/services/nominatim.js', () => ({
  searchPOI: vi.fn(),
  getInitialCategories: () => [
    { key: 'restaurant', label: 'Restaurants', icon: '🍽️' },
    { key: 'hotel', label: 'Hotels', icon: '🏨' },
    { key: 'cafe', label: 'Cafes', icon: '☕' },
    { key: 'park', label: 'Parks', icon: '🌳' }
  ]
}))

import { searchPOI } from '../../src/services/nominatim.js'

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
  })

  describe('search', () => {
    it('should set error for empty query', async () => {
      const { search, error } = useSearch()

      await search('   ')

      expect(error.value).toBe('Please enter a search term')
      expect(searchPOI).not.toHaveBeenCalled()
    })

    it('should call searchPOI with query and category', async () => {
      const mockResults = [{ id: 1, name: 'Test POI' }]
      searchPOI.mockResolvedValueOnce(mockResults)

      const { search, results } = useSearch()

      await search('coffee shop', 'cafe')

      expect(searchPOI).toHaveBeenCalledWith('coffee shop', { category: 'cafe' })
      expect(results.value).toEqual(mockResults)
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
