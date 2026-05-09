<script setup lang="ts">
import ServicesSection from "@/components/sections/ServicesSection.vue";
import CtaFinal from "@/components/sections/CtaFinal.vue";
import { useGsapReveal } from "@/composables/useGsapReveal";

useGsapReveal();
</script>

<template>
  <main class="services-view">
    <header class="services-view__hero container">
      <span class="eyebrow" data-reveal>Servicios</span>
      <h1 class="services-view__title" data-reveal data-reveal-group>
        Logística completa, <em>operada por nosotros.</em>
      </h1>
      <p class="services-view__lead" data-reveal>
        Desde la compra en USA hasta la entrega final en tu puerta. Cada paso lo controlamos
        en sistemas propios, con equipo propio. Por eso podemos garantizar tiempos.
      </p>
    </header>

    <ServicesSection />
    <CtaFinal />
  </main>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;
@use "@/styles/mixins/typography" as *;

.services-view {
  &__hero {
    padding-top: clamp(7rem, 12vw, 10rem);
    padding-bottom: 3rem;
    display: grid;
    gap: 1rem;
  }
  &__title {
    @include display-lg;
    em { font-style: italic; color: $brand-orange; font-weight: 400; }
  }
  &__lead {
    color: var(--fg-muted);
    max-width: 60ch;
    font-size: 1.125rem;
  }
}
</style>
