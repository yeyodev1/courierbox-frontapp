<template>
  <div class="step-reserva">
    <h3 class="step__title">Valor de reserva y cuenta de pago</h3>
    <p class="step__desc">Selecciona una cuenta para recibir la reserva. Si no existe, puedes crearla sin salir del flujo.</p>

    <!-- Valor reserva -->
    <div class="field-group">
      <label class="field-label">Valor de reserva (abono inicial del cliente)</label>
      <div class="input-group">
        <span class="currency-prefix">$</span>
        <input
          v-model.number="store.formData.valorReserva"
          type="number"
          min="0"
          step="0.01"
          class="money-input"
          placeholder="0.00"
        />
      </div>
    </div>

    <!-- Cuenta de pago -->
    <div class="field-group">
      <label class="field-label">Cuenta de pago *</label>
      <div class="field-actions">
        <button class="link-action" @click="openCreateCuenta">+ Agregar cuenta</button>
      </div>
      <div v-if="loadingCuentas" class="muted">Cargando cuentas...</div>
      <div v-else class="cuentas-list">
        <button
          v-for="c in cuentas"
          :key="c._id"
          class="cuenta-card"
          :class="{ selected: store.formData.cuentaBancariaId === c._id }"
          @click="selectCuenta(c)"
        >
          <span class="cuenta-banco">{{ c.banco }}</span>
          <span class="cuenta-numero">{{ c.numeroCuenta }}</span>
          <span class="cuenta-titular">{{ c.titular }}</span>
          <span class="cuenta-tipo">{{ c.tipoCuenta }}</span>
          <span v-if="store.formData.cuentaBancariaId === c._id" class="check">✓</span>
        </button>
        <p v-if="!cuentas.length" class="muted">No hay cuentas configuradas. Pide al admin que las agregue.</p>
      </div>
    </div>

    <transition name="fade">
      <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateCuenta">
        <div class="modal-card">
          <div class="modal-head">
            <div>
              <h4>Nueva cuenta de pago</h4>
              <p>Esto ayuda al asesor a continuar sin frenar la gestión.</p>
            </div>
            <button class="close-btn" @click="closeCreateCuenta">✕</button>
          </div>

          <div class="modal-grid">
            <AppInput v-model="createForm.banco" label="Banco *" placeholder="Banco Pichincha" />
            <AppInput v-model="createForm.numeroCuenta" label="Número de cuenta *" placeholder="1234567890" />
            <AppInput v-model="createForm.titular" label="Titular *" placeholder="Courier Box SAC" />
            <label class="field-block">
              <span class="field-label">Tipo de cuenta</span>
              <select v-model="createForm.tipoCuenta" class="select-input">
                <option value="corriente">Corriente</option>
                <option value="ahorros">Ahorros</option>
              </select>
            </label>
          </div>

          <p v-if="createError" class="field-error">{{ createError }}</p>

          <div class="modal-actions">
            <AppButton variant="outline" @click="closeCreateCuenta">Cancelar</AppButton>
            <AppButton variant="primary" :disabled="creatingCuenta" @click="saveCuenta">
              {{ creatingCuenta ? 'Guardando...' : 'Guardar cuenta' }}
            </AppButton>
          </div>
        </div>
      </div>
    </transition>

    <!-- Confirmación de reserva (solo admin) -->
    <div v-if="isAdmin" class="confirm-section">
      <label class="checkbox-label">
        <input
          type="checkbox"
          v-model="store.formData.reservaConfirmada"
          class="checkbox"
        />
        <span>Marcar reserva como confirmada (abono recibido)</span>
      </label>
      <p class="confirm-hint">Solo activa si ya recibiste el abono del cliente.</p>
    </div>

    <p v-if="error" class="field-error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useGestionCompraFormStore } from '@/stores/gestion_compra_form.store'
import { useAuthStore } from '@/stores/auth.store'
import { cuentasBancariasAPI } from '@/services/cuentas_bancarias.api'
import type { CuentaBancaria } from '@/services/gestiones_compra.api'

const store = useGestionCompraFormStore()
const auth = useAuthStore()
const isAdmin = ['admin', 'superadmin', 'gerencia'].includes(auth.userRole ?? '')

const cuentas = ref<CuentaBancaria[]>([])
const loadingCuentas = ref(true)
const error = ref('')
const showCreateModal = ref(false)
const creatingCuenta = ref(false)
const createError = ref('')
const createForm = ref({ banco: '', numeroCuenta: '', titular: '', tipoCuenta: 'corriente' as 'corriente' | 'ahorros' })

onMounted(async () => {
  try {
    cuentas.value = await cuentasBancariasAPI.list(true)
  } finally {
    loadingCuentas.value = false
  }
})

function selectCuenta(c: CuentaBancaria) {
  store.setCuentaBancaria(c)
}

