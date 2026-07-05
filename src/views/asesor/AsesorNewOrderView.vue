<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { asesoriaApi } from '@/services/asesoria.api'
import AppSelect from '@/components/ui/AppSelect.vue'
import type { FeeConfig, FeeCalculationResult } from '@/services/asesoria.api'
import { useToastStore } from '@/stores/toast.store'

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()

const storeOptions = ['Amazon', 'eBay', 'Walmart', 'Target', 'Otra']

const form = ref({
  clientName: '',
  clientPhone: '',
  clientEmail: '',
  storeName: 'Amazon',
  productUrl: '',
  description: '',
  productValue: 0,
  shippingValue: 0,
  weightLb: 0,
  trackingUsa: '',
  notes: '',
  serviceType: 'logistica' as import('@/services/asesoria.api').ServiceType,
})

const configs = ref<FeeConfig[]>([])
const configId = ref<string>('')
const feePreview = ref<FeeCalculationResult | null>(null)

const manualMode = ref(false)
const manualFeeAmount = ref<number | null>(null)
const manualTotalAmount = ref<number | null>(null)

const calculating = ref(false)
const saving = ref(false)
const error = ref('')

const hasConfig = computed(() => configs.value.length > 0)
const defaultConfig = computed(() => configs.value.find((c) => c.isDefault) || configs.value[0] || null)

const configOptions = computed(() =>
  configs.value.map((c) => ({
    value: c._id,
    label: `${c.name}${c.isDefault ? ' (por defecto)' : ''}`,
  }))
)

const baseAmount = computed(() => form.value.productValue + form.value.shippingValue)

const preview = computed<FeeCalculationResult | null>(() => {
  if (manualMode.value) {
    const fee = typeof manualFeeAmount.value === 'number' ? manualFeeAmount.value : 0
    const total = typeof manualTotalAmount.value === 'number' ? manualTotalAmount.value : baseAmount.value + fee
    return {
      baseAmount: baseAmount.value,
      feeAmount: fee,
      totalAmount: total,
      configName: 'Manual',
      ruleType: 'manual',
      currency: 'USD',
      breakdown: 'Fee ingresado manualmente por el asesor.',
    }
  }
  return feePreview.value
})

async function loadConfigs() {
  try {
    const data = await asesoriaApi.getFeeConfigs()
    configs.value = data.configs
    if (defaultConfig.value) {
      configId.value = defaultConfig.value._id
    }
    if (!hasConfig.value) {
      manualMode.value = true
    }
  } catch (e) {
    manualMode.value = true
    toastStore.showNotification('No se pudieron cargar las configuraciones de fee', 'error')
  }

  if (!configs.value.length) {
    toastStore.showNotification('Aún no hay una tarifa configurada. Se activó el modo manual.', 'warning')
  }
}

async function calculate() {
  if (manualMode.value || form.value.productValue < 0) return
  calculating.value = true
  try {
    const data = await asesoriaApi.calculateFee({
      productValue: form.value.productValue,
      shippingValue: form.value.shippingValue,
      configId: configId.value || undefined,
    })
    feePreview.value = data.result
  } catch (e: any) {
    toastStore.showNotification(e.data?.detail || e.message || 'Error al calcular el fee', 'error')
  } finally {
    calculating.value = false
  }
}

function enableManualMode() {
  manualMode.value = true
  manualFeeAmount.value = feePreview.value?.feeAmount ?? 0
  manualTotalAmount.value = feePreview.value?.totalAmount ?? baseAmount.value
}

function disableManualMode() {
  manualMode.value = false
  calculate()
}

async function submit() {
  if (!form.value.clientName || !form.value.description || form.value.productValue <= 0) {
    toastStore.showNotification('Completa los campos obligatorios: cliente, descripción y valor del producto', 'error')
    return
  }

  if (manualMode.value) {
    if (typeof manualFeeAmount.value !== 'number' || typeof manualTotalAmount.value !== 'number') {
      toastStore.showNotification('Ingresa el fee y el total manualmente', 'error')
      return
    }
  }

  saving.value = true
  error.value = ''
  try {
    const payload: import('@/services/asesoria.api').CreateOrderInput = {
      ...form.value,
      configId: configId.value || undefined,
    }
    if (manualMode.value && typeof manualFeeAmount.value === 'number' && typeof manualTotalAmount.value === 'number') {
      payload.manualFeeAmount = manualFeeAmount.value
      payload.manualTotalAmount = manualTotalAmount.value
      payload.configId = undefined
    }
    const data = await asesoriaApi.createOrder(payload)
    router.push({ name: 'AsesorOrderDetail', params: { id: data.order._id } })
  } catch (e: any) {
    toastStore.showNotification(e.data?.detail || e.message || 'Error al crear la orden', 'error')
    saving.value = false
  }
}

