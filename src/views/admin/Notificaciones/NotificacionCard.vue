<script setup lang="ts">
/** One notification: who it was for, how each channel fared and how to retry it. */
import type { Notificacion, NotificacionCanal, NotificacionEntrega } from '@/services/notificaciones.api'
import NotificacionCanales from './NotificacionCanales.vue'
import { ESTADO_LABELS, EVENTO_LABELS, formatDate, operacionLabel } from './useNotificaciones'

defineProps<{ notificacion: Notificacion; reintentandoId: string | null; marcandoId: string | null }>()

const emit = defineEmits<{
  reintentar: [canal?: NotificacionCanal]
  whatsapp: [entrega: NotificacionEntrega]
}>()
</script>

<template>
  <article class="notification-card" :class="`notification-card--${notificacion.estado}`">
    <div class="card-main">
      <div class="card-heading">
        <span class="mail-icon" aria-hidden="true">
          <i :class="notificacion.estado === 'enviada' ? 'fa-solid fa-envelope-circle-check' : 'fa-solid fa-envelope'" />
        </span>
        <div class="recipient">
          <span class="event-name">{{ EVENTO_LABELS[notificacion.evento] }}</span>
          <strong>{{ notificacion.destinatario }}</strong>
          <span class="created-at">Creado {{ formatDate(notificacion.createdAt) }}</span>
        </div>
        <span class="status-pill" :class="`status-pill--${notificacion.estado}`">
          {{ ESTADO_LABELS[notificacion.estado] }}
        </span>
      </div>

      <div class="details">
        <div class="detail-item">
          <span>Operación</span>
          <strong>{{ operacionLabel(notificacion.operacionTipo) }}</strong>
          <code :title="notificacion.operacionId">#{{ notificacion.operacionId.slice(-8).toUpperCase() }}</code>
        </div>
        <div class="detail-item">
          <span>Intentos</span>
          <strong>{{ notificacion.intentos }}</strong>
          <small>{{ notificacion.intentos === 1 ? 'intento realizado' : 'intentos realizados' }}</small>
        </div>
        <div class="detail-item">
          <span>{{ notificacion.estado === 'enviada' ? 'Enviado' : 'Última actividad' }}</span>
          <strong class="date-value">{{ formatDate(notificacion.enviadaEn || notificacion.updatedAt) }}</strong>
          <small v-if="notificacion.providerId" :title="notificacion.providerId">ID proveedor disponible</small>
        </div>
      </div>

      <NotificacionCanales
        :notificacion="notificacion"
        :marcando="marcandoId !== null"
        :reintentando="reintentandoId !== null"
        @whatsapp="(entrega) => emit('whatsapp', entrega)"
        @reintentar="(canal) => emit('reintentar', canal)"
      />

      <div v-if="notificacion.ultimoError" class="last-error">
        <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" />
        <div>
          <span>Último error</span>
          <p>{{ notificacion.ultimoError }}</p>
        </div>
      </div>
    </div>

    <div v-if="notificacion.estado === 'fallida' || notificacion.estado === 'parcial'" class="card-action">
      <button type="button" class="retry-button" :disabled="reintentandoId !== null" @click="emit('reintentar')">
        <i class="fa-solid fa-rotate-right" :class="{ spinning: reintentandoId === notificacion._id }" aria-hidden="true" />
        {{ reintentandoId === notificacion._id ? 'Reintentando...' : 'Reintentar envío' }}
      </button>
    </div>
  </article>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './notificaciones-ui' as ui;

@include ui.spinner;

