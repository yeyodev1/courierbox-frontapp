<template>
  <div v-if="!loading && gestion" class="page">
    <section class="hero-card">
      <div class="hero-copy">
        <span class="eyebrow"><i class="fa-solid fa-bag-shopping" aria-hidden="true" /> Gestión de compra</span>
        <h1>Controla fotos, stage y enlace público en un solo lugar.</h1>
        <p>Agrega más fotos relacionadas, avanza la etapa y comparte el link del cliente cuando quieras.</p>
      </div>
      <div class="hero-actions">
        <button class="btn-back" @click="$router.push('/asesor/gestiones-compra')"><i class="fa-solid fa-arrow-left" aria-hidden="true" /> Mis gestiones</button>
        <span class="estado-badge" :class="`estado-${gestion.estado}`">{{ estadoLabel(gestion.estado) }}</span>
      </div>
    </section>

    <section class="stage-reader card">
      <div class="panel-head">
        <h3><i class="fa-solid fa-route" aria-hidden="true" /> Stage del cliente</h3>
        <span>{{ currentStageLabel }}</span>
      </div>

      <div class="stage-track">
        <div class="stage-track__fill" :style="{ width: `${stageProgress}%` }" />
      </div>

      <div class="stage-steps">
        <button
          v-for="step in stageSteps"
          :key="step.value"
          class="stage-step"
          :class="{ active: gestion.stage === step.value, done: stageIndex(gestion.stage) > stageIndex(step.value) }"
          @click="setStage(step.value)"
        >
          <span class="stage-step__dot"><i :class="step.icon" aria-hidden="true" /></span>
          <span class="stage-step__text">
            <strong>{{ step.label }}</strong>
            <small>{{ step.desc }}</small>
          </span>
        </button>
      </div>
    </section>

    <section class="content-grid">
      <div class="content-main">
        <article class="card info-card">
          <div class="panel-head">
            <h3><i class="fa-solid fa-user" aria-hidden="true" /> Cliente</h3>
          </div>
          <div class="info-list">
            <div class="info-row"><span>Nombre</span><strong>{{ contacto?.nombre ?? '—' }}</strong></div>
            <div class="info-row" v-if="contacto?.email"><span>Email</span><a :href="`mailto:${contacto.email}`" class="link">{{ contacto.email }}</a></div>
            <div class="info-row" v-if="contacto?.telefono"><span>Teléfono</span><strong>{{ contacto.telefono }}</strong></div>
          </div>
        </article>

        <article class="card info-card">
          <div class="panel-head">
            <h3><i class="fa-solid fa-dollar-sign" aria-hidden="true" /> Resumen</h3>
          </div>
          <div class="info-list">
            <div class="info-row"><span>Valor total</span><strong class="orange">${{ gestion.valorTotal.toFixed(2) }}</strong></div>
            <div class="info-row">
              <span>Reserva</span>
              <span class="inline-row">
                <strong>${{ gestion.valorReserva.toFixed(2) }}</strong>
                <span v-if="gestion.reservaConfirmada" class="chip green">Confirmada</span>
                <span v-else class="chip muted">Pendiente</span>
              </span>
            </div>
            <div class="info-row"><span>Página de compra</span><a :href="gestion.paginaCompra" target="_blank" rel="noopener" class="link">{{ gestion.paginaCompra }}</a></div>
            <div class="info-row"><span>Entrega tentativa</span><strong>{{ formatDate(gestion.fechaEntregaTentativa) }}</strong></div>
            <div class="info-row" v-if="gestion.notas"><span>Notas</span><span class="muted">{{ gestion.notas }}</span></div>
          </div>
        </article>

        <article class="card gallery-card">
          <div class="panel-head">
            <h3><i class="fa-solid fa-images" aria-hidden="true" /> Fotos relacionadas</h3>
            <span>{{ galleryPhotos.length }}</span>
          </div>

          <div class="upload-bar">
            <input v-model="photoTitle" class="title-input" type="text" placeholder="Título de la foto (opcional)" />
            <label class="upload-btn">
              <input type="file" accept="image/*" multiple class="hidden" @change="onPhotoSelect" />
              <i class="fa-solid fa-cloud-arrow-up" aria-hidden="true" />
              {{ uploadingPhotos ? 'Subiendo...' : 'Agregar fotos' }}
            </label>
          </div>

          <p v-if="photoError" class="error-text">{{ photoError }}</p>

          <div v-if="galleryPhotos.length" class="gallery-grid">
            <button v-for="(photo, index) in galleryPhotos" :key="`${photo.url}-${index}`" class="gallery-item" @click="openPreview(photo.url)">
              <img :src="photo.url" :alt="photo.title ?? 'Foto relacionada'" />
              <span class="gallery-item__meta">
                <strong>{{ photo.title ?? (index === 0 ? 'Imagen principal' : `Foto ${index + 1}`) }}</strong>
                <small>{{ formatDate(photo.createdAt) }}</small>
              </span>
            </button>
          </div>

          <p v-else class="empty-text">Todavía no hay fotos relacionadas.</p>
        </article>
      </div>

      <aside class="content-side">
        <article class="card info-card">
          <div class="panel-head">
            <h3><i class="fa-solid fa-pen-to-square" aria-hidden="true" /> Editar datos</h3>
          </div>
          <div class="edit-form">
            <label class="field-group">
              <span>Stage</span>
              <select v-model="stageDraft" class="select-input">
                <option v-for="step in stageSteps" :key="step.value" :value="step.value">{{ step.label }}</option>
              </select>
            </label>
            <AppInput v-model="editForm.paginaCompra" label="Página de compra" />
            <label class="field-group">
              <span>Fecha tentativa</span>
              <input type="date" v-model="editForm.fechaEntregaTentativa" class="date-input" />
            </label>
            <AppInput v-model="editForm.notas" label="Notas" />
            <AppButton variant="primary" @click="saveEdits" :disabled="saving">{{ saving ? 'Guardando...' : 'Guardar cambios' }}</AppButton>
          </div>
        </article>

        <article class="card info-card">
          <div class="panel-head">
            <h3><i class="fa-solid fa-link" aria-hidden="true" /> Enlace público</h3>
          </div>
          <div class="link-stack">
            <code class="public-link">{{ viewUrl }}</code>
            <div class="link-actions">
              <AppButton variant="outline" size="sm" @click="openPublicLink">Abrir enlace</AppButton>
              <AppButton variant="outline" size="sm" @click="copyLink">Copiar</AppButton>
            </div>
          </div>
        </article>

        <article class="card info-card">
          <div class="panel-head">
            <h3><i class="fa-solid fa-clock-rotate-left" aria-hidden="true" /> Historial</h3>
          </div>
          <div class="audit-list">
            <div v-for="(entry, i) in gestion.auditLog.slice().reverse()" :key="i" class="audit-entry">
              <span class="audit-action">{{ entry.action }}</span>
              <span class="audit-who">{{ entry.userName }}</span>
              <span class="audit-date">{{ formatDateTime(entry.timestamp) }}</span>
              <span v-if="entry.notes" class="audit-notes">{{ entry.notes }}</span>
            </div>
          </div>
        </article>
      </aside>
    </section>

    <div v-if="previewUrl" class="lightbox" @click.self="previewUrl = ''">
      <img :src="previewUrl" alt="Vista previa" />
      <button class="lightbox-close" @click="previewUrl = ''"><i class="fa-solid fa-xmark" aria-hidden="true" /></button>
    </div>
  </div>

  <div v-else-if="loading" class="loading-state">Cargando gestión...</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import { gestionesCompraAPI, type GestionCompraStage, type GestionCompraFoto } from '@/services/gestiones_compra.api'
