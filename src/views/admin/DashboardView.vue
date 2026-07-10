<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'

import DashboardResumenTab from '@/components/admin/DashboardResumenTab.vue'
import DashboardPaymentsTab from '@/components/admin/DashboardPaymentsTab.vue'
import DashboardUsersTab from '@/components/admin/DashboardUsersTab.vue'
import DashboardTrackingTab from '@/components/admin/DashboardTrackingTab.vue'

const authStore = useAuthStore()
const router = useRouter()

const sidebarExpanded = ref(true)
const sidebarMobileOpen = ref(false)
const currentView = ref<'dashboard' | 'payments' | 'users' | 'tracking'>('dashboard')
const showLogoutConfirm = ref(false)

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-chart-pie', badge: null as string | null },
  { id: 'payments', label: 'Links de Pago', icon: 'fa-solid fa-link', badge: null as string | null },
  { id: 'users', label: 'Usuarios', icon: 'fa-solid fa-users', badge: null as string | null },
  { id: 'tracking', label: 'Tracking Interno', icon: 'fa-solid fa-magnifying-glass-location', badge: null as string | null },
]

const userDisplayName = computed(() => {
  const u = authStore.currentUser
  return u?.name || u?.email || 'Admin'
})

const userInitial = computed(() => userDisplayName.value.charAt(0).toUpperCase())

function navigateTo(path: string) {
  router.push(path)
  sidebarMobileOpen.value = false
}

function handleTabNavigate(viewId: string) {
  currentView.value = viewId as typeof currentView.value
}
</script>

<template>
  <div class="admin-shell" :class="{ 'sidebar-collapsed': !sidebarExpanded }">
    <!-- Mobile overlay -->
    <transition name="fade">
      <div v-if="sidebarMobileOpen" class="mobile-overlay" @click="sidebarMobileOpen = false" />
    </transition>

    <!-- ===================== SIDEBAR ===================== -->
    <aside class="sidebar" :class="{ 'mobile-open': sidebarMobileOpen }">
      <div class="sidebar-brand">
        <div class="brand-icon">
          <span class="logo-mark">C</span>
        </div>
        <div class="brand-text" v-show="sidebarExpanded">
          <span class="brand-name">Courier Box</span>
          <span class="brand-role">Admin Panel</span>
        </div>
        <button class="collapse-btn" @click="sidebarExpanded = !sidebarExpanded" :title="sidebarExpanded ? 'Colapsar' : 'Expandir'">
          <i class="fa-solid fa-chevron-left" :class="{ rotated: !sidebarExpanded }" />
        </button>
      </div>

      <nav class="sidebar-nav">
        <span class="nav-section-label" v-show="sidebarExpanded">Navegación</span>
        <button
          v-for="item in menuItems"
          :key="item.id"
          class="nav-item"
          :class="{ active: currentView === item.id }"
          @click="currentView = item.id as typeof currentView"
          :title="!sidebarExpanded ? item.label : ''"
        >
          <div class="nav-icon-wrapper">
            <i :class="item.icon" />
          </div>
          <span class="nav-label" v-show="sidebarExpanded">{{ item.label }}</span>
          <span v-if="item.badge && sidebarExpanded" class="nav-badge">{{ item.badge }}</span>
        </button>

        <div class="nav-divider" v-show="sidebarExpanded" />

        <span class="nav-section-label" v-show="sidebarExpanded">Módulos</span>

        <button class="nav-item" @click="navigateTo('/admin/conciliacion')" :title="!sidebarExpanded ? 'Conciliación' : ''">
          <div class="nav-icon-wrapper">
            <i class="fa-solid fa-file-invoice" />
          </div>
          <span class="nav-label" v-show="sidebarExpanded">Conciliación</span>
        </button>

        <button class="nav-item" @click="navigateTo('/admin/metrics')" :title="!sidebarExpanded ? 'Métricas GHL' : ''">
          <div class="nav-icon-wrapper">
            <i class="fa-solid fa-chart-line" />
          </div>
          <span class="nav-label" v-show="sidebarExpanded">Métricas GHL</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="user-avatar-mini">{{ userInitial }}</div>
          <div class="user-info-text" v-show="sidebarExpanded">
            <span class="user-name">{{ userDisplayName }}</span>
            <span class="user-email">{{ authStore.currentUser?.email || '' }}</span>
          </div>
        </div>
        <button class="logout-icon-btn" @click="showLogoutConfirm = true" :title="'Cerrar sesión'">
          <i class="fa-solid fa-right-from-bracket" />
        </button>
      </div>
    </aside>

    <!-- ===================== MAIN ===================== -->
    <div class="main-area">
      <!-- Top bar -->
      <header class="top-bar">
        <div class="top-bar-left">
          <button class="hamburger" @click="sidebarMobileOpen = true">
            <i class="fa-solid fa-bars" />
          </button>
          <div class="page-title-group">
            <h2 class="page-title">{{ currentView === 'dashboard' ? 'Dashboard' : currentView === 'payments' ? 'Links de Pago' : currentView === 'users' ? 'Usuarios' : 'Tracking Interno' }}</h2>
            <p class="page-subtitle">{{ currentView === 'dashboard' ? 'Resumen general del sistema' : currentView === 'payments' ? 'Genera y administra links de pago' : currentView === 'users' ? 'Administra los miembros del equipo' : 'Consulta el estado de los envíos' }}</p>
          </div>
        </div>
        <div class="top-bar-right">
          <div class="user-avatar" @click="showLogoutConfirm = true">
            {{ userInitial }}
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="main-content">
        <transition name="fade-slide" mode="out-in">
          <DashboardResumenTab v-if="currentView === 'dashboard'" key="dashboard" @navigate="handleTabNavigate" @route="navigateTo" />
          <DashboardPaymentsTab v-else-if="currentView === 'payments'" key="payments" />
          <DashboardUsersTab v-else-if="currentView === 'users'" key="users" />
          <DashboardTrackingTab v-else-if="currentView === 'tracking'" key="tracking" />
        </transition>
      </main>
    </div>

    <!-- ===================== MODALS ===================== -->
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

