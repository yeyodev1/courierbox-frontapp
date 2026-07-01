<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";

export type SelectOption = string | { value: string; label: string };

interface Props {
  modelValue: string;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "Seleccionar…",
  disabled: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const isOpen = ref(false);
const selectionInFlight = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLButtonElement | null>(null);
const fieldId = computed(() => props.id ?? `select-${Math.random().toString(36).slice(2, 9)}`);

const normalizedOptions = computed(() =>
  props.options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : { ...opt }
  )
);

const selectedOption = computed(() =>
  normalizedOptions.value.find((opt) => opt.value === props.modelValue)
);

const selectedLabel = computed(() => selectedOption.value?.label ?? props.placeholder);

function toggle() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
}

function select(value: string) {
  if (selectionInFlight.value) return;
  selectionInFlight.value = true;
  emit("update:modelValue", value);
  isOpen.value = false;
  nextTick(() => triggerRef.value?.blur());
  setTimeout(() => {
    selectionInFlight.value = false;
  }, 0);
}

function close() {
  isOpen.value = false;
}

function onClickOutside(event: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) {
    close();
  }
}

function onKeyDown(event: KeyboardEvent) {
  if (!isOpen.value) return;
  if (event.key === "Escape") {
    close();
  }
}

onMounted(() => {
  document.addEventListener("click", onClickOutside);
  document.addEventListener("keydown", onKeyDown);
});

onUnmounted(() => {
  document.removeEventListener("click", onClickOutside);
  document.removeEventListener("keydown", onKeyDown);
});

watch(
  () => props.modelValue,
  () => {
    if (!normalizedOptions.value.some((opt) => opt.value === props.modelValue)) {
      emit("update:modelValue", normalizedOptions.value[0]?.value ?? "");
    }
  }
);
</script>

<template>
  <div
    ref="rootRef"
    :class="['app-select', { 'is-open': isOpen, 'is-disabled': disabled, 'has-error': !!error }]"
  >
    <label v-if="label" :for="fieldId" class="app-select__label">{{ label }}</label>
    <button
      type="button"
      ref="triggerRef"
      :id="fieldId"
      class="app-select__trigger"
      :disabled="disabled"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      @click.stop="toggle"
    >
      <span class="app-select__value" :class="{ 'is-placeholder': !selectedOption }">
        {{ selectedLabel }}
      </span>
      <span class="app-select__chevron">
        <i class="fa-solid fa-chevron-down" />
      </span>
    </button>

    <transition name="dropdown">
      <ul v-show="isOpen" class="app-select__dropdown" role="listbox">
        <li
          v-for="opt in normalizedOptions"
          :key="opt.value"
          :class="['app-select__option', { 'is-selected': opt.value === modelValue }]"
          role="option"
          :aria-selected="opt.value === modelValue"
          @pointerdown.stop.prevent="select(opt.value)"
          @click.stop="select(opt.value)"
        >
          {{ opt.label }}
        </li>
      </ul>
    </transition>

    <p v-if="error" class="app-select__error">{{ error }}</p>
  </div>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;
@use "@/styles/tokens/space" as *;
@use "@/styles/tokens/motion" as *;

.app-select {
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

  &__chevron {
    flex: 0 0 auto;
    color: $ink-400;
    font-size: 0.75rem;
    transition: transform 0.25s $ease-out-expo;
  }

  &.is-open &__chevron {
    transform: rotate(180deg);
  }

  &__dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 50;
    margin: 0;
    padding: $space-2;
    list-style: none;
    background: $ink-900;
    border: 1px solid rgba($ink-500, 0.2);
    border-radius: 10px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
    max-height: 240px;
    overflow-y: auto;

    @media (max-width: 640px) {
      max-height: 180px;
    }
  }

  &__option {
    padding: 0.65rem 0.85rem;
    border-radius: 8px;
    font-size: 0.9rem;
    color: $ink-200;
    cursor: pointer;
    transition: background 0.18s ease, color 0.18s ease;

    &:hover,
    &:focus {
      background: rgba($ink-500, 0.2);
      color: $fg-dark;
    }

    &.is-selected {
      background: rgba($brand-orange, 0.12);
      color: $brand-orange;
      font-weight: 600;
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
