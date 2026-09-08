<script setup lang="ts">
/**
 * Counter invoicing — the step the proposal calls "facturar en el counter".
 * The client gets the invoice by email plus a ready-to-send WhatsApp message.
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppConfirmModal from '@/components/ui/AppConfirmModal.vue'
import { WHATSAPP_DISPLAY, whatsappUrl } from '@/config/contact'
import DatosFaltantes from './Facturacion/DatosFaltantes.vue'
import FacturacionTotales from './Facturacion/FacturacionTotales.vue'
import { money, SRI_UI, useFacturacion } from './Facturacion/useFacturacion'

const f = useFacturacion()
const route = useRoute()
const confirming = ref(false)

// Desde Ingreso de carga se llega con ?q=<casillero>&sel=<WR>: el cliente ya
// buscado y la caja marcada, para facturar sin volver a escribir nada.
onMounted(() => {
  const q = typeof route.query.q === 'string' ? route.query.q : ''
  const sel = typeof route.query.sel === 'string' ? route.query.sel : ''
  if (q || sel) f.iniciarDesde({ q, sel })
  else f.cargarPendientes()
})

const whatsappFactura = computed(() => {
  const factura = f.lastFactura.value
  if (!factura) return '#'
  return whatsappUrl(
    `Hola Courier Box, soy ${factura.clienteNombre}. Recibí mi factura ${factura.numeroFactura} por ${money(factura.totalGeneral)} y quiero coordinar el pago.`,
  )
})

const sri = computed(() => (f.lastFactura.value ? SRI_UI[f.lastFactura.value.estadoSri] : null))

/** Por qué no se puede emitir todavía, en una frase. */
const motivoBloqueo = computed(() => {
  if (!f.validacion.value) return ''
  if (f.validacion.value.yaFacturados.length) return `Ya tienen factura: ${f.validacion.value.yaFacturados.join(', ')}.`
  const req = f.faltantesRequeridos.value
  if (!req.length) return ''
  return req.length === 1 ? req[0]!.mensaje : `Faltan ${req.length} datos del cliente para poder emitir.`
})

const nombreEnFactura = computed(() => (f.consumidorFinal.value && f.sinIdentificacion.value ? 'Consumidor Final' : f.cliente.value.nombre))

async function onEmitir() {
  if (await f.emitir()) confirming.value = false
}
</script>

