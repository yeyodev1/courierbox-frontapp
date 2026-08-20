<script setup lang="ts">
/** Related photos of the gestión, with upload and a lightbox preview. */
import { ref } from 'vue'
import type { GestionCompraFoto } from '@/services/gestiones_compra.api'
import type { UploadItem } from '@/composables/useUploadQueue'
import AppUploadProgress from '@/components/ui/AppUploadProgress.vue'
import { formatDate } from './useGestionDetalle'

defineProps<{
  fotos: GestionCompraFoto[]
  uploading: boolean
  error: string
  queueItems: UploadItem[]
  queueDone: number
  queueFailed: number
  queuePending: number
  queuePercent: number
  queueMessage: string
}>()
const emit = defineEmits<{ upload: [files: File[], title: string] }>()

const title = ref('')
const preview = ref('')

function onSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (files.length) emit('upload', files, title.value)
  title.value = ''
  input.value = ''
}
</script>

<template>
  <article class="card gallery-card">
    <div class="panel-head">
      <h3><i class="fa-solid fa-images" aria-hidden="true" /> Fotos relacionadas</h3>
      <span>{{ fotos.length }}</span>
    </div>

    <div class="upload-bar">
      <input v-model="title" class="title-input" type="text" placeholder="Título de la foto (opcional)" />
      <label class="upload-btn">
        <input type="file" accept="image/*" multiple class="hidden" @change="onSelect" />
        <i class="fa-solid fa-cloud-arrow-up" aria-hidden="true" />
        {{ uploading ? 'Subiendo...' : 'Agregar fotos' }}
      </label>
    </div>

    <div v-if="uploading && queueItems.length" class="upload-panel">
      <AppUploadProgress
        :items="queueItems"
        :done="queueDone"
        :failed="queueFailed"
        :pending="queuePending"
        :percent="queuePercent"
        :message="queueMessage"
        hint="Puedes esperar tranquilo: cada foto se guarda por separado."
      />
    </div>

    <p v-if="error" class="error-text">{{ error }}</p>

    <div v-if="fotos.length" class="gallery-grid">
      <button
        v-for="(foto, index) in fotos"
        :key="`${foto.url}-${index}`"
        class="gallery-item"
        @click="preview = foto.url"
      >
        <img :src="foto.url" :alt="foto.title ?? 'Foto relacionada'" />
        <span class="gallery-item__meta">
          <strong>{{ foto.title ?? (index === 0 ? 'Imagen principal' : `Foto ${index + 1}`) }}</strong>
          <small>{{ formatDate(foto.createdAt) }}</small>
        </span>
      </button>
    </div>

    <p v-else class="empty-text">Todavía no hay fotos relacionadas.</p>

    <div v-if="preview" class="lightbox" @click.self="preview = ''">
      <img :src="preview" alt="Vista previa" />
      <button class="lightbox-close" aria-label="Cerrar" @click="preview = ''">
        <i class="fa-solid fa-xmark" aria-hidden="true" />
      </button>
    </div>
  </article>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.18);
  border-radius: 20px;
  padding: $space-5;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  margin-bottom: $space-3;

  h3 { display: flex; align-items: center; gap: $space-2; margin: 0; font-size: 1rem; }
  span { color: $ink-400; font-size: 0.82rem; }
}

.upload-bar {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
  margin-bottom: $space-3;
}

.upload-panel {
  display: flex;
  justify-content: center;
}

.title-input {
  flex: 1 1 220px;
  background: $ink-1000;
  border: 1px solid $ink-500;
  border-radius: 12px;
  color: $fg-dark;
  padding: $space-3;
  font-family: inherit;
  outline: none;

  &:focus { border-color: rgba($brand-orange, 0.5); }
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-radius: 12px;
  border: 1px solid rgba($brand-orange, 0.3);
  background: rgba($brand-orange, 0.08);
  color: $brand-orange;
  font-weight: 700;
  cursor: pointer;
}

.hidden { display: none; }

.error-text { color: $signal-red; font-size: 0.82rem; margin: 0 0 $space-3; }
.empty-text { color: $ink-400; margin: 0; }

.gallery-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
}

.gallery-item {
  flex: 1 1 180px;
  max-width: 240px;
  border: 1px solid $ink-700;
  border-radius: 14px;
  background: $ink-1000;
  color: inherit;
  font-family: inherit;
  overflow: hidden;
  cursor: pointer;
  padding: 0;

  img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block; }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: $space-3;
    text-align: left;

    strong { font-size: 0.84rem; }
    small { color: $ink-400; }
  }
}

.lightbox {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-5;
  background: rgba(0, 0, 0, 0.82);

  img {
    max-width: min(100%, 1100px);
    max-height: 82vh;
    border-radius: 16px;
    box-shadow: 0 20px 80px rgba(0, 0, 0, 0.45);
  }
}

.lightbox-close {
  position: absolute;
  top: $space-5;
  right: $space-5;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid rgba($ink-100, 0.25);
  background: rgba($ink-1000, 0.7);
  color: $ink-100;
  cursor: pointer;
}
</style>
