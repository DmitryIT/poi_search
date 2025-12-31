<template>
  <div class="map-container">
    <div ref="mapRef" class="map"></div>
    <div class="layer-toggle">
      <button
        :class="['toggle-btn', { active: currentLayer === 'street' }]"
        @click="setLayer('street')"
        title="Street Map"
      >
        <span class="toggle-icon">🗺️</span>
        <span class="toggle-label">Map</span>
      </button>
      <button
        :class="['toggle-btn', { active: currentLayer === 'satellite' }]"
        @click="setLayer('satellite')"
        title="Satellite View"
      >
        <span class="toggle-icon">🛰️</span>
        <span class="toggle-label">Satellite</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'

// Fix Leaflet default icon issue with bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
})

const props = defineProps({
  pois: {
    type: Array,
    default: () => []
  },
  selectedPOI: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['poi-click', 'map-ready', 'bounds-change'])

// Germany center as fallback
const DEFAULT_CENTER = [51.1657, 10.4515]
const DEFAULT_ZOOM = 6

const mapRef = ref(null)
const currentLayer = ref('street')

let map = null
let markersLayer = null
let streetTiles = null
let satelliteTiles = null

// Tile layer configurations
const TILE_LAYERS = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
  }
}

function createPopupContent(poi) {
  return `
    <div class="poi-popup">
      <h3>${poi.icon} ${poi.name}</h3>
      <p>${poi.address}</p>
      <span class="category">${poi.categoryLabel || poi.type || 'Place'}</span>
    </div>
  `
}

function setLayer(layerName) {
  if (!map || currentLayer.value === layerName) return

  currentLayer.value = layerName

  if (layerName === 'street') {
    map.removeLayer(satelliteTiles)
    map.addLayer(streetTiles)
  } else {
    map.removeLayer(streetTiles)
    map.addLayer(satelliteTiles)
  }
}

function updateMarkers() {
  if (!map || !markersLayer) return

  markersLayer.clearLayers()

  props.pois.forEach(poi => {
    const marker = L.marker([poi.lat, poi.lon])
      .bindPopup(createPopupContent(poi))
      .on('click', () => {
        emit('poi-click', poi)
      })

    markersLayer.addLayer(marker)
  })

  // Fit bounds to markers if any
  if (props.pois.length > 0) {
    const group = L.featureGroup(markersLayer.getLayers())
    map.fitBounds(group.getBounds().pad(0.1))
  }
}

function focusPOI(poi) {
  if (!map || !poi) return

  map.setView([poi.lat, poi.lon], 16)

  // Find and open the marker popup
  markersLayer.eachLayer(layer => {
    if (layer.getLatLng().lat === poi.lat && layer.getLatLng().lng === poi.lon) {
      layer.openPopup()
    }
  })
}

/**
 * Get current map bounds in the format needed for Nominatim
 * @returns {Object} {south, west, north, east}
 */
function getBounds() {
  if (!map) return null

  const bounds = map.getBounds()
  return {
    south: bounds.getSouth(),
    west: bounds.getWest(),
    north: bounds.getNorth(),
    east: bounds.getEast()
  }
}

/**
 * Get current map center
 * @returns {Object} {lat, lng}
 */
function getCenter() {
  if (!map) return null

  const center = map.getCenter()
  return {
    lat: center.lat,
    lng: center.lng
  }
}

async function getUserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve([position.coords.latitude, position.coords.longitude])
      },
      () => {
        resolve(null)
      },
      { timeout: 5000, enableHighAccuracy: false }
    )
  })
}

onMounted(async () => {
  // Get user location or use default
  const userLocation = await getUserLocation()
  const center = userLocation || DEFAULT_CENTER
  const zoom = userLocation ? 12 : DEFAULT_ZOOM

  // Initialize map
  map = L.map(mapRef.value).setView(center, zoom)

  // Create tile layers
  streetTiles = L.tileLayer(TILE_LAYERS.street.url, {
    attribution: TILE_LAYERS.street.attribution,
    maxZoom: 19
  })

  satelliteTiles = L.tileLayer(TILE_LAYERS.satellite.url, {
    attribution: TILE_LAYERS.satellite.attribution,
    maxZoom: 19
  })

  // Add default layer
  streetTiles.addTo(map)

  // Create markers layer
  markersLayer = L.layerGroup().addTo(map)

  // Initial markers
  updateMarkers()

  // Emit map ready event with initial bounds
  emit('map-ready', { bounds: getBounds(), center: getCenter() })

  // Listen for map move/zoom events
  map.on('moveend', () => {
    emit('bounds-change', { bounds: getBounds(), center: getCenter() })
  })
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})

// Watch for POI changes
watch(() => props.pois, updateMarkers, { deep: true })

// Watch for selection changes
watch(() => props.selectedPOI, (poi) => {
  if (poi) {
    focusPOI(poi)
  }
})

// Expose methods for parent
defineExpose({
  focusPOI,
  setLayer,
  getBounds,
  getCenter
})
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.map {
  width: 100%;
  height: 100%;
  z-index: 1;
}

.layer-toggle {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1000;
  display: flex;
  background: var(--surface);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--surface);
  color: var(--text-secondary);
  border: none;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: var(--background);
}

.toggle-btn.active {
  background: var(--primary);
  color: white;
}

.toggle-btn:first-child {
  border-right: 1px solid var(--border);
}

.toggle-icon {
  font-size: 1rem;
}

.toggle-label {
  font-size: 0.875rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .layer-toggle {
    top: auto;
    bottom: 24px;
    right: 16px;
  }

  .toggle-label {
    display: none;
  }

  .toggle-btn {
    padding: 10px;
  }
}
</style>
