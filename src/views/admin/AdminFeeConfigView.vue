<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { asesoriaApi } from '@/services/asesoria.api'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppConfirmModal from '@/components/ui/AppConfirmModal.vue'
import type { FeeConfig, FeeRuleType, FeeTier } from '@/services/asesoria.api'
import { useToastStore } from '@/stores/toast.store'

const configs = ref<FeeConfig[]>([])
const loading = ref(false)
const saving = ref(false)
const toastStore = useToastStore()

const showWizard = ref(false)
const wizardStep = ref(1)
const showDeleteConfirm = ref(false)
const deleteTargetId = ref('')
const wizard = ref({
  name: 'Tarifa por defecto',
  ruleType: 'fixed_plus_percentage' as FeeRuleType,
  fixedAmount: 20,
  percentage: 10,
  minAmount: 20,
  maxAmount: 0,
  tiers: [] as FeeTier[],
})

const ruleTypeOptions = [
  { value: 'fixed', label: 'Monto fijo' },
  { value: 'percentage', label: 'Porcentaje del total' },
  { value: 'fixed_plus_percentage', label: 'Fijo + porcentaje' },
  { value: 'tiered', label: 'Por rangos (tiers)' },
]

const needsFixed = computed(() => ['fixed', 'fixed_plus_percentage', 'tiered'].includes(wizard.value.ruleType))
const needsPercentage = computed(() => ['percentage', 'fixed_plus_percentage', 'tiered'].includes(wizard.value.ruleType))
const hasConfig = computed(() => configs.value.length > 0)

async function loadConfigs() {
  loading.value = true
  try {
    const data = await asesoriaApi.getFeeConfigs()
    configs.value = data.configs
  } catch (e: any) {
    toastStore.showNotification(e.message || 'Error al cargar configuraciones', 'error')
  } finally {
    loading.value = false
  }
}

function addTier() {
  const last = wizard.value.tiers[wizard.value.tiers.length - 1]
  const from = last ? last.to + 0.01 : 0
  wizard.value.tiers.push({ from, to: from + 100, fixedAmount: 20, percentage: 0 })
}

function removeTier(idx: number) {
  wizard.value.tiers.splice(idx, 1)
}

async function finishWizard() {
  saving.value = true
  try {
    await asesoriaApi.createFeeConfig({
      name: wizard.value.name,
      ruleType: wizard.value.ruleType,
      fixedAmount: wizard.value.fixedAmount,
      percentage: wizard.value.percentage,
      minAmount: wizard.value.minAmount,
      maxAmount: wizard.value.maxAmount,
      tiers: wizard.value.tiers,
      currency: 'USD',
      isDefault: false,
      enabled: true,
    })
    showWizard.value = false
    wizardStep.value = 1
    toastStore.showNotification('Tarifa creada correctamente', 'success')
    await loadConfigs()
  } catch (e: any) {
    toastStore.showNotification(e.data?.detail || e.message || 'Error al guardar', 'error')
  } finally {
    saving.value = false
  }
}

async function setDefault(id: string) {
  try {
    await asesoriaApi.setDefaultFeeConfig(id)
    await loadConfigs()
  } catch (e: any) {
    toastStore.showNotification(e.message || 'Error al cambiar tarifa por defecto', 'error')
  }
}

async function deleteConfig(id: string) {
  deleteTargetId.value = id
  showDeleteConfirm.value = true
}

async function confirmDeleteConfig() {
  if (!deleteTargetId.value) return
  try {
    await asesoriaApi.deleteFeeConfig(deleteTargetId.value)
    await loadConfigs()
  } catch (e: any) {
    toastStore.showNotification(e.message || 'Error al eliminar', 'error')
  } finally {
    showDeleteConfirm.value = false
    deleteTargetId.value = ''
  }
}

function describeConfig(c: FeeConfig) {
  switch (c.ruleType) {
    case 'fixed':
      return `$${c.fixedAmount} fijo`
    case 'percentage':
      return `${c.percentage}% del total`
    case 'fixed_plus_percentage':
      return `$${c.fixedAmount} + ${c.percentage}%`
    case 'tiered':
      return `Por rangos (${c.tiers?.length || 0})`
    default:
      return c.ruleType
  }
}

onMounted(loadConfigs)
</script>

