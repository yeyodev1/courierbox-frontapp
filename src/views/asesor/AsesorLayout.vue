<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const sidebarExpanded = ref(true)
const sidebarMobileOpen = ref(false)
const showLogoutConfirm = ref(false)

const menuGroups = [
  {
    label: 'Mi panel',
    items: [
      { path: '/asesor', label: 'Dashboard', icon: 'fa-solid fa-chart-pie', match: (p: string) => p === '/asesor' },
      { path: '/asesor/calculadora', label: 'Calculadora', icon: 'fa-solid fa-calculator', match: (p: string) => p.startsWith('/asesor/calculadora') },
      { path: '/asesor/ordenes', label: 'Ventas', icon: 'fa-solid fa-bag-shopping', match: (p: string) => p.startsWith('/asesor/ordenes') },
    ],
  },
]

const currentPath = computed(() => route.path)

const userDisplayName = computed(() => {
  const u = authStore.currentUser
  return u?.name || u?.email || 'Asesor'
})
const userEmail = computed(() => authStore.currentUser?.email || '')
const userInitial = computed(() => userDisplayName.value.charAt(0).toUpperCase())

const pageMeta = computed(() => {
  const map: Record<string, { title: string; sub: string }> = {
    '/asesor': { title: 'Dashboard', sub: 'Resumen de tus órdenes y pagos' },
    '/asesor/calculadora': { title: 'Calculadora de gestión', sub: 'Cotiza el fee de gestión de compra' },
    '/asesor/ordenes': { title: 'Ventas', sub: 'Gestiona las órdenes de compra de tus clientes' },
    '/asesor/ordenes/nueva': { title: 'Nueva orden', sub: 'Crea una orden de compra para tu cliente' },
  }
  return map[route.path] || { title: 'Asesor', sub: '' }
})

function navigate(path: string) {
  router.push(path)
  sidebarMobileOpen.value = false
}
</script>

<template>
  <div class="asesor-shell" :class="{ 'sidebar-collapsed': !sidebarExpanded }">
    <transition name="fade">
      <div v-if="sidebarMobileOpen" class="mobile-overlay" @click="sidebarMobileOpen = false" />
    </transition>

    <aside class="sidebar" :class="{ 'mobile-open': sidebarMobileOpen }">
      <div class="sidebar-brand">
        <div class="brand-icon">
          <span class="logo-mark">C</span>
        </div>
        <div class="brand-text" v-show="sidebarExpanded">
          <span class="brand-name">Courier Box</span>
          <span class="brand-role">Panel Asesor</span>
        </div>
        <button
          class="collapse-btn"
          @click="sidebarExpanded = !sidebarExpanded"
          :title="sidebarExpanded ? 'Colapsar' : 'Expandir'"
        >
          <i class="fa-solid fa-chevron-left" :class="{ rotated: !sidebarExpanded }" />
        </button>
      </div>

      <nav class="sidebar-nav">
        <template v-for="group in menuGroups" :key="group.label">
          <span class="nav-section-label" v-show="sidebarExpanded">{{ group.label }}</span>
          <button
            v-for="item in group.items"
            :key="item.path"
            class="nav-item"
            :class="{ active: item.match(currentPath) }"
            @click="navigate(item.path)"
            :title="!sidebarExpanded ? item.label : ''"
          >
            <div class="nav-icon-wrapper">
              <i :class="item.icon" />
            </div>
            <span class="nav-label" v-show="sidebarExpanded">{{ item.label }}</span>
          </button>
        </template>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="user-avatar-mini">{{ userInitial }}</div>
          <div class="user-info-text" v-show="sidebarExpanded">
            <span class="user-name">{{ userDisplayName }}</span>
            <span class="user-email">{{ userEmail }}</span>
          </div>
        </div>
        <button class="logout-icon-btn" @click="showLogoutConfirm = true" title="Cerrar sesión">
          <i class="fa-solid fa-right-from-bracket" />
        </button>
      </div>
    </aside>

    <div class="main-area">
      <header class="top-bar">
        <div class="top-bar-left">
          <button class="hamburger" @click="sidebarMobileOpen = true">
            <i class="fa-solid fa-bars" />
          </button>
          <div class="page-title-group">
            <h2 class="page-title">{{ pageMeta.title }}</h2>
            <p class="page-subtitle">{{ pageMeta.sub }}</p>
          </div>
        </div>
        <div class="top-bar-right">
          <div class="user-avatar" @click="showLogoutConfirm = true" :title="userDisplayName">
            {{ userInitial }}
          </div>
        </div>
      </header>

      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <transition name="fade">
      <div v-if="showLogoutConfirm" class="modal-overlay" @click.self="showLogoutConfirm = false">
        <div class="modal-card">
          <div class="modal-icon-box warn"><i class="fa-solid fa-right-from-bracket" /></div>
          <h3>Cerrar Sesión</h3>
          <p>¿Estás seguro de que deseas cerrar sesión?</p>
          <div class="modal-actions">
            <button class="btn-ghost" @click="showLogoutConfirm = false">Cancelar</button>
            <button class="btn-danger" @click="authStore.logout()">Sí, cerrar</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.asesor-shell {
  display: flex;
  min-height: 100vh;
  background: $ink-1000;
  color: $fg-dark;
}

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

  .sidebar-collapsed & {
    width: 72px;
  }

  @media (max-width: 768px) {
    left: -280px;
    transition: left 0.3s ease;
    width: 280px;

    &.mobile-open {
      left: 0;
      box-shadow: 20px 0 40px rgba(0,0,0,0.5);
    }

    .sidebar-collapsed & {
      left: -280px;
      width: 280px;
    }
  }
}

