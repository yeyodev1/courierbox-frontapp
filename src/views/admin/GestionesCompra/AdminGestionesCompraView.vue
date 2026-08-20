<script setup lang="ts">
/** All purchase gestiones across the team: KPIs, filters, table and export. */
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import GestionesTable from './GestionesTable.vue'
import { ESTADO_OPTIONS, MES_OPTIONS, useGestionesCompra } from './useGestionesCompra'

const router = useRouter()
const g = useGestionesCompra()

const nueva = () => router.push('/admin/gestiones-compra/nueva')

onMounted(g.load)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">Gestiones de Compra</h1>
        <p class="page-sub">Administra todas las gestiones del equipo</p>
      </div>
      <div class="header-actions">
        <AppButton variant="outline" :disabled="g.exportLoading.value" @click="g.exportar('excel')">
          <i class="fa-solid fa-file-excel" /> Excel
        </AppButton>
        <AppButton variant="outline" :disabled="g.exportLoading.value" @click="g.exportar('pdf')">
          <i class="fa-solid fa-file-pdf" /> PDF
        </AppButton>
        <AppButton variant="primary" @click="nueva">+ Nueva gestión</AppButton>
      </div>
    </div>

    <div v-if="!g.statsLoading.value" class="kpi-row">
      <div class="kpi-card">
        <span class="kpi-label">Gestiones este mes</span>
        <span class="kpi-value">{{ g.stats.value.totalGestiones }}</span>
      </div>
      <div class="kpi-card kpi-highlight">
        <span class="kpi-label">Total gestionado</span>
        <span class="kpi-value">${{ g.stats.value.sumaValorTotal.toFixed(2) }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Comisiones del mes</span>
        <span class="kpi-value">${{ g.stats.value.sumaComision.toFixed(2) }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Costo de ventas</span>
        <span class="kpi-value">${{ g.stats.value.sumaCostoVenta.toFixed(2) }}</span>
      </div>
      <div class="kpi-card kpi-success">
        <span class="kpi-label">Margen neto</span>
        <span class="kpi-value">${{ g.stats.value.sumaMargenNeto?.toFixed(2) ?? '0.00' }}</span>
        <small class="kpi-hint">Valor total − comisión − costo de venta</small>
      </div>
    </div>
    <div v-else class="kpi-row">
      <div v-for="i in 5" :key="i" class="kpi-skeleton" />
    </div>

    <div class="filters-bar">
      <div class="filter-group filter-group--search">
        <label>Cliente</label>
        <AppInput
          v-model="g.filters.value.q"
          type="search"
          placeholder="Nombre, email, teléfono o cédula"
          @keyup.enter="g.applyFilters"
        />
      </div>
      <div class="filter-group">
        <label>Asesor</label>
        <AppSelect
          v-model="g.filters.value.asesorId"
          :options="[{ value: '', label: 'Todos los asesores' }, ...g.asesorOptions.value]"
          placeholder="Asesor"
        />
      </div>
      <div class="filter-group">
        <label>Estado</label>
        <AppSelect v-model="g.filters.value.estado" :options="ESTADO_OPTIONS" placeholder="Estado" />
      </div>
      <div class="filter-group">
        <label>Mes</label>
        <AppSelect v-model="g.filters.value.mes" :options="MES_OPTIONS" placeholder="Mes" />
      </div>
      <div class="filter-group">
        <label>Año</label>
        <AppSelect v-model="g.filters.value.año" :options="g.anioOptions" placeholder="Año" />
      </div>
      <AppButton variant="outline" @click="g.applyFilters">Filtrar</AppButton>
      <AppButton variant="ghost" @click="g.resetFilters">Limpiar</AppButton>
    </div>

    <GestionesTable
      :gestiones="g.gestiones.value"
      :loading="g.loading.value"
      @open="(id) => router.push(`/admin/gestiones-compra/${id}`)"
      @nueva="nueva"
    />

    <div v-if="g.pages.value > 1" class="pagination">
      <AppButton variant="outline" :disabled="g.page.value <= 1" @click="g.changePage(g.page.value - 1)">
        ‹ Anterior
      </AppButton>
      <span class="page-info">Página {{ g.page.value }} de {{ g.pages.value }}</span>
      <AppButton variant="outline" :disabled="g.page.value >= g.pages.value" @click="g.changePage(g.page.value + 1)">
        Siguiente ›
      </AppButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.page {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-4;
  flex-wrap: wrap;
}

.page-title { font-size: 1.5rem; font-weight: 700; margin: 0 0 $space-1; }
.page-sub { margin: 0; color: $ink-400; font-size: 0.9rem; }

.header-actions {
  display: flex;
  gap: $space-2;
  flex-wrap: wrap;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: $space-4;
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: $space-1;
  padding: $space-4;
  border-radius: 16px;
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);

  &.kpi-highlight { border-color: rgba($brand-orange, 0.3); }
  &.kpi-highlight .kpi-value { color: $brand-orange; }
  &.kpi-success { border-color: rgba($signal-green, 0.28); }
  &.kpi-success .kpi-value { color: $signal-green; }
}

.kpi-label {
  color: $ink-400;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.kpi-value { font-size: 1.6rem; font-weight: 700; }
.kpi-hint { color: $ink-500; font-size: 0.7rem; }

.kpi-skeleton {
  height: 96px;
  border-radius: 16px;
  background: $ink-800;
  animation: pulse 1.4s infinite;
}

.filters-bar {
  display: flex;
  align-items: flex-end;
  gap: $space-3;
  flex-wrap: wrap;
  padding: $space-4;
  border-radius: 16px;
  background: rgba($ink-900, 0.7);
  border: 1px solid rgba($ink-500, 0.12);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  flex: 1 1 180px;

  label { color: $ink-300; font-size: 0.78rem; font-weight: 600; }

  &--search { flex: 2 1 260px; }
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-3;
}

.page-info { color: $ink-400; font-size: 0.85rem; }

@keyframes pulse {
  0%,
  100% { opacity: 1; }
  50% { opacity: 0.55; }
}

@media (prefers-reduced-motion: reduce) {
  .kpi-skeleton { animation: none; }
}
</style>
