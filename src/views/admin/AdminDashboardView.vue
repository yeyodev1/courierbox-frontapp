<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminApi } from '@/services/admin.api'
import { useRouter } from 'vue-router'

const router = useRouter()

interface ResumenData {
  totalPayments: number
  recentPayments: number
  pendingPayments: number
  totalUsers: number
  totalPaquetesPendientes: number
  totalFacturas: number
}

const resumen = ref<ResumenData>({
  totalPayments: 0, recentPayments: 0, pendingPayments: 0,
  totalUsers: 0, totalPaquetesPendientes: 0, totalFacturas: 0,
})

onMounted(async () => {
  try {
    const [payData, usersData] = await Promise.all([
      adminApi.getPayments(),
      adminApi.getUsers(),
    ])
    const payments = payData.payments || []
    const users = usersData.users || []
    resumen.value = {
      totalPayments: payments.length,
      recentPayments: payments.filter((p: any) => new Date(p.createdAt) > new Date(Date.now() - 7 * 86400000)).length,
      pendingPayments: payments.filter((p: any) => p.status === 'pending' || p.status === 'waiting').length,
      totalUsers: users.length,
      totalPaquetesPendientes: 0,
      totalFacturas: 0,
    }
    try {
      const etlData = await adminApi.getData('v1/etl/pendientes')
      resumen.value.totalPaquetesPendientes = etlData.paquetes?.length || 0
    } catch { /* empty */ }
    try {
      const concData = await adminApi.getData('v1/conciliacion/resumen')
      resumen.value.totalFacturas = concData.resumen?.total || 0
    } catch { /* empty */ }
  } catch { /* empty */ }
})
</script>

<template>
  <div class="page-content">
    <div class="stats-grid" role="list">
      <div class="stat-card" role="listitem" aria-label="Links de pago totales">
        <div class="stat-icon purple"><i class="fa-solid fa-link" aria-hidden="true" /></div>
        <div class="stat-info">
          <span class="stat-value">{{ resumen.totalPayments }}</span>
          <span class="stat-label">Links de Pago</span>
        </div>
        <div class="stat-trend up">
          <i class="fa-solid fa-arrow-up" aria-hidden="true" /> {{ resumen.recentPayments }} esta semana
        </div>
      </div>
      <div class="stat-card" role="listitem" aria-label="Pagos pendientes">
        <div class="stat-icon orange"><i class="fa-solid fa-clock" aria-hidden="true" /></div>
        <div class="stat-info">
          <span class="stat-value">{{ resumen.pendingPayments }}</span>
          <span class="stat-label">Pendientes</span>
        </div>
      </div>
      <div class="stat-card" role="listitem" aria-label="Usuarios registrados">
        <div class="stat-icon green"><i class="fa-solid fa-users" aria-hidden="true" /></div>
        <div class="stat-info">
          <span class="stat-value">{{ resumen.totalUsers }}</span>
          <span class="stat-label">Usuarios Registrados</span>
        </div>
      </div>
      <div class="stat-card" role="listitem" aria-label="Paquetes pendientes">
        <div class="stat-icon blue"><i class="fa-solid fa-box" aria-hidden="true" /></div>
        <div class="stat-info">
          <span class="stat-value">{{ resumen.totalPaquetesPendientes }}</span>
          <span class="stat-label">Paquetes Pendientes</span>
        </div>
      </div>
    </div>

    <div class="quick-grid">
      <section class="content-card full" aria-label="Acceso rápido">
        <div class="card-head">
          <h3><i class="fa-solid fa-bolt" aria-hidden="true" /> Acceso Rápido</h3>
        </div>
        <div class="quick-actions">
          <button class="qa-btn" @click="router.push('/admin/payments')" aria-label="Ir a Links de Pago">
            <span class="qa-icon"><i class="fa-solid fa-plus" aria-hidden="true" /></span>
            <span>Nuevo Link de Pago</span>
          </button>
          <button class="qa-btn" @click="router.push('/admin/users')" aria-label="Ir a Usuarios">
            <span class="qa-icon"><i class="fa-solid fa-user-plus" aria-hidden="true" /></span>
            <span>Registrar Usuario</span>
          </button>
          <button class="qa-btn" @click="router.push('/admin/conciliacion')" aria-label="Ir a Conciliación Bancaria">
            <span class="qa-icon"><i class="fa-solid fa-file-invoice" aria-hidden="true" /></span>
            <span>Conciliación Bancaria</span>
          </button>
          <button class="qa-btn" @click="router.push('/admin/metrics')" aria-label="Ir a Métricas GHL">
            <span class="qa-icon"><i class="fa-solid fa-chart-line" aria-hidden="true" /></span>
            <span>Métricas GHL</span>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: $space-4;
  margin-bottom: $space-6;
}

.stat-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 16px;
  padding: $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-3;
  transition: all 0.2s;

  &:hover {
    border-color: rgba($ink-400, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  }

  .stat-icon {
    width: 40px; height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;

    &.purple { background: rgba($signal-blue, 0.12); color: #6db6ff; }
    &.orange { background: rgba($brand-orange, 0.12); color: $brand-orange; }
    &.green { background: rgba($signal-green, 0.12); color: $signal-green; }
    &.blue { background: rgba($signal-blue, 0.12); color: #60a5fa; }
  }

  .stat-info {
    .stat-value { display: block; font-size: 2rem; font-weight: 700; line-height: 1; }
    .stat-label { font-size: 0.8rem; color: $ink-400; margin-top: 4px; }
  }

  .stat-trend {
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 4px;
    &.up { color: $signal-green; }
    i { font-size: 0.6rem; }
  }
}

.quick-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-6;
}

.content-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 16px;
  padding: $space-6;

  &.full { grid-column: 1 / -1; }

  .card-head {
    display: flex;
    align-items: center;
    gap: $space-3;
    margin-bottom: $space-5;
    padding-bottom: $space-4;
    border-bottom: 1px solid rgba($ink-500, 0.08);

    h3 {
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
      display: flex;
      align-items: center;
      gap: $space-2;
      i { color: $brand-orange; font-size: 0.9rem; }
    }
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: $space-4;

  .qa-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-3;
    padding: $space-6 $space-4;
    background: rgba($ink-800, 0.3);
    border: 1px solid rgba($ink-500, 0.1);
    border-radius: 14px;
    color: $fg-dark;
    cursor: pointer;
    transition: all 0.25s ease;
    font-size: 0.85rem;
    font-weight: 500;
    font-family: inherit;

    &:focus-visible {
      outline: 2px solid $brand-orange;
      outline-offset: 2px;
    }

    .qa-icon {
      width: 44px; height: 44px;
      background: rgba($brand-orange, 0.1);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      color: $brand-orange;
      transition: all 0.25s;
    }

    &:hover {
      background: rgba($ink-700, 0.4);
      border-color: rgba($brand-orange, 0.2);
      transform: translateY(-2px);
      .qa-icon { background: rgba($brand-orange, 0.2); }
    }
  }
}
</style>
