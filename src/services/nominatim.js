/**
 * Nominatim API service for OpenStreetMap POI search
 * https://nominatim.org/release-docs/latest/api/Search/
 */

const BASE_URL = 'https://nominatim.openstreetmap.org'

// Category mappings to OSM tags
export const CATEGORIES = {
  restaurant: { label: 'Restaurants', amenity: 'restaurant', icon: '🍽️' },
  hotel: { label: 'Hotels', tourism: 'hotel', icon: '🏨' },
  cafe: { label: 'Cafes', amenity: 'cafe', icon: '☕' },
  park: { label: 'Parks', leisure: 'park', icon: '🌳' },
  hospital: { label: 'Hospitals', amenity: 'hospital', icon: '🏥' },
  pharmacy: { label: 'Pharmacies', amenity: 'pharmacy', icon: '💊' },
  fuel: { label: 'Gas Stations', amenity: 'fuel', icon: '⛽' },
  bank: { label: 'Banks', amenity: 'bank', icon: '🏦' },
  atm: { label: 'ATMs', amenity: 'atm', icon: '💳' },
  supermarket: { label: 'Supermarkets', shop: 'supermarket', icon: '🛒' },
  museum: { label: 'Museums', tourism: 'museum', icon: '🏛️' },
  parking: { label: 'Parking', amenity: 'parking', icon: '🅿️' }
}

/**
 * Rate limiting - Nominatim requires max 1 request per second
 */
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000

async function rateLimitedFetch(url) {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    )
  }

  lastRequestTime = Date.now()

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'POISearchApp/1.0 (https://github.com/poi-search)'
    }
  })

  if (!response.ok) {
    throw new Error(`Nominatim API error: ${response.status}`)
  }

  return response.json()
}

/**
 * Search for POIs using free text search
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @param {string} options.category - Category key from CATEGORIES
 * @param {number} options.limit - Max results (default 20)
 * @param {Object} options.viewbox - Map bounds {south, west, north, east}
 * @returns {Promise<Array>} Array of POI results
 */
export async function searchPOI(query, options = {}) {
  const { category, limit = 20, viewbox } = options

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: String(limit),
    extratags: '1'
  })

  // Add viewbox for location-biased search
  // Format: <west>,<south>,<east>,<north>
  if (viewbox) {
    params.set('viewbox', `${viewbox.west},${viewbox.south},${viewbox.east},${viewbox.north}`)
    // bounded=1 strictly limits results to the viewbox area
    params.set('bounded', '1')
  }

  // Add category filter if specified
  if (category && CATEGORIES[category]) {
    const cat = CATEGORIES[category]
    if (cat.amenity) {
      params.set('amenity', cat.amenity)
    } else if (cat.tourism) {
      params.set('tourism', cat.tourism)
    } else if (cat.leisure) {
      params.set('leisure', cat.leisure)
    } else if (cat.shop) {
      params.set('shop', cat.shop)
    }
  }

  const url = `${BASE_URL}/search?${params.toString()}`
  const data = await rateLimitedFetch(url)

  return data.map(item => normalizePOI(item, category))
}

/**
 * Search for POIs by category in a specific area
 * @param {string} category - Category key from CATEGORIES
 * @param {Object} viewbox - Map bounds {south, west, north, east}
 * @param {Object} center - Map center {lat, lng}
 * @param {number} limit - Max results (default 20)
 * @returns {Promise<Array>} Array of POI results
 */
export async function searchByCategory(category, viewbox, center, limit = 20) {
  if (!category || !CATEGORIES[category]) {
    throw new Error('Invalid category')
  }

  const cat = CATEGORIES[category]

  // Use the category label as search term with location context
  // This helps Nominatim understand we want POIs of this type in this area
  const params = new URLSearchParams({
    q: cat.label,
    format: 'json',
    addressdetails: '1',
    limit: String(limit),
    extratags: '1'
  })

  // Add viewbox for area search with bounded=1 to strictly limit to area
  if (viewbox) {
    params.set('viewbox', `${viewbox.west},${viewbox.south},${viewbox.east},${viewbox.north}`)
    params.set('bounded', '1')
  }

  // Add category filter
  if (cat.amenity) {
    params.set('amenity', cat.amenity)
  } else if (cat.tourism) {
    params.set('tourism', cat.tourism)
  } else if (cat.leisure) {
    params.set('leisure', cat.leisure)
  } else if (cat.shop) {
    params.set('shop', cat.shop)
  }

  const url = `${BASE_URL}/search?${params.toString()}`
  const data = await rateLimitedFetch(url)

  return data.map(item => normalizePOI(item, category))
}

/**
 * Reverse geocode - get address from coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Location details
 */
export async function reverseGeocode(lat, lon) {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: 'json',
    addressdetails: '1'
  })

  const url = `${BASE_URL}/reverse?${params.toString()}`
  return rateLimitedFetch(url)
}

/**
 * Normalize Nominatim response to consistent POI format
 */
function normalizePOI(item, categoryKey) {
  const address = item.address || {}

  // Build readable address
  const addressParts = []
  if (address.road) addressParts.push(address.road)
  if (address.house_number) addressParts[0] = `${addressParts[0] || ''} ${address.house_number}`.trim()
  if (address.city || address.town || address.village) {
    addressParts.push(address.city || address.town || address.village)
  }
  if (address.country) addressParts.push(address.country)

  // Detect category from type/class
  let detectedCategory = categoryKey
  if (!detectedCategory) {
    for (const [key, cat] of Object.entries(CATEGORIES)) {
      if (cat.amenity === item.type ||
          cat.tourism === item.type ||
          cat.leisure === item.type ||
          cat.shop === item.type) {
        detectedCategory = key
        break
      }
    }
  }

  const categoryInfo = CATEGORIES[detectedCategory] || { icon: '📍', label: item.type || 'Place' }

  return {
    id: item.place_id,
    name: item.name || item.display_name.split(',')[0],
    displayName: item.display_name,
    address: addressParts.join(', ') || item.display_name,
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
    type: item.type,
    category: detectedCategory,
    categoryLabel: categoryInfo.label,
    icon: categoryInfo.icon,
    boundingBox: item.boundingbox?.map(parseFloat),
    raw: item
  }
}

/**
 * Get initial category order
 */
export function getInitialCategories() {
  return Object.entries(CATEGORIES).map(([key, value]) => ({
    key,
    ...value
  }))
}
