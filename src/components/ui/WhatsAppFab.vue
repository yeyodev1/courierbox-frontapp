<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useRoute } from "vue-router";
import { WHATSAPP_DISPLAY, whatsappUrl } from "@/config/contact";

const route = useRoute();
const visible = ref(false);
const expanded = ref(false);

const contextMessage = computed(() => {
  const path = route.path;
  if (path.startsWith("/cotizar"))
    return "Hola Courier Box, vengo del cotizador y quiero confirmar un envío.";
  if (path.startsWith("/rastrear"))
    return "Hola Courier Box, necesito ayuda con el rastreo de mi paquete.";
  if (path.startsWith("/servicios"))
    return "Hola Courier Box, quiero información sobre sus servicios de envío.";
  if (path.startsWith("/nosotros"))
    return "Hola Courier Box, quiero hablar con un asesor.";
  if (path.startsWith("/contacto"))
    return "Hola Courier Box, quiero que un asesor me atienda.";
  return "Hola Courier Box, quiero que un asesor me atienda para cotizar mi envío.";
});

const waLink = computed(() => whatsappUrl(contextMessage.value));

let timer: number | undefined;
const handleScroll = () => {
  if (typeof window === "undefined") return;
  visible.value = window.scrollY > 240;
};

onMounted(() => {
  if (typeof window === "undefined") return;
  handleScroll();
  window.addEventListener("scroll", handleScroll, { passive: true });
  timer = window.setTimeout(() => {
    expanded.value = true;
    window.setTimeout(() => (expanded.value = false), 4200);
  }, 2400);
});

onBeforeUnmount(() => {
  if (typeof window === "undefined") return;
  window.removeEventListener("scroll", handleScroll);
  if (timer) window.clearTimeout(timer);
});
</script>

<template>
  <a
    :href="waLink"
    target="_blank"
    rel="noopener"
    :class="['wa-fab', { 'is-visible': visible, 'is-expanded': expanded }]"
    :aria-label="`Hablar por WhatsApp al ${WHATSAPP_DISPLAY}`"
    @mouseenter="expanded = true"
    @mouseleave="expanded = false"
    @focus="expanded = true"
    @blur="expanded = false"
  >
    <span class="wa-fab__icon" aria-hidden="true">
      <svg viewBox="0 0 32 32" width="28" height="28">
        <path
          fill="currentColor"
          d="M16 3C9.4 3 4 8.4 4 15c0 2.4.7 4.6 1.9 6.5L4 29l7.7-2c1.8 1 3.9 1.5 6.1 1.5h.2C24.6 28.5 30 23.1 30 16.5 30 9.9 24.6 3 16 3zm0 23.2c-1.9 0-3.7-.5-5.3-1.4l-.4-.2-4.6 1.2 1.2-4.4-.3-.4c-1-1.6-1.5-3.5-1.5-5.5C5.1 9.6 10 4.9 16 4.9c2.9 0 5.7 1.1 7.7 3.2 2.1 2.1 3.2 4.8 3.2 7.7 0 6-4.9 10.4-10.9 10.4zm5.8-7.8c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.3-.2-.3 0-.5.1-.7.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1.1-1.1 2.6 0 1.5 1.1 3 1.3 3.2.2.2 2.2 3.4 5.4 4.8 3.2 1.4 3.2.9 3.8.9.6 0 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5 0-.2-.2-.2-.5-.4z"
        />
      </svg>
    </span>
    <span class="wa-fab__label">
      <strong>Te atendemos ya</strong>
      <span>{{ WHATSAPP_DISPLAY }}</span>
    </span>
  </a>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;
@use "@/styles/mixins/responsive" as *;

.wa-fab {
  position: fixed;
  right: clamp(1rem, 3vw, 1.5rem);
  bottom: clamp(1rem, 3vw, 1.5rem);
  z-index: 180;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 0.95rem;
  background: #25d366;
  color: #ffffff;
  text-decoration: none;
  border-radius: 999px;
  box-shadow:
    0 14px 36px rgba(37, 211, 102, 0.35),
    0 4px 12px rgba(0, 0, 0, 0.25);
  transition:
    transform 0.45s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.35s ease,
    padding 0.35s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.35s ease;
  opacity: 0;
  pointer-events: none;
  transform: translateY(20px) scale(0.9);
  font-family: inherit;

  &::before {
    content: "";
    position: absolute;
    inset: -6px;
    border-radius: 999px;
    border: 2px solid rgba(37, 211, 102, 0.55);
    opacity: 0;
    animation: waPing 2.8s ease-out infinite;
  }

  &.is-visible {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0) scale(1);
  }

  &:hover,
  &:focus-visible {
    box-shadow:
      0 18px 48px rgba(37, 211, 102, 0.45),
      0 4px 16px rgba(0, 0, 0, 0.3);
    transform: translateY(-2px) scale(1.02);
  }

  &__icon {
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.12);
    flex-shrink: 0;
    z-index: 1;
  }

  &__label {
    display: grid;
    gap: 0.1rem;
    max-width: 0;
    overflow: hidden;
    white-space: nowrap;
    opacity: 0;
    transition:
      max-width 0.45s cubic-bezier(0.16, 1, 0.3, 1),
      opacity 0.3s ease 0.05s,
      padding 0.3s ease;
    padding-right: 0;
    z-index: 1;

    strong {
      font-weight: 600;
      font-size: 0.95rem;
      letter-spacing: -0.01em;
      line-height: 1.1;
    }
    span {
      font-family: "JetBrains Mono", monospace;
      font-size: 0.72rem;
      letter-spacing: 0.04em;
      opacity: 0.92;
    }
  }

  &.is-expanded .wa-fab__label,
  &:hover .wa-fab__label,
  &:focus-visible .wa-fab__label {
    max-width: 220px;
    opacity: 1;
    padding-right: 0.5rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
    &__icon { width: 40px; height: 40px; }
  }
}

@keyframes waPing {
  0% { transform: scale(0.92); opacity: 0.7; }
  70% { transform: scale(1.35); opacity: 0; }
  100% { transform: scale(1.35); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .wa-fab {
    transition: opacity 0.2s ease;
    &::before { animation: none; }
  }
}
</style>
