<script setup lang="ts">
/**
 * El selector de la app. Nada de <select> nativo: mismo look en todas las
 * pantallas, búsqueda cuando la lista crece, teclado (flechas, Enter, Esc),
 * un texto secundario por opción (precio, ciudad…) y una acción al final de
 * la lista («Crear producto nuevo») cuando lo que se busca no existe.
 *
 * El desplegable se teletransporta al body y se posiciona bajo el botón, así
 * no lo recorta una tabla con scroll ni un modal con overflow.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

export type SelectOption = string | { value: string; label: string; hint?: string; disabled?: boolean };

interface Props {
  modelValue: string;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  id?: string;
  /** Muestra el buscador. Por defecto, cuando hay más de 6 opciones. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Deja quitar la selección (vuelve a ""). */
  clearable?: boolean;
  /** Acción al pie de la lista, p. ej. «Crear producto nuevo». Emite `action` con el texto buscado. */
  actionLabel?: string;
  actionIcon?: string;
  /** Texto cuando la búsqueda no encuentra nada. */
  emptyText?: string;
  /** Si el valor no está entre las opciones: true lo deja vacío (placeholder); false elige la primera. */
  allowEmpty?: boolean;
  size?: "md" | "sm";
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "Seleccionar…",
  disabled: false,
  searchable: undefined,
  searchPlaceholder: "Buscar…",
  clearable: false,
  actionLabel: "",
  actionIcon: "fa-solid fa-plus",
  emptyText: "Sin resultados",
  allowEmpty: true,
  size: "md",
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  action: [query: string];
  open: [];
  close: [];
}>();

const isOpen = ref(false);
const query = ref("");
const highlighted = ref(-1);
const rootRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLButtonElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const searchRef = ref<HTMLInputElement | null>(null);
const fieldId = computed(() => props.id ?? `select-${Math.random().toString(36).slice(2, 9)}`);
const listId = computed(() => `${fieldId.value}-list`);

const normalizedOptions = computed(() =>
  props.options.map((opt) => (typeof opt === "string" ? { value: opt, label: opt } : { ...opt }))
);

const selectedOption = computed(() => normalizedOptions.value.find((opt) => opt.value === props.modelValue));
const selectedLabel = computed(() => selectedOption.value?.label ?? props.placeholder);
const showSearch = computed(() => (props.searchable === undefined ? normalizedOptions.value.length > 6 : props.searchable));

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const filteredOptions = computed(() => {
  const q = normalize(query.value.trim());
  if (!q) return normalizedOptions.value;
  return normalizedOptions.value.filter((o) => normalize(`${o.label} ${o.hint ?? ""}`).includes(q));
});

/** Índices navegables (sin las deshabilitadas). */
const enabledIndexes = computed(() => filteredOptions.value.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0));

// ---- posición: bajo el botón, o encima si no cabe ----
const style = ref<Record<string, string>>({});
function place() {
  const t = triggerRef.value;
  if (!t) return;
  const r = t.getBoundingClientRect();
  const maxH = 300;
  const espacioAbajo = window.innerHeight - r.bottom - 8;
  const arriba = espacioAbajo < Math.min(maxH, 200) && r.top > espacioAbajo;
  const alto = Math.min(maxH, Math.max(120, (arriba ? r.top : espacioAbajo) - 8));
  style.value = {
    position: "fixed",
    left: `${r.left}px`,
    width: `${r.width}px`,
    maxHeight: `${alto}px`,
    ...(arriba ? { bottom: `${window.innerHeight - r.top + 4}px` } : { top: `${r.bottom + 4}px` }),
  };
}

async function open() {
  if (props.disabled || isOpen.value) return;
  query.value = "";
  isOpen.value = true;
  emit("open");
  await nextTick();
  place();
  const sel = filteredOptions.value.findIndex((o) => o.value === props.modelValue);
  highlighted.value = sel >= 0 ? sel : (enabledIndexes.value[0] ?? -1);
  if (showSearch.value) searchRef.value?.focus();
  else dropdownRef.value?.focus();
}

function close(focusTrigger = false) {
  if (!isOpen.value) return;
  isOpen.value = false;
  query.value = "";
  emit("close");
  if (focusTrigger) triggerRef.value?.focus();
}

function toggle() {
  if (isOpen.value) close(true);
  else void open();
}

function select(value: string) {
  emit("update:modelValue", value);
  close(true);
}

function clear() {
  emit("update:modelValue", "");
  close(true);
}

function doAction() {
  const q = query.value.trim();
  close(true);
  emit("action", q);
}

