<script setup lang="ts">
/** Admin shell: fixed sidebar and top bar, with only the content pane scrolling. */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppConfirmModal from '@/components/ui/AppConfirmModal.vue'
import ShellSidebar from '@/components/layout/ShellSidebar.vue'
import ShellTopBar from '@/components/layout/ShellTopBar.vue'
import { useContentScroll } from '@/composables/useContentScroll'
import { useAdminMenu } from './Layout/useAdminMenu'

const router = useRouter()
useContentScroll()

const menu = useAdminMenu()

const sidebarExpanded = ref(true)
const sidebarMobileOpen = ref(false)
const showLogoutConfirm = ref(false)

function navigate(path: string) {
  router.push(path)
  sidebarMobileOpen.value = false
}
</script>

<template>
  <div class="admin-shell" :class="{ 'sidebar-collapsed': !sidebarExpanded }">
    <transition name="fade">
      <div v-if="sidebarMobileOpen" class="mobile-overlay" aria-hidden="true" @click="sidebarMobileOpen = false" />
    </transition>

    <ShellSidebar
      :groups="menu.menuGroups.value"
      :current-path="menu.currentPath.value"
      :expanded="sidebarExpanded"
      :mobile-open="sidebarMobileOpen"
      :brand-subtitle="menu.roleLabel.value"
      :user-display-name="menu.userDisplayName.value"
      :user-email="menu.userEmail.value"
      :user-initial="menu.userInitial.value"
      @toggle="sidebarExpanded = !sidebarExpanded"
      @navigate="navigate"
      @logout="showLogoutConfirm = true"
    />

    <div class="main-area">
      <ShellTopBar
        :title="menu.pageMeta.value.title"
        :subtitle="menu.pageMeta.value.sub"
        :user-display-name="menu.userDisplayName.value"
        :user-initial="menu.userInitial.value"
        @open-sidebar="sidebarMobileOpen = true"
        @logout="showLogoutConfirm = true"
      />

      <main ref="contentPane" id="admin-main-content" class="main-content" data-lenis-prevent>
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <AppConfirmModal
      :open="showLogoutConfirm"
      title="Cerrar Sesión"
      message="¿Estás seguro de que deseas cerrar sesión?"
      confirm-label="Sí, cerrar sesión"
      variant="warning"
      @cancel="showLogoutConfirm = false"
      @confirm="menu.authStore.logout()"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '@/components/layout/shell' as shell;

@include shell.frame;

.admin-shell { @include shell.root; }
</style>
