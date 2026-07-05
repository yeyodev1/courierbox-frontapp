<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { asesoriaApi } from '@/services/asesoria.api'
import type { FeeCalculationResult, FeeConfig } from '@/services/asesoria.api'
import { useToastStore } from '@/stores/toast.store'

const router = useRouter()
const toastStore = useToastStore()

const productValue = ref<number | null>(null)
const shippingValue = ref<number | null>(0)
const configId = ref<string>('')
const configs = ref<FeeConfig[]>([])
const result = ref<FeeCalculationResult | null>(null)
const loading = ref(false)

const defaultConfig = computed(() => configs.value.find((c) => c.isDefault) || configs.value[0] || null)

async function loadConfigs() {
  try {
    const data = await asesoriaApi.getFeeConfigs()
    configs.value = data.configs
    if (defaultConfig.value) {
      configId.value = defaultConfig.value._id
    }
    if (!data.configs.length) {
      toastStore.showNotification('Aún no hay una tarifa configurada. Contacta al administrador para activar la calculadora.', 'warning')
    }
  } catch (e) {
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
  } catch (e: any) {
    toastStore.showNotification(e.data?.detail || e.message || 'Error al calcular el fee', 'error')
  } finally {
    loading.value = false
  }
}

function createOrder() {
  if (!result.value) return
  router.push({
    name: 'AsesorNewOrder',
    query: {
      productValue: String(result.value.baseAmount - (shippingValue.value || 0)),
      shippingValue: String(shippingValue.value || 0),
      feeAmount: String(result.value.feeAmount),
      totalAmount: String(result.value.totalAmount),
      configId: configId.value,
    },
  })
}

onMounted(loadConfigs)
watch([productValue, shippingValue, configId], calculate, { deep: true })
</script>

<template>
  <div class="calculator-page">
    <section class="hero-card">
      <div class="hero-text">
        <h1>Calculadora de gestión</h1>
        <p>
          Ingresa el valor del producto y el envío. El sistema calcula automáticamente el fee de
          gestión según la tarifa configurada por administración.
        </p>
      </div>
      <div class="hero-icon">
        <i class="fa-solid fa-calculator" />
      </div>
    </section>

    <div class="calculator-grid">
      <section class="card inputs-card">
        <h3 class="card-title">Datos de la compra</h3>

        <label class="field">
          <span class="field-label">Tarifa aplicable</span>
          <select v-model="configId" class="field-input">
            <option value="" disabled>Selecciona una tarifa</option>
            <option v-for="c in configs" :key="c._id" :value="c._id">
              {{ c.name }} {{ c.isDefault ? '(por defecto)' : '' }}
            </option>
          </select>
        </label>

        <label class="field">
          <span class="field-label">Valor del producto (USD)</span>
          <input
            v-model.number="productValue"
            type="number"
            min="0"
            step="0.01"
            class="field-input"
            placeholder="Ej: 20.00"
          />
        </label>

        <label class="field">
          <span class="field-label">Valor del envío USA (USD)</span>
          <input
            v-model.number="shippingValue"
            type="number"
            min="0"
            step="0.01"
            class="field-input"
            placeholder="Ej: 0.00"
          />
        </label>

        <button class="btn-primary" :disabled="loading || !result" @click="createOrder">
          <span v-if="loading">Calculando...</span>
          <span v-else>Crear orden con este total</span>
        </button>
      </section>

      <section class="card result-card" :class="{ 'has-result': result }">
        <h3 class="card-title">Resumen</h3>

        <div v-if="result" class="result-body">
          <div class="result-row">
            <span>Valor producto + envío</span>
            <strong>${{ result.baseAmount.toFixed(2) }}</strong>
          </div>
          <div class="result-row highlight">
            <span>Fee de gestión</span>
            <strong>${{ result.feeAmount.toFixed(2) }}</strong>
          </div>
          <div class="result-row breakdown">
            <span>{{ result.breakdown }}</span>
          </div>
          <div class="result-divider" />
          <div class="result-row total">
            <span>Total a pagar</span>
            <strong>${{ result.totalAmount.toFixed(2) }}</strong>
          </div>
          <div class="result-config">
            Tarifa: <strong>{{ result.configName }}</strong> ({{ result.ruleType }})
          </div>
        </div>

        <div v-else class="result-placeholder">
          <i class="fa-solid fa-receipt" />
          <p>Ingresa los valores para ver el cálculo</p>
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.calculator-page {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.hero-card {
  background: linear-gradient(135deg, rgba($brand-orange, 0.12), rgba($brand-orange, 0.02));
  border: 1px solid rgba($brand-orange, 0.15);
  border-radius: 20px;
  padding: $space-8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-6;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    padding: $space-5;
  }

  .hero-text {
    h1 {
      font-size: 1.6rem;
      font-weight: 700;
      margin: 0 0 $space-2;
    }
    p {
      color: $ink-300;
      margin: 0;
      max-width: 540px;
      line-height: 1.5;
    }
  }

  .hero-icon {
    width: 64px;
    height: 64px;
    border-radius: 18px;
    background: rgba($brand-orange, 0.15);
    color: $brand-orange;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    flex-shrink: 0;
  }
}

