<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { asesoriaApi } from '@/services/asesoria.api'
import type { PurchaseOrder } from '@/services/asesoria.api'
import { gestionesCompraAPI } from '@/services/gestiones_compra.api'

const router = useRouter()

const stats = ref({
  totalOrders: 0,
  pendingPayment: 0,
  totalSold: 0,
  recentOrders: [] as PurchaseOrder[],
})
const loading = ref(false)
const gcStats = ref({ totalGestiones: 0, sumaValorTotal: 0, sumaComision: 0 })

const actions = [
  {
    label: 'Nueva orden',
    sub: 'Crear orden de compra',
    icon: 'fa-solid fa-plus',
    route: '/asesor/ordenes/nueva',
  },
  {
    label: 'Calculadora',
    sub: 'Cotizar fee de gestión',
    icon: 'fa-solid fa-calculator',
    route: '/asesor/calculadora',
  },
  {
    label: 'Mis órdenes',
    sub: 'Ver historial',
    icon: 'fa-solid fa-bag-shopping',
    route: '/asesor/ordenes',
  },
  {
    label: 'Nueva Venta',
    sub: 'Registrar venta de compra',
    icon: 'fa-solid fa-cart-plus',
    route: '/asesor/ventas',
  },
  {
    label: 'Contactos',
    sub: 'Ver historial y clientes',
    icon: 'fa-solid fa-address-book',
    route: '/asesor/contactos',
  },
  {
    label: 'Mis Gestiones',
    sub: 'Ver gestiones del mes',
    icon: 'fa-solid fa-list-check',
    route: '/asesor/gestiones-compra',
  },
]

const paymentBadge = {
  pendiente: { label: 'Pendiente', class: 'badge-amber' },
  verificando: { label: 'Verificando', class: 'badge-blue' },
  pagado: { label: 'Pagado', class: 'badge-green' },
  rechazado: { label: 'Rechazado', class: 'badge-red' },
}

async function loadStats() {
  loading.value = true
  try {
    const data = await asesoriaApi.getStats()
    stats.value = data.stats
  } catch (e) {
    console.error('[asesor dashboard] stats error:', e)
  } finally {
    loading.value = false
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
  })
}

function formatMoney(amount: number) {
  return `$${Number(amount).toFixed(2)}`
}

onMounted(() => {
  loadStats()
  const now = new Date()
  gestionesCompraAPI.getStatsMensuales({ año: now.getFullYear(), mes: now.getMonth() + 1 })
    .then(data => { gcStats.value = data })
    .catch(() => {})
})
</script>

