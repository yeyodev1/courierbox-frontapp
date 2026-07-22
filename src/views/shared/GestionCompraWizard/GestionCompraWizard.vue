<template>
  <div class="gc-root">
    <!-- ORDEN CONFIRMADA -->
    <div v-if="confirmed" key="confirmed" class="order-confirmed anim-pop">
      <div class="confirmed-badge">
        <i class="fa-solid fa-circle-check" aria-hidden="true" />
      </div>
      <span class="confirmed-eyebrow">Orden confirmada</span>
      <h2 class="confirmed-title">La venta quedó registrada</h2>
      <p class="confirmed-sub">
        Se envió la confirmación al cliente por correo con la imagen de la orden y los términos.
        Descarga la reserva como respaldo.
      </p>

      <div class="confirmed-card" ref="reservaRef">
        <div class="confirmed-card__head">
          <div>
            <strong>Courier Box Logistics</strong>
            <span>Comprobante de reserva</span>
          </div>
          <span class="confirmed-code">#{{ shortId }}</span>
        </div>
        <div class="confirmed-row">
          <span>Asesor</span><strong>{{ confirmed.asesorNombre || '—' }}</strong>
        </div>
        <div class="confirmed-row">
          <span>Cliente</span><strong>{{ confirmed.clienteNombre || '—' }}</strong>
        </div>
        <div class="confirmed-row highlight">
          <span>{{ esCourier ? 'Valor del servicio' : 'Precio final' }}</span><strong>${{ confirmed.valorTotal.toFixed(2) }}</strong>
        </div>
        <div class="confirmed-row">
          <span>{{ esCourier ? 'Abono del servicio' : 'Reserva (abono)' }}</span><strong>${{ confirmed.valorReserva.toFixed(2) }}</strong>
        </div>
        <div class="confirmed-row">
          <span>Saldo pendiente</span><strong>${{ (confirmed.valorTotal - confirmed.valorReserva).toFixed(2) }}</strong>
        </div>
        <div v-if="confirmed.paginaCompra" class="confirmed-row">
          <span>Tienda</span><strong>{{ confirmed.paginaCompra }}</strong>
        </div>
        <div v-if="confirmed.fecha" class="confirmed-row">
          <span>Entrega tentativa</span><strong>{{ confirmed.fecha }}</strong>
        </div>
        <div v-if="confirmed.imagenCompraUrl" class="confirmed-row image-row">
          <span>Imagen de la orden</span>
          <img :src="confirmed.imagenCompraUrl" alt="Orden" />
        </div>
      </div>

      <div class="confirmed-actions">
        <AppButton variant="primary" @click="descargarReserva">
          <i class="fa-solid fa-download" aria-hidden="true" /> Descargar reserva
        </AppButton>
        <AppButton variant="outline" @click="goToDetalle">
          <i class="fa-solid fa-eye" aria-hidden="true" /> Ver seguimiento
        </AppButton>
        <AppButton variant="ghost" @click="nuevaVenta">
          <i class="fa-solid fa-plus" aria-hidden="true" /> Nueva venta
        </AppButton>
      </div>
    </div>

    <!-- WIZARD -->
    <div v-else key="wizard" class="wizard anim-fade">
      <div class="wizard-header">
        <div class="step-label">
          <span class="step-counter">Paso {{ currentStep }} de {{ totalSteps }}</span>
          <h2 class="step-title">{{ currentStepLabel }}</h2>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>

      <div class="wizard-body">
        <!-- Explicit per-step render (no dynamic :is / no out-in transition) so
             the body can NEVER get stuck empty. The v-else fallback guarantees
             something is always shown even in an unexpected state. -->
        <div class="step-anim" :key="`${currentStepKey}-${renderNonce}`">
          <StepCliente v-if="currentStepKey === 'cliente'" ref="stepRef" />
          <StepAsesor v-else-if="currentStepKey === 'asesor'" ref="stepRef" />
          <StepValorTotal v-else-if="currentStepKey === 'valorTotal'" ref="stepRef" />
          <StepReserva v-else-if="currentStepKey === 'reserva'" ref="stepRef" />
          <StepCostoVenta v-else-if="currentStepKey === 'costoVenta'" ref="stepRef" />
          <StepComision v-else-if="currentStepKey === 'comision'" ref="stepRef" />
          <StepPaginaCompra v-else-if="currentStepKey === 'paginaCompra'" ref="stepRef" />
          <StepFechaEntrega v-else-if="currentStepKey === 'fechaEntrega'" ref="stepRef" />
          <StepImagenCompra v-else-if="currentStepKey === 'imagen'" ref="stepRef" />
          <StepResumen v-else-if="currentStepKey === 'resumen'" ref="stepRef" />
          <div v-else class="step-fallback">
            <i class="fa-solid fa-rotate" aria-hidden="true" />
            <p>Cargando este paso…</p>
            <button type="button" class="retry-btn" @click="retryStep">Reintentar</button>
          </div>
        </div>
      </div>

      <div class="wizard-footer">
        <AppButton
          v-if="currentStep > 1"
          variant="outline"
          @click="store.prevStep()"
          :disabled="isSubmitting"
        >
          Anterior
        </AppButton>
        <span class="spacer" />
        <AppButton
          v-if="currentStep < totalSteps"
          variant="primary"
          @click="handleNext"
          :disabled="isSubmitting"
        >
          Siguiente
        </AppButton>
        <AppButton
          v-else
          variant="primary"
          @click="handleSubmit"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Guardando...' : 'Confirmar orden' }}
        </AppButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGestionCompraFormStore } from '@/stores/gestion_compra_form.store'
