<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppDatePicker from '@/components/ui/AppDatePicker.vue'

const props = defineProps({
  tipo: { type: String, required: true },
  categoria: { type: String, required: true },
  proveedor: { type: String, required: true },
  desde: { type: String, required: true },
  hasta: { type: String, required: true },
  categoriasDisponibles: { type: Array, required: true }
})

const emit = defineEmits([
  'update:tipo',
  'update:categoria',
  'update:proveedor',
  'update:desde',
  'update:hasta'
])

const router = useRouter()

const localTipo = computed({
  get: () => props.tipo,
  set: (val) => emit('update:tipo', val)
})

const localCategoria = computed({
  get: () => props.categoria,
  set: (val) => emit('update:categoria', val)
})

const localProveedor = computed({
  get: () => props.proveedor,
  set: (val) => emit('update:proveedor', val)
})

const localDesde = computed({
  get: () => props.desde,
  set: (val) => emit('update:desde', val)
})

const localHasta = computed({
  get: () => props.hasta,
  set: (val) => emit('update:hasta', val)
})
</script>

<template>
  <div class="toolbar">
    <div class="filter">
      <span>Tipo</span>
      <select v-model="localTipo" class="field-input">
        <option value="">Todos</option>
        <option value="operacional">Operacional</option>
        <option value="logistico">Logístico</option>
        <option value="envio">Envío</option>
      </select>
    </div>
    <div class="filter">
      <span>Categoría</span>
      <select v-model="localCategoria" class="field-input">
        <option value="">Todas</option>
        <option v-for="cat in (categoriasDisponibles as string[])" :key="cat" :value="cat">{{ cat }}</option>
      </select>
    </div>
    <div class="filter grow">
      <span>Proveedor</span>
      <div class="filter-inline">
        <input v-model="localProveedor" class="field-input" placeholder="Filtrar por proveedor" />
        <button type="button" class="btn-secondary" @click="router.push({ name: 'AdminProveedores' })">Gestionar</button>
      </div>
    </div>
    <div class="filter date-range">
      <AppDatePicker v-model="localDesde" label="Desde" />
      <AppDatePicker v-model="localHasta" label="Hasta" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: $space-4;

  @media (max-width: 900px) {
    flex-direction: column;
  }

  @media (max-width: 640px) {
    gap: $space-2;
  }
}

.filter {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: $space-2;
  color: $ink-300;
  font-size: 0.9rem;

  @media (max-width: 900px) {
    width: 100%;
  }

  @media (max-width: 640px) {
    gap: $space-1;
  }
}

.grow {
  flex: 1 1 320px;

  @media (max-width: 640px) {
    flex: 0 0 auto;
  }
}

.filter-inline {
  display: flex;
  gap: $space-3;
  width: 100%;

  .field-input {
    flex: 1 1 auto;
    min-width: 0;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    gap: $space-2;
  }
}

.date-range {
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 1fr));
  gap: $space-3;
  flex: 1 1 380px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: $space-2;
    flex: 0 0 auto;
    width: 100%;
  }
}

.field-input {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.2);
  border-radius: 10px;
  padding: $space-2 $space-3;
  color: $fg-dark;
  font-family: inherit;
  outline: none;
  &:focus { border-color: $brand-orange; }
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 0.6rem 1.25rem;
  background: transparent;
  color: $ink-200;
  border: 1px solid rgba($ink-500, 0.3);
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  &:hover { background: rgba($ink-500, 0.15); color: $fg-dark; }
}
</style>
