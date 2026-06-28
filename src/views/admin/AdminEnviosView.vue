<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { enviosApi, type EnvioDomicilio, type PaqueteSimple } from '@/services/envios.api'

const envios = ref<EnvioDomicilio[]>([])
const loading = ref(false)
const error = ref('')
const filtroEstado = ref('')

const showModal = ref(false)
const searchResults = ref<PaqueteSimple[]>([])
const searchQuery = ref('')
const searching = ref(false)

const form = ref({
  paqueteId: '',
  paqueteLabel: '',
  clienteNombre: '',
  clienteDireccion: '',
  clienteTelefono: '',
  tipoTransportista: 'externo' as string,
  transportistaNombre: '',
  costoEnvio: 0,
  trackingLocal: '',
  notas: '',
})

const filtered = computed(() => {
  if (!filtroEstado.value) return envios.value
  return envios.value.filter((e) => e.estado === filtroEstado.value)
})

const estadoLabel: Record<string, string> = {
  pendiente: 'Pendiente',
  asignado: 'Asignado',
  en_ruta: 'En ruta',
  entregado: 'Entregado',
  fallido: 'Fallido',
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await enviosApi.list({ estado: filtroEstado.value || undefined, limit: 200 })
    envios.value = data.envios
  } catch (e: any) {
    error.value = e.message || 'Error'
  } finally {
    loading.value = false
  }
}

async function searchPaquetes() {
  if (!searchQuery.value.trim()) return
  searching.value = true
  try {
    const data = await enviosApi.buscarPaquetes(searchQuery.value.trim())
    searchResults.value = data.paquetes
  } catch (e: any) {
    error.value = e.message || 'Error'
  } finally {
    searching.value = false
  }
}

function selectPaquete(p: PaqueteSimple) {
  form.value.paqueteId = p._id
  form.value.paqueteLabel = `WR: ${p.wr || '-'} / SH: ${p.sh || '-'} / ${p.contenido || ''}`
  searchResults.value = []
  searchQuery.value = ''
}

function resetForm() {
  form.value = {
    paqueteId: '',
    paqueteLabel: '',
    clienteNombre: '',
    clienteDireccion: '',
    clienteTelefono: '',
    tipoTransportista: 'externo',
    transportistaNombre: '',
    costoEnvio: 0,
    trackingLocal: '',
    notas: '',
  }
  searchResults.value = []
}

async function save() {
  if (!form.value.paqueteId || !form.value.clienteNombre || !form.value.clienteDireccion) {
    error.value = 'Paquete, cliente nombre y dirección son requeridos'
    return
  }
  try {
    await enviosApi.create({
      paqueteId: form.value.paqueteId,
      clienteNombre: form.value.clienteNombre,
      clienteDireccion: form.value.clienteDireccion,
      clienteTelefono: form.value.clienteTelefono,
      tipoTransportista: form.value.tipoTransportista,
      transportistaNombre: form.value.transportistaNombre,
      costoEnvio: form.value.costoEnvio,
      trackingLocal: form.value.trackingLocal,
      notas: form.value.notas,
    })
    showModal.value = false
    resetForm()
    await load()
  } catch (e: any) {
    error.value = e.message || 'Error al crear'
  }
}

async function updateEstado(envio: EnvioDomicilio, estado: string) {
  try {
    await enviosApi.update(envio._id, { estado: estado as any })
    await load()
  } catch (e: any) {
    error.value = e.message || 'Error'
  }
}

