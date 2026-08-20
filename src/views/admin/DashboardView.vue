<script setup lang="ts">
/**
 * Legacy single-page admin panel: the four tabs live inside this view instead of
 * behind routes, so it drives the shared shell by tab id rather than by path.
 */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import AppConfirmModal from '@/components/ui/AppConfirmModal.vue'
import ShellSidebar, { type ShellMenuGroup } from '@/components/layout/ShellSidebar.vue'
import ShellTopBar from '@/components/layout/ShellTopBar.vue'
import DashboardResumenTab from '@/components/admin/DashboardResumenTab.vue'
import DashboardPaymentsTab from '@/components/admin/DashboardPaymentsTab.vue'
import DashboardUsersTab from '@/components/admin/DashboardUsersTab.vue'
import DashboardTrackingTab from '@/components/admin/DashboardTrackingTab.vue'

type TabId = 'dashboard' | 'payments' | 'users' | 'tracking'

const TABS: { id: TabId; label: string; sub: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', sub: 'Resumen general del sistema', icon: 'fa-solid fa-chart-pie' },
  { id: 'payments', label: 'Links de Pago', sub: 'Genera y administra links de pago', icon: 'fa-solid fa-link' },
  { id: 'users', label: 'Usuarios', sub: 'Administra los miembros del equipo', icon: 'fa-solid fa-users' },
  {
    id: 'tracking',
    label: 'Tracking Interno',
    sub: 'Consulta el estado de los envíos',
    icon: 'fa-solid fa-magnifying-glass-location',
  },
]

const authStore = useAuthStore()
const router = useRouter()

const sidebarExpanded = ref(true)
const sidebarMobileOpen = ref(false)
const currentView = ref<TabId>('dashboard')
const showLogoutConfirm = ref(false)

const menuGroups = computed<ShellMenuGroup[]>(() => [
  {
    label: 'Navegación',
    items: TABS.map((t) => ({
      path: t.id,
      label: t.label,
      icon: t.icon,
      match: (current: string) => current === t.id,
    })),
  },
  {
    label: 'Módulos',
    items: [
      {
        path: '/admin/conciliacion',
        label: 'Conciliación',
        icon: 'fa-solid fa-file-invoice',
        // A real route, so it is never the active tab.
        match: () => false,
      },
    ],
  },
])

const activeTab = computed(() => TABS.find((t) => t.id === currentView.value) ?? TABS[0]!)

const userDisplayName = computed(() => {
  const u = authStore.currentUser
  return u?.name || u?.email || 'Admin'
})
const userInitial = computed(() => userDisplayName.value.charAt(0).toUpperCase())

/** Sidebar entries carry either a tab id or a real route path. */
function navigate(target: string) {
  sidebarMobileOpen.value = false
  if (target.startsWith('/')) router.push(target)
  else currentView.value = target as TabId
}
</script>

<template>
  <div class="admin-shell" :class="{ 'sidebar-collapsed': !sidebarExpanded }">
    <transition name="fade">
      <div v-if="sidebarMobileOpen" class="mobile-overlay" aria-hidden="true" @click="sidebarMobileOpen = false" />
    </transition>

    <ShellSidebar
      :groups="menuGroups"
      :current-path="currentView"
      :expanded="sidebarExpanded"
      :mobile-open="sidebarMobileOpen"
      brand-subtitle="Administración"
      :user-display-name="userDisplayName"
      :user-email="authStore.currentUser?.email || ''"
      :user-initial="userInitial"
      @toggle="sidebarExpanded = !sidebarExpanded"
      @navigate="navigate"
      @logout="showLogoutConfirm = true"
    />

    <div class="main-area">
      <ShellTopBar
        :title="activeTab.label"
        :subtitle="activeTab.sub"
        :user-display-name="userDisplayName"
        :user-initial="userInitial"
        @open-sidebar="sidebarMobileOpen = true"
        @logout="showLogoutConfirm = true"
      />

      <main class="main-content" data-lenis-prevent>
        <transition name="fade-slide" mode="out-in">
          <DashboardResumenTab
            v-if="currentView === 'dashboard'"
            key="dashboard"
            @navigate="navigate"
            @route="navigate"
          />
          <DashboardPaymentsTab v-else-if="currentView === 'payments'" key="payments" />
          <DashboardUsersTab v-else-if="currentView === 'users'" key="users" />
          <DashboardTrackingTab v-else key="tracking" />
        </transition>
      </main>
    </div>

    <AppConfirmModal
      :open="showLogoutConfirm"
      title="Cerrar Sesión"
      message="¿Estás seguro de que deseas cerrar sesión?"
      confirm-label="Sí, cerrar"
      variant="warning"
      @cancel="showLogoutConfirm = false"
      @confirm="authStore.logout()"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '@/components/layout/shell' as shell;

@include shell.frame;

.admin-shell { @include shell.root; }
</style>