import { gestionesCompraAPI } from '@/services/gestiones_compra.api'
import { useToastStore } from '@/stores/toast.store'
import { useAuthStore } from '@/stores/auth.store'
import AppButton from '@/components/ui/AppButton.vue'
import StepCliente from './StepCliente.vue'
import StepAsesor from './StepAsesor.vue'
import StepValorTotal from './StepValorTotal.vue'
import StepReserva from './StepReserva.vue'
import StepCostoVenta from './StepCostoVenta.vue'
import StepComision from './StepComision.vue'
import StepPaginaCompra from './StepPaginaCompra.vue'
import StepFechaEntrega from './StepFechaEntrega.vue'
import StepImagenCompra from './StepImagenCompra.vue'
import StepResumen from './StepResumen.vue'

const store = useGestionCompraFormStore()
const auth = useAuthStore()
const toast = useToastStore()
const router = useRouter()

const stepRef = ref<{ isValid: () => boolean } | null>(null)
const isSubmitting = ref(false)

interface ConfirmedOrder {
  id: string
  asesorNombre: string
  clienteNombre: string
  valorTotal: number
  valorReserva: number
  paginaCompra: string
  fecha: string
  imagenCompraUrl: string
}
const confirmed = ref<ConfirmedOrder | null>(null)

const currentStep = computed(() => store.currentStep)
const totalSteps = computed(() => store.totalSteps)
const currentStepLabel = computed(() => store.currentStepLabel)
const progressPercent = computed(() => store.progressPercent)
const currentStepKey = computed(() => store.currentStepKey)

// Bumping this remounts the current step (used by the fallback "Reintentar").
const renderNonce = ref(0)
function retryStep() {
  renderNonce.value++
}

const shortId = computed(() => (confirmed.value?.id ?? '').slice(-8).toUpperCase())
const esCourier = computed(() => store.formData.serviceType === 'logistica')

function handleNext() {
  const valid = stepRef.value?.isValid() ?? true
  if (!valid) return
  store.nextStep()
}

async function handleSubmit() {
  const valid = stepRef.value?.isValid() ?? true
  if (!valid) return

  isSubmitting.value = true
  store.isSubmitting = true

  try {
    const data = store.formData
    let imagenCompraUrl = data.imagenCompraUrl || undefined

    if (!imagenCompraUrl && data.imagenCompraFile) {
      imagenCompraUrl = await gestionesCompraAPI.uploadImagen(data.imagenCompraFile)
      store.formData.imagenCompraUrl = imagenCompraUrl
    }

    const notesParts = [data.notas?.trim(), supportNote(data.comprobanteEstado)].filter(Boolean)
    const serviceType = data.serviceType || undefined
      const gestion = await gestionesCompraAPI.create({
        asesorId: data.asesorId || undefined,
        contactoId: data.contactoId,
        valorTotal: Number(data.valorTotal) || 0,
        valorReserva: Number(data.valorReserva) || 0,
        cuentaBancariaId: data.cuentaBancariaId,
        costoVenta: Number(data.costoVenta) || 0,
        valorComision: Number(data.valorComision) || 0,
      feeConfigId: data.feeConfigId || undefined,
      paginaCompra: data.paginaCompra,
      fechaEntregaTentativa: data.fechaEntregaTentativa,
      imagenCompraUrl,
      serviceType,
      notas: notesParts.length ? notesParts.join(' | ') : undefined,
    })

    toast.showNotification('Orden confirmada y cliente notificado', 'success')

    confirmed.value = {
      id: String(gestion._id),
      asesorNombre: data.asesorNombre || auth.currentUser?.name || 'Courier Box',
      clienteNombre: data.contacto?.nombre ?? '',
      valorTotal: Number(data.valorTotal) || 0,
      valorReserva: Number(data.valorReserva) || 0,
      paginaCompra: data.paginaCompra ?? '',
      fecha: data.fechaEntregaTentativa
        ? new Date(data.fechaEntregaTentativa + 'T00:00:00').toLocaleDateString('es-EC', {
            year: 'numeric', month: 'long', day: 'numeric',
          })
        : '',
      imagenCompraUrl: imagenCompraUrl ?? data.imagenCompraPreview ?? '',
    }
  } catch (e: any) {
    toast.showNotification(e?.message ?? 'Error al guardar la gestión', 'error')
  } finally {
    isSubmitting.value = false
    store.isSubmitting = false
  }
}

