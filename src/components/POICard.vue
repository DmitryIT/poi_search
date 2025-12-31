<template>
  <div
    :class="['poi-card', { selected: isSelected }]"
    @click="$emit('select', poi)"
  >
    <div class="poi-icon">{{ poi.icon }}</div>
    <div class="poi-content">
      <h3 class="poi-name">{{ poi.name }}</h3>
      <p class="poi-address">{{ poi.address }}</p>
      <span class="poi-category">{{ poi.categoryLabel || poi.type || 'Place' }}</span>
    </div>
    <div class="poi-arrow">→</div>
  </div>
</template>

<script setup>
defineProps({
  poi: {
    type: Object,
    required: true
  },
  isSelected: {
    type: Boolean,
    default: false
  }
})

defineEmits(['select'])
</script>

<style scoped>
.poi-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: var(--surface);
  border: 2px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.poi-card:hover {
  border-color: var(--primary-light);
  transform: translateX(4px);
}

.poi-card.selected {
  border-color: var(--primary);
  background: var(--background);
}

.poi-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--background);
  border-radius: var(--radius-sm);
}

.poi-content {
  flex: 1;
  min-width: 0;
}

.poi-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.poi-address {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.poi-category {
  display: inline-block;
  font-size: 0.75rem;
  color: var(--primary-dark);
  background: var(--background);
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid var(--border);
}

.poi-arrow {
  color: var(--text-secondary);
  font-size: 1.25rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.poi-card:hover .poi-arrow {
  opacity: 1;
}
</style>
