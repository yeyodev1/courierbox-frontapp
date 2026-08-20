<script setup lang="ts">
/** One invoice with its cost breakdown; only pending ones can be ticked. */
import { formatMoney, type PortalFactura } from './usePaymentPortal'

defineProps<{ factura: PortalFactura; seleccionada: boolean }>()
const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <div
    class="factura-card glass-card"
    :class="{ 'is-selected': seleccionada, 'is-locked': factura.estado !== 'pendiente' }"
  >
    <div class="factura-header">
      <label v-if="factura.estado === 'pendiente'" class="factura-check">
        <input
          type="checkbox"
          :checked="seleccionada"
          :aria-label="`Incluir factura ${factura.numeroFactura} en el pago`"
          @change="emit('toggle')"
        />
      </label>
      <div>
        <h3>{{ factura.numeroFactura }}</h3>
        <span :class="['status-badge', factura.estado]">
          {{ factura.estado === 'pendiente' ? 'Pendiente' : 'En verificación' }}
        </span>
      </div>
      <div class="factura-monto">{{ formatMoney(factura.totalGeneral) }}</div>
    </div>

    <div class="factura-detalle">
      <div class="detalle-row"><span>Peso total</span><span>{{ factura.pesoTotalLb.toFixed(2) }} lb</span></div>
      <div class="detalle-row"><span>Flete</span><span>{{ formatMoney(factura.totalFlete) }}</span></div>
      <div class="detalle-row"><span>Arancel 4x4</span><span>{{ formatMoney(factura.totalArancel) }}</span></div>
      <div class="detalle-row"><span>IVA 15%</span><span>{{ formatMoney(factura.iva) }}</span></div>
    </div>

    <div v-if="factura.pdfUrl" class="factura-pdf">
      <a :href="factura.pdfUrl" target="_blank" class="pdf-link">
        <i class="fa-solid fa-file-pdf" /> Ver factura PDF
      </a>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use './portal-ui' as ui;

@include ui.card;

.factura-card {
  transition: border-color 0.18s ease, opacity 0.18s ease;

  &.is-selected { border-color: rgba($brand-orange, 0.55); }
  &.is-locked { opacity: 0.65; }
}

.factura-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;

  h3 { font-size: 1.1rem; margin-bottom: 0.35rem; }
}

.factura-check {
  display: inline-flex;
  align-items: center;
  margin-right: 0.75rem;
  cursor: pointer;

  input { width: 20px; height: 20px; accent-color: $brand-orange; }
}

.factura-monto {
  font-size: 1.4rem;
  font-weight: 700;
  color: $brand-orange;
}

.factura-detalle .detalle-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  font-size: 0.9rem;
  color: $muted-dark;

  &:not(:last-child) { border-bottom: 1px solid rgba($fg-dark, 0.05); }
}

.factura-pdf {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba($fg-dark, 0.08);
}

.pdf-link {
  color: #60a5fa;
  text-decoration: none;
  font-size: 0.9rem;

  &:hover { text-decoration: underline; }
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;

  &.pendiente { background: rgba(#f59e0b, 0.15); color: #f59e0b; }
  &.verificando { background: rgba(#3b82f6, 0.15); color: #60a5fa; }
}

@media (prefers-reduced-motion: reduce) {
  .factura-card { transition: none; }
}
</style>
