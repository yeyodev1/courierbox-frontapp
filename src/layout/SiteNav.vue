<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { RouterLink } from "vue-router";
import BrandMark from "@/components/ui/BrandMark.vue";
import AppButton from "@/components/ui/AppButton.vue";

const open = ref(false);
const scrolled = ref(false);

const onScroll = () => { scrolled.value = window.scrollY > 24; };

onMounted(() => {
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
});
onBeforeUnmount(() => window.removeEventListener("scroll", onScroll));

const links = [
  { to: "/servicios", label: "Servicios" },
  { to: "/rastrear", label: "Rastrear" },
  { to: "/nosotros", label: "Nosotros" },
  { to: "/contacto", label: "Contacto" },
];
</script>

<template>
  <header :class="['nav', { 'nav--scrolled': scrolled, 'nav--open': open }]">
    <div class="nav__inner container">
      <RouterLink to="/" class="nav__brand" @click="open = false">
        <BrandMark :size="36" with-word />
      </RouterLink>

      <nav class="nav__links" :aria-hidden="!open && undefined">
        <RouterLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="nav__link"
          @click="open = false"
        >
          {{ l.label }}
        </RouterLink>
      </nav>

      <div class="nav__cta">
        <AppButton as="router-link" to="/rastrear" variant="primary" size="sm">
          Rastrear envío
        </AppButton>
      </div>

      <button
        class="nav__toggle"
        :aria-expanded="open"
        aria-label="Abrir menú"
        @click="open = !open"
      >
        <span /><span /><span />
      </button>
    </div>
  </header>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;
@use "@/styles/tokens/space" as *;
@use "@/styles/tokens/motion" as *;
@use "@/styles/mixins/responsive" as *;

.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  transition: background $dur-base $ease-out-expo, backdrop-filter $dur-base $ease-out-expo;

  &--scrolled {
    background: rgba($ink-1000, 0.7);
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

  &__brand { display: inline-flex; align-items: center; }

  &__links {
    display: none;
    gap: 0.25rem;
    @include lg {
      display: flex;
    }
  }

  &__link {
    padding: 0.6rem 1rem;
    border-radius: 999px;
    font-size: 0.95rem;
    color: var(--fg-muted);
    transition: color $dur-base $ease-out-expo, background $dur-base $ease-out-expo;

    &:hover, &.router-link-exact-active {
      color: var(--fg);
      background: rgba($ink-100, 0.04);
    }
  }

  &__cta { display: none; @include lg { display: inline-flex; } }

  &__toggle {
    width: 44px; height: 44px;
    display: inline-flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 5px;
    @include lg { display: none; }
    span {
      display: block;
      width: 22px; height: 2px;
      background: var(--fg);
      transition: transform $dur-base $ease-out-expo, opacity $dur-base $ease-out-expo;
    }
  }

  &--open {
    .nav__toggle span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .nav__toggle span:nth-child(2) { opacity: 0; }
    .nav__toggle span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    .nav__links {
      display: flex;
      flex-direction: column;
      position: absolute;
      top: 100%;
      left: 0; right: 0;
      padding: 2rem var(--gutter);
      background: rgba($ink-1000, 0.96);
      backdrop-filter: blur(20px);
      gap: 0.5rem;
      border-bottom: 1px solid var(--border);
      @include lg { display: flex; flex-direction: row; position: static; padding: 0; background: transparent; backdrop-filter: none; border: 0; }
    }

    .nav__link {
      padding: 1rem 1.25rem;
      font-size: 1.5rem;
      font-family: "Fraunces", serif;
      letter-spacing: -0.01em;
      @include lg { padding: 0.6rem 1rem; font-size: 0.95rem; font-family: inherit; }
    }
  }
}
</style>