<template>
  <div class="fact">
    <header class="head">
      <div>
        <h1>Facturación en counter</h1>
        <p>Selecciona los paquetes, revisa el total y emite la factura electrónica a Contifico.</p>
      </div>
    </header>

    <section class="panel">
      <div class="search">
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true" />
        <input
          v-model="f.query.value"
          type="search"
          placeholder="Filtra por casillero, WR, tracking o nombre del cliente…"
          aria-label="Filtrar paquetes facturables"
        />
        <span v-if="f.searching.value" class="spin"><i class="fa-solid fa-circle-notch fa-spin" /></span>
      </div>

      <div v-if="f.searching.value" aria-busy="true">
        <AppSkeleton variant="card" height="64px" :count="4" gap="0.6rem" />
      </div>

      <p v-else-if="f.searched.value && !f.paquetes.value.length" class="empty">
        <i class="fa-solid fa-file-invoice" aria-hidden="true" />
        {{ f.query.value.trim() ? 'No hay paquetes pendientes de facturar con ese criterio.' : 'No hay paquetes pendientes de facturar.' }}
      </p>

      <template v-else-if="f.paquetes.value.length">
        <div class="results-head">
          <span>{{ f.paquetes.value.length }} paquete(s) por facturar<template v-if="!f.query.value.trim()"> · los más recientes</template></span>
          <div>
            <button type="button" class="link" @click="f.seleccionarTodos">Seleccionar todos</button>
            <button type="button" class="link" @click="f.limpiar">Limpiar</button>
          </div>
        </div>

        <ul class="list">
          <li v-for="p in f.paquetes.value" :key="p._id">
            <label class="pkg" :class="{ selected: f.selectedIds.value.has(p._id) }">
              <input type="checkbox" :checked="f.selectedIds.value.has(p._id)" @change="f.toggle(p._id)" />
              <span class="pkg__body">
                <strong>{{ p.wr || p.sh || p.trackingOriginal }}</strong>
                <span class="muted">{{ p.contenido || 'Sin descripción' }}</span>
                <span class="muted">
                  {{ p.masterClienteId?.nombreOficial || p.consigneeLimpio }}
                  <template v-if="p.masterClienteId?.codigoCasillero">
                    · {{ p.masterClienteId.codigoCasillero }}
                  </template>
                </span>
              </span>
              <span class="pkg__peso">{{ (Number(p.pesoLb) || 0).toFixed(2) }} lb</span>
            </label>
          </li>
        </ul>
      </template>
    </section>

    <Transition name="bar">
      <DatosFaltantes
        v-if="f.seleccionados.value.length && !f.clientesDistintos.value && f.faltantes.value.length"
        v-model:consumidor-final="f.consumidorFinal.value"
        :cliente="f.cliente.value"
        :faltantes="f.faltantes.value"
        :consumidor-final-posible="f.consumidorFinalPosible.value"
        :guardando="f.guardandoCliente.value"
        @guardar="f.completarCliente"
      />
    </Transition>

    <Transition name="bar">
      <FacturacionTotales
        v-if="f.seleccionados.value.length"
        :cliente="f.cliente.value"
        :totales="f.totales.value"
        :clientes-distintos="f.clientesDistintos.value"
        :puede-facturar="f.puedeFacturar.value"
        :validando="f.validando.value"
        :motivo-bloqueo="motivoBloqueo"
        :consumidor-final="f.consumidorFinal.value && f.sinIdentificacion.value"
        @emitir="confirming = true"
      />
    </Transition>

    <Transition name="bar">
      <section v-if="f.lastFactura.value && sri" class="panel receipt" :class="`sri-${sri.tono}`" data-test="recibo">
        <div class="receipt__icon">
          <i class="fa-solid" :class="sri.tono === 'ok' ? 'fa-circle-check' : sri.tono === 'error' ? 'fa-circle-xmark' : 'fa-hourglass-half'" aria-hidden="true" />
        </div>
        <div class="receipt__body">
          <strong>Factura {{ f.lastFactura.value.numeroFactura }} · {{ money(f.lastFactura.value.totalGeneral) }}</strong>
          <Transition name="swap" mode="out-in">
            <span :key="f.lastFactura.value.estadoSri" class="sri-pill" :class="`sri-pill--${sri.tono}`" data-test="sri-estado">{{ sri.label }}</span>
          </Transition>
          <span class="muted">
            Cliente {{ f.lastFactura.value.clienteNombre }}.
            <template v-if="f.lastFactura.value.autorizacionSri">Autorización {{ f.lastFactura.value.autorizacionSri }}.</template>
            <template v-else-if="f.lastFactura.value.mensajeSri && sri.tono !== 'ok'">{{ f.lastFactura.value.mensajeSri }}</template>
          </span>
          <span class="receipt__links">
            <a v-if="f.lastFactura.value.pdfUrl" :href="f.lastFactura.value.pdfUrl" target="_blank" rel="noopener"><i class="fa-solid fa-file-pdf" aria-hidden="true" /> RIDE (PDF)</a>
            <a v-if="f.lastFactura.value.xmlUrl" :href="f.lastFactura.value.xmlUrl" target="_blank" rel="noopener"><i class="fa-solid fa-file-code" aria-hidden="true" /> XML</a>
          </span>
        </div>
        <div class="receipt__actions">
          <button
            v-if="f.lastFactura.value.estadoSri !== 'autorizado' && f.lastFactura.value.estadoSri !== 'simulado'"
            type="button"
            class="btn ghost"
            :disabled="f.sincronizando.value"
            data-test="actualizar-sri"
            @click="f.actualizarSri"
          >
            <i class="fa-solid fa-rotate" :class="{ 'fa-spin': f.sincronizando.value }" aria-hidden="true" /> Consultar SRI
          </button>
          <a class="btn wa" :href="whatsappFactura" target="_blank" rel="noopener" :title="WHATSAPP_DISPLAY">
            <i class="fa-brands fa-whatsapp" aria-hidden="true" /> Enviar por WhatsApp
          </a>
        </div>
      </section>
    </Transition>

    <AppConfirmModal
      :open="confirming"
      title="Emitir factura electrónica"
      :message="`Se emitirá una factura por ${money(f.totales.value.totalGeneral)} a nombre de ${nombreEnFactura}. Se firma, se envía al SRI y no se puede deshacer desde aquí.`"
      confirm-label="Emitir factura"
      variant="info"
      loading-label="Emitiendo y enviando al SRI…"
      :confirm-loading="f.emitting.value"
      @cancel="confirming = false"
      @confirm="onEmitir"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/tokens/motion' as *;

