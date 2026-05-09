<script setup lang="ts">
const cities = [
  { name: "Quito", x: 50, y: 32, hub: true },
  { name: "Guayaquil", x: 32, y: 60, hub: true },
  { name: "Cuenca", x: 44, y: 72 },
  { name: "Manta", x: 22, y: 50 },
  { name: "Loja", x: 50, y: 86 },
  { name: "Ambato", x: 52, y: 44 },
  { name: "Ibarra", x: 56, y: 22 },
  { name: "Machala", x: 30, y: 78 },
];
</script>

<template>
  <section class="coverage section">
    <div class="container coverage__inner">
      <div class="coverage__copy" data-reveal-group>
        <span class="eyebrow" data-reveal>Cobertura</span>
        <h2 class="coverage__title" data-reveal>
          Una red que llega a <em>cada provincia</em> del Ecuador.
        </h2>
        <p class="coverage__lead" data-reveal>
          Hubs en Quito y Guayaquil, ruta directa Miami → Ecuador y mensajería propia
          en las principales ciudades. Si está en el mapa, llegamos.
        </p>
        <ul class="coverage__list" data-reveal>
          <li>Hub Miami · 24/7</li>
          <li>Aduana propia · Trámites en 48h</li>
          <li>Distribución nacional · Última milla</li>
        </ul>
      </div>

      <div class="coverage__map" aria-label="Mapa de cobertura">
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          <!-- Stylized Ecuador silhouette -->
          <path
            d="M30 10 Q55 6 68 16 Q78 28 76 40 Q80 52 72 66 Q66 84 50 92 Q34 90 26 78 Q14 64 18 48 Q14 34 22 22 Z"
            fill="rgba(240, 138, 31, 0.06)"
            stroke="rgba(240, 138, 31, 0.4)"
            stroke-width="0.4"
            stroke-dasharray="1 1.5"
          />
          <g v-for="c in cities" :key="c.name">
            <circle
              :cx="c.x"
              :cy="c.y"
              :r="c.hub ? 1.6 : 1"
              fill="#F08A1F"
              :class="{ 'pulse': c.hub }"
            />
            <text
              :x="c.x + 2.5"
              :y="c.y + 1"
              fill="#E5E3DD"
              font-size="2.4"
              font-family="Inter Tight, sans-serif"
            >{{ c.name }}</text>
          </g>
          <!-- Miami → Ecuador route line -->
          <path
            d="M-10 -10 Q40 0 50 32"
            fill="none"
            stroke="#F08A1F"
            stroke-width="0.4"
            stroke-dasharray="2 2"
            opacity="0.6"
          />
        </svg>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;
@use "@/styles/mixins/responsive" as *;
@use "@/styles/mixins/typography" as *;

.coverage {
  background: linear-gradient(180deg, $ink-900, $ink-1000);

  &__inner {
    display: grid;
    grid-template-columns: 1fr;
    gap: clamp(2rem, 5vw, 4rem);
    align-items: center;
    @include lg { grid-template-columns: 1fr 1.1fr; }
  }

  &__copy { display: grid; gap: 1rem; }

  &__title {
    @include display-md;
    em { font-style: italic; color: $brand-orange; font-weight: 400; }
  }

  &__lead { color: var(--fg-muted); max-width: 50ch; }

  &__list {
    margin-top: 1rem;
    display: grid;
    gap: 0.5rem;
    li {
      padding-left: 1.25rem;
      position: relative;
      color: var(--fg-muted);
      &::before {
        content: "→";
        position: absolute;
        left: 0;
        color: $brand-orange;
      }
    }
  }

  &__map {
    aspect-ratio: 1 / 1;
    width: 100%;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 1.5rem;
    svg { width: 100%; height: 100%; }

    .pulse {
      animation: pulseDot 2.4s ease-in-out infinite;
      transform-origin: center;
      transform-box: fill-box;
    }
  }
}

@keyframes pulseDot {
  0%, 100% { opacity: 1; r: 1.6; }
  50% { opacity: 0.6; r: 2.6; }
}
</style>
