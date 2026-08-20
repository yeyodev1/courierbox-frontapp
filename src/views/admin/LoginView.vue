<script setup lang="ts">
/** Single entry point for all five roles; the panel opens according to the role. */
import { ref } from 'vue'
import BrandMark from '@/components/ui/BrandMark.vue'
import { SUPPORT_EMAIL, WHATSAPP_DISPLAY, whatsappUrl } from '@/config/contact'
import LoginAside from './Login/LoginAside.vue'
import { useLogin } from './Login/useLogin'

const l = useLogin()
const showPassword = ref(false)
</script>

<template>
  <main class="login">
    <LoginAside />

    <section class="login__form">
      <div class="form__inner">
        <BrandMark :size="40" with-word variant="plate" class="form__brand" />

        <header class="form__head">
          <h2>Inicia sesión</h2>
          <p>Usa el correo con el que te registraron en Courier Box.</p>
        </header>

        <form novalidate @submit.prevent="l.submit">
          <label class="field">
            <span class="field__label">Correo electrónico</span>
            <input
              v-model="l.email.value"
              type="email"
              inputmode="email"
              autocomplete="username"
              placeholder="nombre@courierboxlogistics.com"
              :aria-invalid="Boolean(l.error.value)"
              required
            />
          </label>

          <label class="field">
            <span class="field__label">Contraseña</span>
            <span class="field__control">
              <input
                v-model="l.password.value"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="Tu contraseña"
                :aria-invalid="Boolean(l.error.value)"
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

          <p v-if="l.error.value" class="form__error" role="alert">
            <i class="fa-solid fa-circle-exclamation" aria-hidden="true" />
            {{ l.error.value }}
          </p>

          <button type="submit" class="form__submit" :disabled="!l.puedeEnviar.value">
            <i v-if="l.loading.value" class="fa-solid fa-circle-notch fa-spin" aria-hidden="true" />
            {{ l.loading.value ? 'Entrando…' : 'Entrar' }}
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

  @media (max-width: 900px) { grid-template-columns: 1fr; }
}

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

.field__control {
  position: relative;
  display: flex;

  input { padding-right: 3rem; }
}

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

@media (prefers-reduced-motion: reduce) {
  input,
  .form__submit { transition: none; }
}
</style>
