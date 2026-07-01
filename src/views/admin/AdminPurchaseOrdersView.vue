<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { asesoriaApi } from '@/services/asesoria.api'
import type { PurchaseOrder } from '@/services/asesoria.api'

const router = useRouter()

const orders = ref<PurchaseOrder[]>([])
const loading = ref(false)
const error = ref('')
const viewMode = ref<'board' | 'table'>('board')
const activeTab = ref('pendientes')
const statusFilter = ref('')
const paymentFilter = ref('')
const draggingOrderId = ref<string | null>(null)
const draggingStatus = ref<string | null>(null)

const showComprarModal = ref(false)
const comprarOrder = ref<PurchaseOrder | null>(null)
const comprarNotes = ref('')

const searchQuery = ref('')
const searchResults = ref<PurchaseOrder[]>([])
const searchingClient = ref(false)
const showSearchModal = ref(false)
const linkCopiedId = ref('')
const savingToken = ref('')

const tabs = [
  { key: 'pendientes', label: 'Pendientes', status: 'pendiente' },
  { key: 'en_proceso', label: 'En Proceso', status: 'en_proceso' },
  { key: 'comprados', label: 'Comprados', status: 'comprado' },
  { key: 'todos', label: 'Todos', status: '' },
]

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'borrador', label: 'Borrador' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'comprado', label: 'Comprado' },
  { value: 'en_envio', label: 'En envío' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
]

const paymentOptions = [
  { value: '', label: 'Todos' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'verificando', label: 'Verificando' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'rechazado', label: 'Rechazado' },
]

const boardStatuses = [
  { key: 'borrador', label: 'Borrador', accent: 'neutral' },
  { key: 'pendiente', label: 'Pendiente', accent: 'orange' },
  { key: 'en_proceso', label: 'En proceso', accent: 'blue' },
  { key: 'comprado', label: 'Comprado', accent: 'green' },
  { key: 'en_envio', label: 'En envío', accent: 'purple' },
  { key: 'entregado', label: 'Entregado', accent: 'green' },
  { key: 'cancelado', label: 'Cancelado', accent: 'red' },
]

const pendientesCount = computed(() => {
  return orders.value.filter((o) => o.status === 'pendiente').length
})

const filteredOrders = computed(() => {
  const activeStatus = tabs.find((t) => t.key === activeTab.value)?.status
  return orders.value.filter((o) => {
    if (activeStatus && o.status !== activeStatus) return false
    if (statusFilter.value && o.status !== statusFilter.value) return false
    if (paymentFilter.value && o.paymentStatus !== paymentFilter.value) return false
    return true
  })
})

const boardColumns = computed(() => {
  const result: Record<string, PurchaseOrder[]> = {}
  for (const col of boardStatuses) result[col.key] = []
  for (const order of orders.value) {
    if (statusFilter.value && order.status !== statusFilter.value) continue
    if (paymentFilter.value && order.paymentStatus !== paymentFilter.value) continue
    const bucket = result[order.status]
    if (!bucket) continue
    bucket.push(order)
  }
  return result
})

async function loadOrders() {
  loading.value = true
  error.value = ''
  try {
    const data = await asesoriaApi.listOrders({ limit: 200 })
    orders.value = data.orders
  } catch (e: any) {
    error.value = e.message || 'Error al cargar órdenes'
  } finally {
    loading.value = false
  }
}

async function updateStatus(order: PurchaseOrder, status: string) {
  try {
    await asesoriaApi.updateOrderStatus(order._id, status)
    await loadOrders()
  } catch (e: any) {
    error.value = e.message || 'Error al actualizar estado'
  }
}

async function updatePayment(order: PurchaseOrder, paymentStatus: string) {
  try {
    await asesoriaApi.updatePaymentStatus(order._id, paymentStatus)
    await loadOrders()
  } catch (e: any) {
    error.value = e.message || 'Error al actualizar pago'
  }
}

function onDragStart(order: PurchaseOrder) {
  draggingOrderId.value = order._id
  draggingStatus.value = order.status
}

function onDragEnd() {
  draggingOrderId.value = null
  draggingStatus.value = null
}

async function dropOnStatus(status: string) {
  if (!draggingOrderId.value || draggingStatus.value === status) return
  const order = orders.value.find((o) => o._id === draggingOrderId.value)
  if (!order) return
  await updateStatus(order, status)
  onDragEnd()
}

