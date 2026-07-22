import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Contacto, CuentaBancaria } from '@/services/gestiones_compra.api'

const STORAGE_KEY = 'cb_gestion_compra_draft'

export interface GestionCompraFormData {
  // Step 1
  contactoId: string
  contacto: Contacto | null
  // Step 2 (admin only)
  asesorId: string
  asesorNombre: string
  // Step 3
  valorTotal: number | null
  // Step 4
  valorReserva: number | null
  cuentaBancariaId: string
  cuentaBancaria: CuentaBancaria | null
  reservaConfirmada: boolean
  // Step 5
  costoVenta: number | null
  // Step 6
  valorComision: number | null
  feeConfigId: string
  feeConfigNombre: string
  // Step 7
  serviceType: 'logistica' | 'compra_total' | ''
  paginaCompra: string
  // Step 8
  fechaEntregaTentativa: string
  // Step 9
  imagenCompraUrl: string
  imagenCompraFile: File | null
  imagenCompraPreview: string
  // Support state
  comprobanteEstado: 'comprobante' | 'verificado' | 'sin_soporte'
  // General
  notas: string
}

export type StepKey =
  | 'cliente'
  | 'asesor'
  | 'valorTotal'
  | 'reserva'
  | 'costoVenta'
  | 'comision'
  | 'paginaCompra'
  | 'fechaEntrega'
  | 'imagen'
  | 'resumen'

const STEP_LABELS: Record<StepKey, string> = {
  cliente: 'Seleccionar cliente',
  asesor: 'Seleccionar asesor',
  valorTotal: 'Valor total',
  reserva: 'Valor de reserva',
  costoVenta: 'Costo de venta',
  comision: 'Comisión',
  paginaCompra: 'Página de compra',
  fechaEntrega: 'Fecha de entrega',
  imagen: 'Imagen de la compra',
  resumen: 'Resumen final',
}

// Full ordered flow. Admin sees all steps; asesor skips the "asesor" step
// (they are always the asesor of their own sale).
const FULL_FLOW: StepKey[] = [
  'cliente',
  'asesor',
  'valorTotal',
  'reserva',
  'costoVenta',
  'comision',
  'paginaCompra',
  'fechaEntrega',
  'imagen',
  'resumen',
]

const emptyForm = (): GestionCompraFormData => ({
  contactoId: '',
  contacto: null,
  asesorId: '',
  asesorNombre: '',
  valorTotal: null,
  valorReserva: null,
  cuentaBancariaId: '',
  cuentaBancaria: null,
  reservaConfirmada: false,
  costoVenta: null,
  valorComision: null,
  feeConfigId: '',
  feeConfigNombre: '',
  serviceType: '',
  paginaCompra: '',
  fechaEntregaTentativa: '',
  imagenCompraUrl: '',
  imagenCompraFile: null,
  imagenCompraPreview: '',
  comprobanteEstado: 'comprobante',
  notas: '',
})

