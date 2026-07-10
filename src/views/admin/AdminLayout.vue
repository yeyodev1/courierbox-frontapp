<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import AppButton from '@/components/ui/AppButton.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const sidebarExpanded = ref(true)
const sidebarMobileOpen = ref(false)
const showLogoutConfirm = ref(false)
const currentRole = computed(() => authStore.userRole || 'admin')
const basePath = computed(() => (currentRole.value === 'superadmin' ? '/superadmin' : '/admin'))

function p(path: string) {
  return `${basePath.value}${path}`
}

const menuGroups = computed(() => {
  if (currentRole.value === 'superadmin') {
    return [
      {
        label: 'Privado',
        items: [
          { path: p(''), label: 'Dashboard Ejecutivo', icon: 'fa-solid fa-chart-line', match: (routePath: string) => routePath.startsWith('/superadmin') },
          { path: p('/reportes'), label: 'Estado de Resultados', icon: 'fa-solid fa-file-invoice-dollar', match: (routePath: string) => routePath.startsWith('/superadmin/reportes') },
          { path: p('/produccion'), label: 'Producción Diaria', icon: 'fa-solid fa-clipboard-list', match: (routePath: string) => routePath.startsWith('/superadmin/produccion') },
          { path: p('/caja'), label: 'Caja', icon: 'fa-solid fa-vault', match: (routePath: string) => routePath.startsWith('/superadmin/caja') },
        ],
      },
    ]
  }

  return [
    {
      label: 'Navegación',
      items: [
        { path: p(''), label: 'Dashboard', icon: 'fa-solid fa-chart-pie', match: (routePath: string) => routePath === basePath.value },
        { path: p('/payments'), label: 'Links de Pago', icon: 'fa-solid fa-link', match: (routePath: string) => routePath.startsWith(`${basePath.value}/payments`) },
        { path: p('/users'), label: 'Usuarios', icon: 'fa-solid fa-users', match: (routePath: string) => routePath.startsWith(`${basePath.value}/users`) },
        { path: p('/tracking'), label: 'Tracking Interno', icon: 'fa-solid fa-magnifying-glass-location', match: (routePath: string) => routePath.startsWith(`${basePath.value}/tracking`) },
      ],
    },
    {
      label: 'Operaciones',
      items: [
        { path: p('/purchase-orders'), label: 'Pendientes de Compra', icon: 'fa-solid fa-cart-shopping', match: (routePath: string) => routePath.startsWith(`${basePath.value}/purchase-orders`) },
        { path: p('/envios'), label: 'Envíos', icon: 'fa-solid fa-truck', match: (routePath: string) => routePath.startsWith(`${basePath.value}/envios`) },
        { path: p('/contactos'), label: 'Contactos', icon: 'fa-solid fa-address-book', match: (routePath: string) => routePath.startsWith(`${basePath.value}/contactos`) },
      ],
    },
        {
          label: 'Finanzas',
          items: [
            { path: p('/costos'), label: 'Costos y Gastos', icon: 'fa-solid fa-coins', match: (routePath: string) => routePath.startsWith(`${basePath.value}/costos`) },
            { path: p('/proveedores'), label: 'Proveedores', icon: 'fa-solid fa-truck-fast', match: (routePath: string) => routePath.startsWith(`${basePath.value}/proveedores`) },
            { path: p('/caja'), label: 'Caja', icon: 'fa-solid fa-vault', match: (routePath: string) => routePath.startsWith(`${basePath.value}/caja`) },
            { path: p('/reportes'), label: 'Estado de Resultados', icon: 'fa-solid fa-file-invoice-dollar', match: (routePath: string) => routePath.startsWith(`${basePath.value}/reportes`) },
          ],
        },
    {
      label: 'Producción',
      items: [
        { path: p('/produccion'), label: 'Producción Diaria', icon: 'fa-solid fa-clipboard-list', match: (routePath: string) => routePath.startsWith(`${basePath.value}/produccion`) },
        { path: p('/conciliacion'), label: 'Conciliación', icon: 'fa-solid fa-file-invoice', match: (routePath: string) => routePath.startsWith(`${basePath.value}/conciliacion`) },
      ],
    },
    {
      label: 'Gestión de Compra',
      items: [
        { path: p('/gestiones-compra'), label: 'Gestiones de Compra', icon: 'fa-solid fa-bag-shopping', match: (routePath: string) => routePath.startsWith(`${basePath.value}/gestiones-compra`) },
        { path: p('/cuentas-bancarias'), label: 'Cuentas Bancarias', icon: 'fa-solid fa-building-columns', match: (routePath: string) => routePath.startsWith(`${basePath.value}/cuentas-bancarias`) },
      ],
    },
    {
      label: 'Asesores',
      items: [
        { path: p('/fee-config'), label: 'Tarifas', icon: 'fa-solid fa-calculator', match: (routePath: string) => routePath.startsWith(`${basePath.value}/fee-config`) },
      ],
    },
  ]
})

