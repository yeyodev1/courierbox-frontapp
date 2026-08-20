<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useToastStore } from '@/stores/toast.store'
import { useVentasProductos } from './useVentasProductos'
import InventarioPanel from './InventarioPanel.vue'
import VentaForm from './VentaForm.vue'

const toast = useToastStore()
const vp = useVentasProductos()
const tab = ref<'vender' | 'inventario'>('vender')
const money = (v: unknown) => `$${(Number(v) || 0).toFixed(2)}`
const fecha = (d: string) => new Date(d).toLocaleDateString('es-EC')

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
    <div class="page-header">
      <div>
        <h2 class="page-title">Ventas de productos</h2>
        <p class="page-subtitle">Inventario propio, ventas, crédito y recordatorios de cobro</p>
      </div>
    </div>

    <div class="tabs">
      <button :class="{ on: tab === 'vender' }" @click="tab = 'vender'">Vender</button>
      <button :class="{ on: tab === 'inventario' }" @click="tab = 'inventario'">Inventario</button>
    </div>

    <template v-if="tab === 'vender'">
      <VentaForm :vp="vp" />

      <section v-if="vp.recordatorios.length" class="panel">
        <h3>Recordatorios de cobro</h3>
        <div class="rec-list">
          <article v-for="r in vp.recordatorios" :key="`${r.ventaId}-${r.cuotaIndex}`" class="rec-row" :class="{ vencida: r.vencida }">
            <div>
              <strong>{{ r.clienteNombre }}</strong>
              <p>{{ r.productoNombre }}</p>
            </div>
            <div class="rec-right">
              <span class="rec-fecha">{{ fecha(r.fecha) }}<em v-if="r.vencida"> · vencida</em></span>
              <strong>{{ money(r.monto) }}</strong>
            </div>
          </article>
        </div>
      </section>

      <section class="panel">
        <h3>Ventas recientes</h3>
        <p v-if="!vp.loading && !vp.ventas.length" class="empty">Aún no hay ventas registradas.</p>
        <div class="list">
          <article v-for="v in vp.ventas" :key="v._id" class="list-row">
            <div>
              <strong>{{ v.clienteNombre || 'Sin cliente' }}</strong>
              <p>{{ v.productoNombre }} × {{ v.cantidad }} · {{ fecha(v.fecha) }}</p>
            </div>
            <div class="list-mid">
              <span>{{ v.metodoPago || 'sin método' }}</span>
              <span v-if="v.esCredito" class="credito-tag">Crédito · saldo {{ money(v.saldo) }}</span>
            </div>
            <div class="row-total"><strong>{{ money(v.total) }}</strong><p>{{ v.vendedorNombre }}</p></div>
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

.page-shell { display: flex; flex-direction: column; gap: $space-5; }
.tabs { display: flex; gap: $space-2; }
.tabs button { padding: $space-2 $space-4; background: rgba($ink-800, .6); border: 1px solid rgba($ink-500, .15); border-radius: 999px; color: $ink-300; cursor: pointer; font-size: .88rem; }
.tabs button.on { background: $brand-orange; color: $ink-1000; border-color: $brand-orange; font-weight: 600; }
.panel { background: rgba($ink-900, .7); border: 1px solid rgba($ink-500, .12); border-radius: 20px; padding: $space-5; }
.rec-list, .list { display: flex; flex-direction: column; gap: $space-2; margin-top: $space-3; }
.rec-row, .list-row { display: flex; justify-content: space-between; align-items: center; gap: $space-3; padding: $space-3; border: 1px solid rgba($ink-500, .1); border-radius: 12px; flex-wrap: wrap; }
.rec-row.vencida { border-color: rgba(#f87171, .5); }
.rec-right { text-align: right; display: flex; flex-direction: column; }
.rec-fecha { color: $ink-400; font-size: .8rem; }
.rec-fecha em { color: #f87171; font-style: normal; }
.list-mid { display: flex; flex-direction: column; gap: 2px; color: $ink-400; font-size: .8rem; }
.credito-tag { color: $brand-orange; }
.row-total { text-align: right; }
.row-total p, .list-row p, .rec-row p, .empty { color: $ink-400; margin: 0; font-size: .8rem; }
</style>
