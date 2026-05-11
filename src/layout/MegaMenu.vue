<script setup lang="ts">
import { ref, watch, onBeforeUnmount, computed, nextTick } from "vue";
import { gsap } from "gsap";
import { useRoute } from "vue-router";
import {
  WHATSAPP_DISPLAY,
  whatsappUrl,
  SUPPORT_EMAIL,
  SUPPORT_EMAIL_URL,
} from "@/config/contact";

interface Props { open: boolean }
const props = defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const route = useRoute();

const links = [
  { num: "01", to: "/", label: "Inicio", kicker: "Tú pides, nosotros del resto", art: "home" },
  { num: "02", to: "/servicios", label: "Servicios", kicker: "USA · España → Ecuador", art: "services" },
  { num: "03", to: "/cotizar", label: "Cotizar", kicker: "Calcula tu envío en segundos", art: "quote" },
  { num: "04", to: "/rastrear", label: "Rastrear", kicker: "Estado en vivo de tu envío", art: "track" },
  { num: "05", to: "/nosotros", label: "Nosotros", kicker: "Operamos cada eslabón", art: "about" },
  { num: "06", to: "/contacto", label: "Contacto", kicker: "Respuesta en minutos", art: "contact" },
];

const waLink = whatsappUrl();

const activeArt = ref<string>(links[0]?.art ?? "home");

const itemRefs: HTMLElement[] = [];
const setItemRef = (i: number) => (el: Element | null | { $el?: Element }) => {
  const node = (el && (el as { $el?: Element }).$el ? (el as { $el?: Element }).$el : el) as HTMLElement | null;
  if (node) itemRefs[i] = node;
};

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

async function animateOpen() {
  await nextTick();
  if (reduced()) {
    gsap.set(itemRefs, { y: 0, opacity: 1 });
    gsap.set(".mega-meta-item", { y: 0, opacity: 1 });
    return;
  }
  gsap.killTweensOf([itemRefs, ".mega-meta-item"]);
  gsap.fromTo(
    itemRefs,
    { y: 80, opacity: 0 },
    { y: 0, opacity: 1, stagger: 0.07, duration: 0.85, ease: "expo.out", delay: 0.15 }
  );
  gsap.fromTo(
    ".mega-meta-item",
    { y: 20, opacity: 0 },
    { y: 0, opacity: 1, stagger: 0.06, duration: 0.55, ease: "expo.out", delay: 0.45 }
  );
}

function reset() {
  gsap.killTweensOf([itemRefs, ".mega-meta-item"]);
  gsap.set(itemRefs, { y: 0, opacity: 1, clearProps: "transform,opacity" });
  gsap.set(".mega-meta-item", { y: 0, opacity: 1, clearProps: "transform,opacity" });
}

watch(() => props.open, (o) => {
  if (o) {
    document.body.style.overflow = "hidden";
    animateOpen();
  } else {
    document.body.style.overflow = "";
    reset();
  }
});

const onKeydown = (e: KeyboardEvent) => { if (e.key === "Escape" && props.open) emit("close"); };
if (typeof window !== "undefined") window.addEventListener("keydown", onKeydown);
onBeforeUnmount(() => {
  if (typeof window !== "undefined") window.removeEventListener("keydown", onKeydown);
  document.body.style.overflow = "";
});

const currentPath = computed(() => route.path);
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
            <nav class="mega__nav" aria-label="Navegación principal">
              <ul>
                <li
                  v-for="(l, i) in links"
                  :key="l.to"
                  :class="['mega__row', { 'is-active': currentPath === l.to }]"
                  @mouseenter="activeArt = l.art"
                  @focusin="activeArt = l.art"
                >
                  <RouterLink
                    :ref="setItemRef(i)"
                    :to="l.to"
                    class="mega__link"
                    @click="emit('close')"
                  >
                    <span class="mega__num">{{ l.num }}</span>
                    <span class="mega__label">
                      <span class="mega__label-clip">
                        <span class="mega__label-text">{{ l.label }}</span>
                        <span class="mega__label-text mega__label-text--alt" aria-hidden="true">{{ l.label }}</span>
                      </span>
                      <span class="mega__kicker">{{ l.kicker }}</span>
                    </span>
                    <span class="mega__arrow" aria-hidden="true">↗</span>
                  </RouterLink>
                </li>
              </ul>
            </nav>

            <aside class="mega__art" aria-hidden="true">
              <div class="mega__art-stage">
                <Transition name="art">
                  <div :key="activeArt" :class="['art', `art--${activeArt}`]">
                    <svg class="art__bg" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                      <defs>
                        <radialGradient id="g1" cx="20%" cy="10%" r="80%">
                          <stop offset="0%" stop-color="#F08A1F" stop-opacity="0.6"/>
                          <stop offset="100%" stop-color="#06060A" stop-opacity="0"/>
                        </radialGradient>
                        <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stop-color="#1E1E27"/>
                          <stop offset="100%" stop-color="#06060A"/>
                        </linearGradient>
                        <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
                          <circle cx="2" cy="2" r="1.1" fill="#F08A1F" fill-opacity="0.18"/>
                        </pattern>
                      </defs>
                      <rect width="600" height="800" fill="url(#g2)"/>
                      <rect width="600" height="800" fill="url(#dots)"/>
                      <rect width="600" height="800" fill="url(#g1)"/>
                    </svg>
                    <div class="art__glyph" aria-hidden="true">
                      <span v-if="activeArt === 'home'">●</span>
                      <span v-else-if="activeArt === 'services'">◇</span>
                      <span v-else-if="activeArt === 'quote'">$</span>
                      <span v-else-if="activeArt === 'track'">↗</span>
                      <span v-else-if="activeArt === 'about'">⌬</span>
                      <span v-else>✉</span>
                    </div>
                    <div class="art__caption">
                      <span class="art__tag">{{ activeArt }}</span>
                      <span class="art__since">Operación 24/7 · Miami ↔ Ecuador</span>
                    </div>
                  </div>
                </Transition>
              </div>
            </aside>
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

