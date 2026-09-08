<script setup lang="ts">
/**
 * Counter invoicing — the step the proposal calls "facturar en el counter".
 * The client gets the invoice by email plus a ready-to-send WhatsApp message.
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppConfirmModal from '@/components/ui/AppConfirmModal.vue'
import { WHATSAPP_DISPLAY, whatsappUrl } from '@/config/contact'
import { useAuthStore } from '@/stores/auth.store'
import DatosFacturacionModal from './Facturacion/DatosFacturacionModal.vue'
import FacturaDetalleModal from './Facturacion/FacturaDetalleModal.vue'
import PaqueteDetalleModal from './Facturacion/PaqueteDetalleModal.vue'
import type { PaqueteFacturable } from '@/services/facturacion.api'
import { formatDate } from '@/utils/format'
import FacturacionTotales from './Facturacion/FacturacionTotales.vue'
import { money, SRI_UI, useFacturacion } from './Facturacion/useFacturacion'

const f = useFacturacion()
const route = useRoute()
const auth = useAuthStore()
const confirming = ref(false)

/** Cambiar el IVA es cosa de finanzas; el counter lo ve pero no lo toca. */
const puedeCambiarIva = computed(() => ['admin', 'gerencia', 'superadmin'].includes(auth.userRole ?? ''))

/** Opciones del selector propio de la app (nada de desplegables del navegador). */
const ivaOpciones = computed(() => f.ivaOpciones.value.map((pct) => ({ value: String(pct), label: `${pct} %` })))

function onCambiarIva(value: string) {
  const pct = Number(value)
  if (Number.isFinite(pct) && pct !== f.ivaPorcentaje.value) f.cambiarIva(pct)
}
const completando = ref(false)

/** Hay una selección válida de un solo cliente, pero le falta algo obligatorio. */
const faltanDatos = computed(
  () => f.seleccionados.value.length > 0 && !f.clientesDistintos.value && !!f.validacion.value && f.faltantesRequeridos.value.length > 0,
)

/** «Emitir»: si falta algo, primero el formulario; si no, directo a confirmar. */
function onEmitirClick() {
  if (faltanDatos.value) abrirDatos(true)
  else confirming.value = true
}

/** Guardar un perfil (nuevo o editado) desde el modal de datos de facturación. */
async function onGuardarPerfil(perfilId: string | null, datos: Parameters<typeof f.guardarPerfil>[1]) {
  const ok = await f.guardarPerfil(perfilId, datos)
  if (ok && f.puedeFacturar.value && abiertoPorFalta.value) {
    completando.value = false
    confirming.value = true
  }
}

/** Si el modal se abrió porque faltaba algo, al resolverlo sigue solo a emitir. */
const abiertoPorFalta = ref(false)

function abrirDatos(porFalta: boolean) {
  abiertoPorFalta.value = porFalta
  completando.value = true
}

function continuarDesdeModal() {
  if (!f.puedeFacturar.value) return
  completando.value = false
  confirming.value = true
}

