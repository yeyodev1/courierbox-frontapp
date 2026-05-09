<script setup lang="ts">
import { onMounted } from "vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const stats = [
  { num: 12, suffix: "+", label: "Años en operación", sub: "Desde 2012" },
  { num: 4800, suffix: "+", label: "Paquetes mensuales", sub: "Promedio 2025" },
  { num: 99.4, suffix: "%", label: "Entregas a tiempo", sub: "Métrica interna" },
  { num: 4.9, suffix: "/5", label: "Rating de clientes", sub: "Más de 2.300 reseñas" },
];

const els: (HTMLElement | null)[] = [];
const setRef = (i: number) => (el: Element | null | { $el?: Element }) => {
  els[i] = (el && (el as { $el?: Element }).$el ? (el as { $el?: Element }).$el : el) as HTMLElement | null;
};

onMounted(() => {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  gsap.registerPlugin(ScrollTrigger);
  els.forEach((el, i) => {
    if (!el) return;
    const target = stats[i];
    if (!target) return;
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target.num,
      duration: 1.6,
      ease: "expo.out",
      onUpdate: () => {
        const isFloat = target.num % 1 !== 0;
        el.textContent = isFloat ? obj.v.toFixed(1) : Math.round(obj.v).toLocaleString("es-EC");
      },
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
  });
});
</script>

<template>
  <section class="trust section">
    <div class="container">
      <div class="trust__head" data-reveal-group>
        <span class="eyebrow" data-reveal>Por qué confían</span>
        <h2 class="trust__title" data-reveal>
          Métricas que <em>nos exigimos</em> cada mes.
        </h2>
      </div>

      <div class="trust__grid">
        <div v-for="(s, i) in stats" :key="s.label" class="stat">
          <div class="stat__value">
            <span :ref="setRef(i)">0</span><span class="stat__suffix">{{ s.suffix }}</span>
          </div>
          <div class="stat__label">{{ s.label }}</div>
          <div class="stat__sub">{{ s.sub }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;
@use "@/styles/mixins/responsive" as *;
@use "@/styles/mixins/typography" as *;

.trust {
  background: $ink-1000;

  &__head {
    display: grid; gap: 1rem;
    margin-bottom: clamp(2rem, 5vw, 4rem);
    max-width: 800px;
  }

  &__title {
    @include display-md;
    em { font-style: italic; color: $brand-orange; font-weight: 400; }
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: var(--border);
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid var(--border);
    @include md { grid-template-columns: repeat(4, 1fr); }
  }
}

.stat {
  background: var(--surface);
  padding: clamp(1.5rem, 3vw, 2.5rem);
  display: grid;
  gap: 0.5rem;

  &__value {
    display: inline-flex;
    align-items: baseline;
    font-family: "Fraunces", serif;
    font-weight: 500;
    font-size: clamp(2.5rem, 5vw, 4rem);
    line-height: 1;
    letter-spacing: -0.03em;
    color: var(--fg);
  }
  &__suffix {
    color: $brand-orange;
    font-size: 0.6em;
    margin-left: 0.15rem;
  }
  &__label {
    color: var(--fg);
    font-weight: 500;
    margin-top: 0.5rem;
  }
  &__sub { color: var(--fg-faint); font-size: 0.85rem; }
}
</style>
