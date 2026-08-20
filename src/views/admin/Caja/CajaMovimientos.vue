<script setup lang="ts">
/** The ledger itself: a table on desktop, stacked cards on phones. */
import type { CajaMovimiento } from '../caja.utils'
import { canDeleteCajaMovimiento, formatDate, formatMoney } from '../caja.utils'

defineProps<{ movimientos: CajaMovimiento[]; loading: boolean }>()
const emit = defineEmits<{ remove: [movimiento: CajaMovimiento] }>()

const deleteTitle = (m: CajaMovimiento) =>
  canDeleteCajaMovimiento(m) ? 'Eliminar movimiento' : 'No se puede eliminar después de 7 días'
</script>

<template>
  <section class="panel">
    <div class="section-head between">
      <div>
        <h3>Movimientos</h3>
        <p>Lista clara con fecha, tipo, cliente, comprobante y acciones.</p>
      </div>
      <div class="count-pill">{{ movimientos.length }} movimientos</div>
    </div>

    <div v-if="loading" class="loading-grid">
      <div v-for="n in 4" :key="n" class="skeleton-card" />
    </div>

    <template v-else-if="movimientos.length">
      <div class="table-wrapper desktop-only">
        <table class="movements-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Cliente</th>
              <th>Monto</th>
              <th>Comprobante</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in movimientos" :key="m._id">
              <td>{{ formatDate(m.fecha || m.createdAt) }}</td>
              <td><span :class="['badge', m.tipo]">{{ m.tipo }}</span></td>
              <td>{{ m.categoria }}</td>
              <td>
                <strong>{{ m.descripcion }}</strong>
                <p v-if="m.referencia">Ref: {{ m.referencia }}</p>
              </td>
              <td>{{ m.clienteNombre || '—' }}</td>
              <td class="money">{{ formatMoney(m.monto) }}</td>
              <td>
                <a v-if="m.comprobanteUrl" :href="m.comprobanteUrl" target="_blank" class="file-link">Abrir</a>
                <span v-else>—</span>
              </td>
              <td>
                <button
                  class="btn-icon danger"
                  type="button"
                  :disabled="!canDeleteCajaMovimiento(m)"
                  :title="deleteTitle(m)"
                  @click="emit('remove', m)"
                >
                  <i class="fa-solid fa-trash-can" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mobile-only movement-cards">
        <article v-for="m in movimientos" :key="m._id" class="movement-card">
          <div class="movement-card__top">
            <div>
              <div class="card-meta">
                <span>{{ formatDate(m.fecha || m.createdAt) }}</span>
                <span :class="['badge', m.tipo]">{{ m.tipo }}</span>
              </div>
              <h4>{{ m.categoria }}</h4>
              <p>{{ m.descripcion }}</p>
            </div>
            <strong class="money">{{ formatMoney(m.monto) }}</strong>
          </div>

          <dl class="movement-card__details">
            <div><dt>Cliente</dt><dd>{{ m.clienteNombre || '—' }}</dd></div>
            <div><dt>Referencia</dt><dd>{{ m.referencia || '—' }}</dd></div>
            <div>
              <dt>Comprobante</dt>
              <dd>
                <a v-if="m.comprobanteUrl" :href="m.comprobanteUrl" target="_blank" class="file-link">Abrir</a>
                <span v-else>—</span>
              </dd>
            </div>
          </dl>

          <div class="movement-card__actions">
            <button
              class="btn-icon danger"
              type="button"
              :disabled="!canDeleteCajaMovimiento(m)"
              :title="deleteTitle(m)"
              @click="emit('remove', m)"
            >
              <i class="fa-solid fa-trash-can" />
            </button>
          </div>
        </article>
      </div>
    </template>

    <div v-else class="empty-state">
      <i class="fa-solid fa-wallet" />
      <div>
        <strong>No hay movimientos registrados</strong>
        <p>Presiona “Nuevo movimiento” para registrar un ingreso o egreso.</p>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './caja-ui' as ui;

@include ui.panel;
@include ui.badges;
@include ui.buttons;
@include ui.empty-state;

.count-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.4rem 0.75rem;
  background: rgba($ink-800, 0.7);
  color: $ink-200;
  font-size: 0.8rem;
}

.desktop-only { display: block; }
.mobile-only { display: none; }

.table-wrapper {
  overflow-x: auto;
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 16px;
}

.movements-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;

  th,
  td {
    padding: $space-3 $space-4;
    text-align: left;
    border-bottom: 1px solid rgba($ink-500, 0.1);
    vertical-align: top;
  }

  th {
    color: $ink-400;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  p { margin: 0.15rem 0 0; color: $ink-400; }
}

.movement-cards { display: grid; gap: $space-4; }

.movement-card {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  background: rgba($ink-900, 0.72);
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 20px;
  padding: $space-5;

  h4 { margin: 0; }
  p { margin: 0.25rem 0 0; color: $ink-400; }
}

.movement-card__top {
  display: flex;
  justify-content: space-between;
  gap: $space-4;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  color: $ink-400;
  font-size: 0.78rem;
}

.movement-card__details {
  margin: 0;
  display: grid;
  gap: $space-2;

  > div {
    display: grid;
    grid-template-columns: 110px 1fr;
    gap: $space-2;

    @media (max-width: 640px) { grid-template-columns: 1fr; }
  }

  dt { color: $ink-500; font-size: 0.75rem; text-transform: uppercase; }
  dd { margin: 0; }
}

.movement-card__actions { display: flex; justify-content: flex-end; }

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: $space-4;
}

.skeleton-card {
  height: 140px;
  background: rgba($ink-900, 0.72);
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 20px;
  animation: pulse 1.3s ease-in-out infinite alternate;
}

@keyframes pulse {
  from { opacity: 0.45; }
  to { opacity: 0.8; }
}

@media (max-width: 640px) {
  .desktop-only { display: none; }
  .mobile-only { display: grid; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-card { animation: none; }
}
</style>