function allowDrop(event: DragEvent) {
  event.preventDefault()
}

function openComprar(order: PurchaseOrder) {
  comprarOrder.value = order
  comprarNotes.value = ''
  showComprarModal.value = true
}

async function confirmComprar() {
  if (!comprarOrder.value) return
  try {
    await asesoriaApi.updateOrderStatus(comprarOrder.value._id, 'comprado', comprarNotes.value)
    showComprarModal.value = false
    comprarOrder.value = null
    await loadOrders()
  } catch (e: any) {
    error.value = e.message || 'Error al comprar'
  }
}

async function searchClients() {
  if (!searchQuery.value.trim()) return
  searchingClient.value = true
  try {
    const data = await asesoriaApi.searchClients(searchQuery.value.trim())
    searchResults.value = data.orders
    showSearchModal.value = true
  } catch (e: any) {
    error.value = e.message || 'Error al buscar'
  } finally {
    searchingClient.value = false
  }
}

async function resetViewToken(order: PurchaseOrder) {
  savingToken.value = order._id
  try {
    const data = await asesoriaApi.resetViewToken(order._id)
    const idx = orders.value.findIndex((o) => o._id === order._id)
    if (idx !== -1) orders.value[idx] = data.order
  } catch (e: any) {
    error.value = e.message || 'Error al generar enlace'
  } finally {
    savingToken.value = ''
  }
}

function copyLink(order: PurchaseOrder) {
  if (!order.viewToken) return
  navigator.clipboard.writeText(`${window.location.origin}/seguir/${order.viewToken}`)
  linkCopiedId.value = order._id
  setTimeout(() => (linkCopiedId.value = ''), 2000)
}

