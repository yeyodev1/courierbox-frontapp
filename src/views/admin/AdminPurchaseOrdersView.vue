<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import { asesoriaApi, type PurchaseOrder } from '@/services/asesoria.api'
import { useToastStore } from '@/stores/toast.store'

const toast = useToastStore()
const orders = ref<PurchaseOrder[]>([])
const loading = ref(false)
const status = ref('')
const search = ref('')

const filtered = computed(() => orders.value.filter((order) => {
  if (status.value && order.status !== status.value) return false
  const query = search.value.trim().toLowerCase()
  return !query || `${order.clientName} ${order.clientEmail || ''} ${order.description}`.toLowerCase().includes(query)
}))

async function load() {
  loading.value = true
  try {
    orders.value = (await asesoriaApi.listOrders({ limit: 200 })).orders
  } catch (error: any) {
    toast.showNotification(error?.message || 'No se pudo cargar el histórico', 'error')
  } finally {
    loading.value = false
  }
}

function formatMoney(value: number) { return `$${Number(value || 0).toFixed(2)}` }
function formatDate(value: string) { return new Date(value).toLocaleDateString('es-EC', { dateStyle: 'medium' }) }
function asesorName(order: PurchaseOrder) { return typeof order.asesorId === 'object' ? order.asesorId.name || order.asesorId.email : 'Asesor' }
function copyLink(order: PurchaseOrder) {
  if (!order.viewToken) return
  void navigator.clipboard.writeText(`${window.location.origin}/seguir/${order.viewToken}`)
  toast.showNotification('Enlace histórico copiado', 'success')
}

onMounted(load)
</script>

<template>
  <main class="history-page">
    <header class="history-head">
      <div>
        <span class="eyebrow">Archivo protegido</span>
        <h1>Órdenes históricas</h1>
        <p>Estos datos anteriores permanecen intactos y disponibles únicamente para consulta.</p>
      </div>
      <router-link to="/admin/gestiones-compra/nueva" class="new-action"><i class="fa-solid fa-plus" /> Nueva gestión</router-link>
    </header>

    <section class="notice"><i class="fa-solid fa-lock" /><span>No se pueden cambiar estados, pagos, enlaces ni comprobantes en este archivo.</span></section>

    <section class="filters">
      <input v-model="search" placeholder="Buscar cliente, correo o producto" />
      <select v-model="status">
        <option value="">Todos los estados</option>
        <option v-for="item in ['borrador', 'pendiente', 'en_proceso', 'comprado', 'en_envio', 'entregado', 'cancelado']" :key="item" :value="item">{{ item }}</option>
      </select>
    </section>

    <div v-if="loading" class="state state--loading" aria-busy="true" aria-live="polite">
      <AppSkeleton variant="card" height="110px" :count="5" gap="0.75rem" />
    </div>
    <div v-else-if="!filtered.length" class="state">No hay órdenes históricas para estos filtros.</div>
    <section v-else class="history-list">
      <article v-for="order in filtered" :key="order._id" class="history-card">
        <div class="card-main">
          <div class="card-top"><strong>{{ order.clientName }}</strong><span>#{{ order._id.slice(-6).toUpperCase() }}</span></div>
          <p>{{ order.description }}</p>
          <div class="meta"><span>{{ order.storeName }}</span><span>{{ asesorName(order) }}</span><span>{{ formatDate(order.createdAt) }}</span></div>
        </div>
        <div class="card-side">
          <strong>{{ formatMoney(order.totalAmount) }}</strong>
          <span>{{ order.status }} · {{ order.paymentStatus }}</span>
          <button v-if="order.viewToken" type="button" @click="copyLink(order)"><i class="fa-solid fa-copy" /> Copiar seguimiento</button>
        </div>
      </article>
    </section>
  </main>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
.history-page { display: flex; flex-direction: column; gap: $space-5; }
.history-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: $space-4; padding: $space-6; border: 1px solid rgba($brand-orange, .25); border-radius: 20px; background: $ink-900; }
.history-head h1 { margin: 0 0 $space-2; }
.history-head p { margin: 0; color: $muted-dark; }
.eyebrow { color: $brand-orange; font-size: .72rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.new-action { display: inline-flex; align-items: center; gap: $space-2; padding: $space-3 $space-4; border-radius: 12px; background: $brand-orange; color: $ink-1000; text-decoration: none; font-weight: 800; }
.notice { display: flex; align-items: center; gap: $space-3; padding: $space-4; border-radius: 14px; border: 1px solid rgba($signal-blue, .35); background: rgba($signal-blue, .1); color: $fg-dark; }
.notice i { color: $signal-blue; }
.filters { display: flex; flex-wrap: wrap; gap: $space-3; }
.filters input, .filters select { flex: 1 1 240px; min-height: 44px; padding: 0 $space-3; border: 1px solid rgba($brand-orange, .2); border-radius: 12px; color: $fg-dark; background: $ink-900; }
.history-list { display: flex; flex-direction: column; gap: $space-3; }
.history-card { display: flex; flex-wrap: wrap; justify-content: space-between; gap: $space-4; padding: $space-4; border: 1px solid rgba($brand-orange, .14); border-radius: 16px; background: $ink-900; transition: transform 180ms ease, border-color 180ms ease; }
.history-card:hover { transform: translateY(-2px); border-color: rgba($brand-orange, .4); }
.card-main { flex: 1 1 420px; }
.card-top, .meta { display: flex; flex-wrap: wrap; gap: $space-3; }
.card-top { justify-content: space-between; }
.card-top span, .meta { color: $muted-dark; font-size: .8rem; }
.card-main p { color: $fg-dark; }
.card-side { flex: 0 1 220px; display: flex; flex-direction: column; align-items: flex-end; gap: $space-2; }
.card-side strong { color: $brand-orange; font-size: 1.25rem; }
.card-side span { color: $muted-dark; font-size: .8rem; }
.card-side button { border: 1px solid rgba($brand-orange, .3); border-radius: 10px; padding: $space-2 $space-3; color: $brand-orange; background: transparent; cursor: pointer; }
.state { padding: $space-8; text-align: center; color: $muted-dark; }
@media (max-width: 640px) { .card-side { flex-basis: 100%; align-items: flex-start; } }
@media (prefers-reduced-motion: reduce) { .history-card { transition: none; } .history-card:hover { transform: none; } }
</style>
