<script setup lang="ts">
/**
 * Register one payment against the balance.
 *
 * The amount is capped at the outstanding balance and defaults to it, because the
 * common case is settling up. Registering more than is owed is refused here as
 * well as on the server, so the operator is told before the request rather than
 * after it.
 */
import { computed, ref, watch } from 'vue'
import type { GestionAbono } from '@/services/gestiones_compra.api'
import AppModal from '@/components/ui/AppModal.vue'
import AppDatePicker from '@/components/ui/AppDatePicker.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { formatCurrency } from '@/utils/format'

export interface AbonoPayload {
  monto: number
  fecha: string
  metodo: GestionAbono['metodo']
  referencia?: string
  notas?: string
}

const props = defineProps<{ show: boolean; saldoPendiente: number; saving?: boolean }>()

const emit = defineEmits<{ close: []; save: [payload: AbonoPayload] }>()

const METODOS = [
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'deposito', label: 'Depósito' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'otro', label: 'Otro' },
]

const today = () => new Date().toISOString().slice(0, 10)

const monto = ref(0)
const fecha = ref(today())
const metodo = ref<GestionAbono['metodo']>('transferencia')
const referencia = ref('')
const notas = ref('')

/**
 * `immediate` so the form is filled in even when the modal is rendered already
 * open — otherwise the amount sits at zero until it is closed and reopened.
 */
watch(
  () => props.show,
  (visible) => {
    if (!visible) return
    monto.value = props.saldoPendiente
    fecha.value = today()
    metodo.value = 'transferencia'
    referencia.value = ''
    notas.value = ''
  },
  { immediate: true },
)

const saldoRestante = computed(() =>
  Math.max(0, Math.round((props.saldoPendiente - Number(monto.value || 0)) * 100) / 100),
)

const error = computed(() => {
  const value = Number(monto.value || 0)
  if (!(value > 0)) return 'El abono debe ser mayor a cero'
  if (value > props.saldoPendiente) {
    return `El abono supera el saldo pendiente de ${formatCurrency(props.saldoPendiente)}`
  }
  return ''
})

function submit() {
  if (error.value || props.saving) return
  emit('save', {
    monto: Number(monto.value),
    fecha: fecha.value,
    metodo: metodo.value,
    referencia: referencia.value || undefined,
    notas: notas.value || undefined,
  })
}
</script>

<template>
  <AppModal
    :show="show"
    title="Registrar abono"
    icon="fa-solid fa-hand-holding-dollar"
    icon-variant="info"
    max-width="520px"
    :disable-close="saving"
    @close="$emit('close')"
  >
    <form id="abono-form" class="abono-form" @submit.prevent="submit">
      <p class="saldo-line">
        <span>Saldo pendiente</span>
        <strong>{{ formatCurrency(saldoPendiente) }}</strong>
      </p>

      <div class="field">
        <span>Monto del abono *</span>
        <input v-model.number="monto" type="number" min="0" step="0.01" class="field-input" />
        <small v-if="error" class="field-error">{{ error }}</small>
        <small v-else class="field-note">
          {{ saldoRestante > 0 ? `Quedarían ${formatCurrency(saldoRestante)} por cobrar` : 'Con este abono queda saldada' }}
        </small>
      </div>

      <div class="field">
        <AppDatePicker v-model="fecha" label="Fecha del abono" />
        <small class="field-note">Con esta fecha entra al Estado de Resultados.</small>
      </div>

      <div class="field">
        <span>Método</span>
        <AppSelect v-model="metodo" :options="METODOS" placeholder="Seleccionar método" />
      </div>

      <div class="field">
        <span>Referencia</span>
        <input v-model="referencia" class="field-input" placeholder="N° de comprobante o transferencia" />
      </div>

      <div class="field">
        <span>Notas</span>
        <input v-model="notas" class="field-input" placeholder="Opcional" />
      </div>
    </form>

    <template #footer>
      <div class="form-actions">
        <button type="button" class="btn-ghost" :disabled="saving" @click="$emit('close')">Cancelar</button>
        <button type="submit" form="abono-form" class="btn-primary" :disabled="saving || !!error">
          <i v-if="saving" class="fa-solid fa-spinner fa-spin" />
          {{ saving ? 'Registrando...' : 'Registrar abono' }}
        </button>
      </div>
    </template>
  </AppModal>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.abono-form {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.saldo-line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 0;
  padding: $space-3 $space-4;
  border-radius: 12px;
  background: rgba($brand-orange, 0.08);
  border: 1px solid rgba($brand-orange, 0.28);

  span {
    font-size: 0.85rem;
    color: $ink-300;
  }

  strong {
    font-size: 1.35rem;
    color: $brand-orange;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  > span {
    font-size: 0.85rem;
    color: $ink-300;
  }
}

.field-input {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
  border: 1px solid rgba($ink-500, 0.28);
  background: rgba($ink-900, 0.5);
  color: $ink-100;
  font-size: 0.95rem;

  &:focus {
    outline: none;
    border-color: $brand-orange;
  }
}

.field-note {
  color: $ink-400;
  font-size: 0.78rem;
}

.field-error {
  color: #ff6b6b;
  font-size: 0.78rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: $space-3;
}

.btn-ghost,
.btn-primary {
  padding: 0.6rem 1.25rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-ghost {
  background: transparent;
  border-color: rgba($ink-500, 0.35);
  color: $ink-300;
}

.btn-primary {
  background: $brand-orange;
  color: #fff;
  display: inline-flex;
  align-items: center;
  gap: $space-2;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}
</style>
