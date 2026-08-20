<script setup lang="ts">
/** Providers ranked by volume, with what each one charged us. */
import { computed } from 'vue'
import type { ProviderSummary } from './useReporteEjecutivo'
import { formatMoney } from './useReporteEjecutivo'

const props = defineProps<{ proveedores: ProviderSummary[] }>()

const maxShipments = computed(() => Math.max(...props.proveedores.map((p) => p.total), 1))

function width(value: number) {
  return `${Math.max((value / maxShipments.value) * 100, value > 0 ? 6 : 0)}%`
}
</script>

<template>
  <section class="report-panel providers-panel">
    <div class="panel-heading">
      <div>
        <span class="section-kicker">Red operativa</span>
        <h3>Proveedores</h3>
      </div>
      <span class="panel-note">Ordenados por envíos realizados</span>
    </div>

    <div v-if="proveedores.length" class="provider-list">
      <article v-for="(provider, index) in proveedores" :key="provider._id || index" class="provider-row">
        <span class="provider-rank">{{ String(index + 1).padStart(2, '0') }}</span>
        <div class="provider-main">
          <div class="provider-copy">
            <strong>{{ provider._id || 'Proveedor sin nombre' }}</strong>
            <span>{{ provider.total }} envíos · {{ formatMoney(provider.cobrado) }} cobrado</span>
          </div>
          <div class="bar-track provider-bar"><span :style="{ width: width(provider.total) }" /></div>
        </div>
        <div class="provider-cost">
          <span>Costo</span>
          <strong>{{ formatMoney(provider.costo) }}</strong>
        </div>
      </article>
    </div>
    <p v-else class="empty-state">No hay actividad de proveedores en este periodo.</p>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './reportes-ui' as ui;

@include ui.panel;
@include ui.bar;

$cream: $ink-100;

.providers-panel { color: $cream; }

.provider-list { display: flex; flex-direction: column; gap: $space-2; }

.provider-row {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: $space-3 0;
}

.provider-rank {
  color: $brand-orange;
  font-size: 0.78rem;
  font-weight: 800;
}

.provider-main { min-width: 0; flex: 1; }

.provider-copy {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: $space-3;
  margin-bottom: $space-2;

  strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  span {
    flex: 0 0 auto;
    color: rgba($cream, 0.62);
    font-size: 0.73rem;
  }
}

.provider-bar span { background: $brand-orange; }

.provider-cost {
  min-width: 105px;
  text-align: right;

  span {
    display: block;
    color: rgba($cream, 0.62);
    font-size: 0.73rem;
  }

  strong { display: block; margin-top: 2px; }
}

@media (max-width: 680px) {
  .provider-row { align-items: flex-start; }
  .provider-copy { align-items: stretch; flex-direction: column; }
  .provider-copy span { flex: auto; }
}

@media (max-width: 420px) {
  .provider-cost { min-width: 82px; }
}
</style>