const currentPath = computed(() => route.path)

const userDisplayName = computed(() => {
  const u = authStore.currentUser
  return u?.name || u?.email || 'Admin'
})
const userEmail = computed(() => authStore.currentUser?.email || '')
const userInitial = computed(() => userDisplayName.value.charAt(0).toUpperCase())
const roleLabel = computed(() => (currentRole.value === 'superadmin' ? 'Private Suite' : currentRole.value === 'gerencia' ? 'Gerencia' : 'Admin Panel'))

const pageMeta = computed(() => {
  const map: Record<string, { title: string; sub: string }> = {
    '/admin': { title: 'Dashboard', sub: 'Resumen general del sistema' },
    '/superadmin': { title: 'Dashboard Ejecutivo', sub: 'Control privado y visión ejecutiva' },
    '/admin/payments': { title: 'Links de Pago', sub: 'Genera y administra links de pago' },
    '/admin/users': { title: 'Usuarios', sub: 'Administra los miembros del equipo' },
    '/admin/tracking': { title: 'Tracking Interno', sub: 'Consulta el estado de los envíos' },
    '/admin/fee-config': { title: 'Configuración de tarifas', sub: 'Define el fee de gestión para asesores' },
    '/admin/purchase-orders': { title: 'Pendientes de Compra', sub: 'Revisa y gestiona las órdenes pendientes de comprar' },
    '/admin/costos': { title: 'Costos y Gastos', sub: 'Registra costos operacionales, logísticos y de envío' },
    '/admin/proveedores': { title: 'Proveedores', sub: 'Crea y administra los proveedores conectados a costos y envíos' },
    '/admin/envios': { title: 'Envíos a Domicilio', sub: 'Gestiona los envíos de última milla' },
    '/admin/caja': { title: 'Caja', sub: 'Movimientos de ingreso y egreso' },
    '/admin/produccion': { title: 'Producción Diaria', sub: 'Registro diario de producción y CRM' },
    '/admin/reportes': { title: 'Estado de Resultados', sub: 'Resultados, gastos y flujo real' },
    '/admin/contactos': { title: 'Contactos', sub: 'Busca clientes, revisa órdenes e historial de gestión' },
    '/admin/conciliacion': { title: 'Conciliación Bancaria', sub: 'Cruza pagos con transacciones bancarias' },
    '/admin/metrics': { title: 'Métricas GHL', sub: 'Métricas de GoHighLevel' },
    '/admin/gestiones-compra': { title: 'Gestiones de Compra', sub: 'Administra las gestiones de compra del equipo' },
    '/admin/cuentas-bancarias': { title: 'Cuentas Bancarias', sub: 'Configura las cuentas de cobro de reservas' },
    '/superadmin/reportes': { title: 'Estado de Resultados', sub: 'Visión ejecutiva privada' },
    '/superadmin/produccion': { title: 'Producción Diaria', sub: 'Control privado de producción' },
    '/superadmin/caja': { title: 'Caja', sub: 'Seguimiento financiero privado' },
  }
  return map[route.path] || { title: 'Admin', sub: '' }
})

function navigate(path: string) {
  router.push(path)
  sidebarMobileOpen.value = false
}

function handleLogoutKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') showLogoutConfirm.value = false
}
</script>

