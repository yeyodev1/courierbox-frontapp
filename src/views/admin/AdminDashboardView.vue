<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { adminApi } from '@/services/admin.api'
import { costosApi } from '@/services/costos.api'

const router = useRouter()

interface ResumenData {
  totalPayments: number
  recentPayments: number
  pendingPayments: number
  totalUsers: number
  totalPaquetesPendientes: number
  totalFacturas: number
  totalGastos: number
}

const resumen = ref<ResumenData>({
  totalPayments: 0,
  recentPayments: 0,
  pendingPayments: 0,
  totalUsers: 0,
  totalPaquetesPendientes: 0,
  totalFacturas: 0,
  totalGastos: 0,
})

function formatCurrency(value: number) {
  return '$' + Number(value || 0).toFixed(2)
}

function formatCompact(value: number) {
  return Number(value || 0).toLocaleString('es-EC')
}

const kpiCards = computed(() => ([
  {
    label: 'Links de Pago',
    value: formatCompact(resumen.value.totalPayments),
    detail: `${resumen.value.recentPayments} esta semana`,
    icon: 'fa-link',
    tone: 'purple',
  },
  {
    label: 'Pendientes',
    value: formatCompact(resumen.value.pendingPayments),
    detail: 'Pagos en espera',
    icon: 'fa-clock',
    tone: 'orange',
  },
  {
    label: 'Usuarios',
    value: formatCompact(resumen.value.totalUsers),
    detail: 'Cuentas activas',
    icon: 'fa-users',
    tone: 'green',
  },
  {
    label: 'Paquetes',
    value: formatCompact(resumen.value.totalPaquetesPendientes),
    detail: 'Pendientes ETL',
    icon: 'fa-box',
    tone: 'blue',
  },
  {
    label: 'Facturas',
    value: formatCompact(resumen.value.totalFacturas),
    detail: 'Conciliación',
    icon: 'fa-file-invoice',
    tone: 'teal',
  },
  {
    label: 'Gastos',
    value: formatCurrency(resumen.value.totalGastos),
    detail: 'Costo acumulado',
    icon: 'fa-receipt',
    tone: 'red',
  },
]))

const operationalBars = computed(() => {
  const items = [
    { label: 'Links de Pago', value: resumen.value.totalPayments, tone: 'purple' },
    { label: 'Pendientes', value: resumen.value.pendingPayments, tone: 'orange' },
    { label: 'Usuarios', value: resumen.value.totalUsers, tone: 'green' },
    { label: 'Paquetes', value: resumen.value.totalPaquetesPendientes, tone: 'blue' },
    { label: 'Facturas', value: resumen.value.totalFacturas, tone: 'teal' },
  ]
  const total = Math.max(1, items.reduce((sum, item) => sum + item.value, 0))
  return items.map((item) => ({
    ...item,
    width: item.value > 0 ? Math.max(8, Math.round((item.value / total) * 100)) : 0,
  }))
})

const quickActions = computed(() => ([
  {
    label: 'Nuevo Link de Pago',
    icon: 'fa-plus',
    route: '/admin/payments',
    badge: formatCompact(resumen.value.totalPayments),
    note: 'Links activos',
  },
  {
    label: 'Registrar Usuario',
    icon: 'fa-user-plus',
    route: '/admin/users',
    badge: formatCompact(resumen.value.totalUsers),
    note: 'Usuarios totales',
  },
  {
    label: 'Conciliación',
    icon: 'fa-file-invoice',
    route: '/admin/conciliacion',
    badge: formatCompact(resumen.value.totalFacturas),
    note: 'Facturas por revisar',
  },
  {
    label: 'Gastos',
    icon: 'fa-receipt',
    route: '/admin/costos',
    badge: formatCurrency(resumen.value.totalGastos),
    note: 'Monto acumulado',
  },
  {
    label: 'Métricas GHL',
    icon: 'fa-chart-line',
    route: '/admin/metrics',
    badge: formatCompact(resumen.value.recentPayments),
    note: 'Pagos recientes',
  },
]))

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
      totalGastos: 0,
    }
    try {
      const etlData = await adminApi.getData('v1/etl/pendientes')
      resumen.value.totalPaquetesPendientes = etlData.paquetes?.length || 0
    } catch { /* empty */ }
    try {
      const concData = await adminApi.getData('v1/conciliacion/resumen')
      resumen.value.totalFacturas = concData.resumen?.total || 0
    } catch { /* empty */ }
    try {
      const costosData = await costosApi.resumen()
      resumen.value.totalGastos = costosData.resumen?.total?.total || 0
    } catch { /* empty */ }
  } catch { /* empty */ }
})
</script>