function asesorName(order: PurchaseOrder) {
  if (typeof order.asesorId === 'object') {
    return order.asesorId.name || order.asesorId.email
  }
  return 'Asesor'
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

onMounted(loadOrders)
</script>

<template>
  <div class="orders-admin-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Pendientes de Compra</h1>
        <p class="page-subtitle">Revisa y gestiona las órdenes que los asesores han registrado</p>
      </div>
    </div>

    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span v-if="tab.key === 'pendientes' && pendientesCount > 0" class="tab-badge">{{ pendientesCount }}</span>
      </button>
    </div>

    <div class="toolbar">
      <label class="filter">
        <span>Estado</span>
        <select v-model="statusFilter" class="field-input">
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </label>
      <label class="filter">
        <span>Pago</span>
        <select v-model="paymentFilter" class="field-input">
          <option v-for="opt in paymentOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </label>
      <div class="filter client-search">
        <span>Buscar cliente</span>
        <div class="client-search-input">
          <input v-model="searchQuery" class="field-input" placeholder="Nombre, email o teléfono..." @keyup.enter="searchClients" />
          <button class="btn-sm" :disabled="searchingClient" @click="searchClients">
            <i class="fa-solid fa-search" />
          </button>
        </div>
      </div>
    </div>

    <div class="view-toggle">
      <button class="toggle-btn" :class="{ active: viewMode === 'board' }" @click="viewMode = 'board'">
        <i class="fa-solid fa-table-columns" /> Tablero
      </button>
      <button class="toggle-btn" :class="{ active: viewMode === 'table' }" @click="viewMode = 'table'">
        <i class="fa-solid fa-table" /> Tabla
      </button>
    </div>

    <div v-if="loading" class="loading">
      <i class="fa-solid fa-circle-notch fa-spin" /> Cargando...
    </div>

    <div v-else-if="error" class="alert error">
      <i class="fa-solid fa-circle-exclamation" /> {{ error }}
    </div>

    <div v-else-if="filteredOrders.length === 0" class="empty">
      <i class="fa-solid fa-cart-shopping" />
      <p>No hay órdenes en esta sección</p>
    </div>

    <div v-else-if="viewMode === 'board'" class="board-scroll">
      <div class="board">
        <section
          v-for="col in boardStatuses"
          :key="col.key"
          class="board-column"
          :class="[`accent-${col.accent}`]"
          @dragover="allowDrop"
          @drop="dropOnStatus(col.key)"
        >
          <header class="board-column__header">
            <div>
              <h3>{{ col.label }}</h3>
              <span>{{ boardColumns[col.key]?.length || 0 }} órdenes</span>
            </div>
          </header>
          <div class="board-column__body">
            <article
              v-for="order in boardColumns[col.key]"
              :key="order._id"
              class="board-card"
              draggable="true"
              :class="{ dragging: draggingOrderId === order._id }"
              @dragstart="onDragStart(order)"
              @dragend="onDragEnd"
            >
              <div class="board-card__top">
                <strong>{{ order.clientName }}</strong>
                <span class="mono">#{{ order._id.slice(-6).toUpperCase() }}</span>
              </div>
              <p class="board-card__desc">{{ order.description.slice(0, 84) }}{{ order.description.length > 84 ? '...' : '' }}</p>
              <div class="board-card__meta">
                <span class="badge" :class="order.paymentStatus === 'pagado' ? 'badge-green' : 'badge-blue'">{{ order.paymentStatus }}</span>
                <strong>${{ order.totalAmount.toFixed(2) }}</strong>
              </div>
              <div class="board-card__actions">
                <select class="badge-select" :value="order.status" @change="updateStatus(order, ($event.target as HTMLSelectElement).value)">
                  <option v-for="opt in statusOptions.filter((o) => o.value)" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>

    <div v-else class="table-wrapper">
      <table class="orders-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Asesor</th>
            <th>Tienda</th>
            <th>Servicio</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Pago</th>
            <th>Link</th>
            <th>Fecha</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filteredOrders" :key="order._id">
            <td class="mono">#{{ order._id.slice(-6).toUpperCase() }}</td>
            <td>
              <strong>{{ order.clientName }}</strong>
              <div class="cell-sub">{{ order.description.slice(0, 40) }}{{ order.description.length > 40 ? '...' : '' }}</div>
            </td>
            <td>{{ asesorName(order) }}</td>
            <td>{{ order.storeName }}</td>
            <td>
              <span :class="order.serviceType === 'compra_total' ? 'badge badge-orange' : 'badge badge-blue'">
                {{ order.serviceType === 'compra_total' ? 'C. Total' : 'Logística' }}
              </span>
            </td>
            <td class="mono total">${{ order.totalAmount.toFixed(2) }}</td>
            <td>
              <select
                class="badge-select"
                :value="order.status"
                @change="updateStatus(order, ($event.target as HTMLSelectElement).value)"
              >
                <option v-for="opt in statusOptions.filter((o) => o.value)" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </td>
            <td>
              <select
                class="badge-select"
                :value="order.paymentStatus"
                @change="updatePayment(order, ($event.target as HTMLSelectElement).value)"
              >
                <option v-for="opt in paymentOptions.filter((o) => o.value)" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </td>
            <td>
              <button
                v-if="order.viewToken"
                class="btn-link-copy"
                @click="copyLink(order)"
                :title="linkCopiedId === order._id ? 'Copiado' : 'Copiar enlace'"
              >
                <i :class="linkCopiedId === order._id ? 'fa-solid fa-check' : 'fa-solid fa-copy'" />
              </button>
              <button
                v-else
                class="btn-link-gen"
                :disabled="savingToken === order._id"
                @click="resetViewToken(order)"
                title="Generar enlace"
              >
                <i class="fa-solid fa-link" />
              </button>
            </td>
            <td class="mono">{{ formatDate(order.createdAt) }}</td>
            <td>
              <button
                v-if="order.status === 'pendiente'"
                class="btn-comprar"
                @click="openComprar(order)"
                title="Marcar como comprado"
              >
                <i class="fa-solid fa-check" /> Comprar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <transition name="fade">
      <div v-if="showComprarModal" class="modal-overlay" @click.self="showComprarModal = false">
        <div class="modal-card">
          <div class="modal-icon-box info"><i class="fa-solid fa-cart-shopping" /></div>
          <h3>Confirmar compra</h3>
          <p v-if="comprarOrder">
            ¿Confirmas que compraste <strong>{{ comprarOrder.description }}</strong> de <strong>{{ comprarOrder.storeName }}</strong> por <strong>${{ comprarOrder.totalAmount.toFixed(2) }}</strong>?
            <br /><br />
            Se enviará una notificación por email al cliente.
          </p>
          <label class="form-field">
            <span>Notas (opcional)</span>
            <textarea v-model="comprarNotes" class="field-input" rows="3" placeholder="Ej: Comprado en Amazon, tracking XYZ..." />
          </label>
          <div class="modal-actions">
            <button class="btn-ghost" @click="showComprarModal = false">Cancelar</button>
            <button class="btn-primary" @click="confirmComprar">
              <i class="fa-solid fa-check" /> Sí, comprado
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showSearchModal" class="modal-overlay" @click.self="showSearchModal = false">
        <div class="modal-card">
          <div class="modal-icon-box info"><i class="fa-solid fa-search" /></div>
          <h3>Resultados para "{{ searchQuery }}"</h3>
          <div v-if="searchResults.length === 0" class="search-empty">
            No se encontraron órdenes para este cliente.
          </div>
          <div v-else class="search-results-list">
            <div v-for="o in searchResults" :key="o._id" class="search-result-item" @click="router.push({ name: 'AdminPurchaseOrders' })">
              <div class="search-result-header">
                <strong>{{ o.clientName }}</strong>
                <span class="badge" :class="o.status === 'comprado' ? 'badge-green' : 'badge-blue'">{{ o.status }}</span>
              </div>
              <div class="search-result-meta">
                {{ o.storeName }} &middot; ${{ o.totalAmount.toFixed(2) }} &middot; {{ formatDate(o.createdAt) }}
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-ghost" @click="showSearchModal = false">Cerrar</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.orders-admin-page {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 $space-1;
}

