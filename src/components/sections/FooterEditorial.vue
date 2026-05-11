<script setup lang="ts">
import { RouterLink } from "vue-router";
import BrandMark from "@/components/ui/BrandMark.vue";
import {
  WHATSAPP_DISPLAY,
  whatsappUrl,
  SUPPORT_EMAIL,
  SUPPORT_EMAIL_URL,
} from "@/config/contact";

const year = new Date().getFullYear();
const waLink = whatsappUrl();
</script>

<template>
  <footer class="footer">
    <div class="container footer__inner">
      <div class="footer__brand">
        <BrandMark :size="44" with-word />
        <p>Tú solo pide. Nosotros nos encargamos del resto.</p>
      </div>

      <nav class="footer__nav">
        <div>
          <h4>Producto</h4>
          <RouterLink to="/servicios">Servicios</RouterLink>
          <RouterLink to="/cotizar">Cotizar envío</RouterLink>
          <RouterLink to="/rastrear">Rastrear envío</RouterLink>
          <RouterLink to="/nosotros">Sobre nosotros</RouterLink>
        </div>
        <div>
          <h4>Soporte</h4>
          <RouterLink to="/contacto">Contacto</RouterLink>
          <a :href="waLink" target="_blank" rel="noopener">WhatsApp {{ WHATSAPP_DISPLAY }}</a>
          <a :href="SUPPORT_EMAIL_URL">{{ SUPPORT_EMAIL }}</a>
        </div>
        <div>
          <h4>Operación</h4>
          <span>USA · Medley, FL</span>
          <span>USA Express · Pembroke Pines, FL</span>
          <span>España · Madrid</span>
          <span>Ecuador · Guayaquil &amp; Quito</span>
        </div>
      </nav>
    </div>

    <div class="container footer__bar">
      <span>© {{ year }} Courier Box · Todos los derechos reservados</span>
      <span class="footer__bar-meta">Operado por nuestro equipo en Ecuador, Estados Unidos y España</span>
    </div>

    <div class="footer__big" aria-hidden="true">COURIER · BOX</div>
  </footer>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;
@use "@/styles/mixins/responsive" as *;

.footer {
  position: relative;
  padding-top: clamp(3rem, 6vw, 5rem);
  padding-bottom: 2rem;
  background: $ink-1000;
  border-top: 1px solid var(--border);
  overflow: hidden;

  &__inner {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    @include lg {
      grid-template-columns: 1fr 1.6fr;
    }
  }

  &__brand p {
    color: var(--fg-muted);
    margin-top: 1rem;
    max-width: 32ch;
  }

  &__nav {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    @include sm { grid-template-columns: repeat(3, 1fr); }
    h4 {
      font-size: 0.75rem;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--fg-faint);
      margin-bottom: 0.75rem;
    }
    a, span {
      display: block;
      padding: 0.35rem 0;
      color: var(--fg-muted);
      transition: color 0.2s ease;
      &:hover { color: $brand-orange; }
    }
  }

  &__bar {
    margin-top: clamp(2rem, 5vw, 4rem);
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: space-between;
    color: var(--fg-faint);
    font-size: 0.85rem;
    position: relative;
    z-index: 2;
  }

  &__big {
    position: absolute;
    bottom: -2vw;
    left: 0; right: 0;
    text-align: center;
    font-family: "Fraunces", serif;
    font-weight: 500;
    font-size: clamp(4rem, 22vw, 22rem);
    line-height: 0.85;
    letter-spacing: -0.06em;
    color: rgba($brand-orange, 0.05);
    pointer-events: none;
    user-select: none;
    white-space: nowrap;
  }
}
</style>
