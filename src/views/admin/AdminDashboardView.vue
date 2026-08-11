<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { adminApi } from '@/services/admin.api'
import { costosApi } from '@/services/costos.api'
import { gestionesCompraAPI } from '@/services/gestiones_compra.api'
import {
  AdminDashboardActivityPanel,
  AdminDashboardFinancePanel,
  AdminDashboardGestionCompraPanel,
  AdminDashboardHero,
  AdminDashboardKpiPanel,
  AdminDashboardQuickActions,
  AdminDashboardSkeleton,
} from './AdminDashboard/components'
import type { OperationalStat } from './AdminDashboard/components/AdminDashboardActivityPanel.vue'
import { formatCount as formatCompact, formatCurrency } from '@/utils/format'

const router = useRouter()
const pageLoading = ref(true)

/**
 * Every figure is nullable and every request fills its own field. A failed call
 * leaves null, which renders as "—". The previous version swallowed each error
 * and left the field at 0, so an API that was down looked exactly like a day
 * with no gastos and no facturas — the one reading a finance panel can least
 * afford to get wrong.
 */
type Metric = number | null

interface ResumenData {
  totalPayments: Metric
  recentPayments: Metric
  pendingPayments: Metric
  totalUsers: Metric
  totalPaquetesPendientes: Metric
  totalFacturas: Metric
  totalGastos: Metric
  gestionesMes: Metric
  gestionesValorMes: Metric
  gestionesComisionMes: Metric
  gestionesCostoMes: Metric
  gestionesMargenMes: Metric
}

interface KpiCard {
  label: string
  value: string
  detail: string
  icon: string
  tone: 'purple' | 'orange' | 'green' | 'blue' | 'teal' | 'red'
  route?: string
}

interface QuickAction {
  label: string
  icon: string
  route: string
  badge: string
  note: string
}

const resumen = ref<ResumenData>({
  totalPayments: null,
  recentPayments: null,
  pendingPayments: null,
  totalUsers: null,
  totalPaquetesPendientes: null,
  totalFacturas: null,
  totalGastos: null,
  gestionesMes: null,
  gestionesValorMes: null,
  gestionesComisionMes: null,
  gestionesCostoMes: null,
  gestionesMargenMes: null,
})

/** How many of the panel's sources came back empty-handed. */
const fallos = ref(0)

/**
 * Gestiones de compra get a dedicated panel below with valor, comisión, costo
 * and margen, so they are deliberately absent here — repeating them as two more
 * cards was most of what made the strip feel like noise.
 */
const kpiCards = computed<KpiCard[]>(() => ([
  { label: 'Links de Pago', value: formatCompact(resumen.value.totalPayments), detail: `${formatCompact(resumen.value.recentPayments)} esta semana`, icon: 'fa-link', tone: 'purple', route: '/admin/payments' },
  { label: 'Pendientes', value: formatCompact(resumen.value.pendingPayments), detail: 'Pagos en espera', icon: 'fa-clock', tone: 'orange', route: '/admin/payments' },
  { label: 'Usuarios', value: formatCompact(resumen.value.totalUsers), detail: 'Cuentas activas', icon: 'fa-users', tone: 'green', route: '/admin/users' },
  { label: 'Facturas', value: formatCompact(resumen.value.totalFacturas), detail: 'Por conciliar', icon: 'fa-file-invoice', tone: 'blue', route: '/admin/conciliacion' },
  { label: 'Gastos', value: formatCurrency(resumen.value.totalGastos), detail: 'Costo acumulado', icon: 'fa-receipt', tone: 'red', route: '/admin/costos' },
]))

const operationalStats = computed<OperationalStat[]>(() => ([
  {
    label: 'Pagos sin cobrar',
    value: resumen.value.pendingPayments,
    of: resumen.value.totalPayments ?? undefined,
    hint: 'de los links emitidos siguen en espera',
    tone: 'orange',
    route: '/admin/payments',
  },
  {
    label: 'Paquetes sin homologar',
    value: resumen.value.totalPaquetesPendientes,
    hint: 'sin dueño asignado: no se pueden facturar ni entregar en counter',
    tone: 'blue',
    alert: (resumen.value.totalPaquetesPendientes ?? 0) > 0,
    route: '/admin/homologacion',
  },
  {
    label: 'Facturas por conciliar',
    value: resumen.value.totalFacturas,
    hint: 'pendientes de cruzar contra el banco',
    tone: 'teal',
    route: '/admin/conciliacion',
  },
  {
    label: 'Usuarios con acceso',
    value: resumen.value.totalUsers,
    hint: 'cuentas que pueden entrar al panel',
    tone: 'green',
    route: '/admin/users',
  },
]))

