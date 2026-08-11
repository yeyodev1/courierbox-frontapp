<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import BrandMark from "@/components/ui/BrandMark.vue";
import AppButton from "@/components/ui/AppButton.vue";
import MegaMenu from "@/layout/MegaMenu.vue";

const open = ref(false);
const scrolled = ref(false);
const route = useRoute();

const onScroll = () => { scrolled.value = window.scrollY > 24; };

onMounted(() => {
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
});
onBeforeUnmount(() => window.removeEventListener("scroll", onScroll));

watch(() => route.fullPath, () => { open.value = false; });
</script>

<template>
  <header :class="['nav', { 'nav--scrolled': scrolled, 'nav--open': open }]">
    <div class="nav__inner container">
      <RouterLink to="/" class="nav__brand" :tabindex="open ? -1 : 0">
        <BrandMark :size="36" with-word />
      </RouterLink>

      <div class="nav__right">
        <AppButton
          as="router-link"
          to="/comprar-por-mi"
          variant="primary"
          size="sm"
          class="nav__cta nav__cta--shop"
        >
          Comprar por mí
        </AppButton>

        <AppButton
          as="router-link"
          to="/rastrear"
          variant="outline"
          size="sm"
          class="nav__cta"
        >
          Rastrear envío
        </AppButton>

        <button
          class="nav__menu"
          type="button"
          :aria-expanded="open"
          aria-label="Abrir menú"
          @click="open = !open"
        >
          <span class="nav__menu-label">{{ open ? "Cerrar" : "Menú" }}</span>
          <span class="nav__menu-icon" aria-hidden="true">
            <span /><span />
          </span>
        </button>
      </div>
    </div>

    <MegaMenu :open="open" @close="open = false" />
  </header>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;
@use "@/styles/tokens/space" as *;
@use "@/styles/tokens/motion" as *;
@use "@/styles/mixins/responsive" as *;

.nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 90;
  transition: background $dur-base $ease-out-expo, backdrop-filter $dur-base $ease-out-expo;

  &--scrolled:not(&--open) {
    background: rgba($ink-1000, 0.65);
    backdrop-filter: blur(18px) saturate(140%);
    border-bottom: 1px solid var(--border);
  }

  &__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding-block: 1rem;
  }

  &__brand {
    display: inline-flex;
    align-items: center;
    z-index: 110;
    position: relative;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    z-index: 110;
    position: relative;
    @include sm { gap: 0.75rem; }
  }

  &__cta {
    display: none;
    @include md { display: inline-flex; }
  }

  &__menu {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.5rem 0.5rem 1rem;
    height: 48px;
    border-radius: 999px;
    border: 1px solid var(--border-strong);
    background: rgba($ink-100, 0.04);
    color: var(--fg);
    font-family: inherit;
    font-size: 0.9rem;
    letter-spacing: -0.01em;
    transition: background $dur-base $ease-out-expo, border-color $dur-base $ease-out-expo, color $dur-base $ease-out-expo;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;

    &:hover {
      background: $brand-orange;
      color: $ink-1000;
      border-color: $brand-orange;
      .nav__menu-icon span { background: $ink-1000; }
    }
  }

  &__menu-label {
    min-width: 3.5em;
    text-align: left;
    font-weight: 500;
  }

  &__menu-icon {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    background: rgba($ink-100, 0.08);
    display: inline-grid;
    place-items: center;
    position: relative;

    span {
      position: absolute;
      width: 16px;
      height: 1.5px;
      background: var(--fg);
      transition: transform $dur-base $ease-out-expo, width $dur-base $ease-out-expo, background $dur-base ease;
    }
    span:nth-child(1) { transform: translateY(-4px); }
    span:nth-child(2) { transform: translateY(4px); width: 10px; }
  }

  &--open {
    .nav__menu-icon span:nth-child(1) { transform: rotate(45deg); width: 16px; }
    .nav__menu-icon span:nth-child(2) { transform: rotate(-45deg); width: 16px; }
    .nav__menu { background: rgba($ink-100, 0.06); border-color: var(--border-strong); }
  }
}

/* The shop CTA is the primary action, but two buttons plus the menu is too
   much on a narrow phone — the mega menu still carries the link there. */
.nav__cta--shop {
  @media (max-width: 560px) {
    display: none;
  }
}
</style>
