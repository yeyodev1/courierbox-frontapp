<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminApi } from '@/services/admin.api'
import { useToastStore } from '@/stores/toast.store'

const toastStore = useToastStore()

const payments = ref<any[]>([])
const loadingPayments = ref(false)
const creatingPayment = ref(false)
const paymentForm = ref({ reference: '', customerName: '', customerEmail: '' })
const displayAmount = ref<number | null>(null)
const showDeletePaymentModal = ref(false)
const paymentToDelete = ref<any>(null)

async function fetchPayments() {
  loadingPayments.value = true
  try {
    const data = await adminApi.getPayments()
    payments.value = data.payments || []
  } catch (err: any) {
    toastStore.showNotification(err.message || 'Error al cargar pagos', 'error')
  } finally {
    loadingPayments.value = false
  }
}

function calculateTotals() {
  const total = displayAmount.value || 0
  const cents = Math.round(total * 100)
  return { amount: cents, amountWithoutTax: cents, amountWithTax: 0, tax: 0 }
}

async function handleGenerateLink() {
  creatingPayment.value = true
  try {
    await adminApi.generateLink({ ...calculateTotals(), ...paymentForm.value })
    paymentForm.value = { reference: '', customerName: '', customerEmail: '' }
    displayAmount.value = null
    await fetchPayments()
    toastStore.showNotification('Link de pago generado exitosamente', 'success')
  } catch (err: any) {
    toastStore.showNotification(err.message || 'Error al generar el link', 'error')
  } finally {
    creatingPayment.value = false
  }
}

function confirmDeletePayment(payment: any) {
  if (payment.status === 'paid' || payment.status === 'approved') {
    toastStore.showNotification('No se puede eliminar un link de pago que ya está pagado.', 'warning')
    return
  }
  paymentToDelete.value = payment
  showDeletePaymentModal.value = true
}

async function executeDeletePayment() {
  if (!paymentToDelete.value) return
  try {
    await adminApi.deletePayment(paymentToDelete.value._id)
    showDeletePaymentModal.value = false
    paymentToDelete.value = null
    await fetchPayments()
    toastStore.showNotification('Link de pago eliminado', 'success')
  } catch (err: any) {
    toastStore.showNotification(err.message || 'Error al eliminar', 'error')
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  toastStore.showNotification('Link copiado al portapapeles', 'success')
}

onMounted(() => {
  fetchPayments()
})
</script>

<template>
  <div class="page-content">
    <div class="content-grid">
      <section class="content-card">
        <div class="card-head">
          <h3><i class="fa-solid fa-plus" /> Generar Nuevo Link</h3>
        </div>
        <form @submit.prevent="handleGenerateLink" class="premium-form">
          <div class="form-group">
            <label>Referencia de Pago</label>
            <input type="text" v-model="paymentForm.reference" required placeholder="Ej. WR12345" />
          </div>
          <div class="form-group">
            <label>Monto Total ($)</label>
            <div class="input-amount">
              <span class="input-prefix">$</span>
              <input type="number" v-model.number="displayAmount" min="0.01" step="0.01" required placeholder="0.00" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Nombre del Cliente</label>
              <input type="text" v-model="paymentForm.customerName" placeholder="Opcional" />
            </div>
            <div class="form-group">
              <label>Correo del Cliente</label>
              <input type="email" v-model="paymentForm.customerEmail" placeholder="Opcional" />
            </div>
          </div>
          <button type="submit" :disabled="creatingPayment || !displayAmount || displayAmount <= 0" class="btn-primary">
            <span v-if="!creatingPayment">Crear Link · ${{ (displayAmount || 0).toFixed(2) }}</span>
            <span v-else class="loader" />
          </button>
        </form>
      </section>

      <section class="content-card">
        <div class="card-head">
          <h3><i class="fa-solid fa-clock-rotate-left" /> Historial Reciente</h3>
        </div>
        <div v-if="loadingPayments" class="state-box">
          <span class="loader" /><p>Cargando...</p>
        </div>
        <div v-else-if="payments.length === 0" class="state-box">
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
                <td>
                  <span :class="['badge', p.status === 'paid' || p.status === 'approved' ? 'badge-success' : p.status === 'pending' ? 'badge-warning' : p.status === 'canceled' ? 'badge-danger' : 'badge-info']">
                    {{ p.status === 'paid' || p.status === 'approved' ? 'Pagado' : p.status === 'pending' ? 'Pendiente' : p.status === 'canceled' ? 'Cancelado' : p.status }}
                  </span>
                </td>
                <td class="text-right">
                  <div class="action-group">
                    <button class="btn-icon" title="Copiar" @click="copyToClipboard(p.paymentLink)"><i class="fa-regular fa-copy" /></button>
                    <a :href="p.paymentLink" target="_blank" class="btn-icon" title="Abrir"><i class="fa-solid fa-up-right-from-square" /></a>
                    <button v-if="p.status !== 'paid' && p.status !== 'approved'" class="btn-icon danger" title="Eliminar" @click="confirmDeletePayment(p)"><i class="fa-regular fa-trash-can" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- Modals -->
    <transition name="fade">
      <div v-if="showDeletePaymentModal" class="modal-overlay" @click.self="showDeletePaymentModal = false">
        <div class="modal-card">
          <div class="modal-icon-box danger"><i class="fa-solid fa-triangle-exclamation" /></div>
          <h3>Eliminar Link de Pago</h3>
          <p>¿Eliminar el link <strong>{{ paymentToDelete?.reference }}</strong>? Esta acción no se puede deshacer.</p>
          <div class="modal-actions">
            <button class="btn-ghost" @click="showDeletePaymentModal = false">Cancelar</button>
            <button class="btn-danger" @click="executeDeletePayment">Sí, eliminar</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.page-content {
  width: 100%;
  max-width: 100%;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: $space-6;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.content-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 16px;
  padding: $space-6;
  transition: border-color 0.2s;
  overflow: hidden; // Previene que un hijo empuje los bordes hacia afuera

  &:hover {
    border-color: rgba($ink-400, 0.2);
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

      i {
        color: $brand-orange;
        font-size: 0.9rem;
      }
    }
  }
}

