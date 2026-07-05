<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { asesoriaApi } from '@/services/asesoria.api'
import type { PurchaseOrder } from '@/services/asesoria.api'
import { useToastStore } from '@/stores/toast.store'

const router = useRouter()
const toastStore = useToastStore()
const orders = ref<PurchaseOrder[]>([])
const loading = ref(false)
const statusFilter = ref('')

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'borrador', label: 'Borrador' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'comprado', label: 'Comprado' },
  { value: 'en_envio', label: 'En envío' },
  { value: 'entregado', label: 'Entregado' },
]

const paymentBadge = {
  pendiente: { label: 'Pendiente', class: 'badge-amber' },
  verificando: { label: 'Verificando', class: 'badge-blue' },
  pagado: { label: 'Pagado', class: 'badge-green' },
  rechazado: { label: 'Rechazado', class: 'badge-red' },
}

const statusBadge = {
  borrador: { label: 'Borrador', class: 'badge-gray' },
  pendiente: { label: 'Pendiente', class: 'badge-amber' },
  en_proceso: { label: 'En proceso', class: 'badge-blue' },
  comprado: { label: 'Comprado', class: 'badge-purple' },
  en_envio: { label: 'En envío', class: 'badge-indigo' },
  entregado: { label: 'Entregado', class: 'badge-green' },
  cancelado: { label: 'Cancelado', class: 'badge-red' },
}

const filteredOrders = computed(() => {
  if (!statusFilter.value) return orders.value
  return orders.value.filter((o) => o.status === statusFilter.value)
})

async function loadOrders() {
  loading.value = true
  try {
    const data = await asesoriaApi.listOrders({ limit: 100 })
    orders.value = data.orders
  } catch (e: any) {
    toastStore.showNotification(e.message || 'Error al cargar órdenes', 'error')
  } finally {
    loading.value = false
  }
}

function openOrder(id: string) {
  router.push({ name: 'AsesorOrderDetail', params: { id } })
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
  <div class="orders-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Órdenes de compra</h1>
        <p class="page-subtitle">Todas las órdenes que has creado para tus clientes</p>
      </div>
      <router-link :to="{ name: 'AsesorNewOrder' }" class="btn-primary">
        <i class="fa-solid fa-plus" /> Nueva orden
      </router-link>
    </div>

    <div class="toolbar">
      <label class="filter">
        <span>Estado</span>
        <select v-model="statusFilter" class="field-input">
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </label>
    </div>

    <div v-if="loading" class="loading">
      <i class="fa-solid fa-circle-notch fa-spin" />
      <span>Cargando órdenes...</span>
    </div>

    <div v-else-if="filteredOrders.length === 0" class="empty">
      <i class="fa-solid fa-clipboard-list" />
      <p>No tienes órdenes aún</p>
      <router-link :to="{ name: 'AsesorNewOrder' }" class="btn-link">Crear primera orden</router-link>
    </div>

    <div v-else class="orders-list">
      <div
        v-for="order in filteredOrders"
        :key="order._id"
        class="order-card"
        @click="openOrder(order._id)"
      >
        <div class="order-main">
          <div class="order-top">
            <span class="order-id">#{{ order._id.slice(-6).toUpperCase() }}</span>
            <span class="order-date">{{ formatDate(order.createdAt) }}</span>
          </div>
          <h4 class="order-client">{{ order.clientName }}</h4>
          <p class="order-desc">{{ order.description }}</p>
          <div class="order-meta">
            <span><i class="fa-solid fa-store" /> {{ order.storeName }}</span>
            <span v-if="order.trackingUsa"><i class="fa-solid fa-truck-fast" /> {{ order.trackingUsa }}</span>
          </div>
        </div>
        <div class="order-side">
          <div class="order-badges">
            <span class="badge" :class="statusBadge[order.status as keyof typeof statusBadge]?.class || 'badge-gray'">
              {{ statusBadge[order.status as keyof typeof statusBadge]?.label || order.status }}
            </span>
            <span
              class="badge"
              :class="paymentBadge[order.paymentStatus as keyof typeof paymentBadge]?.class || 'badge-gray'"
            >
              {{ paymentBadge[order.paymentStatus as keyof typeof paymentBadge]?.label || order.paymentStatus }}
            </span>
          </div>
          <div class="order-total">${{ order.totalAmount.toFixed(2) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.orders-page {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
  }
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

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3 $space-5;
  background: $brand-orange;
  border: none;
  border-radius: 12px;
  color: $ink-1000;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background: color.adjust($brand-orange, $lightness: 6%);
  }
}

.toolbar {
  display: flex;
  align-items: center;
  gap: $space-4;
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

    &:focus {
      border-color: $brand-orange;
    }
  }
}

.loading,
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  padding: $space-12 0;
  color: $ink-500;

  i {
    font-size: 2rem;
  }
}

.empty {
  i {
    opacity: 0.5;
  }
  p {
    margin: 0;
  }
}

.btn-link {
  color: $brand-orange;
  text-decoration: none;
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }
}

.alert {
  display: flex;
  align-items: flex-start;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-radius: 12px;
  font-size: 0.9rem;
  background: rgba($signal-red, 0.1);
  color: #ff8a8f;
  border: 1px solid rgba($signal-red, 0.15);
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.order-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 16px;
  padding: $space-5;
  display: flex;
  justify-content: space-between;
  gap: $space-4;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: rgba($brand-orange, 0.25);
    transform: translateY(-2px);
  }

  @media (max-width: 640px) {
    flex-direction: column;
  }
}

.order-main {
  flex: 1;
}

.order-top {
  display: flex;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-2;
}

.order-id {
  font-size: 0.8rem;
  font-weight: 700;
  color: $brand-orange;
  background: rgba($brand-orange, 0.1);
  padding: 2px 8px;
  border-radius: 6px;
}

.order-date {
  font-size: 0.8rem;
  color: $ink-400;
}

.order-client {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 $space-1;
}

.order-desc {
  color: $ink-300;
  font-size: 0.9rem;
  margin: 0 0 $space-3;
  line-height: 1.4;
}

.order-meta {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
  font-size: 0.8rem;
  color: $ink-400;

  i {
    margin-right: 4px;
  }
}

.order-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  gap: $space-3;

  @media (max-width: 640px) {
    align-items: flex-start;
    flex-direction: row;
  }
}

.order-badges {
  display: flex;
  gap: $space-2;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.badge-amber { background: rgba($signal-amber, 0.12); color: $signal-amber; }
.badge-blue { background: rgba($signal-blue, 0.12); color: $signal-blue; }
.badge-green { background: rgba($signal-green, 0.12); color: $signal-green; }
.badge-red { background: rgba($signal-red, 0.12); color: #ff8a8f; }
.badge-gray { background: rgba($ink-500, 0.12); color: $ink-400; }
.badge-purple { background: rgba(#a855f7, 0.12); color: #c084fc; }
.badge-indigo { background: rgba(#6366f1, 0.12); color: #818cf8; }

.order-total {
  font-size: 1.3rem;
  font-weight: 700;
  color: $brand-orange;
}
</style>