export const useGestionCompraFormStore = defineStore('gestionCompraForm', () => {
  const currentStep = ref(1)
  const formData = ref<GestionCompraFormData>(emptyForm())
  const isAdminMode = ref(false) // true = admin creating (asesor step visible)
  const isSubmitting = ref(false)
  const errors = ref<Record<string, string>>({})

  // Declarative step list — the single source of truth. This removes the old
  // fragile index-shifting (realStepIndex) that could render an empty step body.
  const steps = computed<StepKey[]>(() =>
    isAdminMode.value ? FULL_FLOW : FULL_FLOW.filter((k) => k !== 'asesor')
  )

  const totalSteps = computed(() => steps.value.length)

  const currentStepKey = computed<StepKey>(
    () => steps.value[currentStep.value - 1] ?? 'cliente'
  )

  const currentStepLabel = computed(() => STEP_LABELS[currentStepKey.value] ?? '')

  const progressPercent = computed(() =>
    Math.round((currentStep.value / totalSteps.value) * 100)
  )

  // --- Draft persistence (localStorage) ---------------------------------
  // Everything the asesor fills is mirrored to localStorage so a reload does
  // not wipe progress. Non-serializable fields (File / blob preview) are
  // stripped. "hasProgress" powers the leave/reload warnings.
  const hasProgress = computed(() => {
    const fd = formData.value
    return !!(fd.serviceType || fd.contactoId || fd.valorTotal != null || fd.cuentaBancariaId)
  })

  function persist() {
    try {
      if (!hasProgress.value) {
        localStorage.removeItem(STORAGE_KEY)
        return
      }
      const fd = { ...formData.value, imagenCompraFile: null, imagenCompraPreview: '' }
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ formData: fd, currentStep: currentStep.value, isAdminMode: isAdminMode.value, savedAt: Date.now() })
      )
    } catch {
      /* storage unavailable — ignore */
    }
  }

  function clearDraft() {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }

  function loadDraft(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return false
      const parsed = JSON.parse(raw)
      if (!parsed?.formData) return false
      const fd = parsed.formData
      const meaningful = fd.serviceType || fd.contactoId || fd.valorTotal != null || fd.cuentaBancariaId
      if (!meaningful) return false
      formData.value = { ...emptyForm(), ...fd, imagenCompraFile: null, imagenCompraPreview: '' }
      currentStep.value = parsed.currentStep ?? 1
      isAdminMode.value = !!parsed.isAdminMode
      return true
    } catch {
      return false
    }
  }

  // Persist on every change (deep) so nothing is lost mid-flow.
  watch([formData, currentStep, isAdminMode], persist, { deep: true })

  function init(options: { adminMode?: boolean; defaultAsesorId?: string; defaultAsesorNombre?: string; defaultServiceType?: 'logistica' | 'compra_total' | '' }) {
    formData.value = emptyForm()
    currentStep.value = 1
    errors.value = {}
    isAdminMode.value = options.adminMode ?? false
    formData.value.serviceType = options.defaultServiceType ?? ''
    if (!options.adminMode) {
      formData.value.asesorId = options.defaultAsesorId ?? ''
      formData.value.asesorNombre = options.defaultAsesorNombre ?? ''
    }
    clearDraft()
  }

  function nextStep() {
    if (currentStep.value < totalSteps.value) {
      currentStep.value++
    }
  }

  function prevStep() {
    if (currentStep.value > 1) {
      currentStep.value--
    }
  }

  function goToStep(step: number) {
    if (step >= 1 && step <= totalSteps.value) {
      currentStep.value = step
    }
  }

  function setContacto(contacto: Contacto) {
    formData.value.contactoId = contacto._id
    formData.value.contacto = contacto
  }

  function setAsesor(id: string, nombre: string) {
    formData.value.asesorId = id
    formData.value.asesorNombre = nombre
  }

  function setCuentaBancaria(cuenta: CuentaBancaria) {
    formData.value.cuentaBancariaId = cuenta._id
    formData.value.cuentaBancaria = cuenta
  }

  function setComision(valorComision: number, feeConfigId: string, feeConfigNombre: string) {
    formData.value.valorComision = valorComision
    formData.value.feeConfigId = feeConfigId
    formData.value.feeConfigNombre = feeConfigNombre
  }

  function setError(field: string, message: string) {
    errors.value[field] = message
  }

  function clearError(field: string) {
    delete errors.value[field]
  }

  function reset() {
    formData.value = emptyForm()
    currentStep.value = 1
    errors.value = {}
    clearDraft()
  }

  return {
    currentStep,
    formData,
    isAdminMode,
    steps,
    totalSteps,
    currentStepKey,
    currentStepLabel,
    progressPercent,
    isSubmitting,
    errors,
    hasProgress,
    init,
    loadDraft,
    clearDraft,
    nextStep,
    prevStep,
    goToStep,
    setContacto,
    setAsesor,
    setCuentaBancaria,
    setComision,
    setError,
    clearError,
    reset,
    STEP_LABELS,
  }
})