.fact {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.head {
  h1 { margin: 0 0 $space-1; font-size: 1.5rem; }
  p { margin: 0; color: $ink-400; font-size: 0.9rem; }
}

.panel {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  padding: $space-5;
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.15);
  border-radius: $radius-lg;
}

.search {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: 0 $space-4;
  border-radius: $radius-md;
  border: 1px solid rgba($ink-500, 0.25);
  background: $ink-850;

  > i { color: $ink-400; }

  input {
    flex: 1;
    min-height: 48px;
    border: none;
    background: transparent;
    color: $fg-dark;
    font: inherit;
    outline: none;
  }

  &:focus-within { border-color: rgba($brand-orange, 0.5); }
}

.spin { color: $brand-orange; }

.results-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
  color: $ink-400;

  div { display: flex; gap: $space-3; }
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.pkg {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid rgba($ink-500, 0.2);
  background: $ink-850;
  cursor: pointer;
  transition: border-color $dur-fast ease, background $dur-fast ease;

  &:hover { border-color: rgba($brand-orange, 0.35); }
  &.selected { border-color: $brand-orange; background: rgba($brand-orange, 0.08); }

  input { width: 20px; height: 20px; accent-color: $brand-orange; flex: 0 0 auto; }

  &__body { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }

  &__peso {
    flex: 0 0 auto;
    font-variant-numeric: tabular-nums;
    color: $ink-300;
    font-size: 0.85rem;
  }
}

.muted {
  color: $ink-400;
  font-size: 0.82rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.receipt {
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: $space-4;
  border-color: rgba($signal-green, 0.35);
  background: rgba($signal-green, 0.06);
  transition: border-color $dur-base ease, background $dur-base ease;

  &__icon { font-size: 1.6rem; color: $signal-green; }
  &__body { flex: 1 1 260px; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  &__body .muted { white-space: normal; }
  &__links { display: flex; gap: $space-4; font-size: 0.82rem; a { color: $brand-orange; text-decoration: none; display: inline-flex; gap: 6px; align-items: center; } }
  &__actions { display: flex; gap: $space-3; flex-wrap: wrap; }

  &.sri-proceso { border-color: rgba($signal-amber, 0.4); background: rgba($signal-amber, 0.06); .receipt__icon { color: $signal-amber; } }
  &.sri-error { border-color: rgba($signal-red, 0.4); background: rgba($signal-red, 0.06); .receipt__icon { color: $signal-red; } }
  &.sri-neutro { border-color: rgba($ink-500, 0.3); background: $ink-900; .receipt__icon { color: $ink-400; } }
}

.sri-pill {
  align-self: flex-start;
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: $radius-pill;
  font-size: 0.74rem;
  font-weight: 700;
  &--ok { background: rgba($signal-green, 0.14); color: $signal-green; }
  &--proceso { background: rgba($signal-amber, 0.16); color: $signal-amber; }
  &--error { background: rgba($signal-red, 0.16); color: $signal-red; }
  &--neutro { background: rgba($ink-500, 0.25); color: $ink-300; }
}

.swap-enter-active { transition: opacity $dur-base ease, transform $dur-base $ease-spring; }
.swap-leave-active { transition: opacity $dur-fast ease; }
.swap-enter-from { opacity: 0; transform: translateY(6px); }
.swap-leave-to { opacity: 0; }

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  padding: $space-8;
  margin: 0;
  color: $ink-500;
  font-size: 0.88rem;
}

.link {
  background: none;
  border: none;
  padding: 0;
  color: $brand-orange;
  font: inherit;
  font-size: 0.82rem;
  cursor: pointer;

  &:hover { text-decoration: underline; }
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
  text-decoration: none;

  &.wa {
    background: rgba(37, 211, 102, 0.14);
    border-color: rgba(37, 211, 102, 0.4);
    color: #4ce08a;

    &:hover { background: rgba(37, 211, 102, 0.22); }
  }

  &.ghost { background: rgba($ink-700, 0.8); border-color: rgba($ink-500, 0.25); color: $ink-200; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.bar-enter-active,
.bar-leave-active {
  transition: opacity $dur-fast ease, transform $dur-base $ease-out-expo;
}

.bar-enter-from,
.bar-leave-to { opacity: 0; transform: translateY(12px); }

@media (prefers-reduced-motion: reduce) {
  .pkg,
  .receipt,
  .swap-enter-active,
  .swap-leave-active,
  .bar-enter-active,
  .bar-leave-active { transition: none; }
}
</style>
