<script setup lang="ts">
/** Per-channel delivery rows for one notification, with their own retry action. */
import type { Notificacion, NotificacionCanal, NotificacionEntrega } from '@/services/notificaciones.api'
import { CANAL_ICONOS, CANAL_LABELS, ENTREGA_LABELS, destinoDe, entregasDe } from './useNotificaciones'

defineProps<{ notificacion: Notificacion; marcando: boolean; reintentando: boolean }>()

const emit = defineEmits<{
  whatsapp: [entrega: NotificacionEntrega]
  reintentar: [canal: NotificacionCanal]
}>()
</script>

<template>
  <ul class="channels" aria-label="Estado por canal">
    <li
      v-for="entrega in entregasDe(notificacion)"
      :key="entrega.canal"
      class="channel"
      :class="`channel--${entrega.estado}`"
    >
      <i :class="CANAL_ICONOS[entrega.canal]" aria-hidden="true" />
      <div class="channel__body">
        <strong>{{ CANAL_LABELS[entrega.canal] }}</strong>
        <span class="channel__to">{{ destinoDe(notificacion, entrega.canal) }}</span>
        <span v-if="entrega.mensaje" class="channel__msg" :title="entrega.mensaje">“{{ entrega.mensaje }}”</span>
        <span v-if="entrega.ultimoError" class="channel__err">{{ entrega.ultimoError }}</span>
      </div>
      <span class="channel__state">{{ ENTREGA_LABELS[entrega.estado] }}</span>

      <!-- WhatsApp is sent by hand: open the prefilled chat, then confirm. -->
      <button
        v-if="entrega.canal === 'whatsapp' && entrega.enlace && entrega.estado !== 'enviada'"
        type="button"
        class="channel__wa"
        :disabled="marcando"
        title="Abrir el mensaje en WhatsApp y marcarlo como enviado"
        @click="emit('whatsapp', entrega)"
      >
        <i class="fa-brands fa-whatsapp" aria-hidden="true" /> Abrir y enviar
      </button>
      <button
        v-else-if="entrega.canal !== 'whatsapp' && entrega.estado !== 'enviada'"
        type="button"
        class="channel__retry"
        :disabled="reintentando"
        :title="`Reintentar solo ${CANAL_LABELS[entrega.canal]}`"
        @click="emit('reintentar', entrega.canal)"
      >
        <i class="fa-solid fa-rotate-right" aria-hidden="true" />
      </button>
    </li>
  </ul>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './notificaciones-ui' as ui;

.channels {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.channel {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-2 $space-3;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);

  > i {
    flex: 0 0 auto;
    width: 20px;
    text-align: center;
    color: ui.$cream-muted;
  }

  &--enviada {
    border-color: rgba(ui.$success, 0.28);
    > i { color: ui.$success; }
  }

  &--fallida {
    border-color: rgba(ui.$danger, 0.28);
    > i { color: ui.$danger; }
  }

  &--omitida { opacity: 0.62; }
}

.channel__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;

  strong { color: #fff; font-size: 0.82rem; }
}

.channel__to,
.channel__err,
.channel__msg {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.channel__to { color: ui.$cream-muted; font-size: 0.74rem; }
.channel__err { color: ui.$danger; font-size: 0.74rem; }
.channel__msg { color: rgba(ui.$cream, 0.55); font-size: 0.72rem; font-style: italic; }

.channel__state {
  flex: 0 0 auto;
  font-size: 0.72rem;
  font-weight: 700;
  color: ui.$cream-muted;
}

.channel__wa {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border-radius: 9px;
  border: 1px solid rgba(37, 211, 102, 0.4);
  background: rgba(37, 211, 102, 0.12);
  color: #4ce08a;
  font: inherit;
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) { background: rgba(37, 211, 102, 0.2); }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
}

.channel__retry {
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: ui.$cream-muted;
  cursor: pointer;

  &:hover:not(:disabled) { color: #fff; border-color: rgba($brand-orange, 0.4); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}
</style>
