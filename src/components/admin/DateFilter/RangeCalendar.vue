<script setup lang="ts">
/** Month grid for a date range: navigation, weekday header and the day cells. */
import { computed, ref } from 'vue'
import { buildCalendar, isInRange, isSelected, MONTH_NAMES, type DateRange } from './date-range'

const props = defineProps<{ range: DateRange; selectingStart: boolean }>()
const emit = defineEmits<{ pick: [dateStr: string] }>()

const cursor = ref(new Date())

const year = computed(() => cursor.value.getFullYear())
const month = computed(() => cursor.value.getMonth())
const monthName = computed(() => MONTH_NAMES[month.value])
const days = computed(() => buildCalendar(year.value, month.value))

const shift = (by: number) => {
  cursor.value = new Date(year.value, month.value + by, 1)
}
</script>

<template>
  <div class="calendar-container">
    <div class="calendar-header">
      <button class="nav-btn" aria-label="Mes anterior" @click.stop="shift(-1)">
        <i class="fa-solid fa-chevron-left" aria-hidden="true" />
      </button>
      <span class="month-title">{{ monthName }} {{ year }}</span>
      <button class="nav-btn" aria-label="Mes siguiente" @click.stop="shift(1)">
        <i class="fa-solid fa-chevron-right" aria-hidden="true" />
      </button>
    </div>

    <div class="weekdays">
      <span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sa</span><span>Do</span>
    </div>

    <div class="days-grid">
      <div
        v-for="(day, index) in days"
        :key="index"
        class="day-cell"
        :class="{
          empty: day.empty,
          selected: !day.empty && isSelected(props.range, day.dateString),
          'in-range': !day.empty && isInRange(props.range, day.dateString),
        }"
        @click.stop="!day.empty && day.dateString && emit('pick', day.dateString)"
      >
        <span v-if="!day.empty">{{ day.dayNumber }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;

.calendar-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.5rem;

  .month-title {
    font-weight: 600;
    color: $fg-dark;
    font-size: 1.05rem;
  }

  .nav-btn {
    background: rgba($ink-400, 0.2);
    border: none;
    color: $fg-dark;
    cursor: pointer;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      background: rgba($brand-orange, 0.2);
      color: $brand-orange;
    }
  }
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: $muted-dark;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;

  .day-cell {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    color: $fg-dark;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;

    &.empty { cursor: default; }

    &:not(.empty):hover { background: rgba($ink-400, 0.3); }

    &.in-range {
      background: rgba($brand-orange, 0.15);
      border-radius: 0;
      color: $brand-orange;
    }

    &.selected {
      background: $brand-orange;
      color: #fff;
      font-weight: bold;
      border-radius: 50%;
      box-shadow: 0 4px 10px rgba($brand-orange, 0.4);
      z-index: 2;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .nav-btn,
  .day-cell { transition: none; }
}
</style>
