<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";
import AppBadge from "@/components/ui/AppBadge.vue";
import { whatsappUrl } from "@/config/contact";

const codigo = ref("");
const router = useRouter();

const submit = () => {
  const c = codigo.value.trim().toUpperCase();
  if (!c) return;
  router.push({ name: "TrackingDetail", params: { codigo: c } });
};

const waLink = whatsappUrl(
  "Hola Courier Box, quiero que me atiendan ya. Necesito información sobre mis envíos.",
);
</script>

<template>
  <section class="hero">
    <div class="hero__blob hero__blob--a" aria-hidden="true" />
    <div class="hero__blob hero__blob--b" aria-hidden="true" />

    <div class="container hero__inner">
      <div class="hero__topline">
        <AppBadge tone="brand" pulse>Operación 24/7 · Guayaquil · Miami · España</AppBadge>
      </div>

      <h1 class="hero__headline">
        <span class="line">Tú te encargas de comprar.</span>
        <span class="line">
          <em>Nosotros</em> del resto.
        </span>
        <span class="line line--accent">Sin trámites.</span>
      </h1>

      <p class="hero__lead">
        Tus compras desde Estados Unidos y Europa, sin casilleros extraños,
        trámites ni procesos adicionales.
      </p>
      <p class="hero__sublead">
        ¿No quieres comprar tú? También lo hacemos por ti.
      </p>

      <div class="hero__cta">
        <AppButton
          as="a"
          :href="waLink"
          target="_blank"
          rel="noopener"
          variant="primary"
          size="lg"
        >
          Te atendemos ya
        </AppButton>
        <AppButton as="router-link" to="/cotizar" variant="outline" size="lg">
          Cotiza tu envío
        </AppButton>
      </div>

      <form class="hero__track" @submit.prevent="submit">
        <AppInput
          v-model="codigo"
          large
          placeholder="Ingresa tu número de guía"
          inputmode="search"
          autocomplete="off"
          aria-label="Número de guía"
        >
          <template #action>
            <AppButton type="submit" variant="primary" size="md">
              Rastrear
            </AppButton>
          </template>
        </AppInput>
        <p class="hero__track-hint">
          Ej. <code>CB-2024-001245</code> · Sin claves, sin trámites.
        </p>
      </form>

      <div class="hero__meta">
        <div class="meta">
          <span class="meta__num">2016</span>
          <span class="meta__label">operando desde</span>
        </div>
        <div class="meta">
          <span class="meta__num">USA · ESP</span>
          <span class="meta__label">rutas directas a Ecuador</span>
        </div>
        <div class="meta">
          <span class="meta__num">100%</span>
          <span class="meta__label">gestión propia</span>
        </div>
      </div>
    </div>

    <div class="hero__scroll" aria-hidden="true">
      <span /> Desliza
    </div>
  </section>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;
@use "@/styles/tokens/space" as *;
@use "@/styles/tokens/motion" as *;
@use "@/styles/mixins/responsive" as *;
@use "@/styles/mixins/typography" as *;

.hero {
  position: relative;
  min-height: 100svh;
  padding-top: clamp(7rem, 12vw, 10rem);
  padding-bottom: clamp(4rem, 8vw, 7rem);
  overflow: hidden;
  isolation: isolate;
  background: radial-gradient(120% 80% at 100% 0%, rgba($brand-orange, 0.18), transparent 60%),
              linear-gradient(180deg, $ink-1000, $ink-900);

  &__inner {
    display: grid;
    gap: clamp(1.5rem, 3vw, 2.5rem);
    position: relative;
    z-index: 2;
  }

  &__topline { animation: fadeIn 0.9s $ease-out-expo both; }

  &__headline {
    @include display-xl;
    color: var(--fg);
    margin: 0;

    .line {
      display: block;
      &--accent {
        background: linear-gradient(90deg, $brand-orange, $brand-orange-soft);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
      em {
        font-style: italic;
        font-weight: 400;
        color: var(--fg-muted);
      }
    }
  }

  &__lead {
    max-width: 56ch;
    color: var(--fg-muted);
    font-size: clamp(1rem, 1.4vw, 1.25rem);
    line-height: 1.55;
  }

  &__sublead {
    max-width: 56ch;
    color: var(--fg-faint);
    font-size: clamp(0.9rem, 1.1vw, 1rem);
    line-height: 1.5;
    font-style: italic;
    margin-top: -0.5rem;
  }

  &__cta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  &__track {
    max-width: 720px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 0.5rem;
    &-hint {
      font-size: 0.85rem;
      color: var(--fg-faint);
      code {
        font-family: "JetBrains Mono", monospace;
        background: rgba($ink-100, 0.06);
        padding: 0.1rem 0.4rem;
        border-radius: 4px;
        color: var(--fg-muted);
      }
    }
  }

  &__meta {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.5rem;
    margin-top: clamp(1rem, 3vw, 2rem);
    padding-top: 2rem;
    border-top: 1px solid var(--border);
    @include md { gap: 3rem; }
  }

  &__scroll {
    position: absolute;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--fg-faint);
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    span {
      width: 1px; height: 26px;
      background: linear-gradient(180deg, transparent, $brand-orange);
      animation: scrollHint 1.6s $ease-in-out-cubic infinite;
    }
  }

  &__blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.55;
    z-index: 1;
    pointer-events: none;
    will-change: transform;

    &--a {
      width: 60vw; height: 60vw;
      top: -20vw; right: -10vw;
      background: radial-gradient(circle, $brand-orange, transparent 65%);
      animation: drift 18s ease-in-out infinite alternate;
    }
    &--b {
      width: 40vw; height: 40vw;
      bottom: -15vw; left: -10vw;
      background: radial-gradient(circle, $brand-orange-deep, transparent 65%);
      opacity: 0.4;
      animation: drift 22s ease-in-out infinite alternate-reverse;
    }
  }
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  &__num {
    font-family: "Fraunces", serif;
    font-size: clamp(1.6rem, 3vw, 2.4rem);
    font-weight: 500;
    letter-spacing: -0.02em;
    color: $brand-orange;
  }
  &__label {
    font-size: 0.85rem;
    color: var(--fg-muted);
    line-height: 1.35;
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes drift {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(40px, 60px) scale(1.08); }
}

@keyframes scrollHint {
  0%, 100% { transform: scaleY(0.4); transform-origin: top; }
  50% { transform: scaleY(1); }
}

@include reduced-motion {
  .hero__blob, .hero__scroll span { animation: none; }
}
</style>
