<script setup lang="ts">
/** Date field with a dropdown calendar, flipped to the right when it would overflow. */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import CalendarPanel from './DatePicker/CalendarPanel.vue'
import { formatLong, isOutOfRange, parseDate, startOfDay, startOfMonth, toIsoDate } from './DatePicker/calendar'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    placeholder?: string
    disabled?: boolean
    error?: string
    id?: string
    min?: string
    max?: string
  }>(),
  { placeholder: 'Seleccionar fecha', disabled: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const isOpen = ref(false)
const alignRight = ref(false)

const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

const today = startOfDay(new Date())
const currentMonth = ref(startOfMonth(parseDate(props.modelValue) || today))

const fieldId = computed(() => props.id ?? `date-${Math.random().toString(36).slice(2, 9)}`)
const selectedDate = computed(() => parseDate(props.modelValue))
const selectedLabel = computed(() =>
  selectedDate.value ? formatLong(selectedDate.value) : props.placeholder,
)

function open() {
  if (props.disabled) return
  currentMonth.value = startOfMonth(selectedDate.value || today)
  isOpen.value = true
}

const close = () => {
  isOpen.value = false
}

const toggle = () => (isOpen.value ? close() : open())

function choose(date: Date) {
  if (isOutOfRange(date, props.min, props.max)) return
  emit('update:modelValue', toIsoDate(date))
  close()
  nextTick(() => triggerRef.value?.blur())
}

function goMonth(delta: number) {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + delta, 1)
}

/** Flip the panel when opening it near the right edge would push it off-screen. */
function updatePanelPosition() {
  const trigger = triggerRef.value
  if (!trigger || !panelRef.value) return
  const panelWidth = Math.min(320, window.innerWidth - 16)
  alignRight.value = trigger.getBoundingClientRect().left + panelWidth > window.innerWidth - 12
}

function onClickOutside(event: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) close()
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

watch(
  () => props.modelValue,
  (value) => {
    if (value && !isOpen.value) currentMonth.value = startOfMonth(parseDate(value) || today)
  },
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
  <div
    ref="rootRef"
    class="app-date-picker"
    :class="{ 'is-open': isOpen, 'is-disabled': disabled, 'has-error': !!error }"
  >
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
      <span class="app-date-picker__value" :class="{ 'is-placeholder': !selectedDate }">
        {{ selectedLabel }}
      </span>
      <span class="app-date-picker__icon"><i class="fa-regular fa-calendar-days" /></span>
    </button>

    <transition name="dropdown">
      <div
        v-show="isOpen"
        ref="panelRef"
        class="app-date-picker__panel"
        :class="{ 'align-right': alignRight }"
        role="dialog"
        aria-label="Selector de fecha"
      >
        <CalendarPanel
          :month="currentMonth"
          :selected="selectedDate"
          :today="today"
          :min="min"
          :max="max"
          @go-month="goMonth"
          @choose="choose"
          @close="close"
        />
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
    font-family: inherit;
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

    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }

  &__value {
    flex: 1 1 auto;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.is-placeholder { color: $ink-500; }
  }

  &__icon { color: $ink-400; }

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

    &.align-right { left: auto; right: 0; }

    /* On phones the dropdown becomes a sheet pinned to the bottom. */
    @media (max-width: 640px) {
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

      &.align-right { left: 0.5rem; right: 0.5rem; }
    }
  }

  &.has-error &__trigger { border-color: rgba($signal-red, 0.6); }

  &__error {
    margin: 0;
    font-size: 0.8rem;
    color: #ff8a8f;
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

@media (prefers-reduced-motion: reduce) {
  .app-date-picker__trigger,
  .dropdown-enter-active,
  .dropdown-leave-active { transition: none; }
}
</style>
