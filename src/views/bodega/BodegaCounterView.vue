<script setup lang="ts">
/**
 * Counter pickup: search the client's packages, select everything they are
 * taking, capture one signature, and release the whole batch at once.
 * Replaces the per-package paper slips described in the V2.2 proposal.
 */
import { onMounted, ref } from 'vue'
import AppConfirmModal from '@/components/ui/AppConfirmModal.vue'
import type { RetiroCounter } from '@/services/retiros_counter.api'
import { WHATSAPP_DISPLAY } from '@/config/contact'
import CounterBusqueda from './Counter/CounterBusqueda.vue'
import CounterFirmaModal from './Counter/CounterFirmaModal.vue'
import CounterHistorial from './Counter/CounterHistorial.vue'
import { folio, useCounter, whatsappRetiroUrl, type RetiroForm } from './Counter/useCounter'

const c = useCounter()

const showFirma = ref(false)
const anularTarget = ref<RetiroCounter | null>(null)

async function onConfirmar(form: RetiroForm, firmaDataUrl: string, otroRetira: boolean) {
  if (await c.confirmarRetiro(form, firmaDataUrl, otroRetira)) showFirma.value = false
}

async function onAnular() {
  if (!anularTarget.value) return
  if (await c.anular(anularTarget.value)) anularTarget.value = null
}

onMounted(c.cargarHistorial)
</script>

<template>
  <div class="counter">
    <header class="head">
      <div>
        <h1>Counter digital</h1>
        <p>Una sola firma libera todos los paquetes que el cliente retira hoy. Sin papel.</p>
      </div>
    </header>

    <CounterBusqueda
      v-model:query="c.query.value"
      :searching="c.searching.value"
      :searched="c.searched.value"
      :disponibles="c.disponibles.value"
      :selected-ids="c.selectedIds.value"
      @toggle="c.toggle"
      @select-all="c.seleccionarTodos"
      @clear="c.limpiarSeleccion"
    />

    <Transition name="bar">
      <section v-if="c.seleccionados.value.length" class="bar">
        <div class="bar__info">
          <strong>{{ c.totales.value.paquetes }}</strong> paquete(s) ·
          <strong>{{ c.totales.value.peso.toFixed(2) }}</strong> lb
          <span v-if="c.cliente.value.nombre" class="bar__cliente">para {{ c.cliente.value.nombre }}</span>
        </div>
        <p v-if="c.clientesDistintos.value" class="bar__warn">
          <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" />
          Seleccionaste paquetes de clientes distintos. Un retiro cubre a un solo cliente.
        </p>
        <button type="button" class="btn primary" :disabled="!c.puedeFirmar.value" @click="showFirma = true">
          <i class="fa-solid fa-signature" aria-hidden="true" /> Firmar y entregar
        </button>
      </section>
    </Transition>

    <section v-if="c.lastRetiro.value" class="panel receipt">
      <div class="receipt__icon"><i class="fa-solid fa-circle-check" aria-hidden="true" /></div>
      <div class="receipt__body">
        <strong>Retiro #{{ folio(c.lastRetiro.value._id) }} firmado</strong>
        <span>
          {{ c.lastRetiro.value.totalPaquetes }} paquete(s) entregados a {{ c.lastRetiro.value.retiradoPorNombre }}.
          {{ c.lastRetiro.value.clienteEmail ? 'Comprobante enviado por correo.' : 'Cliente sin correo registrado.' }}
        </span>
      </div>
      <div class="receipt__actions">
        <a
          v-if="c.lastRetiro.value.comprobanteUrl"
          class="btn ghost"
          :href="c.lastRetiro.value.comprobanteUrl"
          target="_blank"
          rel="noopener"
        >
          <i class="fa-solid fa-file-pdf" aria-hidden="true" /> Ver PDF
        </a>
        <a
          class="btn wa"
          :href="whatsappRetiroUrl(c.lastRetiro.value)"
          target="_blank"
          rel="noopener"
          :title="`Abrir WhatsApp (${WHATSAPP_DISPLAY})`"
        >
          <i class="fa-brands fa-whatsapp" aria-hidden="true" /> Enviar por WhatsApp
        </a>
      </div>
    </section>

    <CounterHistorial
      :historial="c.historial.value"
      :loading="c.loadingHistorial.value"
      @refrescar="c.cargarHistorial"
      @anular="(r) => (anularTarget = r)"
    />

    <CounterFirmaModal
      :open="showFirma"
      :saving="c.saving.value"
      :seleccionados="c.seleccionados.value"
      :cliente-nombre="c.cliente.value.nombre"
      :totales="c.totales.value"
      @close="showFirma = false"
      @confirm="onConfirmar"
    />

    <AppConfirmModal
      :open="!!anularTarget"
      title="Anular retiro"
      :message="`Se anulará el retiro #${anularTarget ? folio(anularTarget._id) : ''} y sus paquetes volverán a estar disponibles.`"
      confirm-label="Anular retiro"
      variant="danger"
      loading-label="Anulando…"
      :confirm-loading="c.anulando.value"
      @cancel="anularTarget = null"
      @confirm="onAnular"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/tokens/motion' as *;
@use './Counter/counter-ui' as ui;

@include ui.panel;
@include ui.button;

.counter {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.head {
  h1 { margin: 0 0 $space-1; font-size: 1.5rem; }
  p { margin: 0; color: $ink-400; font-size: 0.9rem; }
}

.bar {
  position: sticky;
  bottom: $space-4;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: $space-4;
  flex-wrap: wrap;
  padding: $space-4 $space-5;
  border-radius: $radius-lg;
  border: 1px solid rgba($brand-orange, 0.35);
  background: rgba($ink-800, 0.97);
  backdrop-filter: blur(10px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
}

.bar__info {
  flex: 1;
  min-width: 200px;
  color: $ink-200;
  font-size: 0.9rem;
}

.bar__cliente {
  display: block;
  color: $ink-400;
  font-size: 0.82rem;
}

.bar__warn {
  flex: 1 0 100%;
  margin: 0;
  color: $signal-amber;
  font-size: 0.82rem;
  display: flex;
  align-items: center;
  gap: $space-2;
}

.bar-enter-active,
.bar-leave-active {
  transition: opacity $dur-fast ease, transform $dur-base $ease-out-expo;
}

.bar-enter-from,
.bar-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.receipt {
  flex-direction: row;
  align-items: center;
  gap: $space-4;
  border-color: rgba($signal-green, 0.35);
  background: rgba($signal-green, 0.06);
}

.receipt__icon {
  font-size: 1.6rem;
  color: $signal-green;
}

.receipt__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;

  span { color: $ink-300; font-size: 0.85rem; }
}

.receipt__actions {
  display: flex;
  gap: $space-2;
  flex-wrap: wrap;
}

@media (prefers-reduced-motion: reduce) {
  .bar-enter-active,
  .bar-leave-active { transition: none; }
}
</style>