import { useToastStore } from '@/stores/toast.store'
import type { GestionCompra } from '@/services/gestiones_compra.api'

const route = useRoute()
const toast = useToastStore()

const gestion = ref<GestionCompra | null>(null)
const loading = ref(true)
const saving = ref(false)
const uploadingPhotos = ref(false)
const photoError = ref('')
const photoTitle = ref('')
const previewUrl = ref('')

const id = computed(() => route.params.id as string)
const contacto = computed(() => typeof gestion.value?.contactoId === 'object' ? gestion.value.contactoId as any : null)
const stageDraft = computed({
  get: () => gestion.value?.stage ?? 'solicitada',
  set: (value: GestionCompraStage) => {
    if (gestion.value) gestion.value.stage = value as any
  },
})
const viewUrl = computed(() => `${window.location.origin}/compra/${gestion.value?.viewToken ?? ''}`)

const stageSteps: Array<{ value: GestionCompraStage; label: string; desc: string; icon: string }> = [
  { value: 'solicitada', label: 'Solicitada', desc: 'Recibida por el equipo', icon: 'fa-regular fa-circle-dot' },
  { value: 'revisando', label: 'Revisando', desc: 'Validando la compra', icon: 'fa-solid fa-magnifying-glass' },
  { value: 'comprada', label: 'Comprada', desc: 'Pedido confirmado', icon: 'fa-solid fa-cart-shopping' },
  { value: 'en_transito', label: 'En tránsito', desc: 'En camino al país', icon: 'fa-solid fa-truck-fast' },
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
const stageProgress = computed(() => {
  const index = stageIndex(gestion.value?.stage ?? 'solicitada')
  return Math.round(((index + 1) / stageSteps.length) * 100)
})

const editForm = ref({ paginaCompra: '', fechaEntregaTentativa: '', notas: '' })

function stageIndex(stage: GestionCompraStage) {
  return stageSteps.findIndex((item) => item.value === stage)
}

function estadoLabel(e: string) {
  return { borrador: 'Borrador', activa: 'Activa', completado: 'Completado', cancelado: 'Cancelado' }[e] ?? e
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' })
}

async function load() {
  loading.value = true
  try {
    gestion.value = await gestionesCompraAPI.getById(id.value)
    editForm.value = {
      paginaCompra: gestion.value.paginaCompra,
      fechaEntregaTentativa: (gestion.value.fechaEntregaTentativa ?? '').split('T')[0] ?? '',
      notas: gestion.value.notas ?? '',
    }
  } finally {
    loading.value = false
  }
}

async function saveEdits() {
  if (!gestion.value) return
  saving.value = true
  try {
    gestion.value = await gestionesCompraAPI.update(id.value, {
      ...editForm.value,
      stage: stageDraft.value,
      fotosRelacionadas: gestion.value.fotosRelacionadas,
    })
    toast.showNotification('Cambios guardados', 'success')
  } catch (e: any) {
    toast.showNotification(e?.message ?? 'Error', 'error')
  } finally {
    saving.value = false
  }
}

async function setStage(stage: GestionCompraStage) {
  if (!gestion.value || stage === gestion.value.stage) return
  try {
    gestion.value = await gestionesCompraAPI.update(id.value, { stage, fotosRelacionadas: gestion.value.fotosRelacionadas })
    toast.showNotification('Stage actualizado', 'success')
  } catch (e: any) {
    toast.showNotification(e?.message ?? 'Error', 'error')
  }
}

async function onPhotoSelect(event: Event) {
  const files = Array.from((event.target as HTMLInputElement).files ?? [])
  if (!files.length || !gestion.value) return

  uploadingPhotos.value = true
  photoError.value = ''

  try {
    const current = [...(gestion.value.fotosRelacionadas ?? [])]

    for (const file of files) {
      const url = await gestionesCompraAPI.uploadImagen(file)
      current.push({
        url,
        title: photoTitle.value.trim() || `Foto ${current.length + 1}`,
        createdAt: new Date().toISOString(),
      })
    }

    gestion.value = await gestionesCompraAPI.update(id.value, {
      fotosRelacionadas: current,
      stage: stageDraft.value,
    })
    photoTitle.value = ''
    toast.showNotification('Fotos agregadas', 'success')
  } catch (e: any) {
    photoError.value = e?.message ?? 'Error al subir fotos'
  } finally {
    uploadingPhotos.value = false
    ;(event.target as HTMLInputElement).value = ''
  }
}

function openPreview(url: string) {
  previewUrl.value = url
}

function copyLink() {
  navigator.clipboard.writeText(viewUrl.value)
  toast.showNotification('Enlace copiado', 'success')
}

function openPublicLink() {
  window.open(viewUrl.value, '_blank', 'noopener,noreferrer')
}

onMounted(load)
</script>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.page { display: flex; flex-direction: column; gap: $space-5; padding: $space-6; }
.hero-card,
.card {
  background: $ink-900;
  border: 1px solid $ink-500;
  border-radius: 18px;
}
.hero-card {
  display: flex; justify-content: space-between; gap: $space-5; align-items: flex-start;
  padding: $space-6;
}
.eyebrow { display: inline-flex; align-items: center; gap: $space-2; color: $brand-orange; text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.72rem; font-weight: 800; }
.hero-copy h1 { margin: $space-2 0; font-size: 1.8rem; line-height: 1.1; }
.hero-copy p { margin: 0; color: $ink-300; line-height: 1.6; max-width: 720px; }
.hero-actions { display: flex; align-items: center; gap: $space-3; flex-wrap: wrap; justify-content: flex-end; }
.btn-back {
  display: inline-flex; align-items: center; gap: $space-2;
  background: transparent; border: 1px solid rgba($brand-orange, 0.25); color: $brand-orange;
  border-radius: 14px; padding: $space-2 $space-4; cursor: pointer;
}

.stage-reader { padding: $space-5; display: flex; flex-direction: column; gap: $space-4; }
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: $space-3; }
.panel-head h3 { display: flex; align-items: center; gap: $space-2; margin: 0; font-size: 1rem; }
.panel-head span { color: $ink-400; font-size: 0.82rem; }
.stage-track { height: 4px; background: $ink-700; border-radius: 999px; overflow: hidden; }
.stage-track__fill { height: 100%; background: $brand-orange; border-radius: 999px; transition: width 0.25s ease; }
.stage-steps { display: flex; flex-wrap: wrap; gap: $space-3; }
.stage-step {
  flex: 1 1 180px; display: flex; align-items: flex-start; gap: $space-3; text-align: left;
  padding: $space-4; border-radius: 16px; border: 1px solid $ink-500; background: $ink-1000; color: $fg-dark; cursor: pointer;
}
.stage-step.active { border-color: $brand-orange; background: rgba(240,138,31,0.08); }
.stage-step.done { border-color: rgba(43,187,146,0.25); }
.stage-step__dot { width: 34px; height: 34px; border-radius: 999px; background: rgba(240,138,31,0.12); color: $brand-orange; display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; }
.stage-step__text { display: flex; flex-direction: column; gap: 2px; }
.stage-step__text strong { font-size: 0.92rem; }
.stage-step__text small { color: $ink-400; line-height: 1.4; }