<template>
  <div class="dashboard-page">
    <section class="welcome-card">
      <div>
        <h1 class="page-title">Bienvenido, Asesor</h1>
        <p class="page-subtitle">
          Gestiona las órdenes de compra de tus clientes, genera links de pago y carga comprobantes.
        </p>
      </div>
    </section>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon"><i class="fa-solid fa-bag-shopping" /></div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.totalOrders }}</span>
          <span class="stat-label">Órdenes totales</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fa-solid fa-clock" /></div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.pendingPayment }}</span>
          <span class="stat-label">Pendientes de pago</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fa-solid fa-dollar-sign" /></div>
        <div class="stat-info">
          <span class="stat-value">{{ formatMoney(stats.totalSold) }}</span>
          <span class="stat-label">Vendido confirmado</span>
        </div>
      </div>
      <div class="stat-card stat-card--highlight" @click="router.push('/asesor/gestiones-compra')" style="cursor:pointer">
        <div class="stat-icon stat-icon--orange"><i class="fa-solid fa-cart-plus" /></div>
        <div class="stat-info">
          <span class="stat-value">{{ formatMoney(gcStats.sumaValorTotal) }}</span>
          <span class="stat-label">Gestiones del mes</span>
          <span class="stat-sub">{{ gcStats.totalGestiones }} operaciones</span>
        </div>
      </div>
    </div>

    <section class="actions-section">
      <h3 class="section-title">Acciones rápidas</h3>
      <div class="actions-grid">
        <button
          v-for="action in actions"
          :key="action.route"
          class="action-card"
          @click="router.push(action.route)"
        >
          <div class="action-icon"><i :class="action.icon" /></div>
          <div class="action-text">
            <strong>{{ action.label }}</strong>
            <span>{{ action.sub }}</span>
          </div>
          <i class="fa-solid fa-chevron-right action-arrow" />
        </button>
      </div>
    </section>

    <section class="recent-section">
      <div class="section-header">
        <h3 class="section-title">Órdenes recientes</h3>
        <router-link :to="{ name: 'AsesorOrders' }" class="btn-link">Ver todas</router-link>
      </div>

      <div v-if="loading" class="loading">
        <i class="fa-solid fa-circle-notch fa-spin" />
      </div>

      <div v-else-if="stats.recentOrders.length === 0" class="empty">
        <p>No tienes órdenes recientes</p>
      </div>

      <div v-else class="recent-list">
        <div
          v-for="order in stats.recentOrders"
          :key="order._id"
          class="recent-item"
          @click="router.push({ name: 'AsesorOrderDetail', params: { id: order._id } })"
        >
          <div class="recent-main">
            <span class="recent-client">{{ order.clientName }}</span>
            <span class="recent-desc">{{ order.description }}</span>
          </div>
          <div class="recent-side">
            <span
              class="badge"
              :class="paymentBadge[order.paymentStatus as keyof typeof paymentBadge]?.class || 'badge-gray'"
            >
              {{ paymentBadge[order.paymentStatus as keyof typeof paymentBadge]?.label || order.paymentStatus }}
            </span>
            <span class="recent-total">{{ formatMoney(order.totalAmount) }}</span>
            <span class="recent-date">{{ formatDate(order.createdAt) }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.welcome-card {
  background: linear-gradient(135deg, rgba($brand-orange, 0.12), rgba($brand-orange, 0.02));
  border: 1px solid rgba($brand-orange, 0.15);
  border-radius: 20px;
  padding: $space-8;

  .page-title {
    font-size: 1.6rem;
    font-weight: 700;
    margin: 0 0 $space-2;
  }

  .page-subtitle {
    color: $ink-300;
    margin: 0;
    max-width: 600px;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-5;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 16px;
  padding: $space-5;
  display: flex;
  align-items: center;
  gap: $space-4;

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: rgba($brand-orange, 0.1);
    color: $brand-orange;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
  }

  .stat-info {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-size: 1.6rem;
    font-weight: 700;
    color: $fg-dark;
  }

  .stat-label {
    font-size: 0.85rem;
    color: $ink-400;
  }

  .stat-sub {
    font-size: 0.75rem;
    color: $ink-400;
  }
}

.stat-card--highlight {
  border-color: rgba($brand-orange, 0.35);
  background: rgba($brand-orange, 0.05);

  .stat-value { color: $brand-orange; }
}

.stat-icon--orange {
  background: rgba($brand-orange, 0.15) !important;
  color: $brand-orange !important;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 $space-4;
}

.actions-section {
  margin-top: $space-2;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-4;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.action-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 16px;
  padding: $space-5;
  display: flex;
  align-items: center;
  gap: $space-4;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-family: inherit;
  color: inherit;

  &:hover {
    border-color: rgba($brand-orange, 0.25);
    transform: translateY(-2px);
  }

  .action-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba($brand-orange, 0.1);
    color: $brand-orange;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
  }

  .action-text {
    display: flex;
    flex-direction: column;
    flex: 1;

    strong {
      font-size: 1rem;
      font-weight: 600;
    }

    span {
      font-size: 0.8rem;
      color: $ink-400;
    }
  }

  .action-arrow {
    color: $ink-500;
    font-size: 0.8rem;
  }
}

.recent-section {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 20px;
  padding: $space-6;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-4;
}

.btn-link {
  color: $brand-orange;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }
}

.loading,
.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-8 0;
  color: $ink-500;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-4;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba($ink-500, 0.08);
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: $space-3;
  }
}

.recent-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recent-client {
  font-weight: 600;
}

.recent-desc {
  font-size: 0.85rem;
  color: $ink-400;
}

.recent-side {
  display: flex;
  align-items: center;
  gap: $space-4;

  @media (max-width: 640px) {
    width: 100%;
    justify-content: space-between;
  }
}

.recent-total {
  font-weight: 700;
  color: $brand-orange;
}

.recent-date {
  font-size: 0.8rem;
  color: $ink-500;
}

.badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
}

.badge-amber { background: rgba($signal-amber, 0.12); color: $signal-amber; }
.badge-blue { background: rgba($signal-blue, 0.12); color: $signal-blue; }
.badge-green { background: rgba($signal-green, 0.12); color: $signal-green; }
.badge-red { background: rgba($signal-red, 0.12); color: #ff8a8f; }
.badge-gray { background: rgba($ink-500, 0.12); color: $ink-400; }
</style>
