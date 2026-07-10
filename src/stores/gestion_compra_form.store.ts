import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Contacto, CuentaBancaria } from '@/services/gestiones_compra.api'

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

const STEP_LABELS: Record<number, string> = {
  1: 'Seleccionar cliente',
  2: 'Seleccionar asesor',
  3: 'Valor total',
  4: 'Valor de reserva',
  5: 'Costo de venta',
  6: 'Comisión',
  7: 'Página de compra',
  8: 'Fecha de entrega',
  9: 'Imagen de la compra',
  10: 'Resumen final',
}

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
  const isAdminMode = ref(false) // true = admin creating (step 2 visible)
  const totalSteps = computed(() => (isAdminMode.value ? 10 : 9))
  const isSubmitting = ref(false)
  const errors = ref<Record<string, string>>({})

  const currentStepLabel = computed(() => {
    if (!isAdminMode.value && currentStep.value >= 2) {
      // Shift labels: skip step 2 for asesor
      return STEP_LABELS[currentStep.value + 1] ?? ''
    }
    return STEP_LABELS[currentStep.value] ?? ''
  })

  const progressPercent = computed(() =>
    Math.round((currentStep.value / totalSteps.value) * 100)
  )

  // Resolve the "real" step index for both modes
  const realStepIndex = computed(() => {
    // In asesor mode, step numbers are shifted: UI step 2 = data step 3, etc.
    if (!isAdminMode.value && currentStep.value >= 2) {
      return currentStep.value + 1
    }
    return currentStep.value
  })

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
  }

  return {
    currentStep,
    formData,
    isAdminMode,
    totalSteps,
    currentStepLabel,
    progressPercent,
    realStepIndex,
    isSubmitting,
    errors,
    init,
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