function openCreateCuenta() {
  showCreateModal.value = true
  createError.value = ''
}

function closeCreateCuenta() {
  showCreateModal.value = false
}

async function saveCuenta() {
  if (!createForm.value.banco.trim() || !createForm.value.numeroCuenta.trim() || !createForm.value.titular.trim()) {
    createError.value = 'Completa banco, número y titular'
    return
  }

  creatingCuenta.value = true
  createError.value = ''
  try {
    const cuenta = await cuentasBancariasAPI.create(createForm.value)
    cuentas.value = [cuenta, ...cuentas.value]
    store.setCuentaBancaria(cuenta)
    createForm.value = { banco: '', numeroCuenta: '', titular: '', tipoCuenta: 'corriente' }
    showCreateModal.value = false
  } catch (e: any) {
    createError.value = e?.message ?? 'No se pudo crear la cuenta'
  } finally {
    creatingCuenta.value = false
  }
}

defineExpose({
  isValid() {
    if (!store.formData.cuentaBancariaId) {
      error.value = 'Selecciona una cuenta de pago'
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
.step-reserva { display: flex; flex-direction: column; gap: $space-5; }
.step__title { color: $fg-dark; font-size: 1.1rem; margin: 0; }
.step__desc { color: $ink-300; font-size: 0.9rem; margin: 0; }
.field-group { display: flex; flex-direction: column; gap: $space-2; }
.field-label { color: $ink-300; font-size: 0.85rem; font-weight: 600; }
.field-actions { display: flex; justify-content: flex-end; }
.link-action {
  background: transparent; border: none; color: $brand-orange; cursor: pointer;
  padding: 0; font-size: 0.85rem; text-decoration: underline;
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
.cuentas-list { display: flex; flex-direction: column; gap: $space-2; }
.cuenta-card {
  position: relative; display: flex; flex-wrap: wrap; gap: $space-1 $space-3;
  align-items: center; padding: $space-3 $space-4;
  background: $ink-900; border: 2px solid $ink-500; border-radius: 10px;
  cursor: pointer; color: $fg-dark; text-align: left; transition: all 0.18s;
  &:hover { border-color: $ink-300; }
  &.selected { border-color: $brand-orange; background: rgba(240,138,31,0.08); }
}
.cuenta-banco { font-weight: 700; font-size: 0.95rem; width: 100%; }
.cuenta-numero { font-size: 0.85rem; color: $ink-300; }
.cuenta-titular { font-size: 0.82rem; color: $ink-400; }
.cuenta-tipo {
  font-size: 0.72rem; background: $ink-700; color: $ink-300;
  padding: 2px 8px; border-radius: 4px;
}
.check {
  position: absolute; right: 12px; top: 12px;
  background: $brand-orange; color: #fff; width: 20px; height: 20px;
  border-radius: 50%; font-size: 0.75rem;
  display: flex; align-items: center; justify-content: center;
}
.confirm-section { display: flex; flex-direction: column; gap: $space-1; }
.checkbox-label {
  display: flex; align-items: center; gap: $space-2; cursor: pointer; color: $fg-dark;
}
.checkbox { accent-color: $brand-orange; width: 18px; height: 18px; }
.confirm-hint { font-size: 0.8rem; color: $ink-400; margin: 0; }
.muted { color: $ink-400; font-size: 0.85rem; }
.field-error { color: $signal-red; font-size: 0.82rem; }

.modal-overlay {
  position: fixed; inset: 0; z-index: 120;
  background: rgba($ink-1000, 0.78); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; padding: $space-4;
}
.modal-card {
  width: min(640px, 100%); background: $ink-1000; border: 1px solid rgba($brand-orange, 0.18);
  border-radius: 20px; padding: $space-5; box-shadow: 0 24px 80px rgba(0,0,0,0.45);
}
.modal-head {
  display: flex; justify-content: space-between; align-items: flex-start; gap: $space-3; margin-bottom: $space-4;
}
.modal-head h4 { margin: 0 0 $space-1; color: $fg-dark; }
.modal-head p { margin: 0; color: $ink-300; }
.close-btn { background: transparent; border: 1px solid rgba($brand-orange, 0.25); color: $brand-orange; border-radius: 10px; padding: $space-2 $space-3; cursor: pointer; }
.modal-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: $space-3; }
.field-block { display: flex; flex-direction: column; gap: $space-2; }
.select-input {
  width: 100%; border: 1px solid rgba($ink-500, 0.18); background: $ink-900; color: $fg-dark;
  border-radius: 12px; padding: $space-3 $space-4; font-family: inherit;
}
.modal-actions { display: flex; justify-content: flex-end; gap: $space-3; margin-top: $space-4; }

@media (max-width: 720px) { .modal-grid { grid-template-columns: 1fr; } }
</style>
