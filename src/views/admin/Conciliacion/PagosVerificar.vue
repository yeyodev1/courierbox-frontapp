<script setup lang="ts">
/** Client payments waiting for a human to confirm they landed in the account. */
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import { formatMoney, type FacturaVerificando } from './useConciliacion'

defineProps<{ facturas: FacturaVerificando[]; loading: boolean }>()
const emit = defineEmits<{ confirmar: [facturaId: string] }>()
</script>

<template>
  <div class="tab-content">
    <div v-if="loading" class="loading-state" aria-busy="true" aria-live="polite">
      <AppSkeleton variant="card" height="96px" :count="4" gap="0.75rem" />
    </div>

    <div v-else-if="!facturas.length" class="empty-state">
      <i class="fa-solid fa-check-circle fa-3x" />
      <p>No hay pagos pendientes de verificación</p>
    </div>

    <div v-for="f in facturas" v-else :key="f._id" class="factura-card">
      <div class="card-header">
        <div>
          <strong>{{ f.numeroFactura }}</strong>
          <p class="cliente-name">
            {{ f.masterClienteId?.nombreOficial || 'Sin cliente' }}
            ({{ f.masterClienteId?.codigoCasillero || 'N/A' }})
          </p>
        </div>
        <div class="monto">{{ formatMoney(f.totalGeneral) }}</div>
      </div>

      <div class="card-body">
        <div class="info-row">
          <span>Referencia:</span>
          <span class="ref-value">{{ f.referenciaPago || 'N/A' }}</span>
        </div>
        <div class="info-row">
          <span>Fecha:</span>
          <span>{{ new Date(f.createdAt).toLocaleDateString() }}</span>
        </div>
        <div v-if="f.comprobanteUrl" class="info-row">
          <span>Comprobante:</span>
          <a :href="f.comprobanteUrl" target="_blank" class="comprobante-link">
            <i class="fa-solid fa-file" /> Ver archivo
          </a>
        </div>
      </div>

      <div class="card-actions">
        <button class="btn-approve" @click="emit('confirmar', f._id)">
          <i class="fa-solid fa-check" /> Confirmar Pago
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem 0;
  color: $muted-dark;
}

.empty-state {
  align-items: center;
  text-align: center;

  i { color: #22c55e; }
}

.factura-card {
  background: rgba($fg-dark, 0.04);
  border: 1px solid rgba($fg-dark, 0.08);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;

  .cliente-name { color: $muted-dark; font-size: 0.85rem; margin-top: 0.2rem; }
}

.monto {
  font-size: 1.3rem;
  font-weight: 700;
  color: $brand-orange;
}

.card-body .info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  font-size: 0.9rem;
  color: $muted-dark;

  .ref-value { font-family: monospace; color: rgba($fg-dark, 0.8); }
}

.comprobante-link {
  color: #60a5fa;
  text-decoration: none;

  &:hover { text-decoration: underline; }
}

.card-actions {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba($fg-dark, 0.06);
}

.btn-approve {
  padding: 0.6rem 1.5rem;
  background: #22c55e;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-family: inherit;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover { opacity: 0.85; }
}

@media (prefers-reduced-motion: reduce) {
  .btn-approve { transition: none; }
}
</style>
