<template>
  <div class="bodega-shell">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ open: mobileOpen }">
      <div class="brand">
        <span class="brand-mark"><i class="fa-solid fa-warehouse" aria-hidden="true" /></span>
        <div class="brand-copy">
          <strong>Courier Box</strong>
          <span>Bodega</span>
        </div>
      </div>

      <nav class="nav">
        <router-link to="/bodega" exact-active-class="active" @click="mobileOpen = false">
          <i class="fa-solid fa-box" aria-hidden="true" /> <span>Compras</span>
        </router-link>
        <router-link to="/bodega/envios" active-class="active" @click="mobileOpen = false">
          <i class="fa-solid fa-truck-fast" aria-hidden="true" /> <span>Envíos</span>
        </router-link>
        <router-link to="/bodega/motorizados" active-class="active" @click="mobileOpen = false">
          <i class="fa-solid fa-motorcycle" aria-hidden="true" /> <span>Motorizados</span>
        </router-link>
      </nav>

      <div class="sidebar-foot">
        <div class="user">
          <span class="avatar">{{ initials }}</span>
          <div class="user-info">
            <strong>{{ userName }}</strong>
            <span>Bodega</span>
          </div>
        </div>
        <button class="logout" @click="auth.logout()"><i class="fa-solid fa-right-from-bracket" aria-hidden="true" /> Salir</button>
      </div>
    </aside>

    <div v-if="mobileOpen" class="scrim" @click="mobileOpen = false"></div>

    <!-- Main -->
    <div class="main-col">
      <header class="mobile-bar">
        <button class="burger" @click="mobileOpen = true" aria-label="Menú"><i class="fa-solid fa-bars" aria-hidden="true" /></button>
        <strong>Bodega</strong>
      </header>
      <main class="main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

const auth = useAuthStore()
const mobileOpen = ref(false)
const userName = computed(() => auth.currentUser?.name || auth.profile?.name || 'Bodega')
const initials = computed(() =>
  userName.value.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase() || 'B'
)
onMounted(() => { if (!auth.profile) auth.bootstrap() })
</script>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.bodega-shell { min-height: 100vh; display: flex; background: $ink-1000; }

.sidebar {
  position: sticky; top: 0; align-self: flex-start;
  height: 100vh; width: 260px; flex: 0 0 260px;
  background: $ink-900; border-right: 1px solid $ink-700;
  display: flex; flex-direction: column; gap: $space-5; padding: $space-5;
}
.brand { display: flex; align-items: center; gap: $space-3; }
.brand-mark {
  width: 42px; height: 42px; border-radius: 12px; background: $brand-orange; color: $ink-1000;
  display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
}
.brand-copy { display: flex; flex-direction: column; line-height: 1.15; }
.brand-copy strong { color: $fg-dark; }
.brand-copy span { color: $ink-400; font-size: 0.75rem; }

.nav { display: flex; flex-direction: column; gap: $space-2; flex: 1; }
.nav a {
  display: flex; align-items: center; gap: $space-3; padding: $space-3 $space-4;
  border-radius: 12px; color: $ink-300; text-decoration: none; font-weight: 600; font-size: 0.92rem;
  transition: background 0.15s, color 0.15s;
  i { width: 20px; text-align: center; }
  &:hover { background: rgba($ink-500, 0.14); color: $fg-dark; }
  &.active { background: rgba($brand-orange, 0.12); color: $brand-orange; }
}

.sidebar-foot { display: flex; flex-direction: column; gap: $space-3; border-top: 1px solid $ink-700; padding-top: $space-4; }
.user { display: flex; align-items: center; gap: $space-3; }
.avatar {
  width: 38px; height: 38px; border-radius: 50%; background: $brand-orange; color: $ink-1000;
  display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem;
}
.user-info { display: flex; flex-direction: column; line-height: 1.2; }
.user-info strong { color: $fg-dark; font-size: 0.88rem; }
.user-info span { color: $ink-400; font-size: 0.75rem; }
.logout {
  display: flex; align-items: center; gap: $space-2; justify-content: center;
  background: transparent; border: 1px solid rgba($brand-orange, 0.25); color: $brand-orange;
  border-radius: 10px; padding: $space-2 $space-3; cursor: pointer; font-weight: 600;
}

.main-col { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.mobile-bar { display: none; }
.main { flex: 1; padding: $space-6; max-width: 1200px; width: 100%; margin: 0 auto; }
.scrim { display: none; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 900px) {
  .sidebar {
    position: fixed; z-index: 60; left: 0; top: 0; transform: translateX(-100%);
    transition: transform 0.22s ease;
    &.open { transform: translateX(0); }
  }
  .scrim { display: block; position: fixed; inset: 0; z-index: 50; background: rgba(0,0,0,0.5); }
  .mobile-bar {
    display: flex; align-items: center; gap: $space-3; padding: $space-4;
    background: $ink-900; border-bottom: 1px solid $ink-700; position: sticky; top: 0; z-index: 20;
    strong { color: $fg-dark; }
  }
  .burger { background: transparent; border: 1px solid $ink-600; color: $fg-dark; border-radius: 10px; padding: $space-2 $space-3; cursor: pointer; }
  .main { padding: $space-4; }
}
</style>
