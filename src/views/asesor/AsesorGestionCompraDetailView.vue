<script setup lang="ts">
/** One gestión as the asesor sees it: photos, stage and the public link. */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import type { GestionCompraStage } from '@/services/gestiones_compra.api'
import StageReader from './GestionDetalle/StageReader.vue'
import GestionGaleria from './GestionDetalle/GestionGaleria.vue'
import {
  STAGE_STEPS,
  estadoLabel,
  formatDate,
  formatDateTime,
  useGestionDetalle,
} from './GestionDetalle/useGestionDetalle'

const route = useRoute()
const router = useRouter()

const g = useGestionDetalle(() => route.params.id as string)

/** Local draft so the select can move without committing until "Guardar". */
const stageDraft = ref<GestionCompraStage>('solicitada')

const auditReciente = computed(() => (g.gestion.value?.auditLog ?? []).slice().reverse())

onMounted(async () => {
  await g.load()
  stageDraft.value = g.stage.value
})
</script>

<template>
  <div v-if="!g.loading.value && g.gestion.value" class="page">
    <section class="hero-card">
      <div class="hero-copy">
        <span class="eyebrow"><i class="fa-solid fa-bag-shopping" aria-hidden="true" /> Gestión de compra</span>
        <h1>Controla fotos, stage y enlace público en un solo lugar.</h1>
        <p>Agrega más fotos relacionadas, avanza la etapa y comparte el link del cliente cuando quieras.</p>
      </div>
      <div class="hero-actions">
        <button class="btn-back" @click="router.push('/asesor/gestiones-compra')">
          <i class="fa-solid fa-arrow-left" aria-hidden="true" /> Mis gestiones
        </button>
        <span class="estado-badge" :class="`estado-${g.gestion.value.estado}`">
          {{ estadoLabel(g.gestion.value.estado) }}
        </span>
      </div>
    </section>

    <StageReader
      :stage="g.stage.value"
      :label="g.currentStageLabel.value"
      :progress="g.stageProgress.value"
      @set-stage="g.setStage"
    />

    <section class="content-grid">
      <div class="content-main">
        <article class="card info-card">
          <div class="panel-head"><h3><i class="fa-solid fa-user" aria-hidden="true" /> Cliente</h3></div>
          <div class="info-list">
            <div class="info-row"><span>Nombre</span><strong>{{ g.contacto.value?.nombre ?? '—' }}</strong></div>
            <div v-if="g.contacto.value?.email" class="info-row">
              <span>Email</span>
              <a :href="`mailto:${g.contacto.value.email}`" class="link">{{ g.contacto.value.email }}</a>
            </div>
            <div v-if="g.contacto.value?.telefono" class="info-row">
              <span>Teléfono</span><strong>{{ g.contacto.value.telefono }}</strong>
            </div>
          </div>
        </article>

        <article class="card info-card">
          <div class="panel-head"><h3><i class="fa-solid fa-dollar-sign" aria-hidden="true" /> Resumen</h3></div>
          <div class="info-list">
            <div class="info-row">
              <span>Valor total</span><strong class="orange">${{ g.gestion.value.valorTotal.toFixed(2) }}</strong>
            </div>
            <div class="info-row">
              <span>Reserva</span>
              <span class="inline-row">
                <strong>${{ g.gestion.value.valorReserva.toFixed(2) }}</strong>
                <span v-if="g.gestion.value.reservaConfirmada" class="chip green">Confirmada</span>
                <span v-else class="chip muted">Pendiente</span>
              </span>
            </div>
            <div class="info-row">
              <span>Página de compra</span>
              <a :href="g.gestion.value.paginaCompra" target="_blank" rel="noopener" class="link">
                {{ g.gestion.value.paginaCompra }}
              </a>
            </div>
            <div class="info-row">
              <span>Entrega tentativa</span>
              <strong>{{ formatDate(g.gestion.value.fechaEntregaTentativa) }}</strong>
            </div>
            <div v-if="g.gestion.value.notas" class="info-row">
              <span>Notas</span><span class="muted">{{ g.gestion.value.notas }}</span>
            </div>
          </div>
        </article>

        <GestionGaleria
          :fotos="g.galleryPhotos.value"
          :uploading="g.uploadingPhotos.value"
          :error="g.photoError.value"
          :queue-items="g.photoQueue.items.value"
          :queue-done="g.photoQueue.doneCount.value"
          :queue-failed="g.photoQueue.failedCount.value"
          :queue-pending="g.photoQueue.pendingCount.value"
          :queue-percent="g.photoQueue.percent.value"
          :queue-message="g.photoQueue.message.value"
          @upload="g.addPhotos"
        />
      </div>

      <aside class="content-side">
        <article class="card info-card">
          <div class="panel-head"><h3><i class="fa-solid fa-pen-to-square" aria-hidden="true" /> Editar datos</h3></div>
          <div class="edit-form">
            <label class="field-group">
              <span>Stage</span>
              <select v-model="stageDraft" class="select-input">
                <option v-for="step in STAGE_STEPS" :key="step.value" :value="step.value">{{ step.label }}</option>
              </select>
            </label>
            <AppInput v-model="g.editForm.value.paginaCompra" label="Página de compra" />
            <label class="field-group">
              <span>Fecha tentativa</span>
              <input v-model="g.editForm.value.fechaEntregaTentativa" type="date" class="date-input" />
            </label>
            <AppInput v-model="g.editForm.value.notas" label="Notas" />
            <AppButton variant="primary" :disabled="g.saving.value" @click="g.saveEdits(stageDraft)">
              {{ g.saving.value ? 'Guardando...' : 'Guardar cambios' }}
            </AppButton>
          </div>
        </article>

        <article class="card info-card">
          <div class="panel-head"><h3><i class="fa-solid fa-link" aria-hidden="true" /> Enlace público</h3></div>
          <div class="link-stack">
            <code class="public-link">{{ g.viewUrl.value }}</code>
            <div class="link-actions">
              <AppButton variant="outline" size="sm" @click="g.openPublicLink">Abrir enlace</AppButton>
              <AppButton variant="outline" size="sm" @click="g.copyLink">Copiar</AppButton>
            </div>
          </div>
        </article>

        <article class="card info-card">
          <div class="panel-head"><h3><i class="fa-solid fa-clock-rotate-left" aria-hidden="true" /> Historial</h3></div>
          <div class="audit-list">
            <div v-for="(entry, i) in auditReciente" :key="i" class="audit-entry">
              <span class="audit-action">{{ entry.action }}</span>
              <span class="audit-who">{{ entry.userName }}</span>
              <span class="audit-date">{{ formatDateTime(entry.timestamp) }}</span>
              <span v-if="entry.notes" class="audit-notes">{{ entry.notes }}</span>
            </div>
          </div>
        </article>
      </aside>
    </section>
  </div>

  <div v-else-if="g.loading.value" class="loading-state">Cargando gestión...</div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.page {
  display: flex;
  flex-direction: column;
  gap: $space-5;
  padding: $space-6;
}

