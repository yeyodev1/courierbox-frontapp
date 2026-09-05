<script setup lang="ts">
/**
 * Receptions: the pounds that came in and what Courier Box paid for each one.
 * Filed here rather than mixed into the expense list, and headlined by the real
 * cost per pound for the period — the figure the supplier's rate is checked
 * against, which used to be buried inside individual expense rows.
 */
import { useSeccionCostos } from './useSeccionCostos'
import { formatCount, formatCurrency } from '@/utils/format'

import CostosToolbar from './components/CostosToolbar.vue'
import CostosSaldosBar from './components/CostosSaldosBar.vue'
import CostosTable from './components/CostosTable.vue'
import CostosDetailModal from './components/CostosDetailModal.vue'
import RecepcionFormModal from './components/RecepcionFormModal.vue'

const s = useSeccionCostos({ seccion: 'recepciones', tipoPorDefecto: 'recepcion' })

/** Four decimals: at a hundred-odd pounds a cargo, the cents matter. */
function formatRate(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return '$' + value.toFixed(4)
}
</script>

<template>
  <div class="seccion">
    <div class="seccion-header">
      <p class="seccion-desc">Registra cada carga recibida: sus libras y lo que pagas por cada una.</p>
      <button class="btn-primary" @click="s.openCreate()">
        <i class="fa-solid fa-plus" /> Nueva recepción
      </button>
    </div>

    <CostosToolbar
      v-model:categoria="s.filtroCategoria.value"
      v-model:proveedor="s.filtroProveedor.value"
      v-model:desde="s.filtroDesde.value"
      v-model:hasta="s.filtroHasta.value"
      :categorias-disponibles="s.categoriasDisponibles.value"
    />

    <section v-if="s.resumenSeguro.value" class="recepciones-kpis">
      <article class="kpi accent">
        <span>Costo real por libra</span>
        <strong>{{ formatRate(s.resumenSeguro.value.total.costoPorLibra) }}</strong>
        <small>Del total pagado sobre el total de libras del período</small>
      </article>
      <article class="kpi">
        <span>Libras recibidas</span>
        <strong>{{ formatCount(Number(s.resumenSeguro.value.total.libras || 0)) }}</strong>
        <small>{{ formatCount(s.resumenSeguro.value.total.paquetes) }} paquetes</small>
      </article>
      <article class="kpi">
        <span>Total pagado</span>
        <strong>{{ formatCurrency(s.resumenSeguro.value.total.total) }}</strong>
        <small>{{ formatCount(s.resumenSeguro.value.total.facturas) }} recepciones</small>
      </article>
    </section>

    <CostosSaldosBar
      :saldos="s.saldos.value"
      :solo-pendientes="s.soloPendientes.value"
      :loading="s.loading.value"
      @toggle="s.togglePendientes()"
    />

    <CostosTable
      variant="recepciones"
      :gastos="s.gastos.value"
      :loading="s.loading.value"
      :error="s.error.value"
      :deleting="s.deleting.value"
      empty-label="No hay recepciones en este período"
      @detail="s.openDetail"
      @delete="s.handleRemove"
    />

    <CostosDetailModal
      :show="s.showDetailModal.value"
      :gasto="s.selectedGasto.value"
      @close="s.showDetailModal.value = false; s.selectedGasto.value = null"
      @edit="s.openEdit"
    />

    <RecepcionFormModal
      :show="s.showFormModal.value"
      :initial-data="s.selectedGasto.value"
      :saving="s.saving.value"
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

.recepciones-kpis {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $space-4;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
    gap: $space-3;
  }
}

.kpi {
  display: flex;
  flex-direction: column;
  gap: $space-1;
  padding: $space-4;
  border-radius: 16px;
  border: 1px solid rgba($ink-500, 0.16);
  background: rgba($ink-800, 0.35);

  span {
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: $ink-400;
  }

  strong {
    font-size: 1.75rem;
    font-weight: 700;
  }

  small {
    color: $ink-400;
    font-size: 0.8rem;
  }

  &.accent {
    border-color: rgba($brand-orange, 0.4);
    background: rgba($brand-orange, 0.08);

    strong {
      color: $brand-orange;
    }
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