.page-subtitle {
  color: $ink-400;
  margin: 0;
  font-size: 0.9rem;
}

.tabs {
  display: flex;
  gap: $space-1;
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 14px;
  padding: $space-1;
}

.tab {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-4;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: $ink-400;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: $fg-dark;
    background: rgba($ink-600, 0.2);
  }

  &.active {
    background: rgba($brand-orange, 0.1);
    color: $brand-orange;
    font-weight: 600;
  }
}

.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: $signal-red;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: $space-4;
}

.view-toggle {
  display: inline-flex;
  gap: $space-2;
  padding: $space-1;
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 14px;
  width: fit-content;
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-4;
  border: 0;
  background: transparent;
  color: $ink-400;
  border-radius: 10px;
  cursor: pointer;
  font: inherit;
  &.active {
    background: rgba($brand-orange, 0.12);
    color: $brand-orange;
  }
}

.filter {
  display: flex;
  align-items: center;
  gap: $space-3;
  color: $ink-300;
  font-size: 0.9rem;

  .field-input {
    background: $ink-900;
    border: 1px solid rgba($ink-500, 0.2);
    border-radius: 10px;
    padding: $space-2 $space-3;
    color: $fg-dark;
    font-family: inherit;
    outline: none;
    &:focus { border-color: $brand-orange; }
  }
}

.loading, .empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  padding: $space-12 0;
  color: $ink-500;
  i { font-size: 1.5rem; }
}

.alert {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-radius: 12px;
  font-size: 0.9rem;
  background: rgba($signal-red, 0.1);
  color: #ff8a8f;
  border: 1px solid rgba($signal-red, 0.15);
}

.table-wrapper {
  overflow-x: auto;
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 16px;
}

.board-scroll {
  overflow-x: auto;
  padding-bottom: $space-2;
}

.board {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(290px, 1fr);
  gap: $space-4;
  min-height: 65vh;
}

