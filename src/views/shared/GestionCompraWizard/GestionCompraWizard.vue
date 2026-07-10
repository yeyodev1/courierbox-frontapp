<template>
  <div class="wizard">
    <!-- Header progreso -->
    <div class="wizard-header">
      <div class="step-label">
        <span class="step-counter">Paso {{ currentStep }} de {{ totalSteps }}</span>
        <h2 class="step-title">{{ currentStepLabel }}</h2>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
    </div>

    <!-- Step content -->
    <div class="wizard-body">
      <StepCliente v-if="realStep === 1" ref="stepRef" />
      <StepAsesor v-else-if="isAdminMode && realStep === 2" ref="stepRef" />
      <StepValorTotal v-else-if="realStep === 3" ref="stepRef" />
      <StepReserva v-else-if="realStep === 4" ref="stepRef" />
      <StepCostoVenta v-else-if="realStep === 5" ref="stepRef" />
      <StepComision v-else-if="realStep === 6" ref="stepRef" />
      <StepPaginaCompra v-else-if="realStep === 7" ref="stepRef" />
      <StepFechaEntrega v-else-if="realStep === 8" ref="stepRef" />
      <StepImagenCompra v-else-if="realStep === 9" ref="stepRef" />
      <StepResumen v-else-if="realStep === 10" ref="stepRef" />
    </div>

    <!-- Footer navigation -->
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
        {{ isSubmitting ? 'Guardando...' : 'Guardar gestión' }}
      </AppButton>
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

const props = defineProps<{
  redirectOnSuccess?: string
}>()

const store = useGestionCompraFormStore()
const auth = useAuthStore()
const toast = useToastStore()
const router = useRouter()

const stepRef = ref<{ isValid: () => boolean } | null>(null)
const isSubmitting = ref(false)

const currentStep = computed(() => store.currentStep)
const totalSteps = computed(() => store.totalSteps)
const currentStepLabel = computed(() => store.currentStepLabel)
const progressPercent = computed(() => store.progressPercent)
const isAdminMode = computed(() => store.isAdminMode)
const realStep = computed(() => store.realStepIndex)

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
        valorTotal: data.valorTotal ?? 0,
        valorReserva: data.valorReserva ?? 0,
        cuentaBancariaId: data.cuentaBancariaId,
        costoVenta: data.costoVenta ?? 0,
        valorComision: data.valorComision ?? 0,
        feeConfigId: data.feeConfigId || undefined,
        paginaCompra: data.paginaCompra,
        fechaEntregaTentativa: data.fechaEntregaTentativa,
        imagenCompraUrl,
        serviceType,
        notas: notesParts.length ? notesParts.join(' | ') : undefined,
      })

    toast.showNotification('Gestión guardada y cliente notificado', 'success')
    store.reset()

    const role = auth.userRole
    const base = ['admin', 'superadmin', 'gerencia'].includes(role ?? '')
      ? '/admin/gestiones-compra'
      : '/asesor/gestiones-compra'
    router.push(`${base}/${gestion._id}`)
  } catch (e: any) {
    toast.showNotification(e?.message ?? 'Error al guardar la gestión', 'error')
  } finally {
    isSubmitting.value = false
    store.isSubmitting = false
  }
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
</style>
