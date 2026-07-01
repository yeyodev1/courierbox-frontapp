<script setup lang="ts">
import { ref } from 'vue'
import AppConfirmModal from '@/components/ui/AppConfirmModal.vue'
import type { Gasto } from '@/services/costos.api'

const props = defineProps({
  gastos: { type: Array as () => Gasto[], required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' }
})

const emit = defineEmits<{
  (e: 'detail', gasto: Gasto): void
  (e: 'delete', id: string): void
}>()

const showDeleteConfirm = ref(false)
const deleteTargetId = ref('')

function requestRemove(id: string) {
  deleteTargetId.value = id
  showDeleteConfirm.value = true
}

function confirmRemove() {
  if (deleteTargetId.value) {
    emit('delete', deleteTargetId.value)
  }
  showDeleteConfirm.value = false
  deleteTargetId.value = ''
}

function formatCurrency(n: number) {
  return '$' + n.toFixed(2)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

const tipoLabel: Record<string, string> = {
  operacional: 'Operacional',
  logistico: 'Logístico',
  envio: 'Envío',
}
</script>

<template>
  <div class="results-container">
    <div v-if="loading" class="skeleton-list">
      <div v-for="n in 4" :key="n" class="skeleton-row"></div>
    </div>
    <div v-else-if="error" class="alert error"><i class="fa-solid fa-circle-exclamation" /> {{ error }}</div>
    <div v-else-if="gastos.length === 0" class="empty">
      <i class="fa-solid fa-coins" />
      <p>No hay gastos registrados</p>
    </div>

    <div v-else class="results-block">
      <div class="table-wrapper">
        <table class="gastos-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Factura</th>
              <th>Lbs</th>
              <th>Total</th>
              <th>Pagado</th>
              <th>Monto</th>
              <th>Proveedor</th>
              <th>Ref.</th>
              <th>Archivo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="g in gastos" :key="g._id" class="clickable-row" tabindex="0" @click="$emit('detail', g)" @keydown.enter.prevent="$emit('detail', g)" @keydown.space.prevent="$emit('detail', g)">
              <td class="mono">{{ formatDate(g.fecha) }}</td>
              <td><span class="badge" :class="g.tipo">{{ tipoLabel[g.tipo] || g.tipo }}</span></td>
              <td>{{ g.categoria }}</td>
              <td>{{ g.descripcion }}</td>
              <td class="mono">{{ g.numeroFactura || '—' }}</td>
              <td class="mono">{{ Number(g.libras || 0).toFixed(2) }}</td>
              <td class="mono total">{{ formatCurrency(g.valorTotal || g.monto) }}</td>
              <td class="mono total">{{ formatCurrency(g.valorPagado || 0) }}</td>
              <td class="mono total">{{ formatCurrency(g.monto) }}</td>
              <td>{{ g.proveedor || '—' }}</td>
              <td class="mono">{{ g.referencia || '—' }}</td>
              <td>
                <a v-if="g.comprobanteUrl" :href="g.comprobanteUrl" target="_blank" class="file-link" @click.stop>Abrir</a>
                <span v-else>—</span>
              </td>
              <td>
                <button class="btn-icon danger" @click.stop="requestRemove(g._id)" title="Eliminar">
                  <i class="fa-solid fa-trash-can" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="gastos-mobile-list">
        <article v-for="g in gastos" :key="g._id" class="gasto-card" @click="$emit('detail', g)">
          <div class="gasto-card-top">
            <div>
              <div class="gasto-card-meta">
                <span class="badge" :class="g.tipo">{{ tipoLabel[g.tipo] || g.tipo }}</span>
                <span class="mono">{{ formatDate(g.fecha) }}</span>
              </div>
              <h3>{{ g.descripcion }}</h3>
              <p>{{ g.categoria }}</p>
            </div>
            <strong class="gasto-card-amount">{{ formatCurrency(g.valorTotal || g.monto) }}</strong>
          </div>

          <dl class="gasto-card-dl">
            <div><dt>Pagado</dt><dd>{{ formatCurrency(g.valorPagado || 0) }}</dd></div>
            <div><dt>Monto</dt><dd>{{ formatCurrency(g.monto) }}</dd></div>
            <div><dt>Proveedor</dt><dd>{{ g.proveedor || '—' }}</dd></div>
            <div><dt>Factura</dt><dd>{{ g.numeroFactura || '—' }}</dd></div>
          </dl>

          <div class="gasto-card-footer">
            <span class="file-link">
              {{ g.comprobanteUrl ? 'Comprobante disponible' : 'Sin comprobante' }}
            </span>
            <button class="btn-icon danger" type="button" @click.stop="requestRemove(g._id)" title="Eliminar">
              <i class="fa-solid fa-trash-can" />
            </button>
          </div>
        </article>
      </div>
    </div>

    <AppConfirmModal
      :open="showDeleteConfirm"
      title="Eliminar gasto"
      message="¿Eliminar este gasto? Esta acción no se puede deshacer."
      confirm-label="Eliminar"
      variant="danger"
      @cancel="showDeleteConfirm = false; deleteTargetId = ''"
      @confirm="confirmRemove"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.results-container {
  display: flex;
  flex-direction: column;
}

.results-block {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.loading, .empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  padding: $space-12 0;
  color: $ink-500;
  i { font-size: 1.5rem; }
}

.skeleton-list { display: flex; flex-direction: column; gap: $space-3; }
.skeleton-row { height: 58px; border-radius: 14px; background: linear-gradient(90deg, rgba($ink-700,.7), rgba($ink-600,.7), rgba($ink-700,.7)); background-size: 200% 100%; animation: shimmer 1.4s infinite; }

.alert {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-radius: 12px;
  font-size: 0.9rem;
  background: rgba($signal-red, 0.1);
  color: #ff8a8f;
  border: 1px solid rgba($signal-red, 0.15);
}

.table-wrapper {
  overflow-x: auto;
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 16px;
}

.gastos-mobile-list {
  display: none;
  flex-direction: column;
  gap: $space-3;
}

.gastos-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  th, td {
    padding: $space-3 $space-4;
    text-align: left;
    border-bottom: 1px solid rgba($ink-500, 0.1);
    white-space: nowrap;
  }
  th {
    color: $ink-400;
    font-weight: 600;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr.clickable-row {
    cursor: pointer;

    &:hover td {
      background: rgba($brand-orange, 0.04);
    }
  }
  .mono { font-variant-numeric: tabular-nums; }
  .total { color: $brand-orange; font-weight: 700; }
}

.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  &.operacional { background: rgba($brand-orange, 0.12); color: $brand-orange; }
  &.logistico { background: rgba(#4fc3f7, 0.12); color: #4fc3f7; }
  &.envio { background: rgba(#81c784, 0.12); color: #81c784; }
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: transparent;
  color: $ink-400;
  transition: all 0.2s;
  &.danger:hover { background: rgba($signal-red, 0.1); color: #ff8a8f; }
}

.file-link {
  color: $brand-orange;
  text-decoration: none;
  font-weight: 600;
}

.gasto-card {
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 18px;
  background: $ink-900;
  padding: $space-4;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  cursor: pointer;
}

.gasto-card-top {
  display: flex;
  justify-content: space-between;
  gap: $space-4;

  h3 {
    margin: $space-2 0 $space-1;
    font-size: 1rem;
  }

  p {
    margin: 0;
    color: $ink-400;
    font-size: 0.85rem;
  }
}

.gasto-card-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2;
}

.gasto-card-amount {
  color: $brand-orange;
  font-size: 1.05rem;
  white-space: nowrap;
}

.gasto-card-dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $space-3;
  margin: 0;

  div {
    display: flex;
    flex-direction: column;
    gap: $space-1;
  }

  dt {
    color: $ink-400;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  dd {
    margin: 0;
    color: $fg-dark;
  }
}

.gasto-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
}

@media (max-width: 900px) {
  .table-wrapper {
    display: none;
  }

  .gastos-mobile-list {
    display: flex;
  }
}
</style>
