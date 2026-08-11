<script setup lang="ts">
/**
 * Counter pickup: search the client's packages, select everything they are
 * taking, capture one signature, and release the whole batch at once.
 * Replaces the per-package paper slips described in the V2.2 proposal.
 */
import { computed, onMounted, ref, watch } from 'vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppOverlay from '@/components/ui/AppOverlay.vue'
import AppSignaturePad from '@/components/ui/AppSignaturePad.vue'
import AppConfirmModal from '@/components/ui/AppConfirmModal.vue'
import {
  retirosCounterApi,
  type PaqueteDisponible,
  type RetiroCounter,
} from '@/services/retiros_counter.api'
import { useToastStore } from '@/stores/toast.store'
import { WHATSAPP_DISPLAY, whatsappUrl } from '@/config/contact'

const toast = useToastStore()

const query = ref('')
const searching = ref(false)
const searched = ref(false)
const disponibles = ref<PaqueteDisponible[]>([])
const selectedIds = ref<Set<string>>(new Set())

const historial = ref<RetiroCounter[]>([])
const loadingHistorial = ref(true)

const showFirma = ref(false)
const firmaDataUrl = ref('')
const saving = ref(false)
const lastRetiro = ref<RetiroCounter | null>(null)

const otroRetira = ref(false)
const form = ref({
  retiradoPorNombre: '',
  retiradoPorCedula: '',
  retiradoPorParentesco: '',
  observaciones: '',
})

const anularTarget = ref<RetiroCounter | null>(null)
const anulando = ref(false)

const seleccionados = computed(() =>
  disponibles.value.filter((p) => selectedIds.value.has(p._id)),
)

const cliente = computed(() => {
  const first = seleccionados.value[0]
  const master = first?.masterClienteId
  return {
    masterClienteId: master?._id,
    nombre: master?.nombre || first?.consigneeLimpio || first?.consigneeNombre || '',
    identificacion: master?.identificacion || '',
    email: master?.email || '',
    telefono: master?.telefono || '',
    codigoCasillero: master?.codigoCasillero || '',
  }
})

/** Guard rail: one signature must cover one client, never a mixed batch. */
const clientesDistintos = computed(() => {
  const keys = new Set(
    seleccionados.value.map(
      (p) => p.masterClienteId?._id || p.consigneeLimpio || p.consigneeNombre || '',
    ),
  )
  return keys.size > 1
})

const totales = computed(() => ({
  paquetes: seleccionados.value.length,
  peso: seleccionados.value.reduce((sum, p) => sum + (Number(p.pesoLb) || 0), 0),
}))

const puedeFirmar = computed(
  () => seleccionados.value.length > 0 && !clientesDistintos.value && Boolean(cliente.value.nombre),
)

let searchTimer: number | undefined

watch(query, (value) => {
  window.clearTimeout(searchTimer)
  if (value.trim().length < 2) {
    disponibles.value = []
    searched.value = false
    return
  }
  searchTimer = window.setTimeout(buscar, 350)
})

async function buscar() {
  searching.value = true
  try {
    disponibles.value = await retirosCounterApi.disponibles(query.value.trim())
    searched.value = true
  } catch (e: any) {
    toast.showNotification(e.message || 'No se pudo buscar paquetes', 'error')
  } finally {
    searching.value = false
  }
}

function toggle(id: string) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

function seleccionarTodos() {
  selectedIds.value = new Set(disponibles.value.map((p) => p._id))
}

function limpiarSeleccion() {
  selectedIds.value = new Set()
}

function abrirFirma() {
  firmaDataUrl.value = ''
  otroRetira.value = false
  form.value = {
    retiradoPorNombre: '',
    retiradoPorCedula: '',
    retiradoPorParentesco: '',
    observaciones: '',
  }
  showFirma.value = true
}

