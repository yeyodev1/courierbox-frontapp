<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { contactosApi, type Contacto, type ContactoDetail } from '@/services/contactos.api'
import { useToastStore } from '@/stores/toast.store'

const toastStore = useToastStore()

const contactos = ref<Contacto[]>([])
const total = ref(0)
const loading = ref(false)
const searchQuery = ref('')
const selectedContacto = ref<ContactoDetail | null>(null)
const loadingDetail = ref(false)

const statusSteps = [
  { key: 'borrador', label: 'Borrador' },
  { key: 'pendiente', label: 'Pendiente' },
  { key: 'en_proceso', label: 'En proceso' },
  { key: 'comprado', label: 'Comprado' },
  { key: 'en_envio', label: 'En envío' },
  { key: 'entregado', label: 'Entregado' },
]

function formatDate(ts: string): string {
  const d = new Date(ts)
  return d.toLocaleDateString('es-EC', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatShortDate(ts: string): string {
  const d = new Date(ts)
  return d.toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatMoney(n: number): string {
  return `$${n.toFixed(2)}`
}

async function loadContactos() {
  loading.value = true
  try {
    const data = await contactosApi.list({ q: searchQuery.value.trim() || undefined, limit: 200 })
    contactos.value = data.contactos
    total.value = data.total
  } catch (e: any) {
    toastStore.showNotification(e.message || 'Error al cargar contactos', 'error')
  } finally {
    loading.value = false
  }
}

async function openContacto(c: Contacto) {
  loadingDetail.value = true
  selectedContacto.value = null
  try {
    const data = await contactosApi.getDetail(c.clientName, c.clientEmail, c.clientPhone)
    selectedContacto.value = data
  } catch (e: any) {
    toastStore.showNotification(e.message || 'Error al cargar detalle', 'error')
  } finally {
    loadingDetail.value = false
  }
}

function closeDetail() {
  selectedContacto.value = null
}

onMounted(loadContactos)
</script>

<template>
  <div class="contactos-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Contactos</h1>
        <p class="page-subtitle">Busca clientes, revisa sus órdenes y el historial de gestión</p>
      </div>
      <div class="search-bar">
        <i class="fa-solid fa-search" />
        <input
          v-model="searchQuery"
          class="search-input"
          placeholder="Buscar por nombre, email o teléfono..."
          @keyup.enter="loadContactos"
        />
        <button class="btn-search" @click="loadContactos">Buscar</button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <i class="fa-solid fa-circle-notch fa-spin" /> Cargando...
    </div>

    <div v-else-if="contactos.length === 0" class="empty">
      <i class="fa-solid fa-address-book" />
      <p>No se encontraron contactos</p>
    </div>

    <div v-else class="contactos-layout">
      <div class="contactos-list">
        <div class="contactos-count">{{ total }} contacto{{ total !== 1 ? 's' : '' }}</div>
        <div
          v-for="c in contactos"
          :key="c._id"
          class="contacto-card"
          :class="{ active: selectedContacto?.contacto.clientName === c.clientName }"
          @click="openContacto(c)"
        >
          <div class="contacto-avatar">{{ c.clientName.charAt(0).toUpperCase() }}</div>
          <div class="contacto-info">
            <strong>{{ c.clientName }}</strong>
            <span v-if="c.clientEmail" class="contacto-email">{{ c.clientEmail }}</span>
            <span v-if="c.clientPhone" class="contacto-phone">{{ c.clientPhone }}</span>
          </div>
          <div class="contacto-meta">
            <span class="contacto-orders">{{ c.totalOrders }} órdenes</span>
            <span class="contacto-total">{{ formatMoney(c.totalAmount) }}</span>
          </div>
        </div>
      </div>

      <div class="contacto-detail">
        <div v-if="loadingDetail" class="loading">
          <i class="fa-solid fa-circle-notch fa-spin" /> Cargando detalle...
        </div>

        <div v-else-if="!selectedContacto" class="detail-empty">
          <i class="fa-solid fa-address-card" />
          <p>Selecciona un contacto para ver sus órdenes</p>
        </div>

        <template v-else>
          <div class="detail-header">
            <button class="btn-back" @click="closeDetail"><i class="fa-solid fa-xmark" /></button>
            <div class="detail-title">
              <h2>{{ selectedContacto.contacto.clientName }}</h2>
              <div class="detail-contact">
                <span v-if="selectedContacto.contacto.clientEmail">
                  <i class="fa-solid fa-envelope" /> {{ selectedContacto.contacto.clientEmail }}
                </span>
                <span v-if="selectedContacto.contacto.clientPhone">
                  <i class="fa-solid fa-phone" /> {{ selectedContacto.contacto.clientPhone }}
                </span>
              </div>
            </div>
            <div class="detail-stats">
              <div class="stat">
                <span class="stat-value">{{ selectedContacto.contacto.totalOrders }}</span>
                <span class="stat-label">Órdenes</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ formatShortDate(selectedContacto.contacto.firstOrderDate) }}</span>
                <span class="stat-label">Primera orden</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ formatShortDate(selectedContacto.contacto.lastOrderDate) }}</span>
                <span class="stat-label">Última orden</span>
              </div>
            </div>
          </div>

          <div class="detail-orders">
            <h3>Órdenes ({{ selectedContacto.orders.length }})</h3>
            <div v-for="o in selectedContacto.orders" :key="o._id" class="order-card">
              <div class="order-header">
                <span class="order-id">#{{ o._id.slice(-6).toUpperCase() }}</span>
                <span class="order-status" :class="`status-${o.status}`">
                  {{ statusSteps.find(s => s.key === o.status)?.label || o.status }}
                </span>
                <span class="order-amount">{{ formatMoney(o.totalAmount) }}</span>
              </div>
              <div class="order-body">
                <div class="order-detail-item">
                  <span class="label">Tienda</span>
                  <span>{{ o.storeName }}</span>
                </div>
                <div class="order-detail-item">
                  <span class="label">Producto</span>
                  <span>{{ o.description?.slice(0, 60) }}{{ o.description?.length > 60 ? '...' : '' }}</span>
                </div>
                <div class="order-detail-item">
                  <span class="label">Servicio</span>
                  <span>{{ o.serviceType === 'compra_total' ? 'Compra Total' : 'Logística' }}</span>
                </div>
                <div class="order-detail-item">
                  <span class="label">Creada por</span>
                  <span>{{ o.asesorId?.name || o.asesorId?.email || 'N/A' }}</span>
                </div>
                <div class="order-detail-item">
                  <span class="label">Fecha</span>
                  <span>{{ formatDate(o.createdAt) }}</span>
                </div>
              </div>
              <div v-if="o.auditLog && o.auditLog.length" class="order-audit">
                <div class="audit-toggle">
                  <i class="fa-solid fa-clock-rotate-left" /> Historial
                </div>
                <div class="audit-entries">
                  <div v-for="entry in o.auditLog.slice(-5).reverse()" :key="entry.timestamp" class="audit-entry">
                    <div class="audit-dot" />
                    <div class="audit-entry-body">
                      <div class="audit-action">{{ entry.action === 'created' ? 'Creada' : entry.action === 'status_changed' ? 'Estado cambiado' : entry.action === 'payment_status_changed' ? 'Pago actualizado' : entry.action }}</div>
                      <div class="audit-meta">{{ entry.userName }} &middot; {{ formatDate(entry.timestamp) }}</div>
                      <div v-if="entry.notes" class="audit-notes">{{ entry.notes }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.contactos-page {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-6;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: $space-2;
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.15);
  border-radius: 12px;
  padding: $space-2 $space-4;
  i { color: $ink-400; }
}

