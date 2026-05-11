<script setup lang="ts">
import { ref } from "vue";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";
import { useGsapReveal } from "@/composables/useGsapReveal";
import {
  WHATSAPP_DISPLAY,
  whatsappUrl,
  SUPPORT_EMAIL,
  SUPPORT_EMAIL_URL,
  OFFICES,
} from "@/config/contact";

useGsapReveal();

const form = ref({ nombre: "", email: "", telefono: "", mensaje: "" });

const buildWaMessage = (): string => {
  const lines = ["📦 *Hola Courier Box* — quiero hablar con un asesor."];
  if (form.value.nombre.trim()) lines.push(`👤 *Nombre:* ${form.value.nombre.trim()}`);
  if (form.value.email.trim()) lines.push(`✉️ *Email:* ${form.value.email.trim()}`);
  if (form.value.telefono.trim()) lines.push(`📱 *Teléfono:* ${form.value.telefono.trim()}`);
  if (form.value.mensaje.trim()) lines.push(`📝 *Mensaje:*\n${form.value.mensaje.trim()}`);
  lines.push("🚀 ¿Pueden ayudarme con mi envío?");
  return lines.join("\n");
};

const onSubmit = () => {
  const url = whatsappUrl(buildWaMessage());
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
};

const waLink = whatsappUrl(
  "Hola Courier Box, quiero reportar una orden / consultar un envío 📦",
);
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
          Reporta tus órdenes por WhatsApp y un asesor filtra la información.
          Atención desde Ecuador, operación en USA, España y Ecuador.
        </p>

        <ul class="contact__channels" data-reveal-group>
          <li data-reveal>
            <strong>WhatsApp</strong>
            <a :href="waLink" target="_blank" rel="noopener">{{ WHATSAPP_DISPLAY }} (atención desde Ecuador)</a>
          </li>
          <li data-reveal>
            <strong>Email</strong>
            <a :href="SUPPORT_EMAIL_URL">{{ SUPPORT_EMAIL }}</a>
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
            Enviar por WhatsApp
          </AppButton>
          <p class="contact__sent contact__sent--hint">
            Al enviar abrimos WhatsApp con tu mensaje listo. Sin formularios ni esperas.
          </p>
        </form>
      </section>
    </div>

    <section class="offices container" data-reveal-group>
      <header class="offices__head">
        <span class="eyebrow" data-reveal>Nuestras direcciones</span>
        <h2 class="offices__title" data-reveal>
          Tres bodegas. <em>Una sola promesa.</em>
        </h2>
        <p class="offices__lead" data-reveal>
          Usa la dirección que corresponde a tu compra. Tu nombre con el patrón indicado
          permite que identifiquemos el paquete cuando ingresa a bodega.
        </p>
      </header>

      <div class="offices__grid">
        <article v-for="o in OFFICES" :key="o.id" class="office" data-reveal>
          <header class="office__head">
            <span class="office__flag">{{ o.flag }}</span>
            <div>
              <h3>{{ o.country }}</h3>
              <span v-if="o.badge" class="office__badge">{{ o.badge }}</span>
            </div>
          </header>
          <dl class="office__data">
            <div>
              <dt>Nombre</dt>
              <dd>{{ o.nombrePattern }}</dd>
            </div>
            <div>
              <dt>Dirección</dt>
              <dd>{{ o.direccion }}</dd>
            </div>
            <div>
              <dt>Ciudad</dt>
              <dd>{{ o.ciudad }}</dd>
            </div>
            <div>
              <dt>Estado / Provincia</dt>
              <dd>{{ o.estado }}</dd>
            </div>
            <div>
              <dt>Código postal</dt>
              <dd>{{ o.zipCode }}</dd>
            </div>
            <div v-if="o.apartamento">
              <dt>Apartamento</dt>
              <dd>{{ o.apartamento }}</dd>
            </div>
            <div>
              <dt>País</dt>
              <dd>{{ o.pais }}</dd>
            </div>
            <div>
              <dt>Teléfono</dt>
              <dd>{{ o.telefono }}</dd>
            </div>
          </dl>
          <p v-if="o.nota" class="office__note">{{ o.nota }}</p>
        </article>
      </div>
    </section>
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

  &__sent {
    color: $brand-orange;
    font-weight: 500;
    &--hint {
      color: var(--fg-faint);
      font-weight: 400;
      font-size: 0.85rem;
      line-height: 1.5;
      margin-top: -0.5rem;
    }
  }
}

.offices {
  padding-block: clamp(3rem, 8vw, 6rem);
  display: grid;
  gap: clamp(1.5rem, 4vw, 2.5rem);

  &__head { display: grid; gap: 0.75rem; max-width: 720px; }
  &__title {
    @include display-md;
    em { font-style: italic; color: $brand-orange; font-weight: 400; }
  }
  &__lead { color: var(--fg-muted); max-width: 60ch; }

  &__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
    @include md { grid-template-columns: repeat(2, 1fr); }
    @include lg { grid-template-columns: repeat(3, 1fr); }
  }
}

.office {
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface-2);
  padding: clamp(1.25rem, 3vw, 1.75rem);
  display: grid;
  gap: 1rem;
  transition: border-color 0.3s ease, transform 0.3s ease;
  min-width: 0;

  &:hover {
    border-color: rgba($brand-orange, 0.5);
    transform: translateY(-2px);
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--fg);
      line-height: 1.2;
    }
  }

  &__flag {
    display: inline-grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: 999px;
    background: rgba($brand-orange, 0.12);
    color: $brand-orange;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    flex-shrink: 0;
  }

  &__badge {
    display: inline-block;
    margin-top: 0.25rem;
    font-size: 0.72rem;
    color: var(--fg-faint);
    letter-spacing: 0.04em;
  }

  &__data {
    display: grid;
    gap: 0.65rem;
    margin: 0;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border);
    > div {
      display: grid;
      grid-template-columns: 110px 1fr;
      gap: 0.75rem;
      align-items: baseline;
    }
    dt {
      font-size: 0.7rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--fg-faint);
      margin: 0;
    }
    dd {
      margin: 0;
      color: var(--fg);
      font-size: 0.95rem;
      line-height: 1.4;
      word-break: break-word;
    }
  }

  &__note {
    margin: 0;
    padding-top: 0.5rem;
    border-top: 1px dashed var(--border);
    color: var(--fg-muted);
    font-size: 0.85rem;
    font-style: italic;
  }
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
