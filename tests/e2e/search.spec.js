import { test, expect } from '@playwright/test';

/**
 * E2E tests for POI Search application
 *
 * These tests verify real search functionality against the Nominatim API
 * and validate that results are geographically correct.
 */

// City coordinates for map navigation
const CITIES = {
  hamburg: {
    lat: 53.5511,
    lng: 9.9937,
    name: 'Hamburg',
    // Bounding box for reasonable distance validation (approx 50km radius)
    bounds: {
      minLat: 53.3,
      maxLat: 53.8,
      minLng: 9.5,
      maxLng: 10.5
    }
  },
  zurich: {
    lat: 47.3769,
    lng: 8.5417,
    name: 'Zürich',
    // Bounding box for reasonable distance validation (approx 50km radius)
    bounds: {
      minLat: 47.1,
      maxLat: 47.6,
      minLng: 8.2,
      maxLng: 8.9
    }
  }
};

/**
 * Helper to navigate the map to a specific location using Leaflet
 */
async function navigateMapToCity(page, city) {
  // Wait for map to be ready
  await page.waitForSelector('.leaflet-container');

  // Use Leaflet's API to set the map view
  await page.evaluate(({ lat, lng }) => {
    // Access the Leaflet map instance from the global scope or DOM
    const mapContainer = document.querySelector('.leaflet-container');
    if (mapContainer && mapContainer._leaflet_map) {
      mapContainer._leaflet_map.setView([lat, lng], 12);
    } else {
      // Alternative: find the map through Leaflet's internal registry
      const mapId = Object.keys(window.L._container || {}).find(id =>
        document.querySelector(`#${id}`)
      );
      if (window.L && window.L.map) {
        // Try to access the map through the container
        const container = document.querySelector('.map');
        if (container && container._leaflet_id) {
          const map = L.DomUtil.get(container)._leaflet_map ||
                      Object.values(L.Map._container || {})[0];
          if (map) map.setView([lat, lng], 12);
        }
      }
    }
  }, city);

  // Wait for map tiles to load
  await page.waitForTimeout(1500);
}

/**
 * Alternative helper to navigate map by dragging or using search
 * This method is more reliable as it doesn't depend on internal Leaflet state
 */
async function navigateToLocationViaSearch(page, locationName) {
  const searchInput = page.locator('.search-input');
  const searchButton = page.locator('.search-btn');

  // Search for the city to center the map there
  await searchInput.fill(locationName);
  await searchButton.click();

  // Wait for results to load
  await page.waitForSelector('.poi-card', { timeout: 15000 });

  // Wait for map to adjust
  await page.waitForTimeout(1000);

  // Clear the search
  const clearButton = page.locator('.clear-btn');
  if (await clearButton.isVisible()) {
    await clearButton.click();
  }

  // Wait for clear to take effect
  await page.waitForTimeout(500);
}

/**
 * Validate that addresses contain expected location indicators
 */
function isAddressNearCity(address, cityName) {
  const normalizedAddress = address.toLowerCase();
  const normalizedCity = cityName.toLowerCase();

  // Check for city name or common German/Swiss location indicators
  const locationIndicators = [
    normalizedCity,
    // Hamburg area
    'hamburg', 'hh', 'altona', 'wandsbek', 'harburg', 'bergedorf', 'eimsbüttel',
    // Zürich area
    'zürich', 'zurich', 'zh', 'winterthur', 'kloten', 'dübendorf', 'uster'
  ];

  return locationIndicators.some(indicator => normalizedAddress.includes(indicator));
}

