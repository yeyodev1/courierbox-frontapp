<script setup lang="ts">
/**
 * Counter invoicing — the step the proposal calls "facturar en el counter".
 * The client gets the invoice by email plus a ready-to-send WhatsApp message.
 */
import { computed, ref } from 'vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppConfirmModal from '@/components/ui/AppConfirmModal.vue'
import { WHATSAPP_DISPLAY, whatsappUrl } from '@/config/contact'
import FacturacionTotales from './Facturacion/FacturacionTotales.vue'
import { money, useFacturacion } from './Facturacion/useFacturacion'

const f = useFacturacion()
const confirming = ref(false)

const whatsappFactura = computed(() => {
  const factura = f.lastFactura.value
  if (!factura) return '#'
  return whatsappUrl(
    `Hola Courier Box, soy ${factura.cliente}. Recibí mi factura por ${money(factura.total)} y quiero coordinar el pago.`,
  )
})

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
          placeholder="Busca por casillero, WR, tracking o nombre del cliente…"
          aria-label="Buscar paquetes facturables"
        />
        <span v-if="f.searching.value" class="spin"><i class="fa-solid fa-circle-notch fa-spin" /></span>
      </div>

      <div v-if="f.searching.value" aria-busy="true">
        <AppSkeleton variant="card" height="64px" :count="4" gap="0.6rem" />
      </div>

      <p v-else-if="f.searched.value && !f.paquetes.value.length" class="empty">
        <i class="fa-solid fa-file-invoice" aria-hidden="true" />
        No hay paquetes pendientes de facturar con ese criterio.
      </p>

      <template v-else-if="f.paquetes.value.length">
        <div class="results-head">
          <span>{{ f.paquetes.value.length }} paquete(s) por facturar</span>
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
      <FacturacionTotales
        v-if="f.seleccionados.value.length"
        :cliente="f.cliente.value"
        :totales="f.totales.value"
        :clientes-distintos="f.clientesDistintos.value"
        :puede-facturar="f.puedeFacturar.value"
        @emitir="confirming = true"
      />
    </Transition>

    <section v-if="f.lastFactura.value" class="panel receipt">
      <div class="receipt__icon"><i class="fa-solid fa-circle-check" aria-hidden="true" /></div>
      <div class="receipt__body">
        <strong>Factura emitida · {{ money(f.lastFactura.value.total) }}</strong>
        <span>Cliente {{ f.lastFactura.value.cliente }}. Enviada por correo y lista para WhatsApp.</span>
      </div>
      <a class="btn wa" :href="whatsappFactura" target="_blank" rel="noopener" :title="WHATSAPP_DISPLAY">
        <i class="fa-brands fa-whatsapp" aria-hidden="true" /> Enviar por WhatsApp
      </a>
    </section>

    <AppConfirmModal
      :open="confirming"
      title="Emitir factura electrónica"
      :message="`Se emitirá una factura por ${money(f.totales.value.totalGeneral)} a nombre de ${f.cliente.value.nombre}. Se envía a Contifico y no se puede deshacer desde aquí.`"
      confirm-label="Emitir factura"
      variant="info"
      loading-label="Emitiendo…"
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
  gap: $space-4;
  border-color: rgba($signal-green, 0.35);
  background: rgba($signal-green, 0.06);

  &__icon { font-size: 1.6rem; color: $signal-green; }
  &__body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
  &__body span { color: $ink-300; font-size: 0.85rem; }
}

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
}

.bar-enter-active,
.bar-leave-active {
  transition: opacity $dur-fast ease, transform $dur-base $ease-out-expo;
}

.bar-enter-from,
.bar-leave-to { opacity: 0; transform: translateY(12px); }

@media (prefers-reduced-motion: reduce) {
  .pkg,
  .bar-enter-active,
  .bar-leave-active { transition: none; }
}
</style>
