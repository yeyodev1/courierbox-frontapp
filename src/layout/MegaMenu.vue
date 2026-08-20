<script setup lang="ts">
/** Full-screen primary navigation sheet. */
import { computed, ref, toRef } from 'vue'
import { useRoute } from 'vue-router'
import { WHATSAPP_DISPLAY, whatsappUrl, SUPPORT_EMAIL, SUPPORT_EMAIL_URL } from '@/config/contact'
import MegaMenuNav from './MegaMenu/MegaMenuNav.vue'
import MegaMenuArt from './MegaMenu/MegaMenuArt.vue'
import { MEGA_LINKS } from './MegaMenu/mega-menu'
import { useMegaMenuReveal } from './MegaMenu/useMegaMenuReveal'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const route = useRoute()
const currentPath = computed(() => route.path)

const activeArt = ref(MEGA_LINKS[0]?.art ?? 'home')
const waLink = whatsappUrl()

const { setItemRef } = useMegaMenuReveal(toRef(props, 'open'), () => emit('close'))
</script>

<template>
  <Teleport to="body">
    <div
      class="mega"
      :class="{ 'is-open': open }"
      role="dialog"
      aria-modal="true"
      aria-label="Menú principal"
      :aria-hidden="!open"
    >
      <div class="mega__sheet" data-lenis-prevent>
        <div class="mega__inner container">
          <header class="mega__head">
            <span class="mega__eyebrow">Menú · 2026</span>
            <button class="mega__close" type="button" aria-label="Cerrar menú" @click="emit('close')">
              <span /><span />
            </button>
          </header>

          <div class="mega__body">
            <MegaMenuNav
              :current-path="currentPath"
              :set-item-ref="setItemRef"
              @close="emit('close')"
              @hover="(art) => (activeArt = art)"
            />
            <MegaMenuArt :art="activeArt" />
          </div>

          <footer class="mega__meta">
            <div class="mega-meta-item">
              <span class="meta-eyebrow">Hablar ahora</span>
              <a :href="waLink" target="_blank" rel="noopener">WhatsApp {{ WHATSAPP_DISPLAY }}</a>
              <a :href="SUPPORT_EMAIL_URL">{{ SUPPORT_EMAIL }}</a>
              <span>Atención desde Ecuador</span>
            </div>
            <div class="mega-meta-item">
              <span class="meta-eyebrow">Operación</span>
              <span>USA · Medley &amp; Pembroke Pines, FL</span>
              <span>España · Madrid</span>
              <span>Ecuador · Guayaquil &amp; Quito</span>
            </div>
            <div class="mega-meta-item">
              <span class="meta-eyebrow">Síguenos</span>
              <a href="https://instagram.com">Instagram</a>
              <a href="https://tiktok.com">TikTok</a>
              <a href="https://linkedin.com">LinkedIn</a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/motion' as *;
@use '@/styles/mixins/responsive' as *;

.mega {
  position: fixed;
  inset: 0;
  z-index: 200;
  visibility: hidden;
  pointer-events: none;
  transition: visibility 0s linear 0.7s;

  &.is-open {
    visibility: visible;
    pointer-events: auto;
    transition: visibility 0s linear 0s;
  }

  &__sheet {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(60% 50% at 100% 0%, rgba($brand-orange, 0.18), transparent 60%),
      $ink-1000;
    transform: translateY(-100%);
    transition: transform 0.7s $ease-out-expo;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;

    /* scrollbar fina y discreta */
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.15) transparent;

    &::-webkit-scrollbar { width: 8px; }
    &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 999px; }
    &::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
  }

  &.is-open &__sheet {
    transform: translateY(0);
    transition: transform 0.85s $ease-out-expo;
  }

  &__inner {
    min-height: 100%;
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: clamp(1.5rem, 3vw, 2.5rem);
    padding-block: clamp(1.25rem, 3vw, 2rem);
  }

  &__eyebrow {
    font-size: 0.7rem;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--fg-faint);
    font-family: 'JetBrains Mono', monospace;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 0.5rem;
  }

  &__close {
    width: 56px;
    height: 56px;
    display: inline-grid;
    place-items: center;
    border-radius: 999px;
    border: 1px solid var(--border-strong);
    background: rgba($ink-100, 0.04);
    transition: background $dur-base $ease-out-expo, transform $dur-base $ease-out-expo;
    position: relative;
    cursor: pointer;

    span {
      position: absolute;
      width: 22px;
      height: 1.5px;
      background: var(--fg);
      transition: background $dur-base ease;
    }

    span:nth-child(1) { transform: rotate(45deg); }
    span:nth-child(2) { transform: rotate(-45deg); }

    &:hover {
      background: $brand-orange;
      transform: rotate(90deg);

      span { background: $ink-1000; }
    }
  }

  &__body {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    align-items: start;

    @include lg {
      grid-template-columns: 1.4fr 1fr;
      gap: 3rem;
    }
  }

  &__meta {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
    color: var(--fg-muted);
    font-size: 0.9rem;

    @include md { grid-template-columns: repeat(3, 1fr); }

    > div { display: grid; gap: 0.35rem; }

    a {
      color: var(--fg);
      transition: color 0.2s ease;

      &:hover { color: $brand-orange; }
    }

    .meta-eyebrow {
      font-size: 0.7rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--fg-faint);
      font-family: 'JetBrains Mono', monospace;
      margin-bottom: 0.5rem;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .mega,
  .mega__sheet,
  .mega__close { transition: none; }
}
</style>