.hero-card,
.card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.18);
  border-radius: 20px;
}

.hero-card {
  display: flex;
  justify-content: space-between;
  gap: $space-4;
  padding: $space-6;
  flex-wrap: wrap;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  color: $brand-orange;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.72rem;
  font-weight: 800;
}

.hero-copy {
  h1 { margin: $space-2 0; font-size: 1.8rem; line-height: 1.1; }
  p { margin: 0; color: $ink-300; line-height: 1.6; max-width: 720px; }
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: $space-3;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  border: 1px solid rgba($ink-500, 0.35);
  border-radius: 14px;
  padding: $space-3 $space-4;
  background: transparent;
  color: $ink-200;
  font-family: inherit;
  cursor: pointer;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;

  h3 { display: flex; align-items: center; gap: $space-2; margin: 0; font-size: 1rem; }
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: $space-5;
  align-items: start;

  @media (max-width: 980px) { grid-template-columns: 1fr; }
}

.content-main,
.content-side {
  display: flex;
  flex-direction: column;
  gap: $space-5;
  min-width: 0;
}

.info-card { padding: $space-5; }

.info-list { display: flex; flex-direction: column; }

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  padding: $space-3 0;
  border-bottom: 1px solid $ink-700;

  &:last-child { border-bottom: none; }
  span:first-child { color: $ink-300; font-size: 0.82rem; }
}

.inline-row { display: flex; align-items: center; gap: $space-2; flex-wrap: wrap; }
.orange { color: $brand-orange; font-weight: 700; }
.muted { color: $ink-400; }
.link { color: $brand-orange; word-break: break-all; }

.chip {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;

  &.green { background: rgba($signal-green, 0.15); color: $signal-green; }
  &.muted { background: $ink-700; color: $ink-300; }
}

.select-input,
.date-input {
  background: $ink-1000;
  border: 1px solid $ink-500;
  border-radius: 12px;
  color: $fg-dark;
  padding: $space-3;
  font-family: inherit;
  outline: none;

  &:focus { border-color: rgba($brand-orange, 0.5); }
}

.select-input { width: 100%; }

.field-group {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  span { color: $ink-300; font-size: 0.82rem; }
}

.edit-form,
.link-stack,
.audit-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.public-link {
  font-size: 0.78rem;
  color: $ink-300;
  word-break: break-all;
  background: $ink-1000;
  padding: $space-3;
  border-radius: 12px;
  border: 1px solid $ink-500;
}

.link-actions { display: flex; gap: $space-2; flex-wrap: wrap; }

.audit-entry {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: $space-3;
  border-bottom: 1px solid $ink-700;

  &:last-child { border-bottom: none; padding-bottom: 0; }
}

.audit-action { color: $brand-orange; font-weight: 700; font-size: 0.84rem; }
.audit-who { color: $fg-dark; font-size: 0.9rem; }
.audit-date,
.audit-notes { color: $ink-400; font-size: 0.78rem; }

.estado-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;

  &.estado-activa { background: rgba($signal-green, 0.15); color: $signal-green; }
  &.estado-borrador { background: rgba($ink-500, 0.2); color: $ink-300; }
  &.estado-completado { background: rgba($signal-green, 0.25); color: $signal-green; }
  &.estado-cancelado { background: rgba($signal-red, 0.15); color: $signal-red; }
}

.loading-state {
  padding: $space-8;
  text-align: center;
  color: $ink-400;
}
</style>
