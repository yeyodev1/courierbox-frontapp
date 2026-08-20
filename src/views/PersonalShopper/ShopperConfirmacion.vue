<script setup lang="ts">
/** Receipt shown once the request reaches the advisors' queue. */
import type { SolicitudCreada } from '@/services/solicitudes.api'
import { money } from './usePersonalShopper'

defineProps<{ solicitud: SolicitudCreada; whatsappLink: string }>()
const emit = defineEmits<{ otra: [] }>()
</script>

<template>
  <section class="ps__done container">
    <div class="done-card">
      <div class="done-icon"><i class="fa-solid fa-circle-check" aria-hidden="true" /></div>
      <h1>Solicitud recibida</h1>
      <p class="done-folio">Folio #{{ solicitud.folio }}</p>
      <p>
        Un asesor la revisa y te confirma disponibilidad y el total final
        <template v-if="solicitud.clienteEmail"> — te enviamos copia a {{ solicitud.clienteEmail }}</template>.
      </p>

      <dl class="done-totales">
        <div><dt>Productos + envío EE.UU.</dt><dd>{{ money(solicitud.subtotal) }}</dd></div>
        <div><dt>Comisión estimada</dt><dd>{{ money(solicitud.comisionEstimada) }}</dd></div>
        <div class="is-total"><dt>Total estimado</dt><dd>{{ money(solicitud.totalEstimado) }}</dd></div>
      </dl>

      <div class="done-actions">
        <a class="btn wa" :href="whatsappLink" target="_blank" rel="noopener">
          <i class="fa-brands fa-whatsapp" aria-hidden="true" /> Confirmar por WhatsApp
        </a>
        <button type="button" class="btn ghost" @click="emit('otra')">Enviar otra solicitud</button>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './shopper-ui' as ui;

@include ui.buttons;

.ps__done { display: flex; justify-content: center; }

.done-card {
  max-width: 540px;
  width: 100%;
  text-align: center;
  padding: $space-10 $space-6;
  border-radius: $radius-lg;
  border: 1px solid rgba($signal-green, 0.35);
  background: rgba($signal-green, 0.06);

  h1 { margin: $space-3 0 $space-1; font-size: 1.8rem; }
  p { color: $ink-300; margin: 0 0 $space-2; }
}

.done-icon { font-size: 3rem; color: $signal-green; }

.done-folio {
  color: $brand-orange !important;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.done-totales {
  margin: $space-6 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;
  text-align: left;

  > div { display: flex; justify-content: space-between; gap: $space-3; }

  dt { color: $ink-300; font-size: 0.88rem; }
  dd { margin: 0; font-variant-numeric: tabular-nums; }

  .is-total {
    padding-top: $space-3;
    border-top: 1px solid rgba($ink-500, 0.25);

    dt { color: $fg-dark; font-weight: 600; }
    dd { color: $brand-orange; font-size: 1.4rem; font-weight: 700; }
  }
}

.done-actions {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}
</style>
