<script setup lang="ts">
const steps = [
  {
    n: "01",
    title: "Solicitas",
    body: "Pídelo por web o WhatsApp. Te respondemos con cotización en minutos.",
  },
  {
    n: "02",
    title: "Compramos / Recibimos",
    body: "Compramos en tu nombre o recibes en nuestra bodega de Miami.",
  },
  {
    n: "03",
    title: "Embarcamos",
    body: "Consolidación, pesaje y etiquetado en bodega. Visible en tiempo real.",
  },
  {
    n: "04",
    title: "Entregamos",
    body: "Te avisamos por WhatsApp y entregamos en tu puerta. Foto de evidencia.",
  },
];
</script>

<template>
  <section class="process section">
    <div class="container">
      <div class="process__head" data-reveal-group>
        <span class="eyebrow" data-reveal>Proceso</span>
        <h2 class="process__title" data-reveal>
          Cuatro pasos. <em>Cero</em> intermediarios entre tú y nosotros.
        </h2>
      </div>

      <ol class="process__list" data-reveal-group>
        <li v-for="s in steps" :key="s.n" class="step" data-reveal>
          <div class="step__num">{{ s.n }}</div>
          <div class="step__body">
            <h3 class="step__title">{{ s.title }}</h3>
            <p>{{ s.body }}</p>
          </div>
          <div class="step__line" aria-hidden="true" />
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;
@use "@/styles/tokens/space" as *;
@use "@/styles/mixins/responsive" as *;
@use "@/styles/mixins/typography" as *;

.process {
  background: $ink-1000;
  position: relative;

  &__head {
    display: grid;
    gap: 1rem;
    max-width: 880px;
    margin-bottom: clamp(2rem, 5vw, 4rem);
  }

  &__title {
    @include display-md;
    em {
      font-style: italic;
      font-weight: 400;
      color: $brand-orange;
    }
  }

  &__list {
    display: grid;
    gap: 1rem;
    counter-reset: step;
    @include md { grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
    @include lg { grid-template-columns: repeat(4, 1fr); gap: 1rem; }
  }
}

.step {
  position: relative;
  padding: 1.75rem;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface-2);
  display: grid;
  gap: 0.75rem;
  align-content: start;
  overflow: hidden;
  transition: border-color 0.3s ease, transform 0.3s ease;

  &:hover {
    border-color: rgba($brand-orange, 0.5);
    transform: translateY(-3px);
  }

  &__num {
    font-family: "Fraunces", serif;
    font-size: clamp(2.5rem, 5vw, 4rem);
    font-weight: 500;
    color: $brand-orange;
    line-height: 1;
    letter-spacing: -0.04em;
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--fg);
  }

  &__body p {
    color: var(--fg-muted);
    font-size: 0.95rem;
    line-height: 1.55;
  }

  &__line {
    position: absolute;
    bottom: 0; left: 1.75rem; right: 1.75rem;
    height: 2px;
    background: linear-gradient(90deg, $brand-orange, transparent);
    opacity: 0.4;
  }
}
</style>
