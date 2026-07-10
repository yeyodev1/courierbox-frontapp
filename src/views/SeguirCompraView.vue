<template>
  <div class="seguir-compra">
    <div class="header">
      <span class="logo-text">CB</span>
      <div>
        <h1 class="brand">Courier Box Logistics</h1>
        <p class="subtitle">Seguimiento de gestión de compra</p>
      </div>
    </div>

    <div v-if="loading" class="card loading-card">
      <div class="skeleton-block"></div>
      <div class="skeleton-block short"></div>
      <div class="skeleton-block"></div>
    </div>

    <div v-else-if="error" class="card error-card">
      <span class="error-icon"><i class="fa-solid fa-circle-xmark" aria-hidden="true" /></span>
      <h2>Gestión no encontrada</h2>
      <p>El enlace puede ser inválido o la gestión fue eliminada.</p>
    </div>

    <template v-else-if="gestion">
      <section class="card stage-hero">
        <div class="stage-hero__copy">
          <span class="eyebrow"><i class="fa-solid fa-route" aria-hidden="true" /> Stage actual</span>
          <h2>{{ currentStageLabel }}</h2>
          <p>{{ currentStageDescription }}</p>
        </div>
        <div class="stage-hero__meta">
          <span class="stage-pill" :class="`stage-${gestion.stage}`">{{ currentStageLabel }}</span>
          <strong>{{ stageProgress }}%</strong>
        </div>
      </section>

      <section class="card stage-reader">
        <div class="progress-track"><div class="progress-fill" :style="{ width: `${stageProgress}%` }" /></div>
        <div class="stage-steps">
          <div v-for="step in stageSteps" :key="step.value" class="stage-step" :class="{ active: gestion.stage === step.value, done: stageIndex(gestion.stage) > stageIndex(step.value) }">
            <span class="stage-step__icon"><i :class="step.icon" aria-hidden="true" /></span>
            <div>
              <strong>{{ step.label }}</strong>
              <p>{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </section>

      <section v-if="galleryPhotos.length" class="card gallery-card">
        <div class="card-head">
          <h3><i class="fa-solid fa-images" aria-hidden="true" /> Galería</h3>
          <span>{{ galleryPhotos.length }} fotos</span>
        </div>
        <div class="gallery-grid">
          <button v-for="(photo, index) in galleryPhotos" :key="`${photo.url}-${index}`" class="gallery-item" @click="openPreview(photo.url)">
            <img :src="photo.url" :alt="photo.title ?? 'Foto relacionada'" />
            <span class="gallery-item__meta">
              <strong>{{ photo.title ?? (index === 0 ? 'Imagen principal' : `Foto ${index + 1}`) }}</strong>
              <small>{{ formatDate(photo.createdAt) }}</small>
            </span>
          </button>
        </div>
      </section>

      <section class="card detail-card">
        <div class="card-head">
          <h3><i class="fa-solid fa-circle-info" aria-hidden="true" /> Detalles</h3>
        </div>
        <div class="details-grid">
          <div class="detail-item"><span class="detail-label">Cliente</span><span class="detail-value">{{ clienteNombre }}</span></div>
          <div class="detail-item"><span class="detail-label">Valor total</span><span class="detail-value orange">${{ gestion.valorTotal.toFixed(2) }}</span></div>
          <div class="detail-item">
            <span class="detail-label">Reserva</span>
            <span class="detail-value">
              ${{ gestion.valorReserva.toFixed(2) }}
              <span v-if="gestion.reservaConfirmada" class="badge-confirmed">Confirmada</span>
            </span>
          </div>
          <div class="detail-item"><span class="detail-label">Página</span><span class="detail-value">{{ gestion.paginaCompra }}</span></div>
          <div class="detail-item"><span class="detail-label">Entrega tentativa</span><span class="detail-value">{{ formatDate(gestion.fechaEntregaTentativa) }}</span></div>
          <div class="detail-item" v-if="asesorNombre"><span class="detail-label">Asesor</span><span class="detail-value">{{ asesorNombre }}</span></div>
        </div>
      </section>

      <section class="card tc-card">
        <details>
          <summary><i class="fa-solid fa-file-contract" aria-hidden="true" /> Ver Términos y Condiciones</summary>
          <div class="tc-content">
            <p>Al solicitar el servicio de gestión de compra con Courier Box Logistics, el cliente acepta que:</p>
            <ol>
              <li>Los tiempos de entrega son estimados y pueden variar por factores externos al courier (aduana, proveedor, logística internacional).</li>
              <li>El valor de reserva no es reembolsable en caso de cancelación del pedido por parte del cliente.</li>
              <li>Courier Box no se responsabiliza por demoras aduaneras ni restricciones de importación vigentes en Ecuador.</li>
              <li>El cliente debe verificar que el producto no esté restringido para importación al Ecuador antes de confirmar la gestión.</li>
              <li>Los precios incluyen el servicio de compra internacional; costos adicionales de aduana, impuestos o flete local serán informados oportunamente.</li>
              <li>Toda comunicación sobre el estado de la compra se realizará a través del asesor asignado o el enlace de seguimiento.</li>
            </ol>
          </div>
        </details>
      </section>
    </template>

    <footer class="footer">
      <p>Courier Box Logistics · <a href="https://courierboxlogistics.com" target="_blank" rel="noopener">courierboxlogistics.com</a></p>
    </footer>

    <div v-if="previewUrl" class="lightbox" @click.self="previewUrl = ''">
      <img :src="previewUrl" alt="Vista previa" />
      <button class="lightbox-close" @click="previewUrl = ''"><i class="fa-solid fa-xmark" aria-hidden="true" /></button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { gestionesCompraAPI, type GestionCompraStage, type GestionCompraFoto } from '@/services/gestiones_compra.api'
import type { GestionCompra } from '@/services/gestiones_compra.api'

const route = useRoute()
const token = computed(() => route.params.token as string)

const gestion = ref<GestionCompra | null>(null)
const loading = ref(true)
const error = ref(false)
const previewUrl = ref('')

const clienteNombre = computed(() =>
  typeof gestion.value?.contactoId === 'object'
    ? (gestion.value.contactoId as any).nombre
    : '—'
)
const asesorNombre = computed(() =>
  typeof gestion.value?.asesorId === 'object'
    ? (gestion.value.asesorId as any).name
    : null
)

const stageSteps: Array<{ value: GestionCompraStage; label: string; desc: string; icon: string }> = [
  { value: 'solicitada', label: 'Solicitada', desc: 'Recibida', icon: 'fa-regular fa-circle-dot' },
  { value: 'revisando', label: 'Revisando', desc: 'Validación', icon: 'fa-solid fa-magnifying-glass' },
  { value: 'comprada', label: 'Comprada', desc: 'Pedido listo', icon: 'fa-solid fa-cart-shopping' },
  { value: 'en_transito', label: 'En tránsito', desc: 'En camino', icon: 'fa-solid fa-truck-fast' },
  { value: 'entregada', label: 'Entregada', desc: 'Finalizada', icon: 'fa-solid fa-circle-check' },
]

const galleryPhotos = computed<GestionCompraFoto[]>(() => {
  const related = gestion.value?.fotosRelacionadas ?? []
  const main = gestion.value?.imagenCompraUrl
    ? [{ url: gestion.value.imagenCompraUrl, title: 'Imagen principal', createdAt: gestion.value.updatedAt }]
    : []
  return [...main, ...related.filter((photo) => photo.url !== gestion.value?.imagenCompraUrl)]
})

const currentStageLabel = computed(() => stageSteps.find((s) => s.value === (gestion.value?.stage ?? 'solicitada'))?.label ?? 'Solicitada')
const currentStageDescription = computed(() => stageSteps.find((s) => s.value === (gestion.value?.stage ?? 'solicitada'))?.desc ?? 'Recibida')
const stageProgress = computed(() => Math.round(((stageIndex(gestion.value?.stage ?? 'solicitada') + 1) / stageSteps.length) * 100))

function stageIndex(stage: GestionCompraStage) {
  return stageSteps.findIndex((item) => item.value === stage)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function openPreview(url: string) {
  previewUrl.value = url
}

onMounted(async () => {
  try {
    gestion.value = await gestionesCompraAPI.getByToken(token.value)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.seguir-compra {
  min-height: 100vh;
  background: $ink-1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $space-6 $space-4;
  gap: $space-5;
}

.header {
  width: 100%; max-width: 1100px;
  display: flex; align-items: center; gap: $space-3;
}
.logo-text {
  width: 42px; height: 42px; border-radius: 12px;
  background: $brand-orange; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 1rem;
}
.brand { color: $brand-orange; font-size: 1.25rem; font-weight: 700; margin: 0; }
.subtitle { color: $ink-400; font-size: 0.82rem; margin: 2px 0 0; }

.card {
  width: 100%; max-width: 1100px;
  background: $ink-900; border: 1px solid $ink-500; border-radius: 18px;
  overflow: hidden;
}

.loading-card { padding: $space-6; display: flex; flex-direction: column; gap: $space-3; }
.skeleton-block { height: 20px; background: $ink-700; border-radius: 4px; animation: pulse 1.4s infinite; }
.skeleton-block.short { width: 60%; }

.error-card {
  padding: $space-8; text-align: center; display: flex; flex-direction: column;
  align-items: center; gap: $space-3; color: $ink-300;
}
.error-icon { font-size: 3rem; color: $signal-red; }

.stage-hero {
  display: flex; justify-content: space-between; gap: $space-4; align-items: flex-start;
  padding: $space-5 $space-6;
}
.eyebrow {
  display: inline-flex; align-items: center; gap: $space-2;
  color: $brand-orange; text-transform: uppercase; letter-spacing: 0.08em;
  font-size: 0.72rem; font-weight: 800;
}
.stage-hero__copy h2 { margin: $space-2 0; font-size: 1.6rem; }
.stage-hero__copy p { margin: 0; color: $ink-300; line-height: 1.6; }
.stage-hero__meta { display: flex; flex-direction: column; align-items: flex-end; gap: $space-2; }
.stage-pill {
  display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 999px; font-size: 0.8rem; font-weight: 700;
}
.stage-solicitada, .stage-revisando, .stage-comprada, .stage-en_transito, .stage-entregada { background: rgba(240,138,31,0.14); color: $brand-orange; }
.stage-hero__meta strong { font-size: 1.8rem; color: $fg-dark; }

.stage-reader { padding: $space-5; display: flex; flex-direction: column; gap: $space-4; }
.progress-track { height: 4px; background: $ink-700; border-radius: 999px; overflow: hidden; }
.progress-fill { height: 100%; background: $brand-orange; border-radius: 999px; transition: width 0.25s ease; }
.stage-steps { display: flex; flex-wrap: wrap; gap: $space-3; }
.stage-step {
  flex: 1 1 180px; display: flex; gap: $space-3; align-items: flex-start;
  padding: $space-4; border-radius: 16px; background: $ink-1000; border: 1px solid $ink-500;
}
.stage-step.active { border-color: $brand-orange; background: rgba(240,138,31,0.08); }
.stage-step.done { border-color: rgba(43,187,146,0.25); }
.stage-step__icon { width: 34px; height: 34px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; background: rgba(240,138,31,0.12); color: $brand-orange; flex: 0 0 auto; }
.stage-step strong { display: block; font-size: 0.92rem; }
.stage-step p { margin: 2px 0 0; color: $ink-400; font-size: 0.8rem; }

.gallery-card, .detail-card, .tc-card { padding: $space-5; }
.card-head { display: flex; align-items: center; justify-content: space-between; gap: $space-3; margin-bottom: $space-4; }
.card-head h3 { display: flex; align-items: center; gap: $space-2; margin: 0; font-size: 1rem; }
.card-head span { color: $ink-400; font-size: 0.82rem; }

.gallery-grid { display: flex; flex-wrap: wrap; gap: $space-3; }
.gallery-item {
  flex: 1 1 220px; min-width: 0; border: 1px solid $ink-500; border-radius: 16px; overflow: hidden;
  background: $ink-1000; text-align: left; cursor: pointer; padding: 0;
}
.gallery-item img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block; }
.gallery-item__meta { display: flex; flex-direction: column; gap: 4px; padding: $space-3; }
.gallery-item__meta strong { font-size: 0.84rem; }
.gallery-item__meta small { color: $ink-400; }

.details-grid { display: flex; flex-direction: column; }
.detail-item {
  display: grid; grid-template-columns: 150px 1fr; gap: $space-2; align-items: center;
  padding: $space-2 0; border-bottom: 1px solid $ink-700;
}
.detail-item:last-child { border-bottom: none; }
.detail-label { color: $ink-300; font-size: 0.82rem; }
.detail-value { color: $fg-dark; font-size: 0.9rem; font-weight: 500; word-break: break-word; }
.orange { color: $brand-orange; font-weight: 700; }
.badge-confirmed { color: $signal-green; font-size: 0.78rem; margin-left: $space-2; }

.tc-card { padding-top: $space-4; padding-bottom: $space-4; }
.tc-card summary { cursor: pointer; color: $ink-300; font-size: 0.85rem; }
.tc-content {
  margin-top: $space-3; color: $ink-400; font-size: 0.78rem; line-height: 1.7;
  p { margin: 0 0 $space-2; }
  ol { margin: 0; padding-left: $space-4; }
  li { margin-bottom: $space-1; }
}

.footer {
  width: 100%; max-width: 1100px;
  color: $ink-400; font-size: 0.78rem; text-align: center;
  a { color: $brand-orange; }
}

.lightbox {
  position: fixed; inset: 0; background: rgba(0,0,0,0.82); display: flex; align-items: center; justify-content: center; padding: $space-4; z-index: 60;
}
.lightbox img { max-width: min(100%, 1100px); max-height: 82vh; border-radius: 16px; box-shadow: 0 20px 80px rgba(0,0,0,0.45); }
.lightbox-close {
  position: absolute; top: $space-4; right: $space-4; width: 42px; height: 42px; border-radius: 999px; border: none; background: $ink-1000; color: $fg-dark; cursor: pointer;
}

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

@media (max-width: 900px) {
  .stage-hero { flex-direction: column; }
  .stage-hero__meta { align-items: flex-start; }
  .detail-item { grid-template-columns: 1fr; gap: 4px; }
}
</style>
