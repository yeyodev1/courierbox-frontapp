<script setup lang="ts">
/**
 * A reception: the cargo that came in, and what Courier Box paid for each pound.
 *
 * This used to be the expense form with a "includes cost per pound" checkbox
 * ticked, which is why receptions and expenses shared a list. Here the pounds and
 * the rate are the point of the record, so they are required, and the total is
 * derived from them — there is no field to type a total that disagrees with the
 * rate it is supposed to come from.
 */
import { ref, watch } from 'vue'
import type { Gasto } from '@/services/costos.api'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppDatePicker from '@/components/ui/AppDatePicker.vue'
import AppFileUpload from '@/components/ui/AppFileUpload.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { useToastStore } from '@/stores/toast.store'
import { formatCurrency } from '@/utils/format'
import ProveedorPicker from './ProveedorPicker.vue'
import ComprobantePreview from './ComprobantePreview.vue'
import { OTRA_CATEGORIA, useCostoForm } from './useCostoForm'

const props = withDefaults(
  defineProps<{ show: boolean; initialData?: Gasto | null; saving?: boolean }>(),
  { initialData: null, saving: false },
)

const emit = defineEmits<{
  close: []
  save: [payload: ReturnType<ReturnType<typeof useCostoForm>['buildPayload']>, file: File | null]
}>()

const toastStore = useToastStore()
const c = useCostoForm('recepcion', 'recepcion')

const showCloseConfirm = ref(false)

watch(
  () => props.show,
  (visible) => {
    if (visible) c.load(props.initialData)
  },
)

function requestClose() {
  if (c.hasUnsavedChanges.value) {
    showCloseConfirm.value = true
    return
  }
  emit('close')
}

function handleSave() {
  if (props.saving) return
  const error = c.validate()
  if (error) {
    toastStore.showNotification(error, 'error')
    return
  }
  emit('save', c.buildPayload(), c.facturaFile.value)
}
</script>

<template>
  <AppModal
    :show="show"
    :title="initialData ? 'Editar recepción' : 'Nueva recepción'"
    icon="fa-solid fa-weight-hanging"
    icon-variant="info"
    max-width="640px"
    :prevent-close-on-overlay="c.hasUnsavedChanges.value || saving"
    :disable-close="saving"
    @close="requestClose"
  >
    <form id="recepcion-form" @submit.prevent="handleSave">
      <div class="form-grid">
        <div class="form-field">
          <span>Categoría *</span>
          <AppSelect
            v-model="c.form.value.categoria"
            :options="c.categoriasDisponibles.value"
            placeholder="Seleccionar categoría"
          />
        </div>

        <div v-if="c.form.value.categoria === OTRA_CATEGORIA" class="form-field">
          <span>Especificar categoría *</span>
          <input v-model="c.form.value.categoriaPersonalizada" class="field-input" placeholder="Nueva categoría" />
        </div>

        <div class="form-field">
          <AppDatePicker v-model="c.form.value.fecha" label="Fecha de recepción" />
        </div>

        <div class="form-field full-width">
          <span>Descripción de la carga *</span>
          <input
            v-model="c.form.value.descripcion"
            class="field-input"
            placeholder="Ej: Carga recibida de TMA en la tarde"
          />
        </div>

        <ProveedorPicker v-model="c.form.value.proveedor" tipo="recepcion" />

        <div class="form-field">
          <span>Paquetes</span>
          <input v-model.number="c.form.value.numeroPaquetes" type="number" min="0" step="1" class="field-input" />
        </div>

        <section class="weight-panel full-width">
          <header>
            <h4>Libras recibidas y costo</h4>
            <p>El total sale de las libras por el valor que pagas por cada una.</p>
          </header>
          <div class="weight-fields">
            <div class="form-field">
              <span>Libras *</span>
              <input v-model.number="c.form.value.libras" type="number" min="0" step="0.01" class="field-input" />
            </div>
            <div class="form-field">
              <span>Valor por libra *</span>
              <input v-model.number="c.form.value.valorPorLibra" type="number" min="0" step="0.01" class="field-input" />
            </div>
          </div>
          <p class="weight-total">
            <span>Total a pagar</span>
            <strong>{{ formatCurrency(c.form.value.valorTotal) }}</strong>
          </p>
        </section>

        <div class="form-field">
          <span>Valor pagado</span>
          <input v-model.number="c.form.value.valorPagado" type="number" min="0" step="0.01" class="field-input" />
        </div>

        <div class="form-field">
          <span>Número de factura</span>
          <input v-model="c.form.value.numeroFactura" class="field-input" placeholder="F001-001-000123" />
        </div>

        <div class="form-field">
          <AppDatePicker v-model="c.form.value.fechaFactura" label="Fecha factura" />
        </div>

        <div class="form-field">
          <span>Referencia</span>
          <input v-model="c.form.value.referencia" class="field-input" placeholder="Guía o código de carga" />
        </div>

        <div class="form-field full-width">
          <AppFileUpload
            v-model="c.facturaFile.value"
            label="Factura / comprobante"
            accept="image/*,.pdf"
            hint="Sube una foto legible o el PDF. Se guarda al enviar el formulario."
            variant="proof"
          />
        </div>

        <ComprobantePreview :file="c.facturaFile.value" />
      </div>
    </form>

    <template #footer>
      <div class="form-actions">
        <button type="button" class="btn-ghost" :disabled="saving" @click="requestClose">Cancelar</button>
        <button type="submit" form="recepcion-form" class="btn-primary" :disabled="saving">
          <i v-if="saving" class="fa-solid fa-spinner fa-spin" />
          {{ saving ? 'Guardando...' : initialData ? 'Actualizar' : 'Guardar' }}
        </button>
      </div>
    </template>
  </AppModal>

  <AppModal
    :show="showCloseConfirm"
    title="Descartar cambios"
    icon="fa-solid fa-triangle-exclamation"
    icon-variant="warning"
    max-width="420px"
    @close="showCloseConfirm = false"
  >
    <p class="confirm-text">Tienes cambios sin guardar en esta recepción. ¿Salir de todas formas?</p>
    <template #footer>
      <div class="form-actions">
        <button type="button" class="btn-ghost" @click="showCloseConfirm = false">Seguir editando</button>
        <button type="button" class="btn-primary" @click="showCloseConfirm = false; $emit('close')">Descartar</button>
      </div>
    </template>
  </AppModal>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $space-4;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: $space-3;
  }
}

.full-width {
  grid-column: 1 / -1;
}

.form-field {
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

.weight-panel {
  border: 1px solid rgba($brand-orange, 0.28);
  border-radius: 14px;
  padding: $space-4;
  background: rgba($brand-orange, 0.06);
  display: flex;
  flex-direction: column;
  gap: $space-3;

  header h4 {
    margin: 0 0 $space-1;
    font-size: 0.95rem;
  }

  header p {
    margin: 0;
    font-size: 0.8rem;
    color: $ink-400;
  }
}

.weight-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $space-3;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.weight-total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 0;
  padding-top: $space-3;
  border-top: 1px solid rgba($brand-orange, 0.2);

  span {
    font-size: 0.85rem;
    color: $ink-300;
  }

  strong {
    font-size: 1.35rem;
    color: $brand-orange;
  }
}

.confirm-text {
  margin: 0;
  color: $ink-300;
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
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
