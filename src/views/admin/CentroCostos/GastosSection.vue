<script setup lang="ts">
/**
 * An expense section of Cost Centre — general spend or shipping spend. Both read
 * the same way; only the slice of the ledger and the label change, so they share
 * this view rather than diverging into two near-identical screens.
 */
import type { CostoSeccion, GastoTipo } from '@/services/costos.api'
import { useSeccionCostos } from './useSeccionCostos'

import CostosToolbar from './components/CostosToolbar.vue'
import CostosSummary from './components/CostosSummary.vue'
import CostosTable from './components/CostosTable.vue'
import CostosDetailModal from './components/CostosDetailModal.vue'
import CostosFormModal from './components/CostosFormModal.vue'

const props = defineProps<{
  seccion: CostoSeccion
  tipo: GastoTipo
  titulo: string
  descripcion: string
  emptyLabel: string
}>()

const s = useSeccionCostos({ seccion: props.seccion, tipoPorDefecto: props.tipo })
</script>

<template>
  <div class="seccion">
    <div class="seccion-header">
      <p class="seccion-desc">{{ descripcion }}</p>
      <button class="btn-primary" @click="s.openCreate()">
        <i class="fa-solid fa-plus" /> Nuevo {{ titulo }}
      </button>
    </div>

    <CostosToolbar
      v-model:categoria="s.filtroCategoria.value"
      v-model:proveedor="s.filtroProveedor.value"
      v-model:desde="s.filtroDesde.value"
      v-model:hasta="s.filtroHasta.value"
      :categorias-disponibles="s.categoriasDisponibles.value"
    />

    <CostosSummary v-if="s.resumenSeguro.value" :resumen-seguro="s.resumenSeguro.value" />

    <CostosTable
      :gastos="s.gastos.value"
      :loading="s.loading.value"
      :error="s.error.value"
      :deleting="s.deleting.value"
      :empty-label="emptyLabel"
      @detail="s.openDetail"
      @delete="s.handleRemove"
    />

    <CostosDetailModal
      :show="s.showDetailModal.value"
      :gasto="s.selectedGasto.value"
      @close="s.showDetailModal.value = false; s.selectedGasto.value = null"
      @edit="s.openEdit"
    />

    <CostosFormModal
      :show="s.showFormModal.value"
      :initial-data="s.selectedGasto.value"
      :saving="s.saving.value"
      :tipo="tipo"
      :titulo="titulo"
      @close="s.closeForm()"
      @save="s.handleSave"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.seccion {
  display: flex;
  flex-direction: column;
  gap: $space-5;

  @media (max-width: 640px) {
    gap: $space-3;
  }
}

.seccion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
}

.seccion-desc {
  margin: 0;
  color: $ink-400;
  font-size: 0.9rem;

  @media (max-width: 640px) {
    display: none;
  }
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: 0.6rem 1.25rem;
  background: $brand-orange;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;

  @media (max-width: 640px) {
    width: 100%;
    justify-content: center;
  }
}
</style>
