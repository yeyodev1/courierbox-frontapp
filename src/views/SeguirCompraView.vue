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
        <div class="milestone-strip">
          <article class="milestone created done">
            <span><i class="fa-solid fa-file-circle-plus" /></span>
            <div><strong>Gestión creada</strong><small>{{ formatDate(gestion.createdAt) }}</small></div>
          </article>
          <article class="milestone paid" :class="{ done: gestion.estadoPago === 'confirmado' }">
            <span><i class="fa-solid fa-circle-check" /></span>
            <div><strong>Pago confirmado</strong><small>{{ gestion.pagoConfirmadoEn ? formatDate(gestion.pagoConfirmadoEn) : 'Pendiente' }}</small></div>
          </article>
          <article class="milestone delivered" :class="{ done: gestion.estadoEntrega === 'entregada' || gestion.stage === 'entregada' }">
            <span><i class="fa-solid fa-box-open" /></span>
            <div><strong>Entrega completada</strong><small>{{ gestion.envio?.entregadoEn ? formatDate(gestion.envio.entregadoEn) : 'Pendiente' }}</small></div>
          </article>
        </div>
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

      <section v-if="gestion.envio?.estado === 'entregado'" class="card delivery-proof">
        <div class="card-head">
          <h3><i class="fa-solid fa-shield-check" aria-hidden="true" /> Comprobante de entrega</h3>
          <span>{{ gestion.envio.recibidoPor || 'Entrega confirmada' }}</span>
        </div>
        <div class="proof-media">
          <img v-if="gestion.envio.fotoEntregaUrl" :src="gestion.envio.fotoEntregaUrl" alt="Foto de entrega" />
          <img v-if="gestion.envio.firmaUrl" :src="gestion.envio.firmaUrl" alt="Firma de recepción" class="signature" />
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
              <small>{{ index === 0 ? 'Principal' : 'Relacionada' }}</small>
            </span>
          </button>
        </div>
      </section>

      <section class="card quick-card">
        <div class="card-head">
          <h3><i class="fa-solid fa-circle-info" aria-hidden="true" /> Resumen rápido</h3>
        </div>
        <div class="quick-grid">
          <div class="quick-item"><span>Cliente</span><strong>{{ clienteNombre }}</strong></div>
          <div class="quick-item"><span>Valor total</span><strong class="orange">${{ gestion.valorTotal.toFixed(2) }}</strong></div>
          <div class="quick-item"><span>Reserva</span><strong>${{ gestion.valorReserva.toFixed(2) }}</strong></div>
          <div class="quick-item"><span>Entrega</span><strong>{{ formatDate(gestion.fechaEntregaTentativa) }}</strong></div>
          <div class="quick-item" v-if="asesorNombre"><span>Asesor</span><strong>{{ asesorNombre }}</strong></div>
        </div>
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
.milestone-strip { display: flex; flex-wrap: wrap; gap: $space-3; }
.milestone {
  flex: 1 1 210px; display: flex; align-items: center; gap: $space-3; padding: $space-4;
  border-radius: 16px; border: 1px solid rgba($brand-orange, .32); background: #120d08; opacity: .5;
  transition: transform 200ms ease, opacity 200ms ease, border-color 200ms ease;
  &.done { opacity: 1; transform: translateY(-2px); }
  > span { width: 42px; height: 42px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; }
  > div { display: flex; flex-direction: column; gap: 3px; }
  small { color: #f2dcc7; }
}
.milestone.created > span { color: #7fb3ff; background: rgba(59, 130, 246, .16); }
.milestone.paid.done { border-color: $signal-green; }
.milestone.paid > span { color: $signal-green; background: rgba($signal-green, .15); }
.milestone.delivered.done { border-color: #a78bfa; }
.milestone.delivered > span { color: #c4b5fd; background: rgba(139, 92, 246, .16); }
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

.gallery-card, .quick-card { padding: $space-5; }
.delivery-proof { padding: $space-5; }
.proof-media { display: flex; flex-wrap: wrap; gap: $space-4; }
.proof-media img { flex: 1 1 280px; min-width: 0; max-height: 360px; object-fit: contain; border-radius: 14px; background: #120d08; border: 1px solid rgba($brand-orange, .3); }
.proof-media img.signature { background: #fffaf2; }
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

.quick-grid { display: flex; flex-wrap: wrap; gap: $space-3; }
.quick-item {
  flex: 1 1 160px; display: flex; flex-direction: column; gap: 4px;
  padding: $space-4; border-radius: 14px; background: $ink-1000; border: 1px solid $ink-500;
}
.quick-item span { color: $ink-400; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; }
.quick-item strong { color: $fg-dark; font-size: 0.92rem; word-break: break-word; }
.orange { color: $brand-orange; font-weight: 700; }
.badge-confirmed { color: $signal-green; font-size: 0.78rem; margin-left: $space-2; }

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
}
@media (prefers-reduced-motion: reduce) { .milestone, .progress-fill { transition: none; } }
</style>
