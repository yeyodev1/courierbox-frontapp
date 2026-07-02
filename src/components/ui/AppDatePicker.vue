<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

interface Props {
  modelValue: string
  label?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  id?: string
  min?: string
  max?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Seleccionar fecha',
  disabled: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const isOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const alignRight = ref(false)
const today = startOfDay(new Date())
const currentMonth = ref(startOfMonth(parseDate(props.modelValue) || today))

const fieldId = computed(() => props.id ?? `date-${Math.random().toString(36).slice(2, 9)}`)
const selectedDate = computed(() => parseDate(props.modelValue))

const selectedLabel = computed(() => {
  if (!selectedDate.value) return props.placeholder
  return selectedDate.value.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
})

const monthLabel = computed(() =>
  currentMonth.value.toLocaleDateString('es-EC', {
    month: 'long',
    year: 'numeric',
  })
)

const weekdayLabels = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

const calendarDays = computed(() => buildCalendarDays(currentMonth.value))

function parseDate(value: string) {
  if (!value) return null
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isSameDay(a: Date | null, b: Date | null) {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isDisabled(date: Date) {
  const min = props.min ? parseDate(props.min) : null
  const max = props.max ? parseDate(props.max) : null
  if (min && date < startOfDay(min)) return true
  if (max && date > startOfDay(max)) return true
  return false
}

function buildCalendarDays(month: Date) {
  const first = startOfMonth(month)
  const firstWeekday = (first.getDay() + 6) % 7
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const days: Array<{ date: Date | null; key: string; disabled?: boolean; empty?: boolean }> = []

  for (let i = 0; i < firstWeekday; i += 1) {
    days.push({ date: null, key: `empty-${i}`, empty: true })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(month.getFullYear(), month.getMonth(), day)
    days.push({ date, key: toIsoDate(date), disabled: isDisabled(date) })
  }

  return days
}

function open() {
  if (props.disabled) return
  currentMonth.value = startOfMonth(selectedDate.value || today)
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

function toggle() {
  isOpen.value ? close() : open()
}

function choose(date: Date) {
  if (isDisabled(date)) return
  emit('update:modelValue', toIsoDate(date))
  close()
  nextTick(() => triggerRef.value?.blur())
}

function goMonth(delta: number) {
  currentMonth.value = addMonths(currentMonth.value, delta)
}

function selectToday() {
  choose(today)
}

function onClickOutside(event: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) close()
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

function updatePanelPosition() {
  const trigger = triggerRef.value
  const panel = panelRef.value
  if (!trigger || !panel) return

  const triggerRect = trigger.getBoundingClientRect()
  const panelWidth = Math.min(320, window.innerWidth - 16)
  alignRight.value = triggerRect.left + panelWidth > window.innerWidth - 12
}

watch(
  () => props.modelValue,
  (value) => {
    if (value && !isOpen.value) {
      currentMonth.value = startOfMonth(parseDate(value) || today)
    }
  }
)

watch(isOpen, async (open) => {
  if (!open) return
  await nextTick()
  updatePanelPosition()
})

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onKeyDown)
  window.addEventListener('resize', updatePanelPosition)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('resize', updatePanelPosition)
})
</script>

<template>
  <div ref="rootRef" :class="['app-date-picker', { 'is-open': isOpen, 'is-disabled': disabled, 'has-error': !!error }]">
    <label v-if="label" :for="fieldId" class="app-date-picker__label">{{ label }}</label>
    <button
      :id="fieldId"
      ref="triggerRef"
      type="button"
      class="app-date-picker__trigger"
      :disabled="disabled"
      :aria-expanded="isOpen"
      aria-haspopup="dialog"
      @click.stop="toggle"
    >
      <span class="app-date-picker__value" :class="{ 'is-placeholder': !selectedDate }">{{ selectedLabel }}</span>
      <span class="app-date-picker__icon"><i class="fa-regular fa-calendar-days" /></span>
    </button>

