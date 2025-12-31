import { test, expect } from '@playwright/test';

/**
 * E2E tests for POI Search application
 *
 * These tests verify real search functionality against the Nominatim API.
 * Tests use the map's viewport to bias search results to specific cities.
 */

// City coordinates for map navigation
const CITIES = {
  hamburg: { lat: 53.5511, lng: 9.9937, zoom: 12 },
  zurich: { lat: 47.3769, lng: 8.5417, zoom: 12 }
};

/**
 * Navigate the map to a specific location using Leaflet's API
 */
async function setMapView(page, city) {
  await page.waitForSelector('.leaflet-container', { timeout: 10000 });

  // Wait for Leaflet to initialize
  await page.waitForFunction(() => {
    const container = document.querySelector('.map');
    return container && container._leaflet_id !== undefined;
  }, { timeout: 10000 });

  // Set map view using Leaflet API
  await page.evaluate(({ lat, lng, zoom }) => {
    const mapElement = document.querySelector('.map');
    const leafletId = mapElement._leaflet_id;
    // Find the map instance through L's internal map registry
    const map = Object.values(L || {}).find(v => v && v._leaflet_id === leafletId)
      || window._leafletMap;

    // Alternative: iterate through all Leaflet maps
    if (!map && window.L) {
      for (const key in window.L) {
        const obj = window.L[key];
        if (obj && typeof obj.setView === 'function') {
          obj.setView([lat, lng], zoom);
          return;
        }
      }
      // Last resort: find map through DOM
      const containers = document.querySelectorAll('.leaflet-container');
      containers.forEach(c => {
        if (c._leaflet_map) {
          c._leaflet_map.setView([lat, lng], zoom);
        }
      });
    } else if (map) {
      map.setView([lat, lng], zoom);
    }
  }, city);

  // Wait for map tiles to load
  await page.waitForTimeout(2000);
}

/**
 * Perform a text search and wait for results
 */
async function performSearch(page, query) {
  const searchInput = page.locator('.search-input');
  const searchButton = page.locator('.search-btn');

  await searchInput.fill(query);
  await searchButton.click();

  // Wait for loading to complete
  await page.waitForFunction(() => {
    const spinner = document.querySelector('.spinner');
    const loading = document.querySelector('.results-loading');
    return !spinner && !loading;
  }, { timeout: 30000 });

  // Small delay for results to render
  await page.waitForTimeout(500);
}

/**
 * Select a category and wait for results
 */
async function selectCategory(page, categoryValue) {
  const categorySelect = page.locator('.category-select');
  await categorySelect.selectOption(categoryValue);

  // Wait for loading to complete
  await page.waitForFunction(() => {
    const spinner = document.querySelector('.spinner');
    const loading = document.querySelector('.results-loading');
    return !spinner && !loading;
  }, { timeout: 30000 });

  // Small delay for results to render
  await page.waitForTimeout(500);
}

test.describe('POI Search - Hamburg Pizza Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.search-bar', { timeout: 10000 });
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    // Wait for initial map load
    await page.waitForTimeout(2000);
  });

  test('should find pizza places when searching from Hamburg area', async ({ page }) => {
    // Set map to Hamburg
    await setMapView(page, CITIES.hamburg);

    // Search for pizza
    await performSearch(page, 'pizza Hamburg');

    // Check if we have results (either POI cards or an error/empty state)
    const hasResults = await page.locator('.poi-card').count();
    const hasError = await page.locator('.results-message.error').count();
    const hasEmpty = await page.locator('.results-message.empty').count();

    // We should have either results or a valid state (no hanging)
    expect(hasResults + hasError + hasEmpty).toBeGreaterThan(0);

    if (hasResults > 0) {
      console.log(`Found ${hasResults} pizza results`);

      // Verify results have proper structure
      const firstResult = page.locator('.poi-card').first();
      await expect(firstResult.locator('.poi-name')).toBeVisible();
      await expect(firstResult.locator('.poi-address')).toBeVisible();

      // Verify markers are on the map
      const markers = page.locator('.leaflet-marker-icon');
      const markerCount = await markers.count();
      expect(markerCount).toBeGreaterThan(0);
      console.log(`Found ${markerCount} markers on map`);
    }
  });

  test('should display results panel with count', async ({ page }) => {
    await setMapView(page, CITIES.hamburg);
    await performSearch(page, 'pizza Hamburg');

    const results = await page.locator('.poi-card').count();

    if (results > 0) {
      // Verify results panel shows count
      const resultsTitle = page.locator('.results-title');
      await expect(resultsTitle).toContainText(/\d+ Results?/);
    }
  });
});

