<script setup lang="ts">
/** The asesor's home: month KPIs, shortcuts and their latest sales. */
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AsesorRecientes from './Dashboard/AsesorRecientes.vue'
import { QUICK_ACTIONS, formatMoney, useAsesorDashboard } from './Dashboard/useAsesorDashboard'

const router = useRouter()
const d = useAsesorDashboard()

onMounted(d.load)
</script>

<template>
  <div class="dashboard-page">
    <section class="welcome-card">
      <div>
        <h1 class="page-title">Bienvenido, Asesor</h1>
        <p class="page-subtitle">
          Gestiona compras, pagos, comisiones y seguimiento de tus clientes desde un solo lugar.
        </p>
      </div>
    </section>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon"><i class="fa-solid fa-bag-shopping" /></div>
        <div class="stat-info">
          <span class="stat-value">{{ d.stats.value.totalGestiones }}</span>
          <span class="stat-label">Gestiones del mes</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fa-solid fa-clock" /></div>
        <div class="stat-info">
          <span class="stat-value">{{ d.stats.value.pendingPayment }}</span>
          <span class="stat-label">Pendientes de pago</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fa-solid fa-dollar-sign" /></div>
        <div class="stat-info">
          <span class="stat-value">{{ formatMoney(d.stats.value.totalSold) }}</span>
          <span class="stat-label">Vendido confirmado</span>
        </div>
      </div>
      <button class="stat-card stat-card--highlight" @click="router.push('/asesor/gestiones-compra')">
        <div class="stat-icon stat-icon--orange"><i class="fa-solid fa-cart-plus" /></div>
        <div class="stat-info">
          <span class="stat-value">{{ formatMoney(d.stats.value.sumaComision) }}</span>
          <span class="stat-label">Comisión del mes</span>
          <span class="stat-sub">Ganada sobre pagos confirmados</span>
        </div>
      </button>
    </div>

    <section class="actions-section">
      <h3 class="section-title">Acciones rápidas</h3>
      <div class="actions-grid">
        <button
          v-for="action in QUICK_ACTIONS"
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

    <AsesorRecientes
      :gestiones="d.stats.value.recentGestiones"
      :loading="d.loading.value"
      @open="(id) => router.push(`/asesor/gestiones-compra/${id}`)"
    />
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

  .page-title { font-size: 1.6rem; font-weight: 700; margin: 0 0 $space-2; }
  .page-subtitle { color: $ink-300; margin: 0; max-width: 600px; }
}

.stats-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $space-5;

  @media (max-width: 768px) { flex-direction: column; }
}

.stat-card {
  flex: 1 1 220px;
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 16px;
  padding: $space-5;
  display: flex;
  align-items: center;
  gap: $space-4;
  text-align: left;
  font-family: inherit;
  color: inherit;

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

  .stat-info { display: flex; flex-direction: column; }
  .stat-value { font-size: 1.6rem; font-weight: 700; color: $fg-dark; }
  .stat-label { font-size: 0.85rem; color: $ink-400; }
  .stat-sub { font-size: 0.75rem; color: $ink-400; }

  &--highlight {
    border-color: rgba($brand-orange, 0.35);
    background: rgba($brand-orange, 0.05);
    cursor: pointer;

    .stat-value { color: $brand-orange; }
  }
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

.actions-section { margin-top: $space-2; }

.actions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $space-4;
}

.action-card {
  flex: 1 1 240px;
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

  &:hover { border-color: rgba($brand-orange, 0.25); transform: translateY(-2px); }

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

    strong { font-size: 1rem; font-weight: 600; }
    span { font-size: 0.8rem; color: $ink-400; }
  }

  .action-arrow { color: $ink-500; font-size: 0.8rem; }
}

@media (prefers-reduced-motion: reduce) {
  .action-card { transition: none; }
  .action-card:hover { transform: none; }
}
</style>
