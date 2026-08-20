<script setup lang="ts">
/** Bank reconciliation: verify client payments and cross them against a CSV. */
import { onMounted, ref } from 'vue'
import PagosVerificar from './Conciliacion/PagosVerificar.vue'
import CargarCsv from './Conciliacion/CargarCsv.vue'
import { useConciliacion } from './Conciliacion/useConciliacion'

const c = useConciliacion()
const activeTab = ref<'verificando' | 'csv'>('verificando')

onMounted(c.load)
</script>

<template>
  <div class="conciliacion-view">
    <header class="page-header">
      <div class="container">
        <h1>Conciliación Bancaria</h1>
        <p class="subtitle">Cruza pagos de clientes con transacciones bancarias reales</p>
      </div>
    </header>

    <div class="container content">
      <div class="resumen-grid">
        <div class="stat-card">
          <span class="stat-value">{{ c.resumen.value.pendientes }}</span>
          <span class="stat-label">Pendientes</span>
        </div>
        <div class="stat-card accent">
          <span class="stat-value">{{ c.resumen.value.verificando }}</span>
          <span class="stat-label">En Verificación</span>
        </div>
        <div class="stat-card success">
          <span class="stat-value">{{ c.resumen.value.pagadas }}</span>
          <span class="stat-label">Pagadas</span>
        </div>
      </div>

      <div class="tabs">
        <button :class="['tab-btn', { active: activeTab === 'verificando' }]" @click="activeTab = 'verificando'">
          <i class="fa-solid fa-clock" /> Pagos a Verificar ({{ c.facturas.value.length }})
        </button>
        <button :class="['tab-btn', { active: activeTab === 'csv' }]" @click="activeTab = 'csv'">
          <i class="fa-solid fa-file-csv" /> Cargar CSV Bancario
        </button>
      </div>

      <PagosVerificar
        v-if="activeTab === 'verificando'"
        :facturas="c.facturas.value"
        :loading="c.loading.value"
        @confirmar="c.confirmarPago"
      />

      <CargarCsv
        v-if="activeTab === 'csv'"
        :file="c.csvFile.value"
        :resultado="c.csvResultado.value"
        :uploading="c.uploadingCsv.value"
        @change="c.setCsv"
        @submit="c.subirCsv"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:color';
@use '@/styles/tokens/colors' as *;

.conciliacion-view {
  min-height: 100vh;
  color: $fg-dark;
}

.page-header {
  padding: 2rem 0 1.5rem;
  border-bottom: 1px solid rgba($fg-dark, 0.08);

  h1 {
    font-size: 1.8rem;
    margin-bottom: 0.35rem;
  }

  .subtitle { color: $muted-dark; }
}

.content { padding: 2rem 0 4rem; }

.resumen-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: rgba($fg-dark, 0.04);
  border: 1px solid rgba($fg-dark, 0.08);
  border-radius: 12px;
  padding: 1.25rem;

  .stat-value { display: block; font-size: 1.9rem; font-weight: 700; }
  .stat-label { color: $muted-dark; font-size: 0.85rem; }

  &.accent {
    border-color: rgba($brand-orange, 0.3);
    .stat-value { color: $brand-orange; }
  }

  &.success {
    border-color: rgba(#22c55e, 0.3);
    .stat-value { color: #22c55e; }
  }
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.1rem;
  border-radius: 10px;
  border: 1px solid rgba($fg-dark, 0.12);
  background: transparent;
  color: $muted-dark;
  font-family: inherit;
  font-size: 0.9rem;
  cursor: pointer;

  &.active {
    border-color: $brand-orange;
    background: rgba($brand-orange, 0.12);
    color: $brand-orange;
  }
}
</style>
