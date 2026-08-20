<script setup lang="ts">
/** Charged vs cost per delivery mode, with the resulting margin. */
import type { ShipmentProfitability } from './useReporteEjecutivo'
import { formatMode, formatMoney, margin, marginPercent } from './useReporteEjecutivo'

defineProps<{ envios: ShipmentProfitability[] }>()
</script>

<template>
  <section class="report-panel shipment-panel">
    <div class="panel-heading">
      <div>
        <span class="section-kicker">Margen logístico</span>
        <h3>Rentabilidad por envío</h3>
      </div>
    </div>

    <div v-if="envios.length" class="shipment-list">
      <article v-for="shipment in envios" :key="shipment._id || 'unknown'" class="shipment-row">
        <div class="shipment-title">
          <strong>{{ formatMode(shipment._id) }}</strong>
          <span>{{ shipment.total }} envíos</span>
        </div>
        <div class="shipment-values">
          <span>Cobrado <strong>{{ formatMoney(shipment.cobrado) }}</strong></span>
          <span>Costo <strong>{{ formatMoney(shipment.costo) }}</strong></span>
        </div>
        <div class="margin-pill" :class="{ 'is-negative': margin(shipment.cobrado, shipment.costo) < 0 }">
          {{ marginPercent(shipment.cobrado, shipment.costo) }}% · {{ formatMoney(margin(shipment.cobrado, shipment.costo)) }}
        </div>
      </article>
    </div>
    <p v-else class="empty-state">No hay envíos registrados en este periodo.</p>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './reportes-ui' as ui;

@include ui.panel;

$cream: $ink-100;

.shipment-panel { flex: 1.1 1 520px; color: $cream; }

.shipment-list { display: flex; flex-direction: column; gap: $space-5; }

.shipment-row {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding-bottom: $space-4;
  border-bottom: 1px solid rgba($cream, 0.1);

  &:last-child { padding-bottom: 0; border-bottom: 0; }
}

.shipment-title {
  min-width: 128px;
  flex: 1 1 128px;

  strong { display: block; }

  span {
    display: block;
    margin-top: $space-1;
    color: rgba($cream, 0.62);
    font-size: 0.73rem;
  }
}

.shipment-values {
  display: flex;
  flex: 2 1 220px;
  gap: $space-4;

  span {
    flex: 1;
    color: rgba($cream, 0.62);
    font-size: 0.73rem;
  }

  strong { display: block; margin-top: 2px; color: $cream; }
}

.margin-pill {
  flex: 0 0 auto;
  padding: $space-2 $space-3;
  border-radius: $radius-pill;
  color: $signal-green;
  font-size: 0.72rem;
  font-weight: 800;
  background: rgba($signal-green, 0.12);

  &.is-negative { color: $signal-red; background: rgba($signal-red, 0.12); }
}

@media (max-width: 680px) {
  .shipment-panel { flex-basis: 100%; }
  .shipment-row { align-items: stretch; flex-direction: column; }
  .shipment-values { flex-basis: auto; }
  .margin-pill { align-self: flex-start; }
}
</style>
