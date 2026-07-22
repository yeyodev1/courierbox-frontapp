<template>
  <div class="step-costo">
    <h3 class="step__title">{{ esCourier ? 'Costo del servicio (opcional)' : 'Costo de venta' }}</h3>
    <p class="step__desc">
      {{ esCourier
        ? 'Costo que te representa el traslado (para calcular tu margen). Si no aplica, déjalo en 0.'
        : '¿Cuánto costó el producto en la tienda?' }}
    </p>
    <div class="input-group">
      <span class="currency-prefix">$</span>
      <input
        v-model.number="store.formData.costoVenta"
        type="number"
        min="0"
        step="0.01"
        class="money-input"
        placeholder="0.00"
      />
    </div>
    <p v-if="store.formData.costoVenta && store.formData.valorTotal" class="margin-hint">
      Margen bruto:
      <strong :class="margin >= 0 ? 'positive' : 'negative'">
        ${{ margin.toFixed(2) }} ({{ marginPct.toFixed(1) }}%)
      </strong>
    </p>
    <p v-if="error" class="field-error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGestionCompraFormStore } from '@/stores/gestion_compra_form.store'

const store = useGestionCompraFormStore()
const error = ref('')
const esCourier = computed(() => store.formData.serviceType === 'logistica')

const margin = computed(() => (store.formData.valorTotal ?? 0) - (store.formData.costoVenta ?? 0))
const marginPct = computed(() =>
  store.formData.valorTotal ? (margin.value / store.formData.valorTotal) * 100 : 0
)

defineExpose({
  isValid() {
    if (store.formData.costoVenta === null || store.formData.costoVenta < 0) {
      error.value = 'Ingresa el costo de venta (puede ser 0)'
      return false
    }
    error.value = ''
    return true
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
.step-costo { display: flex; flex-direction: column; gap: $space-4; }
.step__title { color: $fg-dark; font-size: 1.1rem; margin: 0; }
.step__desc { color: $ink-300; font-size: 0.9rem; margin: 0; }
.input-group {
  display: flex; align-items: center;
  background: $ink-700; border: 1px solid $ink-500; border-radius: 10px;
  overflow: hidden; max-width: 240px;
}
.currency-prefix {
  padding: 0 $space-3; color: $brand-orange; font-size: 1.2rem; font-weight: 700;
  border-right: 1px solid $ink-500;
}
.money-input {
  flex: 1; background: none; border: none; outline: none;
  color: $fg-dark; font-size: 1.3rem; font-weight: 700;
  padding: $space-2 $space-3;
  &::placeholder { color: $ink-500; }
}
.margin-hint { color: $ink-300; font-size: 0.9rem; }
.positive { color: $signal-green; }
.negative { color: $signal-red; }
.field-error { color: $signal-red; font-size: 0.82rem; }
</style>