.board-column {
  display: flex;
  flex-direction: column;
  background: rgba($ink-900, 0.8);
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 18px;
  overflow: hidden;
  min-height: 100%;
  &.accent-orange { box-shadow: inset 0 3px 0 rgba($brand-orange, 0.8); }
  &.accent-blue { box-shadow: inset 0 3px 0 rgba(#64b5f6, 0.8); }
  &.accent-green { box-shadow: inset 0 3px 0 rgba(#81c784, 0.8); }
  &.accent-purple { box-shadow: inset 0 3px 0 rgba(#a78bfa, 0.8); }
  &.accent-red { box-shadow: inset 0 3px 0 rgba(#e5484d, 0.8); }
  &.accent-neutral { box-shadow: inset 0 3px 0 rgba($ink-400, 0.8); }
}

.board-column__header {
  padding: $space-4;
  border-bottom: 1px solid rgba($ink-500, 0.12);
  h3 { margin: 0; font-size: 1rem; }
  span { color: $ink-400; font-size: 0.8rem; }
}

.board-column__body {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-4;
  min-height: 280px;
}

.board-card {
  background: rgba($ink-800, 0.95);
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 16px;
  padding: $space-4;
  cursor: grab;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  &:hover { transform: translateY(-1px); border-color: rgba($brand-orange, 0.2); }
  &.dragging { opacity: 0.55; transform: scale(0.98); }
}

.board-card__top, .board-card__meta, .board-card__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
}

.board-card__top { margin-bottom: $space-2; }
.board-card__desc { margin: 0 0 $space-3; color: $ink-300; font-size: 0.9rem; line-height: 1.45; }
.board-card__meta { margin-bottom: $space-3; }

.orders-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;

  th, td {
    padding: $space-3 $space-4;
    text-align: left;
    border-bottom: 1px solid rgba($ink-500, 0.1);
    white-space: nowrap;
  }

  th {
    color: $ink-400;
    font-weight: 600;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  tbody tr:last-child td { border-bottom: none; }
  .mono { font-variant-numeric: tabular-nums; }
  .total { color: $brand-orange; font-weight: 700; }
  .cell-sub { color: $ink-400; font-size: 0.8rem; margin-top: 2px; }
}

.badge-select {
  background: $ink-1000;
  border: 1px solid rgba($ink-500, 0.2);
  border-radius: 8px;
  padding: $space-1 $space-2;
  color: $fg-dark;
  font-family: inherit;
  font-size: 0.8rem;
  cursor: pointer;
}

.btn-comprar {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-1 $space-3;
  background: rgba(#81c784, 0.1);
  border: 1px solid rgba(#81c784, 0.2);
  border-radius: 8px;
  color: #81c784;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: rgba(#81c784, 0.2);
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba($ink-1000, 0.75);
  backdrop-filter: blur(6px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.modal-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.15);
  border-radius: 20px;
  padding: $space-8;
  max-width: 480px;
  width: 100%;
  text-align: center;

  .modal-icon-box {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto $space-4;
    font-size: 1.2rem;
    &.info { background: rgba($brand-orange, 0.12); color: $brand-orange; }
  }

  h3 { font-size: 1.15rem; margin: 0 0 $space-3; }

  p { color: $ink-300; font-size: 0.9rem; margin: 0 0 $space-4; line-height: 1.5; }
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  text-align: left;
  margin-bottom: $space-4;

  span { font-size: 0.8rem; color: $ink-400; font-weight: 500; }

  .field-input {
    background: $ink-800;
    border: 1px solid rgba($ink-500, 0.2);
    border-radius: 10px;
    padding: $space-2 $space-3;
    color: $fg-dark;
    font-family: inherit;
    outline: none;
    resize: vertical;
    &:focus { border-color: $brand-orange; }
  }
}

.modal-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-3;
}

.btn-ghost {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 1px solid rgba($ink-500, 0.3);
  border-radius: 10px;
  color: $ink-300;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  &:hover { background: rgba($ink-500, 0.15); color: $fg-dark; }
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  padding: 0.75rem 1.5rem;
  background: $brand-orange;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  &:hover { background: darken($brand-orange, 8%); }
}

.client-search {
  margin-left: auto;
  .client-search-input {
    display: flex;
    gap: $space-2;
    .field-input { min-width: 200px; }
  }
}

.btn-sm {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $ink-700;
  border: 1px solid rgba($ink-500, 0.2);
  border-radius: 10px;
  color: $fg-dark;
  cursor: pointer;
  flex-shrink: 0;
  &:hover { background: $ink-600; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.btn-link-copy, .btn-link-gen {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid rgba($ink-500, 0.2);
  border-radius: 8px;
  color: $ink-400;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  &:hover { background: rgba($brand-orange, 0.1); color: $brand-orange; border-color: rgba($brand-orange, 0.3); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.badge {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  &.badge-orange { background: rgba($brand-orange, 0.12); color: $brand-orange; }
  &.badge-blue { background: rgba(#64b5f6, 0.12); color: #64b5f6; }
  &.badge-green { background: rgba(#81c784, 0.12); color: #81c784; }
}

.search-results-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  max-height: 300px;
  overflow-y: auto;
  text-align: left;
}

.search-result-item {
  padding: $space-3;
  background: rgba($ink-700, 0.3);
  border: 1px solid rgba($ink-500, 0.1);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: rgba($brand-orange, 0.06); border-color: rgba($brand-orange, 0.15); }
}

.search-result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-1;
}

.search-result-meta {
  font-size: 0.8rem;
  color: $ink-400;
}

.search-empty {
  color: $ink-400;
  font-size: 0.9rem;
  padding: $space-4 0;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
