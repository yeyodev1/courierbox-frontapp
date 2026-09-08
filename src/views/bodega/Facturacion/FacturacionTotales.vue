<script setup lang="ts">
/** Sticky bar with who is being invoiced and how the total builds up. */
import type { TotalesFactura } from '@/services/facturacion.api'
import { money } from './useFacturacion'

defineProps<{
  cliente: { nombre: string; identificacion: string; email: string; casillero: string }
  totales: TotalesFactura
  clientesDistintos: boolean
  puedeFacturar: boolean
  /** Hay selección válida pero al cliente le falta algo: el botón abre el formulario. */
  faltanDatos: boolean
  validando: boolean
  /** Lo que bloquea: sin esto el botón explica por qué no. */
  motivoBloqueo: string
  consumidorFinal: boolean
  ivaPorcentaje: number
}>()

const emit = defineEmits<{ emitir: []; datos: [] }>()
</script>

<template>
  <section class="totales">
    <div class="totales__cliente">
      <span class="muted">Factura a</span>
      <Transition name="swap" mode="out-in">
        <strong :key="consumidorFinal ? 'cf' : cliente.nombre">{{ consumidorFinal ? 'Consumidor Final' : cliente.nombre || '—' }}</strong>
      </Transition>
      <span class="muted">
        {{ cliente.casillero }}<template v-if="cliente.identificacion && !consumidorFinal"> · {{ cliente.identificacion }}</template>
        <template v-if="consumidorFinal"> · 9999999999999</template>
      </span>
      <button type="button" class="link" data-test="datos-facturacion" @click="emit('datos')">
        <i class="fa-solid fa-id-card" aria-hidden="true" /> Datos de facturación
      </button>
    </div>

    <dl class="totales__grid">
      <div><dt>Peso</dt><dd>{{ totales.pesoTotalLb.toFixed(2) }} lb</dd></div>
      <div><dt>Flete</dt><dd>{{ money(totales.totalFlete) }}</dd></div>
      <div><dt>Arancel</dt><dd>{{ money(totales.totalArancel) }}</dd></div>
      <div><dt>IVA {{ ivaPorcentaje }} %</dt><dd>{{ money(totales.totalIva) }}</dd></div>
      <div class="is-total">
        <dt>Total</dt>
        <Transition name="swap" mode="out-in"><dd :key="totales.totalGeneral">{{ money(totales.totalGeneral) }}</dd></Transition>
      </div>
    </dl>

    <p v-if="clientesDistintos" class="warn">
      <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" />
      Seleccionaste paquetes de clientes distintos. Una factura cubre a un solo cliente.
    </p>
    <p v-else-if="motivoBloqueo && !validando" class="warn" data-test="motivo-bloqueo">
      <i class="fa-solid fa-circle-exclamation" aria-hidden="true" />
      {{ motivoBloqueo }}
    </p>

    <button type="button" class="btn primary" :disabled="!puedeFacturar && !faltanDatos" :title="motivoBloqueo || undefined" data-test="emitir" @click="emit('emitir')">
      <i class="fa-solid" :class="validando ? 'fa-circle-notch fa-spin' : faltanDatos ? 'fa-id-card' : 'fa-file-invoice-dollar'" aria-hidden="true" />
      {{ validando ? 'Revisando datos…' : faltanDatos ? 'Completar datos y emitir' : 'Emitir factura' }}
    </button>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/tokens/motion' as *;

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

.link {
  align-self: flex-start;
  margin-top: 4px;
  background: none;
  border: none;
  padding: 0;
  color: $brand-orange;
  font: inherit;
  font-size: 0.82rem;
  cursor: pointer;
  display: inline-flex;
  gap: 6px;
  align-items: center;
  &:hover { text-decoration: underline; }
}

.muted {
  color: $ink-400;
  font-size: 0.82rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.warn {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin: 0;
  color: $signal-amber;
  font-size: 0.8rem;
  flex: 1 0 100%;
}

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
  transition: background $dur-fast ease, opacity $dur-fast ease, transform $dur-fast ease;

  &.primary { background: $brand-orange; color: $ink-1000; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:active:not(:disabled) { transform: translateY(1px); }
}

.swap-enter-active { transition: opacity $dur-base ease, transform $dur-base $ease-spring; }
.swap-leave-active { transition: opacity $dur-fast ease; }
.swap-enter-from { opacity: 0; transform: translateY(6px); }
.swap-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .btn, .swap-enter-active, .swap-leave-active { transition: none; }
}
</style>