.mobile-overlay {
  display: none;
  @media (max-width: 768px) {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba($ink-1000, 0.7);
    backdrop-filter: blur(4px);
    z-index: 40;
  }
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-6 $space-4;
  border-bottom: 1px solid rgba($ink-500, 0.1);
  position: relative;

  .brand-icon {
    flex-shrink: 0;
    .logo-mark {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, $brand-orange, $brand-orange-deep);
      color: $ink-1000;
      border-radius: 12px;
      font-weight: 800;
      font-size: 1.2rem;
    }
  }

  .brand-text {
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .brand-name {
      font-weight: 700;
      font-size: 1rem;
      white-space: nowrap;
    }

    .brand-role {
      font-size: 0.7rem;
      color: $ink-400;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      white-space: nowrap;
    }
  }

  .collapse-btn {
    position: absolute;
    right: -12px;
    top: 50%;
    transform: translateY(-50%);
    width: 24px;
    height: 24px;
    background: $ink-700;
    border: 1px solid $ink-500;
    color: $ink-300;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.6rem;
    transition: all 0.2s;

    &:hover {
      background: $ink-600;
      color: $fg-dark;
    }

    i {
      transition: transform 0.3s ease;
      &.rotated {
        transform: rotate(180deg);
      }
    }

    @media (max-width: 768px) {
      display: none;
    }
  }
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: $space-4 $space-3;
  overflow-y: auto;

  .nav-section-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: $ink-500;
    padding: $space-3 $space-3 $space-2;
    font-weight: 600;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: $space-3;
    width: 100%;
    padding: $space-3 $space-3;
    background: transparent;
    border: none;
    border-radius: 10px;
    color: $ink-300;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    position: relative;
    font-family: inherit;

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

    .nav-label {
      font-size: 0.9rem;
      font-weight: 500;
      white-space: nowrap;
    }

    &:hover {
      background: rgba($ink-600, 0.3);
      color: $fg-dark;

      .nav-icon-wrapper {
        background: rgba($ink-500, 0.2);
      }
    }

    &.active {
      background: rgba($brand-orange, 0.08);
      color: $brand-orange;

      .nav-icon-wrapper {
        background: rgba($brand-orange, 0.15);
      }

      &::before {
        content: '';
        position: absolute;
        left: -$space-3;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 20px;
        background: $brand-orange;
        border-radius: 0 3px 3px 0;

        @media (max-width: 768px) {
          left: -$space-4;
        }
      }
    }
  }
}

.sidebar-footer {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-4;
  border-top: 1px solid rgba($ink-500, 0.1);

  .sidebar-user {
    display: flex;
    align-items: center;
    gap: $space-3;
    flex: 1;
    overflow: hidden;

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

      .user-name {
        font-size: 0.85rem;
        font-weight: 600;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }

      .user-email {
        font-size: 0.7rem;
        color: $ink-400;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }
    }
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

    &:hover {
      background: rgba($signal-red, 0.1);
      color: #ff8a8f;
      border-color: rgba($signal-red, 0.2);
    }
  }
}

.main-area {
  flex: 1;
  margin-left: 280px;
  transition: margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  .sidebar-collapsed & {
    margin-left: 72px;
  }

  @media (max-width: 768px) {
    margin-left: 0 !important;
  }
}

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

  @media (max-width: 768px) {
    padding: $space-4;
  }

  .top-bar-left {
    display: flex;
    align-items: center;
    gap: $space-4;

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
      }
    }

    .page-title-group {
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
    }
  }

  .top-bar-right {
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
    }
  }
}

.main-content {
  flex: 1;
  padding: $space-8;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: $space-4;
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba($ink-1000, 0.75);
  backdrop-filter: blur(6px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.modal-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.15);
  border-radius: 20px;
  padding: $space-8;
  max-width: 420px;
  width: 100%;
  text-align: center;

  .modal-icon-box {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto $space-4;
    font-size: 1.2rem;

    &.warn { background: rgba($signal-amber, 0.12); color: $signal-amber; }
  }

  h3 {
    font-size: 1.15rem;
    margin: 0 0 $space-2;
  }

  p {
    color: $ink-300;
    font-size: 0.9rem;
    margin: 0 0 $space-6;
  }

  .modal-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $space-3;

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }
}

.btn-ghost {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 1px solid rgba($ink-500, 0.3);
  border-radius: 10px;
  color: $ink-300;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;

  &:hover {
    background: rgba($ink-500, 0.15);
    color: $fg-dark;
  }
}

.btn-danger {
  padding: 0.75rem 1.5rem;
  background: $signal-red;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;

  &:hover {
    background: color.adjust($signal-red, $lightness: -8%);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-slide-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-slide-leave-active {
  transition: all 0.2s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
