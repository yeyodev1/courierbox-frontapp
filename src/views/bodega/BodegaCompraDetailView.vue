<script setup lang="ts">
/** One purchase seen from the warehouse: its data and the reception flow. */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RegistrarEnvioModal from './Compras/RegistrarEnvioModal.vue'
import { gestionesCompraAPI, type GestionCompra } from '@/services/gestiones_compra.api'
import { useToastStore } from '@/stores/toast.store'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const id = String(route.params.id)
const loading = ref(true)
const gestion = ref<GestionCompra | null>(null)
const showModal = ref(false)

const contacto = computed(() =>
  typeof gestion.value?.contactoId === 'object' ? gestion.value.contactoId : null,
)
const clienteNombre = computed(() => contacto.value?.nombre ?? 'Cliente')
const clienteEmail = computed(() => (contacto.value as { email?: string } | null)?.email ?? '')
const asesorNombre = computed(() =>
  typeof gestion.value?.asesorId === 'object'
    ? ((gestion.value.asesorId as { name?: string }).name ?? '—')
    : '—',
)

/** The warehouse state wins; older orders only carry the sales stage. */
const yaRecibido = computed(() =>
  gestion.value?.estadoBodega
    ? ['recibida', 'preparando_despacho', 'despachada'].includes(gestion.value.estadoBodega)
    : ['comprada', 'en_transito', 'entregada'].includes(gestion.value?.stage ?? ''),
)

const trackingUrl = computed(() =>
  gestion.value?.viewToken ? `${window.location.origin}/compra/${gestion.value.viewToken}` : '',
)

const STAGE_LABELS: Record<string, string> = {
  solicitada: 'Solicitada',
  revisando: 'Revisando',
  comprada: 'En bodega',
  en_transito: 'En tránsito',
  entregada: 'Entregada',
}
const stageLabel = (stage: string) => STAGE_LABELS[stage] ?? stage
const money = (v: unknown) => (Number(v) || 0).toFixed(2)

function onRegistrado() {
  showModal.value = false
  toast.showNotification('Envío registrado y cliente notificado', 'success')
  router.push('/bodega')
}

onMounted(async () => {
  try {
    gestion.value = await gestionesCompraAPI.getById(id)
  } catch {
    gestion.value = null
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="detail">
    <button class="back" @click="router.push('/bodega')">
      <i class="fa-solid fa-arrow-left" aria-hidden="true" /> Compras
    </button>

    <div v-if="loading" class="loading">Cargando compra...</div>

    <template v-else-if="gestion">
      <section class="card info">
        <div class="info-head">
          <div>
            <span class="eyebrow">Gestión de compra</span>
            <h1>{{ clienteNombre }}</h1>
          </div>
          <span class="badge" :class="`stage-${gestion.stage}`">{{ stageLabel(gestion.stage) }}</span>
        </div>
        <div class="meta">
          <div><span>Tienda</span><strong>{{ gestion.paginaCompra || '—' }}</strong></div>
          <div><span>Valor total</span><strong>${{ money(gestion.valorTotal) }}</strong></div>
          <div><span>Asesor</span><strong>{{ asesorNombre }}</strong></div>
          <div><span>Correo cliente</span><strong>{{ clienteEmail || 'Sin correo' }}</strong></div>
        </div>
      </section>

      <section v-if="yaRecibido" class="card evidence">
        <h3><i class="fa-solid fa-circle-check" aria-hidden="true" /> Producto recibido en bodega</h3>
        <p class="muted">El cliente ya fue notificado de que su producto llegó.</p>
        <div class="ev-fotos">
          <img v-for="(f, i) in gestion.fotosRelacionadas" :key="i" :src="f.url" alt="foto" />
        </div>
      </section>

      <section v-else class="card cta">
        <div class="cta-icon"><i class="fa-solid fa-box-open" aria-hidden="true" /></div>
        <div class="cta-copy">
          <h3>Registrar envío en bodega</h3>
          <p>
            Sube la foto de lo recibido, define el tiempo estimado de entrega y avisa al cliente que
            ya lo tenemos.
          </p>
        </div>
        <button class="btn primary lg" @click="showModal = true">
          <i class="fa-solid fa-box-open" aria-hidden="true" /> Registrar envío
        </button>
      </section>
    </template>

    <p v-else class="loading">No se encontró la compra.</p>

    <RegistrarEnvioModal
      :open="showModal"
      :gestion-id="id"
      :cliente-nombre="clienteNombre"
      :cliente-email="clienteEmail"
      :tracking-url="trackingUrl"
      @close="showModal = false"
      @done="onRegistrado"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.detail { display: flex; flex-direction: column; gap: $space-4; }
.back { align-self: flex-start; background: transparent; border: none; color: $brand-orange; cursor: pointer; padding: 0; display: inline-flex; align-items: center; gap: $space-2; }
.loading { color: $ink-400; text-align: center; padding: $space-6 0; }
.card { background: $ink-900; border: 1px solid $ink-700; border-radius: 16px; padding: $space-5; display: flex; flex-direction: column; gap: $space-4; }
.card h3 { margin: 0; color: $fg-dark; font-size: 1.05rem; display: flex; align-items: center; gap: $space-2; }
.info-head { display: flex; align-items: flex-start; justify-content: space-between; gap: $space-3; }
.eyebrow { color: $brand-orange; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }
.info-head h1 { margin: 4px 0 0; color: $fg-dark; font-size: 1.4rem; }
.meta { display: flex; flex-wrap: wrap; gap: $space-4; }
.meta > div { display: flex; flex-direction: column; gap: 2px; }
.meta span { color: $ink-400; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; }
.meta strong { color: $fg-dark; }
.muted { color: $ink-400; font-size: 0.85rem; margin: 0; }
.badge { padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; background: $ink-700; color: $ink-300; }
.badge.stage-comprada { background: rgba(43,187,146,0.15); color: $signal-green; }
.badge.stage-en_transito { background: rgba(240,138,31,0.16); color: $brand-orange; }

.evidence .ev-fotos { display: flex; flex-wrap: wrap; gap: $space-3; }
.evidence img { width: 130px; height: 130px; object-fit: cover; border-radius: 12px; border: 1px solid $ink-700; }

.cta { align-items: center; text-align: center; gap: $space-3; }
.cta-icon { width: 64px; height: 64px; border-radius: 18px; background: rgba($brand-orange, 0.12); color: $brand-orange; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; }
.cta-copy h3 { justify-content: center; }
.cta-copy p { margin: $space-2 0 0; color: $ink-300; max-width: 460px; }

.btn { display: inline-flex; align-items: center; gap: $space-2; border-radius: 12px; padding: $space-3 $space-4; font-weight: 700; cursor: pointer; border: 1px solid transparent; }
.btn.lg { padding: $space-4 $space-5; font-size: 1rem; }
.btn.primary { background: $brand-orange; color: $ink-1000; &:disabled { opacity: 0.5; cursor: not-allowed; } }

@media (max-width: 640px) { .meta { gap: $space-3; } }
</style>
