<template>
  <div class="step-comision">
    <h3 class="step__title">Tu comisión por esta gestión</h3>
    <p class="step__desc">
      Es tu ganancia por gestionar esta venta. <strong>Ya está incluida dentro del valor total</strong> que paga el cliente —
      no se le cobra aparte. Se calcula automáticamente, pero puedes ajustarla.
    </p>

    <div v-if="loading" class="rule-info loading-msg">
      <i class="fa-solid fa-spinner fa-spin" aria-hidden="true" /> Calculando comisión sugerida...
    </div>
    <div v-else-if="feeConfigNombre" class="rule-info">
      Regla aplicada: <strong>{{ feeConfigNombre }}</strong>
    </div>

    <div class="rule-config" :class="{ warn: sinRegla }">
      <i class="fa-solid" :class="sinRegla ? 'fa-triangle-exclamation' : 'fa-circle-info'" aria-hidden="true" />
      <div class="rule-config__body">
        <template v-if="isAdmin">
          <p v-if="sinRegla">No hay una regla de comisión configurada. Defínela en <strong>Configuración de tarifas</strong>.</p>
          <p v-else>La regla se administra en <strong>Configuración de tarifas</strong>.</p>
          <a class="rule-config__link" href="/admin/fee-config" target="_blank" rel="noopener">
            <i class="fa-solid fa-gear" aria-hidden="true" /> Abrir configuración de tarifas
          </a>
        </template>
        <template v-else>
          <p>
            La regla de comisión la configura el <strong>administrador</strong> en “Configuración de tarifas”.
            {{ sinRegla ? 'Aún no hay una regla activa; puedes ingresar el valor manualmente o pedir al admin que la cree.' : 'Puedes ajustar el valor manualmente si lo necesitas.' }}
          </p>
        </template>
      </div>
    </div>

    <div class="input-group">
      <span class="currency-prefix">$</span>
      <input
        v-model="comision"
        type="number"
        min="0"
        step="0.01"
        class="money-input"
        placeholder="0.00"
      />
    </div>

    <div v-if="valorTotalNum > 0" class="breakdown">
      <div class="breakdown-row">
        <span>Valor total (lo que paga el cliente)</span>
        <strong>${{ money(valorTotalNum) }}</strong>
      </div>
      <div class="breakdown-row minus">
        <span>Tu comisión (incluida en el total)</span>
        <strong class="orange">− ${{ money(comisionNum) }}</strong>
      </div>
      <div class="breakdown-divider"></div>
      <div class="breakdown-row net">
        <span>Queda para el resto (producto, costos, etc.)</span>
        <strong>${{ money(restante) }}</strong>
      </div>
      <p class="breakdown-note">
        <i class="fa-solid fa-circle-info" aria-hidden="true" />
        La comisión <strong>sale del valor total</strong>; el cliente sigue pagando ${{ money(valorTotalNum) }}, no se le suma nada extra.
      </p>
    </div>

    <p v-if="error" class="field-error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useGestionCompraFormStore } from '@/stores/gestion_compra_form.store'
import { useAuthStore } from '@/stores/auth.store'
import { gestionesCompraAPI } from '@/services/gestiones_compra.api'

const store = useGestionCompraFormStore()
const auth = useAuthStore()
const loading = ref(true)
const error = ref('')
const feeConfigNombre = ref(store.formData.feeConfigNombre ?? '')

const isAdmin = computed(() => ['admin', 'gerencia', 'superadmin'].includes(auth.userRole ?? ''))

// Coerce to number safely — v-model.number leaves '' (string) on empty input,
// which broke `.toFixed()` and blanked the whole step.
function money(v: unknown) {
  return (Number(v) || 0).toFixed(2)
}
const valorTotalNum = computed(() => Number(store.formData.valorTotal) || 0)
const comisionNum = computed(() => Number(store.formData.valorComision) || 0)
const restante = computed(() => Math.max(0, valorTotalNum.value - comisionNum.value))

// Two-way binding that always stores a number (never '').
const comision = computed<number | string>({
  get: () => (store.formData.valorComision ?? '') as number | string,
  set: (v) => {
    store.formData.valorComision = v === '' || v === null || v === undefined ? 0 : Number(v)
  },
})
const sinRegla = computed(() => {
  const n = (feeConfigNombre.value || '').toLowerCase()
  return !n || n.includes('sin') || n.includes('por defecto') || n.includes('default')
})

onMounted(async () => {
  if (store.formData.valorComision !== null) {
    loading.value = false
    return
  }
  try {
    const result = await gestionesCompraAPI.getComisionPreview(
      store.formData.valorTotal ?? 0,
      store.formData.feeConfigId || undefined
    )
    store.setComision(result.valorComision, store.formData.feeConfigId, result.feeConfigNombre)
    feeConfigNombre.value = result.feeConfigNombre
  } catch {
    store.formData.valorComision = 0
  } finally {
    loading.value = false
  }
})

defineExpose({
  isValid() {
    if (store.formData.valorComision === null || store.formData.valorComision < 0) {
      error.value = 'Ingresa el valor de comisión (puede ser 0)'
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
.step-comision { display: flex; flex-direction: column; gap: $space-4; }
.step__title { color: $fg-dark; font-size: 1.1rem; margin: 0; }
.step__desc { color: $ink-300; font-size: 0.9rem; margin: 0; }
.loading-msg { color: $ink-400; }
.rule-info {
  background: $ink-700; padding: $space-2 $space-4; border-radius: 8px;
  font-size: 0.85rem; color: $ink-300;
}
.rule-config {
  display: flex; gap: $space-3; align-items: flex-start;
  background: rgba($signal-blue, 0.08); border: 1px solid rgba($signal-blue, 0.25);
  border-radius: 10px; padding: $space-3 $space-4;
  > i { color: $signal-blue; margin-top: 2px; }
  &.warn { background: rgba($brand-orange, 0.08); border-color: rgba($brand-orange, 0.3); > i { color: $brand-orange; } }
}
.rule-config__body { display: flex; flex-direction: column; gap: $space-2; }
.rule-config__body p { margin: 0; color: $ink-300; font-size: 0.85rem; line-height: 1.5; }
.rule-config__link {
  display: inline-flex; align-items: center; gap: $space-2; align-self: flex-start;
  color: $brand-orange; text-decoration: none; font-weight: 700; font-size: 0.85rem;
  border: 1px solid rgba($brand-orange, 0.3); border-radius: 10px; padding: 6px 12px;
  &:hover { background: rgba($brand-orange, 0.08); }
}
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
.breakdown {
  display: flex; flex-direction: column; gap: $space-2;
  background: $ink-900; border: 1px solid rgba($ink-500, 0.18); border-radius: 12px; padding: $space-4;
}
.breakdown-row {
  display: flex; align-items: center; justify-content: space-between; gap: $space-3;
  color: $ink-300; font-size: 0.9rem;
  strong { color: $fg-dark; font-weight: 700; }
  .orange { color: $brand-orange; }
  &.net span { color: $fg-dark; font-weight: 600; }
}
.breakdown-divider { height: 1px; background: rgba($ink-500, 0.25); margin: $space-1 0; }
.breakdown-note {
  display: flex; align-items: flex-start; gap: $space-2; margin: $space-2 0 0;
  color: $ink-400; font-size: 0.8rem; line-height: 1.5;
  i { color: $signal-blue; margin-top: 2px; }
  strong { color: $ink-300; }
}
.field-error { color: $signal-red; font-size: 0.82rem; }
</style>
