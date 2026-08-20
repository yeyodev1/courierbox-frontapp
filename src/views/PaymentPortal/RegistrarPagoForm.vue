<script setup lang="ts">
/** Transfer receipt for the selected invoices. */
import { ref } from 'vue'
import AppFileUpload from '@/components/ui/AppFileUpload.vue'
import { formatMoney } from './usePaymentPortal'

const props = defineProps<{ submitting: boolean; seleccionadas: number; total: number }>()
const emit = defineEmits<{ submit: [referencia: string, comprobante: File | null] }>()

const referencia = ref('')
const comprobante = ref<File | null>(null)

function submit() {
  emit('submit', referencia.value, comprobante.value)
  // The parent reloads on success; clearing here keeps a retry from resending
  // the same receipt by accident.
  if (!props.submitting) {
    referencia.value = ''
    comprobante.value = null
  }
}
</script>

<template>
  <div class="pago-form glass-card">
    <div class="card-header">
      <div class="icon-wrapper"><i class="fa-solid fa-credit-card" /></div>
      <h2>Registrar Pago</h2>
    </div>

    <div class="resumen-pago">
      <span>Vas a pagar</span>
      <strong>{{ formatMoney(total) }}</strong>
      <small>{{ seleccionadas }} factura(s) seleccionada(s)</small>
    </div>

    <p v-if="!seleccionadas" class="seleccion-vacia">
      <i class="fa-solid fa-circle-info" />
      Selecciona al menos una factura para registrar tu pago.
    </p>

    <form @submit.prevent="submit">
      <div class="form-group">
        <label>Referencia de Transferencia *</label>
        <input v-model="referencia" type="text" placeholder="Número de referencia o comprobante" required />
      </div>

      <div class="form-group">
        <AppFileUpload
          v-model="comprobante"
          label="Comprobante de Pago *"
          accept="image/*,.pdf"
          hint="Sube una foto o PDF nítido. Lo almacenamos de forma segura con Cloudinary."
        />
      </div>

      <button
        type="submit"
        class="submit-btn"
        :disabled="submitting || !referencia.trim() || !comprobante || !seleccionadas"
      >
        <span v-if="!submitting">Enviar Comprobante</span>
        <span v-else class="loader" />
      </button>
      <p class="form-footnote">Tu pago será verificado por nuestro equipo y tus paquetes serán despachados.</p>
    </form>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use './portal-ui' as ui;

@include ui.card;
@include ui.form;

.resumen-pago {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0.9rem 1.1rem;
  margin-bottom: 1rem;
  border-radius: 12px;
  background: rgba($brand-orange, 0.1);
  border: 1px solid rgba($brand-orange, 0.28);

  span { font-size: 0.78rem; opacity: 0.75; text-transform: uppercase; letter-spacing: 0.05em; }
  strong { font-size: 1.6rem; color: $brand-orange; font-variant-numeric: tabular-nums; }
  small { font-size: 0.78rem; opacity: 0.7; }
}

.seleccion-vacia {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  font-size: 0.85rem;
  opacity: 0.8;
}

.form-footnote {
  text-align: center;
  color: $muted-dark;
  font-size: 0.8rem;
  margin-top: 1rem;
}
</style>
