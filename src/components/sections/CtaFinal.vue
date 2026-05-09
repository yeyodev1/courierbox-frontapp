<script setup lang="ts">
import AppButton from "@/components/ui/AppButton.vue";
</script>

<template>
  <section class="cta section">
    <div class="container">
      <div class="cta__inner" data-reveal-group>
        <h2 class="cta__title" data-reveal>
          Mueve algo importante. <em>Lo gestionamos nosotros.</em>
        </h2>
        <p class="cta__lead" data-reveal>
          Cotización personalizada en menos de 5 minutos. Sin compromiso.
        </p>
        <div class="cta__actions" data-reveal>
          <AppButton as="router-link" to="/contacto" variant="primary" size="lg">
            Cotizar mi envío
          </AppButton>
          <AppButton
            as="a"
            href="https://wa.me/593999999999?text=Hola%20Courier%20Box%2C%20quiero%20cotizar"
            variant="outline"
            size="lg"
          >
            Hablar por WhatsApp
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
