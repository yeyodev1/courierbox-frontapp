<template>
  <div class="moto-shell">
    <header class="moto-topbar">
      <div class="brand">
        <span class="brand-mark"><i class="fa-solid fa-motorcycle" aria-hidden="true" /></span>
        <div class="brand-copy">
          <strong>Courier Box</strong>
          <span>Mis entregas</span>
        </div>
      </div>
      <div class="moto-user">
        <span class="moto-name">{{ userName }}</span>
        <button class="logout-btn" @click="auth.logout()" aria-label="Salir">
          <i class="fa-solid fa-right-from-bracket" aria-hidden="true" />
        </button>
      </div>
    </header>

    <main class="moto-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

const auth = useAuthStore()
const userName = computed(() => auth.currentUser?.name || auth.profile?.name || 'Motorizado')

onMounted(() => {
  if (!auth.profile) auth.bootstrap()
})
</script>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.moto-shell {
  min-height: 100vh;
  background: $ink-1000;
  display: flex;
  flex-direction: column;
}
.moto-topbar {
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: center; justify-content: space-between;
  padding: $space-4 $space-4;
  background: $ink-900;
  border-bottom: 1px solid $ink-700;
}
.brand { display: flex; align-items: center; gap: $space-3; }
.brand-mark {
  width: 40px; height: 40px; border-radius: 12px;
  background: $brand-orange; color: $ink-1000;
  display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
}
.brand-copy { display: flex; flex-direction: column; line-height: 1.1; }
.brand-copy strong { color: $fg-dark; font-size: 0.95rem; }
.brand-copy span { color: $ink-400; font-size: 0.75rem; }
.moto-user { display: flex; align-items: center; gap: $space-3; }
.moto-name { color: $ink-300; font-size: 0.85rem; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.logout-btn {
  background: transparent; border: 1px solid rgba($brand-orange, 0.25);
  color: $brand-orange; border-radius: 10px; padding: $space-2 $space-3; cursor: pointer;
}
.moto-main {
  flex: 1;
  padding: $space-4;
  max-width: 760px; width: 100%; margin: 0 auto;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
