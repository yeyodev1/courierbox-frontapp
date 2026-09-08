<script setup lang="ts">
/** Una fila por caja del manifiesto, con lo que va a pasar (o pasó) con su cliente. */
import type { FilaIngreso } from '@/services/ingreso_carga.api'
import { formatDate } from '@/utils/format'
import { ACCION_UI, etiquetaAccion } from './useIngresoCarga'

defineProps<{
  filas: FilaIngreso[]
  aplicado: boolean
}>()

function peso(value: number) {
  return `${(Number(value) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} lb`
}
</script>

<template>
  <div class="tabla-wrap">
    <table class="tabla">
      <thead>
        <tr>
          <th>Caja</th>
          <th>Fecha</th>
          <th>Cliente en el manifiesto</th>
          <th>Queda como</th>
          <th>Resultado</th>
          <th>Contenido</th>
          <th class="num">Peso</th>
          <th>Paquete</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="f in filas" :key="`${f.fila}-${f.wr}`" :class="`tono-${ACCION_UI[f.accion].tono}`">
          <td>
            <strong class="mono">{{ f.wr }}</strong>
            <small class="mono">{{ f.mg }} · fila {{ f.fila }}</small>
          </td>
          <td class="mono">{{ f.fechaIngreso ? formatDate(f.fechaIngreso) : '—' }}</td>
          <td>
            <span class="raw">{{ f.cliente || '—' }}</span>
            <small v-if="f.agencia">{{ f.agencia }}</small>
          </td>
          <td>
            <template v-if="f.clienteNombreOficial">
              <strong>{{ f.clienteNombreOficial }}</strong>
              <small class="mono">{{ f.casillero }}</small>
            </template>
            <span v-else class="muted">Pendiente de homologar</span>
          </td>
          <td>
            <span class="pill" :class="`pill--${ACCION_UI[f.accion].tono}`" :data-test="`accion-${f.accion}`">
              {{ etiquetaAccion(f, aplicado) }}
            </span>
            <small v-if="f.accion === 'aproximado' && f.coincideCon">con {{ f.coincideCon }}</small>
            <small v-else-if="f.detalle">{{ f.detalle }}</small>
          </td>
          <td class="contenido" :title="f.contenido">{{ f.contenido || '—' }}</td>
          <td class="num mono">{{ peso(f.pesoLb) }}</td>
          <td>
            <span v-if="f.paquete" class="paquete" :class="f.paquete">
              {{ f.paquete === 'nuevo' ? 'Nuevo' : 'Actualizado' }}
            </span>
            <span v-else class="muted">—</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.tabla-wrap {
  overflow-x: auto;
  border: 1px solid rgba($ink-500, 0.15);
  border-radius: $radius-lg;
  background: $ink-900;
}

.tabla {
  width: 100%;
  min-width: 960px;
  border-collapse: collapse;
  font-size: 0.86rem;

  th, td {
    padding: $space-3 $space-4;
    text-align: left;
    vertical-align: top;
    border-bottom: 1px solid rgba($ink-500, 0.12);
  }

  th {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: $ink-400;
    font-weight: 600;
    white-space: nowrap;
    background: $ink-850;
  }

  tbody tr:last-child td { border-bottom: 0; }

  td strong { display: block; color: $fg-dark; font-weight: 600; }
  td small { display: block; color: $ink-400; font-size: 0.74rem; margin-top: 2px; }
  .raw { color: $ink-200; }
  .muted { color: $ink-500; }
  .num { text-align: right; white-space: nowrap; }
  .mono { font-variant-numeric: tabular-nums; }
  .contenido {
    max-width: 280px;
    color: $ink-300;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.pill {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: $radius-pill;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;

  &--ok { background: rgba($signal-green, 0.14); color: $signal-green; }
  &--aviso { background: rgba($signal-amber, 0.16); color: $signal-amber; }
  &--nuevo { background: rgba($brand-orange, 0.16); color: $brand-orange; }
  &--neutro { background: rgba($ink-500, 0.25); color: $ink-300; }
  &--error { background: rgba($signal-red, 0.16); color: $signal-red; }
}

.paquete {
  font-size: 0.76rem;
  color: $ink-300;
  &.nuevo { color: $signal-green; }
}

// La fila entera hereda un matiz suave para escanear la columna de resultado sin leerla.
tr.tono-nuevo td:first-child { box-shadow: inset 3px 0 0 rgba($brand-orange, 0.7); }
tr.tono-aviso td:first-child { box-shadow: inset 3px 0 0 rgba($signal-amber, 0.7); }
tr.tono-error td:first-child { box-shadow: inset 3px 0 0 rgba($signal-red, 0.7); }
</style>
