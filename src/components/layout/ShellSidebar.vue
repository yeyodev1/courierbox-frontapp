<script setup lang="ts">
/**
 * Fixed navigation rail shared by every authenticated shell (admin, asesor,
 * bodega). It renders whatever menu tree it is handed and reports clicks;
 * routing and role logic stay with the shell that owns them.
 */
import BrandMark from '@/components/ui/BrandMark.vue'

export interface ShellMenuItem {
  path: string
  label: string
  icon: string
  match: (routePath: string) => boolean
}

export interface ShellMenuGroup {
  label: string
  items: ShellMenuItem[]
}

defineProps<{
  groups: ShellMenuGroup[]
  currentPath: string
  expanded: boolean
  mobileOpen: boolean
  /** Shown under the wordmark, e.g. "Admin Panel" or "Panel asesor". */
  brandSubtitle: string
  userDisplayName: string
  userEmail: string
  userInitial: string
}>()

const emit = defineEmits<{ toggle: []; navigate: [path: string]; logout: [] }>()
</script>

<template>
  <aside class="sidebar" :class="{ 'mobile-open': mobileOpen }" aria-label="Barra de navegación">
    <div class="sidebar-brand">
      <BrandMark :size="30" :with-word="expanded" :subtitle="expanded ? brandSubtitle : ''" variant="plate" />
      <button
        class="collapse-btn"
        :aria-label="expanded ? 'Colapsar sidebar' : 'Expandir sidebar'"
        @click="emit('toggle')"
      >
        <i class="fa-solid fa-chevron-left" aria-hidden="true" :class="{ rotated: !expanded }" />
      </button>
    </div>

    <nav
      class="sidebar-nav"
      aria-label="Secciones de administración"
      data-lenis-prevent
      data-lenis-prevent-wheel
      data-lenis-prevent-touch
    >
      <template v-for="(group, gi) in groups" :key="group.label">
        <span v-show="expanded" class="nav-section-label">{{ group.label }}</span>
        <button
          v-for="item in group.items"
          :key="item.path"
          class="nav-item"
          :class="{ active: item.match(currentPath) }"
          :aria-current="item.match(currentPath) ? 'page' : undefined"
          :title="!expanded ? item.label : ''"
          @click="emit('navigate', item.path)"
        >
          <span class="nav-icon-wrapper"><i :class="item.icon" aria-hidden="true" /></span>
          <span v-show="expanded" class="nav-label">{{ item.label }}</span>
        </button>
        <div v-if="gi < groups.length - 1" v-show="expanded" class="nav-divider" />
      </template>
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-user">
        <span class="user-avatar-mini">{{ userInitial }}</span>
        <div v-show="expanded" class="user-info-text">
          <span class="user-name">{{ userDisplayName }}</span>
          <span class="user-email">{{ userEmail }}</span>
        </div>
      </div>
      <button class="logout-icon-btn" aria-label="Cerrar sesión" @click="emit('logout')">
        <i class="fa-solid fa-right-from-bracket" aria-hidden="true" />
      </button>
    </div>
  </aside>
</template>

<style scoped lang="scss">
@use 'sass:color';
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  background: $ink-900;
  border-right: 1px solid rgba($ink-500, 0.12);
  display: flex;
  flex-direction: column;
  z-index: 50;
  transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;

  :global(.sidebar-collapsed) & { width: 72px; }

  @media (max-width: 768px) {
    left: -280px;
    width: 280px;
    transition: left 0.3s ease;

    &.mobile-open {
      left: 0;
      box-shadow: 20px 0 40px rgba(0, 0, 0, 0.5);
    }

    :global(.sidebar-collapsed) & { left: -280px; width: 280px; }
  }
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-6 $space-4;
  border-bottom: 1px solid rgba($ink-500, 0.1);
  position: relative;

  /* At 72px there is no room for mark and button side by side. */
  :global(.sidebar-collapsed) & {
    flex-direction: column;
    gap: $space-3;
    padding: $space-5 $space-2;

    .collapse-btn { margin-left: 0; }
  }
}

/* This used to hang outside the sidebar with `right: -12px`, but the sidebar
   clips its overflow, so the button was rendered sliced in half at the edge.
   It is a normal flex item now, pushed right, and can never be cut. */
.collapse-btn {
  margin-left: auto;
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  background: linear-gradient(180deg, $brand-orange, color.adjust($brand-orange, $lightness: -12%));
  border: 1px solid rgba($brand-orange, 0.6);
  color: $ink-1000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.7rem;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45), 0 0 0 2px rgba($brand-orange, 0.12);
  transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 14px 28px rgba(0, 0, 0, 0.5), 0 0 0 3px rgba($brand-orange, 0.22);
  }

  &:focus-visible { outline: 2px solid $brand-orange; outline-offset: 2px; }

  i {
    transition: transform 0.3s ease;
    &.rotated { transform: rotate(180deg); }
  }

  @media (max-width: 768px) { display: none; }
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: $space-4 $space-3;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-gutter: stable;
  touch-action: pan-y;
  pointer-events: auto;

  &::-webkit-scrollbar { width: 10px; }
  &::-webkit-scrollbar-track { background: transparent; }

  &::-webkit-scrollbar-thumb {
    background: rgba($ink-500, 0.28);
    border-radius: 999px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }

  &::-webkit-scrollbar-thumb:hover { background: rgba($ink-400, 0.38); }
}

.nav-section-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: $ink-500;
  padding: $space-3 $space-3 $space-2;
  font-weight: 600;
}

.nav-divider {
  height: 1px;
  background: rgba($ink-500, 0.12);
  margin: $space-2 $space-3;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  width: 100%;
  padding: $space-3;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: $ink-300;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  position: relative;
  font-family: inherit;

  &:focus-visible { outline: 2px solid $brand-orange; outline-offset: -2px; }

  .nav-icon-wrapper {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: transparent;
    flex-shrink: 0;
    transition: all 0.2s;
    font-size: 1rem;
  }

  .nav-label { font-size: 0.9rem; font-weight: 500; white-space: nowrap; }

  &:hover {
    background: rgba($ink-600, 0.3);
    color: $fg-dark;

    .nav-icon-wrapper { background: rgba($ink-500, 0.2); }
  }

  &.active {
    background: rgba($brand-orange, 0.08);
    color: $brand-orange;

    .nav-icon-wrapper { background: rgba($brand-orange, 0.15); }

    /* Anchored to the item, not to the sidebar edge: at -$space-3 it landed on
       x=0 and showed up as a stray orange sliver against the window. */
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 20px;
      background: $brand-orange;
      border-radius: 0 3px 3px 0;

      @media (max-width: 768px) { left: -$space-4; }
    }
  }
}

.sidebar-footer {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-4;
  border-top: 1px solid rgba($ink-500, 0.1);
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: $space-3;
  flex: 1;
  overflow: hidden;
}

.user-avatar-mini {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, $brand-orange, $brand-orange-deep);
  color: $ink-1000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.user-info-text {
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .user-name,
  .user-email {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .user-name { font-size: 0.85rem; font-weight: 600; }
  .user-email { font-size: 0.7rem; color: $ink-400; }
}

.logout-icon-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid rgba($ink-500, 0.2);
  border-radius: 10px;
  color: $ink-400;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  &:focus-visible { outline: 2px solid $brand-orange; outline-offset: 2px; }

  &:hover {
    background: rgba($signal-red, 0.1);
    color: #ff8a8f;
    border-color: rgba($signal-red, 0.2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .nav-item,
  .collapse-btn,
  .collapse-btn i { transition: none; }
}
</style>