<template>
  <div class="fee-config-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Configuración de tarifas</h1>
        <p class="page-subtitle">
          Define cómo se calcula el fee de gestión para las órdenes de compra.
        </p>
      </div>
      <button class="btn-primary" @click="showWizard = true">
        <i class="fa-solid fa-plus" /> Nueva tarifa
      </button>
    </div>

    <div v-if="!hasConfig" class="onboarding-card">
      <div class="onboarding-icon"><i class="fa-solid fa-wand-magic-sparkles" /></div>
      <h2>Aún no tienes tarifas configuradas</h2>
      <p>
        El asesor no podrá usar la calculadora hasta que crees al menos una tarifa. Configura una
        ahora con el asistente.
      </p>
      <button class="btn-primary" @click="showWizard = true">Configurar primera tarifa</button>
    </div>

    <div v-else-if="loading" class="loading">
      <i class="fa-solid fa-circle-notch fa-spin" /> Cargando...
    </div>

    <div v-else class="configs-list">
      <div
        v-for="config in configs"
        :key="config._id"
        class="config-card"
        :class="{ default: config.isDefault }"
      >
        <div class="config-main">
          <div class="config-name">
            {{ config.name }}
            <span v-if="config.isDefault" class="default-badge">Por defecto</span>
          </div>
          <div class="config-desc">{{ describeConfig(config) }}</div>
        </div>
        <div class="config-actions">
          <button v-if="!config.isDefault" class="btn-ghost" @click="setDefault(config._id)">
            Hacer por defecto
          </button>
          <button class="btn-ghost danger" @click="deleteConfig(config._id)">
            <i class="fa-solid fa-trash" />
          </button>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div v-if="showWizard" class="modal-overlay" @click.self="showWizard = false">
        <div class="modal-card wizard">
        <h2>Asistente de tarifa</h2>
        <p class="wizard-step">Paso {{ wizardStep }} de 2</p>

        <div v-if="wizardStep === 1" class="wizard-body">
          <label class="field">
            <span class="field-label">Nombre de la tarifa</span>
            <input v-model="wizard.name" class="field-input" placeholder="Ej: Tarifa estándar" />
          </label>

          <div class="field">
            <AppSelect v-model="wizard.ruleType" :options="ruleTypeOptions" label="Tipo de cálculo" />
          </div>

          <div class="field-row">
            <label v-if="needsFixed" class="field">
              <span class="field-label">Monto fijo (USD)</span>
              <input v-model.number="wizard.fixedAmount" type="number" min="0" step="0.01" class="field-input" />
            </label>
            <label v-if="needsPercentage" class="field">
              <span class="field-label">Porcentaje (%)</span>
              <input v-model.number="wizard.percentage" type="number" min="0" step="0.01" class="field-input" />
            </label>
          </div>

          <div class="field-row">
            <label class="field">
              <span class="field-label">Mínimo (opcional)</span>
              <input v-model.number="wizard.minAmount" type="number" min="0" step="0.01" class="field-input" placeholder="Ej: 5" />
            </label>
            <label class="field">
              <span class="field-label">Máximo (opcional, 0 = sin máximo)</span>
              <input v-model.number="wizard.maxAmount" type="number" min="0" step="0.01" class="field-input" placeholder="Ej: 30" />
            </label>
          </div>

          <div class="example-box">
            <i class="fa-solid fa-lightbulb" />
            <p>
              <strong>Ejemplo:</strong> si configurás <strong>20%</strong> y el cliente compra
              <strong>$100</strong>, el fee sería <strong>$20</strong>. Si ponés
              <strong>Mínimo $5</strong>, cobrás al menos $5 aunque el % dé menos; si ponés
              <strong>Máximo $30</strong>, nunca cobrás más de $30 aunque el % dé más.
            </p>
          </div>
        </div>

        <div v-else class="wizard-body">
          <div v-if="wizard.ruleType === 'tiered'" class="tiers-section">
            <div class="tiers-header">
              <h4>Rangos</h4>
              <button class="btn-ghost" @click="addTier"><i class="fa-solid fa-plus" /> Agregar rango</button>
            </div>
            <div v-for="(tier, idx) in wizard.tiers" :key="idx" class="tier-row">
              <input v-model.number="tier.from" type="number" class="field-input small" placeholder="Desde" />
              <input v-model.number="tier.to" type="number" class="field-input small" placeholder="Hasta" />
              <input v-model.number="tier.fixedAmount" type="number" class="field-input small" placeholder="Fijo" />
              <input v-model.number="tier.percentage" type="number" class="field-input small" placeholder="%" />
              <button class="btn-ghost danger" @click="removeTier(idx)"><i class="fa-solid fa-trash" /></button>
            </div>
            <p v-if="wizard.tiers.length === 0" class="hint">Agrega al menos un rango.</p>
          </div>

          <div v-else class="preview-section">
            <h4>Vista previa</h4>
            <p class="preview-desc">Para una compra de $100 + $10 de envío:</p>
            <div class="preview-values">
              <div>
                <span>Base</span>
                <strong>$110.00</strong>
              </div>
              <div>
                <span>Fee</span>
                <strong>
                  ${{
                    wizard.ruleType === 'fixed'
                      ? wizard.fixedAmount.toFixed(2)
                      : wizard.ruleType === 'percentage'
                      ? ((110 * (wizard.percentage || 0)) / 100).toFixed(2)
                      : (wizard.fixedAmount + (110 * (wizard.percentage || 0)) / 100).toFixed(2)
                  }}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div class="wizard-actions">
          <button v-if="wizardStep === 2" class="btn-ghost" @click="wizardStep = 1">Atrás</button>
          <button v-if="wizardStep === 1" class="btn-primary" @click="wizardStep = 2">Continuar</button>
          <button v-else class="btn-primary" :disabled="saving" @click="finishWizard">
            {{ saving ? 'Guardando...' : 'Guardar tarifa' }}
          </button>
        </div>
      </div>
    </div>
  </transition>

  <AppConfirmModal
    :open="showDeleteConfirm"
    title="Eliminar tarifa"
    message="¿Eliminar esta tarifa? Esta acción no se puede deshacer."
    confirm-label="Eliminar"
    variant="danger"
    @cancel="showDeleteConfirm = false; deleteTargetId = ''"
    @confirm="confirmDeleteConfig"
  />