function detalleBase() {
  const role = auth.userRole
  return ['admin', 'superadmin', 'gerencia'].includes(role ?? '')
    ? '/admin/gestiones-compra'
    : '/asesor/gestiones-compra'
}

function goToDetalle() {
  const id = confirmed.value?.id
  store.reset()
  const target = confirmed.value ? `${detalleBase()}/${id}` : detalleBase()
  confirmed.value = null
  router.push(target)
}

function nuevaVenta() {
  confirmed.value = null
  store.init({
    adminMode: store.isAdminMode,
    defaultAsesorId: auth.currentUser?.id ?? auth.currentUser?._id ?? '',
    defaultAsesorNombre: auth.currentUser?.name ?? '',
    defaultServiceType: store.isAdminMode ? '' : store.formData.serviceType,
  })
}

function descargarReserva() {
  const c = confirmed.value
  if (!c) return
  const win = window.open('', '_blank', 'width=720,height=900')
  if (!win) {
    toast.showNotification('Habilita las ventanas emergentes para descargar la reserva', 'error')
    return
  }
  const saldo = (c.valorTotal - c.valorReserva).toFixed(2)
  win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8" />
    <title>Reserva ${shortId.value}</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: Arial, Helvetica, sans-serif; color:#1a1a1a; margin:0; padding:32px; }
      .head { background:#f08a1f; color:#fff; padding:20px 24px; border-radius:12px 12px 0 0; }
      .head h1 { margin:0; font-size:20px; }
      .head span { font-size:12px; opacity:.9; }
      .box { border:1px solid #e5e5e5; border-top:none; border-radius:0 0 12px 12px; padding:24px; }
      .code { float:right; font-weight:bold; }
      table { width:100%; border-collapse:collapse; margin-top:12px; }
      td { padding:10px 8px; border-bottom:1px solid #eee; font-size:14px; }
      td.k { color:#777; width:180px; }
      td.v { font-weight:bold; text-align:right; }
      .total { color:#f08a1f; font-size:18px; }
      img { max-width:100%; margin-top:16px; border-radius:8px; border:1px solid #ddd; }
      .foot { margin-top:20px; font-size:11px; color:#999; text-align:center; }
      @media print { body { padding:0; } }
    </style></head><body>
    <div class="head"><span class="code">#${shortId.value}</span>
      <h1>Courier Box Logistics</h1><span>Comprobante de reserva — ORDEN CONFIRMADA</span></div>
    <div class="box">
      <table>
        <tr><td class="k">Asesor</td><td class="v">${escapeHtml(c.asesorNombre)}</td></tr>
        <tr><td class="k">Cliente</td><td class="v">${escapeHtml(c.clienteNombre)}</td></tr>
        <tr><td class="k">Precio final</td><td class="v total">$${c.valorTotal.toFixed(2)}</td></tr>
        <tr><td class="k">Reserva (abono)</td><td class="v">$${c.valorReserva.toFixed(2)}</td></tr>
        <tr><td class="k">Saldo pendiente</td><td class="v">$${saldo}</td></tr>
        ${c.paginaCompra ? `<tr><td class="k">Tienda</td><td class="v">${escapeHtml(c.paginaCompra)}</td></tr>` : ''}
        ${c.fecha ? `<tr><td class="k">Entrega tentativa</td><td class="v">${escapeHtml(c.fecha)}</td></tr>` : ''}
        <tr><td class="k">Fecha de emisión</td><td class="v">${new Date().toLocaleDateString('es-EC')}</td></tr>
      </table>
      ${c.imagenCompraUrl ? `<img src="${c.imagenCompraUrl}" alt="Orden" />` : ''}
      <div class="foot">Documento de respaldo interno · courierboxlogistics.com</div>
    </div>
    <script>window.onload=function(){setTimeout(function(){window.print();},300);}<\/script>
  </body></html>`)
  win.document.close()
}

function escapeHtml(str: string) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ))
}

function supportNote(state: string) {
  if (state === 'verificado') return 'Soporte: verificado sin comprobante adjunto'
  if (state === 'sin_soporte') return 'Soporte: sin comprobante'
  return 'Soporte: con comprobante adjunto'
}
</script>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.wizard {
  display: flex; flex-direction: column; gap: 0;
  background: $ink-900; border-radius: 16px;
  border: 1px solid $ink-500;
  overflow: hidden;
  max-width: 640px;
  margin: 0 auto;
}

.wizard-header {
  padding: $space-5 $space-6 $space-4;
  background: $ink-1000;
  border-bottom: 1px solid $ink-700;
}

.step-label { margin-bottom: $space-3; }
.step-counter { font-size: 0.78rem; color: $brand-orange; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
.step-title { color: $fg-dark; font-size: 1.25rem; font-weight: 700; margin: $space-1 0 0; }

.progress-track {
  height: 4px; background: $ink-700; border-radius: 2px; overflow: hidden;
}
.progress-fill {
  height: 100%; background: $brand-orange;
  border-radius: 2px; transition: width 0.35s ease;
}

.wizard-body {
  padding: $space-6;
  min-height: 320px;
}

.wizard-footer {
  display: flex; align-items: center;
  padding: $space-4 $space-6;
  border-top: 1px solid $ink-700;
  background: $ink-1000;
  gap: $space-3;
}
.spacer { flex: 1; }

/* step transition — CSS animation on the keyed wrapper (cannot blank the body) */
.step-anim { animation: stepIn 0.22s ease; }
@keyframes stepIn {
  from { opacity: 0; transform: translateX(12px); }
  to { opacity: 1; transform: translateX(0); }
}
.step-fallback {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: $space-3; min-height: 220px; color: $ink-400; text-align: center;
  i { font-size: 1.6rem; color: $brand-orange; }
  p { margin: 0; }
}
.retry-btn {
  border: 1px solid rgba($brand-orange, 0.3); background: rgba($brand-orange, 0.08);
  color: $brand-orange; border-radius: 10px; padding: $space-2 $space-4; cursor: pointer; font-weight: 700;
}

/* confirmed / wizard swap — plain CSS animations (no <transition> root) */
.gc-root { display: block; }
.anim-pop { animation: popIn 0.28s cubic-bezier(0.22, 1, 0.36, 1); }
.anim-fade { animation: fadeIn 0.2s ease; }
@keyframes popIn {
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.order-confirmed {
  max-width: 640px; margin: 0 auto;
  display: flex; flex-direction: column; align-items: center; gap: $space-3;
  background: $ink-900; border: 1px solid rgba($brand-orange, 0.2);
  border-radius: 20px; padding: $space-6; text-align: center;
}
.confirmed-badge {
  width: 68px; height: 68px; border-radius: 50%;
  background: rgba(43,187,146,0.14); color: $signal-green;
  display: flex; align-items: center; justify-content: center;
  font-size: 2rem;
}
.confirmed-eyebrow {
  color: $brand-orange; font-size: 0.74rem; font-weight: 800;
  letter-spacing: 0.08em; text-transform: uppercase;
}
.confirmed-title { margin: 0; color: $fg-dark; font-size: 1.5rem; }
.confirmed-sub { margin: 0; color: $ink-300; max-width: 460px; line-height: 1.55; }

.confirmed-card {
  width: 100%; text-align: left; margin-top: $space-3;
  background: $ink-1000; border: 1px solid $ink-700; border-radius: 14px;
  overflow: hidden;
}
.confirmed-card__head {
  display: flex; align-items: center; justify-content: space-between;
  padding: $space-4; background: rgba($brand-orange, 0.08);
  border-bottom: 1px solid $ink-700;
}
.confirmed-card__head strong { display: block; color: $fg-dark; }
.confirmed-card__head span { color: $ink-400; font-size: 0.78rem; }
.confirmed-code { color: $brand-orange; font-weight: 800; }
.confirmed-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: $space-3; padding: $space-3 $space-4; border-bottom: 1px solid $ink-700;
  &:last-child { border-bottom: none; }
  span { color: $ink-300; font-size: 0.85rem; }
  strong { color: $fg-dark; font-size: 0.9rem; }
  &.highlight strong { color: $brand-orange; font-size: 1.05rem; }
  &.image-row { flex-direction: column; align-items: flex-start; }
  &.image-row img { max-width: 160px; max-height: 120px; border-radius: 8px; margin-top: $space-2; object-fit: contain; }
}
.confirmed-actions {
  display: flex; flex-wrap: wrap; justify-content: center; gap: $space-3; margin-top: $space-4;
}
</style>
