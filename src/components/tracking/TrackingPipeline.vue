<script setup lang="ts">
import { computed } from "vue";
import type { EstadoCanonico } from "@/services/tracking";

const props = defineProps<{ estado: EstadoCanonico }>();

const stages = [
  { key: "creado", label: "Recibido", short: "01" },
  { key: "en_bodega_miami", label: "Bodega Miami", short: "02" },
  { key: "en_transito", label: "En tránsito", short: "03" },
  { key: "en_aduana", label: "Aduana", short: "04" },
  { key: "en_distribucion", label: "Distribución", short: "05" },
  { key: "entregado", label: "Entregado", short: "06" },
] as const;

const order: Record<EstadoCanonico, number> = {
  creado: 0,
  en_bodega_miami: 1,
  en_transito: 2,
  en_aduana: 3,
  en_distribucion: 4,
  entregado: 5,
  incidencia: 2,
  desconocido: 0,
};

const activeIdx = computed(() => order[props.estado] ?? 0);
const progressPct = computed(() => {
  const total = stages.length - 1;
  return Math.round((activeIdx.value / total) * 100);
});
</script>

<template>
  <div class="pipeline">
    <div class="pipeline__rail">
      <div class="pipeline__fill" :style="{ width: `${progressPct}%` }" />
    </div>
    <ol class="pipeline__steps">
      <li
        v-for="(s, i) in stages"
        :key="s.key"
        :class="[
          'pipeline__step',
          {
            'is-done': i < activeIdx,
            'is-active': i === activeIdx,
          },
        ]"
      >
        <span class="pipeline__node" aria-hidden="true">
          <span class="pipeline__num">{{ s.short }}</span>
        </span>
        <span class="pipeline__label">{{ s.label }}</span>
      </li>
    </ol>
  </div>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;
@use "@/styles/mixins/responsive" as *;

.pipeline {
  position: relative;
  padding-block: 0.5rem;

  &__rail {
    position: absolute;
    top: 19px;
    left: 18px;
    right: 18px;
    height: 2px;
    background: rgba($ink-100, 0.08);
    border-radius: 2px;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: linear-gradient(90deg, $brand-orange-deep, $brand-orange, $brand-orange-soft);
    transition: width 1.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &__steps {
    position: relative;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 0.5rem;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  &__step {
    display: grid;
    justify-items: center;
    text-align: center;
    gap: 0.5rem;
    min-width: 0;
  }

  &__node {
    width: 38px;
    height: 38px;
    border-radius: 999px;
    background: $ink-1000;
    border: 2px solid rgba($ink-100, 0.12);
    display: inline-grid;
    place-items: center;
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    z-index: 2;
  }

  &__num {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0;
    color: var(--fg-faint);
    transition: color 0.3s ease;
  }

  &__label {
    font-size: 0.7rem;
    color: var(--fg-faint);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    transition: color 0.3s ease;
    @include sm { font-size: 0.78rem; }
  }

  &__step.is-done {
    .pipeline__node {
      background: $brand-orange-deep;
      border-color: $brand-orange-deep;
    }
    .pipeline__num { color: $ink-1000; }
    .pipeline__label { color: var(--fg-muted); }
  }

  &__step.is-active {
    .pipeline__node {
      background: $brand-orange;
      border-color: $brand-orange;
      box-shadow: 0 0 0 6px rgba($brand-orange, 0.18), 0 0 30px rgba($brand-orange, 0.4);
      animation: pulse 2.4s ease-in-out infinite;
    }
    .pipeline__num { color: $ink-1000; }
    .pipeline__label { color: $brand-orange; font-weight: 600; }
  }

  @media (max-width: 640px) {
    &__label { display: none; }
    &__steps { grid-auto-flow: column; grid-template-columns: repeat(6, 1fr); }
    &__rail { top: 17px; left: 16px; right: 16px; }
  }
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 6px rgba(#F08A1F, 0.18), 0 0 30px rgba(#F08A1F, 0.4); }
  50%      { box-shadow: 0 0 0 10px rgba(#F08A1F, 0.10), 0 0 40px rgba(#F08A1F, 0.55); }
}

@media (prefers-reduced-motion: reduce) {
  .pipeline__step.is-active .pipeline__node { animation: none; }
  .pipeline__fill { transition: none; }
}
</style>