<template>
  <div class="admin-shell" :class="{ 'sidebar-collapsed': !sidebarExpanded }">
    <!-- Mobile overlay -->
    <transition name="fade">
      <div
        v-if="sidebarMobileOpen"
        class="mobile-overlay"
        aria-hidden="true"
        @click="sidebarMobileOpen = false"
      />
    </transition>

    <!-- ===== SIDEBAR ===== -->
    <aside class="sidebar" :class="{ 'mobile-open': sidebarMobileOpen }" aria-label="Barra de navegación">
      <div class="sidebar-brand">
        <div class="brand-icon">
          <span class="logo-mark">C</span>
        </div>
        <div class="brand-text" v-show="sidebarExpanded">
          <span class="brand-name">Courier Box</span>
          <span class="brand-role">{{ roleLabel }}</span>
        </div>
        <button
          class="collapse-btn"
          :aria-label="sidebarExpanded ? 'Colapsar sidebar' : 'Expandir sidebar'"
          @click="sidebarExpanded = !sidebarExpanded"
        >
          <i class="fa-solid fa-chevron-left" aria-hidden="true" :class="{ rotated: !sidebarExpanded }" />
        </button>
      </div>

      <nav class="sidebar-nav" aria-label="Secciones de administración" data-lenis-prevent data-lenis-prevent-wheel data-lenis-prevent-touch>
        <template v-for="(group, gi) in menuGroups" :key="group.label">
          <span class="nav-section-label" v-show="sidebarExpanded">{{ group.label }}</span>
          <button
            v-for="item in group.items"
            :key="item.path"
            class="nav-item"
            :class="{ active: item.match(currentPath) }"
            :aria-current="item.match(currentPath) ? 'page' : undefined"
            @click="navigate(item.path)"
            :title="!sidebarExpanded ? item.label : ''"
          >
            <span class="nav-icon-wrapper">
              <i :class="item.icon" aria-hidden="true" />
            </span>
            <span class="nav-label" v-show="sidebarExpanded">{{ item.label }}</span>
          </button>
          <div v-if="gi < menuGroups.length - 1" class="nav-divider" v-show="sidebarExpanded" />
        </template>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-user">
          <span class="user-avatar-mini">{{ userInitial }}</span>
          <div class="user-info-text" v-show="sidebarExpanded">
            <span class="user-name">{{ userDisplayName }}</span>
            <span class="user-email">{{ userEmail }}</span>
          </div>
        </div>
        <button class="logout-icon-btn" aria-label="Cerrar sesión" @click="showLogoutConfirm = true">
          <i class="fa-solid fa-right-from-bracket" aria-hidden="true" />
        </button>
      </div>
    </aside>

    <!-- ===== MAIN ===== -->
    <div class="main-area">
      <header class="top-bar">
        <div class="top-bar-left">
          <button class="hamburger" aria-label="Abrir menú de navegación" @click="sidebarMobileOpen = true">
            <i class="fa-solid fa-bars" aria-hidden="true" />
          </button>
          <div class="page-title-group">
            <h1 class="page-title">{{ pageMeta.title }}</h1>
            <p class="page-subtitle">{{ pageMeta.sub }}</p>
          </div>
        </div>
        <div class="top-bar-right">
          <span
            class="user-avatar"
            :title="userDisplayName"
            tabindex="0"
            role="button"
            aria-label="Abrir opciones de usuario"
            @click="showLogoutConfirm = true"
            @keydown.enter="showLogoutConfirm = true"
          >
            {{ userInitial }}
          </span>
        </div>
      </header>

      <main class="main-content" id="admin-main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <!-- ===== LOGOUT MODAL ===== -->
    <transition name="fade">
      <div
        v-if="showLogoutConfirm"
        class="modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-modal-title"
        @click.self="showLogoutConfirm = false"
        @keydown.escape="handleLogoutKeydown"
      >
        <div class="modal-card">
          <div class="modal-icon-box warn">
            <i class="fa-solid fa-right-from-bracket" aria-hidden="true" />
          </div>
          <h3 id="logout-modal-title" class="modal-title">Cerrar Sesión</h3>
          <p>¿Estás seguro de que deseas cerrar sesión?</p>
          <div class="modal-actions">
            <AppButton variant="outline" @click="showLogoutConfirm = false">Cancelar</AppButton>
            <AppButton variant="primary" @click="authStore.logout()">Sí, cerrar sesión</AppButton>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.admin-shell {
  display: flex;
  min-height: 100vh;
  background: $ink-1000;
  color: $fg-dark;
  overflow-x: hidden;
}

// ─── SIDEBAR ──────────────────────────────────────────
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

// ─── BRAND ────────────────────────────────────────────
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

    &:focus-visible {
      outline: 2px solid $brand-orange;
      outline-offset: 2px;
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

// ─── NAV ──────────────────────────────────────────────
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

  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba($ink-500, 0.28);
    border-radius: 999px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba($ink-400, 0.38);
    border: 2px solid transparent;
    background-clip: padding-box;
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

    &:focus-visible {
      outline: 2px solid $brand-orange;
      outline-offset: -2px;
    }

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

// ─── FOOTER ───────────────────────────────────────────
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

    &:focus-visible {
      outline: 2px solid $brand-orange;
      outline-offset: 2px;
    }

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
  min-width: 0;

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

        &:focus-visible {
          outline: 2px solid $brand-orange;
          outline-offset: 2px;
        }
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

      &:focus-visible {
        outline: 2px solid $brand-orange;
        outline-offset: 2px;
      }
    }
  }
}

// ─── CONTENT ──────────────────────────────────────────
.main-content {
  flex: 1;
  padding: $space-8;
  overflow-y: auto;
  overflow-x: hidden;
  min-width: 0;

  @media (max-width: 768px) {
    padding: $space-4;
  }
}

// ─── MODAL ────────────────────────────────────────────
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

  .modal-icon-box {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 0 $space-4;
    font-size: 1.2rem;

    &.warn { background: rgba($signal-amber, 0.12); color: $signal-amber; }
  }

  .modal-title {
    font-size: 1.15rem;
    margin: 0 0 $space-2;
    text-align: left;
  }

  p {
    color: $ink-300;
    font-size: 0.9rem;
    margin: 0 0 $space-6;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: $space-3;

    @media (max-width: 640px) {
      flex-direction: column;
    }
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
