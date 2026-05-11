<script setup lang="ts">
import AppButton from "@/components/ui/AppButton.vue";
import { whatsappUrl } from "@/config/contact";

const waLink = whatsappUrl("Hola Courier Box, quiero cotizar un envío");
</script>

<template>
  <section class="cta section">
    <div class="container">
      <div class="cta__inner" data-reveal-group>
        <h2 class="cta__title" data-reveal>
          Tú solo pide. <em>Nosotros nos encargamos del resto.</em>
        </h2>
        <p class="cta__lead" data-reveal>
          Tu paquete sin procesos, registros ni trámites adicionales.
          Cotización en menos de 5 minutos.
        </p>
        <div class="cta__actions" data-reveal>
          <AppButton as="router-link" to="/cotizar" variant="primary" size="lg">
            Cotizar mi envío
          </AppButton>
          <AppButton as="a" :href="waLink" target="_blank" rel="noopener" variant="outline" size="lg">
            Te atendemos ya
          </AppButton>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;
@use "@/styles/mixins/typography" as *;
@use "@/styles/mixins/responsive" as *;

.cta {
  background: $ink-1000;
  &__inner {
    border: 1px solid var(--border-strong);
    border-radius: 28px;
    padding: clamp(2.5rem, 6vw, 5rem);
    background:
      radial-gradient(80% 100% at 0% 0%, rgba($brand-orange, 0.18), transparent 60%),
      var(--surface);
    display: grid;
    gap: 1.25rem;
    align-items: start;
  }
  &__title {
    @include display-md;
    em { font-style: italic; color: $brand-orange; font-weight: 400; }
  }
  &__lead {
    color: var(--fg-muted);
    max-width: 60ch;
  }
  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }
}
</style>
