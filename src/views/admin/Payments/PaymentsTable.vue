<script setup lang="ts">
/** Recently generated links, with copy / open / delete per row. */
import { isPaid, statusClass, statusLabel, type PaymentLink } from './usePayments'

defineProps<{ payments: PaymentLink[]; loading: boolean }>()
const emit = defineEmits<{ copy: [link: string]; remove: [payment: PaymentLink] }>()
</script>

<template>
  <section class="content-card">
    <div class="card-head">
      <h3><i class="fa-solid fa-clock-rotate-left" /> Historial Reciente</h3>
    </div>

    <div v-if="loading" class="state-box">
      <span class="loader" /><p>Cargando...</p>
    </div>

    <div v-else-if="!payments.length" class="state-box">
      <i class="fa-solid fa-inbox fa-2x" /><p>No hay links generados aún.</p>
    </div>

    <div v-else class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th>Referencia</th>
            <th>Cliente</th>
            <th>Total</th>
            <th>Estado</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in payments" :key="p._id">
            <td>
              <div class="cell-main">{{ p.reference }}</div>
              <div class="cell-sub">{{ new Date(p.createdAt).toLocaleDateString() }}</div>
            </td>
            <td>
              <div class="cell-main">{{ p.customerName || 'N/A' }}</div>
              <div class="cell-sub">Por: {{ p.createdBy?.name || 'Sistema' }}</div>
            </td>
            <td class="cell-amount">${{ (p.amount / 100).toFixed(2) }}</td>
            <td><span class="badge" :class="statusClass(p.status)">{{ statusLabel(p.status) }}</span></td>
            <td class="text-right">
              <div class="action-group">
                <button class="btn-icon" title="Copiar" @click="emit('copy', p.paymentLink)">
                  <i class="fa-regular fa-copy" />
                </button>
                <a :href="p.paymentLink" target="_blank" class="btn-icon" title="Abrir">
                  <i class="fa-solid fa-up-right-from-square" />
                </a>
                <button v-if="!isPaid(p.status)" class="btn-icon danger" title="Eliminar" @click="emit('remove', p)">
                  <i class="fa-regular fa-trash-can" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.content-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 16px;
  padding: $space-6;
}

.card-head {
  display: flex;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-5;
  padding-bottom: $space-4;
  border-bottom: 1px solid rgba($ink-500, 0.08);

  h3 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: $space-2;

    i { color: $brand-orange; font-size: 0.9rem; }
  }
}

.table-scroll {
  overflow-x: auto;
  margin: 0 (-$space-6);
  padding: 0 $space-6;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 500px;

  th,
  td { padding: $space-3 $space-4; text-align: left; border-bottom: 1px solid rgba($ink-500, 0.1); }

  th {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: $ink-400;
    font-weight: 600;
  }

  tr:last-child td { border-bottom: none; }

  .cell-main { font-weight: 600; font-size: 0.9rem; }
  .cell-sub { font-size: 0.75rem; color: $ink-400; margin-top: 2px; }
  .cell-amount { font-weight: 700; }
  .text-right { text-align: right; }
}

.action-group {
  display: flex;
  gap: $space-2;
  justify-content: flex-end;
}

.badge {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: inline-block;

  &.badge-success { background: rgba($signal-green, 0.12); color: $signal-green; border: 1px solid rgba($signal-green, 0.2); }
  &.badge-warning { background: rgba($signal-amber, 0.12); color: $signal-amber; border: 1px solid rgba($signal-amber, 0.2); }
  &.badge-danger { background: rgba($signal-red, 0.12); color: #ff8a8f; border: 1px solid rgba($signal-red, 0.2); }
  &.badge-info { background: rgba($signal-blue, 0.12); color: #6db6ff; border: 1px solid rgba($signal-blue, 0.2); }
}

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: $ink-400;
  text-align: center;
  gap: $space-3;

  p { margin: 0; font-size: 0.9rem; }
  i { opacity: 0.5; }
}

.btn-icon {
  width: 34px;
  height: 34px;
  background: rgba($ink-500, 0.15);
  border: 1px solid rgba($ink-500, 0.2);
  border-radius: 8px;
  color: $ink-300;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;

  &:hover { background: rgba($ink-400, 0.25); color: $fg-dark; }

  &.danger:hover {
    background: rgba($signal-red, 0.15);
    color: #ff8a8f;
    border-color: rgba($signal-red, 0.2);
  }
}

.loader {
  width: 20px;
  height: 20px;
  border: 3px solid rgba($ink-400, 0.2);
  border-bottom-color: $brand-orange;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .btn-icon { transition: none; }
  .loader { animation-duration: 2s; }
}
</style>