// Desde Ingreso de carga se llega con ?q=<casillero>&sel=<WR>: el cliente ya
// buscado y la caja marcada, para facturar sin volver a escribir nada.
onMounted(() => {
  const q = typeof route.query.q === 'string' ? route.query.q : ''
  const sel = typeof route.query.sel === 'string' ? route.query.sel : ''
  if (q || sel) f.iniciarDesde({ q, sel })
  else f.cargarPendientes()
  f.cargarHistorial()
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

/** Con qué identificación salió: la registrada al emitir, si no la del cliente, si no consumidor final. */
function identificacionDe(fx: { facturadoA?: { identificacion: string } | null; masterClienteId?: { cedulaRuc?: string } | null; totalGeneral: number }) {
  const id = fx.facturadoA?.identificacion || fx.masterClienteId?.cedulaRuc || ''
  if (id === '9999999999999') return 'Consumidor final'
  return id || (fx.totalGeneral <= 50 ? 'Consumidor final' : 'Sin identificación')
}

/** WhatsApp para la factura abierta en detalle. */
const whatsappDetalle = computed(() => {
  const fx = f.facturaAbierta.value
  if (!fx) return '#'
  const nombre = fx.facturadoA?.razonSocial || fx.masterClienteId?.nombreOficial || ''
  return whatsappUrl(`Hola Courier Box, soy ${nombre}. Recibí mi factura ${fx.numeroFactura} por ${money(fx.totalGeneral)} y quiero coordinar el pago.`)
})

/** Desde el detalle de una caja: la deja como única selección y va a emitir. */
function facturarDesdeDetalle(p: PaqueteFacturable) {
  f.paqueteAbierto.value = null
  f.limpiar()
  f.toggle(p._id)
  f.vista.value = 'pendientes'
}

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
      <div class="iva" data-test="iva-global">
        <span class="iva__label">IVA del flete</span>
        <AppSelect
          v-if="puedeCambiarIva"
          class="iva__select"
          :model-value="String(f.ivaPorcentaje.value)"
          :options="ivaOpciones"
          :disabled="f.guardandoIva.value"
          data-test="iva-select"
          @update:model-value="onCambiarIva"
        />
        <strong v-else class="iva__valor" data-test="iva-valor">{{ f.ivaPorcentaje.value }} %</strong>
        <small>Global: aplica a todas las facturas. El arancel no lleva IVA.</small>
      </div>
    </header>

    <nav class="tabs" aria-label="Vista">
      <button type="button" class="tab" :class="{ active: f.vista.value === 'pendientes' }" data-test="tab-pendientes" @click="f.vista.value = 'pendientes'">
        <i class="fa-solid fa-box-open" aria-hidden="true" />
        <span>Por facturar</span>
        <b>{{ f.paquetes.value.length }}</b>
      </button>
      <button type="button" class="tab" :class="{ active: f.vista.value === 'facturadas' }" data-test="tab-facturadas" @click="f.vista.value = 'facturadas'">
        <i class="fa-solid fa-file-invoice-dollar" aria-hidden="true" />
        <span>Facturadas</span>
        <b>{{ f.facturas.value.length }}</b>
      </button>
    </nav>

    <section v-show="f.vista.value === 'pendientes'" class="panel" data-test="vista-pendientes">
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
              <button type="button" class="pkg__detalle" :data-test="`detalle-${p._id}`" title="Ver detalles" @click.prevent.stop="f.paqueteAbierto.value = p"><i class="fa-solid fa-circle-info" aria-hidden="true" /> Detalles</button>
            </label>
          </li>
        </ul>
      </template>
    </section>

    <Transition name="bar">
      <FacturacionTotales
        v-if="f.seleccionados.value.length && f.vista.value === 'pendientes'"
        :cliente="f.cliente.value"
        :totales="f.totales.value"
        :clientes-distintos="f.clientesDistintos.value"
        :puede-facturar="f.puedeFacturar.value"
        :faltan-datos="faltanDatos"
        :validando="f.validando.value"
        :motivo-bloqueo="motivoBloqueo"
        :consumidor-final="f.consumidorFinal.value && f.sinIdentificacion.value"
        :iva-porcentaje="f.ivaPorcentaje.value"
        @emitir="onEmitirClick"
        @datos="abrirDatos(false)"
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

    <DatosFacturacionModal
      :open="completando"
      v-model:consumidor-final="f.consumidorFinal.value"
      :perfiles="f.perfiles.value"
      :perfil-id="f.perfilId.value"
      :faltantes="f.faltantes.value"
      :consumidor-final-posible="f.consumidorFinalPosible.value"
      :guardando="f.guardandoCliente.value"
      :validando="f.validando.value"
      :listo="f.puedeFacturar.value"
      :total="money(f.totales.value.totalGeneral)"
      :casillero="f.cliente.value.casillero"
      @close="completando = false"
      @elegir="f.elegirPerfil"
      @guardar="onGuardarPerfil"
      @eliminar="f.eliminarPerfil"
      @continuar="continuarDesdeModal"
    />

    <section v-show="f.vista.value === 'facturadas'" class="panel historial" data-test="historial">
      <div class="historial__head">
        <div>
          <h2>Facturas emitidas</h2>
          <p>Cada factura con sus cajas, su estado en el SRI y el PDF. Toca una caja facturada aquí y sabes a qué factura pertenece.</p>
        </div>
        <div class="search small">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input v-model="f.filtroHistorial.value" type="search" placeholder="Buscar por número, cliente, cédula o casillero…" aria-label="Buscar facturas" data-test="buscar-facturas" />
        </div>
      </div>

      <div class="chips" role="group" aria-label="Filtrar por estado">
        <button type="button" class="chip" :class="{ active: f.filtroSri.value === 'todas' }" data-test="chip-todas" @click="f.filtroSri.value = 'todas'">Todas <b>{{ f.conteoSri.value.todas }}</b></button>
        <button type="button" class="chip ok" :class="{ active: f.filtroSri.value === 'autorizadas' }" data-test="chip-autorizadas" @click="f.filtroSri.value = 'autorizadas'"><i class="fa-solid fa-circle-check" aria-hidden="true" /> Autorizadas <b>{{ f.conteoSri.value.autorizadas }}</b></button>
        <button type="button" class="chip proceso" :class="{ active: f.filtroSri.value === 'proceso' }" data-test="chip-proceso" @click="f.filtroSri.value = 'proceso'"><i class="fa-solid fa-hourglass-half" aria-hidden="true" /> En proceso <b>{{ f.conteoSri.value.proceso }}</b></button>
        <button type="button" class="chip error" :class="{ active: f.filtroSri.value === 'rechazadas' }" data-test="chip-rechazadas" @click="f.filtroSri.value = 'rechazadas'"><i class="fa-solid fa-circle-xmark" aria-hidden="true" /> Rechazadas <b>{{ f.conteoSri.value.rechazadas }}</b></button>
      </div>

      <div v-if="f.cargandoHistorial.value && !f.facturas.value.length" aria-busy="true"><AppSkeleton variant="card" height="120px" :count="3" gap="0.75rem" /></div>
      <p v-else-if="!f.facturasFiltradas.value.length" class="empty"><i class="fa-solid fa-file-invoice" aria-hidden="true" /> {{ f.facturas.value.length ? 'Ninguna factura con ese estado.' : 'Todavía no hay facturas emitidas.' }}</p>
      <TransitionGroup v-else name="lista" tag="ul" class="tarjetas">
        <li v-for="fx in f.facturasFiltradas.value" :key="fx._id" class="tarjeta" :class="`tono-${SRI_UI[fx.estadoSri]?.tono ?? 'neutro'}`" :data-test="`factura-${fx._id}`">
          <div class="tarjeta__top">
            <button type="button" class="tarjeta__abrir" :data-test="`abrir-${fx._id}`" @click="f.abrirFactura(fx._id)">
              <span class="tarjeta__num">{{ fx.numeroFactura }} <i class="fa-solid fa-up-right-from-square" aria-hidden="true" /></span>
              <small>{{ formatDate(fx.createdAt) }} · abrir detalle</small>
            </button>
            <span class="sri-pill" :class="`sri-pill--${SRI_UI[fx.estadoSri]?.tono ?? 'neutro'}`">
              <i class="fa-solid" :class="SRI_UI[fx.estadoSri]?.tono === 'ok' ? 'fa-circle-check' : SRI_UI[fx.estadoSri]?.tono === 'error' ? 'fa-circle-xmark' : 'fa-hourglass-half'" aria-hidden="true" />
              {{ SRI_UI[fx.estadoSri]?.label ?? fx.estadoSri }}
            </span>
          </div>
          <div class="tarjeta__cliente">
            <strong>{{ fx.facturadoA?.razonSocial || fx.masterClienteId?.nombreOficial || '—' }}</strong>
            <small>{{ identificacionDe(fx) }}<template v-if="fx.masterClienteId?.codigoCasillero"> · casillero {{ fx.masterClienteId.codigoCasillero }}</template><template v-if="fx.masterClienteId?.nombreOficial && fx.facturadoA?.razonSocial && fx.facturadoA.razonSocial !== fx.masterClienteId.nombreOficial"> · cliente {{ fx.masterClienteId.nombreOficial }}</template></small>
          </div>
          <div class="tarjeta__cajas">
            <span v-for="p in fx.paquetes" :key="p._id" class="caja" :title="p.contenido">{{ p.wr || p.sh }}</span>
          </div>
          <div class="tarjeta__bottom">
            <span class="tarjeta__total">{{ money(fx.totalGeneral) }} <small>{{ fx.pesoTotalLb.toFixed(2) }} lb</small><small v-if="fx.estado === 'pagada'" class="pagada"> · Pagada</small></span>
            <span class="tarjeta__acciones">
              <a v-if="fx.pdfUrl" :href="fx.pdfUrl" target="_blank" rel="noopener"><i class="fa-solid fa-file-pdf" aria-hidden="true" /> PDF</a>
              <a v-if="fx.xmlUrl" :href="fx.xmlUrl" target="_blank" rel="noopener"><i class="fa-solid fa-file-code" aria-hidden="true" /> XML</a>
              <button v-if="fx.estadoSri !== 'autorizado' && fx.estadoSri !== 'simulado'" type="button" class="link" :disabled="f.sincronizandoId.value === fx._id" :data-test="`sri-${fx._id}`" @click="f.actualizarSriDe(fx._id)">
                <i class="fa-solid fa-rotate" :class="{ 'fa-spin': f.sincronizandoId.value === fx._id }" aria-hidden="true" /> Consultar SRI
              </button>
            </span>
          </div>
        </li>
      </TransitionGroup>
    </section>

    <FacturaDetalleModal
      :open="!!f.facturaAbierta.value || f.cargandoDetalle.value"
      :factura="f.facturaAbierta.value"
      :cargando="f.cargandoDetalle.value"
      :sincronizando="!!f.facturaAbierta.value && f.sincronizandoId.value === f.facturaAbierta.value._id"
      :whatsapp-url="whatsappDetalle"
      @close="f.facturaAbierta.value = null"
      @sri="f.facturaAbierta.value && f.actualizarSriDe(f.facturaAbierta.value._id)"
    />

    <PaqueteDetalleModal :paquete="f.paqueteAbierto.value" @close="f.paqueteAbierto.value = null" @facturar="facturarDesdeDetalle" />

    <AppConfirmModal
      :open="confirming"
      title="Emitir factura electrónica"
      :message="`Se emitirá una factura por ${money(f.totales.value.totalGeneral)} a nombre de ${nombreEnFactura} (IVA ${f.ivaPorcentaje.value} % sobre el flete). Se firma, se envía al SRI y no se puede deshacer desde aquí.`"
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
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-4;
  flex-wrap: wrap;
  h1 { margin: 0 0 $space-1; font-size: 1.5rem; }
  p { margin: 0; color: $ink-400; font-size: 0.9rem; }
}

.iva {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid rgba($brand-orange, 0.3);
  background: rgba($brand-orange, 0.06);
  min-width: 220px;

  &__label { color: $ink-400; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; }
  &__select { width: 100%; }
  &__valor { font-size: 1.2rem; color: $brand-orange; }
  small { color: $ink-500; font-size: 0.74rem; }
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

  &__detalle {
    flex: 0 0 auto;
    background: none;
    border: 1px solid rgba($ink-500, 0.25);
    border-radius: $radius-sm;
    color: $ink-300;
    font: inherit;
    font-size: 0.78rem;
    padding: 4px 10px;
    cursor: pointer;
    display: inline-flex;
    gap: 5px;
    align-items: center;
    &:hover { color: $brand-orange; border-color: rgba($brand-orange, 0.4); }
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

.tabs {
  display: flex;
  gap: $space-2;
  padding: 4px;
  border-radius: $radius-lg;
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.15);
}
.tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  min-height: 52px;
  border: none;
  border-radius: $radius-md;
  background: transparent;
  color: $ink-300;
  font: inherit;
  font-size: 0.98rem;
  font-weight: 600;
  cursor: pointer;
  transition: background $dur-fast ease, color $dur-fast ease;
  b { font-variant-numeric: tabular-nums; padding: 2px 10px; border-radius: $radius-pill; background: rgba($ink-500, 0.3); color: $ink-200; font-size: 0.82rem; }
  &:hover { color: $fg-dark; }
  &.active { background: rgba($brand-orange, 0.15); color: $brand-orange; b { background: $brand-orange; color: $ink-1000; } }
}

.chips { display: flex; gap: $space-2; flex-wrap: wrap; }
.chip {
  display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 0 $space-3;
  border-radius: $radius-pill; border: 1px solid rgba($ink-500, 0.3); background: $ink-850; color: $ink-300;
  font: inherit; font-size: 0.84rem; font-weight: 600; cursor: pointer; transition: all $dur-fast ease;
  b { padding: 1px 8px; border-radius: $radius-pill; background: rgba($ink-500, 0.3); font-size: 0.76rem; color: $ink-200; }
  &.ok i { color: $signal-green; } &.proceso i { color: $signal-amber; } &.error i { color: $signal-red; }
  &.active { border-color: $brand-orange; background: rgba($brand-orange, 0.12); color: $fg-dark; b { background: $brand-orange; color: $ink-1000; } }
}

.tarjetas { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: $space-3; }
.tarjeta {
  display: flex; flex-direction: column; gap: $space-3; padding: $space-4;
  border-radius: $radius-lg; border: 1px solid rgba($ink-500, 0.2); background: $ink-850;
  border-left-width: 4px;
  &.tono-ok { border-left-color: $signal-green; } &.tono-proceso { border-left-color: $signal-amber; } &.tono-error { border-left-color: $signal-red; } &.tono-neutro { border-left-color: $ink-500; }
  &__top { display: flex; justify-content: space-between; gap: $space-3; align-items: flex-start; > div { display: flex; flex-direction: column; } small { color: $ink-400; font-size: 0.76rem; } }
  &__num { font-family: inherit; font-weight: 700; font-size: 1.05rem; color: $fg-dark; font-variant-numeric: tabular-nums; i { font-size: 0.7rem; color: $brand-orange; margin-left: 4px; } }
  &__abrir { display: flex; flex-direction: column; align-items: flex-start; background: none; border: none; padding: 0; font: inherit; text-align: left; cursor: pointer; small { color: $ink-400; font-size: 0.76rem; } &:hover .tarjeta__num { color: $brand-orange; } }
  &__cliente { strong { display: block; color: $fg-dark; font-size: 0.95rem; } small { color: $ink-400; font-size: 0.78rem; } }
  &__cajas { display: flex; flex-wrap: wrap; gap: 6px; .caja { font-size: 0.74rem; padding: 3px 8px; border-radius: $radius-sm; background: rgba($ink-500, 0.25); color: $ink-200; font-variant-numeric: tabular-nums; } }
  &__bottom { display: flex; justify-content: space-between; align-items: center; gap: $space-3; flex-wrap: wrap; border-top: 1px solid rgba($ink-500, 0.15); padding-top: $space-3; }
  &__total { color: $brand-orange; font-weight: 700; font-size: 1.1rem; font-variant-numeric: tabular-nums; small { color: $ink-400; font-weight: 400; font-size: 0.78rem; } .pagada { color: $signal-green; } }
  &__acciones { display: flex; gap: $space-3; align-items: center; a { color: $brand-orange; text-decoration: none; font-size: 0.84rem; display: inline-flex; gap: 5px; align-items: center; } }
}
.lista-enter-active { transition: opacity $dur-base ease, transform $dur-base $ease-spring; }
.lista-leave-active { transition: opacity $dur-fast ease; position: absolute; }
.lista-enter-from { opacity: 0; transform: translateY(6px); }
.lista-leave-to { opacity: 0; }

.historial {
  &__head { display: flex; align-items: flex-start; justify-content: space-between; gap: $space-4; flex-wrap: wrap;
    h2 { margin: 0 0 2px; font-size: 1.1rem; } p { margin: 0; color: $ink-400; font-size: 0.85rem; max-width: 60ch; } }
  .search.small { flex: 0 1 320px; input { min-height: 40px; } }
}
.facturas { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: $space-2; }
.factura {
  display: grid; grid-template-columns: minmax(180px, 1.2fr) minmax(160px, 1.4fr) auto minmax(150px, 1fr) auto;
  gap: $space-4; align-items: center; padding: $space-3 $space-4; border-radius: $radius-md; border: 1px solid rgba($ink-500, 0.2); background: $ink-850;
  @media (max-width: 860px) { grid-template-columns: 1fr 1fr; }
  strong { display: block; color: $fg-dark; font-size: 0.9rem; } small { display: block; color: $ink-400; font-size: 0.76rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  &__total { font-variant-numeric: tabular-nums; color: $brand-orange; font-weight: 700; }
  &__sri { display: flex; flex-direction: column; gap: 4px; .pagada { color: $signal-green; } }
  &__acciones { display: flex; gap: $space-3; align-items: center; a { color: $brand-orange; text-decoration: none; font-size: 0.82rem; display: inline-flex; gap: 5px; align-items: center; } }
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
