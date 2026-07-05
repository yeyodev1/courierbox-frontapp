<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, onMounted } from 'vue'
import { proveedoresApi, type Proveedor } from '@/services/proveedores.api'
import { CATEGORIAS_POR_TIPO, type Gasto } from '@/services/costos.api'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppDatePicker from '@/components/ui/AppDatePicker.vue'
import AppFileUpload from '@/components/ui/AppFileUpload.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { useToastStore } from '@/stores/toast.store'

const props = defineProps({
  show: { type: Boolean, required: true },
  initialData: { type: Object as () => Gasto | null, default: null },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: any, file: File | null): void
}>()

const form = ref({
  tipo: 'operacional',
  categoria: '',
  monto: 0,
  descripcion: '',
  fecha: new Date().toISOString().slice(0, 10),
  proveedor: '',
  referencia: '',
  numeroFactura: '',
  fechaFactura: new Date().toISOString().slice(0, 10),
  libras: 0,
  valorPorLibra: 0,
  valorTotal: 0,
  valorPagado: 0,
  categoriaPersonalizada: '',
})

const facturaFile = ref<File | null>(null)
const facturaPreviewUrl = ref('')
const providerQuery = ref('')
const incluyeCostoLibras = ref(false)

const proveedores = ref<Proveedor[]>([])
const savingProveedor = ref(false)
const showCloseConfirm = ref(false)
const toastStore = useToastStore()

const initialSnapshot = ref('')
const currentSnapshot = computed(() => JSON.stringify(form.value))
const hasUnsavedChanges = computed(() => currentSnapshot.value !== initialSnapshot.value || !!facturaFile.value)

function syncSnapshot() {
  initialSnapshot.value = currentSnapshot.value
}

function calculateWeightTotal() {
  const libras = Number(form.value.libras || 0)
  const valorPorLibra = Number(form.value.valorPorLibra || 0)
  return Number((libras * valorPorLibra).toFixed(2))
}

function syncCalculatedWeightTotal() {
  if (!incluyeCostoLibras.value) return
  const total = calculateWeightTotal()
  form.value.valorTotal = total
  if (total > 0) form.value.monto = total
}

function syncWeightFields(enabled: boolean) {
  if (!enabled) {
    form.value.libras = 0
    form.value.valorPorLibra = 0
    form.value.valorTotal = form.value.monto
    return
  }
  syncCalculatedWeightTotal()
}

watch([incluyeCostoLibras, () => form.value.libras, () => form.value.valorPorLibra], syncCalculatedWeightTotal)

function syncFacturaPreview(file: File | null) {
  if (facturaPreviewUrl.value) {
    URL.revokeObjectURL(facturaPreviewUrl.value)
    facturaPreviewUrl.value = ''
  }
  if (file) facturaPreviewUrl.value = URL.createObjectURL(file)
}

watch(facturaFile, (file) => syncFacturaPreview(file))
onBeforeUnmount(() => syncFacturaPreview(null))

const categoriasDisponibles = computed(() => {
  if (!form.value.tipo) return []
  const cats = CATEGORIAS_POR_TIPO[form.value.tipo as keyof typeof CATEGORIAS_POR_TIPO] || []
  return [...cats, 'Otro (especificar)']
})

const proveedorSugeridos = computed(() => {
  const q = providerQuery.value.trim().toLowerCase()
  return proveedores.value
    .filter((p) => !q || p.nombre.toLowerCase().includes(q))
    .slice(0, 8)
})

async function loadProveedores() {
  try {
    const data = await proveedoresApi.list({ q: providerQuery.value || undefined, limit: 50 })
    proveedores.value = data.proveedores
  } catch {
    proveedores.value = []
  }
}

watch(providerQuery, loadProveedores)
onMounted(loadProveedores)

async function crearProveedorDesdeCampo() {
  const nombre = form.value.proveedor.trim()
  if (!nombre) return
  const existe = proveedores.value.some((p) => p.nombre.toLowerCase() === nombre.toLowerCase())
  if (existe) return
  savingProveedor.value = true
  try {
    await proveedoresApi.create({ nombre, tipo: form.value.tipo || 'general' })
    await loadProveedores()
    toastStore.showNotification('Proveedor guardado y disponible para futuros gastos.', 'success')
  } catch (e: any) {
    toastStore.showNotification(e.message || 'No se pudo crear el proveedor', 'error')
  } finally {
    savingProveedor.value = false
  }
}