async function confirmarRetiro() {
  if (!firmaDataUrl.value) {
    toast.showNotification('Falta la firma del cliente', 'warning')
    return
  }
  saving.value = true
  try {
    const retiro = await retirosCounterApi.crear({
      masterClienteId: cliente.value.masterClienteId,
      clienteNombre: cliente.value.nombre,
      clienteIdentificacion: cliente.value.identificacion,
      clienteEmail: cliente.value.email,
      clienteTelefono: cliente.value.telefono,
      codigoCasillero: cliente.value.codigoCasillero,
      items: seleccionados.value.map((p) => ({
        paqueteId: p._id,
        referencia: p.wr || p.sh || p.trackingOriginal,
        descripcion: p.contenido,
        pesoLb: Number(p.pesoLb) || 0,
        valor: 0,
      })),
      firmaDataUrl: firmaDataUrl.value,
      retiradoPorNombre: otroRetira.value ? form.value.retiradoPorNombre : cliente.value.nombre,
      retiradoPorCedula: otroRetira.value ? form.value.retiradoPorCedula : cliente.value.identificacion,
      retiradoPorParentesco: otroRetira.value ? form.value.retiradoPorParentesco : '',
      observaciones: form.value.observaciones,
    })

    lastRetiro.value = retiro
    showFirma.value = false
    limpiarSeleccion()
    disponibles.value = []
    query.value = ''
    searched.value = false
    await cargarHistorial()
    toast.showNotification(
      `Retiro firmado · ${retiro.totalPaquetes} paquete(s). Comprobante enviado al cliente.`,
      'success',
    )
  } catch (e: any) {
    toast.showNotification(e.data?.error || e.message || 'No se pudo registrar el retiro', 'error')
  } finally {
    saving.value = false
  }
}

async function cargarHistorial() {
  loadingHistorial.value = true
  try {
    historial.value = await retirosCounterApi.listar({ limit: 40 })
  } catch (e: any) {
    toast.showNotification(e.message || 'No se pudo cargar el historial', 'error')
  } finally {
    loadingHistorial.value = false
  }
}

async function confirmarAnulacion() {
  if (!anularTarget.value) return
  anulando.value = true
  try {
    await retirosCounterApi.anular(anularTarget.value._id, 'Anulado desde counter')
    toast.showNotification('Retiro anulado. Los paquetes vuelven a estar disponibles.', 'success')
    anularTarget.value = null
    await cargarHistorial()
  } catch (e: any) {
    toast.showNotification(e.data?.error || e.message || 'No se pudo anular', 'error')
  } finally {
    anulando.value = false
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })
}

function folio(id: string) {
  return id.slice(-8).toUpperCase()
}

/**
 * No CRM and no WhatsApp API: we compose the message and open a chat on the
 * Courier Box line so the operator sends it in one tap.
 */
function whatsappRetiroUrl(retiro: RetiroCounter) {
  const texto =
    `Hola Courier Box, soy ${retiro.clienteNombre}. ` +
    `Retiré ${retiro.totalPaquetes} paquete(s) en counter (comprobante #${folio(retiro._id)}).` +
    (retiro.comprobanteUrl ? ` Comprobante: ${retiro.comprobanteUrl}` : '')
  return whatsappUrl(texto)
}

onMounted(cargarHistorial)
</script>

