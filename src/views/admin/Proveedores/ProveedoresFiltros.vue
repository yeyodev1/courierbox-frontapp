<script setup lang="ts">
/** Search box plus the type / status / country narrowing controls. */
import AppSelect from '@/components/ui/AppSelect.vue'

defineProps<{ typeOptions: string[]; countryOptions: string[]; filtrados: number; total: number }>()

const search = defineModel<string>('search', { required: true })
const tipo = defineModel<string>('tipo', { required: true })
const estado = defineModel<string>('estado', { required: true })
const pais = defineModel<string>('pais', { required: true })

const emit = defineEmits<{ reset: [] }>()

const withAll = (label: string, values: string[]) => [
  { value: 'all', label },
  ...values.map((value) => ({ value, label: value })),
]

const ESTADO_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
]
</script>

<template>
  <section class="filter-panel">
    <div class="toolbar">
      <input v-model="search" class="field-input search-input" placeholder="Buscar proveedor, tipo, país, ciudad..." />
      <AppSelect
        v-model="tipo"
        class="filter-select filter-select--compact"
        label="Tipo"
        :options="withAll('Todos los tipos', typeOptions)"
      />
      <AppSelect
        v-model="estado"
        class="filter-select filter-select--compact"
        label="Estado"
        :options="ESTADO_OPTIONS"
      />
      <AppSelect
        v-model="pais"
        class="filter-select filter-select--compact"
        label="País"
        :options="withAll('Todos los países', countryOptions)"
      />
      <button type="button" class="btn-secondary btn-clear" @click="emit('reset')">Limpiar</button>
    </div>

    <div class="filter-summary">
      <span>Mostrando <strong>{{ filtrados }}</strong> de <strong>{{ total }}</strong> proveedores</span>
      <span class="filter-hint">Filtra por tipo, estado o país desde esta pantalla.</span>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.filter-panel {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-4;
  border-radius: 16px;
  background: rgba($ink-900, 0.7);
  border: 1px solid rgba($ink-500, 0.12);
}

.toolbar {
  display: grid;
  grid-template-columns: minmax(220px, 1.6fr) repeat(3, minmax(150px, 1fr)) auto;
  gap: $space-3;
  align-items: end;

  @media (max-width: 900px) { grid-template-columns: 1fr; }
}

.field-input {
  background: $ink-1000;
  border: 1px solid rgba($ink-500, 0.2);
  border-radius: 12px;
  padding: $space-3 $space-4;
  color: $fg-dark;
  font-family: inherit;
  outline: none;

  &:focus { border-color: $brand-orange; }
}

.search-input { width: 100%; min-height: 46px; }

.btn-secondary {
  border: none;
  cursor: pointer;
  font-family: inherit;
  border-radius: 12px;
  padding: 0.65rem 0.95rem;
  font-weight: 700;
  background: rgba($ink-700, 0.8);
  color: $fg-dark;
}

.btn-clear {
  min-height: 46px;

  @media (max-width: 900px) { width: 100%; }
}

.filter-summary {
  display: flex;
  justify-content: space-between;
  gap: $space-3;
  flex-wrap: wrap;
  font-size: 0.85rem;
  color: $ink-300;
}

.filter-hint { color: $ink-400; }

.filter-select--compact {
  :deep(.app-select__label) { font-size: 0.75rem; }
  :deep(.app-select__trigger) { min-height: 46px; }
  :deep(.app-select__value) { font-size: 0.88rem; }
  :deep(.app-select__chevron) { font-size: 0.75rem; }
  :deep(.app-select__dropdown) { font-size: 0.88rem; }
}
</style>
