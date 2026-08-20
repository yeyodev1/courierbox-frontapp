<script setup lang="ts">
/** Month grid of the date picker: header, weekday row, days and shortcuts. */
import { computed } from 'vue'
import {
  WEEKDAY_LABELS,
  buildCalendarDays,
  formatMonth,
  isSameDay,
} from './calendar'

const props = defineProps<{
  month: Date
  selected: Date | null
  today: Date
  min?: string
  max?: string
}>()

const emit = defineEmits<{ 'go-month': [delta: number]; choose: [date: Date]; close: [] }>()

const days = computed(() => buildCalendarDays(props.month, props.min, props.max))
const monthLabel = computed(() => formatMonth(props.month))
</script>

<template>
  <div class="panel-body">
    <div class="header">
      <button type="button" class="nav-btn" aria-label="Mes anterior" @click="emit('go-month', -1)">
        <i class="fa-solid fa-chevron-left" />
      </button>
      <div class="month-label">{{ monthLabel }}</div>
      <button type="button" class="nav-btn" aria-label="Mes siguiente" @click="emit('go-month', 1)">
        <i class="fa-solid fa-chevron-right" />
      </button>
    </div>

    <div class="weekdays">
      <span v-for="day in WEEKDAY_LABELS" :key="day">{{ day }}</span>
    </div>

    <div class="grid">
      <button
        v-for="day in days"
        :key="day.key"
        type="button"
        class="day-btn"
        :class="{
          'is-empty': day.empty,
          'is-selected': isSameDay(day.date, selected),
          'is-today': isSameDay(day.date, today),
          'is-disabled': day.disabled,
        }"
        :disabled="day.empty || day.disabled"
        @click.stop="day.date && emit('choose', day.date)"
      >
        {{ day.empty ? '' : day.date?.getDate() }}
      </button>
    </div>

    <div class="footer">
      <button type="button" class="footer-btn" @click="emit('choose', today)">Hoy</button>
      <button type="button" class="footer-btn secondary" @click="emit('close')">Cerrar</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  margin-bottom: $space-3;
}

.month-label {
  text-transform: capitalize;
  font-weight: 700;
  color: $fg-dark;
}

.nav-btn,
.footer-btn,
.day-btn {
  border: none;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba($ink-700, 0.75);
  color: $fg-dark;

  &:hover { background: rgba($ink-600, 0.85); }
}

.weekdays,
.grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}

.weekdays {
  margin-bottom: 8px;
  color: $ink-400;
  font-size: 0.72rem;
  text-align: center;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.day-btn {
  aspect-ratio: 1;
  border-radius: 12px;
  background: transparent;
  color: $ink-200;
  font-size: 0.88rem;

  &:hover:not(:disabled) { background: rgba($brand-orange, 0.12); color: $fg-dark; }

  &.is-empty { cursor: default; background: transparent; }
  &.is-today { border: 1px solid rgba($brand-orange, 0.5); }

  &.is-selected {
    background: $brand-orange;
    color: $ink-1000;
    font-weight: 700;
  }

  &.is-disabled { opacity: 0.35; cursor: not-allowed; }
}

.footer {
  display: flex;
  justify-content: space-between;
  gap: $space-2;
  margin-top: $space-4;
}

.footer-btn {
  flex: 1;
  padding: 0.65rem 0.85rem;
  border-radius: 12px;
  background: rgba($ink-700, 0.7);
  color: $fg-dark;

  &:hover { background: rgba($ink-600, 0.85); }

  &.secondary {
    background: transparent;
    border: 1px solid rgba($ink-500, 0.22);
    color: $ink-300;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nav-btn,
  .footer-btn,
  .day-btn { transition: none; }
}
</style>
