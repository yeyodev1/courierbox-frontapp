<script setup lang="ts">
/** The chosen file: thumbnail, name, size and the change / remove actions. */
import { computed } from 'vue'
import { fileKindLabel, formatFileSize, isImageFile } from './file-upload'

const props = defineProps<{ file: File; previewUrl: string; proof: boolean }>()
const emit = defineEmits<{ change: []; clear: [] }>()

const isImage = computed(() => isImageFile(props.file))
const kind = computed(() => fileKindLabel(props.file))
const size = computed(() => formatFileSize(props.file.size))
</script>

<template>
  <div class="selected">
    <div class="preview" :class="{ 'is-image': isImage }">
      <img v-if="isImage && previewUrl" :src="previewUrl" :alt="file.name" />
      <i v-else class="fa-solid" :class="file.type === 'application/pdf' ? 'fa-file-pdf' : 'fa-file-lines'" />
    </div>

    <div class="meta">
      <span class="badge">{{ kind }}</span>
      <span v-if="proof" class="badge badge-alt">Verificado visualmente</span>
      <strong>{{ file.name }}</strong>
      <small>{{ size }} · listo para subir a Cloudinary</small>
      <div v-if="proof" class="meta-line">
        <span><i class="fa-solid fa-circle-check" /> Nítido</span>
        <span><i class="fa-solid fa-lock" /> Privado</span>
        <span><i class="fa-solid fa-cloud" /> Procesado en la nube</span>
      </div>
    </div>

    <div class="actions">
      <button type="button" class="action-btn" @click.stop="emit('change')">Cambiar</button>
      <button type="button" class="action-btn danger" @click.stop="emit('clear')">Quitar</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.selected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;
}

.preview {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba($ink-700, 0.6);
  overflow: hidden;
  flex: 0 0 auto;

  &.is-image img { width: 100%; height: 100%; object-fit: cover; }

  i { font-size: 1.5rem; color: $brand-orange; }
}

.meta {
  flex: 1 1 auto;
  min-width: 0;

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba($brand-orange, 0.14);
    color: $brand-orange;
    font-size: 0.72rem;
    font-weight: 700;
    margin-bottom: 0.45rem;
  }

  .badge-alt {
    margin-left: 0.4rem;
    background: rgba($signal-green, 0.12);
    color: $signal-green;
  }

  strong {
    display: block;
    color: $fg-dark;
    font-size: 0.95rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small { color: $ink-400; }

  .meta-line {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.55rem;

    span {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.32rem 0.55rem;
      border-radius: 999px;
      background: rgba($ink-700, 0.6);
      color: $ink-300;
      font-size: 0.72rem;
    }
  }
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 0 0 auto;
}

.action-btn {
  border: none;
  border-radius: 12px;
  padding: 0.6rem 0.9rem;
  background: rgba($ink-700, 0.8);
  color: $fg-dark;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover { background: rgba($ink-600, 0.9); }

  &.danger { background: rgba($signal-red, 0.12); color: #ff8a8f; }
}

@media (prefers-reduced-motion: reduce) {
  .action-btn { transition: none; }
}
</style>
