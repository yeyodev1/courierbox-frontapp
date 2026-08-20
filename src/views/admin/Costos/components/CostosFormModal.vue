<script setup lang="ts">
/** Create or edit an expense, optionally priced by weight. */
import { ref, watch } from 'vue'
import type { Gasto } from '@/services/costos.api'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppDatePicker from '@/components/ui/AppDatePicker.vue'
import AppFileUpload from '@/components/ui/AppFileUpload.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { useToastStore } from '@/stores/toast.store'
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
const c = useCostoForm()

const showCloseConfirm = ref(false)

const TIPO_OPTIONS = [
  { value: 'operacional', label: 'Operacional' },
  { value: 'logistico', label: 'Logístico' },
  { value: 'envio', label: 'Envío' },
]

watch(
  () => props.show,
  (visible) => {
    if (visible) c.load(props.initialData)
  },
)

/** Closing with edits pending asks first, so a half-typed expense is not lost. */
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
    :title="initialData ? 'Editar gasto' : 'Nuevo gasto'"
    icon="fa-solid fa-coins"
    icon-variant="info"
    max-width="600px"
    :prevent-close-on-overlay="c.hasUnsavedChanges.value || saving"
    :disable-close="saving"
    @close="requestClose"
  >
    <form id="costos-form" @submit.prevent="handleSave">
      <div class="form-grid">
        <div class="form-field">
          <span>Tipo *</span>
          <AppSelect v-model="c.form.value.tipo" :options="TIPO_OPTIONS" placeholder="Seleccionar tipo" />
        </div>

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
          <span>Descripción *</span>
          <input v-model="c.form.value.descripcion" class="field-input" placeholder="Ej: Pago de renta enero" />
        </div>

        <div class="form-field">
          <span>Monto USD *</span>
          <input
            v-model.number="c.form.value.monto"
            type="number"
            step="0.01"
            min="0"
            class="field-input"
            :disabled="c.porLibras.value"
          />
          <small v-if="c.porLibras.value" class="field-note">Se sincroniza con el total calculado por libras.</small>
        </div>

        <div class="form-field">
          <AppDatePicker v-model="c.form.value.fecha" label="Fecha" />
        </div>

        <ProveedorPicker v-model="c.form.value.proveedor" :tipo="c.form.value.tipo" />

        <label class="toggle-row full-width weight-toggle">
          <input v-model="c.porLibras.value" type="checkbox" @change="c.syncWeightFields(c.porLibras.value)" />
          <span>Incluye costo por libras</span>
        </label>

        <div v-if="c.porLibras.value" class="weight-fields full-width">
          <div class="form-field">
            <span>Libras</span>
            <input v-model.number="c.form.value.libras" type="number" min="0" step="0.01" class="field-input" />
          </div>
          <div class="form-field">
            <span>Valor por libra</span>
            <input v-model.number="c.form.value.valorPorLibra" type="number" min="0" step="0.01" class="field-input" />
          </div>
          <div class="form-field">
            <span>Valor total</span>
            <input v-model.number="c.form.value.valorTotal" type="number" min="0" step="0.01" class="field-input" disabled />
            <small class="field-note">Calculado automáticamente.</small>
          </div>
        </div>

        <div class="form-field">
          <span>Referencia</span>
          <input v-model="c.form.value.referencia" class="field-input" placeholder="Factura # o código" />
        </div>

        <div class="form-field">
          <span>Número de factura</span>
          <input v-model="c.form.value.numeroFactura" class="field-input" placeholder="F001-001-000123" />
        </div>

        <div class="form-field">
          <AppDatePicker v-model="c.form.value.fechaFactura" label="Fecha factura" />
        </div>

        <div class="form-field">
          <span>Valor pagado</span>
          <input v-model.number="c.form.value.valorPagado" type="number" min="0" step="0.01" class="field-input" />
        </div>

        <div class="form-field full-width">
          <AppFileUpload
            v-model="c.facturaFile.value"
            label="Factura / comprobante"
            accept="image/*,.pdf"
            hint="Sube una foto legible o el PDF. Cloudinary lo guardará al enviar el formulario."
            variant="proof"
          />
        </div>

        <ComprobantePreview :file="c.facturaFile.value" />
      </div>
    </form>

    <template #footer>
      <div class="form-actions">
        <button type="button" class="btn-ghost" :disabled="saving" @click="requestClose">Cancelar</button>
        <button type="submit" form="costos-form" class="btn-primary" :disabled="saving">
          <i v-if="saving" class="fa-solid fa-spinner fa-spin" />
          {{ saving ? 'Guardando...' : initialData ? 'Actualizar' : 'Guardar' }}
        </button>
      </div>
    </template>
  </AppModal>

  <AppModal
    :show="showCloseConfirm"
    title="¿Seguro que quieres cerrar?"
    icon="fa-solid fa-triangle-exclamation"
    icon-variant="warn"
    max-width="420px"
    @close="showCloseConfirm = false"
  >
    <p class="confirm-text">Perderás el progreso no guardado.</p>
    <template #footer>
      <div class="modal-actions">
        <button type="button" class="btn-ghost" @click="showCloseConfirm = false">Seguir editando</button>
        <button type="button" class="btn-primary" @click="showCloseConfirm = false; emit('close')">Sí, cerrar</button>
      </div>
    </template>
  </AppModal>
</template>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-4;

  @media (max-width: 640px) { grid-template-columns: 1fr; gap: $space-3; }
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  span { font-size: 0.8rem; color: $ink-400; font-weight: 500; }
}

.field-input {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.2);
  border-radius: 10px;
  padding: $space-2 $space-3;
  color: $fg-dark;
  font-family: inherit;
  outline: none;

  &:focus { border-color: $brand-orange; }
  &:disabled { opacity: 0.75; cursor: not-allowed; }
}

.field-note { font-size: 0.75rem; color: $ink-500; }

.toggle-row {
  display: flex;
  align-items: center;
  gap: $space-2;
  color: $ink-300;
  font-size: 0.9rem;
}

.weight-toggle {
  padding: $space-3 $space-4;
  border: 1px solid rgba($ink-500, 0.15);
  border-radius: 14px;
  background: rgba($ink-800, 0.55);
}

.weight-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $space-3;

  @media (max-width: 640px) { grid-template-columns: 1fr; }
}

.full-width { grid-column: 1 / -1; }

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: $space-3;
  margin-top: $space-2;

  @media (max-width: 640px) { flex-direction: column-reverse; }
}

.confirm-text {
  text-align: center;
  margin: 0 0 $space-5;
  color: $ink-300;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: $space-3;
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
  font-size: 0.9rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { background: color.adjust($brand-orange, $lightness: -8%); }
}

.btn-ghost {
  padding: 0.6rem 1.25rem;
  background: transparent;
  border: 1px solid rgba($ink-500, 0.3);
  border-radius: 10px;
  color: $ink-300;
  font-weight: 500;
  font-size: 0.9rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { background: rgba($ink-500, 0.15); color: $fg-dark; }
}
</style>
