<script setup lang="ts">
/** Local preview of the receipt before it is uploaded. */
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{ file: File | null }>()

const url = ref('')

// Object URLs leak until revoked, so swap and clean up on every change.
watch(
  () => props.file,
  (file) => {
    if (url.value) URL.revokeObjectURL(url.value)
    url.value = file ? URL.createObjectURL(file) : ''
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (url.value) URL.revokeObjectURL(url.value)
})
</script>

<template>
  <div v-if="url" class="form-field full-width preview-field">
    <span>Vista previa</span>

    <div v-if="file?.type.startsWith('image/')" class="preview-frame image-frame">
      <img :src="url" alt="Vista previa del comprobante" />
    </div>
    <div v-else-if="file?.type === 'application/pdf'" class="preview-frame pdf-frame">
      <iframe :src="url" title="Vista previa del comprobante" />
    </div>
    <div v-else class="preview-fallback">
      <p>{{ file?.name || 'Archivo seleccionado' }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.form-field {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  > span { font-size: 0.8rem; color: $ink-400; font-weight: 600; }
}

.full-width { grid-column: 1 / -1; }

.preview-frame {
  border: 1px solid rgba($ink-500, 0.2);
  border-radius: 12px;
  overflow: hidden;
  background: $ink-1000;

  img { width: 100%; display: block; max-height: 320px; object-fit: contain; }
  iframe { width: 100%; height: 320px; border: 0; }
}

.preview-fallback {
  padding: $space-3;
  border-radius: 12px;
  border: 1px dashed rgba($ink-500, 0.3);
  color: $ink-300;

  p { margin: 0; }
}
</style>