function move(delta: number) {
  const idx = enabledIndexes.value;
  if (!idx.length) return;
  const pos = idx.indexOf(highlighted.value);
  const next = pos === -1 ? (delta > 0 ? idx[0] : idx[idx.length - 1]) : idx[(pos + delta + idx.length) % idx.length];
  highlighted.value = next!;
  nextTick(() => dropdownRef.value?.querySelector<HTMLElement>(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" }));
}

function onKeydown(e: KeyboardEvent) {
  if (!isOpen.value) {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      void open();
    }
    return;
  }
  if (e.key === "Escape") { e.preventDefault(); close(true); return; }
  if (e.key === "ArrowDown") { e.preventDefault(); move(1); return; }
  if (e.key === "ArrowUp") { e.preventDefault(); move(-1); return; }
  if (e.key === "Tab") { close(); return; }
  if (e.key === "Enter") {
    e.preventDefault();
    const opt = filteredOptions.value[highlighted.value];
    if (opt && !opt.disabled) select(opt.value);
    else if (props.actionLabel && !filteredOptions.value.length) doAction();
  }
}

function onPointerDownOutside(event: PointerEvent) {
  const t = event.target as Node;
  if (rootRef.value?.contains(t) || dropdownRef.value?.contains(t)) return;
  close();
}

function onViewportChange() {
  if (isOpen.value) place();
}

onMounted(() => {
  document.addEventListener("pointerdown", onPointerDownOutside, true);
  window.addEventListener("resize", onViewportChange);
  window.addEventListener("scroll", onViewportChange, true);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onPointerDownOutside, true);
  window.removeEventListener("resize", onViewportChange);
  window.removeEventListener("scroll", onViewportChange, true);
});

watch(query, () => {
  highlighted.value = enabledIndexes.value[0] ?? -1;
});

// Un valor que ya no existe entre las opciones no puede quedarse mostrado como si sí.
watch(
  () => [props.modelValue, normalizedOptions.value] as const,
  ([value, opts]) => {
    if (!opts.length) return;
    if (opts.some((o) => o.value === value)) return;
    if (props.allowEmpty) {
      if (value !== "") emit("update:modelValue", "");
    } else {
      emit("update:modelValue", opts[0]!.value);
    }
  },
  { immediate: true }
);
</script>

<template>
  <div
    ref="rootRef"
    :class="['app-select', `app-select--${size}`, { 'is-open': isOpen, 'is-disabled': disabled, 'has-error': !!error }]"
    @keydown="onKeydown"
  >
    <label v-if="label" :for="fieldId" class="app-select__label">{{ label }}</label>
    <button
      type="button"
      ref="triggerRef"
      :id="fieldId"
      class="app-select__trigger"
      :disabled="disabled"
      :aria-expanded="isOpen"
      :aria-controls="listId"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <span class="app-select__value" :class="{ 'is-placeholder': !selectedOption }">
        {{ selectedLabel }}
      </span>
      <span v-if="clearable && selectedOption && !disabled" class="app-select__clear" role="button" aria-label="Quitar selección" @click.stop="clear">
        <i class="fa-solid fa-xmark" aria-hidden="true" />
      </span>
      <span class="app-select__chevron"><i class="fa-solid fa-chevron-down" aria-hidden="true" /></span>
    </button>

    <Teleport to="body">
      <Transition name="app-select-dropdown">
        <div
          v-if="isOpen"
          ref="dropdownRef"
          class="app-select__dropdown"
          :class="`app-select__dropdown--${size}`"
          :style="style"
          tabindex="-1"
          @keydown="onKeydown"
        >
          <div v-if="showSearch" class="app-select__search">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <input
              ref="searchRef"
              v-model="query"
              type="text"
              :placeholder="searchPlaceholder"
              autocomplete="off"
              aria-label="Buscar en la lista"
              data-test="app-select-search"
            />
          </div>
          <ul :id="listId" class="app-select__list" role="listbox" :aria-activedescendant="highlighted >= 0 ? `${listId}-${highlighted}` : undefined">
            <li
              v-for="(opt, i) in filteredOptions"
              :id="`${listId}-${i}`"
              :key="opt.value"
              :data-index="i"
              :class="['app-select__option', { 'is-selected': opt.value === modelValue, 'is-active': i === highlighted, 'is-disabled': opt.disabled }]"
              role="option"
              :aria-selected="opt.value === modelValue"
              :aria-disabled="opt.disabled || undefined"
              @pointermove="highlighted = i"
              @click="!opt.disabled && select(opt.value)"
            >
              <span class="app-select__option-label">{{ opt.label }}</span>
              <small v-if="opt.hint" class="app-select__option-hint">{{ opt.hint }}</small>
              <i v-if="opt.value === modelValue" class="fa-solid fa-check app-select__check" aria-hidden="true" />
            </li>
            <li v-if="!filteredOptions.length" class="app-select__empty">{{ emptyText }}<template v-if="query"> para «{{ query }}»</template></li>
          </ul>
          <button v-if="actionLabel" type="button" class="app-select__action" data-test="app-select-action" @click="doAction">
            <i :class="actionIcon" aria-hidden="true" />
            <span>{{ actionLabel }}<template v-if="query.trim()">: «{{ query.trim() }}»</template></span>
          </button>
        </div>
      </Transition>
    </Teleport>

    <p v-if="error" class="app-select__error">{{ error }}</p>
  </div>