function resetForm() {
  form.value = {
    tipo: 'operacional',
    categoria: '',
    monto: 0,
    descripcion: '',
    fecha: new Date().toISOString().slice(0, 10),
    proveedor: '',
    referencia: '',
    numeroFactura: '',
    fechaFactura: new Date().toISOString().slice(0, 10),
    libras: 0,
    valorPorLibra: 0,
    valorTotal: 0,
    valorPagado: 0,
    categoriaPersonalizada: '',
  }
  incluyeCostoLibras.value = false
  facturaFile.value = null
  syncFacturaPreview(null)
  providerQuery.value = ''
}

function isWeightExpense(gasto: Gasto) {
  return Number(gasto.libras || 0) > 0 || Number(gasto.valorPorLibra || 0) > 0 || Number(gasto.valorTotal || 0) !== Number(gasto.monto || 0)
}

function applyGastoToForm(gasto: Gasto) {
  const categoriaConocida = CATEGORIAS_POR_TIPO[gasto.tipo as keyof typeof CATEGORIAS_POR_TIPO] || []
  form.value = {
    tipo: gasto.tipo,
    categoria: categoriaConocida.includes(gasto.categoria) ? gasto.categoria : 'Otro (especificar)',
    monto: Number(gasto.monto || 0),
    descripcion: gasto.descripcion || '',
    fecha: gasto.fecha ? new Date(gasto.fecha).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    proveedor: gasto.proveedor || '',
    referencia: gasto.referencia || '',
    numeroFactura: gasto.numeroFactura || '',
    fechaFactura: gasto.fechaFactura ? new Date(gasto.fechaFactura).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    libras: Number(gasto.libras || 0),
    valorPorLibra: Number(gasto.valorPorLibra || 0),
    valorTotal: Number(gasto.valorTotal || gasto.monto || 0),
    valorPagado: Number(gasto.valorPagado || 0),
    categoriaPersonalizada: categoriaConocida.includes(gasto.categoria) ? '' : gasto.categoria,
  }
  incluyeCostoLibras.value = isWeightExpense(gasto)
  if (incluyeCostoLibras.value) syncCalculatedWeightTotal()
  facturaFile.value = null
  providerQuery.value = gasto.proveedor || ''
}

watch(() => props.show, (val) => {
  if (val) {
    if (props.initialData) {
      applyGastoToForm(props.initialData)
    } else {
      resetForm()
    }
    syncSnapshot()
  }
})

function requestCloseModal() {
  if (hasUnsavedChanges.value) {
    showCloseConfirm.value = true
    return
  }
  emit('close')
}

function discardAndCloseModal() {
  showCloseConfirm.value = false
  emit('close')
}

function handleSave() {
  if (props.saving) return
  const categoria = form.value.categoria === 'Otro (especificar)'
    ? form.value.categoriaPersonalizada
    : form.value.categoria
  if (!categoria || !form.value.descripcion || form.value.monto <= 0) {
    toastStore.showNotification('Completa todos los campos requeridos', 'error')
    return
  }
  if (incluyeCostoLibras.value && (Number(form.value.libras || 0) <= 0 || Number(form.value.valorPorLibra || 0) <= 0)) {
    toastStore.showNotification('Ingresa libras y valor por libra para calcular el total', 'error')
    return
  }
  const pesoPayload = incluyeCostoLibras.value
    ? {
        libras: form.value.libras,
        valorPorLibra: form.value.valorPorLibra,
        valorTotal: form.value.valorTotal || form.value.monto,
      }
    : {
        libras: 0,
        valorPorLibra: 0,
        valorTotal: form.value.monto,
      }

  const payload = {
    tipo: form.value.tipo,
    categoria,
    monto: form.value.monto,
    descripcion: form.value.descripcion,
    fecha: form.value.fecha,
    proveedor: form.value.proveedor,
    referencia: form.value.referencia,
    numeroFactura: form.value.numeroFactura,
    fechaFactura: form.value.fechaFactura,
    ...pesoPayload,
    valorPagado: form.value.valorPagado,
  }
  
  emit('save', payload, facturaFile.value)
}
</script>