.search-input {
  background: transparent;
  border: none;
  outline: none;
  color: $fg-dark;
  font-family: inherit;
  font-size: 0.9rem;
  min-width: 280px;
  &::placeholder { color: $ink-400; }
}

.btn-search {
  padding: $space-1 $space-4;
  background: $brand-orange;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  font-family: inherit;
  &:hover { background: color.adjust($brand-orange, $lightness: -8%); }
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

.contactos-layout {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: $space-4;
  min-height: 60vh;
}

.contactos-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.contactos-count {
  font-size: 0.8rem;
  color: $ink-400;
  padding: $space-1 0;
}

.contacto-card {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3;
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { border-color: rgba($brand-orange, 0.2); background: rgba($brand-orange, 0.03); }
  &.active { border-color: $brand-orange; background: rgba($brand-orange, 0.06); }
}

.contacto-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba($brand-orange, 0.15);
  color: $brand-orange;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}

.contacto-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  strong { font-size: 0.9rem; color: $fg-dark; }
  .contacto-email, .contacto-phone { font-size: 0.75rem; color: $ink-400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
}

.contacto-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.contacto-orders {
  font-size: 0.75rem;
  color: $ink-400;
}

.contacto-total {
  font-size: 0.85rem;
  color: $brand-orange;
  font-weight: 700;
}

