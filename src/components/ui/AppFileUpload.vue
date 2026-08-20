<script setup lang="ts">
/** Drag-and-drop file field with an inline preview of what was chosen. */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import FileUploadSelected from './FileUpload/FileUploadSelected.vue'

const props = withDefaults(
  defineProps<{
    modelValue: File | null
    label?: string
    hint?: string
    accept?: string
    disabled?: boolean
    error?: string
    id?: string
    variant?: 'default' | 'proof'
  }>(),
  {
    hint: 'Arrastra el archivo aquí o selecciónalo manualmente',
    accept: '*/*',
    disabled: false,
    variant: 'default',
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: File | null] }>()

const inputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const previewUrl = ref('')

const fieldId = computed(() => props.id ?? `upload-${Math.random().toString(36).slice(2, 9)}`)
const isProof = computed(() => props.variant === 'proof')

// Object URLs leak until revoked, so swap and clean up on every change.
watch(
  () => props.modelValue,
  (file) => {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = file?.type.startsWith('image/') ? URL.createObjectURL(file) : ''
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

function pickFile(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).files?.[0] || null)
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
</script>

<template>
  <div
    class="app-file-upload"
    :class="[
      `app-file-upload--${variant}`,
      { 'is-dragging': isDragging, 'has-file': !!modelValue, 'has-error': !!error, 'is-disabled': disabled },
    ]"
  >
    <label v-if="label" :for="fieldId" class="app-file-upload__label">{{ label }}</label>

    <div v-if="isProof" class="app-file-upload__banner">
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
      <FileUploadSelected
        v-if="modelValue"
        :file="modelValue"
        :preview-url="previewUrl"
        :proof="isProof"
        @change="openPicker"
        @clear="clearFile"
      />

      <div v-else class="app-file-upload__empty">
        <div class="empty-icon"><i class="fa-solid fa-cloud-arrow-up" /></div>
        <div>
          <strong>{{ isProof ? 'Sube tu factura o comprobante' : 'Selecciona o arrastra tu archivo' }}</strong>
          <p>{{ hint }}</p>
          <div v-if="isProof" class="empty-pills">
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
@use 'sass:color';
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

  &__input { display: none; }

  &__banner {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
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

  &--proof &__dropzone {
    border-style: solid;
    border-color: rgba($brand-orange, 0.18);
    background:
      radial-gradient(circle at top left, rgba($brand-orange, 0.18), transparent 36%),
      linear-gradient(180deg, rgba($ink-1000, 0.55), rgba($ink-900, 0.98));
  }

  &.is-dragging &__dropzone {
    border-color: $brand-orange;
    background: rgba($brand-orange, 0.08);
  }

  &__empty {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-4;
    min-height: 100px;

    strong { display: block; color: $fg-dark; margin-bottom: 0.25rem; }
    p { margin: 0; color: $ink-400; font-size: 0.85rem; }
  }

  &__error {
    margin: 0;
    font-size: 0.8rem;
    color: #ff8a8f;
  }
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

  &.secondary { background: rgba($ink-700, 0.75); color: $ink-200; }
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

.browse-btn {
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  background: $brand-orange;
  color: $ink-1000;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover { background: color.adjust($brand-orange, $lightness: 6%); }
}

@media (prefers-reduced-motion: reduce) {
  .app-file-upload__dropzone,
  .browse-btn { transition: none; }
  .app-file-upload__dropzone:hover { transform: none; }
}
</style>