<template>
  <AppModal
    :show="show"
    :title="initialData ? 'Editar gasto' : 'Nuevo gasto'"
    icon="fa-solid fa-coins"
    icon-variant="info"
    max-width="600px"
    :prevent-close-on-overlay="hasUnsavedChanges || saving"
    :disable-close="saving"
    @close="requestCloseModal"
  >
        <form id="costos-form" @submit.prevent="handleSave">
          <div class="form-grid">
            <div class="form-field">
            <span>Tipo *</span>
            <AppSelect
              v-model="form.tipo"
              :options="[
                { value: 'operacional', label: 'Operacional' },
                { value: 'logistico', label: 'Logístico' },
                { value: 'envio', label: 'Envío' },
              ]"
              placeholder="Seleccionar tipo"
            />
          </div>
          <div class="form-field">
            <span>Categoría *</span>
            <AppSelect
              v-model="form.categoria"
              :options="categoriasDisponibles"
              placeholder="Seleccionar categoría"
            />
          </div>
          <div v-if="form.categoria === 'Otro (especificar)'" class="form-field">
            <span>Especificar categoría *</span>
            <input v-model="form.categoriaPersonalizada" class="field-input" placeholder="Nueva categoría" />
          </div>
          <div class="form-field">
            <span>Descripción *</span>
            <input v-model="form.descripcion" class="field-input" placeholder="Ej: Pago de renta enero" />
          </div>
          <div class="form-field">
            <span>Monto USD *</span>
            <input v-model.number="form.monto" type="number" step="0.01" min="0" class="field-input" :disabled="incluyeCostoLibras" />
            <small v-if="incluyeCostoLibras" class="field-note">Se sincroniza con el total calculado por libras.</small>
          </div>
          <div class="form-field">
            <AppDatePicker v-model="form.fecha" label="Fecha" />
          </div>
          <div class="form-field full-width provider-field">
            <div class="provider-head">
              <span>Proveedor</span>
              <button type="button" class="provider-save-btn" :disabled="savingProveedor || !form.proveedor.trim()" @click="crearProveedorDesdeCampo">
                <i class="fa-solid fa-plus" /> Crear proveedor
              </button>
            </div>
            <input v-model="form.proveedor" class="field-input" placeholder="Nombre o empresa" @input="providerQuery = form.proveedor" />
            <div v-if="proveedorSugeridos.length" class="provider-chips">
              <button v-for="p in proveedorSugeridos" :key="p._id" type="button" class="provider-chip" @click="form.proveedor = p.nombre">
                {{ p.nombre }}
              </button>
            </div>
          </div>
          <label class="toggle-row full-width weight-toggle">
            <input v-model="incluyeCostoLibras" type="checkbox" @change="syncWeightFields(incluyeCostoLibras)" />
            <span>Incluye costo por libras</span>
          </label>
          <div v-if="incluyeCostoLibras" class="weight-fields full-width">
            <div class="form-field">
              <span>Libras</span>
              <input v-model.number="form.libras" type="number" min="0" step="0.01" class="field-input" />
            </div>
            <div class="form-field">
              <span>Valor por libra</span>
              <input v-model.number="form.valorPorLibra" type="number" min="0" step="0.01" class="field-input" />
            </div>
            <div class="form-field">
              <span>Valor total</span>
              <input v-model.number="form.valorTotal" type="number" min="0" step="0.01" class="field-input" disabled />
              <small class="field-note">Calculado automáticamente.</small>
            </div>
          </div>
          <div class="form-field">
            <span>Referencia</span>
            <input v-model="form.referencia" class="field-input" placeholder="Factura # o código" />
          </div>
          <div class="form-field">
            <span>Número de factura</span>
            <input v-model="form.numeroFactura" class="field-input" placeholder="F001-001-000123" />
          </div>
          <div class="form-field">
            <AppDatePicker v-model="form.fechaFactura" label="Fecha factura" />
          </div>
          <div class="form-field">
            <span>Valor pagado</span>
            <input v-model.number="form.valorPagado" type="number" min="0" step="0.01" class="field-input" />
          </div>
          <div class="form-field full-width">
            <AppFileUpload
              v-model="facturaFile"
              label="Factura / comprobante"
              accept="image/*,.pdf"
              hint="Sube una foto legible o el PDF. Cloudinary lo guardará al enviar el formulario."
              variant="proof"
            />
          </div>
          <div v-if="facturaPreviewUrl" class="form-field full-width preview-field">
            <span>Vista previa</span>
            <div v-if="facturaFile?.type.startsWith('image/')" class="preview-frame image-frame">
              <img :src="facturaPreviewUrl" alt="Vista previa del comprobante" />
            </div>
            <div v-else-if="facturaFile?.type === 'application/pdf'" class="preview-frame pdf-frame">
              <iframe :src="facturaPreviewUrl" title="Vista previa del comprobante" />
            </div>
            <div v-else class="preview-fallback">
              <p>{{ facturaFile?.name || 'Archivo seleccionado' }}</p>
            </div>
          </div>
          </div>
        </form>

      <template #footer>
        <div class="form-actions">
          <button type="button" class="btn-ghost" :disabled="saving" @click="requestCloseModal">Cancelar</button>
          <button type="submit" form="costos-form" class="btn-primary" :disabled="saving">
            <i v-if="saving" class="fa-solid fa-spinner fa-spin" />
            {{ saving ? 'Guardando...' : (initialData ? 'Actualizar' : 'Guardar') }}
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
        <button type="button" class="btn-primary" @click="discardAndCloseModal">Sí, cerrar</button>
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

  &:disabled {
    opacity: 0.75;
    cursor: not-allowed;
  }
}

