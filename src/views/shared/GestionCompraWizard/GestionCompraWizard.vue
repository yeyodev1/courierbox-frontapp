<script setup lang="ts">
/** Step-by-step sale capture, ending in the confirmed order's reservation slip. */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGestionCompraFormStore } from '@/stores/gestion_compra_form.store'
import { gestionesCompraAPI } from '@/services/gestiones_compra.api'
import { useToastStore } from '@/stores/toast.store'
import { useAuthStore } from '@/stores/auth.store'
import AppButton from '@/components/ui/AppButton.vue'
import OrdenConfirmada from './OrdenConfirmada.vue'
import { printReserva, supportNote, type ReservaData } from './reserva-print'
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
const confirmed = ref<ReservaData | null>(null)

// Bumping this remounts the current step (used by the fallback "Reintentar").
const renderNonce = ref(0)

const currentStep = computed(() => store.currentStep)
const totalSteps = computed(() => store.totalSteps)
const currentStepKey = computed(() => store.currentStepKey)
const esCourier = computed(() => store.formData.serviceType === 'logistica')

function handleNext() {
  if (stepRef.value?.isValid() ?? true) store.nextStep()
}

async function handleSubmit() {
  if (!(stepRef.value?.isValid() ?? true)) return

  isSubmitting.value = true
  store.isSubmitting = true

  try {
    const data = store.formData
    let imagenCompraUrl = data.imagenCompraUrl || undefined

    if (!imagenCompraUrl && data.imagenCompraFile) {
      imagenCompraUrl = await gestionesCompraAPI.uploadImagen(data.imagenCompraFile)
      store.formData.imagenCompraUrl = imagenCompraUrl
    }

    const notes = [data.notas?.trim(), supportNote(data.comprobanteEstado)].filter(Boolean)

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
      serviceType: data.serviceType || undefined,
      notas: notes.length ? notes.join(' | ') : undefined,
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
        ? new Date(`${data.fechaEntregaTentativa}T00:00:00`).toLocaleDateString('es-EC', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : '',
      imagenCompraUrl: imagenCompraUrl ?? data.imagenCompraPreview ?? '',
    }
  } catch (e: unknown) {
    toast.showNotification((e as Error)?.message ?? 'Error al guardar la gestión', 'error')
  } finally {
    isSubmitting.value = false
    store.isSubmitting = false
  }
}

/** Admins and asesores read the same gestión under their own section. */
function detalleBase() {
  return ['admin', 'superadmin', 'gerencia'].includes(auth.userRole ?? '')
    ? '/admin/gestiones-compra'
    : '/asesor/gestiones-compra'
}

function goToDetalle() {
  const id = confirmed.value?.id
  store.reset()
  const target = id ? `${detalleBase()}/${id}` : detalleBase()
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
  if (!confirmed.value) return
  if (!printReserva(confirmed.value)) {
    toast.showNotification('Habilita las ventanas emergentes para descargar la reserva', 'error')
  }
}
</script>

<template>
  <div class="gc-root">
    <OrdenConfirmada
      v-if="confirmed"
      :reserva="confirmed"
      :es-courier="esCourier"
      @descargar="descargarReserva"
      @ver-detalle="goToDetalle"
      @nueva="nuevaVenta"
    />

    <div v-else class="wizard anim-fade">
      <div class="wizard-header">
        <div class="step-label">
          <span class="step-counter">Paso {{ currentStep }} de {{ totalSteps }}</span>
          <h2 class="step-title">{{ store.currentStepLabel }}</h2>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${store.progressPercent}%` }" />
        </div>
      </div>

      <div class="wizard-body">
        <!-- Explicit per-step render (no dynamic :is / no out-in transition) so
             the body can NEVER get stuck empty. The v-else fallback guarantees
             something is always shown even in an unexpected state. -->
        <div :key="`${currentStepKey}-${renderNonce}`" class="step-anim">
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
            <button type="button" class="retry-btn" @click="renderNonce++">Reintentar</button>
          </div>
        </div>
      </div>

      <div class="wizard-footer">
        <AppButton v-if="currentStep > 1" variant="outline" :disabled="isSubmitting" @click="store.prevStep()">
          Anterior
        </AppButton>
        <span class="spacer" />
        <AppButton v-if="currentStep < totalSteps" variant="primary" :disabled="isSubmitting" @click="handleNext">
          Siguiente
        </AppButton>
        <AppButton v-else variant="primary" :disabled="isSubmitting" @click="handleSubmit">
          {{ isSubmitting ? 'Guardando...' : 'Confirmar orden' }}
        </AppButton>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.gc-root { display: block; }

.wizard {
  display: flex;
  flex-direction: column;
  background: $ink-900;
  border-radius: 16px;
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

.step-counter {
  font-size: 0.78rem;
  color: $brand-orange;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.step-title {
  color: $fg-dark;
  font-size: 1.25rem;
  font-weight: 700;
  margin: $space-1 0 0;
}

.progress-track {
  height: 4px;
  background: $ink-700;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: $brand-orange;
  border-radius: 2px;
  transition: width 0.35s ease;
}

.wizard-body {
  padding: $space-6;
  min-height: 320px;
}

.wizard-footer {
  display: flex;
  align-items: center;
  padding: $space-4 $space-6;
  border-top: 1px solid $ink-700;
  background: $ink-1000;
  gap: $space-3;
}

.spacer { flex: 1; }

/* Step transition is a CSS animation on the keyed wrapper — a <transition>
   here could leave the body blank between steps. */
.step-anim { animation: stepIn 0.22s ease; }
.anim-fade { animation: fadeIn 0.2s ease; }

@keyframes stepIn {
  from { opacity: 0; transform: translateX(12px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.step-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  min-height: 220px;
  color: $ink-400;
  text-align: center;

  i { font-size: 1.6rem; color: $brand-orange; }
  p { margin: 0; }
}

.retry-btn {
  border: 1px solid rgba($brand-orange, 0.3);
  background: rgba($brand-orange, 0.08);
  color: $brand-orange;
  border-radius: 10px;
  padding: $space-2 $space-4;
  font-family: inherit;
  font-weight: 700;
  cursor: pointer;
}

@media (prefers-reduced-motion: reduce) {
  .step-anim,
  .anim-fade { animation: none; }
  .progress-fill { transition: none; }
}
</style>
