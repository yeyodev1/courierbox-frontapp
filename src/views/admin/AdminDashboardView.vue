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

const router = useRouter()
const pageLoading = ref(true)

interface ResumenData {
  totalPayments: number
  recentPayments: number
  pendingPayments: number
  totalUsers: number
  totalPaquetesPendientes: number
  totalFacturas: number
  totalGastos: number
  gestionesMes: number
  gestionesValorMes: number
  gestionesComisionMes: number
  gestionesCostoMes: number
  gestionesMargenMes: number
}

interface KpiCard {
  label: string
  value: string
  detail: string
  icon: string
  tone: 'purple' | 'orange' | 'green' | 'blue' | 'teal' | 'red'
}

interface QuickAction {
  label: string
  icon: string
  route: string
  badge: string
  note: string
}

interface OperationalBar {
  label: string
  value: number
  tone: 'purple' | 'orange' | 'green' | 'blue' | 'teal'
  width: number
}

const resumen = ref<ResumenData>({
  totalPayments: 0,
  recentPayments: 0,
  pendingPayments: 0,
  totalUsers: 0,
  totalPaquetesPendientes: 0,
  totalFacturas: 0,
  totalGastos: 0,
  gestionesMes: 0,
  gestionesValorMes: 0,
  gestionesComisionMes: 0,
  gestionesCostoMes: 0,
  gestionesMargenMes: 0,
})

function formatCurrency(value: number) {
  return '$' + Number(value || 0).toFixed(2)
}

function formatCompact(value: number) {
  return Number(value || 0).toLocaleString('es-EC')
}

const kpiCards = computed<KpiCard[]>(() => ([
  { label: 'Links de Pago', value: formatCompact(resumen.value.totalPayments), detail: `${resumen.value.recentPayments} esta semana`, icon: 'fa-link', tone: 'purple' },
  { label: 'Pendientes', value: formatCompact(resumen.value.pendingPayments), detail: 'Pagos en espera', icon: 'fa-clock', tone: 'orange' },
  { label: 'Usuarios', value: formatCompact(resumen.value.totalUsers), detail: 'Cuentas activas', icon: 'fa-users', tone: 'green' },
  { label: 'Gestiones del Mes', value: formatCurrency(resumen.value.gestionesValorMes), detail: `${resumen.value.gestionesMes} operaciones`, icon: 'fa-bag-shopping', tone: 'teal' },
  { label: 'Facturas', value: formatCompact(resumen.value.totalFacturas), detail: 'Conciliación', icon: 'fa-file-invoice', tone: 'blue' },
  { label: 'Gastos', value: formatCurrency(resumen.value.totalGastos), detail: 'Costo acumulado', icon: 'fa-receipt', tone: 'red' },
  { label: 'Margen Neto Gestiones', value: formatCurrency(resumen.value.gestionesMargenMes), detail: `${resumen.value.gestionesMes} gestiones · ${formatCurrency(resumen.value.gestionesValorMes)} facturado`, icon: 'fa-bag-shopping', tone: 'teal', route: '/admin/gestiones-compra' },
]))

const operationalBars = computed<OperationalBar[]>(() => {
  const items = [
    { label: 'Links de Pago', value: resumen.value.totalPayments, tone: 'purple' },
    { label: 'Pendientes', value: resumen.value.pendingPayments, tone: 'orange' },
    { label: 'Usuarios', value: resumen.value.totalUsers, tone: 'green' },
    { label: 'Paquetes', value: resumen.value.totalPaquetesPendientes, tone: 'blue' },
    { label: 'Facturas', value: resumen.value.totalFacturas, tone: 'teal' },
  ] as Array<{ label: string; value: number; tone: OperationalBar['tone'] }>

  const total = Math.max(1, items.reduce((sum, item) => sum + item.value, 0))
  return items.map((item) => ({
    ...item,
    width: item.value > 0 ? Math.max(8, Math.round((item.value / total) * 100)) : 0,
  }))
})

const quickActions = computed<QuickAction[]>(() => ([
  { label: 'Gestiones de Compra', icon: 'fa-bag-shopping', route: '/admin/gestiones-compra', badge: formatCompact(resumen.value.gestionesMes), note: `${formatCurrency(resumen.value.gestionesMargenMes)} margen neto` },
  { label: 'Nuevo Link de Pago', icon: 'fa-plus', route: '/admin/payments', badge: formatCompact(resumen.value.totalPayments), note: 'Links activos' },
  { label: 'Registrar Usuario', icon: 'fa-user-plus', route: '/admin/users', badge: formatCompact(resumen.value.totalUsers), note: 'Usuarios totales' },
  { label: 'Conciliación', icon: 'fa-file-invoice', route: '/admin/conciliacion', badge: formatCompact(resumen.value.totalFacturas), note: 'Facturas por revisar' },
  { label: 'Gastos', icon: 'fa-receipt', route: '/admin/costos', badge: formatCurrency(resumen.value.totalGastos), note: 'Monto acumulado' },
  { label: 'Métricas GHL', icon: 'fa-chart-line', route: '/admin/metrics', badge: formatCompact(resumen.value.recentPayments), note: 'Pagos recientes' },
]))

onMounted(async () => {
  try {
    const [payData, usersData] = await Promise.all([adminApi.getPayments(), adminApi.getUsers()])
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
      gestionesMes: 0,
      gestionesValorMes: 0,
      gestionesComisionMes: 0,
      gestionesCostoMes: 0,
      gestionesMargenMes: 0,
    }
    try { const etlData = await adminApi.getData('v1/etl/pendientes'); resumen.value.totalPaquetesPendientes = etlData.paquetes?.length || 0 } catch { /* empty */ }
    try { const concData = await adminApi.getData('v1/conciliacion/resumen'); resumen.value.totalFacturas = concData.resumen?.total || 0 } catch { /* empty */ }
    try { const costosData = await costosApi.resumen(); resumen.value.totalGastos = costosData.resumen?.total?.total || 0 } catch { /* empty */ }
    try {
      const now = new Date()
      const gcStats = await gestionesCompraAPI.getStatsMensuales({ año: now.getFullYear(), mes: now.getMonth() + 1 })
      resumen.value.gestionesMes = gcStats.totalGestiones
      resumen.value.gestionesValorMes = gcStats.sumaValorTotal
      resumen.value.gestionesComisionMes = gcStats.sumaComision
      resumen.value.gestionesCostoMes = gcStats.sumaCostoVenta
      resumen.value.gestionesMargenMes = (gcStats as any).sumaMargenNeto ?? 0
    } catch { /* empty */ }
  } catch { /* empty */ } finally {
    pageLoading.value = false
  }
})
</script>

<template>
  <div class="page-content dashboard-shell">
    <AdminDashboardSkeleton v-if="pageLoading" />
    <template v-else>
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
        <AdminDashboardActivityPanel :bars="operationalBars" />
      </section>
    </template>
  </div>
</template>

<style scoped lang="scss">
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
