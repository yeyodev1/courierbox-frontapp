import { computed, ref, watch } from 'vue'
import { CATEGORIAS_POR_TIPO, type Gasto, type GastoTipo } from '@/services/costos.api'
import { toDateInputValue } from '@/utils/format'

export const OTRA_CATEGORIA = 'Otro (especificar)'

/**
 * Cost Centre files two shapes of record and this form serves both.
 *
 * A `gasto` is money out: an amount, and nothing to say about weight. A
 * `recepcion` is cargo: the pounds that came in and what each one cost, with the
 * total derived from them so the operator cannot type a figure that contradicts
 * the rate. Before the split one form did both, with a checkbox deciding which —
 * which is how pounds ended up on expenses and expenses ended up in the pounds.
 */
export type CostoModo = 'gasto' | 'recepcion'

export interface CostoForm {
  tipo: GastoTipo
  categoria: string
  monto: number
  descripcion: string
  fecha: string
  proveedor: string
  referencia: string
  numeroFactura: string
  fechaFactura: string
  libras: number
  valorPorLibra: number
  valorTotal: number
  valorPagado: number
  numeroPaquetes: number
  categoriaPersonalizada: string
}

const today = () => new Date().toISOString().slice(0, 10)

export function emptyCostoForm(tipo: GastoTipo = 'operacional'): CostoForm {
  return {
    tipo,
    categoria: '',
    monto: 0,
    descripcion: '',
    fecha: today(),
    proveedor: '',
    referencia: '',
    numeroFactura: '',
    fechaFactura: today(),
    libras: 0,
    valorPorLibra: 0,
    valorTotal: 0,
    valorPagado: 0,
    numeroPaquetes: 0,
    categoriaPersonalizada: '',
  }
}

const toDateInput = (value?: string | Date | null) => toDateInputValue(value) || today()

export function gastoToForm(gasto: Gasto): CostoForm {
  const conocidas = CATEGORIAS_POR_TIPO[gasto.tipo] || []
  const esConocida = conocidas.includes(gasto.categoria)
  return {
    tipo: gasto.tipo,
    categoria: esConocida ? gasto.categoria : OTRA_CATEGORIA,
    monto: Number(gasto.monto || 0),
    descripcion: gasto.descripcion || '',
    fecha: toDateInput(gasto.fecha),
    proveedor: gasto.proveedor || '',
    referencia: gasto.referencia || '',
    numeroFactura: gasto.numeroFactura || '',
    fechaFactura: toDateInput(gasto.fechaFactura),
    libras: Number(gasto.libras || 0),
    valorPorLibra: Number(gasto.valorPorLibra || 0),
    valorTotal: Number(gasto.valorTotal || gasto.monto || 0),
    valorPagado: Number(gasto.valorPagado || 0),
    numeroPaquetes: Number(gasto.numeroPaquetes || 0),
    categoriaPersonalizada: esConocida ? '' : gasto.categoria,
  }
}

export function useCostoForm(modo: CostoModo = 'gasto', tipoPorDefecto: GastoTipo = 'operacional') {
  const esRecepcion = modo === 'recepcion'

  const form = ref<CostoForm>(emptyCostoForm(tipoPorDefecto))
  const facturaFile = ref<File | null>(null)

  const initialSnapshot = ref('')
  const currentSnapshot = computed(() => JSON.stringify(form.value))
  const hasUnsavedChanges = computed(
    () => currentSnapshot.value !== initialSnapshot.value || !!facturaFile.value,
  )

  const categoriasDisponibles = computed(() => {
    const cats = CATEGORIAS_POR_TIPO[form.value.tipo] || []
    return [...cats, OTRA_CATEGORIA]
  })

  const categoriaFinal = computed(() =>
    form.value.categoria === OTRA_CATEGORIA ? form.value.categoriaPersonalizada : form.value.categoria,
  )

  function syncSnapshot() {
    initialSnapshot.value = currentSnapshot.value
  }

  /** On a reception the total follows the rate, never the other way round. */
  function syncCalculatedWeightTotal() {
    if (!esRecepcion) return
    const total = Number(
      (Number(form.value.libras || 0) * Number(form.value.valorPorLibra || 0)).toFixed(2),
    )
    form.value.valorTotal = total
    form.value.monto = total
  }

  if (esRecepcion) {
    watch([() => form.value.libras, () => form.value.valorPorLibra], syncCalculatedWeightTotal)
  }

  function load(gasto: Gasto | null) {
    form.value = gasto ? gastoToForm(gasto) : emptyCostoForm(tipoPorDefecto)
    if (!gasto) form.value.tipo = tipoPorDefecto
    if (esRecepcion) syncCalculatedWeightTotal()
    facturaFile.value = null
    syncSnapshot()
  }

  /** Returns the error to show, or null when the form is ready to submit. */
  function validate(): string | null {
    if (!categoriaFinal.value || !form.value.descripcion) {
      return 'Completa todos los campos requeridos'
    }
    if (esRecepcion) {
      if (Number(form.value.libras || 0) <= 0 || Number(form.value.valorPorLibra || 0) <= 0) {
        return 'Ingresa las libras y el valor por libra para calcular el total'
      }
      return null
    }
    if (form.value.monto <= 0) return 'El monto debe ser mayor a cero'
    return null
  }

  function buildPayload() {
    const peso = esRecepcion
      ? {
          libras: form.value.libras,
          valorPorLibra: form.value.valorPorLibra,
          valorTotal: form.value.valorTotal,
          numeroPaquetes: form.value.numeroPaquetes,
        }
      : { libras: 0, valorPorLibra: 0, valorTotal: form.value.monto, numeroPaquetes: 0 }

    return {
      tipo: form.value.tipo,
      categoria: categoriaFinal.value,
      monto: form.value.monto,
      descripcion: form.value.descripcion,
      fecha: form.value.fecha,
      proveedor: form.value.proveedor,
      referencia: form.value.referencia,
      numeroFactura: form.value.numeroFactura,
      fechaFactura: form.value.fechaFactura,
      ...peso,
      valorPagado: form.value.valorPagado,
    }
  }

  return {
    form,
    facturaFile,
    hasUnsavedChanges,
    categoriasDisponibles,
    load,
    validate,
    buildPayload,
    syncSnapshot,
  }
}
