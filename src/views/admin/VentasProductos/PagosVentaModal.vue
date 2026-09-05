<script setup lang="ts">
/**
 * The payments on one sale: what has come in, and a way to add or undo an entry.
 *
 * A sale used to be write-once — the amount collected was whatever was typed at
 * the till and there was no second chance — so this screen is deliberately both
 * halves of "editar pagos": the history is listed with each entry removable,
 * because the correction Oscar needed most was for a figure entered wrong, not
 * only for money arriving later. Removing reverses that entry in the ledger
 * rather than erasing it, so the books still show what happened.
 */
import { computed, ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppDatePicker from '@/components/ui/AppDatePicker.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { formatCurrency, formatDate } from '@/utils/format'
import { nuevoAbonoForm, type MetodoAbono, type Venta } from './useVentasProductos'

const props = defineProps<{ show: boolean; venta: Venta | null; saving?: boolean }>()

const emit = defineEmits<{
  close: []
  registrar: [payload: ReturnType<typeof nuevoAbonoForm>]
  eliminar: [abonoId: string]
}>()

const METODOS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'deposito', label: 'Depósito' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'otro', label: 'Otro' },
]

const form = ref(nuevoAbonoForm())
/** Two-step delete: a nested confirm modal over this one reads as a trap. */
const confirmandoId = ref('')

const saldo = computed(() => Number(props.venta?.saldo ?? 0))
const saldado = computed(() => saldo.value <= 0)
const abonos = computed(() => [...(props.venta?.abonos || [])].sort(
  (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
))

/** `immediate` so a modal rendered already open still starts filled in. */
watch(
  () => [props.show, props.venta?._id],
  () => {
    if (!props.show) return
    form.value = nuevoAbonoForm()
    // Settling up is the common case, so the balance is the default amount.
    form.value.monto = saldo.value
    form.value.metodo = (props.venta?.metodoPago?.toLowerCase() as MetodoAbono) || 'efectivo'
    confirmandoId.value = ''
  },
  { immediate: true },
)

const restante = computed(() =>
  Math.max(0, Math.round((saldo.value - (Number(form.value.monto) || 0)) * 100) / 100),
)

const error = computed(() => {
  if (saldado.value) return ''
  const value = Number(form.value.monto) || 0
  if (!(value > 0)) return 'El abono debe ser mayor a cero'
  if (value > saldo.value) return `El abono supera el saldo pendiente de ${formatCurrency(saldo.value)}`
  return ''
})

function submit() {
  if (error.value || props.saving || saldado.value) return
  emit('registrar', { ...form.value, monto: Number(form.value.monto) })
}

function pedirEliminar(abonoId: string) {
  confirmandoId.value = confirmandoId.value === abonoId ? '' : abonoId
}

function confirmarEliminar(abonoId: string) {
  confirmandoId.value = ''
  emit('eliminar', abonoId)
}
</script>

<template>
  <AppModal
    :show="show"
    title="Pagos de la venta"
    icon="fa-solid fa-hand-holding-dollar"
    icon-variant="info"
    max-width="600px"
    :disable-close="saving"
    @close="$emit('close')"
  >
    <div v-if="venta" class="pagos">
      <header class="resumen">
        <div>
          <strong class="cliente">{{ venta.clienteNombre || 'Sin cliente' }}</strong>
          <p class="detalle">{{ venta.productoNombre }} × {{ venta.cantidad }}</p>
        </div>
        <dl class="cifras">
          <div><dt>Total</dt><dd>{{ formatCurrency(venta.total) }}</dd></div>
          <div><dt>Cobrado</dt><dd>{{ formatCurrency(venta.valorPagado) }}</dd></div>
          <div :class="{ debe: saldo > 0 }"><dt>Pendiente</dt><dd>{{ formatCurrency(saldo) }}</dd></div>
        </dl>
      </header>

      <section class="historial">
        <h4>Abonos registrados</h4>
        <p v-if="!abonos.length" class="vacio">Todavía no se ha cobrado nada de esta venta.</p>
        <ul v-else>
          <li v-for="a in abonos" :key="a._id">
            <div class="abono-main">
              <strong>{{ formatCurrency(a.monto) }}</strong>
              <span class="meta">
                {{ formatDate(a.fecha) }} · {{ a.metodo }}
                <template v-if="a.referencia"> · {{ a.referencia }}</template>
              </span>
              <span v-if="a.registradoPorNombre" class="meta autor">{{ a.registradoPorNombre }}</span>
            </div>
            <div class="abono-acciones">
              <template v-if="confirmandoId === a._id">
                <span class="confirmar">¿Eliminar?</span>
                <button type="button" class="btn-danger" :disabled="saving" @click="confirmarEliminar(a._id)">
                  Sí, eliminar
                </button>
                <button type="button" class="btn-ghost" :disabled="saving" @click="confirmandoId = ''">No</button>
              </template>
              <button
                v-else
                type="button"
                class="btn-icon"
                title="Eliminar este abono"
                :disabled="saving"
                @click="pedirEliminar(a._id)"
              >
                <i class="fa-solid fa-trash-can" />
              </button>
            </div>
          </li>
        </ul>
      </section>

      <p v-if="saldado" class="saldada">
        <i class="fa-solid fa-circle-check" /> Esta venta está pagada por completo.
      </p>

      <form v-else id="abono-venta-form" class="alta" @submit.prevent="submit">
        <h4>Registrar un abono</h4>

        <div class="fila">
          <label class="field">
            <span>Monto *</span>
            <input v-model.number="form.monto" type="number" min="0" step="0.01" class="field-input" />
          </label>
          <div class="field">
            <AppDatePicker v-model="form.fecha" label="Fecha del abono" />
          </div>
        </div>

        <small v-if="error" class="field-error">{{ error }}</small>
        <small v-else class="field-note">
          {{ restante > 0 ? `Quedarían ${formatCurrency(restante)} por cobrar` : 'Con este abono queda saldada' }}
          · Con esta fecha entra al Estado de Resultados.
        </small>

        <div class="fila">
          <div class="field">
            <span>Método</span>
            <AppSelect v-model="form.metodo" :options="METODOS" placeholder="Seleccionar método" />
          </div>
          <label class="field">
            <span>Referencia</span>
            <input v-model="form.referencia" class="field-input" placeholder="N° de comprobante" />
          </label>
        </div>

        <label class="field">
          <span>Notas</span>
          <input v-model="form.notas" class="field-input" placeholder="Opcional" />
        </label>
      </form>
    </div>

    <template #footer>
      <div class="form-actions">
        <button type="button" class="btn-ghost" :disabled="saving" @click="$emit('close')">Cerrar</button>
        <button
          v-if="!saldado"
          type="submit"
          form="abono-venta-form"
          class="btn-primary"
          :disabled="saving || !!error"
        >
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

.pagos { display: flex; flex-direction: column; gap: $space-5; }

.resumen {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;
  padding: $space-3 $space-4;
  border-radius: 12px;
  background: rgba($brand-orange, 0.08);
  border: 1px solid rgba($brand-orange, 0.28);
}

.cliente { font-size: 1.05rem; color: $ink-100; }
.detalle { margin: 2px 0 0; font-size: 0.82rem; color: $ink-400; }

.cifras {
  display: flex;
  gap: $space-4;
  margin: 0;

  div { display: flex; flex-direction: column; gap: 2px; }
  dt { font-size: 0.75rem; color: $ink-400; }
  dd { margin: 0; font-weight: 700; color: $ink-100; font-variant-numeric: tabular-nums; }
  .debe dd { color: $brand-orange; }
}

.historial h4,
.alta h4 {
  margin: 0 0 $space-3;
  font-size: 0.9rem;
  color: $ink-200;
}

.vacio { margin: 0; font-size: 0.85rem; color: $ink-400; }

.historial ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: $space-2; }

