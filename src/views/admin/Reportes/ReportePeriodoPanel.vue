<script setup lang="ts">
/** Period picker (presets, month jump, custom range) plus the export buttons. */
import type { ExportFormat } from './useReporteEjecutivo'
import { toDateValue, toMonthValue } from './useReporteEjecutivo'

defineProps<{ loading: boolean; exporting: boolean; today: Date }>()

const selectedMonth = defineModel<string>('selectedMonth', { required: true })
const desde = defineModel<string>('desde', { required: true })
const hasta = defineModel<string>('hasta', { required: true })

const emit = defineEmits<{
  preset: [preset: 'mes' | 'trimestre' | 'anio']
  'use-month': []
  apply: []
  'export-report': [format: ExportFormat]
  'export-envios': [format: ExportFormat]
}>()

const FORMATS: ExportFormat[] = ['xlsx', 'csv', 'pdf']
const FORMAT_LABEL: Record<ExportFormat, string> = { xlsx: 'Excel', csv: 'CSV', pdf: 'PDF' }
</script>

<template>
  <section class="period-panel" aria-label="Seleccionar periodo del reporte">
    <div class="presets">
      <span>Periodo</span>
      <button type="button" :disabled="loading" @click="emit('preset', 'mes')">Este mes</button>
      <button type="button" :disabled="loading" @click="emit('preset', 'trimestre')">Trimestre</button>
      <button type="button" :disabled="loading" @click="emit('preset', 'anio')">Año</button>
    </div>

    <div class="month-control">
      <label for="report-month">Ir a un mes</label>
      <div class="month-action">
        <input id="report-month" v-model="selectedMonth" type="month" :max="toMonthValue(today)" />
        <button type="button" :disabled="loading" @click="emit('use-month')">Ver mes</button>
      </div>
    </div>

    <span class="period-divider">o define un rango</span>

    <div class="date-controls">
      <label class="date-field">
        <span>Desde</span>
        <input v-model="desde" type="date" :max="hasta || toDateValue(today)" />
      </label>
      <label class="date-field">
        <span>Hasta</span>
        <input v-model="hasta" type="date" :min="desde" :max="toDateValue(today)" />
      </label>
      <button type="button" class="apply-button" :disabled="loading" @click="emit('apply')">
        {{ loading ? 'Actualizando...' : 'Aplicar periodo' }}
      </button>
    </div>
  </section>

  <div class="export-group">
    <div class="export-actions" aria-label="Exportar reporte ejecutivo">
      <span class="export-label">Reporte ejecutivo</span>
      <button v-for="f in FORMATS" :key="f" type="button" :disabled="exporting" @click="emit('export-report', f)">
        {{ FORMAT_LABEL[f] }}
      </button>
    </div>
    <div class="export-actions" aria-label="Exportar reporte de envíos">
      <span class="export-label">Reporte de envíos</span>
      <button v-for="f in FORMATS" :key="f" type="button" :disabled="exporting" @click="emit('export-envios', f)">
        {{ FORMAT_LABEL[f] }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/mixins/responsive' as *;
@use './reportes-ui' as ui;

$cream: $ink-100;

.period-panel {
  display: flex;
  align-items: flex-end;
  gap: $space-5;
  padding: $space-5;
  border: 1px solid rgba($brand-orange, 0.28);
  border-radius: $radius-lg;
  background: $ink-900;
  color: $cream;
}

.presets {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;

  > span {
    font-size: 0.78rem;
    opacity: 0.7;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  button {
    min-height: 34px;
    padding: 0 0.9rem;
    border-radius: $radius-pill;
    border: 1px solid rgba($cream, 0.16);
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 0.82rem;
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;

    &:hover:not(:disabled) {
      border-color: rgba($brand-orange, 0.5);
      background: rgba($brand-orange, 0.1);
    }

    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
}

.month-control,
.date-field { flex: 1 1 190px; }

.month-control label,
.date-field > span {
  display: block;
  margin-bottom: $space-2;
  font-size: 0.78rem;
  font-weight: 700;
}

.month-action { display: flex; gap: $space-2; }

.month-action input,
.date-field input,
.month-action button,
.apply-button {
  min-height: 44px;
  border-radius: $radius-md;
  font: inherit;
}

.month-action input,
.date-field input {
  width: 100%;
  min-width: 0;
  flex: 1;
  padding: 0 $space-3;
  border: 1px solid rgba($cream, 0.24);
  color: $cream;
  color-scheme: dark;
  background: $ink-1000;
}

.month-action button,
.apply-button {
  border: 0;
  padding: 0 $space-4;
  color: $ink-1000;
  font-weight: 800;
  cursor: pointer;
  background: $brand-orange;
  transition: transform 180ms ease, background-color 180ms ease;

  &:disabled { cursor: wait; opacity: 0.65; }
}

.period-divider {
  align-self: center;
  color: rgba($cream, 0.46);
  font-size: 0.75rem;
  white-space: nowrap;
}

.date-controls {
  display: flex;
  flex: 2 1 480px;
  align-items: flex-end;
  gap: $space-3;
}

.apply-button { flex: 0 0 auto; white-space: nowrap; }

.export-group { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: $space-4; }

.export-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: $space-2;

  button {
    min-height: 40px;
    padding: 0 $space-4;
    border: 1px solid rgba($brand-orange, 0.45);
    border-radius: $radius-md;
    color: $cream;
    background: $ink-900;
    font-weight: 800;
    cursor: pointer;
    transition: transform 180ms ease, border-color 180ms ease;

    &:hover:not(:disabled) { transform: translateY(-2px); border-color: $brand-orange; }
    &:disabled { opacity: 0.55; cursor: wait; }
  }
}

.export-label { font-size: 0.78rem; font-weight: 800; opacity: 0.7; margin-right: $space-1; }

@include hover-supported {
  .month-action button:hover,
  .apply-button:hover {
    transform: translateY(-2px);
    background: $brand-orange-soft;
  }
}

@media (max-width: 960px) {
  .period-panel { flex-wrap: wrap; }
  .period-divider { display: none; }
}

@media (max-width: 680px) {
  .period-panel { padding: $space-4; }
  .date-controls { align-items: stretch; flex-direction: column; }
  .month-control,
  .date-controls,
  .date-field { flex-basis: 100%; }
  .apply-button { width: 100%; }
}

@media (max-width: 420px) {
  .month-action { align-items: stretch; flex-direction: column; }
  .month-action button { width: 100%; }
}

@include reduced-motion {
  .month-action button,
  .apply-button,
  .export-actions button { transition: none; }
  .export-actions button:hover:not(:disabled) { transform: none; }
}
</style>