</template>

<style lang="scss">
/* Sin scoped a propósito: el desplegable vive teletransportado en <body>. */
@use "@/styles/tokens/colors" as *;
@use "@/styles/tokens/space" as *;
@use "@/styles/tokens/motion" as *;

.app-select {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: $space-2;
  width: 100%;

  &__label { font-size: 0.8rem; font-weight: 500; color: $ink-300; }

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
    font: inherit;
    font-size: 0.9rem;
    text-align: left;
    cursor: pointer;
    transition: background $dur-fast ease, border-color $dur-fast ease, box-shadow $dur-fast ease;

    &:hover:not(:disabled) { background: rgba($ink-1000, 0.8); border-color: rgba($ink-500, 0.5); }
    &:focus-visible, .app-select.is-open & { outline: none; border-color: $brand-orange; box-shadow: 0 0 0 3px rgba($brand-orange, 0.12); background: rgba($ink-1000, 0.8); }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }
  &--sm &__trigger { padding: 0.45rem 0.7rem; font-size: 0.84rem; border-radius: 8px; }

  &__value { flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; &.is-placeholder { color: $ink-500; } }
  &__clear { flex: 0 0 auto; color: $ink-400; font-size: 0.8rem; padding: 2px 4px; border-radius: 6px; &:hover { color: $signal-red; background: rgba($signal-red, 0.12); } }
  &__chevron { flex: 0 0 auto; color: $ink-400; font-size: 0.75rem; transition: transform $dur-base $ease-out-expo; }
  &.is-open &__chevron { transform: rotate(180deg); }

  &__dropdown {
    z-index: 1300; /* por encima de AppModal (1000) y AppConfirmModal (1100) */
    display: flex;
    flex-direction: column;
    padding: $space-2;
    background: $ink-900;
    border: 1px solid rgba($ink-500, 0.25);
    border-radius: 12px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
    outline: none;
    min-width: 200px;
  }

  &__search {
    display: flex; align-items: center; gap: $space-2;
    margin: 0 0 $space-2; padding: 0 $space-3;
    border-radius: 8px; border: 1px solid rgba($ink-500, 0.25); background: $ink-850;
    > i { color: $ink-400; font-size: 0.8rem; }
    input { flex: 1; min-height: 38px; border: none; background: transparent; color: $fg-dark; font: inherit; font-size: 0.9rem; outline: none; &::placeholder { color: $ink-500; } }
    &:focus-within { border-color: rgba($brand-orange, 0.5); }
  }

  &__list { list-style: none; margin: 0; padding: 0; overflow-y: auto; flex: 1 1 auto; min-height: 0; overscroll-behavior: contain; }

  &__option {
    display: flex; align-items: center; gap: $space-3;
    padding: 0.6rem 0.85rem; border-radius: 8px; font-size: 0.9rem; color: $ink-200; cursor: pointer;
    transition: background $dur-fast ease, color $dur-fast ease;
    &-label { flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    &-hint { flex: 0 0 auto; color: $ink-400; font-size: 0.78rem; font-variant-numeric: tabular-nums; }
    &.is-active { background: rgba($ink-500, 0.22); color: $fg-dark; }
    &.is-selected { color: $brand-orange; font-weight: 600; .app-select__option-hint { color: rgba($brand-orange, 0.8); } }
    &.is-selected.is-active { background: rgba($brand-orange, 0.14); }
    &.is-disabled { opacity: 0.45; cursor: not-allowed; }
  }
  &__check { flex: 0 0 auto; color: $brand-orange; font-size: 0.8rem; }
  &__empty { padding: 0.75rem 0.85rem; color: $ink-500; font-size: 0.86rem; }

  &__action {
    display: flex; align-items: center; gap: $space-2; width: 100%;
    margin-top: $space-2; padding: 0.65rem 0.85rem;
    border-radius: 8px; border: 1px dashed rgba($brand-orange, 0.45); background: rgba($brand-orange, 0.06);
    color: $brand-orange; font: inherit; font-size: 0.88rem; font-weight: 600; text-align: left; cursor: pointer;
    transition: background $dur-fast ease;
    &:hover { background: rgba($brand-orange, 0.14); }
    span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  }

  &.has-error &__trigger { border-color: rgba($signal-red, 0.6); }
  &__error { margin: 0; font-size: 0.8rem; color: #ff8a8f; }
}

.app-select-dropdown-enter-active, .app-select-dropdown-leave-active { transition: opacity $dur-fast ease, transform $dur-fast $ease-out-expo; }
.app-select-dropdown-enter-from, .app-select-dropdown-leave-to { opacity: 0; transform: translateY(-6px); }

@media (prefers-reduced-motion: reduce) {
  .app-select__trigger, .app-select__chevron, .app-select__option, .app-select-dropdown-enter-active, .app-select-dropdown-leave-active { transition: none; }
}
</style>
