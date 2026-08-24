<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToastStore } from '@/stores/toast.store'
import { useVentasProductos } from './useVentasProductos'
import InventarioPanel from './InventarioPanel.vue'
import VentaForm from './VentaForm.vue'

const toast = useToastStore()
const vp = useVentasProductos()
const tab = ref<'vender' | 'inventario'>('vender')
const money = (v: unknown) => `$${(Number(v) || 0).toFixed(2)}`
const fecha = (d: string) => new Date(d).toLocaleDateString('es-EC')

const vencidas = computed(() => vp.recordatorios.filter((r: any) => r.vencida).length)
const porCobrar = computed(() => vp.recordatorios.reduce((a: number, r: any) => a + (Number(r.monto) || 0), 0))

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

      <div v-if="vp.recordatorios.length" class="header-stats">
        <div class="stat">
          <span>Por cobrar</span>
          <strong>{{ money(porCobrar) }}</strong>
        </div>
        <div class="stat" :class="{ alerta: vencidas > 0 }">
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
            <p>Últimas 50 ventas registradas.</p>
          </div>
        </div>

        <div v-if="!vp.loading && !vp.ventas.length" class="empty-state">
          <i class="fa-solid fa-receipt" />
          <strong>Aún no hay ventas registradas</strong>
          <p>La primera venta que guardes aparecerá aquí.</p>
        </div>

        <div v-else class="data-list">
          <article v-for="v in vp.ventas" :key="v._id" class="data-row">
            <div class="row-main">
              <strong>{{ v.clienteNombre || 'Sin cliente' }}</strong>
              <p>{{ v.productoNombre }} × {{ v.cantidad }} · {{ fecha(v.fecha) }}</p>
            </div>
            <div class="row-mid">
              <span class="tag">{{ v.metodoPago || 'sin método' }}</span>
              <span v-if="v.esCredito" class="tag credito">Saldo {{ money(v.saldo) }}</span>
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

  &.alerta {
    border-color: rgba($signal-red, 0.35);
    strong { color: #ff8a8f; }
  }
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