// FORMS
.premium-form {
  display: flex;
  flex-direction: column;
  gap: $space-5;

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $space-4;

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }

  .form-group {
    display: flex;
    flex-direction: column;

    label {
      font-size: 0.8rem;
      font-weight: 500;
      color: $ink-300;
      margin-bottom: $space-2;
    }

    input {
      background: rgba($ink-1000, 0.5);
      border: 1px solid rgba($ink-500, 0.3);
      color: $fg-dark;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      font-size: 0.9rem;
      transition: all 0.25s;
      width: 100%;

      &::placeholder { color: $ink-500; }

      &:focus {
        outline: none;
        border-color: $brand-orange;
        box-shadow: 0 0 0 3px rgba($brand-orange, 0.1);
        background: rgba($ink-1000, 0.8);
      }
    }

    .input-amount {
      position: relative;

      .input-prefix {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: $ink-400;
        font-weight: 600;
      }

      input {
        padding-left: 2.5rem;
      }
    }
  }

  .form-error {
    display: flex;
    align-items: center;
    gap: $space-2;
    background: rgba($signal-red, 0.08);
    color: #ff8a8f;
    padding: $space-3 $space-4;
    border-radius: 10px;
    font-size: 0.85rem;
    border: 1px solid rgba($signal-red, 0.15);
    margin: 0;
  }
}

// TABLES
.table-scroll {
  width: 100%;
  overflow-x: auto;
  
  // Custom scrollbar
  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba($ink-500, 0.5);
    border-radius: 4px;
  }
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 500px;

  th, td {
    padding: $space-3 $space-4;
    text-align: left;
    border-bottom: 1px solid rgba($ink-500, 0.1);
  }

  th {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: $ink-400;
    font-weight: 600;
  }

  tr:last-child td {
    border-bottom: none;
  }

  .cell-main {
    font-weight: 600;
    font-size: 0.9rem;
  }

  .cell-sub {
    font-size: 0.75rem;
    color: $ink-400;
    margin-top: 2px;
  }

  .cell-amount {
    font-weight: 700;
  }

  .text-right {
    text-align: right;
  }
}

// BADGES
.badge {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: inline-block;

  &-success { background: rgba($signal-green, 0.12); color: $signal-green; border: 1px solid rgba($signal-green, 0.2); }
  &-warning { background: rgba($signal-amber, 0.12); color: $signal-amber; border: 1px solid rgba($signal-amber, 0.2); }
  &-danger { background: rgba($signal-red, 0.12); color: #ff8a8f; border: 1px solid rgba($signal-red, 0.2); }
  &-info { background: rgba($signal-blue, 0.12); color: #6db6ff; border: 1px solid rgba($signal-blue, 0.2); }
  &-neutral { background: rgba($ink-400, 0.12); color: $ink-300; border: 1px solid rgba($ink-400, 0.2); }
}

// STATE BOX
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

// BUTTONS
.btn-primary {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $space-2;
  background: $brand-orange;
  color: #fff;
  border: none;
  padding: 0.85rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  min-height: 46px;

  &:hover:not(:disabled) {
    background: color.adjust($brand-orange, $lightness: 5%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba($brand-orange, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-ghost {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 1px solid rgba($ink-500, 0.3);
  border-radius: 10px;
  color: $ink-300;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;

  &:hover {
    background: rgba($ink-500, 0.15);
    color: $fg-dark;
  }
}

.btn-danger {
  padding: 0.75rem 1.5rem;
  background: $signal-red;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;

  &:hover {
    background: color.adjust($signal-red, $lightness: -8%);
  }
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

  &:hover {
    background: rgba($ink-400, 0.25);
    color: $fg-dark;
  }

  &.danger:hover {
    background: rgba($signal-red, 0.15);
    color: #ff8a8f;
    border-color: rgba($signal-red, 0.2);
  }
}

.action-group {
  display: flex;
  gap: $space-2;
  justify-content: flex-end;
}

// MODALS
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba($ink-1000, 0.75);
  backdrop-filter: blur(6px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.modal-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.15);
  border-radius: 20px;
  padding: $space-8;
  max-width: 420px;
  width: 100%;
  text-align: center;

  .modal-icon-box {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto $space-4;
    font-size: 1.2rem;

    &.danger { background: rgba($signal-red, 0.12); color: #ff8a8f; }
  }

  h3 {
    font-size: 1.15rem;
    margin: 0 0 $space-2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $space-2;
  }

  p {
    color: $ink-300;
    font-size: 0.9rem;
    margin: 0 0 $space-6;
  }

  .modal-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $space-3;

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }
}

.loader {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(#fff, 0.3);
  border-bottom-color: #fff;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
