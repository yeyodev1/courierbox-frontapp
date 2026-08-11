<script setup lang="ts">
/**
 * Counter invoicing. Search a client's packages, tick what goes on the invoice,
 * see the total build up, and emit the electronic invoice to Contifico — the
 * step the proposal calls "facturar en el counter". The client gets the invoice
 * by email plus a ready-to-send WhatsApp message.
 */
import { computed, onMounted, ref, watch } from 'vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppConfirmModal from '@/components/ui/AppConfirmModal.vue'
import {
  calcularTotalesLocal,
  facturacionApi,
  type PaqueteFacturable,
  type Tarifas,
  type TotalesFactura,
} from '@/services/facturacion.api'
import { useToastStore } from '@/stores/toast.store'
import { WHATSAPP_DISPLAY, whatsappUrl } from '@/config/contact'

const toast = useToastStore()

const query = ref('')
const searching = ref(false)
const searched = ref(false)
const paquetes = ref<PaqueteFacturable[]>([])
const tarifas = ref<Tarifas>({ fleteLb: 0, arancelLb: 0, iva: 0 })
const selectedIds = ref<Set<string>>(new Set())

const confirming = ref(false)
const emitting = ref(false)
const lastFactura = ref<{ facturaId: string; cliente: string; total: number } | null>(null)

const seleccionados = computed(() => paquetes.value.filter((p) => selectedIds.value.has(p._id)))

const cliente = computed(() => {
  const master = seleccionados.value[0]?.masterClienteId
  return {
    id: master?._id,
    nombre: master?.nombreOficial || seleccionados.value[0]?.consigneeLimpio || '',
    identificacion: master?.cedulaRuc || '',
    email: master?.email || '',
    telefono: master?.telefono || '',
    casillero: master?.codigoCasillero || '',
  }
})

/** One invoice belongs to one client — the API rejects a mixed selection too. */
const clientesDistintos = computed(
  () => new Set(seleccionados.value.map((p) => p.masterClienteId?._id ?? '')).size > 1,
)

const totales = computed<TotalesFactura>(() =>
  calcularTotalesLocal(seleccionados.value.map((p) => Number(p.pesoLb) || 0), tarifas.value),
)

const puedeFacturar = computed(
  () => seleccionados.value.length > 0 && !clientesDistintos.value && Boolean(cliente.value.id),
)

let timer: number | undefined
watch(query, (value) => {
  window.clearTimeout(timer)
  if (value.trim().length < 2) {
    paquetes.value = []
    searched.value = false
    return
  }
  timer = window.setTimeout(buscar, 350)
})

async function buscar() {
  searching.value = true
  try {
    const data = await facturacionApi.facturables(query.value.trim())
    paquetes.value = data.paquetes
    tarifas.value = data.tarifas
    searched.value = true
  } catch (e: any) {
    toast.showNotification(e.message || 'No se pudo buscar paquetes', 'error')
  } finally {
    searching.value = false
  }
}

function toggle(id: string) {
  const next = new Set(selectedIds.value)
  next.has(id) ? next.delete(id) : next.add(id)
  selectedIds.value = next
}

function seleccionarTodos() {
  selectedIds.value = new Set(paquetes.value.map((p) => p._id))
}

function limpiar() {
  selectedIds.value = new Set()
}

async function emitir() {
  emitting.value = true
  try {
    const ids = seleccionados.value.map((p) => p._id)
    const res = await facturacionApi.generar(ids)
    lastFactura.value = {
      facturaId: res.facturaId,
      cliente: cliente.value.nombre,
      total: totales.value.totalGeneral,
    }
    toast.showNotification('Factura emitida y enviada al cliente.', 'success')
    confirming.value = false
    limpiar()
    paquetes.value = []
    query.value = ''
    searched.value = false
  } catch (e: any) {
    toast.showNotification(e.data?.error || e.message || 'No se pudo emitir la factura', 'error')
  } finally {
    emitting.value = false
  }
}

function money(n: number) {
  return `$${(Number(n) || 0).toFixed(2)}`
}

function whatsappFactura() {
  if (!lastFactura.value) return '#'
  return whatsappUrl(
    `Hola Courier Box, soy ${lastFactura.value.cliente}. Recibí mi factura por ${money(lastFactura.value.total)} y quiero coordinar el pago.`,
  )
}

