<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

type PreviewKind = 'image' | 'pdf' | 'other' | 'empty'

const props = defineProps({
  source: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: 'Previsualización del archivo',
  },
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
})

const isZoomOpen = ref(false)

const previewKind = computed<PreviewKind>(() => {
  const value = String(props.source || '').toLowerCase()
  if (!value) return 'empty'
  if (value.endsWith('.pdf') || value.includes('application/pdf')) return 'pdf'
  if (/\.(png|jpe?g|webp|gif|bmp|svg)(\?|$)/.test(value)) return 'image'
  return 'other'
})

const fileName = computed(() => {
  if (!props.source) return ''
  const clean = props.source.replace(/[#?].*$/, '')
  return clean.substring(clean.lastIndexOf('/') + 1) || props.title || 'archivo'
})

const typeLabel = computed(() => {
  switch (previewKind.value) {
    case 'image': return 'Imagen'
    case 'pdf': return 'PDF'
    case 'other': return 'Archivo'
    default: return 'Sin archivo'
  }
})

function openZoom() {
  if (previewKind.value === 'image') isZoomOpen.value = true
}

function closeZoom() {
  isZoomOpen.value = false
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isZoomOpen.value) closeZoom()
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <section class="file-preview">
    <div class="file-preview-head">
      <div>
        <h4>{{ label }}</h4>
        <p v-if="description">{{ description }}</p>
        <p v-else-if="fileName" class="file-name">{{ fileName }}</p>
      </div>
      <span class="type-badge">{{ typeLabel }}</span>
    </div>

    <div v-if="source" class="preview-shell" :class="`kind-${previewKind}`">
      <button v-if="previewKind === 'image'" type="button" class="preview-image-trigger" @click="openZoom">
        <img :src="source" :alt="title || fileName || label" />
        <span class="zoom-pill"><i class="fa-solid fa-up-right-and-down-left-from-center" /> Ampliar</span>
      </button>

      <iframe v-else-if="previewKind === 'pdf'" :src="source" :title="title || fileName || label" />

      <div v-else class="preview-fallback">
        <i class="fa-solid fa-file" />
        <p>No hay vista previa directa para este archivo.</p>
      </div>
    </div>

    <div v-else class="preview-empty">
      <i class="fa-solid fa-file-circle-xmark" />
      <p>No hay comprobante cargado.</p>
    </div>

    <div v-if="source" class="preview-actions">
      <a :href="source" target="_blank" rel="noopener noreferrer" class="action-link">
        <i class="fa-solid fa-arrow-up-right-from-square" /> Abrir
      </a>
      <a :href="source" :download="fileName" class="action-link primary">
        <i class="fa-solid fa-download" /> Descargar
      </a>
    </div>
  </section>

  <Teleport to="body">
    <transition name="fade">
      <div v-if="isZoomOpen" class="file-lightbox" @click.self="closeZoom">
        <button type="button" class="file-lightbox-close" aria-label="Cerrar ampliación" @click="closeZoom">
          <i class="fa-solid fa-xmark" />
        </button>
        <img :src="source" :alt="title || fileName || label" />
      </div>
    </transition>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.file-preview {
  display: grid;
  gap: $space-3;
}

.file-preview-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-3;

  h4 {
    margin: 0;
    font-size: 0.95rem;
  }

  p {
    margin: $space-1 0 0;
    color: $ink-400;
    font-size: 0.82rem;
  }
}

.file-name {
  word-break: break-word;
}

.type-badge {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  background: rgba($brand-orange, 0.14);
  color: $brand-orange;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.preview-shell {
  border: 1px solid rgba($ink-500, 0.15);
  border-radius: 18px;
  background: rgba($ink-900, 0.88);
  overflow: hidden;

  &.kind-image {
    background: linear-gradient(180deg, rgba($ink-900, 0.95), rgba($ink-800, 0.7));
  }

  &.kind-pdf {
    min-height: 360px;
  }

  &.kind-other,
  &.kind-empty {
    min-height: 220px;
  }

  iframe {
    width: 100%;
    min-height: 360px;
    border: 0;
    display: block;
  }
}

.preview-image-trigger {
  position: relative;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: zoom-in;

  img {
    display: block;
    width: 100%;
    max-height: 360px;
    object-fit: contain;
    background: #111;
  }
}

.zoom-pill {
  position: absolute;
  right: $space-3;
  bottom: $space-3;
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  background: rgba($ink-1000, 0.7);
  color: $fg-dark;
  font-size: 0.78rem;
  font-weight: 600;
}

.preview-fallback,
.preview-empty {
  min-height: 220px;
  display: grid;
  place-items: center;
  text-align: center;
  padding: $space-4;
  color: $ink-300;

  i {
    font-size: 2rem;
    color: $brand-orange;
    margin-bottom: $space-2;
  }

  p {
    margin: 0;
  }
}

.preview-actions {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
  flex-wrap: wrap;
}

.action-link {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: 0.55rem 0.85rem;
  border-radius: 12px;
  border: 1px solid rgba($ink-500, 0.2);
  background: rgba($ink-800, 0.55);
  color: $fg-dark;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;

  &.primary {
    border-color: rgba($brand-orange, 0.25);
    background: rgba($brand-orange, 0.12);
    color: $brand-orange;
  }
}

.file-lightbox {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba($ink-1000, 0.92);
  display: grid;
  place-items: center;
  padding: $space-4;

  img {
    max-width: min(1200px, 96vw);
    max-height: 92vh;
    object-fit: contain;
    border-radius: 16px;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
  }
}

.file-lightbox-close {
  position: fixed;
  top: $space-4;
  right: $space-4;
  width: 42px;
  height: 42px;
  border: 1px solid rgba($ink-500, 0.2);
  border-radius: 12px;
  background: rgba($ink-800, 0.9);
  color: $fg-dark;
  cursor: pointer;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .file-preview-head {
    flex-direction: column;
  }

  .preview-shell iframe {
    min-height: 300px;
  }
}
</style>
