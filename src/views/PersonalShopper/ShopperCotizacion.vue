<script setup lang="ts">
/** Live estimate panel and the submit action. */
import type { Cotizacion } from '@/services/solicitudes.api'
import { WHATSAPP_DISPLAY } from '@/config/contact'
import { money } from './usePersonalShopper'

defineProps<{
  cotizacion: Cotizacion | null
  cotizando: boolean
  totalLocal: number
  error: string
  enviando: boolean
  puedeEnviar: boolean
  whatsappLink: string
}>()

const emit = defineEmits<{ submit: [] }>()
</script>

<template>
  <aside class="cotizacion" :class="{ 'is-live': cotizando }">
    <h3>Tu estimado</h3>

    <dl>
      <div>
        <dt>Productos + envío EE.UU.</dt>
        <dd>{{ money(cotizacion?.subtotal ?? totalLocal) }}</dd>
      </div>
      <div>
        <dt>
          Comisión Courier Box
          <i v-if="cotizando" class="fa-solid fa-circle-notch fa-spin" aria-hidden="true" />
        </dt>
        <dd>{{ cotizacion ? money(cotizacion.comisionEstimada) : '—' }}</dd>
      </div>
      <div class="is-total">
        <dt>Total estimado</dt>
        <dd>{{ cotizacion ? money(cotizacion.totalEstimado) : money(totalLocal) }}</dd>
      </div>
    </dl>

    <p v-if="cotizacion?.comisionDetalle" class="detalle">{{ cotizacion.comisionDetalle }}</p>

    <p class="disclaimer">
      No incluye el flete internacional a Ecuador ni impuestos aduaneros: dependen del peso
      y la categoría, y te los confirmamos antes de comprar.
    </p>

    <p v-if="error" class="form-error">{{ error }}</p>

    <button type="button" class="btn primary full" :disabled="!puedeEnviar || enviando" @click="emit('submit')">
      <i v-if="enviando" class="fa-solid fa-circle-notch fa-spin" aria-hidden="true" />
      {{ enviando ? 'Enviando…' : 'Enviar solicitud' }}
    </button>

    <p class="alt-contacto">
      ¿Prefieres escribirnos?
      <a :href="whatsappLink" target="_blank" rel="noopener">{{ WHATSAPP_DISPLAY }}</a>
    </p>
  </aside>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './shopper-ui' as ui;

@include ui.buttons;

.cotizacion {
  position: sticky;
  top: $space-6;
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-5;
  border-radius: $radius-lg;
  border: 1px solid rgba($brand-orange, 0.35);
  background: rgba($brand-orange, 0.06);

  h3 { margin: 0; font-size: 1rem; }

  dl { margin: 0; display: flex; flex-direction: column; gap: $space-2; }

  dl > div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: $space-3;
  }

  dt {
    color: $ink-300;
    font-size: 0.85rem;
    display: inline-flex;
    align-items: center;
    gap: $space-2;
  }

  dd { margin: 0; color: $ink-100; font-variant-numeric: tabular-nums; }

  .is-total {
    padding-top: $space-3;
    border-top: 1px solid rgba($brand-orange, 0.25);

    dt { color: $fg-dark; font-weight: 600; }
    dd { color: $brand-orange; font-size: 1.5rem; font-weight: 700; }
  }
}

.detalle { margin: 0; color: $ink-400; font-size: 0.76rem; font-style: italic; }

.disclaimer {
  margin: 0;
  color: $ink-400;
  font-size: 0.76rem;
  line-height: 1.5;
}

.form-error {
  margin: 0;
  padding: $space-3;
  border-radius: $radius-md;
  background: rgba($signal-red, 0.1);
  border: 1px solid rgba($signal-red, 0.3);
  color: #ff8a8f;
  font-size: 0.82rem;
}

.alt-contacto {
  margin: 0;
  text-align: center;
  color: $ink-400;
  font-size: 0.8rem;

  a { color: $brand-orange; }
}
</style>
