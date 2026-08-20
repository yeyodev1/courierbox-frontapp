import { computed, ref } from 'vue'
import { asesoriaApi, type FeeConfig, type FeeRuleType, type FeeTier } from '@/services/asesoria.api'
import { useToastStore } from '@/stores/toast.store'

export interface WizardForm {
  name: string
  ruleType: FeeRuleType
  fixedAmount: number
  percentage: number
  minAmount: number
  maxAmount: number
  tiers: FeeTier[]
}

export function emptyWizardForm(): WizardForm {
  return {
    name: 'Tarifa por defecto',
    ruleType: 'fixed_plus_percentage',
    fixedAmount: 20,
    percentage: 10,
    minAmount: 20,
    maxAmount: 0,
    tiers: [],
  }
}

export const RULE_TYPE_OPTIONS = [
  { value: 'fixed', label: 'Monto fijo' },
  { value: 'percentage', label: 'Porcentaje del total' },
  { value: 'fixed_plus_percentage', label: 'Fijo + porcentaje' },
  { value: 'tiered', label: 'Por rangos (tiers)' },
]

/** Rules that need a flat amount, and those that need a percentage. */
export const RULES_WITH_FIXED: FeeRuleType[] = ['fixed', 'fixed_plus_percentage', 'tiered']
export const RULES_WITH_PERCENTAGE: FeeRuleType[] = ['percentage', 'fixed_plus_percentage', 'tiered']

export function describeConfig(config: FeeConfig) {
  switch (config.ruleType) {
    case 'fixed':
      return `$${config.fixedAmount} fijo`
    case 'percentage':
      return `${config.percentage}% del total`
    case 'fixed_plus_percentage':
      return `$${config.fixedAmount} + ${config.percentage}%`
    case 'tiered':
      return `Por rangos (${config.tiers?.length || 0})`
    default:
      return config.ruleType
  }
}

/** The management fee rules an asesor's calculator runs on. */
export function useFeeConfig() {
  const toastStore = useToastStore()

  const configs = ref<FeeConfig[]>([])
  const loading = ref(false)
  const saving = ref(false)

  const hasConfig = computed(() => configs.value.length > 0)

  function fail(error: unknown, fallback: string) {
    const e = error as { data?: { detail?: string }; message?: string }
    toastStore.showNotification(e?.data?.detail || e?.message || fallback, 'error')
  }

  async function load() {
    loading.value = true
    try {
      const data = await asesoriaApi.getFeeConfigs()
      configs.value = data.configs
    } catch (error) {
      fail(error, 'Error al cargar configuraciones')
    } finally {
      loading.value = false
    }
  }

  async function create(form: WizardForm): Promise<boolean> {
    saving.value = true
    try {
      await asesoriaApi.createFeeConfig({ ...form, currency: 'USD', isDefault: false, enabled: true })
      toastStore.showNotification('Tarifa creada correctamente', 'success')
      await load()
      return true
    } catch (error) {
      fail(error, 'Error al guardar')
      return false
    } finally {
      saving.value = false
    }
  }

  async function setDefault(id: string) {
    try {
      await asesoriaApi.setDefaultFeeConfig(id)
      await load()
    } catch (error) {
      fail(error, 'Error al cambiar tarifa por defecto')
    }
  }

  async function remove(id: string) {
    try {
      await asesoriaApi.deleteFeeConfig(id)
      await load()
    } catch (error) {
      fail(error, 'Error al eliminar')
    }
  }

  return { configs, loading, saving, hasConfig, load, create, setDefault, remove }
}