<template>
  <div class="page-content dashboard-shell">
    <section class="hero-panel">
      <div class="hero-copy">
        <span class="eyebrow">Panel administrativo</span>
        <h1>Operación, pagos y gastos en un solo lugar</h1>
        <p>Revisión rápida de actividad, costos y accesos directos con datos reales.</p>
      </div>
      <div class="hero-meta">
        <div class="hero-chip"><strong>{{ resumen.totalPayments }}</strong><span>links</span></div>
        <div class="hero-chip"><strong>{{ resumen.pendingPayments }}</strong><span>pendientes</span></div>
        <div class="hero-chip"><strong>{{ formatCurrency(resumen.totalGastos) }}</strong><span>gastos</span></div>
      </div>
    </section>

    <section class="panel-row">
      <section class="panel panel-main kpi-panel" aria-label="Resumen visual">
        <div class="card-head">
          <h3><i class="fa-solid fa-chart-column" aria-hidden="true" /> Resumen visual</h3>
          <span class="card-subtitle">Comparativa operativa</span>
        </div>
        <div class="kpi-strip">
          <article v-for="card in kpiCards" :key="card.label" class="stat-card" :aria-label="card.label">
            <div class="stat-icon" :class="card.tone"><i class="fa-solid" :class="card.icon" aria-hidden="true" /></div>
            <div class="stat-info">
              <span class="stat-value">{{ card.value }}</span>
              <span class="stat-label">{{ card.label }}</span>
              <small class="stat-note">{{ card.detail }}</small>
            </div>
          </article>
        </div>
      </section>

      <section class="panel panel-side quick-panel" aria-label="Acceso rápido">
        <div class="card-head">
          <h3><i class="fa-solid fa-bolt" aria-hidden="true" /> Acceso rápido</h3>
          <span class="card-subtitle">Atajos con datos</span>
        </div>
        <div class="quick-actions">
          <button v-for="action in quickActions" :key="action.route" class="qa-btn" @click="router.push(action.route)" :aria-label="`Ir a ${action.label}`">
            <span class="qa-icon"><i class="fa-solid" :class="action.icon" aria-hidden="true" /></span>
            <span class="qa-label">{{ action.label }}</span>
            <span class="qa-badge">{{ action.badge }}</span>
            <small class="qa-note">{{ action.note }}</small>
          </button>
        </div>
      </section>
    </section>

    <section class="panel-row">
      <section class="panel panel-main activity-panel" aria-label="Actividad operativa">
        <div class="card-head">
          <h3><i class="fa-solid fa-chart-simple" aria-hidden="true" /> Actividad operativa</h3>
          <span class="card-subtitle">Barras comparativas</span>
        </div>
        <div class="chart-list">
          <div v-for="item in operationalBars" :key="item.label" class="chart-row" :class="{ 'is-zero': item.value <= 0 }">
            <div class="chart-row-head">
              <span>{{ item.label }}</span>
              <strong>{{ formatCompact(item.value) }}</strong>
            </div>
            <div v-if="item.value > 0" class="chart-track">
              <div class="chart-bar" :class="item.tone" :style="{ width: `${item.width}%` }" />
            </div>
            <div v-else class="chart-zero">Sin actividad</div>
          </div>
        </div>
      </section>

      <section class="panel panel-side" aria-label="Finanzas">
        <div class="card-head">
          <h3><i class="fa-solid fa-sack-dollar" aria-hidden="true" /> Finanzas</h3>
          <span class="card-subtitle">Costo acumulado</span>
        </div>
        <div class="finance-box">
          <span class="finance-label">Gastos totales</span>
          <strong>{{ formatCurrency(resumen.totalGastos) }}</strong>
          <p>Este valor alimenta la vista general y coincide con el módulo de costos.</p>
        </div>
        <div class="mini-stack">
          <div class="mini-row">
            <span>Pagos recientes</span>
            <strong>{{ resumen.recentPayments }}</strong>
          </div>
          <div class="mini-row">
            <span>Facturas en conciliación</span>
            <strong>{{ resumen.totalFacturas }}</strong>
          </div>
        </div>
      </section>
    </section>
  </div>
