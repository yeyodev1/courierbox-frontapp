<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import { contactosApi, type ContactoDetail } from '@/services/contactos.api'
import { useToastStore } from '@/stores/toast.store'

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()

const loading = ref(false)
const detail = ref<ContactoDetail | null>(null)

const parsed = computed(() => {
  const raw = decodeURIComponent(String(route.params.key || ''))
  const [name = '', email = '', phone = ''] = raw.split('|')
  return { name, email, phone }
})

const orderCount = computed(() => detail.value?.contacto.totalOrders || 0)
const orders = computed(() => detail.value?.orders || [])
const advisors = computed(() => detail.value?.contacto.asesores || [])

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(ts: string) {
  return new Date(ts).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`
}

async function load() {
  if (!parsed.value.name) return
  loading.value = true
  try {
    detail.value = await contactosApi.getDetail(parsed.value.name, parsed.value.email || undefined, parsed.value.phone || undefined)
  } catch (e: any) {
    toastStore.showNotification(e.message || 'No se pudo cargar el contacto', 'error')
  } finally {
    loading.value = false
  }
}

function back() {
  router.push({ name: 'AsesorContactos' })
}

function openOrder(id: string) {
  router.push({ name: 'AsesorOrderDetail', params: { id } })
}

onMounted(load)
watch(() => route.params.key, load)
</script>

<template>
  <div class="contact-detail-page">
    <section class="topbar">
      <AppButton variant="outline" @click="back"><i class="fa-solid fa-arrow-left" /> Volver</AppButton>
      <div class="title-block">
        <span class="eyebrow">Detalle de contacto</span>
        <h1>{{ detail?.contacto.clientName || parsed.name }}</h1>
      </div>
    </section>

    <div v-if="loading" class="loading-shell">
      <div class="skeleton hero" />
      <div class="skeleton row" v-for="i in 3" :key="i" />
    </div>

    <template v-else-if="detail">
      <section class="hero-card">
        <div class="hero-left">
          <div class="avatar">{{ detail.contacto.clientName.charAt(0).toUpperCase() }}</div>
          <div>
            <h2>{{ detail.contacto.clientName }}</h2>
            <div class="meta-line">
              <span v-if="detail.contacto.clientEmail"><i class="fa-solid fa-envelope" /> {{ detail.contacto.clientEmail }}</span>
              <span v-if="detail.contacto.clientPhone"><i class="fa-solid fa-phone" /> {{ detail.contacto.clientPhone }}</span>
            </div>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat"><span>Órdenes</span><strong>{{ orderCount }}</strong></div>
          <div class="stat"><span>Primera venta</span><strong>{{ formatDate(detail.contacto.firstOrderDate) }}</strong></div>
          <div class="stat"><span>Última venta</span><strong>{{ formatDate(detail.contacto.lastOrderDate) }}</strong></div>
        </div>
      </section>

      <section class="section-card">
        <div class="section-head">
          <h3>Información</h3>
          <span>Gestión flexible entre todo el equipo</span>
        </div>
        <div class="info-grid">
          <div class="info-item"><span class="label">Cédula / Identificación</span><strong>{{ detail.contacto.clientPhone ? 'Disponible en el alta' : 'No registrada aquí' }}</strong></div>
          <div class="info-item"><span class="label">Asesores vinculados</span><strong>{{ advisors.length }}</strong></div>
        </div>
        <div class="chips">
          <span v-for="a in advisors" :key="a._id" class="chip">{{ a.name || a.email }}</span>
          <span v-if="!advisors.length" class="chip muted">Sin asesores vinculados</span>
        </div>
      </section>

      <section class="section-card">
        <div class="section-head">
          <h3>Órdenes relacionadas</h3>
          <span>{{ orders.length }} registros</span>
        </div>

        <div v-if="orders.length" class="orders-list">
          <article v-for="order in orders" :key="order._id" class="order-card">
            <div class="order-top">
              <div>
                <span class="order-id">#{{ order._id.slice(-6).toUpperCase() }}</span>
                <h4>{{ order.description }}</h4>
              </div>
              <button class="order-link" @click="openOrder(order._id)">Ver orden</button>
            </div>
            <div class="order-meta">
              <span>{{ order.storeName }}</span>
              <span>{{ formatDateTime(order.createdAt) }}</span>
              <span class="badge">{{ order.status }}</span>
              <strong>{{ formatMoney(order.totalAmount) }}</strong>
            </div>
          </article>
        </div>

        <div v-else class="empty-state">
          <i class="fa-solid fa-box-open" />
          <p>No hay órdenes relacionadas todavía.</p>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.contact-detail-page { display: flex; flex-direction: column; gap: $space-5; }
.topbar { display: flex; justify-content: space-between; align-items: center; gap: $space-4; }
.title-block h1 { margin: 0; }
.eyebrow { display: inline-flex; margin-bottom: $space-1; color: $brand-orange; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }

.loading-shell { display: flex; flex-direction: column; gap: $space-3; }
.skeleton { background: $ink-900; border: 1px solid rgba($ink-500, 0.12); border-radius: 18px; animation: pulse 1.4s infinite; }
.skeleton.hero { min-height: 180px; }
.skeleton.row { min-height: 84px; }

.hero-card, .section-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 20px;
  padding: $space-5;
}
.hero-card { display: flex; justify-content: space-between; gap: $space-5; flex-wrap: wrap; }
.hero-left { display: flex; align-items: center; gap: $space-4; }
.avatar { width: 72px; height: 72px; border-radius: 22px; background: rgba($brand-orange, 0.12); color: $brand-orange; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 800; }
.meta-line { display: flex; flex-wrap: wrap; gap: $space-3; color: $ink-300; margin-top: $space-2; }
.stats-row { display: flex; flex-wrap: wrap; gap: $space-3; }
.stat { display: flex; flex-direction: column; gap: 2px; padding: $space-3 $space-4; border-radius: 14px; background: $ink-1000; border: 1px solid rgba($brand-orange, 0.14); }
.stat span { font-size: 0.72rem; color: $ink-400; text-transform: uppercase; }
.stat strong { color: $fg-dark; font-size: 0.92rem; }

.section-head { display: flex; justify-content: space-between; align-items: center; gap: $space-3; margin-bottom: $space-4; }
.section-head h3 { margin: 0; }
.section-head span { color: $ink-400; font-size: 0.82rem; }
.info-grid { display: flex; flex-wrap: wrap; gap: $space-3; }
.info-item { flex: 1 1 240px; padding: $space-3 $space-4; border-radius: 14px; background: $ink-1000; border: 1px solid rgba($ink-500, 0.12); }
.label { display: block; color: $ink-400; font-size: 0.72rem; text-transform: uppercase; margin-bottom: 4px; }
.chips { display: flex; flex-wrap: wrap; gap: $space-2; margin-top: $space-4; }
.chip { display: inline-flex; padding: 5px 12px; border-radius: 999px; background: rgba($brand-orange, 0.08); border: 1px solid rgba($brand-orange, 0.18); color: $fg-dark; }
.chip.muted { background: $ink-1000; border-color: rgba($ink-500, 0.12); color: $ink-400; }

.orders-list { display: flex; flex-direction: column; gap: $space-3; }
.order-card { padding: $space-4; border-radius: 16px; background: $ink-1000; border: 1px solid rgba($ink-500, 0.12); display: flex; flex-direction: column; gap: $space-3; }
.order-top { display: flex; justify-content: space-between; gap: $space-3; align-items: flex-start; }
.order-id { color: $brand-orange; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; }
.order-top h4 { margin: 4px 0 0; }
.order-link { border: 1px solid rgba($brand-orange, 0.18); background: transparent; color: $brand-orange; border-radius: 12px; padding: $space-2 $space-3; cursor: pointer; }
.order-meta { display: flex; flex-wrap: wrap; gap: $space-3; color: $ink-300; align-items: center; }
.badge { display: inline-flex; padding: 3px 10px; border-radius: 999px; background: rgba($brand-orange, 0.12); color: $brand-orange; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: $space-3; padding: $space-8 0; color: $ink-400; }

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }

@media (max-width: 900px) {
  .topbar, .hero-card, .section-head, .order-top { display: flex; flex-direction: column; align-items: flex-start; }
}
</style>