test.describe('POI Search - Hamburg Pizza Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to fully load
    await page.waitForSelector('.search-bar');
    await page.waitForSelector('.leaflet-container');
    // Give time for initial geolocation to complete
    await page.waitForTimeout(2000);
  });

  test('should find pizza places in Hamburg area', async ({ page }) => {
    // Navigate to Hamburg by searching for it first
    await navigateToLocationViaSearch(page, 'Hamburg Germany');

    // Now search for pizza
    const searchInput = page.locator('.search-input');
    const searchButton = page.locator('.search-btn');

    await searchInput.fill('pizza');
    await searchButton.click();

    // Wait for results with increased timeout for API calls
    await page.waitForSelector('.poi-card', { timeout: 20000 });

    // Verify we have results
    const results = page.locator('.poi-card');
    const resultCount = await results.count();

    expect(resultCount).toBeGreaterThan(0);
    console.log(`Found ${resultCount} pizza results`);

    // Check that results are displayed with proper structure
    const firstResult = results.first();
    await expect(firstResult.locator('.poi-name')).toBeVisible();
    await expect(firstResult.locator('.poi-address')).toBeVisible();

    // Verify that at least some results are in Hamburg area
    // by checking the addresses contain Hamburg-related text
    const addresses = await page.locator('.poi-address').allTextContents();

    // At least one result should mention Hamburg or be in the area
    const hamburgResults = addresses.filter(addr =>
      isAddressNearCity(addr, 'Hamburg')
    );

    console.log(`Hamburg area results: ${hamburgResults.length} of ${addresses.length}`);

    // Expect at least some results to be clearly in Hamburg
    // We're lenient here since Nominatim might return results from nearby areas
    expect(hamburgResults.length).toBeGreaterThan(0);
  });

  test('should display search results in results panel', async ({ page }) => {
    await navigateToLocationViaSearch(page, 'Hamburg');

    const searchInput = page.locator('.search-input');
    await searchInput.fill('pizza');
    await page.locator('.search-btn').click();

    // Wait for results
    await page.waitForSelector('.results-list', { timeout: 20000 });

    // Verify results panel shows count
    const resultsTitle = page.locator('.results-title');
    await expect(resultsTitle).toContainText(/\d+ Results?/);

    // Verify each POI card has required elements
    const firstCard = page.locator('.poi-card').first();
    await expect(firstCard.locator('.poi-icon')).toBeVisible();
    await expect(firstCard.locator('.poi-name')).toBeVisible();
    await expect(firstCard.locator('.poi-address')).toBeVisible();
    await expect(firstCard.locator('.poi-category')).toBeVisible();
  });

  test('should show markers on the map', async ({ page }) => {
    await navigateToLocationViaSearch(page, 'Hamburg');

    const searchInput = page.locator('.search-input');
    await searchInput.fill('pizza');
    await page.locator('.search-btn').click();

    // Wait for results
    await page.waitForSelector('.poi-card', { timeout: 20000 });

    // Verify markers are displayed on the map
    const markers = page.locator('.leaflet-marker-icon');
    const markerCount = await markers.count();

    expect(markerCount).toBeGreaterThan(0);
    console.log(`Found ${markerCount} markers on map`);
  });
});

