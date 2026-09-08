<script setup lang="ts">
/**
 * Una fila por caja del manifiesto, con lo que va a pasar (o pasó) con su
 * cliente. Donde el nombre no cuadró solo, la fila ofrece «Vincular» para
 * decidirlo a mano; la pill cambia con transición y la fila se enciende un
 * instante para que el ojo encuentre lo que acaba de cambiar.
 */
import type { FilaIngreso } from '@/services/ingreso_carga.api'
import { formatDate } from '@/utils/format'
import { ACCION_UI, etiquetaAccion, sePuedeVincular } from './useIngresoCarga'

defineProps<{
  filas: FilaIngreso[]
  aplicado: boolean
  /** WR que acaba de cambiar por una decisión manual. */
  resaltada?: string | null
}>()

const emit = defineEmits<{ vincular: [fila: FilaIngreso]; facturar: [fila: FilaIngreso] }>()

/** Una caja ya registrada se puede facturar en cuanto tiene cliente. */
function sePuedeFacturar(fila: FilaIngreso): boolean {
  return Boolean(fila.casillero) && !['sin_cliente', 'omitido', 'error'].includes(fila.accion)
}

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
          <th>Caja en el sistema</th>
          <th class="acc"><span class="sr-only">Acciones</span></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="f in filas"
          :key="`${f.fila}-${f.wr}`"
          :class="[`tono-${ACCION_UI[f.accion].tono}`, { 'is-recien': resaltada === f.wr, 'is-duplicada': f.paquete === 'actualizado' && !aplicado }]"
          :data-test="`fila-${f.wr}`"
        >
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
            <Transition name="swap" mode="out-in">
              <div :key="`${f.clienteNombreOficial}|${f.casillero}`">
                <template v-if="f.clienteNombreOficial">
                  <strong>{{ f.clienteNombreOficial }}</strong>
                  <small class="mono">{{ f.casillero }}</small>
                </template>
                <span v-else class="muted">Pendiente de homologar</span>
              </div>
            </Transition>
          </td>
          <td>
            <Transition name="swap" mode="out-in">
              <div :key="`${f.accion}|${f.casillero}`">
                <span class="pill" :class="`pill--${ACCION_UI[f.accion].tono}`" :data-test="`accion-${f.accion}`">
                  {{ etiquetaAccion(f, aplicado) }}
                </span>
                <small v-if="f.accion === 'aproximado' && f.coincideCon">con {{ f.coincideCon }}</small>
                <small v-else-if="f.detalle">{{ f.detalle }}</small>
              </div>
            </Transition>
          </td>
          <td class="contenido" :title="f.contenido">{{ f.contenido || '—' }}</td>
          <td class="num mono">{{ peso(f.pesoLb) }}</td>
          <td>
            <template v-if="f.paquete === 'actualizado'">
              <span class="pill pill--aviso" :data-test="`caja-existente-${f.wr}`">{{ aplicado ? 'Actualizada' : 'Ya registrada' }}</span>
              <small>{{ aplicado ? 'Ya existía; se actualizó con el Excel' : 'Ya existe; se actualiza, no se duplica' }}</small>
            </template>
            <template v-else-if="f.paquete === 'nuevo'">
              <span class="pill pill--ok">{{ aplicado ? 'Registrada' : 'Nueva' }}</span>
            </template>
            <span v-else class="muted">—</span>
          </td>
          <td class="acc">
            <button
              v-if="!aplicado && sePuedeVincular(f)"
              type="button"
              class="btn ghost sm"
              :data-test="`vincular-${f.wr}`"
              @click="emit('vincular', f)"
            >
              <i class="fa-solid fa-link" aria-hidden="true" />
              {{ f.accion === 'vinculado' ? 'Cambiar' : 'Vincular' }}
            </button>
            <button
              v-else-if="aplicado && sePuedeFacturar(f)"
              type="button"
              class="btn primary sm"
              :data-test="`facturar-${f.wr}`"
              @click="emit('facturar', f)"
            >
              <i class="fa-solid fa-file-invoice-dollar" aria-hidden="true" />
              Facturar
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/tokens/motion' as *;
@use '../Homologacion/homologacion-ui' as ui;

@include ui.buttons;

.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }

.tabla-wrap {
  overflow-x: auto;
  border: 1px solid rgba($ink-500, 0.15);
  border-radius: $radius-lg;
  background: $ink-900;
}

.tabla {
  width: 100%;
  min-width: 1040px;
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

  tbody tr { transition: background $dur-base ease; }
  tbody tr:last-child td { border-bottom: 0; }

  td strong { display: block; color: $fg-dark; font-weight: 600; }
  td small { display: block; color: $ink-400; font-size: 0.74rem; margin-top: 2px; }
  .raw { color: $ink-200; }
  .muted { color: $ink-500; }
  .num { text-align: right; white-space: nowrap; }
  .acc { text-align: right; white-space: nowrap; }
  .mono { font-variant-numeric: tabular-nums; }
  .contenido {
    max-width: 260px;
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

// La fila entera hereda un matiz para escanear la columna de resultado sin leerla.
tr.tono-nuevo td:first-child { box-shadow: inset 3px 0 0 rgba($brand-orange, 0.7); }
tr.tono-aviso td:first-child { box-shadow: inset 3px 0 0 rgba($signal-amber, 0.7); }
tr.tono-error td:first-child { box-shadow: inset 3px 0 0 rgba($signal-red, 0.7); }
// Una caja que ya existía se ve distinta a simple vista, antes de confirmar.
tr.is-duplicada td:first-child { box-shadow: inset 3px 0 0 rgba($signal-amber, 0.85); }

// El cambio de cliente y de pill se cruzan en lugar de saltar.
.swap-enter-active { transition: opacity $dur-base ease, transform $dur-base $ease-spring; }
.swap-leave-active { transition: opacity $dur-fast ease, transform $dur-fast ease; }
.swap-enter-from { opacity: 0; transform: translateY(6px); }
.swap-leave-to { opacity: 0; transform: translateY(-6px); }

// La fila recién decidida se enciende y se apaga sola.
tr.is-recien { animation: recien 1.4s ease-out; }
@keyframes recien {
  0% { background: rgba($signal-green, 0.22); }
  100% { background: transparent; }
}

@media (prefers-reduced-motion: reduce) {
  .swap-enter-active, .swap-leave-active, tbody tr { transition: none; }
  tr.is-recien { animation: none; background: rgba($signal-green, 0.12); }
}
</style>
