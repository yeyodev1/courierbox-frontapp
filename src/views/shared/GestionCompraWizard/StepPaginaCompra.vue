<template>
  <div class="step-pagina">
    <h3 class="step__title">Página de compra</h3>
    <p class="step__desc">Define si esta gestión incluye compra o solo courier, y luego ingresa la tienda o URL.</p>

    <div class="mode-grid">
      <button
        class="mode-card"
        :class="{ selected: store.formData.serviceType === 'compra_total' }"
        @click="store.formData.serviceType = 'compra_total'"
      >
        <span class="mode-title">Compra total</span>
        <span class="mode-desc">Compramos, recibimos y gestionamos el envío.</span>
        <span class="mode-badge">Ya compré / vamos a comprar</span>
      </button>

      <button
        class="mode-card"
        :class="{ selected: store.formData.serviceType === 'logistica' }"
        @click="store.formData.serviceType = 'logistica'"
      >
        <span class="mode-title">Solo courier</span>
        <span class="mode-desc">El cliente ya compró y solo manejamos el traslado.</span>
        <span class="mode-badge">Ya está comprado</span>
      </button>
    </div>

    <AppInput
      v-model="store.formData.paginaCompra"
      label="URL o nombre de la tienda *"
      placeholder="https://amazon.com/... o Amazon, Shein, etc."
    />

    <div v-if="isUrl" class="url-preview">
      <span class="url-icon">🔗</span>
      <a :href="store.formData.paginaCompra" target="_blank" rel="noopener" class="url-link">
        {{ store.formData.paginaCompra }}
      </a>
    </div>

    <p v-if="error" class="field-error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppInput from '@/components/ui/AppInput.vue'
import { useGestionCompraFormStore } from '@/stores/gestion_compra_form.store'

const store = useGestionCompraFormStore()
const error = ref('')

const isUrl = computed(() => {
  try { new URL(store.formData.paginaCompra); return true } catch { return false }
})

defineExpose({
  isValid() {
    if (!store.formData.paginaCompra.trim()) {
      error.value = 'Ingresa la página o tienda de compra'
      return false
    }
    error.value = ''
    return true
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
.step-pagina { display: flex; flex-direction: column; gap: $space-4; }
.step__title { color: $fg-dark; font-size: 1.1rem; margin: 0; }
.step__desc { color: $ink-300; font-size: 0.9rem; margin: 0; }
.mode-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: $space-3; }
.mode-card {
  display: flex; flex-direction: column; gap: $space-2; text-align: left;
  padding: $space-4; border-radius: 14px; border: 2px solid $ink-500;
  background: $ink-900; color: $fg-dark; cursor: pointer;
  transition: all 0.18s;
  &:hover { border-color: $ink-300; }
  &.selected { border-color: $brand-orange; background: rgba(240,138,31,0.08); }
}
.mode-title { font-weight: 800; font-size: 0.95rem; }
.mode-desc { color: $ink-300; font-size: 0.82rem; line-height: 1.4; }
.mode-badge {
  align-self: flex-start; font-size: 0.72rem; font-weight: 700; color: $brand-orange;
  background: rgba(240,138,31,0.12); border-radius: 999px; padding: 4px 10px;
}
.url-preview {
  display: flex; align-items: center; gap: $space-2;
  padding: $space-2 $space-4; background: $ink-700; border-radius: 8px;
}
.url-link { color: $brand-orange; font-size: 0.85rem; word-break: break-all; }
.field-error { color: $signal-red; font-size: 0.82rem; }

@media (max-width: 720px) { .mode-grid { grid-template-columns: 1fr; } }
</style>
