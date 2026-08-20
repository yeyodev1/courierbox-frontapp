<script setup lang="ts">
/** Sticky bar with who is being invoiced and how the total builds up. */
import type { TotalesFactura } from '@/services/facturacion.api'
import { money } from './useFacturacion'

defineProps<{
  cliente: { nombre: string; identificacion: string; email: string; casillero: string }
  totales: TotalesFactura
  clientesDistintos: boolean
  puedeFacturar: boolean
}>()

const emit = defineEmits<{ emitir: [] }>()
</script>

<template>
  <section class="totales">
    <div class="totales__cliente">
      <span class="muted">Cliente</span>
      <strong>{{ cliente.nombre || '—' }}</strong>
      <span class="muted">
        {{ cliente.casillero }}<template v-if="cliente.identificacion"> · {{ cliente.identificacion }}</template>
      </span>
      <span v-if="!cliente.email" class="warn-inline">
        <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" />
        Sin correo: la factura no se enviará por email
      </span>
    </div>

    <dl class="totales__grid">
      <div><dt>Peso</dt><dd>{{ totales.pesoTotalLb.toFixed(2) }} lb</dd></div>
      <div><dt>Flete</dt><dd>{{ money(totales.totalFlete) }}</dd></div>
      <div><dt>Arancel</dt><dd>{{ money(totales.totalArancel) }}</dd></div>
      <div><dt>IVA</dt><dd>{{ money(totales.totalIva) }}</dd></div>
      <div class="is-total"><dt>Total</dt><dd>{{ money(totales.totalGeneral) }}</dd></div>
    </dl>

    <p v-if="clientesDistintos" class="warn">
      <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" />
      Seleccionaste paquetes de clientes distintos. Una factura cubre a un solo cliente.
    </p>

    <button type="button" class="btn primary" :disabled="!puedeFacturar" @click="emit('emitir')">
      <i class="fa-solid fa-file-invoice-dollar" aria-hidden="true" /> Emitir factura
    </button>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.totales {
  position: sticky;
  bottom: $space-4;
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-4;
  padding: $space-4 $space-5;
  border-radius: $radius-lg;
  border: 1px solid rgba($brand-orange, 0.35);
  background: rgba($ink-800, 0.97);
  backdrop-filter: blur(10px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);

  &__cliente {
    flex: 1 1 190px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__grid {
    flex: 2 1 340px;
    display: flex;
    flex-wrap: wrap;
    gap: $space-4;
    margin: 0;

    div { display: flex; flex-direction: column; gap: 2px; }
    dt { color: $ink-400; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; }
    dd { margin: 0; font-variant-numeric: tabular-nums; color: $ink-100; font-size: 0.95rem; }

    .is-total dd { color: $brand-orange; font-size: 1.25rem; font-weight: 700; }
  }
}

.muted {
  color: $ink-400;
  font-size: 0.82rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.warn,
.warn-inline {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin: 0;
  color: $signal-amber;
  font-size: 0.8rem;
}

.warn { flex: 1 0 100%; }

.btn {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  min-height: 44px;
  padding: 0 $space-5;
  border-radius: $radius-md;
  border: 1px solid transparent;
  font: inherit;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &.primary { background: $brand-orange; color: $ink-1000; }
}
</style>
