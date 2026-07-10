<template>
  <div class="step-imagen">
    <h3 class="step__title">Soporte de compra</h3>
    <p class="step__desc">Sube una foto, captura o comprobante. Si no existe archivo, deja marcado que quedó verificado.</p>

    <div class="support-grid">
      <button class="support-card" :class="{ selected: store.formData.comprobanteEstado === 'comprobante' }" @click="store.formData.comprobanteEstado = 'comprobante'">
        <span class="support-title">Con comprobante</span>
        <span class="support-desc">Tienes factura, captura o archivo de respaldo.</span>
      </button>
      <button class="support-card" :class="{ selected: store.formData.comprobanteEstado === 'verificado' }" @click="store.formData.comprobanteEstado = 'verificado'">
        <span class="support-title">Verificado sin archivo</span>
        <span class="support-desc">Ya se confirmó, pero no hay comprobante adjunto.</span>
      </button>
      <button class="support-card" :class="{ selected: store.formData.comprobanteEstado === 'sin_soporte' }" @click="store.formData.comprobanteEstado = 'sin_soporte'">
        <span class="support-title">Sin soporte</span>
        <span class="support-desc">Solo marca esto si vas a completar el respaldo después.</span>
      </button>
    </div>

    <div
      class="drop-zone"
      :class="{ 'drag-over': isDragging, 'has-file': !!preview }"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
      @click="fileInput?.click()"
    >
      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />

      <template v-if="preview">
        <img :src="preview" alt="Preview" class="preview-img" />
        <button class="btn-remove" @click.stop="removeFile">Quitar imagen</button>
      </template>
      <template v-else>
        <span class="drop-icon"><i class="fa-regular fa-image" aria-hidden="true" /></span>
        <p class="drop-text">Arrastra una imagen o <strong>haz clic para seleccionar</strong></p>
        <p class="drop-hint">JPG, PNG, WEBP — máx. 10 MB</p>
      </template>
    </div>

    <p class="skip-hint">La imagen se subirá cuando guardes la orden. Si la dejas lista aquí, se usará en el envío final.</p>

    <div v-if="store.formData.notas !== undefined" class="notas-group">
      <label class="field-label">Notas adicionales (opcional)</label>
      <textarea
        v-model="store.formData.notas"
        class="notas-input"
        placeholder="Observaciones, detalles especiales..."
        rows="3"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGestionCompraFormStore } from '@/stores/gestion_compra_form.store'

const store = useGestionCompraFormStore()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const preview = ref<string>(store.formData.imagenCompraPreview || store.formData.imagenCompraUrl || '')

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) processFile(file)
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) processFile(file)
}

async function processFile(file: File) {
  store.formData.imagenCompraFile = file
  preview.value = URL.createObjectURL(file)
  store.formData.imagenCompraPreview = preview.value
  store.formData.imagenCompraUrl = ''
}

function removeFile() {
  preview.value = ''
  store.formData.imagenCompraUrl = ''
  store.formData.imagenCompraFile = null
  store.formData.imagenCompraPreview = ''
  if (fileInput.value) fileInput.value.value = ''
}

// Image is optional — always valid
defineExpose({ isValid: () => true })
</script>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
.step-imagen { display: flex; flex-direction: column; gap: $space-5; }
.step__title { color: $fg-dark; font-size: 1.15rem; margin: 0; }
.step__desc { color: $ink-300; font-size: 0.92rem; margin: 0; line-height: 1.6; }
.support-grid { display: flex; flex-wrap: wrap; gap: $space-3; }
.support-card {
  flex: 1 1 220px;
  display: flex; flex-direction: column; gap: 6px; text-align: left; cursor: pointer;
  padding: $space-4 $space-4; background: $ink-900; border: 2px solid $ink-500; border-radius: 16px;
  color: $fg-dark; transition: all 0.18s;
  &:hover { border-color: $ink-300; }
  &.selected { border-color: $brand-orange; background: rgba(240,138,31,0.08); }
}
.support-title { font-weight: 800; font-size: 0.95rem; }
.support-desc { font-size: 0.84rem; color: $ink-300; line-height: 1.5; }
.drop-zone {
  border: 2px dashed $ink-500; border-radius: 18px;
  padding: $space-6 $space-5; display: flex; flex-direction: column;
  align-items: center; gap: $space-3; cursor: pointer;
  transition: border-color 0.18s, background 0.18s;
  &:hover, &.drag-over { border-color: $brand-orange; background: rgba(240,138,31,0.04); }
  &.has-file { border-style: solid; border-color: $brand-orange; padding: $space-5; }
}
.hidden { display: none; }
.drop-icon { color: $brand-orange; font-size: 2.1rem; line-height: 1; }
.drop-text { color: $ink-300; text-align: center; margin: 0; line-height: 1.55; }
.drop-hint { color: $ink-400; font-size: 0.82rem; margin: 0; }
.preview-img { max-width: 100%; max-height: 280px; border-radius: 12px; object-fit: contain; }
.btn-remove {
  background: rgba(229,72,77,0.15); border: 1px solid $signal-red;
  color: $signal-red; padding: $space-1 $space-3; border-radius: 6px;
  cursor: pointer; font-size: 0.82rem;
  &:hover { background: rgba(229,72,77,0.25); }
}
.upload-progress {
  position: relative; background: $ink-700; border-radius: 4px; height: 6px;
  span { display: none; }
}
.progress-bar { height: 100%; background: $brand-orange; border-radius: 4px; transition: width 0.3s; }
.skip-hint { font-size: 0.82rem; color: $ink-400; line-height: 1.5; }
.notas-group { display: flex; flex-direction: column; gap: $space-2; }
.field-label { color: $ink-300; font-size: 0.85rem; font-weight: 600; }
.notas-input {
  background: $ink-700; border: 1px solid $ink-500; border-radius: 8px;
  color: $fg-dark; padding: $space-3; outline: none; resize: vertical;
  font-size: 0.9rem; line-height: 1.5;
  &:focus { border-color: $brand-orange; }
}
.field-error { color: $signal-red; font-size: 0.82rem; }

@media (max-width: 720px) { .support-grid { flex-direction: column; } }
</style>
