<script setup lang="ts">
/**
 * What this section still owes, and a way to see only that.
 *
 * `valorPagado` was recorded on every expense from the start and then never read
 * back — the list showed the amount, the detail card showed what had been paid,
 * and the difference lived in the operator's head. The totals here come from the
 * whole filtered period rather than the rows on screen, so the debt does not
 * shrink as the list is paged.
 */
import { formatCurrency } from '@/utils/format'
import type { CostosSaldos } from '@/services/costos.api'

defineProps<{ saldos: CostosSaldos; soloPendientes: boolean; loading?: boolean }>()

defineEmits<{ (e: 'toggle'): void }>()
</script>

<template>
  <section class="saldos-bar" :class="{ debe: saldos.pendiente > 0 }">
    <article class="saldo">
      <span>Pendiente de pago</span>
      <strong>{{ formatCurrency(saldos.pendiente) }}</strong>
      <small>{{ saldos.conSaldo }} registro(s) con saldo</small>
    </article>
    <article class="saldo">
      <span>Pagado</span>
      <strong>{{ formatCurrency(saldos.pagado) }}</strong>
      <small>de {{ formatCurrency(saldos.monto) }} del período</small>
    </article>

    <button
      type="button"
      class="toggle"
      :class="{ on: soloPendientes }"
      :aria-pressed="soloPendientes"
      :disabled="loading"
      @click="$emit('toggle')"
    >
      <i class="fa-solid" :class="soloPendientes ? 'fa-list' : 'fa-filter'" />
      {{ soloPendientes ? 'Ver todos' : 'Solo pendientes' }}
    </button>
  </section>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.saldos-bar {
  display: flex;
  align-items: center;
  gap: $space-4;
  flex-wrap: wrap;
  padding: $space-3 $space-4;
  border: 1px solid rgba($ink-500, 0.16);
  border-radius: 14px;
  background: rgba($ink-1000, 0.35);

  &.debe { border-color: rgba($signal-red, 0.32); }
}

.saldo {
  display: flex;
  flex-direction: column;
  gap: 2px;

  span {
    font-size: 0.68rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: $ink-400;
  }

  strong {
    font-size: 1.2rem;
    color: $brand-orange;
    font-variant-numeric: tabular-nums;
  }

  small { font-size: 0.72rem; color: $ink-400; }
}

.saldos-bar.debe .saldo:first-child strong { color: #ff8a8f; }

.toggle {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  border: 1px solid rgba($ink-500, 0.28);
  background: transparent;
  color: $ink-300;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;

  &.on { border-color: rgba($brand-orange, 0.5); background: rgba($brand-orange, 0.12); color: $brand-orange; }
  &:disabled { opacity: 0.55; cursor: not-allowed; }

  @media (max-width: 640px) { margin-left: 0; }
}
</style>