<template>
  <div class="counter">
    <header class="head">
      <div>
        <h1>Counter digital</h1>
        <p>Una sola firma libera todos los paquetes que el cliente retira hoy. Sin papel.</p>
      </div>
    </header>

    <!-- ── Búsqueda ─────────────────────────────────────────────── -->
    <section class="panel">
      <div class="search">
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true" />
        <input
          v-model="query"
          type="search"
          placeholder="Busca por casillero, WR, tracking o nombre del cliente…"
          aria-label="Buscar paquetes disponibles"
        />
        <span v-if="searching" class="search__spin"><i class="fa-solid fa-circle-notch fa-spin" /></span>
      </div>

      <div v-if="searching" class="results" aria-busy="true">
        <AppSkeleton variant="card" height="64px" :count="4" gap="0.6rem" />
      </div>

      <p v-else-if="searched && !disponibles.length" class="empty">
        <i class="fa-solid fa-box-open" aria-hidden="true" />
        No hay paquetes disponibles para retiro con ese criterio.
      </p>

      <template v-else-if="disponibles.length">
        <div class="results-head">
          <span>{{ disponibles.length }} paquete(s) disponible(s)</span>
          <div>
            <button type="button" class="link" @click="seleccionarTodos">Seleccionar todos</button>
            <button type="button" class="link" @click="limpiarSeleccion">Limpiar</button>
          </div>
        </div>

        <ul class="results">
          <li v-for="p in disponibles" :key="p._id">
            <label class="pkg" :class="{ selected: selectedIds.has(p._id) }">
              <input
                type="checkbox"
                :checked="selectedIds.has(p._id)"
                @change="toggle(p._id)"
              />
              <span class="pkg__body">
                <strong>{{ p.wr || p.sh || p.trackingOriginal }}</strong>
                <span class="pkg__desc">{{ p.contenido || 'Sin descripción' }}</span>
                <span class="pkg__meta">
                  {{ p.masterClienteId?.nombre || p.consigneeLimpio || p.consigneeNombre }}
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

    <!-- ── Barra de retiro ──────────────────────────────────────── -->
    <Transition name="bar">
      <section v-if="seleccionados.length" class="bar">
        <div class="bar__info">
          <strong>{{ totales.paquetes }}</strong> paquete(s) ·
          <strong>{{ totales.peso.toFixed(2) }}</strong> lb
          <span v-if="cliente.nombre" class="bar__cliente">para {{ cliente.nombre }}</span>
        </div>
        <p v-if="clientesDistintos" class="bar__warn">
          <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" />
          Seleccionaste paquetes de clientes distintos. Un retiro cubre a un solo cliente.
        </p>
        <button type="button" class="btn primary" :disabled="!puedeFirmar" @click="abrirFirma">
          <i class="fa-solid fa-signature" aria-hidden="true" /> Firmar y entregar
        </button>
      </section>
    </Transition>

    <!-- ── Último comprobante ───────────────────────────────────── -->
    <section v-if="lastRetiro" class="panel receipt">
      <div class="receipt__icon"><i class="fa-solid fa-circle-check" aria-hidden="true" /></div>
      <div class="receipt__body">
        <strong>Retiro #{{ folio(lastRetiro._id) }} firmado</strong>
        <span>
          {{ lastRetiro.totalPaquetes }} paquete(s) entregados a {{ lastRetiro.retiradoPorNombre }}.
          {{ lastRetiro.clienteEmail ? 'Comprobante enviado por correo.' : 'Cliente sin correo registrado.' }}
        </span>
      </div>
      <div class="receipt__actions">
        <a
          v-if="lastRetiro.comprobanteUrl"
          class="btn ghost"
          :href="lastRetiro.comprobanteUrl"
          target="_blank"
          rel="noopener"
        >
          <i class="fa-solid fa-file-pdf" aria-hidden="true" /> Ver PDF
        </a>
        <a
          class="btn wa"
          :href="whatsappRetiroUrl(lastRetiro)"
          target="_blank"
          rel="noopener"
          :title="`Abrir WhatsApp (${WHATSAPP_DISPLAY})`"
        >
          <i class="fa-brands fa-whatsapp" aria-hidden="true" /> Enviar por WhatsApp
        </a>
      </div>
    </section>

    <!-- ── Historial ────────────────────────────────────────────── -->
    <section class="panel">
      <div class="panel__head">
        <h2>Retiros recientes</h2>
        <button type="button" class="link" @click="cargarHistorial">Actualizar</button>
      </div>

      <div v-if="loadingHistorial" aria-busy="true">
        <AppSkeleton variant="card" height="70px" :count="4" gap="0.6rem" />
      </div>

      <p v-else-if="!historial.length" class="empty">
        <i class="fa-solid fa-clock-rotate-left" aria-hidden="true" />
        Todavía no hay retiros registrados.
      </p>

      <ul v-else class="historial">
        <li v-for="r in historial" :key="r._id" :class="{ anulado: r.estado === 'anulado' }">
          <div class="historial__main">
            <strong>#{{ folio(r._id) }} · {{ r.clienteNombre }}</strong>
            <span>
              {{ r.totalPaquetes }} paquete(s) · {{ r.totalPesoLb.toFixed(2) }} lb ·
              {{ formatDate(r.firmadoEn) }}
            </span>
            <span class="historial__by">Atendió {{ r.atendidoPorNombre || '—' }}</span>
          </div>
          <div class="historial__actions">
            <span v-if="r.estado === 'anulado'" class="tag danger">Anulado</span>
            <a v-if="r.comprobanteUrl" :href="r.comprobanteUrl" target="_blank" rel="noopener" class="link">
              <i class="fa-solid fa-file-pdf" aria-hidden="true" /> PDF
            </a>
            <button
              v-if="r.estado === 'firmado'"
              type="button"
              class="link danger"
              @click="anularTarget = r"
            >
              Anular
            </button>
          </div>
        </li>
      </ul>
    </section>

    <!-- ── Modal de firma ───────────────────────────────────────── -->
    <AppOverlay
      :open="showFirma"
      label="Firma de retiro"
      :persistent="saving"
      @close="showFirma = false"
    >
      <div class="modal-card wide firma-modal">
        <div class="firma-modal__head">
          <div>
            <h3>Confirmar retiro</h3>
            <p>
              {{ totales.paquetes }} paquete(s) · {{ totales.peso.toFixed(2) }} lb ·
              {{ cliente.nombre }}
            </p>
          </div>
          <button type="button" class="close" :disabled="saving" @click="showFirma = false">
            <i class="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div class="firma-modal__body">
          <ul class="mini-list">
            <li v-for="p in seleccionados" :key="p._id">
              <strong>{{ p.wr || p.sh || p.trackingOriginal }}</strong>
              <span>{{ p.contenido || 'Sin descripción' }}</span>
              <span class="mini-list__peso">{{ (Number(p.pesoLb) || 0).toFixed(2) }} lb</span>
            </li>
          </ul>

          <label class="check">
            <input v-model="otroRetira" type="checkbox" />
            <span>Retira otra persona (no el titular)</span>
          </label>

          <div v-if="otroRetira" class="grid-2">
            <label>
              <span>Nombre de quien retira *</span>
              <input v-model="form.retiradoPorNombre" type="text" placeholder="Nombre completo" />
            </label>
            <label>
              <span>Cédula</span>
              <input v-model="form.retiradoPorCedula" type="text" placeholder="0102030405" />
            </label>
            <label class="span-2">
              <span>Parentesco / relación</span>
              <input v-model="form.retiradoPorParentesco" type="text" placeholder="Hermano, asistente…" />
            </label>
          </div>

          <label class="field">
            <span>Observaciones (opcional)</span>
            <textarea v-model="form.observaciones" rows="2" placeholder="Caja abierta, faltante, etc." />
          </label>

          <AppSignaturePad
            :disabled="saving"
            label="Firma de quien retira"
            @change="firmaDataUrl = $event"
          />
        </div>

        <div class="firma-modal__foot">
          <button type="button" class="btn ghost" :disabled="saving" @click="showFirma = false">
            Cancelar
          </button>
          <button
            type="button"
            class="btn primary"
            :disabled="saving || !firmaDataUrl || (otroRetira && !form.retiradoPorNombre.trim())"
            @click="confirmarRetiro"
          >
            <i v-if="saving" class="fa-solid fa-circle-notch fa-spin" aria-hidden="true" />
            {{ saving ? 'Generando comprobante…' : 'Confirmar y enviar comprobante' }}
          </button>
        </div>
      </div>
    </AppOverlay>

    <AppConfirmModal
      :open="!!anularTarget"
      title="Anular retiro"
      :message="`Se anulará el retiro #${anularTarget ? folio(anularTarget._id) : ''} y sus paquetes volverán a estar disponibles.`"
      confirm-label="Anular retiro"
      variant="danger"
      loading-label="Anulando…"
      :confirm-loading="anulando"
      @cancel="anularTarget = null"
      @confirm="confirmarAnulacion"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/tokens/motion' as *;