function formatCurrency(n: number) {
  return '$' + n.toFixed(2)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

function paqueteInfo(envio: EnvioDomicilio) {
  const p = envio.paqueteId
  if (!p) return '—'
  return `WR: ${p.wr || '-'} | SH: ${p.sh || '-'}`
}

onMounted(load)
</script>

<template>
  <div class="envios-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Envíos a Domicilio</h1>
        <p class="page-subtitle">Gestiona los envíos de última milla</p>
      </div>
      <button class="btn-primary" @click="showModal = true">
        <i class="fa-solid fa-plus" /> Nuevo envío
      </button>
    </div>

    <div class="toolbar">
      <label class="filter">
        <span>Estado</span>
        <select v-model="filtroEstado" class="field-input" @change="load()">
          <option value="">Todos</option>
          <option v-for="(label, key) in estadoLabel" :key="key" :value="key">{{ label }}</option>
        </select>
      </label>
    </div>

    <div v-if="loading" class="loading"><i class="fa-solid fa-circle-notch fa-spin" /> Cargando...</div>
    <div v-else-if="error" class="alert error"><i class="fa-solid fa-circle-exclamation" /> {{ error }}</div>
    <div v-else-if="filtered.length === 0" class="empty">
      <i class="fa-solid fa-truck" />
      <p>No hay envíos registrados</p>
    </div>

    <div v-else class="table-wrapper">
      <table class="envios-table">
        <thead>
          <tr>
            <th>Paquete</th>
            <th>Cliente</th>
            <th>Dirección</th>
            <th>Transportista</th>
            <th>Costo</th>
            <th>Estado</th>
            <th>Tracking</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="envio in filtered" :key="envio._id">
            <td class="mono">{{ paqueteInfo(envio) }}</td>
            <td>
              <strong>{{ envio.clienteNombre }}</strong>
              <div v-if="envio.clienteTelefono" class="cell-sub">{{ envio.clienteTelefono }}</div>
            </td>
            <td class="cell-dir">{{ envio.clienteDireccion.slice(0, 50) }}{{ envio.clienteDireccion.length > 50 ? '...' : '' }}</td>
            <td>{{ envio.transportistaNombre || (envio.tipoTransportista === 'propio' ? 'Flota propia' : '—') }}</td>
            <td class="mono total">{{ formatCurrency(envio.costoEnvio) }}</td>
            <td>
              <select class="badge-select" :value="envio.estado" @change="updateEstado(envio, ($event.target as HTMLSelectElement).value)">
                <option v-for="(label, key) in estadoLabel" :key="key" :value="key">{{ label }}</option>
              </select>
            </td>
            <td class="mono">{{ envio.trackingLocal || '—' }}</td>
            <td class="mono">{{ formatDate(envio.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <transition name="fade">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-card wide">
          <div class="modal-icon-box info"><i class="fa-solid fa-truck" /></div>
          <h3>Nuevo envío a domicilio</h3>
          <form @submit.prevent="save" class="form-grid">
            <label class="form-field full">
              <span>Buscar paquete *</span>
              <div class="search-row">
                <input v-model="searchQuery" class="field-input" placeholder="WR, SH o tracking..." @keyup.enter="searchPaquetes" />
                <button type="button" class="btn-sm" @click="searchPaquetes" :disabled="searching">
                  <i class="fa-solid fa-search" />
                </button>
              </div>
              <div v-if="searchResults.length > 0" class="search-results">
                <button v-for="p in searchResults" :key="p._id" type="button" class="search-item" @click="selectPaquete(p)">
                  WR: {{ p.wr || '-' }} | SH: {{ p.sh || '-' }} — {{ p.contenido?.slice(0, 40) }}
                </button>
              </div>
              <div v-if="form.paqueteLabel" class="selected-paquete">
                <i class="fa-solid fa-check-circle" /> {{ form.paqueteLabel }}
              </div>
            </label>
            <label class="form-field">
              <span>Cliente *</span>
              <input v-model="form.clienteNombre" class="field-input" placeholder="Nombre completo" />
            </label>
            <label class="form-field">
              <span>Teléfono</span>
              <input v-model="form.clienteTelefono" class="field-input" placeholder="+593..." />
            </label>
            <label class="form-field full">
              <span>Dirección *</span>
              <input v-model="form.clienteDireccion" class="field-input" placeholder="Calle, número, ciudad" />
            </label>
            <label class="form-field">
              <span>Tipo transportista</span>
              <select v-model="form.tipoTransportista" class="field-input">
                <option value="externo">Externo</option>
                <option value="propio">Propio</option>
              </select>
            </label>
            <label class="form-field">
              <span>Transportista</span>
              <input v-model="form.transportistaNombre" class="field-input" :placeholder="form.tipoTransportista === 'propio' ? 'Nombre del repartidor' : 'Empresa de delivery'" />
            </label>
            <label class="form-field">
              <span>Costo envío</span>
              <input v-model.number="form.costoEnvio" type="number" step="0.01" min="0" class="field-input" />
            </label>
            <label class="form-field">
              <span>Tracking local</span>
              <input v-model="form.trackingLocal" class="field-input" placeholder="Nro seguimiento" />
            </label>
            <label class="form-field full">
              <span>Notas</span>
              <input v-model="form.notas" class="field-input" placeholder="Instrucciones especiales..." />
            </label>
            <div class="form-actions">
              <button type="button" class="btn-ghost" @click="showModal = false">Cancelar</button>
              <button type="submit" class="btn-primary">Crear envío</button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.envios-page {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-4;
}

.page-title { font-size: 1.5rem; font-weight: 700; margin: 0 0 $space-1; }
.page-subtitle { color: $ink-400; margin: 0; font-size: 0.9rem; }

.toolbar { display: flex; gap: $space-4; }

.filter {
  display: flex; align-items: center; gap: $space-3; color: $ink-300; font-size: 0.9rem;
}

.field-input {
  background: $ink-900; border: 1px solid rgba($ink-500, 0.2); border-radius: 10px;
  padding: $space-2 $space-3; color: $fg-dark; font-family: inherit; outline: none;
  &:focus { border-color: $brand-orange; }
}

.loading, .empty {
  display: flex; align-items: center; justify-content: center; gap: $space-3;
  padding: $space-12 0; color: $ink-500;
  i { font-size: 1.5rem; }
}

.alert {
  display: flex; align-items: center; gap: $space-3; padding: $space-3 $space-4;
  border-radius: 12px; font-size: 0.9rem;
  background: rgba($signal-red, 0.1); color: #ff8a8f; border: 1px solid rgba($signal-red, 0.15);
}

.table-wrapper {
  overflow-x: auto; background: $ink-900; border: 1px solid rgba($ink-500, 0.12); border-radius: 16px;
}

.envios-table {
  width: 100%; border-collapse: collapse; font-size: 0.9rem;
  th, td { padding: $space-3 $space-4; text-align: left; border-bottom: 1px solid rgba($ink-500, 0.1); white-space: nowrap; }
  th { color: $ink-400; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; }
  tbody tr:last-child td { border-bottom: none; }
  .mono { font-variant-numeric: tabular-nums; }
  .total { color: $brand-orange; font-weight: 700; }
  .cell-sub { color: $ink-400; font-size: 0.8rem; margin-top: 2px; }
  .cell-dir { max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
}

.badge-select {
  background: $ink-1000; border: 1px solid rgba($ink-500, 0.2); border-radius: 8px;
  padding: $space-1 $space-2; color: $fg-dark; font-family: inherit; font-size: 0.8rem; cursor: pointer;
}

.btn-primary {
  display: inline-flex; align-items: center; gap: $space-2;
  padding: 0.6rem 1.25rem; background: $brand-orange; color: #fff;
  border: none; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.9rem;
  &:hover { background: darken($brand-orange, 8%); }
}

.btn-ghost {
  padding: 0.6rem 1.25rem; background: transparent; border: 1px solid rgba($ink-500, 0.3);
  border-radius: 10px; color: $ink-300; font-weight: 500; cursor: pointer; transition: all 0.2s; font-size: 0.9rem;
  &:hover { background: rgba($ink-500, 0.15); color: $fg-dark; }
}

.btn-sm {
  width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
  background: $ink-700; border: 1px solid rgba($ink-500, 0.2); border-radius: 10px;
  color: $fg-dark; cursor: pointer; flex-shrink: 0;
  &:hover { background: $ink-600; }
}

.modal-overlay {
  position: fixed; inset: 0; background: rgba($ink-1000, 0.75); backdrop-filter: blur(6px);
  z-index: 100; display: flex; align-items: center; justify-content: center; padding: $space-4;
}

.modal-card.wide {
  background: $ink-900; border: 1px solid rgba($ink-500, 0.15); border-radius: 20px;
  padding: $space-8; max-width: 650px; width: 100%; text-align: left;
  max-height: 90vh; overflow-y: auto;
  .modal-icon-box {
    width: 48px; height: 48px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; margin: 0 auto $space-4; font-size: 1.2rem;
    &.info { background: rgba($brand-orange, 0.12); color: $brand-orange; }
  }
  h3 { text-align: center; font-size: 1.15rem; margin: 0 0 $space-6; }
}

.form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: $space-4;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
}

.form-field {
  display: flex; flex-direction: column; gap: $space-2;
  span { font-size: 0.8rem; color: $ink-400; font-weight: 500; }
  &.full { grid-column: 1 / -1; }
}

.search-row {
  display: flex; gap: $space-2;
}

.search-results {
  background: $ink-800; border: 1px solid rgba($ink-500, 0.2); border-radius: 10px;
  max-height: 200px; overflow-y: auto;
  .search-item {
    display: block; width: 100%; text-align: left; padding: $space-2 $space-3;
    background: transparent; border: none; border-bottom: 1px solid rgba($ink-500, 0.1);
    color: $fg-dark; cursor: pointer; font-family: inherit; font-size: 0.85rem;
    &:hover { background: rgba($brand-orange, 0.08); }
    &:last-child { border-bottom: none; }
  }
}

.selected-paquete {
  display: flex; align-items: center; gap: $space-2; padding: $space-2 $space-3;
  background: rgba($brand-orange, 0.08); border: 1px solid rgba($brand-orange, 0.2);
  border-radius: 10px; color: $brand-orange; font-size: 0.85rem; font-weight: 500;
}

.form-actions {
  grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: $space-3; margin-top: $space-2;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
