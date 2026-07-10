<template>
  <div class="step-resumen">
    <h3 class="step__title">Resumen de la gestión</h3>
    <p class="step__desc">Revisa todo antes de guardar. Al guardar, se notificará al cliente automáticamente.</p>

    <div class="summary-card">
      <div class="summary-row">
        <span class="label">Cliente</span>
        <span class="value">{{ store.formData.contacto?.nombre ?? '—' }}</span>
      </div>
      <div v-if="store.isAdminMode" class="summary-row">
        <span class="label">Asesor</span>
        <span class="value">{{ store.formData.asesorNombre || '—' }}</span>
      </div>
      <div class="summary-row highlight-row">
        <span class="label">Valor total</span>
        <span class="value orange">${{ (store.formData.valorTotal ?? 0).toFixed(2) }}</span>
      </div>
      <div class="summary-row">
        <span class="label">Reserva</span>
        <span class="value">${{ (store.formData.valorReserva ?? 0).toFixed(2) }}</span>
      </div>
      <div class="summary-row">
        <span class="label">Cuenta de pago</span>
        <span class="value">{{ cuentaText }}</span>
      </div>
      <div class="summary-row">
        <span class="label">Modo de gestión</span>
        <span class="value">{{ serviceTypeLabel }}</span>
      </div>
      <div v-if="store.formData.reservaConfirmada" class="summary-row">
        <span class="label">Reserva confirmada</span>
        <span class="value green">Sí ✓</span>
      </div>
      <div class="summary-row">
        <span class="label">Costo de venta</span>
        <span class="value">${{ (store.formData.costoVenta ?? 0).toFixed(2) }}</span>
      </div>
      <div class="summary-row">
        <span class="label">Comisión</span>
        <span class="value">${{ (store.formData.valorComision ?? 0).toFixed(2) }}</span>
      </div>
      <div class="summary-row">
        <span class="label">Página de compra</span>
        <span class="value text-sm">{{ store.formData.paginaCompra }}</span>
      </div>
      <div class="summary-row">
        <span class="label">Entrega tentativa</span>
        <span class="value">{{ fechaFormateada }}</span>
      </div>
      <div v-if="store.formData.imagenCompraUrl || store.formData.imagenCompraPreview" class="summary-row">
        <span class="label">Imagen</span>
        <img :src="store.formData.imagenCompraUrl || store.formData.imagenCompraPreview" alt="Compra" class="preview-thumb" />
      </div>
      <div class="summary-row">
        <span class="label">Soporte</span>
        <span class="value">{{ soporteLabel }}</span>
      </div>
      <div v-if="store.formData.notas" class="summary-row">
        <span class="label">Notas</span>
        <span class="value text-sm muted">{{ store.formData.notas }}</span>
      </div>
    </div>

    <div class="notification-info">
      <span class="bell"><i class="fa-solid fa-bell" aria-hidden="true" /></span>
      <p>Al guardar se enviará automáticamente: <strong>email al cliente</strong>, <strong>WhatsApp vía GHL</strong> y se generará un <strong>enlace de seguimiento</strong>.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGestionCompraFormStore } from '@/stores/gestion_compra_form.store'

const store = useGestionCompraFormStore()

const cuentaText = computed(() => {
  const c = store.formData.cuentaBancaria
  if (!c) return '—'
  return `${c.banco} · ${c.numeroCuenta}`
})

const fechaFormateada = computed(() => {
  if (!store.formData.fechaEntregaTentativa) return '—'
  return new Date(store.formData.fechaEntregaTentativa + 'T00:00:00').toLocaleDateString('es-EC', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
})

const serviceTypeLabel = computed(() =>
  store.formData.serviceType === 'logistica' ? 'Solo courier' : 'Compra total'
)

const soporteLabel = computed(() => {
  if (store.formData.comprobanteEstado === 'verificado') return 'Verificado sin archivo'
  if (store.formData.comprobanteEstado === 'sin_soporte') return 'Sin soporte'
  return 'Con comprobante'
})

defineExpose({ isValid: () => true })
</script>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
.step-resumen { display: flex; flex-direction: column; gap: $space-4; }
.step__title { color: $fg-dark; font-size: 1.1rem; margin: 0; }
.step__desc { color: $ink-300; font-size: 0.9rem; margin: 0; }
.summary-card {
  background: $ink-900; border: 1px solid $ink-500; border-radius: 12px;
  overflow: hidden;
}
.summary-row {
  display: grid; grid-template-columns: 140px 1fr;
  gap: $space-2; padding: $space-3 $space-4;
  border-bottom: 1px solid $ink-700;
  &:last-child { border-bottom: none; }
  &.highlight-row { background: rgba(240,138,31,0.05); }
}
.label { color: $ink-300; font-size: 0.85rem; }
.value { color: $fg-dark; font-size: 0.9rem; font-weight: 500; word-break: break-all; }
.orange { color: $brand-orange; font-weight: 700; font-size: 1rem; }
.green { color: $signal-green; }
.muted { color: $ink-400; }
.text-sm { font-size: 0.82rem; }
.preview-thumb { max-width: 120px; max-height: 80px; border-radius: 6px; object-fit: contain; }
.notification-info {
  display: flex; gap: $space-3; align-items: flex-start;
  background: rgba(43,187,146,0.08); border: 1px solid rgba(43,187,146,0.3);
  border-radius: 10px; padding: $space-3 $space-4;
  p { color: $ink-300; font-size: 0.85rem; line-height: 1.5; margin: 0; }
  strong { color: $fg-dark; }
}
.bell { color: $brand-orange; font-size: 1.2rem; line-height: 1; }
</style>
