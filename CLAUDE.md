# POI Search - Claude Code Documentation

A modern, responsive web application for searching and exploring Points of Interest (POI) on an interactive map. This is a pet project demonstrating Vue 3, Leaflet, and clean architecture patterns.

## Quick Start

```bash
npm install          # Install dependencies
npm run dev          # Start development server (port 5173)
npm test             # Run unit and integration tests
npm run test:e2e     # Run Playwright e2e tests
npm run build        # Production build
```

## Technology Stack

| Category | Technology |
|----------|------------|
| Frontend | Vue 3 (Composition API) |
| Build Tool | Vite 7 |
| Mapping | Leaflet 1.9 |
| Unit Tests | Vitest + Vue Test Utils |
| E2E Tests | Playwright |
| APIs | Nominatim (OpenStreetMap), Esri Imagery |
| Hosting | GitHub Pages |

## Project Structure

```
poi_search/
├── src/
│   ├── App.vue                    # Main application shell
│   ├── main.js                    # Entry point
│   ├── style.css                  # Global styles with CSS variables
│   ├── components/
│   │   ├── SearchBar.vue          # Search input + category dropdown
│   │   ├── MapView.vue            # Leaflet map with layer toggle
│   │   ├── ResultsList.vue        # POI results sidebar/drawer
│   │   └── POICard.vue            # Individual POI result card
│   ├── composables/
│   │   └── useSearch.js           # Search state management
│   └── services/
│       └── nominatim.js           # Nominatim API client
├── tests/
│   ├── unit/                      # Unit tests
│   ├── integration/               # Component integration tests
│   └── e2e/                       # Playwright e2e tests
├── .github/workflows/
│   └── deploy.yml                 # CI/CD pipeline
├── playwright.config.js           # Playwright configuration
└── package.json
```

## Architecture

### Data Flow

```
User Input (SearchBar)
       ↓
  Event Handlers (App.vue)
       ↓
  useSearch() Composable
       ↓
  Service Layer (nominatim.js)
       ↓
  Nominatim API (rate-limited)
       ↓
  Response Normalization
       ↓
  Component Rendering (MapView, ResultsList)
```

### Key Components

**useSearch Composable** (`src/composables/useSearch.js`)
- Central state management for search functionality
- Manages: results, loading state, errors, selected POI, categories
- Tracks map viewport for location-biased searches
- Implements LIFO category ordering (most recently used first)

**Nominatim Service** (`src/services/nominatim.js`)
- API client with built-in rate limiting (1 req/sec per Nominatim policy)
- Functions: `searchPOI()`, `searchByCategory()`, `reverseGeocode()`
- Normalizes API responses to standard POI format

**MapView** (`src/components/MapView.vue`)
- Leaflet map integration with street/satellite layer toggle
- Auto-geolocation with fallback to Germany center
- POI markers with popup details
- Emits viewport changes for location-aware search

**SearchBar** (`src/components/SearchBar.vue`)
- Text search with Enter key support
- Category dropdown with 12 predefined categories
- Dynamic placeholder based on selected category

## Features

### Search Capabilities
- **Full-text search** - Search by name or location
- **Category filtering** - 12 categories: restaurants, hotels, cafes, parks, hospitals, pharmacies, gas stations, banks, ATMs, supermarkets, museums, parking
- **Location-aware search** - Results biased to current map viewport
- **Category-only search** - Find all POIs of a type in visible area

### Map Features
- Interactive pan/zoom
- Street map and satellite imagery layers
- Auto-fit results in view
- Click markers for details
- Geolocation support

### Responsive Design
- Desktop: Full sidebar layout (380px panel)
- Mobile: Bottom drawer with drag handle

## Testing

### Test Structure
```
tests/
├── unit/
│   ├── nominatim.test.js      # API service tests
│   └── useSearch.test.js      # Composable tests
├── integration/
│   └── SearchFlow.test.js     # Component tests
└── e2e/
    └── search.spec.js         # Playwright browser tests
```

### Running Tests
```bash
npm test                 # Unit + integration tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:e2e         # Playwright e2e tests (headless)
npm run test:e2e:ui      # Playwright with UI
```

## API Dependencies

All APIs are free and require no authentication:

| API | Purpose | Rate Limit |
|-----|---------|------------|
| Nominatim | POI search, geocoding | 1 req/sec |
| OpenStreetMap Tiles | Street map layer | Fair use |
| Esri World Imagery | Satellite layer | Fair use |

## Design System

CSS variables defined in `src/style.css`:
- Primary color: `#0EA5E9` (Sky Blue)
- Background: `#F0F9FF` (Light Blue)
- Border radius: `12px`
- Responsive breakpoint: `768px`

## Development Commands

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build
npm run deps:check       # Check for dependency updates
npm run deps:update      # Update all dependencies
```

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/deploy.yml`):
1. **Test**: Runs unit, integration, and e2e tests
2. **Build**: Creates production bundle
3. **Deploy**: Publishes to GitHub Pages (main branch only)

## Code Conventions

- Vue 3 Composition API with `<script setup>`
- CSS variables for theming
- Composables for shared state logic
- Services for external API communication
- Comprehensive error handling with user feedback
