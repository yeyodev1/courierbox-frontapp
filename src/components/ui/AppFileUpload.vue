<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

interface Props {
  modelValue: File | null
  label?: string
  hint?: string
  accept?: string
  disabled?: boolean
  error?: string
  id?: string
  variant?: 'default' | 'proof'
}

const props = withDefaults(defineProps<Props>(), {
  hint: 'Arrastra el archivo aquí o selecciónalo manualmente',
  accept: '*/*',
  disabled: false,
  variant: 'default',
})

const emit = defineEmits<{
  'update:modelValue': [value: File | null]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const previewUrl = ref('')
const fieldId = computed(() => props.id ?? `upload-${Math.random().toString(36).slice(2, 9)}`)

const selectedFile = computed(() => props.modelValue)
const fileName = computed(() => selectedFile.value?.name ?? '')
const fileSize = computed(() => formatFileSize(selectedFile.value?.size ?? 0))
const isImage = computed(() => !!selectedFile.value?.type.startsWith('image/'))
const fileLabel = computed(() => {
  if (!selectedFile.value) return ''
  if (selectedFile.value.type === 'application/pdf') return 'PDF'
  if (selectedFile.value.type.startsWith('image/')) return 'Imagen'
  return 'Archivo'
})

function formatFileSize(bytes: number) {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function syncPreview(file: File | null) {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
  if (file?.type.startsWith('image/')) {
    previewUrl.value = URL.createObjectURL(file)
  }
}

function pickFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] || null
  emit('update:modelValue', file)
}

function clearFile() {
  if (inputRef.value) inputRef.value.value = ''
  emit('update:modelValue', null)
}

function openPicker() {
  if (props.disabled) return
  inputRef.value?.click()
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
  if (props.disabled) return
  const file = event.dataTransfer?.files?.[0] || null
  if (file) emit('update:modelValue', file)
}

watch(
  () => props.modelValue,
  (file) => syncPreview(file),
  { immediate: true }
)

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>