.calculator-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-6;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 20px;
  padding: $space-6;
}

.card-title {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0 0 $space-5;
  color: $fg-dark;
}

.field {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  margin-bottom: $space-4;

  .field-label {
    font-size: 0.85rem;
    font-weight: 500;
    color: $ink-300;
  }

  .field-input {
    background: $ink-1000;
    border: 1px solid rgba($ink-500, 0.2);
    border-radius: 12px;
    padding: $space-3 $space-4;
    color: $fg-dark;
    font-size: 1rem;
    font-family: inherit;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus {
      border-color: $brand-orange;
      box-shadow: 0 0 0 3px rgba($brand-orange, 0.12);
    }

    &::placeholder {
      color: $ink-500;
    }
  }
}

.alert {
  display: flex;
  align-items: flex-start;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-radius: 12px;
  font-size: 0.9rem;
  margin-bottom: $space-4;

  i {
    margin-top: 2px;
  }

  &.warning {
    background: rgba($signal-amber, 0.1);
    color: $signal-amber;
    border: 1px solid rgba($signal-amber, 0.15);
  }

  &.error {
    background: rgba($signal-red, 0.1);
    color: #ff8a8f;
    border: 1px solid rgba($signal-red, 0.15);
  }
}

.btn-primary {
  width: 100%;
  padding: 0.9rem 1.5rem;
  background: $brand-orange;
  border: none;
  border-radius: 12px;
  color: $ink-1000;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;

  &:hover:not(:disabled) {
    background: color.adjust($brand-orange, $lightness: 6%);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.result-card {
  &.has-result {
    border-color: rgba($brand-orange, 0.2);
  }
}

.result-body {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
  color: $ink-300;

  strong {
    color: $fg-dark;
    font-weight: 600;
  }

  &.highlight {
    background: rgba($brand-orange, 0.08);
    padding: $space-3 $space-4;
    border-radius: 12px;
    color: $brand-orange;

    strong {
      color: $brand-orange;
      font-size: 1.1rem;
    }
  }

  &.breakdown {
    font-size: 0.8rem;
    color: $ink-400;
    font-style: italic;
  }

  &.total {
    font-size: 1.1rem;
    font-weight: 700;
    color: $fg-dark;

    strong {
      font-size: 1.4rem;
      color: $brand-orange;
    }
  }
}

.result-divider {
  height: 1px;
  background: rgba($ink-500, 0.15);
  margin: $space-2 0;
}

.result-config {
  font-size: 0.8rem;
  color: $ink-400;
  text-align: center;
  margin-top: $space-2;
}

.result-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  padding: $space-10 0;
  color: $ink-500;

  i {
    font-size: 2.5rem;
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 0.95rem;
  }
}
</style>
