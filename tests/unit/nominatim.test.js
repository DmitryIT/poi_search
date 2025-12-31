import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We need to import fresh for each test to reset rate limiting state
let searchPOI, searchByCategory, CATEGORIES, getInitialCategories

describe('Nominatim Service', () => {
  beforeEach(async () => {
    vi.resetModules()
    global.fetch = vi.fn()

    // Fresh import to reset rate limiting state
    const module = await import('../../src/services/nominatim.js')
    searchPOI = module.searchPOI
    searchByCategory = module.searchByCategory
    CATEGORIES = module.CATEGORIES
    getInitialCategories = module.getInitialCategories
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('CATEGORIES', () => {
    it('should have all expected categories', () => {
      const expectedCategories = [
        'restaurant', 'hotel', 'cafe', 'park', 'hospital',
        'pharmacy', 'fuel', 'bank', 'atm', 'supermarket', 'museum', 'parking'
      ]

      expectedCategories.forEach(cat => {
        expect(CATEGORIES).toHaveProperty(cat)
        expect(CATEGORIES[cat]).toHaveProperty('label')
        expect(CATEGORIES[cat]).toHaveProperty('icon')
      })
    })

    it('should have OSM tag for each category', () => {
      Object.values(CATEGORIES).forEach(cat => {
        const hasTag = cat.amenity || cat.tourism || cat.leisure || cat.shop
        expect(hasTag).toBeTruthy()
      })
    })
  })

  describe('getInitialCategories', () => {
    it('should return array of category objects with keys', () => {
      const categories = getInitialCategories()

      expect(Array.isArray(categories)).toBe(true)
      expect(categories.length).toBe(Object.keys(CATEGORIES).length)

      categories.forEach(cat => {
        expect(cat).toHaveProperty('key')
        expect(cat).toHaveProperty('label')
        expect(cat).toHaveProperty('icon')
      })
    })
  })

  describe('searchPOI', () => {
    const mockResponse = [
      {
        place_id: 12345,
        name: 'Test Restaurant',
        display_name: 'Test Restaurant, Main Street, Berlin, Germany',
        lat: '52.5200',
        lon: '13.4050',
        type: 'restaurant',
        address: {
          road: 'Main Street',
          house_number: '1',
          city: 'Berlin',
          country: 'Germany'
        }
      }
    ]

    it('should call Nominatim API with correct parameters', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      await searchPOI('restaurant berlin')

      expect(global.fetch).toHaveBeenCalledTimes(1)
      const callUrl = global.fetch.mock.calls[0][0]
      expect(callUrl).toContain('nominatim.openstreetmap.org/search')
      expect(callUrl).toContain('q=restaurant+berlin')
      expect(callUrl).toContain('format=json')
      expect(callUrl).toContain('addressdetails=1')
    })

    it('should add category filter when category is provided', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      await searchPOI('berlin', { category: 'restaurant' })

      const callUrl = global.fetch.mock.calls[0][0]
      expect(callUrl).toContain('amenity=restaurant')
    })

    it('should add viewbox parameter for location-biased search', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const viewbox = { south: 52.4, west: 13.3, north: 52.6, east: 13.5 }
      await searchPOI('restaurant', { viewbox })

      const callUrl = global.fetch.mock.calls[0][0]
      expect(callUrl).toContain('viewbox=13.3%2C52.4%2C13.5%2C52.6')
      expect(callUrl).toContain('bounded=0')
    })

    it('should normalize POI response correctly', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const results = await searchPOI('test')

      expect(results).toHaveLength(1)
      expect(results[0]).toMatchObject({
        id: 12345,
        name: 'Test Restaurant',
        lat: 52.52,
        lon: 13.405,
        address: expect.any(String)
      })
    })

    it('should throw error on API failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      await expect(searchPOI('test')).rejects.toThrow('Nominatim API error: 500')
    })

    it('should include User-Agent header', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      })

      await searchPOI('test')

      const fetchOptions = global.fetch.mock.calls[0][1]
      expect(fetchOptions.headers['User-Agent']).toContain('POISearchApp')
    })
  })

  describe('searchByCategory', () => {
    const mockResponse = [
      {
        place_id: 12345,
        name: 'Test Cafe',
        display_name: 'Test Cafe, Berlin, Germany',
        lat: '52.5200',
        lon: '13.4050',
        type: 'cafe',
        address: {
          city: 'Berlin',
          country: 'Germany'
        }
      }
    ]

    it('should search by category with viewbox', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const viewbox = { south: 52.4, west: 13.3, north: 52.6, east: 13.5 }
      const center = { lat: 52.5, lng: 13.4 }
      await searchByCategory('cafe', viewbox, center)

      const callUrl = global.fetch.mock.calls[0][0]
      expect(callUrl).toContain('q=Cafes')
      expect(callUrl).toContain('amenity=cafe')
      expect(callUrl).toContain('viewbox=13.3%2C52.4%2C13.5%2C52.6')
      expect(callUrl).toContain('bounded=1')
    })

    it('should throw error for invalid category', async () => {
      await expect(searchByCategory('invalid', null, null))
        .rejects.toThrow('Invalid category')
    })

    it('should return normalized results', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const viewbox = { south: 52.4, west: 13.3, north: 52.6, east: 13.5 }
      const results = await searchByCategory('cafe', viewbox, null)

      expect(results).toHaveLength(1)
      expect(results[0]).toMatchObject({
        id: 12345,
        name: 'Test Cafe',
        category: 'cafe'
      })
    })
  })
})