onMounted(() => {
  // Tariffs arrive with the first search; nothing to preload.
})
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
          v-model="query"
          type="search"
          placeholder="Busca por casillero, WR, tracking o nombre del cliente…"
          aria-label="Buscar paquetes facturables"
        />
        <span v-if="searching" class="spin"><i class="fa-solid fa-circle-notch fa-spin" /></span>
      </div>

      <div v-if="searching" aria-busy="true">
        <AppSkeleton variant="card" height="64px" :count="4" gap="0.6rem" />
      </div>

      <p v-else-if="searched && !paquetes.length" class="empty">
        <i class="fa-solid fa-file-invoice" aria-hidden="true" />
        No hay paquetes pendientes de facturar con ese criterio.
      </p>

      <template v-else-if="paquetes.length">
        <div class="results-head">
          <span>{{ paquetes.length }} paquete(s) por facturar</span>
          <div>
            <button type="button" class="link" @click="seleccionarTodos">Seleccionar todos</button>
            <button type="button" class="link" @click="limpiar">Limpiar</button>
          </div>
        </div>

        <ul class="list">
          <li v-for="p in paquetes" :key="p._id">
            <label class="pkg" :class="{ selected: selectedIds.has(p._id) }">
              <input type="checkbox" :checked="selectedIds.has(p._id)" @change="toggle(p._id)" />
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

    <!-- Totales en vivo -->
    <Transition name="bar">
      <section v-if="seleccionados.length" class="totales">
        <div class="totales__cliente">
          <span class="muted">Cliente</span>
          <strong>{{ cliente.nombre || '—' }}</strong>
          <span class="muted">
            {{ cliente.casillero }}<template v-if="cliente.identificacion"> · {{ cliente.identificacion }}</template>
          </span>
          <span v-if="!cliente.email" class="warn-inline">
            <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" /> Sin correo: la factura no se enviará por email
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

        <button type="button" class="btn primary" :disabled="!puedeFacturar" @click="confirming = true">
          <i class="fa-solid fa-file-invoice-dollar" aria-hidden="true" /> Emitir factura
        </button>
      </section>
    </Transition>

    <!-- Resultado -->
    <section v-if="lastFactura" class="panel receipt">
      <div class="receipt__icon"><i class="fa-solid fa-circle-check" aria-hidden="true" /></div>
      <div class="receipt__body">
        <strong>Factura emitida · {{ money(lastFactura.total) }}</strong>
        <span>Cliente {{ lastFactura.cliente }}. Enviada por correo y lista para WhatsApp.</span>
      </div>
      <a class="btn wa" :href="whatsappFactura()" target="_blank" rel="noopener" :title="WHATSAPP_DISPLAY">
        <i class="fa-brands fa-whatsapp" aria-hidden="true" /> Enviar por WhatsApp
      </a>
    </section>

    <AppConfirmModal
      :open="confirming"
      title="Emitir factura electrónica"
      :message="`Se emitirá una factura por ${money(totales.totalGeneral)} a nombre de ${cliente.nombre}. Se envía a Contifico y no se puede deshacer desde aquí.`"
      confirm-label="Emitir factura"
      variant="info"
      loading-label="Emitiendo…"
      :confirm-loading="emitting"
      @cancel="confirming = false"
      @confirm="emitir"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/tokens/motion' as *;

.fact { display: flex; flex-direction: column; gap: $space-5; }

.head h1 { margin: 0 0 $space-1; font-size: 1.5rem; }
.head p { margin: 0; color: $ink-400; font-size: 0.9rem; }

.panel {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.15);
  border-radius: $radius-lg;
  padding: $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-4;
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

.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: $space-2; }

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
}

.pkg__body { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pkg__peso { flex: 0 0 auto; font-variant-numeric: tabular-nums; color: $ink-300; font-size: 0.85rem; }

.muted {
  font-size: 0.8rem;
  color: $ink-400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

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
}

.totales__cliente {
  flex: 1 1 190px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.totales__grid {
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

.bar-enter-active, .bar-leave-active {
  transition: opacity $dur-fast ease, transform $dur-base $ease-out-expo;
}
.bar-enter-from, .bar-leave-to { opacity: 0; transform: translateY(12px); }

.receipt {
  flex-direction: row;
  align-items: center;
  gap: $space-4;
  border-color: rgba($signal-green, 0.35);
  background: rgba($signal-green, 0.06);
}
.receipt__icon { font-size: 1.6rem; color: $signal-green; }
.receipt__body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.receipt__body span { color: $ink-300; font-size: 0.85rem; }

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

  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &.primary { background: $brand-orange; color: $ink-1000; }
  &.wa {
    background: rgba(37, 211, 102, 0.14);
    border-color: rgba(37, 211, 102, 0.4);
    color: #4ce08a;
    &:hover { background: rgba(37, 211, 102, 0.22); }
  }
}
</style>
