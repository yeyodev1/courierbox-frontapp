<script setup lang="ts">
/** Wizard step 1: find an existing client or create one on the spot. */
import { ref, watch } from 'vue'
import AppInput from '@/components/ui/AppInput.vue'
import { contactosCbAPI } from '@/services/contactos_cb.api'
import { contactosApi } from '@/services/contactos.api'
import type { Contacto } from '@/services/gestiones_compra.api'
import { useGestionCompraFormStore } from '@/stores/gestion_compra_form.store'
import ClienteHistorial, { type HistorialDetail } from './Cliente/ClienteHistorial.vue'
import NuevoClienteModal, { type NuevoClienteForm } from './Cliente/NuevoClienteModal.vue'

const store = useGestionCompraFormStore()

const query = ref('')
const results = ref<Contacto[]>([])
const loading = ref(false)

const selected = ref<Contacto | null>(store.formData.contacto)
const detalle = ref<HistorialDetail | null>(null)
const loadingDetail = ref(false)

const showCreateModal = ref(false)
const creating = ref(false)
const createError = ref('')

let debounceTimer: ReturnType<typeof setTimeout>

function onSearch() {
  clearTimeout(debounceTimer)
  if (query.value.length < 2) {
    results.value = []
    return
  }
  debounceTimer = setTimeout(async () => {
    loading.value = true
    try {
      results.value = await contactosCbAPI.search(query.value)
    } finally {
      loading.value = false
    }
  }, 300)
}

async function loadDetail(contacto: Contacto) {
  loadingDetail.value = true
  try {
    detalle.value = await contactosApi.getDetail(contacto.nombre, contacto.email, contacto.telefono)
  } catch {
    detalle.value = null
  } finally {
    loadingDetail.value = false
  }
}

function selectContacto(contacto: Contacto) {
  selected.value = contacto
  store.setContacto(contacto)
  results.value = []
  query.value = ''
  loadDetail(contacto)
}

function clearSelected() {
  selected.value = null
  store.formData.contactoId = ''
  store.formData.contacto = null
  detalle.value = null
}

watch(
  () => store.formData.contacto,
  (contacto) => {
    selected.value = contacto
    if (contacto) loadDetail(contacto)
  },
  { immediate: true },
)

async function createContacto(form: NuevoClienteForm) {
  if (!form.nombre.trim()) return
  creating.value = true
  createError.value = ''
  try {
    const created = await contactosCbAPI.create({
      nombre: form.nombre,
      email: form.email,
      telefono: form.telefono,
      phoneCountryCode: form.phoneCountry,
      cedula: form.cedula,
      notas: form.notas,
    })
    selectContacto(created.contacto)
    showCreateModal.value = false
  } catch (e: unknown) {
    createError.value = (e as Error)?.message ?? 'Error al crear contacto'
  } finally {
    creating.value = false
  }
}

defineExpose({ isValid: () => !!store.formData.contactoId })
</script>

<template>
  <div class="step-cliente">
    <h3 class="step__title">Buscar o crear cliente</h3>

    <div class="search-box">
      <AppInput
        v-model="query"
        label="Buscar por nombre, email o teléfono"
        placeholder="Ej: Juan Pérez..."
        @input="onSearch"
      />

      <div v-if="loading" class="search-hint">Buscando...</div>

      <div v-else-if="results.length" class="search-results">
        <button
          v-for="c in results"
          :key="c._id"
          class="result-item"
          :class="{ selected: selected?._id === c._id }"
          @click="selectContacto(c)"
        >
          <span class="result-name">{{ c.nombre }}</span>
          <span class="result-meta">{{ c.email ?? '' }}{{ c.telefono ? ` · ${c.telefono}` : '' }}</span>
        </button>
      </div>

      <div v-else-if="query.length >= 2" class="search-hint muted">
        No encontrado — puedes crear uno nuevo abajo.
      </div>
    </div>

    <template v-if="selected">
      <div class="selected-card">
        <span class="selected-label">Cliente seleccionado:</span>
        <strong>{{ selected.nombre }}</strong>
        <span v-if="selected.email" class="muted"> · {{ selected.email }}</span>
        <span v-if="selected.telefono" class="muted"> · {{ selected.telefono }}</span>
        <button class="btn-clear" @click="clearSelected">Cambiar</button>
      </div>

      <ClienteHistorial :nombre="selected.nombre" :detalle="detalle" :loading="loadingDetail" />
    </template>

    <div v-else class="create-section">
      <button class="btn-toggle-create" @click="showCreateModal = true">+ Crear nuevo cliente</button>
    </div>

    <NuevoClienteModal
      :open="showCreateModal"
      :creating="creating"
      :error="createError"
      @close="showCreateModal = false"
      @submit="createContacto"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.step-cliente {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.step__title { color: $fg-dark; font-size: 1.1rem; margin: 0 0 $space-2; }

.search-box {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: $space-1;
  border: 1px solid $ink-500;
  border-radius: 8px;
  overflow: hidden;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: $space-3 $space-4;
  background: $ink-900;
  border: none;
  cursor: pointer;
  text-align: left;
  color: $fg-dark;
  font-family: inherit;
  transition: background 0.15s;

  &:hover,
  &.selected { background: $ink-700; }
}

.result-name { font-weight: 600; }
.result-meta { font-size: 0.8rem; color: $ink-300; }
.search-hint { font-size: 0.85rem; color: $ink-400; }
.muted { color: $ink-400; }

.selected-card {
  display: flex;
  align-items: center;
  gap: $space-2;
  flex-wrap: wrap;
  padding: $space-3 $space-4;
  background: $ink-700;
  border-radius: 8px;
  border: 1px solid $brand-orange;
}

.selected-label { font-size: 0.8rem; color: $ink-300; }

.btn-clear {
  margin-left: auto;
  background: none;
  border: none;
  color: $brand-orange;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.85rem;
  text-decoration: underline;
}

.btn-toggle-create {
  background: none;
  border: 1px dashed $ink-500;
  color: $ink-300;
  padding: $space-2 $space-4;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  text-align: center;
  font-family: inherit;
  font-size: 0.9rem;

  &:hover { border-color: $brand-orange; color: $brand-orange; }
}

@media (prefers-reduced-motion: reduce) {
  .result-item { transition: none; }
}
</style>
