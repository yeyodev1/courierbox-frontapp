<script setup lang="ts">
/**
 * Brand panel of the sign-in screen. It names the four panels so people who
 * wear two hats know which one their login will open.
 */
import BrandMark from '@/components/ui/BrandMark.vue'
import { PANELES } from './useLogin'
</script>

<template>
  <section class="login__aside">
    <div class="aside__inner">
      <BrandMark :size="52" with-word subtitle="Logistics" class="aside__brand" />

      <h1>El sistema operativo de tu courier.</h1>
      <p class="aside__lede">Counter, bodega, envíos, compras y cobranzas en un solo lugar.</p>

      <ul class="aside__panels">
        <li v-for="panel in PANELES" :key="panel.titulo">
          <span>{{ panel.titulo }}</span>
          <small>{{ panel.detalle }}</small>
        </li>
      </ul>

      <p class="aside__foot">Entras con un solo acceso; el panel se abre según tu rol.</p>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.login__aside {
  position: relative;
  display: flex;
  align-items: center;
  padding: clamp($space-8, 6vw, $space-24);
  overflow: hidden;
  background:
    radial-gradient(120% 90% at 12% 8%, rgba($brand-orange, 0.16), transparent 62%),
    radial-gradient(90% 80% at 88% 92%, rgba($brand-orange, 0.09), transparent 60%),
    $ink-900;
  border-right: 1px solid rgba($ink-500, 0.16);

  /* Ghosted mark: brand presence without competing with the copy. */
  &::after {
    content: '';
    position: absolute;
    right: -14%;
    bottom: -22%;
    width: 68%;
    aspect-ratio: 1;
    background: radial-gradient(circle, rgba($brand-orange, 0.12), transparent 68%);
    pointer-events: none;
  }

  @media (max-width: 900px) { display: none; }

  h1 {
    margin: 0;
    font-size: clamp(1.9rem, 3.2vw, 2.7rem);
    line-height: 1.1;
    letter-spacing: -0.02em;
    color: $fg-dark;
    text-wrap: balance;
  }
}

.aside__inner {
  position: relative;
  z-index: 1;
  max-width: 30rem;
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.aside__brand { margin-bottom: $space-4; }

.aside__lede {
  margin: 0;
  color: $ink-300;
  font-size: 1.02rem;
  max-width: 40ch;
}

.aside__panels {
  list-style: none;
  margin: $space-3 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-3;

  li {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding-left: $space-4;
    border-left: 2px solid rgba($brand-orange, 0.45);
  }

  span { color: $ink-100; font-weight: 600; font-size: 0.95rem; }
  small { color: $ink-400; font-size: 0.82rem; }
}

.aside__foot {
  margin: $space-4 0 0;
  color: $ink-500;
  font-size: 0.82rem;
}
</style>
