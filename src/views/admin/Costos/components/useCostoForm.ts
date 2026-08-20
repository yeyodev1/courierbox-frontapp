import { computed, ref, watch } from 'vue'
import { CATEGORIAS_POR_TIPO, type Gasto } from '@/services/costos.api'

export const OTRA_CATEGORIA = 'Otro (especificar)'

export interface CostoForm {
  tipo: string
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
  categoriaPersonalizada: string
}

const today = () => new Date().toISOString().slice(0, 10)

export function emptyCostoForm(): CostoForm {
  return {
    tipo: 'operacional',
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
    categoriaPersonalizada: '',
  }
}

const toDateInput = (value?: string | Date | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : today()

/** An expense is weight-based when it carries pounds, a rate, or a total apart from the amount. */
export function isWeightExpense(gasto: Gasto) {
  return (
    Number(gasto.libras || 0) > 0 ||
    Number(gasto.valorPorLibra || 0) > 0 ||
    Number(gasto.valorTotal || 0) !== Number(gasto.monto || 0)
  )
}

export function gastoToForm(gasto: Gasto): CostoForm {
  const conocidas = CATEGORIAS_POR_TIPO[gasto.tipo as keyof typeof CATEGORIAS_POR_TIPO] || []
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
    categoriaPersonalizada: esConocida ? '' : gasto.categoria,
  }
}

/**
 * Expense form state. In weight mode the total is derived from pounds × rate and
 * drives the amount, so the operator cannot type a figure that contradicts it.
 */
export function useCostoForm() {
  const form = ref<CostoForm>(emptyCostoForm())
  const porLibras = ref(false)
  const facturaFile = ref<File | null>(null)

  const initialSnapshot = ref('')
  const currentSnapshot = computed(() => JSON.stringify(form.value))
  const hasUnsavedChanges = computed(
    () => currentSnapshot.value !== initialSnapshot.value || !!facturaFile.value,
  )

  const categoriasDisponibles = computed(() => {
    if (!form.value.tipo) return []
    const cats = CATEGORIAS_POR_TIPO[form.value.tipo as keyof typeof CATEGORIAS_POR_TIPO] || []
    return [...cats, OTRA_CATEGORIA]
  })

  const categoriaFinal = computed(() =>
    form.value.categoria === OTRA_CATEGORIA ? form.value.categoriaPersonalizada : form.value.categoria,
  )

  function syncSnapshot() {
    initialSnapshot.value = currentSnapshot.value
  }

  function syncCalculatedWeightTotal() {
    if (!porLibras.value) return
    const total = Number((Number(form.value.libras || 0) * Number(form.value.valorPorLibra || 0)).toFixed(2))
    form.value.valorTotal = total
    if (total > 0) form.value.monto = total
  }

  /** Turning weight mode off returns the total to whatever amount was typed. */
  function syncWeightFields(enabled: boolean) {
    if (!enabled) {
      form.value.libras = 0
      form.value.valorPorLibra = 0
      form.value.valorTotal = form.value.monto
      return
    }
    syncCalculatedWeightTotal()
  }

  watch([porLibras, () => form.value.libras, () => form.value.valorPorLibra], syncCalculatedWeightTotal)

  function load(gasto: Gasto | null) {
    if (gasto) {
      form.value = gastoToForm(gasto)
      porLibras.value = isWeightExpense(gasto)
      if (porLibras.value) syncCalculatedWeightTotal()
    } else {
      form.value = emptyCostoForm()
      porLibras.value = false
    }
    facturaFile.value = null
    syncSnapshot()
  }

  /** Returns the error to show, or null when the form is ready to submit. */
  function validate(): string | null {
    if (!categoriaFinal.value || !form.value.descripcion || form.value.monto <= 0) {
      return 'Completa todos los campos requeridos'
    }
    if (porLibras.value && (Number(form.value.libras || 0) <= 0 || Number(form.value.valorPorLibra || 0) <= 0)) {
      return 'Ingresa libras y valor por libra para calcular el total'
    }
    return null
  }

  function buildPayload() {
    const peso = porLibras.value
      ? {
          libras: form.value.libras,
          valorPorLibra: form.value.valorPorLibra,
          valorTotal: form.value.valorTotal || form.value.monto,
        }
      : { libras: 0, valorPorLibra: 0, valorTotal: form.value.monto }

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
    porLibras,
    facturaFile,
    hasUnsavedChanges,
    categoriasDisponibles,
    syncWeightFields,
    load,
    validate,
    buildPayload,
  }
}