</div>
</template>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.fee-config-page {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
  }
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 $space-1;
}

.page-subtitle {
  color: $ink-400;
  margin: 0;
  font-size: 0.9rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3 $space-5;
  background: $brand-orange;
  border: none;
  border-radius: 12px;
  color: $ink-1000;
  font-weight: 700;
  font-size: 0.95rem;
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

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-4;
  background: transparent;
  border: 1px solid rgba($ink-500, 0.3);
  border-radius: 10px;
  color: $ink-300;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.9rem;

  &:hover {
    background: rgba($ink-500, 0.15);
    color: $fg-dark;
  }

  &.danger {
    color: #ff8a8f;
    border-color: rgba($signal-red, 0.3);

    &:hover {
      background: rgba($signal-red, 0.1);
    }
  }
}

.alert {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-radius: 12px;
  font-size: 0.9rem;

  &.success {
    background: rgba($signal-green, 0.1);
    color: $signal-green;
    border: 1px solid rgba($signal-green, 0.15);
  }

  &.error {
    background: rgba($signal-red, 0.1);
    color: #ff8a8f;
    border: 1px solid rgba($signal-red, 0.15);
  }
}

.onboarding-card {
  background: linear-gradient(135deg, rgba($brand-orange, 0.08), rgba($brand-orange, 0.02));
  border: 1px dashed rgba($brand-orange, 0.3);
  border-radius: 20px;
  padding: $space-10;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-4;

  .onboarding-icon {
    width: 72px;
    height: 72px;
    border-radius: 20px;
    background: rgba($brand-orange, 0.1);
    color: $brand-orange;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
  }

  h2 {
    margin: 0;
    font-size: 1.3rem;
  }

  p {
    color: $ink-400;
    margin: 0;
    max-width: 480px;
  }
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  padding: $space-8 0;
  color: $ink-500;
}

.configs-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.config-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 16px;
  padding: $space-5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $space-4;

  &.default {
    border-color: rgba($brand-orange, 0.25);
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
  }
}

.config-name {
  font-weight: 700;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-1;
}

.default-badge {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 3px 8px;
  border-radius: 20px;
  background: rgba($brand-orange, 0.12);
  color: $brand-orange;
}

.config-desc {
  color: $ink-400;
  font-size: 0.9rem;
}

.config-actions {
  display: flex;
  gap: $space-2;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba($ink-1000, 0.8);
  backdrop-filter: blur(6px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.modal-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.15);
  border-radius: 20px;
  padding: $space-8;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;

  h2 {
    margin: 0 0 $space-1;
  }

  .wizard-step {
    color: $ink-400;
    margin: 0 0 $space-6;
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

    &:focus {
      border-color: $brand-orange;
      box-shadow: 0 0 0 3px rgba($brand-orange, 0.12);
    }

    &.small {
      padding: $space-2;
      font-size: 0.9rem;
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
}

.example-box {
  display: flex;
  align-items: flex-start;
  gap: $space-3;
  padding: $space-4;
  border-radius: 12px;
  background: rgba($brand-orange, 0.08);
  border: 1px solid rgba($brand-orange, 0.15);
  color: $ink-200;
  font-size: 0.9rem;
  line-height: 1.5;

  i {
    color: $brand-orange;
    font-size: 1rem;
    margin-top: 2px;
  }

  p {
    margin: 0;
  }

  strong {
    color: $brand-orange;
  }
}

.wizard-actions {
  display: flex;
  justify-content: flex-end;
  gap: $space-3;
  margin-top: $space-6;
}

.tiers-section {
  h4 {
    margin: 0 0 $space-3;
  }

  .tiers-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $space-3;
  }

  .tier-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr auto;
    gap: $space-2;
    align-items: center;
    margin-bottom: $space-2;
  }

  .hint {
    color: $ink-500;
    font-size: 0.85rem;
  }
}

.preview-section {
  h4 {
    margin: 0 0 $space-3;
  }

  .preview-desc {
    color: $ink-400;
    margin: 0 0 $space-3;
  }

  .preview-values {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $space-4;

    div {
      background: $ink-1000;
      border-radius: 12px;
      padding: $space-4;
      display: flex;
      flex-direction: column;
      gap: $space-1;

      span {
        color: $ink-400;
        font-size: 0.85rem;
      }

      strong {
        font-size: 1.3rem;
        color: $brand-orange;
      }
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
