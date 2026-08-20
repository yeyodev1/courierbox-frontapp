<script setup lang="ts">
/** Omnichannel delivery ledger: what reached the client by email and WhatsApp. */
import { onMounted } from 'vue'
import NotificacionesFiltros from './Notificaciones/NotificacionesFiltros.vue'
import NotificacionCard from './Notificaciones/NotificacionCard.vue'
import { useNotificaciones } from './Notificaciones/useNotificaciones'

const n = useNotificaciones()

onMounted(n.cargar)
</script>

<template>
  <section class="notifications-page" aria-labelledby="notifications-title">
    <header class="intro">
      <div class="intro-copy">
        <span class="eyebrow">Centro de entrega</span>
        <h2 id="notifications-title">Notificaciones omnicanal</h2>
        <p>Correo y WhatsApp en un solo registro: revisa qué llegó por cada canal y reintenta lo que falló.</p>
      </div>
      <div class="summary" aria-label="Resumen del listado actual">
        <div class="summary-item">
          <span>Mostrados</span><strong>{{ n.resumen.value.total }}</strong>
        </div>
        <div class="summary-item summary-item--danger">
          <span>Fallidos</span><strong>{{ n.resumen.value.fallidas }}</strong>
        </div>
        <div class="summary-item summary-item--warning">
          <span>Parciales</span><strong>{{ n.resumen.value.parciales }}</strong>
        </div>
        <div class="summary-item summary-item--success">
          <span>Enviados</span><strong>{{ n.resumen.value.enviadas }}</strong>
        </div>
      </div>
    </header>

    <NotificacionesFiltros
      :activo="n.filtroEstado.value"
      :cargando="n.cargando.value"
      @filtrar="n.seleccionarFiltro"
      @refrescar="n.cargar"
    />

    <div v-if="n.errorCarga.value" class="feedback feedback--error" role="alert">
      <i class="fa-solid fa-circle-exclamation" aria-hidden="true" />
      <span>{{ n.errorCarga.value }}</span>
      <button type="button" @click="n.cargar">Reintentar carga</button>
    </div>

    <div v-else-if="n.cargando.value" class="notification-list" aria-busy="true" aria-label="Cargando notificaciones">
      <div v-for="item in 4" :key="item" class="skeleton-card">
        <span class="skeleton-line skeleton-line--short" />
        <span class="skeleton-line" />
        <span class="skeleton-line skeleton-line--medium" />
      </div>
    </div>

    <div v-else-if="!n.notificaciones.value.length" class="empty-state">
      <span class="empty-icon"><i class="fa-regular fa-envelope-open" aria-hidden="true" /></span>
      <strong>No hay correos en este estado</strong>
      <p>Prueba otro filtro o actualiza para revisar actividad nueva.</p>
    </div>

    <div v-else class="notification-list" aria-live="polite">
      <NotificacionCard
        v-for="notificacion in n.notificaciones.value"
        :key="notificacion._id"
        :notificacion="notificacion"
        :reintentando-id="n.reintentandoId.value"
        :marcando-id="n.marcandoId.value"
        @reintentar="(canal) => n.reintentar(notificacion, canal)"
        @whatsapp="(entrega) => n.abrirWhatsapp(notificacion, entrega)"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './Notificaciones/notificaciones-ui' as ui;

.notifications-page {
  display: flex;
  flex-direction: column;
  gap: $space-6;
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
}

.intro {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: $space-6;
  padding: $space-6;
  background: ui.$black-soft;
  border: 1px solid rgba(ui.$cream, 0.12);
  border-radius: 22px;
  box-shadow: inset 4px 0 0 $brand-orange;
}

.intro-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 620px;

  .eyebrow {
    margin-bottom: $space-2;
    color: $brand-orange;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h2 { margin: 0; color: #fff; font-size: clamp(1.5rem, 3vw, 2.2rem); line-height: 1.1; }
  p { margin: $space-3 0 0; color: ui.$cream-muted; line-height: 1.6; }
}

.summary {
  display: flex;
  align-items: stretch;
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid rgba(ui.$cream, 0.14);
  border-radius: 14px;
}

.summary-item {
  display: flex;
  min-width: 92px;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  padding: $space-3 $space-4;
  border-right: 1px solid rgba(ui.$cream, 0.12);

  &:last-child { border-right: 0; }
  span { color: ui.$cream-muted; font-size: 0.7rem; text-transform: uppercase; }
  strong { color: #fff; font-size: 1.4rem; }
  &--danger strong { color: ui.$danger; }
  &--warning strong { color: ui.$warning; }
  &--success strong { color: ui.$success; }
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.feedback,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  min-height: 180px;
  padding: $space-6;
  background: ui.$black-soft;
  border: 1px solid rgba(ui.$cream, 0.12);
  border-radius: 18px;
}

.feedback--error {
  color: #ffd7d8;
  border-color: rgba(ui.$danger, 0.35);

  i { color: ui.$danger; }

  button {
    @include ui.interactive-button;

    padding: $space-2 $space-3;
    color: #fff;
    background: transparent;
    border: 1px solid ui.$danger;
    border-radius: 9px;

    &:hover { background: rgba(ui.$danger, 0.15); }
  }
}

.empty-state {
  flex-direction: column;
  text-align: center;

  .empty-icon {
    display: inline-flex;
    width: 52px;
    height: 52px;
    align-items: center;
    justify-content: center;
    color: $brand-orange;
    background: rgba($brand-orange, 0.12);
    border-radius: 50%;
    font-size: 1.2rem;
  }

  strong { color: #fff; }
  p { margin: -$space-2 0 0; color: ui.$cream-muted; }
}

.skeleton-card {
  display: flex;
  min-height: 160px;
  flex-direction: column;
  gap: $space-4;
  justify-content: center;
  padding: $space-5;
  background: ui.$black-soft;
  border: 1px solid rgba(ui.$cream, 0.12);
  border-radius: 18px;
  pointer-events: none;
}

.skeleton-line {
  display: block;
  width: 90%;
  height: 14px;
  background: ui.$black-raised;
  border-radius: 999px;
  animation: pulse 1.2s ease-in-out infinite;

  &--short { width: 25%; }
  &--medium { width: 58%; }
}

@keyframes pulse {
  50% { opacity: 0.45; }
}

@media (max-width: 820px) {
  .intro { align-items: stretch; flex-direction: column; }
  .summary { align-self: flex-start; }
}

@media (max-width: 560px) {
  .intro { padding: $space-5; }
  .summary { width: 100%; }
  .summary-item { min-width: 0; flex: 1; padding: $space-3; }
  .feedback { align-items: stretch; flex-direction: column; text-align: center; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-line { animation: none; }
}
</style>
