<script setup lang="ts">
import CtaFinal from "@/components/sections/CtaFinal.vue";
import { useGsapReveal } from "@/composables/useGsapReveal";

useGsapReveal();
</script>

<template>
  <main class="about">
    <section class="about__hero container">
      <span class="eyebrow" data-reveal>Nosotros</span>
      <h1 class="about__title" data-reveal data-reveal-group>
        Construimos la red logística que <em>nos hubiera gustado contratar.</em>
      </h1>
    </section>

    <section class="about__body container">
      <article class="about__col" data-reveal-group>
        <h2 data-reveal>Operamos cada eslabón</h2>
        <p data-reveal>
          Tenemos bodegas propias en Miami y Madrid, equipo logístico en Ecuador,
          sistemas internos de tracking y rutas de última milla con personal de planta.
          No subcontratamos la promesa que te hacemos.
        </p>
        <p data-reveal>
          Eso significa que cuando te decimos que tu paquete llega el martes,
          la persona que lo va a entregar trabaja con nosotros. La que lo
          recibió en Miami también.
        </p>
      </article>

      <article class="about__col" data-reveal-group>
        <h2 data-reveal>Tecnología propia</h2>
        <p data-reveal>
          El sistema que ves cuando rastreas tu paquete es nuestro. La integración
          con WhatsApp, los reportes para empresas, la facturación electrónica,
          todo lo construye nuestro equipo de ingeniería.
        </p>
        <p data-reveal>
          Por eso podemos prometer tiempos de respuesta en minutos y soporte 24/7
          que de verdad responde.
        </p>
      </article>
    </section>

    <CtaFinal />
  </main>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;
@use "@/styles/mixins/typography" as *;
@use "@/styles/mixins/responsive" as *;

.about {
  &__hero {
    padding-top: clamp(7rem, 12vw, 10rem);
    padding-bottom: clamp(2rem, 5vw, 4rem);
    display: grid; gap: 1rem;
  }
  &__title {
    @include display-lg;
    em { font-style: italic; color: $brand-orange; font-weight: 400; }
  }
  &__body {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2.5rem;
    padding-block: clamp(2rem, 5vw, 4rem);
    @include lg { grid-template-columns: 1fr 1fr; gap: 4rem; }
  }
  &__col {
    display: grid;
    gap: 1rem;
    h2 { font-size: clamp(1.25rem, 2vw, 1.625rem); color: $brand-orange; }
    p { color: var(--fg-muted); line-height: 1.65; font-size: 1.0625rem; }
  }
}
</style>