.counter {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.head h1 {
  margin: 0 0 $space-1;
  font-size: 1.5rem;
}

.head p {
  margin: 0;
  color: $ink-400;
  font-size: 0.9rem;
}

.panel {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.15);
  border-radius: $radius-lg;
  padding: $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    margin: 0;
    font-size: 1.05rem;
  }
}

.search {
  position: relative;
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: 0 $space-4;
  border-radius: $radius-md;
  border: 1px solid rgba($ink-500, 0.25);
  background: $ink-850;

  > i {
    color: $ink-400;
  }

  input {
    flex: 1;
    min-height: 48px;
    border: none;
    background: transparent;
    color: $fg-dark;
    font: inherit;
    outline: none;
  }

  &:focus-within {
    border-color: rgba($brand-orange, 0.5);
  }
}

.search__spin {
  color: $brand-orange;
}

.results-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
  color: $ink-400;

  div {
    display: flex;
    gap: $space-3;
  }
}

.results {
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

  &:hover {
    border-color: rgba($brand-orange, 0.35);
  }

  &.selected {
    border-color: $brand-orange;
    background: rgba($brand-orange, 0.08);
  }

  input {
    width: 20px;
    height: 20px;
    accent-color: $brand-orange;
    flex: 0 0 auto;
  }
}