watch(
  () => [form.value.productValue, form.value.shippingValue, configId.value],
  () => {
    if (!manualMode.value) calculate()
    else {
      // Si está en modo manual, mantener el fee y recalcular solo el total si no lo editó.
      if (typeof manualFeeAmount.value === 'number' && typeof manualTotalAmount.value === 'number') {
        // no-op: el asesor controla los valores
      }
    }
  },
  { deep: true }
)

onMounted(async () => {
  const q = route.query
  form.value.productValue = Number(q.productValue) || 0
  form.value.shippingValue = Number(q.shippingValue) || 0
  if (q.configId) configId.value = q.configId as string

  await loadConfigs()

  if (q.feeAmount && q.totalAmount) {
    manualMode.value = true
    manualFeeAmount.value = Number(q.feeAmount)
    manualTotalAmount.value = Number(q.totalAmount)
  }

  if (!manualMode.value) await calculate()
})
</script>

<template>
  <div class="new-order-page">
    <button class="btn-back" @click="$router.back()">
      <i class="fa-solid fa-arrow-left" /> Volver
    </button>

    <div class="page-header">
      <h1 class="page-title">Nueva orden de compra</h1>
      <p class="page-subtitle">Completa los datos del cliente y el producto. El fee se calcula automáticamente o puedes ingresarlo manualmente.</p>
    </div>

    <div class="order-grid">
      <div class="order-column">
        <section class="card">
          <h3 class="card-title"><i class="fa-solid fa-user" /> Información del cliente</h3>
          <label class="field">
            <span class="field-label">Nombre del cliente *</span>
            <input v-model="form.clientName" class="field-input" placeholder="Ej: María González" />
          </label>
          <div class="field-row">
            <label class="field">
              <span class="field-label">Teléfono</span>
              <input v-model="form.clientPhone" class="field-input" placeholder="099..." />
            </label>
            <label class="field">
              <span class="field-label">Email</span>
              <input v-model="form.clientEmail" type="email" class="field-input" placeholder="cliente@email.com" />
            </label>
          </div>
        </section>

        <section class="card">
          <h3 class="card-title"><i class="fa-solid fa-box-open" /> Detalle de la compra</h3>
          <div class="field-row">
            <div class="field">
              <AppSelect
                v-model="form.serviceType"
                :options="[
                  { value: 'logistica', label: 'Logística (solo envío)' },
                  { value: 'compra_total', label: 'Compra Total (compramos + enviamos)' },
                ]"
                label="Tipo de servicio *"
              />
            </div>
            <div class="field">
              <AppSelect v-model="form.storeName" :options="storeOptions" label="Tienda *" />
            </div>
          </div>
          <div class="field-row">
            <label class="field">
              <span class="field-label">URL del producto</span>
              <input v-model="form.productUrl" type="url" class="field-input" placeholder="https://..." />
            </label>
          </div>
          <label class="field">
            <span class="field-label">Descripción del producto *</span>
            <textarea
              v-model="form.description"
              class="field-input"
              rows="3"
              placeholder="Marca, modelo, color, talla, cantidad..."
            />
          </label>
          <div class="field-row">
            <label class="field">
              <span class="field-label">Valor producto (USD) *</span>
              <input v-model.number="form.productValue" type="number" min="0" step="0.01" class="field-input" placeholder="0.00" />
            </label>
            <label class="field">
              <span class="field-label">Envío USA (USD)</span>
              <input v-model.number="form.shippingValue" type="number" min="0" step="0.01" class="field-input" placeholder="0.00" />
            </label>
          </div>
          <div class="field-row">
            <label class="field">
              <span class="field-label">Peso estimado (lb)</span>
              <input v-model.number="form.weightLb" type="number" min="0" step="0.1" class="field-input" placeholder="0.0" />
            </label>
            <label class="field">
              <span class="field-label">Tracking USA</span>
              <input v-model="form.trackingUsa" class="field-input" placeholder="1Z999..." />
            </label>
          </div>
          <label class="field">
            <span class="field-label">Notas adicionales</span>
            <textarea v-model="form.notes" class="field-input" rows="2" placeholder="Instrucciones especiales..." />
          </label>
        </section>
      </div>

      <div class="order-column">
        <section class="card">
          <h3 class="card-title"><i class="fa-solid fa-calculator" /> Cálculo del fee</h3>

          <div class="field">
            <AppSelect
              v-model="configId"
              :options="configOptions"
              label="Tarifa aplicable"
              :disabled="!hasConfig || manualMode"
            />
          </div>

          <div class="manual-toggle">
            <button
              type="button"
              :class="['toggle-pill', { active: manualMode }]"
              @click="manualMode ? disableManualMode() : enableManualMode()"
            >
              <span class="toggle-knob" />
              <span class="toggle-label">{{ manualMode ? 'Fee manual activado' : 'Usar calculadora automática' }}</span>
            </button>
          </div>

          <div v-if="manualMode" class="manual-fields">
            <div class="field-row">
              <label class="field">
                <span class="field-label">Fee de gestión (USD)</span>
                <input v-model.number="manualFeeAmount" type="number" min="0" step="0.01" class="field-input" placeholder="0.00" />
              </label>
              <label class="field">
                <span class="field-label">Total a pagar (USD)</span>
                <input v-model.number="manualTotalAmount" type="number" min="0" step="0.01" class="field-input" placeholder="0.00" />
              </label>
            </div>
          </div>

          <div v-else-if="calculating" class="calc-state">
            <i class="fa-solid fa-circle-notch fa-spin" /> Calculando fee…
          </div>
        </section>

        <section class="card summary-card">
          <h3 class="card-title"><i class="fa-solid fa-receipt" /> Resumen de la orden</h3>
          <div class="summary-row">
            <span>Producto + envío</span>
            <strong>${{ baseAmount.toFixed(2) }}</strong>
          </div>
          <div class="summary-row fee">
            <span>Fee de gestión</span>
            <strong>${{ preview?.feeAmount.toFixed(2) || '0.00' }}</strong>
          </div>
          <div v-if="preview?.breakdown" class="breakdown">
            {{ preview.breakdown }}
          </div>
          <div class="summary-divider" />
          <div class="summary-row total">
            <span>Total a pagar</span>
            <strong>${{ preview?.totalAmount.toFixed(2) || '0.00' }}</strong>
          </div>

          <button class="btn-primary" :disabled="saving || calculating" @click="submit">
            <span v-if="saving">Guardando…</span>
            <span v-else>Crear orden</span>
          </button>
        </section>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.new-order-page {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  .page-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
  }

  .page-subtitle {
    color: $ink-400;
    margin: 0;
    font-size: 0.95rem;
    max-width: 640px;
  }
}

