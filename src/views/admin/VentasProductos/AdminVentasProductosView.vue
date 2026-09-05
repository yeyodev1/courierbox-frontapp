<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToastStore } from '@/stores/toast.store'
import { useVentasProductos, type FiltroCobro, type Venta } from './useVentasProductos'
import InventarioPanel from './InventarioPanel.vue'
import VentaForm from './VentaForm.vue'
import PagosVentaModal from './PagosVentaModal.vue'
import { formatDate } from '@/utils/format'

const toast = useToastStore()
const vp = useVentasProductos()
const tab = ref<'vender' | 'inventario'>('vender')
const money = (v: unknown) => `$${(Number(v) || 0).toFixed(2)}`
/**
 * Sale dates are days, not instants: the API stores them at UTC midnight, so
 * rendering them in Ecuador's local zone would walk every one back a day —
 * the "pongo 28 y sale 27" that the shared formatter already handles.
 */
const fecha = (d: string) => formatDate(d)

const vencidas = computed(() => vp.recordatorios.filter((r: any) => r.vencida).length)

const FILTROS: { value: FiltroCobro; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'con_saldo', label: 'Con saldo' },
  { value: 'pagado', label: 'Pagadas' },
]

const ventaSel = ref<Venta | null>(null)
const guardandoPago = ref(false)
const showPagos = computed(() => !!ventaSel.value)

function abrirPagos(venta: Venta) {
  ventaSel.value = venta
}

/** Keeps the open modal on the freshly returned sale, so the history updates. */
function refrescarSeleccion(actualizada: Venta | undefined) {
  ventaSel.value = actualizada
    ? (vp.ventas.find((v: Venta) => v._id === actualizada._id) ?? actualizada)
    : null
}

async function registrarAbono(payload: any) {
  if (!ventaSel.value) return
  guardandoPago.value = true
  try {
    const actualizada = await vp.registrarAbono(ventaSel.value._id, payload)
    refrescarSeleccion(actualizada)
    toast.showNotification('Abono registrado', 'success')
  } catch (e: any) {
    toast.showNotification(e.message || 'No se pudo registrar el abono', 'error')
  } finally {
    guardandoPago.value = false
  }
}

async function eliminarAbono(abonoId: string) {
  if (!ventaSel.value) return
  guardandoPago.value = true
  try {
    const actualizada = await vp.eliminarAbono(ventaSel.value._id, abonoId)
    refrescarSeleccion(actualizada)
    toast.showNotification('Abono eliminado y reversado en el ledger', 'success')
  } catch (e: any) {
    toast.showNotification(e.message || 'No se pudo eliminar el abono', 'error')
  } finally {
    guardandoPago.value = false
  }
}

async function cambiarFiltro(valor: FiltroCobro) {
  try {
    await vp.setFiltroCobro(valor)
  } catch (e: any) {
    toast.showNotification(e.message || 'Error al filtrar', 'error')
  }
}

onMounted(async () => {
  try {
    await vp.loadAll()
  } catch (e: any) {
    toast.showNotification(e.message || 'Error al cargar', 'error')
  }
})
</script>

<template>
  <div class="page-shell">
    <header class="page-header">
      <div>
        <h2 class="page-title">Ventas de productos</h2>
        <p class="page-subtitle">Inventario propio, ventas, crédito y recordatorios de cobro</p>
      </div>

      <div class="header-stats">
        <div class="stat" :class="{ alerta: vp.resumen.pendiente > 0 }">
          <span>Pendiente de cobro</span>
          <strong>{{ money(vp.resumen.pendiente) }}</strong>
          <em v-if="vp.resumen.conSaldo">{{ vp.resumen.conSaldo }} venta(s) con saldo</em>
        </div>
        <div class="stat">
          <span>Cobrado</span>
          <strong>{{ money(vp.resumen.cobrado) }}</strong>
          <em>de {{ money(vp.resumen.total) }}</em>
        </div>
        <div v-if="vp.recordatorios.length" class="stat" :class="{ alerta: vencidas > 0 }">
          <span>Cuotas vencidas</span>
          <strong>{{ vencidas }}</strong>
        </div>
      </div>
    </header>

    <nav class="tabs" role="tablist">
      <button role="tab" :aria-selected="tab === 'vender'" :class="{ on: tab === 'vender' }" @click="tab = 'vender'">
        <i class="fa-solid fa-cart-shopping" /> Vender
      </button>
      <button role="tab" :aria-selected="tab === 'inventario'" :class="{ on: tab === 'inventario' }" @click="tab = 'inventario'">
        <i class="fa-solid fa-boxes-stacked" /> Inventario
        <em v-if="vp.inventario.length">{{ vp.inventario.length }}</em>
      </button>
    </nav>

    <template v-if="tab === 'vender'">
      <VentaForm :vp="vp" />

      <section v-if="vp.recordatorios.length" class="panel">
        <div class="panel-head">
          <div>
            <h3>Recordatorios de cobro</h3>
            <p>Cuotas de crédito con fecha dentro de los próximos 30 días.</p>
          </div>
        </div>

        <div class="data-list">
          <article v-for="r in vp.recordatorios" :key="`${r.ventaId}-${r.cuotaIndex}`" class="data-row" :class="{ vencida: r.vencida }">
            <div class="row-main">
              <strong>{{ r.clienteNombre }}</strong>
              <p>{{ r.productoNombre }}</p>
            </div>
            <div class="row-side">
              <span class="tag" :class="r.vencida ? 'vencida' : ''">{{ fecha(r.fecha) }}{{ r.vencida ? ' · vencida' : '' }}</span>
              <strong class="money">{{ money(r.monto) }}</strong>
            </div>
          </article>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h3>Ventas recientes</h3>
            <p>Últimas 50 ventas registradas. Toca una para registrar o corregir sus pagos.</p>
          </div>
          <div class="filtros" role="group" aria-label="Filtrar ventas por cobro">
            <button
              v-for="f in FILTROS"
              :key="f.value"
              type="button"
              :class="{ on: vp.filtroCobro === f.value }"
              :aria-pressed="vp.filtroCobro === f.value"
              @click="cambiarFiltro(f.value)"
            >
              {{ f.label }}
            </button>
          </div>
        </div>

        <div v-if="!vp.loading && !vp.ventas.length" class="empty-state">
          <i class="fa-solid fa-receipt" />
          <strong>Aún no hay ventas registradas</strong>
          <p>La primera venta que guardes aparecerá aquí.</p>
        </div>

        <div v-else class="data-list">
          <article
            v-for="v in vp.ventas"
            :key="v._id"
            class="data-row clickable"
            role="button"
            tabindex="0"
            @click="abrirPagos(v)"
            @keydown.enter.prevent="abrirPagos(v)"
            @keydown.space.prevent="abrirPagos(v)"
          >
            <div class="row-main">
              <strong>{{ v.clienteNombre || 'Sin cliente' }}</strong>
              <p>{{ v.productoNombre }} × {{ v.cantidad }} · {{ fecha(v.fecha) }}</p>
            </div>
            <div class="row-mid">
              <span class="tag">{{ v.metodoPago || 'sin método' }}</span>
              <!-- Every sale states its balance, credit or not: a cash sale handed
                   over unpaid is money owed just the same, and used to read as $0. -->
              <span v-if="v.saldo > 0" class="tag debe">Debe {{ money(v.saldo) }}</span>
              <span v-else class="tag pagada">Pagada</span>
            </div>
            <div class="row-side">
              <strong class="money">{{ money(v.total) }}</strong>
              <p>{{ v.vendedorNombre }}</p>
            </div>
          </article>
        </div>
      </section>
    </template>

    <InventarioPanel v-else :vp="vp" />

    <PagosVentaModal
      :show="showPagos"
      :venta="ventaSel"
      :saving="guardandoPago"
      @close="ventaSel = null"
      @registrar="registrarAbono"
      @eliminar="eliminarAbono"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './ventas-ui' as *;