const quickActions = computed<QuickAction[]>(() => ([
  { label: 'Gestiones de Compra', icon: 'fa-bag-shopping', route: '/admin/gestiones-compra', badge: formatCompact(resumen.value.gestionesMes), note: `${formatCurrency(resumen.value.gestionesMargenMes)} margen neto` },
  { label: 'Nuevo Link de Pago', icon: 'fa-plus', route: '/admin/payments', badge: formatCompact(resumen.value.totalPayments), note: 'Links activos' },
  { label: 'Registrar Usuario', icon: 'fa-user-plus', route: '/admin/users', badge: formatCompact(resumen.value.totalUsers), note: 'Usuarios totales' },
  { label: 'Conciliación', icon: 'fa-file-invoice', route: '/admin/conciliacion', badge: formatCompact(resumen.value.totalFacturas), note: 'Facturas por revisar' },
  { label: 'Gastos', icon: 'fa-receipt', route: '/admin/costos', badge: formatCurrency(resumen.value.totalGastos), note: 'Monto acumulado' },
]))

/** Runs one source, records a failure instead of quietly writing a zero. */
async function cargar(fn: () => Promise<void>) {
  try {
    await fn()
  } catch {
    fallos.value += 1
  }
}

onMounted(async () => {
  await Promise.all([
    cargar(async () => {
      const payData = await adminApi.getPayments()
      const payments = payData.payments || []
      const semana = Date.now() - 7 * 86400000
      resumen.value.totalPayments = payments.length
      resumen.value.recentPayments = payments.filter((p: any) => new Date(p.createdAt).getTime() > semana).length
      resumen.value.pendingPayments = payments.filter((p: any) => p.status === 'pending' || p.status === 'waiting').length
    }),
    cargar(async () => {
      const usersData = await adminApi.getUsers()
      resumen.value.totalUsers = (usersData.users || []).length
    }),
    cargar(async () => {
      const etlData = await adminApi.getData('v1/etl/pendientes')
      resumen.value.totalPaquetesPendientes = etlData.paquetes?.length || 0
    }),
    cargar(async () => {
      const concData = await adminApi.getData('v1/conciliacion/resumen')
      resumen.value.totalFacturas = concData.resumen?.total || 0
    }),
    cargar(async () => {
      const costosData = await costosApi.resumen()
      resumen.value.totalGastos = costosData.resumen?.total?.total || 0
    }),
    cargar(async () => {
      const now = new Date()
      const gcStats = await gestionesCompraAPI.getStatsMensuales({ año: now.getFullYear(), mes: now.getMonth() + 1 })
      resumen.value.gestionesMes = gcStats.totalGestiones
      resumen.value.gestionesValorMes = gcStats.sumaValorTotal
      resumen.value.gestionesComisionMes = gcStats.sumaComision
      resumen.value.gestionesCostoMes = gcStats.sumaCostoVenta
      resumen.value.gestionesMargenMes = (gcStats as any).sumaMargenNeto ?? 0
    }),
  ])
  pageLoading.value = false
})
</script>

<template>
  <div class="page-content dashboard-shell">
    <AdminDashboardSkeleton v-if="pageLoading" />
    <template v-else>
      <p v-if="fallos > 0" class="load-warning" role="status">
        <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" />
        {{ fallos === 1 ? 'Un dato del panel' : `${fallos} datos del panel` }}
        no se pudo cargar y aparece como «—». El resto sí está al día.
      </p>

      <AdminDashboardHero
        :total-payments="resumen.totalPayments"
        :pending-payments="resumen.pendingPayments"
        :total-gastos="resumen.totalGastos"
      />

      <section class="panel-row">
        <AdminDashboardKpiPanel :cards="kpiCards" @navigate="router.push" />
        <AdminDashboardQuickActions :actions="quickActions" @navigate="router.push" />
      </section>

      <section class="panel-row">
        <AdminDashboardGestionCompraPanel
          :total-gestiones="resumen.gestionesMes"
          :valor-total="resumen.gestionesValorMes"
          :comision="resumen.gestionesComisionMes"
          :costo-venta="resumen.gestionesCostoMes"
          :margen-neto="resumen.gestionesMargenMes"
          @navigate="router.push('/admin/gestiones-compra')"
        />
        <AdminDashboardFinancePanel
          :total-gastos="resumen.totalGastos"
          :recent-payments="resumen.recentPayments"
          :total-facturas="resumen.totalFacturas"
        />
      </section>

      <section class="panel-row">
        <AdminDashboardActivityPanel :stats="operationalStats" @navigate="router.push" />
      </section>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.dashboard-shell {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  width: 100%;
  max-width: 1380px;
  margin: 0 auto;
  min-height: auto;
  justify-content: flex-start;
  padding: $space-3 $space-4;
  box-sizing: border-box;
}

.load-warning {
  display: flex;
  align-items: center;
  gap: $space-3;
  margin: 0;
  padding: $space-3 $space-4;
  border-radius: 12px;
  font-size: 0.85rem;
  color: $brand-orange;
  background: rgba($brand-orange, 0.08);
  border: 1px solid rgba($brand-orange, 0.22);
}

.panel-row {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  align-items: flex-start;
  width: 100%;
}

.panel-row > * {
  width: 100%;
}

@media (min-width: 860px) {
  .panel-row {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

@media (max-width: 640px) {
  .dashboard-shell {
    width: 100%;
    padding: $space-4;
  }
}
</style>