<style lang="scss">
@use "@/styles/tokens/colors" as *;
@use "@/styles/tokens/space" as *;
@use "@/styles/tokens/motion" as *;
@use "@/styles/mixins/responsive" as *;
@use "@/styles/mixins/typography" as *;

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
    font-family: "JetBrains Mono", monospace;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 0.5rem;
  }

  &__close {
    width: 56px; height: 56px;
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

  &__nav ul { display: grid; padding: 0; margin: 0; list-style: none; }

  &__row {
    border-bottom: 1px solid var(--border);
    overflow: hidden;
    position: relative;
    transition: padding $dur-base $ease-out-expo;
    &:first-child { border-top: 1px solid var(--border); }

    &.is-active .mega__num { color: $brand-orange; }
  }

  &__link {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: baseline;
    gap: clamp(0.75rem, 2vw, 1.5rem);
    padding-block: clamp(0.85rem, 2.2vw, 1.4rem);
    color: var(--fg);
    text-decoration: none;
    position: relative;
    transition: color $dur-base $ease-out-expo, padding-left $dur-base $ease-out-expo;

    &::before {
      content: "";
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 0;
      background: linear-gradient(90deg, $brand-orange, transparent);
      opacity: 0.12;
      transition: width $dur-base $ease-out-expo;
      pointer-events: none;
    }

    @include hover-supported {
      &:hover {
        padding-left: clamp(0.5rem, 2vw, 1.5rem);
        color: $brand-orange;
        &::before { width: 100%; }
        .mega__arrow { transform: translate(4px, -4px) rotate(0deg); opacity: 1; }
        .mega__label-text:not(.mega__label-text--alt) { transform: translateY(-100%); }
        .mega__label-text--alt { transform: translateY(-100%); }
      }
    }
  }

  &__num {
    font-family: "JetBrains Mono", monospace;
    font-size: clamp(0.7rem, 1.1vw, 0.85rem);
    color: var(--fg-faint);
    letter-spacing: 0.18em;
    align-self: flex-start;
    padding-top: 1.25rem;
  }

  &__label {
    display: grid;
    gap: 0.35rem;
    min-width: 0;
  }

  &__label-clip {
    display: block;
    position: relative;
    overflow: hidden;
    line-height: 0.95;
    height: clamp(2.3rem, 8.6vw, 7.2rem);
  }

  &__label-text {
    font-family: "Fraunces", serif;
    font-weight: 500;
    font-size: clamp(2.4rem, 9vw, 7.5rem);
    line-height: 0.95;
    letter-spacing: -0.03em;
    display: block;
    transition: transform $dur-slow $ease-out-expo;
    will-change: transform;

    &--alt {
      color: $brand-orange;
      font-style: italic;
      font-weight: 400;
      position: absolute;
      top: 100%;
      left: 0;
    }
  }

  &__kicker {
    color: var(--fg-muted);
    font-size: clamp(0.85rem, 1.1vw, 1rem);
    margin-top: 0.25rem;
  }

  &__arrow {
    font-size: clamp(1.25rem, 2vw, 1.75rem);
    color: var(--fg-muted);
    align-self: flex-start;
    padding-top: 1rem;
    opacity: 0.5;
    transition: transform $dur-base $ease-out-expo, opacity $dur-base $ease-out-expo;
    transform: rotate(-30deg);
  }

  &__art {
    display: none;
    @include lg { display: block; }
    align-self: stretch;
    min-height: 420px;
  }

  &__art-stage {
    position: relative;
    height: 100%;
    min-height: 420px;
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid var(--border);
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
    a { color: var(--fg); transition: color 0.2s ease; &:hover { color: $brand-orange; } }
    .meta-eyebrow {
      font-size: 0.7rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--fg-faint);
      font-family: "JetBrains Mono", monospace;
      margin-bottom: 0.5rem;
    }
  }
}

.art {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-rows: 1fr auto;

  &__bg { width: 100%; height: 100%; position: absolute; inset: 0; }

  &__glyph {
    position: relative;
    z-index: 2;
    display: grid;
    place-items: center;
    height: 100%;
    font-size: clamp(8rem, 22vw, 18rem);
    line-height: 1;
    color: $brand-orange;
    text-shadow: 0 0 80px rgba($brand-orange, 0.45);
    font-family: "Fraunces", serif;
    span { display: inline-block; animation: floaty 6s ease-in-out infinite; }
  }

  &__caption {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    color: var(--fg);
    border-top: 1px solid rgba($ink-100, 0.1);
    background: rgba($ink-1000, 0.55);
    backdrop-filter: blur(10px);
    font-family: "JetBrains Mono", monospace;
    font-size: 0.78rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  &__tag { color: $brand-orange; }
  &__since { color: var(--fg-muted); }
}

@keyframes floaty {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

.art-enter-active, .art-leave-active {
  transition: opacity 0.45s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.art-enter-from { opacity: 0; transform: scale(1.04); }
.art-leave-to { opacity: 0; transform: scale(0.98); }

@media (prefers-reduced-motion: reduce) {
  .mega__sheet, .art-enter-active, .art-leave-active { transition: none; }
}
</style>