.btn-back {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-4;
  background: transparent;
  border: 1px solid rgba($ink-500, 0.2);
  border-radius: 10px;
  color: $ink-300;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.9rem;

  &:hover {
    background: rgba($ink-500, 0.1);
    color: $fg-dark;
  }
}

.order-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: $space-6;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.order-column {
  display: flex;
  flex-direction: column;
  gap: $space-6;
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
  display: flex;
  align-items: center;
  gap: $space-3;

  i {
    color: $brand-orange;
    font-size: 0.9rem;
  }
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
    resize: vertical;
    width: 100%;

    &:focus {
      border-color: $brand-orange;
      box-shadow: 0 0 0 3px rgba($brand-orange, 0.12);
    }

    &::placeholder {
      color: $ink-500;
    }
  }
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-4;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }

  .field {
    margin-bottom: 0;
  }
}

.manual-toggle {
  margin-bottom: $space-4;
}

.toggle-pill {
  display: inline-flex;
  align-items: center;
  gap: $space-3;
  padding: $space-1;
  padding-right: $space-4;
  background: rgba($ink-500, 0.15);
  border: 1px solid rgba($ink-500, 0.25);
  border-radius: 999px;
  color: $ink-300;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba($ink-500, 0.4);
  }

  &.active {
    background: rgba($brand-orange, 0.12);
    border-color: rgba($brand-orange, 0.3);
    color: $brand-orange;

    .toggle-knob {
      transform: translateX(24px);
      background: $brand-orange;
    }
  }
}

.toggle-knob {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: $ink-400;
  transition: transform 0.2s ease, background 0.2s ease;
}

.manual-fields {
  animation: slideDown 0.25s ease;
}

.calc-state {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-4;
  color: $ink-400;
  font-size: 0.95rem;
}

.summary-card {
  position: sticky;
  top: 100px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-3;
  color: $ink-300;
  font-size: 0.95rem;

  strong {
    color: $fg-dark;
    font-weight: 600;
  }

  &.fee {
    background: rgba($brand-orange, 0.08);
    padding: $space-3 $space-4;
    border-radius: 12px;
    color: $brand-orange;

    strong {
      color: $brand-orange;
    }
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

.breakdown {
  font-size: 0.8rem;
  color: $ink-400;
  font-style: italic;
  margin-bottom: $space-3;
}

.summary-divider {
  height: 1px;
  background: rgba($ink-500, 0.15);
  margin: $space-3 0;
}

.alert {
  display: flex;
  align-items: flex-start;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-radius: 12px;
  font-size: 0.9rem;
  margin-bottom: $space-4;

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
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