.notification-card {
  display: flex;
  align-items: stretch;
  overflow: hidden;
  background: ui.$black-soft;
  border: 1px solid rgba(ui.$cream, 0.12);
  border-left: 4px solid ui.$warning;
  border-radius: 18px;
  transition: border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease;

  &:hover {
    transform: translateY(-2px);
    border-top-color: rgba($brand-orange, 0.35);
    border-right-color: rgba($brand-orange, 0.35);
    border-bottom-color: rgba($brand-orange, 0.35);
    box-shadow: 0 14px 38px rgba(#000, 0.3);
  }

  &--enviada { border-left-color: ui.$success; }
  &--fallida { border-left-color: ui.$danger; }
  &--enviando { border-left-color: $brand-orange; }
}

.card-main {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: $space-4;
  padding: $space-5;
}

.card-heading {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.mail-icon {
  display: inline-flex;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  align-items: center;
  justify-content: center;
  color: $brand-orange;
  background: rgba($brand-orange, 0.12);
  border-radius: 12px;
}

.recipient {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;

  .event-name { color: $brand-orange; font-size: 0.72rem; font-weight: 750; text-transform: uppercase; }
  strong { overflow: hidden; color: #fff; font-size: 1rem; text-overflow: ellipsis; white-space: nowrap; }
  .created-at { color: ui.$cream-muted; font-size: 0.75rem; }
}

.status-pill {
  flex-shrink: 0;
  padding: 5px 10px;
  color: ui.$warning;
  background: rgba(ui.$warning, 0.12);
  border: 1px solid rgba(ui.$warning, 0.3);
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 750;

  &--enviada { color: ui.$success; background: rgba(ui.$success, 0.12); border-color: rgba(ui.$success, 0.3); }
  &--fallida { color: ui.$danger; background: rgba(ui.$danger, 0.12); border-color: rgba(ui.$danger, 0.3); }
  &--enviando { color: $brand-orange; background: rgba($brand-orange, 0.12); border-color: rgba($brand-orange, 0.3); }
  &--parcial { color: ui.$warning; background: rgba(ui.$warning, 0.14); border-color: rgba(ui.$warning, 0.35); }
}

.details {
  display: flex;
  align-items: stretch;
  gap: $space-3;
  flex-wrap: wrap;
}

.detail-item {
  display: flex;
  min-width: 150px;
  flex: 1 1 170px;
  flex-direction: column;
  gap: 2px;
  padding: $space-3;
  background: ui.$black-raised;
  border: 1px solid rgba(ui.$cream, 0.08);
  border-radius: 12px;

  span { color: ui.$cream-muted; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
  strong { color: ui.$cream; font-size: 0.88rem; }
  small { overflow: hidden; color: ui.$cream-muted; font-size: 0.7rem; text-overflow: ellipsis; white-space: nowrap; }
  code { width: fit-content; color: $brand-orange; font-size: 0.75rem; }
  .date-value { font-size: 0.78rem; }
}

.last-error {
  display: flex;
  align-items: flex-start;
  gap: $space-3;
  padding: $space-3 $space-4;
  color: ui.$danger;
  background: rgba(ui.$danger, 0.08);
  border: 1px solid rgba(ui.$danger, 0.24);
  border-radius: 12px;

  i { margin-top: 3px; }
  div { display: flex; min-width: 0; flex-direction: column; gap: 2px; }
  span { font-size: 0.7rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }
  p { margin: 0; color: #ffd7d8; font-size: 0.82rem; line-height: 1.5; overflow-wrap: anywhere; }
}

.card-action {
  display: flex;
  flex: 0 0 190px;
  align-items: center;
  justify-content: center;
  padding: $space-5;
  background: rgba(ui.$danger, 0.05);
  border-left: 1px solid rgba(ui.$danger, 0.16);
}

.retry-button {
  @include ui.interactive-button;

  display: inline-flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  padding: $space-3;
  color: #fff;
  background: $brand-orange;
  border: 1px solid $brand-orange;
  border-radius: 11px;
  font-weight: 750;

  &:hover:not(:disabled) {
    background: $brand-orange-deep;
    border-color: $brand-orange-deep;
    transform: translateY(-1px);
  }
}

@media (max-width: 820px) {
  .notification-card { flex-direction: column; }
  .card-action { flex-basis: auto; border-top: 1px solid rgba(ui.$danger, 0.16); border-left: 0; }
  .retry-button { width: auto; min-width: 190px; }
}

@media (max-width: 560px) {
  .card-main { padding: $space-4; }
  .card-heading { align-items: flex-start; flex-wrap: wrap; }
  .recipient { flex-basis: calc(100% - 58px); }
  .status-pill { margin-left: 58px; }
  .detail-item { min-width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .notification-card,
  .retry-button { transition: none; }
  .notification-card:hover { transform: none; }
}
</style>
