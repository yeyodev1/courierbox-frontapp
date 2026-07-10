<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Mis Gestiones de Compra</h1>
        <p class="page-sub">Gestiones del mes: <strong class="orange">${{ stats.sumaValorTotal.toFixed(2) }}</strong> en {{ stats.totalGestiones }} operaciones</p>
      </div>
      <AppButton variant="primary" @click="$router.push('/asesor/gestiones-compra/nueva')">
        + Nueva gestión
      </AppButton>
    </div>

    <!-- KPI personal -->
    <div class="kpi-row">
      <div class="kpi-card">
        <span class="kpi-label">Gestiones este mes</span>
        <span class="kpi-value">{{ stats.totalGestiones }}</span>
      </div>
      <div class="kpi-card kpi-highlight">
        <span class="kpi-label">Total gestionado</span>
        <span class="kpi-value">${{ stats.sumaValorTotal.toFixed(2) }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Mis comisiones</span>
        <span class="kpi-value">${{ stats.sumaComision.toFixed(2) }}</span>
      </div>
    </div>

    <!-- Filtro estado -->
    <div class="filters-bar">
      <div class="filter-pills">
        <button
          v-for="opt in estadoOptions"
          :key="opt.value"
          class="pill"
          :class="{ active: filters.estado === opt.value }"
          @click="setEstado(opt.value)"
        >{{ opt.label }}</button>
      </div>
    </div>

    <!-- Lista -->
    <div v-if="loading" class="skeleton-list">
      <div v-for="i in 4" :key="i" class="skeleton-item"></div>
    </div>
    <div v-else class="gestion-list">
      <div
        v-for="g in gestiones"
        :key="g._id"
        class="gestion-card"
        @click="$router.push(`/asesor/gestiones-compra/${g._id}`)"
      >
        <div class="card-left">
          <span class="client-name">{{ clienteNombre(g) }}</span>
          <span class="pagina muted">{{ g.paginaCompra }}</span>
          <span class="fecha muted">Entrega: {{ formatDate(g.fechaEntregaTentativa) }}</span>
        </div>
        <div class="card-right">
          <span class="amount">${{ g.valorTotal.toFixed(2) }}</span>
          <span class="estado-badge" :class="`estado-${g.estado}`">{{ estadoLabel(g.estado) }}</span>
          <span v-if="g.imagenCompraUrl" class="has-img"><i class="fa-regular fa-image" aria-hidden="true" /></span>
        </div>
      </div>
      <div v-if="!gestiones.length" class="empty-state">
        <p>No tienes gestiones de compra {{ filters.estado ? `con estado "${filters.estado}"` : 'aún' }}.</p>
        <AppButton variant="primary" @click="$router.push('/asesor/gestiones-compra/nueva')">Crear primera gestión</AppButton>
      </div>
    </div>

    <!-- Paginación -->
    <div class="pagination" v-if="pages > 1">
      <AppButton variant="outline" :disabled="page <= 1" @click="changePage(page - 1)">‹</AppButton>
      <span class="page-info">{{ page }} / {{ pages }}</span>
      <AppButton variant="outline" :disabled="page >= pages" @click="changePage(page + 1)">›</AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import { gestionesCompraAPI } from '@/services/gestiones_compra.api'
import type { GestionCompra, GestionesStats } from '@/services/gestiones_compra.api'

const gestiones = ref<GestionCompra[]>([])
const stats = ref<GestionesStats>({ totalGestiones: 0, sumaValorTotal: 0, sumaComision: 0, sumaCostoVenta: 0, porEstado: {} })
const loading = ref(true)
const page = ref(1)
const pages = ref(1)
const filters = ref({ estado: '' })

const estadoOptions = [
  { value: '', label: 'Todas' },
  { value: 'borrador', label: 'Borrador' },
  { value: 'activa', label: 'Activa' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado', label: 'Cancelado' },
]

function estadoLabel(e: string) {
  return { borrador: 'Borrador', activa: 'Activa', completado: 'Completado', cancelado: 'Cancelado' }[e] ?? e
}

function clienteNombre(g: GestionCompra) {
  return typeof g.contactoId === 'object' ? (g.contactoId as any).nombre : '—'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function load() {
  loading.value = true
  try {
    const result = await gestionesCompraAPI.list({
      page: page.value, limit: 20,
      estado: filters.value.estado || undefined,
    })
    gestiones.value = result.gestiones
    pages.value = result.pages
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  const now = new Date()
  stats.value = await gestionesCompraAPI.getStatsMensuales({ año: now.getFullYear(), mes: now.getMonth() + 1 })
}

function setEstado(estado: string) {
  filters.value.estado = estado
  page.value = 1
  load()
}

function changePage(p: number) {
  page.value = p
  load()
}

onMounted(() => { load(); loadStats() })
</script>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
.page { display: flex; flex-direction: column; gap: $space-5; padding: $space-5; max-width: 900px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: $space-3; }
.page-title { color: $fg-dark; font-size: 1.4rem; font-weight: 700; margin: 0; }
.page-sub { color: $ink-300; font-size: 0.88rem; margin: $space-1 0 0; }
.orange { color: $brand-orange; }

.kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: $space-3; }
.kpi-card {
  background: $ink-900; border: 1px solid $ink-500; border-radius: 12px;
  padding: $space-4; display: flex; flex-direction: column; gap: $space-1;
  &.kpi-highlight { border-color: $brand-orange; background: rgba(240,138,31,0.06); }
}
.kpi-label { font-size: 0.72rem; color: $ink-300; font-weight: 600; text-transform: uppercase; }
.kpi-value { font-size: 1.5rem; font-weight: 800; color: $fg-dark; }
.kpi-highlight .kpi-value { color: $brand-orange; }

.filters-bar { }
.filter-pills { display: flex; flex-wrap: wrap; gap: $space-2; }
.pill {
  padding: $space-1 $space-4; border-radius: 20px; font-size: 0.82rem;
  background: $ink-700; border: 1px solid $ink-500; color: $ink-300; cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: $ink-300; color: $fg-dark; }
  &.active { background: rgba(240,138,31,0.15); border-color: $brand-orange; color: $fg-dark; font-weight: 600; }
}

.gestion-list { display: flex; flex-direction: column; gap: $space-2; }
.gestion-card {
  display: flex; align-items: center; justify-content: space-between; gap: $space-4;
  padding: $space-4 $space-5; background: $ink-900; border: 1px solid $ink-500;
  border-radius: 12px; cursor: pointer; transition: all 0.18s;
  &:hover { border-color: $brand-orange; background: rgba(240,138,31,0.04); }
}
.card-left { display: flex; flex-direction: column; gap: 2px; }
.card-right { display: flex; align-items: center; gap: $space-3; flex-shrink: 0; }
.client-name { font-weight: 600; color: $fg-dark; }
.pagina { font-size: 0.82rem; }
.fecha { font-size: 0.78rem; }
.muted { color: $ink-400; }
.amount { font-size: 1.1rem; font-weight: 700; color: $brand-orange; }
.has-img { font-size: 1rem; }

.estado-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
}
.estado-activa { background: rgba(43,187,146,0.15); color: $signal-green; }
.estado-borrador { background: rgba(111,111,122,0.2); color: $ink-300; }
.estado-completado { background: rgba(43,187,146,0.25); color: $signal-green; }
.estado-cancelado { background: rgba(229,72,77,0.15); color: $signal-red; }

.skeleton-list { display: flex; flex-direction: column; gap: $space-2; }
.skeleton-item { height: 80px; background: $ink-700; border-radius: 12px; animation: pulse 1.4s infinite; }
.empty-state { text-align: center; padding: $space-8; color: $ink-400; display: flex; flex-direction: column; gap: $space-4; align-items: center; }
.pagination { display: flex; align-items: center; justify-content: center; gap: $space-3; }
.page-info { color: $ink-300; font-size: 0.85rem; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>
