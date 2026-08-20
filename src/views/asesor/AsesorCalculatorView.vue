<script setup lang="ts">
/** Quotes the management fee so the asesor can start a sale from the result. */
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import CalculadoraResumen from './Calculadora/CalculadoraResumen.vue'
import { useCalculadora } from './Calculadora/useCalculadora'

const router = useRouter()
const c = useCalculadora()

function createOrder() {
  if (!c.orderQuery.value) return
  router.push({ name: 'AsesorVentas', query: c.orderQuery.value })
}

onMounted(c.loadConfigs)
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
      <div class="hero-icon"><i class="fa-solid fa-calculator" /></div>
    </section>

    <div class="calculator-grid">
      <section class="card inputs-card">
        <h3 class="card-title">Datos de la compra</h3>

        <label class="field">
          <span class="field-label">Tarifa aplicable</span>
          <select v-model="c.configId.value" class="field-input">
            <option value="" disabled>Selecciona una tarifa</option>
            <option v-for="config in c.configs.value" :key="config._id" :value="config._id">
              {{ config.name }} {{ config.isDefault ? '(por defecto)' : '' }}
            </option>
          </select>
        </label>

        <label class="field">
          <span class="field-label">Valor del producto (USD)</span>
          <input
            v-model.number="c.productValue.value"
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
            v-model.number="c.shippingValue.value"
            type="number"
            min="0"
            step="0.01"
            class="field-input"
            placeholder="Ej: 0.00"
          />
        </label>

        <button class="btn-primary" :disabled="c.loading.value || !c.result.value" @click="createOrder">
          {{ c.loading.value ? 'Calculando...' : 'Crear gestión con este total' }}
        </button>
      </section>

      <CalculadoraResumen :result="c.result.value" />
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
}

.hero-text {
  h1 { font-size: 1.6rem; font-weight: 700; margin: 0 0 $space-2; }
  p { color: $ink-300; margin: 0; max-width: 540px; line-height: 1.5; }
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

.calculator-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-6;
  align-items: start;

  @media (max-width: 900px) { grid-template-columns: 1fr; }
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

  .field-label { font-size: 0.85rem; font-weight: 500; color: $ink-300; }

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

    &::placeholder { color: $ink-500; }
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
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: color.adjust($brand-orange, $lightness: 6%);
    transform: translateY(-1px);
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

@media (prefers-reduced-motion: reduce) {
  .field .field-input,
  .btn-primary { transition: none; }
  .btn-primary:hover:not(:disabled) { transform: none; }
}
</style>
