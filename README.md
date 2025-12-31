# POI Search

A modern, responsive web application for searching and exploring Points of Interest (POI) on an interactive map.

![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?logo=vue.js)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet)
![License](https://img.shields.io/badge/License-MIT-blue)

## Features

- **Interactive Map**: Powered by Leaflet with OpenStreetMap tiles
- **Satellite View**: Toggle between street map and satellite imagery (Esri)
- **POI Search**: Full-text search using Nominatim (OpenStreetMap) API
- **Category Filtering**: Filter by restaurants, hotels, cafes, parks, and more
- **Smart Categories**: Most recently used categories appear first (LIFO)
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Geolocation**: Automatically centers on user's location (with permission)

## Demo

Visit the live demo: [https://your-username.github.io/poi_search/](https://your-username.github.io/poi_search/)

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Vue 3 | Frontend framework |
| Vite | Build tool |
| Leaflet | Interactive maps |
| Nominatim API | POI search (free, no API key) |
| Vitest | Testing framework |
| GitHub Actions | CI/CD pipeline |
| GitHub Pages | Hosting |

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/poi_search.git
cd poi_search

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run deps:check` | Check for package updates |
| `npm run deps:update` | Update all packages to latest |
| `npm run deps:update:minor` | Update packages (minor versions only) |

## Project Structure

```
poi_search/
├── src/
│   ├── components/
│   │   ├── MapView.vue      # Leaflet map with tile toggle
│   │   ├── SearchBar.vue    # Search input + category filter
│   │   ├── ResultsList.vue  # POI results sidebar
│   │   └── POICard.vue      # Individual POI card
│   ├── composables/
│   │   └── useSearch.js     # Search state management
│   ├── services/
│   │   └── nominatim.js     # Nominatim API service
│   ├── App.vue              # Main application
│   ├── main.js              # Entry point
│   └── style.css            # Global styles
├── tests/
│   ├── unit/                # Unit tests
│   └── integration/         # Integration tests
├── .github/
│   └── workflows/
│       └── deploy.yml       # CI/CD pipeline
└── package.json
```

## API Usage

This app uses the [Nominatim API](https://nominatim.org/) for geocoding and POI search.

**Usage Policy**:
- Maximum 1 request per second (rate limiting built-in)
- User-Agent header required (included)
- Free for use with fair usage

## Deployment

### GitHub Pages (Recommended)

1. Push your code to GitHub
2. Enable GitHub Pages in repository settings
3. The GitHub Action will automatically build and deploy on push to `main`

### Manual Deployment

```bash
# Build the application
npm run build

# The static files will be in the `dist` folder
# Upload to any static hosting service
```

### Alternative Hosting Options

- **Netlify**: Connect your GitHub repo for automatic deploys
- **Vercel**: Zero-config deployment for Vue apps
- **Cloudflare Pages**: Fast global CDN with free tier

## Configuration

### Map Tiles

The app uses these free tile providers:

| Layer | Provider | URL |
|-------|----------|-----|
| Street | OpenStreetMap | `tile.openstreetmap.org` |
| Satellite | Esri World Imagery | `arcgisonline.com` |

### Default Location

- **With geolocation**: Centers on user's location (zoom 12)
- **Without permission**: Centers on Germany (51.1657°N, 10.4515°E, zoom 6)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [OpenStreetMap](https://www.openstreetmap.org/) for map data
- [Nominatim](https://nominatim.org/) for the geocoding API
- [Leaflet](https://leafletjs.com/) for the mapping library
- [Esri](https://www.esri.com/) for satellite imagery
