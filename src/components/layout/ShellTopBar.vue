<script setup lang="ts">
/** Sticky header: mobile menu trigger, the current page's name and the avatar. */
defineProps<{ title: string; subtitle: string; userDisplayName: string; userInitial: string }>()

const emit = defineEmits<{ 'open-sidebar': []; logout: [] }>()
</script>

<template>
  <header class="top-bar">
    <div class="top-bar-left">
      <button class="hamburger" aria-label="Abrir menú de navegación" @click="emit('open-sidebar')">
        <i class="fa-solid fa-bars" aria-hidden="true" />
      </button>
      <div class="page-title-group">
        <h1 class="page-title">{{ title }}</h1>
        <p class="page-subtitle">{{ subtitle }}</p>
      </div>
    </div>
    <div class="top-bar-right">
      <span
        class="user-avatar"
        :title="userDisplayName"
        tabindex="0"
        role="button"
        aria-label="Abrir opciones de usuario"
        @click="emit('logout')"
        @keydown.enter="emit('logout')"
      >
        {{ userInitial }}
      </span>
    </div>
  </header>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-5 $space-8;
  border-bottom: 1px solid rgba($ink-500, 0.08);
  background: rgba($ink-1000, 0.6);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 30;

  @media (max-width: 768px) { padding: $space-4; }
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: $space-4;
}

.hamburger {
  display: none;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: rgba($ink-600, 0.3);
    border: 1px solid rgba($ink-500, 0.2);
    border-radius: 10px;
    color: $fg-dark;
    cursor: pointer;
    font-size: 1rem;

    &:focus-visible { outline: 2px solid $brand-orange; outline-offset: 2px; }
  }
}

.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.01em;
}

.page-subtitle {
  font-size: 0.8rem;
  color: $ink-400;
  margin: 2px 0 0;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, $brand-orange, $brand-orange-deep);
  color: $ink-1000;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;

  &:focus-visible { outline: 2px solid $brand-orange; outline-offset: 2px; }
}
</style>