    <transition name="dropdown">
      <div ref="panelRef" v-show="isOpen" class="app-date-picker__panel" :class="{ 'align-right': alignRight }" role="dialog" aria-label="Selector de fecha">
        <div class="app-date-picker__header">
          <button type="button" class="nav-btn" @click="goMonth(-1)"><i class="fa-solid fa-chevron-left" /></button>
          <div class="month-label">{{ monthLabel }}</div>
          <button type="button" class="nav-btn" @click="goMonth(1)"><i class="fa-solid fa-chevron-right" /></button>
        </div>

        <div class="app-date-picker__weekdays">
          <span v-for="day in weekdayLabels" :key="day">{{ day }}</span>
        </div>

        <div class="app-date-picker__grid">
          <button
            v-for="day in calendarDays"
            :key="day.key"
            type="button"
            class="day-btn"
            :class="{ 'is-empty': day.empty, 'is-selected': isSameDay(day.date, selectedDate), 'is-today': isSameDay(day.date, today), 'is-disabled': day.disabled }"
            :disabled="day.empty || day.disabled"
            @click.stop="day.date && choose(day.date)"
          >
            {{ day.empty ? '' : day.date?.getDate() }}
          </button>
        </div>

        <div class="app-date-picker__footer">
          <button type="button" class="footer-btn" @click="selectToday">Hoy</button>
          <button type="button" class="footer-btn secondary" @click="close">Cerrar</button>
        </div>
      </div>
    </transition>

    <p v-if="error" class="app-date-picker__error">{{ error }}</p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/tokens/motion' as *;

.app-date-picker {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: $space-2;
  width: 100%;

  &__label {
    font-size: 0.8rem;
    font-weight: 500;
    color: $ink-300;
  }

  &__trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: $space-3;
    padding: 0.75rem 1rem;
    background: rgba($ink-1000, 0.5);
    border: 1px solid rgba($ink-500, 0.3);
    border-radius: 10px;
    color: $fg-dark;
    font-size: 0.9rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover:not(:disabled) {
      background: rgba($ink-1000, 0.8);
      border-color: rgba($ink-500, 0.5);
    }

    &:focus {
      outline: none;
      border-color: $brand-orange;
      box-shadow: 0 0 0 3px rgba($brand-orange, 0.1);
      background: rgba($ink-1000, 0.8);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &__value {
    flex: 1 1 auto;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.is-placeholder {
      color: $ink-500;
    }
  }

  &__icon {
    color: $ink-400;
  }

  &__panel {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    z-index: 50;
    width: min(320px, calc(100vw - 16px));
    padding: $space-4;
    background: $ink-900;
    border: 1px solid rgba($ink-500, 0.2);
    border-radius: 16px;
    box-shadow: 0 18px 42px rgba(0, 0, 0, 0.4);

    &.align-right {
      left: auto;
      right: 0;
    }
  }

  &__header {
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

    &:hover {
      background: rgba($ink-600, 0.85);
    }
  }

  &__weekdays,
  &__grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 6px;
  }

  &__weekdays {
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

    &:hover:not(:disabled) {
      background: rgba($brand-orange, 0.12);
      color: $fg-dark;
    }

    &.is-empty {
      cursor: default;
      background: transparent;
    }

    &.is-today {
      border: 1px solid rgba($brand-orange, 0.5);
    }

    &.is-selected {
      background: $brand-orange;
      color: $ink-1000;
      font-weight: 700;
    }

    &.is-disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  }

  &__footer {
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

    &:hover {
      background: rgba($ink-600, 0.85);
    }

    &.secondary {
      background: transparent;
      border: 1px solid rgba($ink-500, 0.22);
      color: $ink-300;
    }
  }

  &.has-error &__trigger {
    border-color: rgba($signal-red, 0.6);
  }

  &__error {
    margin: 0;
    font-size: 0.8rem;
    color: #ff8a8f;
  }
}

@media (max-width: 640px) {
  .app-date-picker {
    &__panel {
      position: fixed;
      left: 0.5rem;
      right: 0.5rem;
      top: auto;
      bottom: 0.5rem;
      width: auto;
      max-width: none;
      max-height: min(78vh, 460px);
      overflow: auto;
      border-radius: 20px 20px 16px 16px;
    }

    &__panel.align-right {
      left: 0.5rem;
      right: 0.5rem;
    }
  }
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s $ease-out-expo;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
