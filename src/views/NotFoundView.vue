<script setup lang="ts">
/**
 * Wrong URLs used to redirect to the homepage without a word, which reads as
 * "the site is broken" rather than "that address does not exist". This says
 * what happened and offers the routes people were most likely aiming for.
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import BrandMark from '@/components/ui/BrandMark.vue'
import { WHATSAPP_DISPLAY, whatsappUrl } from '@/config/contact'

const route = useRoute()
const auth = useAuthStore()

const PANEL_POR_ROL: Record<string, { to: string; label: string }> = {
  admin: { to: '/admin', label: 'Ir a Administración' },
  gerencia: { to: '/admin', label: 'Ir a Administración' },
  superadmin: { to: '/superadmin', label: 'Ir a la suite privada' },
  asesor: { to: '/asesor', label: 'Ir a mi panel de asesor' },
  bodega: { to: '/bodega', label: 'Ir a Bodega' },
  motorizado: { to: '/motorizado', label: 'Ir a mis entregas' },
}

/** Signed-in users get their own panel first; everyone else gets the site. */
const panel = computed(() =>
  auth.isAuthenticated() ? PANEL_POR_ROL[String(auth.userRole ?? '')] : undefined,
)

const destinos = [
  { to: '/rastrear', icon: 'fa-solid fa-magnifying-glass-location', label: 'Rastrear un envío' },
  { to: '/comprar-por-mi', icon: 'fa-solid fa-cart-shopping', label: 'Pedir una compra' },
  { to: '/pagos', icon: 'fa-solid fa-file-invoice-dollar', label: 'Mis pagos' },
  { to: '/contacto', icon: 'fa-solid fa-headset', label: 'Contacto' },
]
</script>

<template>
  <main class="nf">
    <div class="nf__inner">
      <BrandMark :size="44" with-word subtitle="Logistics" class="nf__brand" />

      <p class="nf__code">Error 404</p>
      <h1>Esta página no existe</h1>
      <p class="nf__lede">
        La dirección <code>{{ route.fullPath }}</code> no corresponde a ninguna página.
        Puede que el enlace esté mal escrito o que ya no esté disponible.
      </p>

      <RouterLink v-if="panel" :to="panel.to" class="nf__primary">
        <i class="fa-solid fa-arrow-right" aria-hidden="true" /> {{ panel.label }}
      </RouterLink>
      <RouterLink v-else to="/" class="nf__primary">
        <i class="fa-solid fa-arrow-right" aria-hidden="true" /> Ir al inicio
      </RouterLink>

      <nav class="nf__grid" aria-label="Páginas más buscadas">
        <RouterLink v-for="d in destinos" :key="d.to" :to="d.to" class="nf__card">
          <i :class="d.icon" aria-hidden="true" />
          <span>{{ d.label }}</span>
        </RouterLink>
      </nav>

      <p class="nf__help">
        ¿Llegaste desde un enlace nuestro? Avísanos por
        <a :href="whatsappUrl(`Hola Courier Box, el enlace ${route.fullPath} no funciona.`)" target="_blank" rel="noopener">
          WhatsApp {{ WHATSAPP_DISPLAY }}
        </a>
        y lo corregimos.
      </p>
    </div>
  </main>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/tokens/motion' as *;

.nf {
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp($space-6, 6vw, $space-16);
  background:
    radial-gradient(90% 70% at 50% 0%, rgba($brand-orange, 0.1), transparent 60%),
    $ink-1000;
}

.nf__inner {
  width: 100%;
  max-width: 40rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: $space-4;
}

.nf__brand { margin-bottom: $space-4; }

.nf__code {
  margin: 0;
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: $brand-orange;
}

h1 {
  margin: 0;
  font-size: clamp(1.8rem, 5vw, 2.6rem);
  line-height: 1.1;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

.nf__lede {
  margin: 0;
  color: $ink-300;
  max-width: 52ch;
  line-height: 1.65;

  code {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 0.88em;
    padding: 0.1rem 0.35rem;
    border-radius: 5px;
    background: $ink-850;
    color: $ink-100;
    word-break: break-all;
  }
}

.nf__primary {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  min-height: 48px;
  margin-top: $space-2;
  padding: 0 $space-6;
  border-radius: $radius-md;
  background: $brand-orange;
  color: $ink-1000;
  font-weight: 700;
  text-decoration: none;
  transition: background $dur-fast ease;

  &:hover { background: $brand-orange-soft; }
  &:focus-visible { outline: 2px solid $brand-orange; outline-offset: 3px; }
}

.nf__grid {
  width: 100%;
  margin-top: $space-4;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: $space-3;
}

.nf__card {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid rgba($ink-500, 0.22);
  background: $ink-900;
  color: $ink-200;
  text-decoration: none;
  font-size: 0.92rem;
  transition: border-color $dur-fast ease, background $dur-fast ease;

  i { color: $brand-orange; width: 20px; text-align: center; }

  &:hover { border-color: rgba($brand-orange, 0.45); background: $ink-850; }
  &:focus-visible { outline: 2px solid $brand-orange; outline-offset: 2px; }
}

.nf__help {
  margin: $space-4 0 0;
  color: $ink-500;
  font-size: 0.85rem;

  a { color: $brand-orange; text-decoration: none; }
  a:hover { text-decoration: underline; }
}
</style>
