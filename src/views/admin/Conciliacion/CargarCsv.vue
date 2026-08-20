<script setup lang="ts">
/** Upload the bank's CSV so its references auto-match the pending invoices. */
import type { CsvResultado } from './useConciliacion'

defineProps<{ file: File | null; resultado: CsvResultado | null; uploading: boolean }>()
const emit = defineEmits<{ change: [file: File | null]; submit: [] }>()

function onChange(event: Event) {
  emit('change', (event.target as HTMLInputElement).files?.[0] || null)
}
</script>

<template>
  <div class="tab-content">
    <div class="csv-card">
      <div class="card-header">
        <div class="icon-wrapper"><i class="fa-solid fa-upload" /></div>
        <h2>Cargar Reporte Bancario</h2>
      </div>

      <p class="csv-desc">
        Sube el archivo CSV de transacciones de tu banco para cruzar automáticamente las referencias.
      </p>

      <div class="csv-upload-area">
        <input type="file" accept=".csv" @change="onChange" />
        <p v-if="file" class="file-name">{{ file.name }}</p>
      </div>

      <button class="submit-btn" :disabled="!file || uploading" @click="emit('submit')">
        <span v-if="!uploading"><i class="fa-solid fa-arrows-rotate" /> Procesar CSV y Conciliar</span>
        <span v-else class="loader" />
      </button>

      <div v-if="resultado" class="csv-resultado">
        <p><strong>{{ resultado.totalReferencias }}</strong> referencias bancarias encontradas</p>
        <p><strong>{{ resultado.facturasVerificando }}</strong> facturas en verificación</p>
        <p class="match-success">
          <strong>{{ resultado.conciliadas }}</strong> facturas conciliadas automáticamente
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;

.csv-card {
  background: rgba($fg-dark, 0.04);
  border: 1px solid rgba($fg-dark, 0.08);
  border-radius: 12px;
  padding: 2rem;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba($brand-orange, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  color: $brand-orange;
}

.csv-desc {
  color: $muted-dark;
  margin-bottom: 1.5rem;
}

.csv-upload-area {
  padding: 2rem;
  border: 2px dashed rgba($fg-dark, 0.15);
  border-radius: 12px;
  text-align: center;
  margin-bottom: 1.5rem;

  .file-name { margin-top: 0.5rem; color: $brand-orange; }
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  background: $brand-orange;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-family: inherit;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.csv-resultado {
  margin-top: 1.5rem;
  padding: 1.25rem;
  background: rgba($fg-dark, 0.04);
  border-radius: 10px;

  p { margin-bottom: 0.35rem; color: $muted-dark; font-size: 0.95rem; }

  .match-success { color: #22c55e; font-size: 1.1rem; margin-top: 0.5rem; }
}

.loader {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba($fg-dark, 0.3);
  border-top-color: $fg-dark;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .loader { animation-duration: 2s; }
}
</style>