</template>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.dashboard-shell {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  width: min(1380px, 100%);
  margin: 0 auto;
  min-height: auto;
  justify-content: flex-start;
  padding-block: $space-3;
}

.hero-panel,
.panel-row,
.panel,
.kpi-strip,
.quick-actions,
.chart-list,
.chart-row,
.chart-row-head,
.chart-track,
.hero-meta,
.hero-chip,
.mini-stack,
.mini-row {
  display: flex;
}

.hero-panel {
  flex-direction: column;
  gap: $space-3;
  padding: $space-5;
  border-radius: 20px;
  border: 1px solid rgba($ink-500, 0.12);
  background: linear-gradient(135deg, rgba($ink-900, 0.98), rgba($ink-800, 0.82));
  align-items: center;
  text-align: center;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  align-items: center;

  .eyebrow {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: $brand-orange;
    font-weight: 700;
  }

  h1 {
    margin: 0;
    font-size: clamp(1.6rem, 3vw, 2.35rem);
    line-height: 1.05;
  }

  p {
    margin: 0;
    max-width: 58ch;
    color: $ink-300;
  }
}

.hero-meta {
  flex-wrap: wrap;
  gap: $space-3;
  justify-content: center;
}

.hero-chip {
  flex-direction: column;
  gap: 2px;
  min-width: 120px;
  padding: $space-3 $space-4;
  border-radius: 14px;
  background: rgba($ink-700, 0.45);
  border: 1px solid rgba($ink-500, 0.12);

  strong {
    font-size: 1.1rem;
  }

  span {
    font-size: 0.75rem;
    color: $ink-400;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
}

.panel-row {
  flex-wrap: wrap;
  gap: $space-4;
  align-items: flex-start;
}

.panel {
  flex: 1 1 420px;
  min-width: 0;
  flex-direction: column;
  gap: $space-4;
  padding: $space-5;
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 18px;
}

.panel-main {
  flex: 2 1 640px;
}

.panel-side {
  flex: 1 1 320px;
}

.quick-panel {
  gap: $space-2;
}

.kpi-panel,
.quick-panel {
  align-self: flex-start;
}

.activity-panel {
  min-height: 0;
}

.card-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-1;
  padding-bottom: $space-3;
  border-bottom: 1px solid rgba($ink-500, 0.08);
  text-align: center;

  h3 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: $space-2;
    font-size: 1rem;
    font-weight: 700;
    justify-content: center;

    i { color: $brand-orange; }
  }

  .card-subtitle {
    font-size: 0.75rem;
    color: $ink-400;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
}

.kpi-strip {
  flex-wrap: wrap;
  gap: $space-3;
  justify-content: center;
}