.historial li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  padding: $space-2 $space-3;
  border-radius: 10px;
  border: 1px solid rgba($ink-500, 0.22);
  background: rgba($ink-900, 0.35);
}

.abono-main { display: flex; flex-direction: column; gap: 2px; }
.abono-main strong { color: $ink-100; font-variant-numeric: tabular-nums; }
.meta { font-size: 0.78rem; color: $ink-400; text-transform: capitalize; }
.autor { text-transform: none; }

.abono-acciones { display: flex; align-items: center; gap: $space-2; }
.confirmar { font-size: 0.8rem; color: $ink-300; }

.saldada {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin: 0;
  font-size: 0.9rem;
  color: #4ade80;
}

.alta { display: flex; flex-direction: column; gap: $space-3; }
.fila { display: flex; gap: $space-3; flex-wrap: wrap; > * { flex: 1 1 200px; } }

.field {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  > span { font-size: 0.85rem; color: $ink-300; }
}

.field-input {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
  border: 1px solid rgba($ink-500, 0.28);
  background: rgba($ink-900, 0.5);
  color: $ink-100;
  font-size: 0.95rem;

  &:focus { outline: none; border-color: $brand-orange; }
}

.field-note { color: $ink-400; font-size: 0.78rem; }
.field-error { color: #ff6b6b; font-size: 0.78rem; }

.form-actions { display: flex; justify-content: flex-end; gap: $space-3; }

.btn-ghost,
.btn-primary,
.btn-danger {
  padding: 0.6rem 1.25rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;

  &:disabled { opacity: 0.55; cursor: not-allowed; }
}

.btn-ghost { background: transparent; border-color: rgba($ink-500, 0.35); color: $ink-300; }
.btn-primary { background: $brand-orange; color: #fff; display: inline-flex; align-items: center; gap: $space-2; }
.btn-danger { background: rgba(#ff6b6b, 0.16); border-color: rgba(#ff6b6b, 0.45); color: #ff8f8f; padding: 0.4rem 0.8rem; font-size: 0.8rem; }

.btn-icon {
  background: transparent;
  border: 1px solid rgba($ink-500, 0.3);
  border-radius: 8px;
  color: $ink-400;
  cursor: pointer;
  padding: 0.35rem 0.6rem;

  &:hover:not(:disabled) { color: #ff8f8f; border-color: rgba(#ff6b6b, 0.45); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
</style>
