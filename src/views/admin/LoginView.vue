<script setup lang="ts">
/**
 * Single entry point for all five roles. After authenticating, the router
 * target depends on the role the API returns, so the screen also names where
 * each role lands — otherwise people who wear two hats never know which panel
 * they are about to get.
 */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { adminApi } from '@/services/admin.api'
import { useToastStore } from '@/stores/toast.store'
import BrandMark from '@/components/ui/BrandMark.vue'
import { SUPPORT_EMAIL, WHATSAPP_DISPLAY, whatsappUrl } from '@/config/contact'

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()

const DESTINO_POR_ROL: Record<string, { ruta: string; panel: string }> = {
  asesor: { ruta: 'AsesorDashboard', panel: 'Panel de asesor' },
  superadmin: { ruta: 'SuperadminDashboard', panel: 'Suite privada' },
  motorizado: { ruta: 'MotorizadoEntregas', panel: 'Mis entregas' },
  bodega: { ruta: 'BodegaCompras', panel: 'Bodega y counter' },
}

const puedeEnviar = computed(
  () => email.value.trim().length > 0 && password.value.length > 0 && !loading.value,
)

async function handleLogin() {
  if (!puedeEnviar.value) return
  loading.value = true
  error.value = ''
  try {
    const res = await adminApi.login(email.value.trim(), password.value)
    authStore.setToken(res.token)
    const destino = DESTINO_POR_ROL[res.user?.role ?? '']
    router.push({ name: destino?.ruta ?? 'AdminDashboard' })
  } catch (err: any) {
    // Keep the message on the form. A toast disappears before it is read, and
    // this is the one place where the reason has to stay put.
    error.value =
      err?.status === 401
        ? 'Correo o contraseña incorrectos. Revisa e intenta de nuevo.'
        : err?.status === 429
          ? 'Demasiados intentos seguidos. Espera un minuto antes de reintentar.'
          : err?.message || 'No pudimos iniciar sesión. Intenta de nuevo.'
    toastStore.showNotification(error.value, 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login">
    <!-- Marca y contexto -->
    <section class="login__aside">
      <div class="aside__inner">
        <BrandMark :size="52" with-word subtitle="Logistics" class="aside__brand" />

        <h1>El sistema operativo de tu courier.</h1>
        <p class="aside__lede">
          Counter, bodega, envíos, compras y cobranzas en un solo lugar.
        </p>

        <ul class="aside__panels">
          <li><span>Administración</span><small>Finanzas, reportes y usuarios</small></li>
          <li><span>Asesor</span><small>Ventas y gestiones de compra</small></li>
          <li><span>Bodega y counter</span><small>Recepción, facturación y entregas</small></li>
          <li><span>Motorizado</span><small>Rutas y entregas del día</small></li>
        </ul>

        <p class="aside__foot">Entras con un solo acceso; el panel se abre según tu rol.</p>
      </div>
    </section>

    <!-- Formulario -->
    <section class="login__form">
      <div class="form__inner">
        <BrandMark :size="40" with-word variant="plate" class="form__brand" />

        <header class="form__head">
          <h2>Inicia sesión</h2>
          <p>Usa el correo con el que te registraron en Courier Box.</p>
        </header>

        <form novalidate @submit.prevent="handleLogin">
          <label class="field">
            <span class="field__label">Correo electrónico</span>
            <input
              v-model="email"
              type="email"
              inputmode="email"
              autocomplete="username"
              placeholder="nombre@courierboxlogistics.com"
              :aria-invalid="Boolean(error)"
              required
            />
          </label>

          <label class="field">
            <span class="field__label">Contraseña</span>
            <span class="field__control">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="Tu contraseña"
                :aria-invalid="Boolean(error)"
                required
              />
              <button
                type="button"
                class="field__toggle"
                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                @click="showPassword = !showPassword"
              >
                <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" aria-hidden="true" />
              </button>
            </span>
          </label>

          <p v-if="error" class="form__error" role="alert">
            <i class="fa-solid fa-circle-exclamation" aria-hidden="true" />
            {{ error }}
          </p>

          <button type="submit" class="form__submit" :disabled="!puedeEnviar">
            <i v-if="loading" class="fa-solid fa-circle-notch fa-spin" aria-hidden="true" />
            {{ loading ? 'Entrando…' : 'Entrar' }}
          </button>
        </form>

        <footer class="form__foot">
          <p>
            ¿No puedes entrar? Escríbenos a
            <a :href="whatsappUrl('Hola Courier Box, no puedo entrar al sistema.')" target="_blank" rel="noopener">
              {{ WHATSAPP_DISPLAY }}
            </a>
            o a <a :href="`mailto:${SUPPORT_EMAIL}`">{{ SUPPORT_EMAIL }}</a>.
          </p>
          <RouterLink to="/" class="form__back">
            <i class="fa-solid fa-arrow-left" aria-hidden="true" /> Volver al sitio
          </RouterLink>
        </footer>
      </div>
    </section>
  </main>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/tokens/motion' as *;

.login {
  min-height: 100svh;
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  background: $ink-1000;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

/* ── Panel de marca ── */
.login__aside {
  position: relative;
  display: flex;
  align-items: center;
  padding: clamp($space-8, 6vw, $space-24);
  overflow: hidden;
  background:
    radial-gradient(120% 90% at 12% 8%, rgba($brand-orange, 0.16), transparent 62%),
    radial-gradient(90% 80% at 88% 92%, rgba($brand-orange, 0.09), transparent 60%),
    $ink-900;
  border-right: 1px solid rgba($ink-500, 0.16);

  /* Ghosted mark: brand presence without competing with the copy. */
  &::after {
    content: '';
    position: absolute;
    right: -14%;
    bottom: -22%;
    width: 68%;
    aspect-ratio: 1;
    background: radial-gradient(circle, rgba($brand-orange, 0.12), transparent 68%);
    pointer-events: none;
  }

  @media (max-width: 900px) {
    display: none;
  }
}

.aside__inner {
  position: relative;
  z-index: 1;
  max-width: 30rem;
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.aside__brand { margin-bottom: $space-4; }

.login__aside h1 {
  margin: 0;
  font-size: clamp(1.9rem, 3.2vw, 2.7rem);
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: $fg-dark;
  text-wrap: balance;
}

.aside__lede {
  margin: 0;
  color: $ink-300;
  font-size: 1.02rem;
  max-width: 40ch;
}

.aside__panels {
  list-style: none;
  margin: $space-3 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-3;

  li {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding-left: $space-4;
    border-left: 2px solid rgba($brand-orange, 0.45);
  }

  span { color: $ink-100; font-weight: 600; font-size: 0.95rem; }
  small { color: $ink-400; font-size: 0.82rem; }
}

.aside__foot {
  margin: $space-4 0 0;
  color: $ink-500;
  font-size: 0.82rem;
}

/* ── Panel del formulario ── */
.login__form {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp($space-6, 5vw, $space-16);
  background: $ink-1000;
}

.form__inner {
  width: 100%;
  max-width: 24rem;
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

/* Only shown where the brand panel is hidden. */
.form__brand {
  display: none;
  align-self: center;

  @media (max-width: 900px) { display: inline-flex; }
}

.form__head {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  h2 { margin: 0; font-size: 1.5rem; letter-spacing: -0.01em; }
  p { margin: 0; color: $ink-400; font-size: 0.92rem; }
}

form {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.field {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.field__label {
  font-size: 0.85rem;
  color: $ink-300;
  font-weight: 500;
}

.field__control { position: relative; display: flex; }

input {
  width: 100%;
  min-height: 50px;
  padding: 0 $space-4;
  border-radius: $radius-md;
  border: 1px solid rgba($ink-500, 0.3);
  background: $ink-900;
  color: $fg-dark;
  font: inherit;
  outline: none;
  transition: border-color $dur-fast ease, box-shadow $dur-fast ease;

  &::placeholder { color: $ink-500; }

  &:focus {
    border-color: rgba($brand-orange, 0.65);
    box-shadow: 0 0 0 3px rgba($brand-orange, 0.14);
  }

  &[aria-invalid='true'] { border-color: rgba($signal-red, 0.55); }
}

.field__control input { padding-right: 3rem; }

.field__toggle {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: $radius-sm;
  background: transparent;
  color: $ink-400;
  cursor: pointer;

  &:hover { color: $ink-200; }
  &:focus-visible { outline: 2px solid $brand-orange; outline-offset: 2px; }
}

.form__error {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin: 0;
  padding: $space-3;
  border-radius: $radius-md;
  background: rgba($signal-red, 0.1);
  border: 1px solid rgba($signal-red, 0.3);
  color: #ff9a9e;
  font-size: 0.87rem;
}

.form__submit {
  min-height: 50px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  border: none;
  border-radius: $radius-md;
  background: $brand-orange;
  color: $ink-1000;
  font: inherit;
  font-weight: 700;
  font-size: 0.98rem;
  cursor: pointer;
  transition: background $dur-fast ease, opacity $dur-fast ease;

  &:hover:not(:disabled) { background: $brand-orange-soft; }

  /* Fading the orange turned it into a muddy brown. A neutral surface reads as
     "not yet" instead of "broken button". */
  &:disabled {
    background: $ink-800;
    color: $ink-500;
    border: 1px solid rgba($ink-500, 0.28);
    cursor: not-allowed;
  }

  &:focus-visible { outline: 2px solid $brand-orange; outline-offset: 3px; }
}

.form__foot {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding-top: $space-4;
  border-top: 1px solid rgba($ink-500, 0.16);

  p { margin: 0; color: $ink-500; font-size: 0.82rem; line-height: 1.6; }
  a { color: $brand-orange; text-decoration: none; }
  a:hover { text-decoration: underline; }
}

.form__back {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  color: $ink-400 !important;
  font-size: 0.82rem;

  &:hover { color: $ink-200 !important; }
}
</style>
