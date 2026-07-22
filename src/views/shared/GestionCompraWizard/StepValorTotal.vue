<template>
  <div class="step-valor">
    <h3 class="step__title">{{ esCourier ? 'Valor a cobrar por el servicio' : 'Valor total de la compra' }}</h3>
    <p class="step__desc">
      {{ esCourier
        ? 'Ingresa el valor total que le cobrarás al cliente por el courier / traslado.'
        : 'Ingresa el valor total que el cliente pagará por el producto.' }}
    </p>
    <div class="input-group">
      <span class="currency-prefix">$</span>
      <input
        v-model.number="localValor"
        type="number"
        min="0"
        step="0.01"
        class="money-input"
        placeholder="0.00"
        @input="store.formData.valorTotal = localValor"
      />
    </div>
    <p v-if="localValor && localValor > 0" class="hint-text">
      Valor ingresado: <strong class="highlight">${{ localValor.toFixed(2) }}</strong>
    </p>
    <p v-if="error" class="field-error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useGestionCompraFormStore } from '@/stores/gestion_compra_form.store'

const store = useGestionCompraFormStore()
const esCourier = computed(() => store.formData.serviceType === 'logistica')
const localValor = ref<number>(store.formData.valorTotal ?? 0)
const error = ref('')

watch(() => store.formData.valorTotal, (v) => { localValor.value = v ?? 0 })

defineExpose({
  isValid() {
    if (!localValor.value || localValor.value <= 0) {
      error.value = 'Ingresa un valor mayor a 0'
      return false
    }
    error.value = ''
    store.formData.valorTotal = localValor.value
    return true
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
.step-valor { display: flex; flex-direction: column; gap: $space-4; }
.step__title { color: $fg-dark; font-size: 1.1rem; margin: 0; }
.step__desc { color: $ink-300; font-size: 0.9rem; margin: 0; }
.input-group {
  display: flex; align-items: center;
  background: $ink-700; border: 1px solid $ink-500; border-radius: 10px;
  overflow: hidden; max-width: 280px;
}
.currency-prefix {
  padding: 0 $space-3; color: $brand-orange;
  font-size: 1.4rem; font-weight: 700;
  border-right: 1px solid $ink-500;
}
.money-input {
  flex: 1; background: none; border: none; outline: none;
  color: $fg-dark; font-size: 1.6rem; font-weight: 700;
  padding: $space-3 $space-4;
  &::placeholder { color: $ink-500; }
}
.hint-text { color: $ink-300; font-size: 0.9rem; }
.highlight { color: $brand-orange; }
.field-error { color: $signal-red; font-size: 0.82rem; }
</style>
