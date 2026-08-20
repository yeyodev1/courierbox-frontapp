<script setup lang="ts">
/** The client-facing stage rail; clicking a step advances the gestión. */
import type { GestionCompraStage } from '@/services/gestiones_compra.api'
import { STAGE_STEPS, stageIndex } from './useGestionDetalle'

defineProps<{ stage: GestionCompraStage; label: string; progress: number }>()
const emit = defineEmits<{ 'set-stage': [stage: GestionCompraStage] }>()
</script>

<template>
  <section class="stage-reader card">
    <div class="panel-head">
      <h3><i class="fa-solid fa-route" aria-hidden="true" /> Stage del cliente</h3>
      <span>{{ label }}</span>
    </div>

    <div class="stage-track">
      <div class="stage-track__fill" :style="{ width: `${progress}%` }" />
    </div>

    <div class="stage-steps">
      <button
        v-for="step in STAGE_STEPS"
        :key="step.value"
        class="stage-step"
        :class="{ active: stage === step.value, done: stageIndex(stage) > stageIndex(step.value) }"
        @click="emit('set-stage', step.value)"
      >
        <span class="stage-step__dot"><i :class="step.icon" aria-hidden="true" /></span>
        <span class="stage-step__text">
          <strong>{{ step.label }}</strong>
          <small>{{ step.desc }}</small>
        </span>
      </button>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.18);
  border-radius: 20px;
}

.stage-reader {
  padding: $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;

  h3 { display: flex; align-items: center; gap: $space-2; margin: 0; font-size: 1rem; }
  span { color: $ink-400; font-size: 0.82rem; }
}

.stage-track {
  height: 4px;
  background: $ink-700;
  border-radius: 999px;
  overflow: hidden;

  &__fill {
    height: 100%;
    background: $brand-orange;
    border-radius: 999px;
    transition: width 0.25s ease;
  }
}

.stage-steps {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
}

.stage-step {
  flex: 1 1 180px;
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3;
  border-radius: 14px;
  border: 1px solid rgba($ink-500, 0.22);
  background: $ink-1000;
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;

  &.active { border-color: $brand-orange; background: rgba($brand-orange, 0.08); }
  &.done { border-color: rgba($signal-green, 0.25); }

  &__dot {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    background: rgba($brand-orange, 0.12);
    color: $brand-orange;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;

    strong { font-size: 0.92rem; }
    small { color: $ink-400; line-height: 1.4; }
  }
}

@media (prefers-reduced-motion: reduce) {
  .stage-track__fill { transition: none; }
}
</style>
