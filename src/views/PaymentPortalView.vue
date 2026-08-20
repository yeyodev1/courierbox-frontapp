<script setup lang="ts">
/** Public portal: look up your invoices by locker code and register a transfer. */
import FacturaCard from './PaymentPortal/FacturaCard.vue'
import RegistrarPagoForm from './PaymentPortal/RegistrarPagoForm.vue'
import { formatMoney, usePaymentPortal } from './PaymentPortal/usePaymentPortal'

const p = usePaymentPortal()

async function onSubmit(referencia: string, comprobante: File | null) {
  await p.enviarPago(referencia, comprobante)
}
</script>

<template>
  <div class="payment-portal">
    <section class="hero-section">
      <div class="container">
        <h1>Mis Pagos</h1>
        <p class="subtitle">Consulta tus facturas pendientes y registra tus transferencias</p>
      </div>
    </section>

    <section class="content-section container">
      <div v-if="!p.cliente.value" class="login-card glass-card">
        <div class="card-header">
          <div class="icon-wrapper"><i class="fa-solid fa-lock" /></div>
          <h2>Ingresa con tu Código de Casillero</h2>
        </div>
        <form @submit.prevent="p.buscarDeudas">
          <div class="form-group">
            <label>Código de Casillero</label>
            <input
              v-model="p.casillero.value"
              type="text"
              placeholder="Ej. SH12345"
              required
              class="input-lg"
            />
          </div>
          <div v-if="p.errorMsg.value" class="error-message">
            <i class="fa-solid fa-circle-exclamation" />
            {{ p.errorMsg.value }}
          </div>
          <button type="submit" class="submit-btn" :disabled="p.loading.value || !p.casillero.value.trim()">
            <span v-if="!p.loading.value">Consultar Deuda</span>
            <span v-else class="loader" />
          </button>
        </form>
      </div>

      <div v-else class="deudas-section">
        <div class="cliente-info glass-card">
          <div class="card-header">
            <div class="icon-wrapper"><i class="fa-solid fa-user" /></div>
            <div>
              <h2>{{ p.cliente.value.nombre }}</h2>
              <p class="casillero-label">Casillero: {{ p.cliente.value.casillero }}</p>
            </div>
          </div>

          <div class="deuda-total">
            <span class="label">Total Adeudado</span>
            <span class="amount">{{ formatMoney(p.totalDeuda.value) }}</span>
          </div>

          <button class="btn-secondary" @click="p.reset">
            <i class="fa-solid fa-arrow-left" /> Cambiar casillero
          </button>
        </div>

        <div v-if="!p.facturas.value.length" class="empty-state glass-card">
          <i class="fa-solid fa-check-circle fa-3x" style="color: #22c55e" />
          <p>No tienes facturas pendientes. ¡Todo al día!</p>
        </div>

        <div v-if="p.seleccionables.value.length > 1" class="seleccion-bar glass-card">
          <label class="select-all">
            <input type="checkbox" :checked="p.todasSeleccionadas.value" @change="p.alternarTodas" />
            <span>Seleccionar todas</span>
          </label>
          <span class="seleccion-count">
            {{ p.seleccionadas.value.length }} de {{ p.seleccionables.value.length }} ·
            {{ formatMoney(p.totalSeleccionado.value) }}
          </span>
        </div>

        <FacturaCard
          v-for="factura in p.facturas.value"
          :key="factura._id"
          :factura="factura"
          :seleccionada="p.seleccion.value.has(factura._id)"
          @toggle="p.alternar(factura._id)"
        />

        <RegistrarPagoForm
          v-if="p.facturas.value.length"
          :submitting="p.submitting.value"
          :seleccionadas="p.seleccionadas.value.length"
          :total="p.totalSeleccionado.value"
          @submit="onSubmit"
        />
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:color';
@use '@/styles/tokens/colors' as *;
@use './PaymentPortal/portal-ui' as ui;

@include ui.card;
@include ui.form;

.payment-portal {
  min-height: 100vh;
  background: $ink-1000;
  color: $fg-dark;
}

.hero-section {
  padding: 160px 0 60px;
  text-align: center;
  background: linear-gradient(135deg, $ink-1000 0%, color.adjust($ink-1000, $lightness: 5%) 100%);

  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, $fg-dark, $brand-orange);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle { color: $muted-dark; font-size: 1.1rem; }
}

.content-section {
  padding-bottom: 100px;
  max-width: 720px;
  margin: 0 auto;
}

.input-lg {
  font-size: 1.25rem !important;
  text-align: center;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.btn-secondary {
  padding: 0.6rem 1.25rem;
  background: rgba($fg-dark, 0.08);
  border: 1px solid rgba($fg-dark, 0.12);
  border-radius: 10px;
  color: $muted-dark;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;

  &:hover { background: rgba($fg-dark, 0.12); }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ef4444;
  background: rgba(#ef4444, 0.1);
  padding: 0.75rem 1rem;
  border-radius: 10px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.cliente-info {
  .deuda-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 0;
    border-top: 1px solid rgba($fg-dark, 0.08);
    border-bottom: 1px solid rgba($fg-dark, 0.08);
    margin-bottom: 1rem;

    .label { color: $muted-dark; font-size: 1rem; }
    .amount { font-size: 2rem; font-weight: 700; color: $brand-orange; }
  }

  .casillero-label {
    color: $muted-dark;
    font-size: 0.85rem;
    margin-top: 0.25rem;
  }
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;

  p { color: $muted-dark; margin-top: 1rem; }
}

.seleccion-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1.25rem;
  flex-wrap: wrap;
}

.select-all {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  font-weight: 600;

  input { width: 18px; height: 18px; accent-color: $brand-orange; }
}

.seleccion-count {
  font-size: 0.88rem;
  opacity: 0.8;
  font-variant-numeric: tabular-nums;
}
</style>
