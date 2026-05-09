<script setup lang="ts">
import { ref } from "vue";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";
import { useGsapReveal } from "@/composables/useGsapReveal";

useGsapReveal();

const form = ref({ nombre: "", email: "", telefono: "", mensaje: "" });
const sent = ref(false);
const onSubmit = () => {
  // Plug your real endpoint here.
  sent.value = true;
  form.value = { nombre: "", email: "", telefono: "", mensaje: "" };
};
</script>

<template>
  <main class="contact">
    <div class="container contact__inner">
      <section class="contact__copy">
        <span class="eyebrow" data-reveal>Contacto</span>
        <h1 class="contact__title" data-reveal data-reveal-group>
          Escríbenos. <em>Respondemos en minutos.</em>
        </h1>
        <p class="contact__lead" data-reveal>
          Te asesora directamente alguien de nuestro equipo, no un bot impersonal.
        </p>

        <ul class="contact__channels" data-reveal-group>
          <li data-reveal>
            <strong>WhatsApp</strong>
            <a href="https://wa.me/593999999999">+593 99 999 9999</a>
          </li>
          <li data-reveal>
            <strong>Email</strong>
            <a href="mailto:hola@courierbox.ec">hola@courierbox.ec</a>
          </li>
          <li data-reveal>
            <strong>Quito</strong>
            <span>Av. Eloy Alfaro N32-89 · Lun–Sáb 9:00–18:00</span>
          </li>
          <li data-reveal>
            <strong>Guayaquil</strong>
            <span>Kennedy Norte · Lun–Sáb 9:00–18:00</span>
          </li>
        </ul>
      </section>

      <section class="contact__form-card">
        <form class="contact__form" @submit.prevent="onSubmit">
          <AppInput v-model="form.nombre" label="Nombre" autocomplete="name" placeholder="Tu nombre" />
          <AppInput v-model="form.email" label="Email" type="email" autocomplete="email" placeholder="tu@correo.com" />
          <AppInput v-model="form.telefono" label="Teléfono / WhatsApp" type="tel" autocomplete="tel" placeholder="+593..." />
          <div class="field">
            <label class="field__label" for="mensaje">Cuéntanos</label>
            <textarea
              id="mensaje"
              v-model="form.mensaje"
              rows="5"
              placeholder="¿Qué necesitas mover?"
            />
          </div>
          <AppButton type="submit" variant="primary" size="lg" block>
            Enviar mensaje
          </AppButton>
          <p v-if="sent" class="contact__sent">Recibido. Te contactamos enseguida.</p>
        </form>
      </section>
    </div>
  </main>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;
@use "@/styles/mixins/typography" as *;
@use "@/styles/mixins/responsive" as *;

.contact {
  padding-top: clamp(7rem, 12vw, 10rem);
  padding-bottom: clamp(4rem, 8vw, 6rem);

  &__inner {
    display: grid;
    grid-template-columns: 1fr;
    gap: 3rem;
    @include lg { grid-template-columns: 1fr 1fr; gap: 5rem; align-items: start; }
  }

  &__copy { display: grid; gap: 1rem; align-content: start; }
  &__title {
    @include display-md;
    em { font-style: italic; color: $brand-orange; font-weight: 400; }
  }
  &__lead { color: var(--fg-muted); max-width: 50ch; }

  &__channels {
    margin-top: 1rem;
    display: grid;
    gap: 1rem;
    li {
      display: grid;
      grid-template-columns: 100px 1fr;
      align-items: baseline;
      gap: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
      strong { font-size: 0.75rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--fg-faint); }
      a { color: var(--fg); transition: color 0.2s; &:hover { color: $brand-orange; } }
      span { color: var(--fg-muted); }
    }
  }

  &__form-card {
    padding: clamp(1.5rem, 4vw, 2.5rem);
    border: 1px solid var(--border);
    border-radius: 24px;
    background: var(--surface-2);
  }

  &__form {
    display: grid;
    gap: 1.25rem;
  }

  &__sent { color: $brand-orange; font-weight: 500; }
}

.field {
  display: grid;
  gap: 0.5rem;
  &__label {
    font-size: 0.75rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--fg-muted);
  }
  textarea {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1rem;
    color: var(--fg);
    font: inherit;
    resize: vertical;
    min-height: 140px;
    transition: border-color 0.2s;
    &:focus { outline: none; border-color: $brand-orange; }
  }
}
</style>
