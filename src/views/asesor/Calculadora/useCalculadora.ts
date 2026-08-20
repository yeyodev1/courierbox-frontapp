import { computed, ref, watch } from 'vue'
import { asesoriaApi, type FeeCalculationResult, type FeeConfig } from '@/services/asesoria.api'
import { useToastStore } from '@/stores/toast.store'

/** Quotes the management fee for a purchase using the configured tariff. */
export function useCalculadora() {
  const toastStore = useToastStore()

  const configs = ref<FeeConfig[]>([])
  const configId = ref('')
  const productValue = ref<number | null>(null)
  const shippingValue = ref<number | null>(0)
  const result = ref<FeeCalculationResult | null>(null)
  const loading = ref(false)

  const defaultConfig = computed(() => configs.value.find((c) => c.isDefault) || configs.value[0] || null)

  async function loadConfigs() {
    try {
      const data = await asesoriaApi.getFeeConfigs()
      configs.value = data.configs
      if (defaultConfig.value) configId.value = defaultConfig.value._id
      if (!data.configs.length) {
        toastStore.showNotification(
          'Aún no hay una tarifa configurada. Contacta al administrador para activar la calculadora.',
          'warning',
        )
      }
    } catch {
      toastStore.showNotification('No se pudieron cargar las configuraciones de fee', 'error')
    }
  }

  async function calculate() {
    if (productValue.value == null || productValue.value < 0) {
      toastStore.showNotification('Ingresa un valor de producto válido', 'error')
      return
    }
    loading.value = true
    try {
      const data = await asesoriaApi.calculateFee({
        productValue: productValue.value,
        shippingValue: shippingValue.value || 0,
        configId: configId.value || undefined,
      })
      result.value = data.result
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string }; message?: string }
      toastStore.showNotification(err?.data?.detail || err?.message || 'Error al calcular el fee', 'error')
    } finally {
      loading.value = false
    }
  }

  /** Query params that pre-fill the sale wizard with this quote. */
  const orderQuery = computed(() => {
    if (!result.value) return null
    const shipping = shippingValue.value || 0
    return {
      productValue: String(result.value.baseAmount - shipping),
      shippingValue: String(shipping),
      feeAmount: String(result.value.feeAmount),
      totalAmount: String(result.value.totalAmount),
      configId: configId.value,
    }
  })

  watch([productValue, shippingValue, configId], calculate, { deep: true })

  return { configs, configId, productValue, shippingValue, result, loading, orderQuery, loadConfigs }
}
