<script setup lang="ts">
/** The asesor's sales desk: month KPIs, recent sales and the new-sale wizard. */
import { onMounted, ref } from 'vue'
import GestionCompraWizard from '@/views/shared/GestionCompraWizard/GestionCompraWizard.vue'
import TipoGestionModal from './NuevaGestion/TipoGestionModal.vue'
import GestionAvisoModal from './NuevaGestion/GestionAvisoModal.vue'
import VentasResumen from './NuevaGestion/VentasResumen.vue'
import VentasInicio from './NuevaGestion/VentasInicio.vue'
import VentaProgreso from './NuevaGestion/VentaProgreso.vue'
import { useNuevaGestion } from './NuevaGestion/useNuevaGestion'

const wizardRef = ref<HTMLElement | null>(null)
const g = useNuevaGestion(wizardRef)

onMounted(g.load)
</script>

<template>
  <div class="ventas-page">
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow"><i class="fa-solid fa-bag-shopping" aria-hidden="true" /> Ventas del asesor</span>
        <h1>Registra la venta, cobra la reserva y deja el historial listo para el cliente.</h1>
        <p>Conecta cliente, cuenta de pago, comprobante y notificación automática con imagen y términos.</p>
      </div>
      <div class="hero-actions">
        <button class="primary-action" @click="g.showTypeModal.value = true">
          <i class="fa-solid fa-plus" aria-hidden="true" /> Nueva venta
        </button>
        <router-link to="/asesor/gestiones-compra" class="ghost-link">
          <i class="fa-solid fa-clock-rotate-left" aria-hidden="true" /> Ver historial
        </router-link>
        <button class="btn-back" @click="$router.back()">
          <i class="fa-solid fa-arrow-left" aria-hidden="true" /> Volver
        </button>
      </div>
    </section>

    <VentasResumen
      :stats="g.stats.value"
      :pendientes="g.pendingCount.value"
      :loading="g.loadingSummary.value"
    />

    <div class="flow-swap">
      <VentasInicio
        v-if="!g.serviceType.value"
        :recientes="g.recentGestiones.value"
        :loading="g.loadingRecent.value"
        @nueva="g.showTypeModal.value = true"
      />

      <section v-if="g.serviceType.value" ref="wizardRef" class="flow anim-fade">
        <div class="flow-banner">
          <div class="flow-banner__copy">
            <span class="eyebrow"><i class="fa-solid fa-circle-check" aria-hidden="true" /> Tipo elegido</span>
            <h3><i class="fa-solid fa-layer-group" aria-hidden="true" /> {{ g.serviceLabel.value }}</h3>
            <p>Sigue: cliente, monto, reserva, soporte y resumen.</p>
          </div>
          <button class="service-secondary" @click="g.showTypeModal.value = true">
            <i class="fa-solid fa-rotate-left" aria-hidden="true" /> Cambiar tipo
          </button>
        </div>

        <VentaProgreso
          :paso="g.store.currentStep"
          :total-pasos="g.store.totalSteps"
          :paso-label="g.store.currentStepLabel"
          :porcentaje="g.store.progressPercent"
          :checklist="g.liveChecklist.value"
        />

        <div class="wizard-panel">
          <GestionCompraWizard />
        </div>
      </section>
    </div>

    <GestionAvisoModal
      :open="g.showResumeModal.value"
      label="Retomar venta"
      title="Retomamos tu venta"
      icon="fa-solid fa-rotate-left"
      tone="info"
      @close="g.showResumeModal.value = false"
    >
      Recuperamos una venta en progreso que no habías terminado. ¿Quieres continuar donde quedaste?
      <template #actions>
        <button class="danger-action ghost" @click="g.resumeDiscard">
          <i class="fa-solid fa-trash-can" aria-hidden="true" /> Empezar de nuevo
        </button>
        <button class="primary-action" @click="g.showResumeModal.value = false">
          <i class="fa-solid fa-play" aria-hidden="true" /> Continuar
        </button>
      </template>
    </GestionAvisoModal>

    <GestionAvisoModal
      :open="g.showLeaveModal.value"
      layer="nested"
      label="Salir de la venta"
      title="¿Salir de la venta?"
      icon="fa-solid fa-triangle-exclamation"
      @close="g.cancelLeave"
    >
      Tienes una venta en progreso. Si sales ahora <strong>se perderá el progreso</strong> que no hayas confirmado.
      <template #actions>
        <button class="service-secondary" @click="g.cancelLeave">
          <i class="fa-solid fa-arrow-left" aria-hidden="true" /> Seguir aquí
        </button>
        <button class="danger-action" @click="g.confirmLeave">
          <i class="fa-solid fa-xmark" aria-hidden="true" /> Salir y descartar
        </button>
      </template>
    </GestionAvisoModal>

    <TipoGestionModal
      :open="g.showTypeModal.value"
      @close="g.showTypeModal.value = false"
      @select="g.selectServiceType"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.ventas-page { display: flex; flex-direction: column; gap: $space-6; }

.hero {
  display: flex;
  justify-content: space-between;
  gap: $space-5;
  flex-wrap: wrap;

  @media (max-width: 980px) { flex-direction: column; }
}

.hero-copy {
  h1 { margin: 0 0 $space-2; font-size: 1.95rem; line-height: 1.08; }
  p { margin: 0; max-width: 740px; color: $ink-300; line-height: 1.65; }
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.72rem;
  color: $brand-orange;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: flex-end;
  gap: $space-3;
  min-width: 280px;

  @media (max-width: 980px) { align-items: flex-start; justify-content: flex-start; min-width: 0; }
}

.primary-action {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  border: none;
  border-radius: 14px;
  padding: $space-3 $space-5;
  background: $brand-orange;
  color: $ink-1000;
  font-family: inherit;
  font-weight: 700;
  cursor: pointer;
}

.ghost-link,
.btn-back {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  border: 1px solid rgba($ink-500, 0.35);
  border-radius: 14px;
  padding: $space-3 $space-4;
  background: transparent;
  color: $ink-200;
  font-family: inherit;
  text-decoration: none;
  cursor: pointer;
}

.flow-swap { display: flex; flex-direction: column; }
.flow { display: flex; flex-direction: column; gap: $space-5; }

.flow-banner {
  display: flex;
  justify-content: space-between;
  gap: $space-4;
  padding: $space-5;
  border-radius: 20px;
  border: 1px solid rgba($brand-orange, 0.2);
  background: $ink-900;

  @media (max-width: 980px) { flex-direction: column; align-items: flex-start; }

  &__copy {
    h3 { display: flex; align-items: center; gap: $space-2; margin: 0 0 4px; font-size: 1.15rem; }
    p { margin: 0; color: $ink-300; }
  }
}

.service-secondary {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  border: 1px solid rgba($ink-500, 0.4);
  border-radius: 14px;
  padding: $space-3 $space-4;
  background: transparent;
  color: $ink-200;
  font-family: inherit;
  cursor: pointer;
}

.danger-action {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  border: 1px solid rgba($signal-red, 0.4);
  background: rgba($signal-red, 0.12);
  color: $signal-red;
  border-radius: 14px;
  padding: $space-3 $space-4;
  font-family: inherit;
  font-weight: 700;
  cursor: pointer;

  &:hover { background: rgba($signal-red, 0.2); }

  &.ghost {
    background: transparent;
    border-color: rgba($ink-500, 0.5);
    color: $ink-300;

    &:hover { background: rgba($ink-500, 0.12); color: $fg-dark; }
  }
}

.wizard-panel { width: 100%; }
.anim-fade { animation: fadeInUp 0.24s ease; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .anim-fade { animation: none; }
}
</style>