<template>
  <div :class="['app-file-upload', `app-file-upload--${variant}`, { 'is-dragging': isDragging, 'has-file': !!selectedFile, 'has-error': !!error, 'is-disabled': disabled }]">
    <label v-if="label" :for="fieldId" class="app-file-upload__label">{{ label }}</label>

    <div v-if="variant === 'proof'" class="app-file-upload__banner">
      <span class="banner-chip"><i class="fa-solid fa-shield-halved" /> Cloudinary secure</span>
      <span class="banner-chip secondary"><i class="fa-solid fa-wand-magic-sparkles" /> Vista premium</span>
    </div>

    <input
      :id="fieldId"
      ref="inputRef"
      class="app-file-upload__input"
      type="file"
      :accept="accept"
      :disabled="disabled"
      @change="pickFile"
    />

    <div
      class="app-file-upload__dropzone"
      role="button"
      tabindex="0"
      @click="openPicker"
      @keydown.enter.prevent="openPicker"
      @keydown.space.prevent="openPicker"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop="onDrop"
    >
      <div v-if="selectedFile" class="app-file-upload__selected">
        <div class="preview" :class="{ 'is-image': isImage }">
          <img v-if="isImage && previewUrl" :src="previewUrl" :alt="fileName" />
          <i v-else class="fa-solid" :class="selectedFile.type === 'application/pdf' ? 'fa-file-pdf' : 'fa-file-lines'" />
        </div>

        <div class="meta">
          <span class="badge">{{ fileLabel }}</span>
          <span v-if="variant === 'proof'" class="badge badge-alt">Verificado visualmente</span>
          <strong>{{ fileName }}</strong>
          <small>{{ fileSize }} · listo para subir a Cloudinary</small>
          <div v-if="variant === 'proof'" class="meta-line">
            <span><i class="fa-solid fa-circle-check" /> Nítido</span>
            <span><i class="fa-solid fa-lock" /> Privado</span>
            <span><i class="fa-solid fa-cloud" /> Procesado en la nube</span>
          </div>
        </div>

        <div class="actions">
          <button type="button" class="action-btn" @click.stop="openPicker">Cambiar</button>
          <button type="button" class="action-btn danger" @click.stop="clearFile">Quitar</button>
        </div>
      </div>

      <div v-else class="app-file-upload__empty">
        <div class="empty-icon"><i class="fa-solid fa-cloud-arrow-up" /></div>
        <div>
          <strong>{{ variant === 'proof' ? 'Sube tu factura o comprobante' : 'Selecciona o arrastra tu archivo' }}</strong>
          <p>{{ hint }}</p>
          <div v-if="variant === 'proof'" class="empty-pills">
            <span>PDF</span>
            <span>JPG</span>
            <span>PNG</span>
            <span>Cloudinary</span>
          </div>
        </div>
        <button type="button" class="browse-btn" @click.stop="openPicker">Buscar archivo</button>
      </div>
    </div>

    <p v-if="error" class="app-file-upload__error">{{ error }}</p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.app-file-upload {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  width: 100%;

  &__label {
    font-size: 0.8rem;
    font-weight: 500;
    color: $ink-300;
  }

  &__input {
    display: none;
  }

  &--proof {
    .app-file-upload__dropzone {
      border-style: solid;
      border-color: rgba($brand-orange, 0.18);
      background:
        radial-gradient(circle at top left, rgba($brand-orange, 0.18), transparent 36%),
        linear-gradient(180deg, rgba($ink-1000, 0.55), rgba($ink-900, 0.98));
    }
  }

  &__banner {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .banner-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.7rem;
    border-radius: 999px;
    background: rgba($brand-orange, 0.14);
    color: $brand-orange;
    font-size: 0.72rem;
    font-weight: 700;

    &.secondary {
      background: rgba($ink-700, 0.75);
      color: $ink-200;
    }
  }

  &__dropzone {
    border: 1px dashed rgba($ink-500, 0.35);
    background: linear-gradient(180deg, rgba($ink-1000, 0.45), rgba($ink-900, 0.95));
    border-radius: 16px;
    padding: $space-4;
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 132px;

    &:hover {
      border-color: rgba($brand-orange, 0.45);
      transform: translateY(-1px);
      box-shadow: 0 16px 30px rgba(0, 0, 0, 0.16);
    }
  }

  &.is-dragging &__dropzone {
    border-color: $brand-orange;
    background: rgba($brand-orange, 0.08);
  }

  &__empty,
  &__selected {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-4;
  }

  &__empty {
    min-height: 100px;

    strong {
      display: block;
      color: $fg-dark;
      margin-bottom: 0.25rem;
    }

    p {
      margin: 0;
      color: $ink-400;
      font-size: 0.85rem;
    }

    .empty-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
      margin-top: 0.75rem;

      span {
        padding: 0.28rem 0.55rem;
        border-radius: 999px;
        background: rgba($brand-orange, 0.1);
        color: $brand-orange;
        font-size: 0.7rem;
        font-weight: 700;
      }
    }
  }

  .empty-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: rgba($brand-orange, 0.12);
    color: $brand-orange;
    font-size: 1.2rem;
    flex: 0 0 auto;
  }

  &__selected {
    .preview {
      width: 72px;
      height: 72px;
      border-radius: 16px;
      display: grid;
      place-items: center;
      background: rgba($ink-700, 0.6);
      overflow: hidden;
      flex: 0 0 auto;

      &.is-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      i {
        font-size: 1.5rem;
        color: $brand-orange;
      }
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

      strong {
        display: block;
        color: $fg-dark;
        font-size: 0.95rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      small {
        color: $ink-400;
      }

      .badge-alt {
        margin-left: 0.4rem;
        background: rgba($signal-green, 0.12);
        color: $signal-green;
      }

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
  }

  .action-btn,
  .browse-btn {
    border: none;
    border-radius: 12px;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 600;
  }

  .action-btn {
    padding: 0.6rem 0.9rem;
    background: rgba($ink-700, 0.8);
    color: $fg-dark;

    &:hover {
      background: rgba($ink-600, 0.9);
    }

    &.danger {
      background: rgba($signal-red, 0.12);
      color: #ff8a8f;
    }
  }

  .browse-btn {
    padding: 0.75rem 1rem;
    background: $brand-orange;
    color: $ink-1000;

    &:hover {
      background: lighten($brand-orange, 6%);
    }
  }

  &__error {
    margin: 0;
    font-size: 0.8rem;
    color: #ff8a8f;
  }
}
</style>
