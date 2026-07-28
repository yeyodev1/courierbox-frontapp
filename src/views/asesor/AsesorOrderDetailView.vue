<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { asesoriaApi, type PurchaseOrder } from '@/services/asesoria.api'
import { useToastStore } from '@/stores/toast.store'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()
const order = ref<PurchaseOrder | null>(null)
const loading = ref(false)

async function load() {
  loading.value = true
  try { order.value = (await asesoriaApi.getOrder(String(route.params.id))).order }
  catch (error: any) { toast.showNotification(error?.message || 'No se pudo cargar la orden histórica', 'error') }
  finally { loading.value = false }
}
function money(value: number) { return `$${Number(value || 0).toFixed(2)}` }
function date(value: string) { return new Date(value).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' }) }
onMounted(load)
</script>

<template>
  <main class="legacy-detail">
    <button class="back" type="button" @click="router.push('/asesor/ordenes')"><i class="fa-solid fa-arrow-left" /> Histórico</button>
    <div v-if="loading" class="state">Cargando...</div>
    <template v-else-if="order">
      <header class="hero">
        <div><span class="eyebrow">Orden histórica · solo lectura</span><h1>{{ order.clientName }}</h1><p>{{ order.description }}</p></div>
        <strong>{{ money(order.totalAmount) }}</strong>
      </header>
      <section class="lock"><i class="fa-solid fa-lock" /> Esta orden se conserva exactamente como fue registrada. Las operaciones nuevas se administran en Gestiones de Compra.</section>
      <section class="facts">
        <div><span>Estado</span><strong>{{ order.status }}</strong></div><div><span>Pago</span><strong>{{ order.paymentStatus }}</strong></div>
        <div><span>Tienda</span><strong>{{ order.storeName }}</strong></div><div><span>Servicio</span><strong>{{ order.serviceType }}</strong></div>
        <div><span>Producto</span><strong>{{ money(order.productValue) }}</strong></div><div><span>Envío</span><strong>{{ money(order.shippingValue) }}</strong></div>
        <div><span>Creada</span><strong>{{ date(order.createdAt) }}</strong></div><div><span>Correo</span><strong>{{ order.clientEmail || 'No registrado' }}</strong></div>
      </section>
      <section v-if="order.auditLog?.length" class="history"><h2>Bitácora original</h2><article v-for="entry in order.auditLog.slice().reverse()" :key="entry.timestamp"><strong>{{ entry.action }}</strong><span>{{ entry.userName }} · {{ date(entry.timestamp) }}</span><p v-if="entry.notes">{{ entry.notes }}</p></article></section>
    </template>
  </main>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *; @use '@/styles/tokens/space' as *;
.legacy-detail { display: flex; flex-direction: column; gap: $space-5; }
.back { align-self: flex-start; border: 0; color: $brand-orange; background: transparent; cursor: pointer; }
.hero { display: flex; flex-wrap: wrap; justify-content: space-between; gap: $space-4; padding: $space-6; border: 1px solid rgba($brand-orange,.25); border-radius: 20px; background: $ink-900; }
.hero h1 { margin: $space-1 0; }.hero p { margin: 0; color: $muted-dark; }.hero > strong { color: $brand-orange; font-size: 2rem; }
.eyebrow { color: $brand-orange; font-size: .72rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
.lock { display: flex; gap: $space-3; padding: $space-4; border: 1px solid rgba($signal-blue,.35); border-radius: 14px; background: rgba($signal-blue,.1); }
.facts { display: flex; flex-wrap: wrap; gap: $space-3; }.facts div { flex: 1 1 220px; display: flex; flex-direction: column; gap: $space-1; padding: $space-4; border-radius: 14px; background: $ink-900; }.facts span, .history article span { color: $muted-dark; font-size: .78rem; }
.history { display: flex; flex-direction: column; gap: $space-3; }.history article { display: flex; flex-direction: column; gap: $space-1; padding: $space-4; border-left: 3px solid $brand-orange; background: $ink-900; }.history p { margin: 0; color: $muted-dark; }.state { color: $muted-dark; }
</style>
