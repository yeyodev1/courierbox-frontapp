<script setup lang="ts">
import SiteNav from "@/layout/SiteNav.vue";
import FooterEditorial from "@/components/sections/FooterEditorial.vue";
import WhatsAppFab from "@/components/ui/WhatsAppFab.vue";
import { useLenis } from "@/composables/useLenis";

useLenis();
</script>

<template>
  <div class="app">
    <SiteNav />
    <RouterView v-slot="{ Component, route }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </Transition>
    </RouterView>
    <FooterEditorial />
    <WhatsAppFab />
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
</style>