@include panel;
@include lists;

.page-shell { display: flex; flex-direction: column; gap: $space-5; }

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: $space-5;
  flex-wrap: wrap;
}
.header-stats { display: flex; gap: $space-3; }
.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: $space-2 $space-4;
  border: 1px solid rgba($ink-500, 0.16);
  border-radius: 12px;
  background: rgba($ink-1000, 0.35);

  span { font-size: 0.68rem; letter-spacing: 0.06em; text-transform: uppercase; color: $ink-400; }
  strong { font-size: 1.15rem; color: $brand-orange; font-variant-numeric: tabular-nums; }
  em { font-size: 0.7rem; font-style: normal; color: $ink-400; }

  &.alerta {
    border-color: rgba($signal-red, 0.35);
    strong { color: #ff8a8f; }
  }
}

.filtros {
  display: flex;
  gap: 4px;
  padding: 3px;
  background: rgba($ink-1000, 0.45);
  border: 1px solid rgba($ink-500, 0.14);
  border-radius: 999px;

  button {
    border: 0;
    background: transparent;
    color: $ink-400;
    font-size: 0.78rem;
    font-weight: 600;
    padding: 0.35rem 0.85rem;
    border-radius: 999px;
    cursor: pointer;

    &.on { background: rgba($brand-orange, 0.16); color: $brand-orange; }
  }
}

/* The whole row opens the sale's payments, so it has to read as a control. */
.data-row.clickable {
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover,
  &:focus-visible {
    border-color: rgba($brand-orange, 0.35);
    background: rgba($brand-orange, 0.05);
  }

  &:focus-visible { outline: 2px solid rgba($brand-orange, 0.6); outline-offset: 2px; }
}

.tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: rgba($ink-1000, 0.45);
  border: 1px solid rgba($ink-500, 0.14);
  border-radius: 999px;
  align-self: flex-start;
  max-width: 100%;
  overflow-x: auto;

  button {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    padding: $space-2 $space-5;
    background: transparent;
    border: none;
    border-radius: 999px;
    color: $ink-300;
    font-family: inherit;
    font-size: 0.88rem;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition: background 0.16s ease, color 0.16s ease;

    &:hover:not(.on) { background: rgba($ink-500, 0.14); color: $fg-dark; }

    &.on {
      background: $brand-orange;
      color: $ink-1000;
      font-weight: 700;
      box-shadow: 0 3px 12px rgba($brand-orange, 0.28);
    }

    em {
      font-style: normal;
      font-size: 0.72rem;
      padding: 1px 7px;
      border-radius: 999px;
      background: rgba($ink-1000, 0.22);
    }

    &:not(.on) em { background: rgba($ink-500, 0.2); }
  }
}

.row-main { min-width: 0; flex: 1 1 200px; }
.row-mid { display: flex; flex-wrap: wrap; gap: 6px; flex: 0 1 auto; }
.row-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  text-align: right;
}
.data-row.vencida { border-color: rgba($signal-red, 0.4); background: rgba($signal-red, 0.06); }

@media (max-width: 640px) {
  .data-row { flex-direction: column; align-items: flex-start; }
  .row-side { align-items: flex-start; text-align: left; }
}
</style>
