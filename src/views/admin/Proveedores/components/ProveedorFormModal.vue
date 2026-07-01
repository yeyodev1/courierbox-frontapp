<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import type { Proveedor } from '@/services/proveedores.api'

interface FormState {
  nombre: string
  tipo: string
  pais: string
  ciudad: string
  contacto: string
  telefono: string
  email: string
  notas: string
  activo: boolean
}

const props = defineProps<{
  show: boolean
  initialData: Proveedor | null
  providerTypes: string[]
  defaultProviderTypes: string[]
  typeUsage: Record<string, number>
  onAddType?: (type: string) => Promise<void> | void
}>()

const emit = defineEmits<{
  close: []
  save: [payload: FormState]
  deleteType: [type: string]
}>()

const form = ref<FormState>({
  nombre: '',
  tipo: '',
  pais: '',
  ciudad: '',
  contacto: '',
  telefono: '',
  email: '',
  notas: '',
  activo: true,
})

const showTypeModal = ref(false)
const typeDraft = ref('')
const typeError = ref('')
const typeLoading = ref(false)
const isEditMode = computed(() => !!props.initialData)

const selectedTypeLabel = computed(() => form.value.tipo || 'Seleccionar tipo de proveedor')

function normalizeType(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

const customTypes = computed(() => {
  return props.providerTypes.filter((type) => !props.defaultProviderTypes.some((base) => normalizeType(base) === normalizeType(type)))
})

function resetForm() {
  form.value = {
    nombre: '',
    tipo: '',
    pais: '',
    ciudad: '',
    contacto: '',
    telefono: '',
    email: '',
    notas: '',
    activo: true,
  }
}

function applyInitialData(data: Proveedor | null) {
  if (!data) {
    resetForm()
    return
  }
  form.value = {
    nombre: data.nombre || '',
    tipo: data.tipo || '',
    pais: data.pais || '',
    ciudad: data.ciudad || '',
    contacto: data.contacto || '',
    telefono: data.telefono || '',
    email: data.email || '',
    notas: data.notas || '',
    activo: data.activo ?? true,
  }
}

watch(
  () => props.show,
  (visible) => {
    if (visible) {
      applyInitialData(props.initialData)
      typeDraft.value = ''
      typeError.value = ''
      showTypeModal.value = false
    }
  },
)

async function addType() {
  const next = typeDraft.value.trim()
  if (!next) return
  typeError.value = ''
  typeLoading.value = true
  try {
    await props.onAddType?.(next)
    form.value.tipo = next
    typeDraft.value = ''
    showTypeModal.value = false
  } catch (error: any) {
    typeError.value = error?.message || 'No se pudo guardar el tipo'
  } finally {
    typeLoading.value = false
  }
}

function chooseType(type: string) {
  form.value.tipo = type
  showTypeModal.value = false
}

function toggleProviderState() {
  form.value.activo = !form.value.activo
}

function submit() {
  if (!form.value.nombre.trim()) {
    typeError.value = 'El nombre es obligatorio'
    return
  }
  emit('save', { ...form.value })
}
</script>

<template>
  <AppModal
    :show="show"
    :title="initialData ? 'Editar proveedor' : 'Nuevo proveedor'"
    icon="fa-solid fa-truck-fast"
    icon-variant="info"
    max-width="920px"
    @close="$emit('close')"
  >
    <div class="modal-hero">
      <div class="hero-copy">
        <span class="eyebrow">{{ isEditMode ? 'Actualización maestra' : 'Nuevo registro' }}</span>
        <p class="modal-subtitle">Registra los datos que después usarás en costos y envíos.</p>
      </div>
      <div class="hero-chips">
        <span class="hero-chip"><i class="fa-solid fa-shield-halved" /> Datos limpios</span>
        <span class="hero-chip"><i class="fa-solid fa-link" /> Conecta costos</span>
        <span class="hero-chip"><i class="fa-solid fa-tags" /> Clasificación flexible</span>
      </div>
    </div>

    <div v-if="typeError" class="alert error">
      <i class="fa-solid fa-circle-exclamation" /> {{ typeError }}
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
              <button v-for="type in providerTypes.slice(0, 6)" :key="type" type="button" class="quick-type" @click="chooseType(type)">
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
          <label class="field">
            <span>País</span>
            <input v-model="form.pais" class="field-input" placeholder="Ecuador" />
          </label>

          <label class="field">
            <span>Ciudad</span>
            <input v-model="form.ciudad" class="field-input" placeholder="Guayaquil" />
          </label>

          <label class="field">
            <span>Contacto</span>
            <input v-model="form.contacto" class="field-input" placeholder="Nombre contacto" />
          </label>

          <label class="field">
            <span>Teléfono</span>
            <input v-model="form.telefono" class="field-input" placeholder="0999999999" />
          </label>
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
            <textarea v-model="form.notas" class="field-input textarea" rows="4" placeholder="Observaciones, acuerdos, horarios, etc."></textarea>
          </label>
        </div>
      </section>

      <section class="panel panel-flag full">
        <label class="toggle-row">
          <input :checked="form.activo" type="checkbox" @change="toggleProviderState" />
          <div>
            <strong>Proveedor activo</strong>
            <span>Si lo desactivas, seguirá guardado pero no se priorizará en nuevas operaciones.</span>
          </div>
        </label>
      </section>
    </div>

    <template #footer>
      <div class="modal-actions">
        <button class="btn-secondary" type="button" @click="$emit('close')">Cancelar</button>
        <button class="btn-primary" type="button" @click="submit">{{ initialData ? 'Actualizar' : 'Guardar' }}</button>
      </div>
    </template>
  </AppModal>

  <AppModal
    :show="showTypeModal"
    title="Tipos de proveedor"
    icon="fa-solid fa-tags"
    icon-variant="info"
    max-width="760px"
    @close="showTypeModal = false"
  >
    <div class="type-hero">
      <p class="modal-subtitle">Los tipos base vienen del sistema. Puedes crear y eliminar los personalizados.</p>
      <div class="hero-chip-row">
        <span class="hero-chip"><i class="fa-solid fa-layer-group" /> Base + personalizados</span>
        <span class="hero-chip"><i class="fa-solid fa-trash-can" /> Solo elimina los libres</span>
      </div>
    </div>

    <div class="type-create">
      <input v-model="typeDraft" class="field-input" placeholder="Ej: Courier Miami, Aduana, Transporte local" @keyup.enter="addType" />
      <button type="button" class="btn-primary" :disabled="typeLoading" @click="addType">
        {{ typeLoading ? 'Agregando...' : 'Agregar tipo' }}
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
            :class="{ active: form.tipo === type }"
            @click="chooseType(type)"
          >
            <span>
              <strong>{{ type }}</strong>
              <small>{{ props.typeUsage[normalizeType(type)] || 0 }} asignaciones</small>
            </span>
            <i v-if="form.tipo === type" class="fa-solid fa-check" />
          </button>
        </div>
      </div>

      <div>
        <h4>Personalizados</h4>
        <div class="type-list">
          <div
            v-for="type in customTypes"
            :key="type"
            class="type-item"
            :class="{ active: form.tipo === type }"
          >
            <button type="button" class="type-select-btn" @click="chooseType(type)">
              <span>
                <strong>{{ type }}</strong>
                <small>{{ props.typeUsage[normalizeType(type)] || 0 }} asignaciones</small>
              </span>
              <i v-if="form.tipo === type" class="fa-solid fa-check" />
            </button>
            <button
              type="button"
              class="type-delete-btn"
              :disabled="form.tipo === type || (props.typeUsage[normalizeType(type)] || 0) > 0"
              :title="form.tipo === type ? 'No puedes eliminar el tipo seleccionado' : `Eliminar ${type}`"
              @click="$emit('deleteType', type)"
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

.modal-subtitle {
  margin: 0;
  color: $ink-400;
  text-align: center;
}

.modal-hero,
.type-hero {
  display: grid;
  gap: $space-3;
  margin-bottom: $space-4;
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

.hero-copy { display: grid; gap: $space-2; justify-items: center; }

.hero-chips,
.hero-chip-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

.hero-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 0.75rem;
  border-radius: 999px;
  background: rgba($ink-800, 0.75);
  border: 1px solid rgba($ink-500, 0.14);
  color: $ink-200;
  font-size: 0.78rem;
  font-weight: 600;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $space-4;
}

.form-shell {
  display: grid;
  grid-template-columns: 1.4fr 0.95fr;
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

  h4 {
    margin: 0;
    font-size: 0.92rem;
    letter-spacing: 0.02em;
  }

  p {
    margin: 0;
    color: $ink-400;
    font-size: 0.8rem;
  }

  &.compact {
    margin-bottom: $space-3;
  }
}

.grid-two {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $space-4;
}

.field {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  span {
    color: $ink-400;
    font-size: 0.85rem;
    font-weight: 600;
  }
}

.field-input {
  background: $ink-1000;
  border: 1px solid rgba($ink-500, 0.2);
  border-radius: 12px;
  padding: $space-3 $space-4;
  color: $fg-dark;
  font-family: inherit;
  outline: none;

  &::placeholder {
    color: rgba($ink-400, 0.75);
  }
}

.textarea {
  min-height: 120px;
  resize: vertical;
}

.full {
  grid-column: 1 / -1;
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
  cursor: pointer;
}

.toggle-row {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  color: $ink-300;

  strong {
    display: block;
    color: $fg-dark;
    font-size: 0.92rem;
    margin-bottom: 0.15rem;
  }

  span {
    color: $ink-400;
    font-size: 0.82rem;
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: $space-3;
}

.btn-primary,
.btn-secondary {
  border: none;
  cursor: pointer;
  font-family: inherit;
  border-radius: 12px;
  padding: 0.65rem 0.95rem;
  font-weight: 700;
}

.btn-primary {
  background: $brand-orange;
  color: $ink-1000;
}

.btn-secondary {
  background: rgba($ink-700, 0.8);
  color: $fg-dark;
}

.type-create {
  display: flex;
  gap: $space-3;
  margin-bottom: $space-4;

  .field-input {
    flex: 1;
  }
}

.type-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-4;
}

.type-sections h4 {
  margin: 0 0 $space-3;
  font-size: 0.95rem;
  color: $fg-dark;
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

  &.active {
    border-color: rgba($brand-orange, 0.35);
    background: rgba($brand-orange, 0.08);
  }
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
  cursor: pointer;
  padding: 0.2rem 0.2rem 0.2rem 0.45rem;

  strong { display: block; }
  small { display: block; color: $ink-400; margin-top: 2px; }
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
}

.alert {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3 $space-4;
  margin-bottom: $space-4;
  border-radius: 12px;
  font-size: 0.9rem;
  background: rgba($signal-red, 0.1);
  color: #ff8a8f;
  border: 1px solid rgba($signal-red, 0.15);
}

@media (max-width: 900px) {
  .form-shell,
  .form-grid,
  .grid-two,
  .type-sections {
    grid-template-columns: 1fr;
  }

  .type-create,
  .modal-actions {
    flex-direction: column;
  }

  .modal-actions {
    align-items: stretch;
  }

  .section-title {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