.field-note {
  font-size: 0.75rem;
  color: $ink-500;
}

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

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.full-width { grid-column: 1 / -1; }

.provider-field {
  background: rgba($ink-1000, 0.25);
  border: 1px solid rgba($ink-500, 0.08);
  border-radius: 16px;
  padding: $space-4;
}

.provider-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;

  span {
    color: $ink-300;
    font-size: 0.8rem;
    font-weight: 600;
  }
}

.provider-save-btn {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: 0.55rem 0.85rem;
  border: 1px solid rgba($brand-orange, 0.25);
  border-radius: 12px;
  background: rgba($brand-orange, 0.12);
  color: $brand-orange;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.provider-hint {
  margin-top: $space-2;
  font-size: 0.8rem;

  &.success {
    color: #9ae6b4;
  }
}

.provider-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: $space-3;
}

.provider-chip {
  border: 1px solid rgba($ink-500, 0.18);
  background: rgba($ink-700, 0.55);
  color: $ink-200;
  border-radius: 999px;
  padding: 0.45rem 0.75rem;
  font-family: inherit;
  font-size: 0.78rem;
  cursor: pointer;

  &:hover {
    border-color: rgba($brand-orange, 0.3);
    color: $fg-dark;
  }
}

.preview-field {
  margin-top: $space-2;
}

.preview-frame {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba($ink-500, 0.15);
  background: $ink-900;
  
  &.image-frame img {
    width: 100%;
    height: auto;
    display: block;
  }
  
  &.pdf-frame iframe {
    width: 100%;
    height: 300px;
    border: none;
    display: block;
  }
}

.preview-fallback {
  padding: $space-4;
  background: rgba($ink-800, 0.4);
  border-radius: 12px;
  border: 1px solid rgba($ink-500, 0.15);
  text-align: center;
  p { margin: 0; color: $ink-300; }
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: $space-3;
  margin-top: $space-2;

  @media (max-width: 640px) {
    flex-direction: column-reverse;
  }
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
  transition: all 0.2s;
  font-size: 0.9rem;
  &:hover { background: color.adjust($brand-orange, $lightness: -8%); }
}

.btn-ghost {
  padding: 0.6rem 1.25rem;
  background: transparent;
  border: 1px solid rgba($ink-500, 0.3);
  border-radius: 10px;
  color: $ink-300;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  &:hover { background: rgba($ink-500, 0.15); color: $fg-dark; }
}
</style>