.contacto-detail {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.1);
  border-radius: 16px;
  padding: $space-6;
  overflow-y: auto;
  max-height: 80vh;
}

.detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $space-12 0;
  color: $ink-500;
  i { font-size: 2.5rem; margin-bottom: $space-4; }
  p { margin: 0; font-size: 0.95rem; }
}

.detail-header {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  padding-bottom: $space-4;
  border-bottom: 1px solid rgba($ink-500, 0.1);
  position: relative;
}

.btn-back {
  position: absolute;
  top: 0;
  right: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid rgba($ink-500, 0.2);
  border-radius: 8px;
  color: $ink-400;
  cursor: pointer;
  &:hover { background: rgba($signal-red, 0.1); color: #ff8a8f; }
}

.detail-title h2 { margin: 0 0 $space-1; font-size: 1.2rem; color: $fg-dark; }

.detail-contact {
  display: flex;
  gap: $space-4;
  font-size: 0.85rem;
  color: $ink-400;
  i { margin-right: $space-1; }
}

.detail-stats {
  display: flex;
  gap: $space-6;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: $fg-dark;
}

.stat-label {
  font-size: 0.7rem;
  color: $ink-400;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.detail-orders {
  padding-top: $space-4;
  h3 {
    font-size: 0.95rem;
    margin: 0 0 $space-3;
    color: $fg-dark;
  }
}

.order-card {
  background: rgba($ink-1000, 0.4);
  border: 1px solid rgba($ink-500, 0.1);
  border-radius: 12px;
  padding: $space-4;
  margin-bottom: $space-3;
}

.order-header {
  display: flex;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-3;
  padding-bottom: $space-3;
  border-bottom: 1px solid rgba($ink-500, 0.06);
}

.order-id {
  font-family: monospace;
  font-size: 0.8rem;
  color: $ink-400;
}

.order-status {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba($ink-500, 0.1);
  color: $ink-300;
  &.status-borrador { background: rgba($ink-500, 0.1); color: $ink-300; }
  &.status-pendiente { background: rgba(#64b5f6, 0.12); color: #64b5f6; }
  &.status-en_proceso { background: rgba($brand-orange, 0.12); color: $brand-orange; }
  &.status-comprado { background: rgba(#81c784, 0.12); color: #81c784; }
  &.status-en_envio { background: rgba(#64b5f6, 0.12); color: #64b5f6; }
  &.status-entregado { background: rgba(#81c784, 0.12); color: #81c784; }
}

.order-amount {
  margin-left: auto;
  font-weight: 700;
  color: $brand-orange;
  font-size: 0.9rem;
}

.order-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-2;
}

.order-detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  .label { font-size: 0.7rem; color: $ink-400; text-transform: uppercase; letter-spacing: 0.04em; }
  span:last-child { font-size: 0.85rem; color: $fg-dark; }
}

.order-audit {
  margin-top: $space-3;
  padding-top: $space-3;
  border-top: 1px solid rgba($ink-500, 0.06);
}

.audit-toggle {
  font-size: 0.8rem;
  color: $ink-400;
  margin-bottom: $space-2;
  i { margin-right: $space-1; }
}

.audit-entries {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.audit-entry {
  display: flex;
  gap: $space-2;
  padding: $space-1 0;
}

.audit-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: $brand-orange;
  flex-shrink: 0;
  margin-top: 5px;
}

.audit-entry-body { flex: 1; }

.audit-action {
  font-size: 0.8rem;
  font-weight: 600;
  color: $fg-dark;
}

.audit-meta {
  font-size: 0.7rem;
  color: $ink-400;
}

.audit-notes {
  font-size: 0.75rem;
  color: $ink-300;
  margin-top: 2px;
}
</style>
