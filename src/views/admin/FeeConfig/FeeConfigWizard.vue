<script setup lang="ts">
/**
 * Two-step wizard for a new fee rule. Step one captures the formula, step two
 * either collects the tier table or previews what the rule would charge.
 */
import { computed, ref, watch } from 'vue'
import AppOverlay from '@/components/ui/AppOverlay.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { RULES_WITH_FIXED, RULES_WITH_PERCENTAGE, RULE_TYPE_OPTIONS, emptyWizardForm, type WizardForm } from './useFeeConfig'

const props = defineProps<{ open: boolean; saving: boolean }>()
const emit = defineEmits<{ close: []; submit: [form: WizardForm] }>()

const form = ref<WizardForm>(emptyWizardForm())
const step = ref<1 | 2>(1)

const needsFixed = computed(() => RULES_WITH_FIXED.includes(form.value.ruleType))
const needsPercentage = computed(() => RULES_WITH_PERCENTAGE.includes(form.value.ruleType))

/** The sample basket the preview quotes against: $100 of goods plus $10 shipping. */
const PREVIEW_BASE = 110

const previewFee = computed(() => {
  const { ruleType, fixedAmount, percentage } = form.value
  const pct = (PREVIEW_BASE * (percentage || 0)) / 100
  if (ruleType === 'fixed') return fixedAmount
  if (ruleType === 'percentage') return pct
  return fixedAmount + pct
})

watch(
  () => props.open,
  (open) => {
    if (!open) return
    form.value = emptyWizardForm()
    step.value = 1
  },
)

function addTier() {
  const last = form.value.tiers[form.value.tiers.length - 1]
  const from = last ? last.to + 0.01 : 0
  form.value.tiers.push({ from, to: from + 100, fixedAmount: 20, percentage: 0 })
}

function removeTier(index: number) {
  form.value.tiers.splice(index, 1)
}
</script>

<template>
  <AppOverlay :open="open" label="Asistente de tarifa" :persistent="saving" @close="emit('close')">
    <div class="modal-card">
      <h2>Asistente de tarifa</h2>
      <p class="wizard-step">Paso {{ step }} de 2</p>

      <div v-if="step === 1" class="wizard-body">
        <label class="field">
          <span class="field-label">Nombre de la tarifa</span>
          <input v-model="form.name" class="field-input" placeholder="Ej: Tarifa estándar" />
        </label>

        <div class="field">
          <AppSelect v-model="form.ruleType" :options="RULE_TYPE_OPTIONS" label="Tipo de cálculo" />
        </div>

        <div class="field-row">
          <label v-if="needsFixed" class="field">
            <span class="field-label">Monto fijo (USD)</span>
            <input v-model.number="form.fixedAmount" type="number" min="0" step="0.01" class="field-input" />
          </label>
          <label v-if="needsPercentage" class="field">
            <span class="field-label">Porcentaje (%)</span>
            <input v-model.number="form.percentage" type="number" min="0" step="0.01" class="field-input" />
          </label>
        </div>

        <div class="field-row">
          <label class="field">
            <span class="field-label">Mínimo (opcional)</span>
            <input v-model.number="form.minAmount" type="number" min="0" step="0.01" class="field-input" placeholder="Ej: 5" />
          </label>
          <label class="field">
            <span class="field-label">Máximo (opcional, 0 = sin máximo)</span>
            <input v-model.number="form.maxAmount" type="number" min="0" step="0.01" class="field-input" placeholder="Ej: 30" />
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
        <div v-if="form.ruleType === 'tiered'" class="tiers-section">
          <div class="tiers-header">
            <h4>Rangos</h4>
            <button class="btn-ghost" @click="addTier"><i class="fa-solid fa-plus" /> Agregar rango</button>
          </div>
          <div v-for="(tier, index) in form.tiers" :key="index" class="tier-row">
            <input v-model.number="tier.from" type="number" class="field-input small" placeholder="Desde" />
            <input v-model.number="tier.to" type="number" class="field-input small" placeholder="Hasta" />
            <input v-model.number="tier.fixedAmount" type="number" class="field-input small" placeholder="Fijo" />
            <input v-model.number="tier.percentage" type="number" class="field-input small" placeholder="%" />
            <button class="btn-ghost danger" aria-label="Quitar rango" @click="removeTier(index)">
              <i class="fa-solid fa-trash" />
            </button>
          </div>
          <p v-if="!form.tiers.length" class="hint">Agrega al menos un rango.</p>
        </div>

        <div v-else class="preview-section">
          <h4>Vista previa</h4>
          <p class="preview-desc">Para una compra de $100 + $10 de envío:</p>
          <div class="preview-values">
            <div><span>Base</span><strong>${{ PREVIEW_BASE.toFixed(2) }}</strong></div>
            <div><span>Fee</span><strong>${{ previewFee.toFixed(2) }}</strong></div>
          </div>
        </div>
      </div>

      <div class="wizard-actions">
        <button v-if="step === 2" class="btn-ghost" @click="step = 1">Atrás</button>
        <button v-if="step === 1" class="btn-primary" @click="step = 2">Continuar</button>
        <button v-else class="btn-primary" :disabled="saving" @click="emit('submit', form)">
          {{ saving ? 'Guardando...' : 'Guardar tarifa' }}
        </button>
      </div>
    </div>
  </AppOverlay>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './fee-ui' as ui;

@include ui.buttons;
@include ui.fields;

.modal-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.15);
  border-radius: 20px;
  padding: $space-8;
  width: 100%;
  max-width: 560px;

  h2 { margin: 0 0 $space-1; }
}

.wizard-step {
  color: $ink-400;
  margin: 0 0 $space-6;
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

  i { color: $brand-orange; font-size: 1rem; margin-top: 2px; }
  p { margin: 0; }
  strong { color: $brand-orange; }
}

.wizard-actions {
  display: flex;
  justify-content: flex-end;
  gap: $space-3;
  margin-top: $space-6;
}

.tiers-section {
  h4 { margin: 0 0 $space-3; }

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

  .hint { color: $ink-500; font-size: 0.85rem; }
}

.preview-section {
  h4 { margin: 0 0 $space-3; }

  .preview-desc { color: $ink-400; margin: 0 0 $space-3; }

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
    }

    span { color: $ink-400; font-size: 0.85rem; }
    strong { font-size: 1.3rem; color: $brand-orange; }
  }
}
</style>