.pkg__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.pkg__desc,
.pkg__meta {
  font-size: 0.8rem;
  color: $ink-400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pkg__peso {
  flex: 0 0 auto;
  font-variant-numeric: tabular-nums;
  color: $ink-300;
  font-size: 0.85rem;
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

  span {
    color: $ink-300;
    font-size: 0.85rem;
  }
}

.historial {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;

  li {
    display: flex;
    align-items: center;
    gap: $space-4;
    padding: $space-3 $space-4;
    border-radius: $radius-md;
    border: 1px solid rgba($ink-500, 0.18);
    background: $ink-850;

    &.anulado {
      opacity: 0.6;
    }
  }
}

.historial__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;

  span {
    font-size: 0.82rem;
    color: $ink-400;
  }
}

.historial__by {
  color: $ink-500 !important;
}

.historial__actions {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.tag {
  padding: 2px $space-2;
  border-radius: $radius-pill;
  font-size: 0.72rem;

  &.danger {
    background: rgba($signal-red, 0.15);
    color: #ff8a8f;
  }
}

.link {
  background: none;
  border: none;
  padding: 0;
  color: $brand-orange;
  font: inherit;
  font-size: 0.82rem;
  cursor: pointer;
  text-decoration: none;

  &:hover { text-decoration: underline; }
  &.danger { color: #ff8a8f; }
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
  transition: background $dur-fast ease, opacity $dur-fast ease;

  &:disabled { opacity: 0.5; cursor: not-allowed; }

  &.primary { background: $brand-orange; color: $ink-1000; }
  &.ghost {
    background: rgba($ink-700, 0.8);
    border-color: rgba($ink-500, 0.25);
    color: $ink-200;
  }
  &.wa {
    background: rgba(37, 211, 102, 0.14);
    border-color: rgba(37, 211, 102, 0.4);
    color: #4ce08a;

    &:hover { background: rgba(37, 211, 102, 0.22); }
  }
}

.receipt__actions {
  display: flex;
  gap: $space-2;
  flex-wrap: wrap;
}

/* ── Modal de firma ── */
.firma-modal {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.15);
  border-radius: $radius-lg;
  width: min(100%, 680px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.firma-modal__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-4;
  padding: $space-5;
  border-bottom: 1px solid rgba($ink-500, 0.15);

  h3 { margin: 0 0 2px; font-size: 1.1rem; }
  p { margin: 0; color: $ink-400; font-size: 0.85rem; }

  .close {
    width: 34px;
    height: 34px;
    border-radius: $radius-sm;
    border: 1px solid rgba($ink-500, 0.2);
    background: rgba($ink-800, 0.8);
    color: $ink-300;
    cursor: pointer;
  }
}

.firma-modal__body {
  flex: 1 1 auto;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.firma-modal__foot {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  gap: $space-3;
  padding: $space-4 $space-5;
  border-top: 1px solid rgba($ink-500, 0.15);
  background: $ink-900;

  @media (max-width: 560px) {
    flex-direction: column-reverse;
  }
}

.mini-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 160px;
  overflow-y: auto;
  border: 1px solid rgba($ink-500, 0.18);
  border-radius: $radius-md;

  li {
    display: flex;
    align-items: center;
    gap: $space-3;
    padding: $space-2 $space-3;
    border-bottom: 1px solid rgba($ink-500, 0.12);
    font-size: 0.82rem;

    &:last-child { border-bottom: none; }

    span { color: $ink-400; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  }
}

.mini-list__peso {
  flex: 0 0 auto !important;
  font-variant-numeric: tabular-nums;
}

.check {
  display: flex;
  align-items: center;
  gap: $space-3;
  font-size: 0.88rem;
  color: $ink-200;
  cursor: pointer;

  input { width: 18px; height: 18px; accent-color: $brand-orange; }
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-3;

  @media (max-width: 560px) { grid-template-columns: 1fr; }

  .span-2 { grid-column: 1 / -1; }
}

.grid-2 label,
.field {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  span { font-size: 0.8rem; color: $ink-400; }

  input,
  textarea {
    min-height: 42px;
    padding: $space-2 $space-3;
    border-radius: $radius-sm;
    border: 1px solid rgba($ink-500, 0.25);
    background: $ink-850;
    color: $fg-dark;
    font: inherit;
    outline: none;
    resize: vertical;

    &:focus { border-color: rgba($brand-orange, 0.5); }
  }
}
</style>