.content-grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: $space-5; align-items: start; }
.content-main, .content-side { display: flex; flex-direction: column; gap: $space-5; min-width: 0; }
.info-card, .gallery-card { padding: $space-5; }
.info-list { display: flex; flex-direction: column; }
.info-row {
  display: grid; grid-template-columns: 150px 1fr; gap: $space-2; align-items: center;
  padding: $space-2 0; border-bottom: 1px solid $ink-700;
}
.info-row:last-child { border-bottom: none; }
.info-row span:first-child { color: $ink-300; font-size: 0.82rem; }
.inline-row { display: flex; align-items: center; gap: $space-2; flex-wrap: wrap; }
.orange { color: $brand-orange; font-weight: 700; }
.green { color: $signal-green; }
.muted { color: $ink-400; }
.link { color: $brand-orange; word-break: break-all; }
.chip { padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
.chip.green { background: rgba(43,187,146,0.15); color: $signal-green; }
.chip.muted { background: $ink-700; color: $ink-300; }

.upload-bar { display: flex; flex-wrap: wrap; gap: $space-3; margin-bottom: $space-3; }
.title-input,
.select-input,
.date-input {
  background: $ink-1000; border: 1px solid $ink-500; color: $fg-dark; border-radius: 12px; padding: $space-3 $space-4; min-height: 46px;
}
.title-input { flex: 1 1 220px; }
.select-input { width: 100%; }
.field-group { display: flex; flex-direction: column; gap: $space-2; }
.field-group span { color: $ink-300; font-size: 0.82rem; }
.upload-btn {
  display: inline-flex; align-items: center; gap: $space-2; cursor: pointer; border-radius: 12px; padding: $space-3 $space-4;
  background: rgba(240,138,31,0.1); color: $brand-orange; border: 1px solid rgba(240,138,31,0.22);
}
.hidden { display: none; }
.error-text { color: $signal-red; font-size: 0.82rem; margin: 0 0 $space-3; }
.gallery-grid { display: flex; flex-wrap: wrap; gap: $space-3; }
.gallery-item {
  flex: 1 1 180px; min-width: 0; border: 1px solid $ink-500; border-radius: 16px; overflow: hidden; background: $ink-1000; text-align: left; cursor: pointer; padding: 0;
}
.gallery-item img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block; }
.gallery-item__meta { display: flex; flex-direction: column; gap: 4px; padding: $space-3; }
.gallery-item__meta strong { font-size: 0.84rem; }
.gallery-item__meta small { color: $ink-400; }
.empty-text { color: $ink-400; margin: 0; }

