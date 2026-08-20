<script setup lang="ts">
/** Create or edit a provider. The type picker lives in its own nested dialog. */
import { computed, ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import type { Proveedor } from '@/services/proveedores.api'
import { useToastStore } from '@/stores/toast.store'
import TipoProveedorModal from './TipoProveedorModal.vue'
import { proveedorToForm, type ProveedorFormState } from './useProveedorForm'

const props = defineProps<{
  show: boolean
  initialData: Proveedor | null
  providerTypes: string[]
  defaultProviderTypes: string[]
  typeUsage: Record<string, number>
  onAddType?: (type: string) => Promise<void> | void
}>()

const emit = defineEmits<{ close: []; save: [payload: ProveedorFormState]; deleteType: [type: string] }>()

const toastStore = useToastStore()

const form = ref<ProveedorFormState>(proveedorToForm(null))
const showTypeModal = ref(false)

const isEditMode = computed(() => !!props.initialData)
const selectedTypeLabel = computed(() => form.value.tipo || 'Seleccionar tipo de proveedor')

watch(
  () => props.show,
  (visible) => {
    if (!visible) return
    form.value = proveedorToForm(props.initialData)
    showTypeModal.value = false
  },
)

function chooseType(type: string) {
  form.value.tipo = type
  showTypeModal.value = false
}

function submit() {
  if (!form.value.nombre.trim()) {
    toastStore.showNotification('El nombre es obligatorio', 'error')
    return
  }
  emit('save', { ...form.value })
}
</script>

<template>
  <AppModal
    :show="show"
    :title="isEditMode ? 'Editar proveedor' : 'Nuevo proveedor'"
    icon="fa-solid fa-truck-fast"
    icon-variant="info"
    max-width="920px"
    @close="emit('close')"
  >
    <div class="modal-hero">
      <div class="hero-copy">
        <span class="eyebrow">{{ isEditMode ? 'Actualización maestra' : 'Nuevo registro' }}</span>
        <p class="modal-subtitle">Registra los datos que después usarás en costos y envíos.</p>
      </div>
      <div class="hero-chip-row">
        <span class="hero-chip"><i class="fa-solid fa-shield-halved" /> Datos limpios</span>
        <span class="hero-chip"><i class="fa-solid fa-link" /> Conecta costos</span>
        <span class="hero-chip"><i class="fa-solid fa-tags" /> Clasificación flexible</span>
      </div>
    </div>

    <div class="form-shell">
      <section class="panel panel-main">
        <div class="section-title">
          <h4>Identidad</h4>
          <p>Nombre y clasificación principal del proveedor.</p>
        </div>

        <div class="form-grid">
          <label class="field full">
            <span>Nombre *</span>
            <input v-model="form.nombre" class="field-input" placeholder="Ej: Yeyo Provee" />
          </label>

          <div class="field full">
            <span>Tipo de proveedor</span>
            <button type="button" class="type-picker" @click="showTypeModal = true">
              <div>
                <strong>{{ selectedTypeLabel }}</strong>
                <small>Selecciona o crea un tipo para clasificarlo mejor</small>
              </div>
              <i class="fa-solid fa-chevron-right" />
            </button>
            <div class="quick-types">
              <button
                v-for="type in providerTypes.slice(0, 6)"
                :key="type"
                type="button"
                class="quick-type"
                @click="chooseType(type)"
              >
                {{ type }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="panel panel-side">
        <div class="section-title compact">
          <h4>Vista rápida</h4>
          <p>Campos de contacto y presencia local.</p>
        </div>

        <div class="grid-two">
          <label class="field"><span>País</span><input v-model="form.pais" class="field-input" placeholder="Ecuador" /></label>
          <label class="field"><span>Ciudad</span><input v-model="form.ciudad" class="field-input" placeholder="Guayaquil" /></label>
          <label class="field"><span>Contacto</span><input v-model="form.contacto" class="field-input" placeholder="Nombre contacto" /></label>
          <label class="field"><span>Teléfono</span><input v-model="form.telefono" class="field-input" placeholder="0999999999" /></label>
        </div>
      </section>

      <section class="panel panel-full">
        <div class="section-title compact">
          <h4>Contacto y notas</h4>
          <p>Información que ayuda a operar y buscar rápido.</p>
        </div>

        <div class="form-grid">
          <label class="field full">
            <span>Email</span>
            <input v-model="form.email" class="field-input" placeholder="correo@empresa.com" />
          </label>
          <label class="field full">
            <span>Notas</span>
            <textarea v-model="form.notas" class="field-input textarea" rows="4" placeholder="Observaciones, acuerdos, horarios, etc." />
          </label>
        </div>
      </section>

      <section class="panel panel-flag full">
        <label class="toggle-row">
          <input v-model="form.activo" type="checkbox" />
          <div>
            <strong>Proveedor activo</strong>
            <span>Si lo desactivas, seguirá guardado pero no se priorizará en nuevas operaciones.</span>
          </div>
        </label>
      </section>
    </div>

    <template #footer>
      <div class="modal-actions">
        <button class="btn-secondary" type="button" @click="emit('close')">Cancelar</button>
        <button class="btn-primary" type="button" @click="submit">{{ isEditMode ? 'Actualizar' : 'Guardar' }}</button>
      </div>
    </template>
  </AppModal>

  <TipoProveedorModal
    :show="showTypeModal"
    :selected="form.tipo"
    :provider-types="providerTypes"
    :default-provider-types="defaultProviderTypes"
    :type-usage="typeUsage"
    :on-add-type="onAddType"
    @close="showTypeModal = false"
    @choose="chooseType"
    @delete-type="(type) => emit('deleteType', type)"
  />
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './proveedor-ui' as ui;

@include ui.hero;
@include ui.fields;
@include ui.buttons;

.modal-hero {
  display: grid;
  gap: $space-3;
  margin-bottom: $space-4;
}

.hero-copy {
  display: grid;
  gap: $space-2;
  justify-items: center;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: rgba($brand-orange, 0.12);
  color: $brand-orange;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.form-shell {
  display: grid;
  grid-template-columns: 1.4fr 0.95fr;
  gap: $space-4;
}

.form-grid,
.grid-two {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $space-4;
}

.panel {
  border: 1px solid rgba($ink-500, 0.14);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba($ink-900, 0.92), rgba($ink-900, 0.76));
  padding: $space-4;
}

.panel-main { min-height: 100%; }
.panel-side { align-self: start; }
.panel-full { grid-column: 1 / -1; }

.section-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: $space-3;
  margin-bottom: $space-4;

  h4 { margin: 0; font-size: 0.92rem; letter-spacing: 0.02em; }
  p { margin: 0; color: $ink-400; font-size: 0.8rem; }

  &.compact { margin-bottom: $space-3; }
}

.textarea {
  min-height: 120px;
  resize: vertical;
}

.type-picker {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  background: linear-gradient(180deg, rgba($brand-orange, 0.12), rgba($ink-1000, 0.75));
  border: 1px solid rgba($brand-orange, 0.22);
  border-radius: 14px;
  padding: $space-3 $space-4;
  color: $fg-dark;
  font-family: inherit;
  cursor: pointer;
  text-align: left;

  strong { display: block; font-size: 0.92rem; }
  small { color: $ink-400; display: block; margin-top: 2px; }
}

.quick-types {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.quick-type {
  border: 1px solid rgba($ink-500, 0.18);
  background: rgba($ink-700, 0.55);
  color: $ink-200;
  border-radius: 999px;
  padding: 0.45rem 0.7rem;
  font-size: 0.78rem;
  font-family: inherit;
  cursor: pointer;
}

.toggle-row {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  color: $ink-300;

  strong { display: block; color: $fg-dark; font-size: 0.92rem; margin-bottom: 0.15rem; }
  span { color: $ink-400; font-size: 0.82rem; }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: $space-3;
}

@media (max-width: 900px) {
  .form-shell,
  .form-grid,
  .grid-two { grid-template-columns: 1fr; }

  .modal-actions { flex-direction: column; align-items: stretch; }
  .section-title { flex-direction: column; align-items: flex-start; }
}
</style>
