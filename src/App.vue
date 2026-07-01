<script setup lang="ts">
import SiteNav from "@/layout/SiteNav.vue";
import FooterEditorial from "@/components/sections/FooterEditorial.vue";
import WhatsAppFab from "@/components/ui/WhatsAppFab.vue";
import AppPreloader from "@/components/ui/AppPreloader.vue";
import { useLenis } from "@/composables/useLenis";
import { useToastStore } from "@/stores/toast.store";
import { onMounted, onUnmounted } from "vue";
import { useAuthStore } from "@/stores/auth.store";

useLenis();
const toastStore = useToastStore();

onMounted(() => {
  const authStore = useAuthStore();
  const handleTokenExpired = () => {
    toastStore.showNotification("Sesión expirada. Por favor, inicia sesión nuevamente.", "error");
    authStore.logout();
  };
  
  window.addEventListener("auth:token-expired", handleTokenExpired);
  
  onUnmounted(() => {
    window.removeEventListener("auth:token-expired", handleTokenExpired);
  });
});
</script>

<template>
  <AppPreloader v-if="!$route.path.startsWith('/admin') && !$route.path.startsWith('/superadmin') && !$route.path.startsWith('/login')" />
  <div class="app">
    <SiteNav v-if="!$route.meta.hideNavigation" />
    <RouterView v-slot="{ Component, route }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </Transition>
    </RouterView>
    <FooterEditorial v-if="!$route.meta.hideNavigation" />
    <WhatsAppFab v-if="!$route.meta.hideNavigation" />

    <!-- Global Toast Notification -->
    <transition name="toast-fade">
      <div v-if="toastStore.show" :class="['toast-notification', toastStore.type]">
        <div class="toast-icon">
          <svg v-if="toastStore.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <svg v-else-if="toastStore.type === 'error'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        </div>
        <p>{{ toastStore.message }}</p>
      </div>
    </transition>
  </div>
</template>

<style lang="scss">
.app { min-height: 100vh; display: flex; flex-direction: column; }

.page-enter-from { opacity: 0; transform: translateY(20px); }
.page-enter-active { transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.page-leave-active { transition: opacity 0.2s ease; }
.page-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .page-enter-active, .page-leave-active { transition: none; }
  .page-enter-from { opacity: 1; transform: none; }
}

/* Global Toast Notifications */
.toast-notification {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  background: rgba(#1A1A1A, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  border-left: 4px solid transparent;
  color: #FDFDFD;
}

.toast-notification.success { border-left-color: #2BBB92; }
.toast-notification.success .toast-icon { color: #2BBB92; }

.toast-notification.error { border-left-color: #E5484D; }
.toast-notification.error .toast-icon { color: #E5484D; }

.toast-notification.warning { border-left-color: #FFB347; }
.toast-notification.warning .toast-icon { color: #FFB347; }

.toast-notification.info { border-left-color: #007AFF; }
.toast-notification.info .toast-icon { color: #007AFF; }

.toast-notification p { margin: 0; font-size: 0.9rem; font-weight: 500; }

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
</style>