.edit-form { display: flex; flex-direction: column; gap: $space-3; }
.link-stack { display: flex; flex-direction: column; gap: $space-3; }
.public-link { font-size: 0.78rem; color: $ink-300; word-break: break-all; background: $ink-1000; padding: $space-3; border-radius: 12px; border: 1px solid $ink-500; }
.link-actions { display: flex; gap: $space-2; flex-wrap: wrap; }
.audit-list { display: flex; flex-direction: column; gap: $space-3; }
.audit-entry { display: flex; flex-direction: column; gap: 4px; padding-bottom: $space-3; border-bottom: 1px solid $ink-700; }
.audit-entry:last-child { border-bottom: none; padding-bottom: 0; }
.audit-action { color: $brand-orange; font-weight: 700; font-size: 0.84rem; }
.audit-who { color: $fg-dark; font-size: 0.9rem; }
.audit-date, .audit-notes { color: $ink-400; font-size: 0.78rem; }

.estado-badge { display: inline-flex; align-items: center; justify-content: center; padding: 4px 12px; border-radius: 999px; font-size: 0.8rem; font-weight: 700; }
.estado-activa { background: rgba(43,187,146,0.15); color: $signal-green; }
.estado-borrador { background: rgba(111,111,122,0.2); color: $ink-300; }
.estado-completado { background: rgba(43,187,146,0.25); color: $signal-green; }
.estado-cancelado { background: rgba(229,72,77,0.15); color: $signal-red; }

.loading-state { padding: $space-8; text-align: center; color: $ink-400; }

.lightbox {
  position: fixed; inset: 0; background: rgba(0,0,0,0.82); display: flex; align-items: center; justify-content: center; padding: $space-4; z-index: 60;
}
.lightbox img { max-width: min(100%, 1100px); max-height: 82vh; border-radius: 16px; box-shadow: 0 20px 80px rgba(0,0,0,0.45); }
.lightbox-close {
  position: absolute; top: $space-4; right: $space-4; width: 42px; height: 42px; border-radius: 999px; border: none; background: $ink-1000; color: $fg-dark; cursor: pointer;
}

@media (max-width: 980px) {
  .hero-card, .content-grid { display: flex; flex-direction: column; }
  .content-side { order: 2; }
}
</style>