test.describe('POI Search - Zürich Category Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.search-bar');
    await page.waitForSelector('.leaflet-container');
    await page.waitForTimeout(2000);
  });

  test('should find cafes in Zürich area', async ({ page }) => {
    // Navigate to Zürich
    await navigateToLocationViaSearch(page, 'Zürich Switzerland');

    // Select cafe category
    const categorySelect = page.locator('.category-select');
    await categorySelect.selectOption('cafe');

    // Wait for category search to complete
    await page.waitForSelector('.poi-card', { timeout: 20000 });

    // Verify results
    const results = page.locator('.poi-card');
    const resultCount = await results.count();
    expect(resultCount).toBeGreaterThan(0);
    console.log(`Found ${resultCount} cafe results`);

    // Check addresses
    const addresses = await page.locator('.poi-address').allTextContents();
    const zurichResults = addresses.filter(addr =>
      isAddressNearCity(addr, 'Zürich')
    );

    console.log(`Zürich area cafes: ${zurichResults.length} of ${addresses.length}`);
    expect(zurichResults.length).toBeGreaterThan(0);
  });

  test('should find restaurants in Zürich area', async ({ page }) => {
    await navigateToLocationViaSearch(page, 'Zürich');

    const categorySelect = page.locator('.category-select');
    await categorySelect.selectOption('restaurant');

    await page.waitForSelector('.poi-card', { timeout: 20000 });

    const results = page.locator('.poi-card');
    const resultCount = await results.count();
    expect(resultCount).toBeGreaterThan(0);
    console.log(`Found ${resultCount} restaurant results`);

    const addresses = await page.locator('.poi-address').allTextContents();
    const zurichResults = addresses.filter(addr =>
      isAddressNearCity(addr, 'Zürich')
    );

    expect(zurichResults.length).toBeGreaterThan(0);
  });

  test('should find gas stations in Zürich area', async ({ page }) => {
    await navigateToLocationViaSearch(page, 'Zürich');

    const categorySelect = page.locator('.category-select');
    await categorySelect.selectOption('gas_station');

    await page.waitForSelector('.poi-card', { timeout: 20000 });

    const results = page.locator('.poi-card');
    const resultCount = await results.count();
    expect(resultCount).toBeGreaterThan(0);
    console.log(`Found ${resultCount} gas station results`);
  });

  test('should find ATMs in Zürich area', async ({ page }) => {
    await navigateToLocationViaSearch(page, 'Zürich');

    const categorySelect = page.locator('.category-select');
    await categorySelect.selectOption('atm');

    await page.waitForSelector('.poi-card', { timeout: 20000 });

    const results = page.locator('.poi-card');
    const resultCount = await results.count();
    expect(resultCount).toBeGreaterThan(0);
    console.log(`Found ${resultCount} ATM results`);
  });

  test('should search all categories sequentially in Zürich', async ({ page }) => {
    // This test validates all four required categories in one flow
    await navigateToLocationViaSearch(page, 'Zürich Switzerland');

    const categorySelect = page.locator('.category-select');
    const categories = [
      { value: 'cafe', name: 'Cafe' },
      { value: 'restaurant', name: 'Restaurant' },
      { value: 'gas_station', name: 'Gas Station' },
      { value: 'atm', name: 'ATM' }
    ];

    for (const category of categories) {
      console.log(`Testing category: ${category.name}`);

      // Select category
      await categorySelect.selectOption(category.value);

      // Wait for results
      await page.waitForSelector('.poi-card', { timeout: 20000 });

      // Verify results exist
      const results = page.locator('.poi-card');
      const resultCount = await results.count();

      console.log(`  ${category.name}: ${resultCount} results`);
      expect(resultCount).toBeGreaterThan(0);

      // Verify markers on map
      const markers = page.locator('.leaflet-marker-icon');
      const markerCount = await markers.count();
      expect(markerCount).toBeGreaterThan(0);

      // Small delay between searches to respect rate limiting
      await page.waitForTimeout(1500);
    }
  });
});

test.describe('POI Search - User Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.search-bar');
    await page.waitForSelector('.leaflet-container');
    await page.waitForTimeout(2000);
  });

  test('should allow clicking on a result to select it', async ({ page }) => {
    await navigateToLocationViaSearch(page, 'Hamburg');

    const searchInput = page.locator('.search-input');
    await searchInput.fill('pizza');
    await page.locator('.search-btn').click();

    await page.waitForSelector('.poi-card', { timeout: 20000 });

    // Click on the first result
    const firstCard = page.locator('.poi-card').first();
    await firstCard.click();

    // Verify the card becomes selected
    await expect(firstCard).toHaveClass(/selected/);
  });

  test('should clear results when clear button is clicked', async ({ page }) => {
    await navigateToLocationViaSearch(page, 'Hamburg');

    const searchInput = page.locator('.search-input');
    await searchInput.fill('pizza');
    await page.locator('.search-btn').click();

    await page.waitForSelector('.poi-card', { timeout: 20000 });

    // Click clear button in results panel
    const clearResultsBtn = page.locator('.clear-results-btn');
    await clearResultsBtn.click();

    // Verify results are cleared
    await expect(page.locator('.poi-card')).toHaveCount(0);
  });

  test('should toggle map layers', async ({ page }) => {
    // Wait for map to load
    await page.waitForSelector('.layer-toggle');

    // Click satellite button
    const satelliteBtn = page.locator('.toggle-btn:has-text("Satellite")');
    await satelliteBtn.click();

    // Verify satellite button is active
    await expect(satelliteBtn).toHaveClass(/active/);

    // Click map button
    const mapBtn = page.locator('.toggle-btn:has-text("Map")');
    await mapBtn.click();

    // Verify map button is active
    await expect(mapBtn).toHaveClass(/active/);
  });
});