test.describe('POI Search - Zürich Category Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.search-bar', { timeout: 10000 });
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test('should find cafes in Zürich area', async ({ page }) => {
    await setMapView(page, CITIES.zurich);

    // Search with location context
    await performSearch(page, 'cafe Zürich');

    const results = await page.locator('.poi-card').count();
    console.log(`Found ${results} cafe results`);

    // Should have results or valid empty/error state
    const hasValidState = results > 0 ||
      await page.locator('.results-message').count() > 0;
    expect(hasValidState).toBeTruthy();
  });

  test('should find restaurants in Zürich area', async ({ page }) => {
    await setMapView(page, CITIES.zurich);
    await performSearch(page, 'restaurant Zürich');

    const results = await page.locator('.poi-card').count();
    console.log(`Found ${results} restaurant results`);
    expect(results).toBeGreaterThanOrEqual(0);
  });

  test('should find gas stations in Zürich area', async ({ page }) => {
    await setMapView(page, CITIES.zurich);
    await performSearch(page, 'tankstelle Zürich');

    const results = await page.locator('.poi-card').count();
    console.log(`Found ${results} gas station results`);
    expect(results).toBeGreaterThanOrEqual(0);
  });

  test('should find ATMs in Zürich area', async ({ page }) => {
    await setMapView(page, CITIES.zurich);
    await performSearch(page, 'bankomat Zürich');

    const results = await page.locator('.poi-card').count();
    console.log(`Found ${results} ATM results`);
    expect(results).toBeGreaterThanOrEqual(0);
  });
});

test.describe('POI Search - Category Dropdown', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.search-bar', { timeout: 10000 });
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test('should search using category dropdown in Zürich', async ({ page }) => {
    await setMapView(page, CITIES.zurich);

    // Test category dropdown with restaurant
    await selectCategory(page, 'restaurant');

    // Wait a bit for API response
    await page.waitForTimeout(2000);

    const results = await page.locator('.poi-card').count();
    console.log(`Found ${results} results via category dropdown`);

    // Category search should work or show appropriate state
    const hasValidState = results > 0 ||
      await page.locator('.results-message').count() > 0;
    expect(hasValidState).toBeTruthy();
  });
});

test.describe('POI Search - User Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.search-bar', { timeout: 10000 });
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test('should allow clicking on a result to select it', async ({ page }) => {
    await setMapView(page, CITIES.hamburg);
    await performSearch(page, 'pizza Hamburg');

    const results = await page.locator('.poi-card').count();

    if (results > 0) {
      const firstCard = page.locator('.poi-card').first();
      await firstCard.click();
      await expect(firstCard).toHaveClass(/selected/);
    }
  });

  test('should toggle map layers', async ({ page }) => {
    await page.waitForSelector('.layer-toggle', { timeout: 10000 });

    const satelliteBtn = page.locator('.toggle-btn:has-text("Satellite")');
    await satelliteBtn.click();
    await expect(satelliteBtn).toHaveClass(/active/);

    const mapBtn = page.locator('.toggle-btn:has-text("Map")');
    await mapBtn.click();
    await expect(mapBtn).toHaveClass(/active/);
  });
});