// ─── LAYOUT ───────────────────────────────────────────
.admin-shell {
  display: flex;
  min-height: 100vh;
  background: $ink-1000;
  color: $fg-dark;
  overflow: hidden; // Prevenir el desbordamiento completo a nivel raíz
}

// ─── SIDEBAR ──────────────────────────────────────────
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  background: $ink-900;
  border-right: 1px solid rgba($ink-500, 0.15);
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

// ─── SIDEBAR BRAND ────────────────────────────────────
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
    z-index: 40;
    width: 30px;
    height: 30px;
    background: linear-gradient(180deg, $brand-orange, darken($brand-orange, 12%));
    border: 1px solid rgba($brand-orange, 0.6);
    color: $ink-1000;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.7rem;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45), 0 0 0 2px rgba(240, 138, 31, 0.12);
    transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;

    &:hover {
      transform: translateY(-50%) scale(1.05);
      box-shadow: 0 14px 28px rgba(0, 0, 0, 0.5), 0 0 0 3px rgba(240, 138, 31, 0.22);
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

// ─── SIDEBAR NAV ──────────────────────────────────────
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: $space-4 $space-3;
  overflow-y: auto;
  
  // Custom scrollbar
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba($ink-500, 0.3);
    border-radius: 4px;
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
    background: rgba($ink-500, 0.15);
    margin: $space-2 $space-3;
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

    .nav-badge {
      margin-left: auto;
      background: rgba($brand-orange, 0.15);
      color: $brand-orange;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 20px;
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

// ─── SIDEBAR FOOTER ───────────────────────────────────
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

// ─── MAIN AREA ────────────────────────────────────────
.main-area {
  flex: 1;
  margin-left: 280px;
  transition: margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-width: 0; // Previene que el flex child crezca más allá del contenedor padre
  overflow-x: hidden;

  .sidebar-collapsed & {
    margin-left: 72px;
  }

  @media (max-width: 768px) {
    margin-left: 0 !important;
  }
}


// ─── TOP BAR ──────────────────────────────────────────
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

// ─── MAIN CONTENT ─────────────────────────────────────
.main-content {
  flex: 1;
  padding: $space-8;
  overflow-y: auto;
  overflow-x: hidden; // Forzar a no tener scroll horizontal dentro de esta caja
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    padding: $space-4;
  }
}

// ─── MODALS ───────────────────────────────────────────
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
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $space-2;
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

// ─── TRANSITIONS ──────────────────────────────────────
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