.stat-card {
  display: flex;
  flex: 1 1 200px;
  min-width: 0;
  border-radius: 14px;
  padding: $space-3;
  border: 1px solid rgba($ink-500, 0.12);
  background: rgba($ink-800, 0.45);
  flex-direction: column;
  gap: $space-3;
  align-items: center;
  justify-content: center;
  text-align: center;
  transition: transform 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba($ink-400, 0.25);
  }

  .stat-icon {
    display: flex;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    font-size: 1rem;

    &.purple { background: rgba($signal-blue, 0.12); color: #6db6ff; }
    &.orange { background: rgba($brand-orange, 0.12); color: $brand-orange; }
    &.green { background: rgba($signal-green, 0.12); color: $signal-green; }
    &.blue { background: rgba($signal-blue, 0.12); color: #60a5fa; }
    &.teal { background: rgba(#14b8a6, 0.12); color: #5eead4; }
    &.red { background: rgba($signal-red, 0.12); color: #ff8a8f; }
  }

  .stat-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    align-items: center;
    justify-content: center;

    .stat-value { font-size: 1.45rem; font-weight: 800; line-height: 1.05; }
    .stat-label { font-size: 0.82rem; color: $ink-300; }
    .stat-note { font-size: 0.72rem; color: $ink-500; }
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $space-2;
  justify-content: stretch;
}

.qa-btn {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  padding: $space-3;
  border-radius: 12px;
  border: 1px solid rgba($ink-500, 0.1);
  background: rgba($ink-800, 0.35);
  color: $fg-dark;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  font-family: inherit;
  text-align: center;
  min-height: 96px;

  &:focus-visible {
    outline: 2px solid $brand-orange;
    outline-offset: 2px;
  }

  &:hover {
    transform: translateY(-2px);
    border-color: rgba($brand-orange, 0.2);
    background: rgba($ink-700, 0.45);
  }
}

.qa-icon {
  display: flex;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  align-items: center;
  justify-content: center;
  background: rgba($brand-orange, 0.12);
  color: $brand-orange;
  align-self: center;
}

.qa-label {
  font-size: 0.8rem;
  font-weight: 700;
  display: block;
  width: 100%;
}

.qa-badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: $fg-dark;
  display: block;
  width: 100%;
}

.qa-note {
  font-size: 0.68rem;
  color: $ink-400;
  display: block;
  width: 100%;
}

.chart-list,
.mini-stack {
  flex-direction: column;
  gap: $space-4;
  width: 100%;
  margin-inline: 0;
}

.activity-panel .chart-list {
  flex: 0 0 auto;
}

.chart-row {
  flex-direction: column;
  gap: $space-2;
  width: 100%;

  &.is-zero .chart-row-head strong {
    color: $ink-500;
  }
}

.activity-panel .chart-row {
  flex: 0 0 auto;
}

.chart-row-head,
.mini-row {
  justify-content: space-between;
  align-items: center;
  gap: $space-3;
}

.chart-row-head strong {
  min-width: 3rem;
  text-align: right;
}

.chart-track {
  align-items: center;
  width: 100%;
  height: 12px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba($ink-700, 0.75);
}

.chart-zero {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 12px;
  border-radius: 999px;
  color: $ink-500;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border: 1px dashed rgba($ink-500, 0.16);
  background: rgba($ink-800, 0.22);
}

.chart-bar {
  height: 100%;
  border-radius: 999px;

  &.purple { background: linear-gradient(90deg, rgba(#6db6ff, 0.65), #6db6ff); }
  &.orange { background: linear-gradient(90deg, rgba($brand-orange, 0.55), $brand-orange); }
  &.green { background: linear-gradient(90deg, rgba($signal-green, 0.55), $signal-green); }
  &.blue { background: linear-gradient(90deg, rgba(#60a5fa, 0.55), #60a5fa); }
  &.teal { background: linear-gradient(90deg, rgba(#5eead4, 0.55), #5eead4); }
}

.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: $space-2;
  min-height: 180px;
  border-radius: 16px;
  border: 1px dashed rgba($ink-500, 0.18);
  background: rgba($ink-800, 0.18);

  strong {
    font-size: 1rem;
  }

  p {
    margin: 0;
    color: $ink-400;
    font-size: 0.86rem;
  }
}

.finance-box {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding: $space-5;
  min-height: 220px;
  border-radius: 16px;
  border: 1px solid rgba($ink-500, 0.12);
  background: linear-gradient(135deg, rgba($brand-orange, 0.12), rgba($ink-800, 0.25));
  align-items: center;
  text-align: center;
  justify-content: center;

  .finance-label {
    display: block;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: $brand-orange;
    font-weight: 700;
  }

  strong {
    display: block;
    font-size: 2rem;
    line-height: 1;
  }

  p {
    margin: 0;
    color: $ink-300;
    font-size: 0.86rem;
  }
}

.mini-row {
  padding: $space-3 0;
  border-bottom: 1px solid rgba($ink-500, 0.08);
  align-items: center;
  justify-content: space-between;

  &:last-child { border-bottom: 0; }

  span { color: $ink-400; font-size: 0.85rem; }
  strong { font-size: 0.95rem; }
}

@media (max-width: 860px) {
  .panel { flex-basis: 100%; }

  .quick-actions { grid-template-columns: repeat(2, minmax(0, 1fr)); }

  .qa-btn { flex-basis: 100%; }
}

@media (max-width: 640px) {
  .hero-panel,
  .panel { padding: $space-5; }

  .dashboard-shell {
    min-height: auto;
    justify-content: flex-start;
    padding-block: $space-4;
  }

  .card-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .stat-card,
  .qa-btn { flex-basis: 100%; }

  .quick-actions { grid-template-columns: 1fr; }

  .hero-chip { flex: 1 1 100px; }
}
</style>
