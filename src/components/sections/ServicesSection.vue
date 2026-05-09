<script setup lang="ts">
import AppCard from "@/components/ui/AppCard.vue";
import AppBadge from "@/components/ui/AppBadge.vue";

const services = [
  {
    tag: "01 · Door-to-door",
    title: "Importación puerta a puerta",
    body: "Compras en USA y nosotros nos encargamos de todo: bodega, pesaje, aduana y entrega final.",
    bullets: ["Casillero virtual gratis", "Foto de cada paquete", "Seguro contra daños"],
  },
  {
    tag: "02 · Apple Verified",
    title: "Compras Apple sin fricción",
    body: "Asesoramos modelos, validamos compatibilidad y te garantizamos producto sellado original.",
    bullets: ["iPhone · iPad · Mac · Watch", "AppleCare disponible", "Configuración inicial"],
  },
  {
    tag: "03 · Empresas",
    title: "Logística para empresas",
    body: "Importación recurrente, facturación electrónica y reportería personalizada para tu operación.",
    bullets: ["Cuentas corporativas", "Tarifas por volumen", "Integración API"],
  },
  {
    tag: "04 · Casillero Miami",
    title: "Tu dirección en Miami",
    body: "Una dirección física en Miami a tu nombre. Compras en cualquier tienda. Llegan a Ecuador.",
    bullets: ["Sin mensualidades", "Consolidación de paquetes", "Re-shipping disponible"],
  },
];
</script>

<template>
  <section class="services section" id="servicios">
    <div class="container">
      <div class="services__head" data-reveal-group>
        <span class="eyebrow" data-reveal>Lo que hacemos</span>
        <h2 class="services__title" data-reveal>
          Una sola red logística, <em>cuatro</em> formas de moverla.
        </h2>
        <p class="services__lead" data-reveal>
          No tercerizamos. Operamos cada eslabón con tecnología y equipo propio,
          desde la compra hasta la entrega.
        </p>
      </div>

      <div class="services__grid" data-reveal-group>
        <AppCard
          v-for="s in services"
          :key="s.title"
          class="service"
          data-reveal
        >
          <AppBadge tone="brand">{{ s.tag }}</AppBadge>
          <h3 class="service__title">{{ s.title }}</h3>
          <p class="service__body">{{ s.body }}</p>
          <ul class="service__list">
            <li v-for="b in s.bullets" :key="b">{{ b }}</li>
          </ul>
        </AppCard>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;
@use "@/styles/tokens/space" as *;
@use "@/styles/mixins/responsive" as *;
@use "@/styles/mixins/typography" as *;

.services {
  background: linear-gradient(180deg, $ink-900, $ink-1000);

  &__head {
    max-width: 920px;
    margin-bottom: clamp(2rem, 5vw, 4rem);
    display: grid;
    gap: 1rem;
  }

  &__title {
    @include display-md;
    em {
      font-style: italic;
      color: $brand-orange;
      font-weight: 400;
    }
  }

  &__lead {
    color: var(--fg-muted);
    max-width: 60ch;
    font-size: clamp(1rem, 1.2vw, 1.125rem);
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
    @include md { grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
  }
}

.service {
  display: grid;
  gap: 1rem;
  align-content: start;

  &__title {
    @include sans-h2;
    color: var(--fg);
  }

  &__body {
    color: var(--fg-muted);
    line-height: 1.55;
  }

  &__list {
    margin-top: 0.5rem;
    display: grid;
    gap: 0.5rem;
    border-top: 1px solid var(--border);
    padding-top: 1rem;

    li {
      position: relative;
      padding-left: 1.25rem;
      color: var(--fg-muted);
      font-size: 0.95rem;
      &::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0.55rem;
        width: 8px; height: 8px;
        border-radius: 50%;
        background: $brand-orange;
      }
    }
  }
}
</style>
