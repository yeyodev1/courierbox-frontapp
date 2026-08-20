<script setup lang="ts">
/**
 * Provider-type picker. Base types ship with the system; custom ones can be
 * created here and removed, but only while nothing is classified under them.
 */
import { computed, ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import { useToastStore } from '@/stores/toast.store'
import { normalizeType } from './useProveedorForm'

const props = defineProps<{
  show: boolean
  selected: string
  providerTypes: string[]
  defaultProviderTypes: string[]
  typeUsage: Record<string, number>
  onAddType?: (type: string) => Promise<void> | void
}>()

const emit = defineEmits<{ close: []; choose: [type: string]; 'delete-type': [type: string] }>()

const toastStore = useToastStore()
const draft = ref('')
const adding = ref(false)

const customTypes = computed(() =>
  props.providerTypes.filter(
    (type) => !props.defaultProviderTypes.some((base) => normalizeType(base) === normalizeType(type)),
  ),
)

const usageOf = (type: string) => props.typeUsage[normalizeType(type)] || 0

/** A type in use — or the one currently picked — must not be removable. */
const canDelete = (type: string) => props.selected !== type && usageOf(type) === 0

watch(
  () => props.show,
  (visible) => {
    if (visible) draft.value = ''
  },
)

async function addType() {
  const next = draft.value.trim()
  if (!next) return
  adding.value = true
  try {
    await props.onAddType?.(next)
    emit('choose', next)
    draft.value = ''
  } catch (error: unknown) {
    toastStore.showNotification((error as Error)?.message || 'No se pudo guardar el tipo', 'error')
  } finally {
    adding.value = false
  }
}
</script>

<template>
  <AppModal
    :show="show"
    title="Tipos de proveedor"
    icon="fa-solid fa-tags"
    icon-variant="info"
    max-width="760px"
    @close="emit('close')"
  >
    <div class="type-hero">
      <p class="modal-subtitle">Los tipos base vienen del sistema. Puedes crear y eliminar los personalizados.</p>
      <div class="hero-chip-row">
        <span class="hero-chip"><i class="fa-solid fa-layer-group" /> Base + personalizados</span>
        <span class="hero-chip"><i class="fa-solid fa-trash-can" /> Solo elimina los libres</span>
      </div>
    </div>

    <div class="type-create">
      <input
        v-model="draft"
        class="field-input"
        placeholder="Ej: Courier Miami, Aduana, Transporte local"
        @keyup.enter="addType"
      />
      <button type="button" class="btn-primary" :disabled="adding" @click="addType">
        {{ adding ? 'Agregando...' : 'Agregar tipo' }}
      </button>
    </div>

    <div class="type-sections">
      <div>
        <h4>Por defecto</h4>
        <div class="type-list">
          <button
            v-for="type in defaultProviderTypes"
            :key="type"
            type="button"
            class="type-item"
            :class="{ active: selected === type }"
            @click="emit('choose', type)"
          >
            <span>
              <strong>{{ type }}</strong>
              <small>{{ usageOf(type) }} asignaciones</small>
            </span>
            <i v-if="selected === type" class="fa-solid fa-check" />
          </button>
        </div>
      </div>

      <div>
        <h4>Personalizados</h4>
        <div class="type-list">
          <div v-for="type in customTypes" :key="type" class="type-item" :class="{ active: selected === type }">
            <button type="button" class="type-select-btn" @click="emit('choose', type)">
              <span>
                <strong>{{ type }}</strong>
                <small>{{ usageOf(type) }} asignaciones</small>
              </span>
              <i v-if="selected === type" class="fa-solid fa-check" />
            </button>
            <button
              type="button"
              class="type-delete-btn"
              :disabled="!canDelete(type)"
              :title="selected === type ? 'No puedes eliminar el tipo seleccionado' : `Eliminar ${type}`"
              @click="emit('delete-type', type)"
            >
              <i class="fa-solid fa-trash-can" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppModal>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './proveedor-ui' as ui;

@include ui.hero;
@include ui.fields;
@include ui.buttons;

.type-hero {
  display: grid;
  gap: $space-3;
  margin-bottom: $space-4;
}

.type-create {
  display: flex;
  gap: $space-3;
  margin-bottom: $space-4;

  .field-input { flex: 1; }

  @media (max-width: 900px) { flex-direction: column; }
}

.type-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-4;

  h4 { margin: 0 0 $space-3; font-size: 0.95rem; color: $fg-dark; }

  @media (max-width: 900px) { grid-template-columns: 1fr; }
}

.type-list {
  display: grid;
  gap: $space-3;
  max-height: 360px;
  overflow: auto;
}

.type-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  border: 1px solid rgba($ink-500, 0.14);
  background: rgba($ink-1000, 0.42);
  border-radius: 14px;
  padding: $space-2;
  color: $fg-dark;
  font-family: inherit;
  cursor: pointer;

  &.active {
    border-color: rgba($brand-orange, 0.35);
    background: rgba($brand-orange, 0.08);
  }

  strong { display: block; }
  small { display: block; color: $ink-400; margin-top: 2px; }
}

.type-select-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  text-align: left;
  border: none;
  background: transparent;
  color: inherit;
  font-family: inherit;
  cursor: pointer;
  padding: 0.2rem 0.2rem 0.2rem 0.45rem;
}

.type-delete-btn {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 10px;
  background: rgba($signal-red, 0.12);
  color: #ff8a8f;
  cursor: pointer;
  flex: 0 0 auto;

  &:disabled { opacity: 0.4; cursor: not-allowed; }
}
</style>
