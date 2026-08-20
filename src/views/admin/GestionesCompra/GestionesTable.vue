<script setup lang="ts">
/** All gestiones for the applied filters, with their margin per row. */
import AppButton from '@/components/ui/AppButton.vue'
import type { GestionCompra } from '@/services/gestiones_compra.api'
import { asesorNombre, clienteEmail, clienteNombre, estadoLabel, formatDate, margenNeto } from './useGestionesCompra'

defineProps<{ gestiones: GestionCompra[]; loading: boolean }>()
const emit = defineEmits<{ open: [id: string]; nueva: [] }>()
</script>

<template>
  <div v-if="loading" class="table-skeleton">
    <div v-for="i in 5" :key="i" class="row-skeleton" />
  </div>

  <div v-else class="table-wrapper">
    <table v-if="gestiones.length" class="data-table">
      <thead>
        <tr>
          <th>Cliente</th>
          <th>Asesor</th>
          <th>Valor Total</th>
          <th>Comisión</th>
          <th>Costo Venta</th>
          <th>Margen Neto</th>
          <th>Reserva</th>
          <th>Estado</th>
          <th>Fecha Entrega</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="g in gestiones" :key="g._id" class="data-row" @click="emit('open', g._id)">
          <td>
            <span class="client-name">{{ clienteNombre(g) }}</span>
            <span class="client-email muted">{{ clienteEmail(g) }}</span>
          </td>
          <td>{{ asesorNombre(g) }}</td>
          <td class="amount">${{ g.valorTotal.toFixed(2) }}</td>
          <td>${{ g.valorComision.toFixed(2) }}</td>
          <td>${{ g.costoVenta.toFixed(2) }}</td>
          <td class="amount">${{ margenNeto(g).toFixed(2) }}</td>
          <td>
            <span class="amount-sm">${{ g.valorReserva.toFixed(2) }}</span>
            <span v-if="g.reservaConfirmada" class="badge-confirmed">✓</span>
          </td>
          <td><span class="estado-badge" :class="`estado-${g.estado}`">{{ estadoLabel(g.estado) }}</span></td>
          <td>{{ formatDate(g.fechaEntregaTentativa) }}</td>
          <td @click.stop>
            <AppButton variant="ghost" size="sm" @click="emit('open', g._id)">Ver</AppButton>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else class="empty-state">
      <p>No hay gestiones de compra para los filtros aplicados.</p>
      <AppButton variant="primary" @click="emit('nueva')">Crear primera gestión</AppButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.table-wrapper {
  overflow-x: auto;
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 16px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;

  th,
  td {
    padding: $space-3 $space-4;
    text-align: left;
    border-bottom: 1px solid rgba($ink-500, 0.1);
    white-space: nowrap;
  }

  th {
    color: $ink-400;
    font-weight: 600;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  tbody tr:last-child td { border-bottom: none; }
}

.data-row {
  cursor: pointer;

  &:hover { background: rgba($ink-500, 0.06); }
}

.client-name { display: block; font-weight: 600; }
.client-email { display: block; font-size: 0.75rem; }
.muted { color: $ink-400; }

.amount { color: $brand-orange; font-weight: 700; }
.amount-sm { font-weight: 600; }

.badge-confirmed { margin-left: 6px; color: $signal-green; font-weight: 800; }

.estado-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;

  &.estado-activa,
  &.estado-completado { background: rgba($signal-green, 0.15); color: $signal-green; }
  &.estado-borrador { background: rgba($ink-500, 0.18); color: $ink-300; }
  &.estado-cancelado { background: rgba($signal-red, 0.15); color: $signal-red; }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-4;
  padding: $space-10;
  color: $ink-400;

  p { margin: 0; }
}

.table-skeleton {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.row-skeleton {
  height: 56px;
  border-radius: 12px;
  background: $ink-800;
  animation: pulse 1.4s infinite;
}

@keyframes pulse {
  0%,
  100% { opacity: 1; }
  50% { opacity: 0.55; }
}

@media (prefers-reduced-motion: reduce) {
  .row-skeleton { animation: none; }
}
</style>
