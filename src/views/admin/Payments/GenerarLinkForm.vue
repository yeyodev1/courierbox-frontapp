<script setup lang="ts">
/** Creates a payment link for a client to settle a reference. */
import { computed, ref } from 'vue'
import { emptyPaymentForm, type PaymentForm } from './usePayments'

defineProps<{ creating: boolean }>()
const emit = defineEmits<{ submit: [form: PaymentForm, total: number] }>()

const form = ref<PaymentForm>(emptyPaymentForm())
const total = ref<number | null>(null)

const canSubmit = computed(() => !!total.value && total.value > 0)

function submit() {
  if (!canSubmit.value) return
  emit('submit', { ...form.value }, total.value as number)
  form.value = emptyPaymentForm()
  total.value = null
}
</script>

<template>
  <section class="content-card">
    <div class="card-head">
      <h3><i class="fa-solid fa-plus" /> Generar Nuevo Link</h3>
    </div>

    <form class="premium-form" @submit.prevent="submit">
      <div class="form-group">
        <label>Referencia de Pago</label>
        <input v-model="form.reference" type="text" required placeholder="Ej. WR12345" />
      </div>

      <div class="form-group">
        <label>Monto Total ($)</label>
        <div class="input-amount">
          <span class="input-prefix">$</span>
          <input v-model.number="total" type="number" min="0.01" step="0.01" required placeholder="0.00" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Nombre del Cliente</label>
          <input v-model="form.customerName" type="text" placeholder="Opcional" />
        </div>
        <div class="form-group">
          <label>Correo del Cliente</label>
          <input v-model="form.customerEmail" type="email" placeholder="Opcional" />
        </div>
      </div>

      <button type="submit" class="btn-primary" :disabled="creating || !canSubmit">
        <span v-if="!creating">Crear Link · ${{ (total || 0).toFixed(2) }}</span>
        <span v-else class="loader" />
      </button>
    </form>
  </section>
</template>

<style scoped lang="scss">
@use 'sass:color';
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

.premium-form {
  display: flex;
  flex-direction: column;
  gap: $space-5;

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $space-4;

    @media (max-width: 640px) { grid-template-columns: 1fr; }
  }

  .form-group {
    display: flex;
    flex-direction: column;

    label { font-size: 0.8rem; font-weight: 500; color: $ink-300; margin-bottom: $space-2; }

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

    input { padding-left: 2.5rem; }
  }
}

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
  font-family: inherit;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.25s;
  min-height: 46px;

  &:hover:not(:disabled) {
    background: color.adjust($brand-orange, $lightness: 5%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba($brand-orange, 0.3);
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; }
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

@media (prefers-reduced-motion: reduce) {
  .btn-primary { transition: none; }
  .btn-primary:hover:not(:disabled) { transform: none; }
  .loader { animation-duration: 2s; }
}
</style>
