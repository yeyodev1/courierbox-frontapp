<script setup lang="ts">
/** Date-range picker: quick presets plus a two-click calendar selection. */
import { onMounted, onUnmounted, ref, watch } from 'vue'
import RangeCalendar from './DateFilter/RangeCalendar.vue'
import { formatDateDisplay, pickDay, presetRange, toISODate, type DateRange } from './DateFilter/date-range'

const props = defineProps<{ modelValue: DateRange }>()
const emit = defineEmits<{ 'update:modelValue': [range: DateRange]; change: [range: DateRange] }>()

const isOpen = ref(false)
const selectingStart = ref(true)
const localRange = ref<DateRange>({ start: props.modelValue.start || '', end: props.modelValue.end || '' })
const filterRef = ref<HTMLElement | null>(null)

function onDocumentClick(e: MouseEvent) {
  if (filterRef.value && !filterRef.value.contains(e.target as Node)) isOpen.value = false
}

function onPick(dateStr: string) {
  const next = pickDay(localRange.value, selectingStart.value, dateStr)
  localRange.value = next.range
  selectingStart.value = next.selectingStart
}

function applyFilter() {
  // A half-made selection still has to yield a usable range.
  if (!localRange.value.start) localRange.value.start = toISODate(new Date())
  if (!localRange.value.end) localRange.value.end = localRange.value.start

  emit('update:modelValue', localRange.value)
  emit('change', localRange.value)
  isOpen.value = false
}

function setPreset(days: number) {
  localRange.value = presetRange(days)
  selectingStart.value = true
  applyFilter()
}

watch(() => props.modelValue, (value) => { localRange.value = { ...value } }, { deep: true })

onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <div ref="filterRef" class="custom-date-filter">
    <button class="filter-trigger glass-card" @click="isOpen = !isOpen">
      <div class="trigger-info">
        <i class="fa-regular fa-calendar" aria-hidden="true" />
        <span>{{ formatDateDisplay(localRange.start) }} - {{ formatDateDisplay(localRange.end) }}</span>
      </div>
      <i class="fa-solid fa-chevron-down" :class="{ rotated: isOpen }" aria-hidden="true" />
    </button>

    <div v-if="isOpen" class="filter-dropdown glass-card">
      <div class="presets-container">
        <button v-for="d in [7, 15, 30]" :key="d" class="preset-btn" @click="setPreset(d)">
          Últimos {{ d }} días
        </button>
      </div>

      <RangeCalendar :range="localRange" :selecting-start="selectingStart" @pick="onPick" />

      <div class="filter-actions">
        <div class="selection-status">
          <span :class="{ active: selectingStart }">Inicio: {{ formatDateDisplay(localRange.start) }}</span>
          <span :class="{ active: !selectingStart }">Fin: {{ formatDateDisplay(localRange.end) }}</span>
        </div>
        <button class="btn-primary" @click="applyFilter">Aplicar</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/styles/tokens/colors' as *;

.custom-date-filter {
  position: relative;
  width: 100%;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    width: auto;
    display: inline-flex;
    justify-content: flex-end;
  }
}

.filter-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: rgba($ink-900, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(#fff, 0.08);
  border-radius: 16px;
  color: $fg-dark;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  @media (min-width: 768px) { min-width: 280px; }

  &:hover {
    border-color: rgba($brand-orange, 0.4);
    background: rgba($ink-900, 0.8);
    box-shadow: 0 4px 20px rgba($brand-orange, 0.15);
    transform: translateY(-1px);
  }

  .trigger-info {
    display: flex;
    align-items: center;
    gap: 0.875rem;

    i {
      color: $brand-orange;
      font-size: 1.1rem;
      filter: drop-shadow(0 2px 4px rgba($brand-orange, 0.3));
    }
  }

  .fa-chevron-down {
    transition: transform 0.3s ease;
    color: $muted-dark;
    font-size: 0.85rem;

    &.rotated {
      transform: rotate(180deg);
      color: $brand-orange;
    }
  }
}

.filter-dropdown {
  position: absolute;
  top: calc(100% + 0.75rem);
  left: 0;
  right: 0;
  z-index: 50;
  background: rgba($ink-900, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(#fff, 0.1);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(#fff, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  transform-origin: top center;
  animation: dropdownIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  @media (min-width: 768px) {
    width: 340px;
    left: auto;
    right: 0;
  }
}

@keyframes dropdownIn {
  from { opacity: 0; transform: scale(0.95) translateY(-10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.presets-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;

  .preset-btn {
    background: rgba($ink-400, 0.15);
    border: 1px solid transparent;
    color: $muted-dark;
    padding: 0.6rem 0.25rem;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;

    &:hover {
      background: rgba($brand-orange, 0.1);
      color: $brand-orange;
      border-color: rgba($brand-orange, 0.3);
    }
  }
}

.filter-actions {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  border-top: 1px solid rgba(#fff, 0.08);
  padding-top: 1.25rem;

  .selection-status {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: $muted-dark;
    background: rgba($ink-400, 0.1);
    padding: 0.75rem 1rem;
    border-radius: 8px;

    span.active {
      color: $brand-orange;
      font-weight: 600;
    }
  }

  .btn-primary {
    width: 100%;
    padding: 0.875rem;
    background: linear-gradient(135deg, $brand-orange, color.adjust($brand-orange, $lightness: -10%));
    color: #fff;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba($brand-orange, 0.3);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba($brand-orange, 0.4);
    }

    &:active { transform: translateY(1px); }
  }
}

@media (max-width: 480px) {
  .custom-date-filter { margin-bottom: 1.5rem; }

  .filter-dropdown {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    border-radius: 24px 24px 0 0;
    padding: 1.5rem;
    border-bottom: none;
    box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5);
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
}

@media (prefers-reduced-motion: reduce) {
  .filter-trigger,
  .preset-btn,
  .btn-primary { transition: none; }
  .filter-dropdown { animation: none; }
}
</style>
