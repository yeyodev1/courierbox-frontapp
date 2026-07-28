<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  notificacionesApi,
  type Notificacion,
  type NotificacionEstado,
  type NotificacionEvento,
} from '@/services/notificaciones.api'
import { useToastStore } from '@/stores/toast.store'

type FiltroEstado = NotificacionEstado | ''

const toast = useToastStore()
const notificaciones = ref<Notificacion[]>([])
const filtroEstado = ref<FiltroEstado>('')
const cargando = ref(true)
const errorCarga = ref('')
const reintentandoId = ref<string | null>(null)

const filtros: Array<{ value: FiltroEstado; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'fallida', label: 'Fallidos' },
  { value: 'enviada', label: 'Enviados' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'enviando', label: 'En proceso' },
]

const estadoLabels: Record<NotificacionEstado, string> = {
  pendiente: 'Pendiente',
  enviando: 'En proceso',
  enviada: 'Enviado',
  fallida: 'Fallido',
}

const eventoLabels: Record<NotificacionEvento, string> = {
  gestion_creada: 'Gestión creada',
  pago_confirmado: 'Pago confirmado',
  compra_realizada: 'Compra realizada',
  recepcion_bodega: 'Recepción en bodega',
  envio_en_camino: 'Envío en camino',
  entrega_completada: 'Entrega completada',
}

const resumen = computed(() => ({
  total: notificaciones.value.length,
  fallidas: notificaciones.value.filter((item) => item.estado === 'fallida').length,
  enviadas: notificaciones.value.filter((item) => item.estado === 'enviada').length,
}))

async function cargarNotificaciones() {
  cargando.value = true
  errorCarga.value = ''
  try {
    notificaciones.value = await notificacionesApi.listar(filtroEstado.value || undefined)
  } catch (error: unknown) {
    errorCarga.value = getErrorMessage(error, 'No se pudieron cargar las notificaciones.')
  } finally {
    cargando.value = false
  }
}

async function seleccionarFiltro(estado: FiltroEstado) {
  if (estado === filtroEstado.value) return
  filtroEstado.value = estado
  await cargarNotificaciones()
}

async function reintentar(notificacion: Notificacion) {
  if (reintentandoId.value) return
  reintentandoId.value = notificacion._id
  try {
    const actualizada = await notificacionesApi.reintentar(notificacion._id)
    const index = notificaciones.value.findIndex((item) => item._id === actualizada._id)

    if (filtroEstado.value && actualizada.estado !== filtroEstado.value) {
      if (index >= 0) notificaciones.value.splice(index, 1)
    } else if (index >= 0) {
      notificaciones.value.splice(index, 1, actualizada)
    }

    const mensaje = actualizada.estado === 'enviada'
      ? 'Correo reenviado correctamente.'
      : 'El reintento terminó con un error.'
    toast.showNotification(mensaje, actualizada.estado === 'enviada' ? 'success' : 'error')
  } catch (error: unknown) {
    toast.showNotification(getErrorMessage(error, 'No se pudo reintentar el correo.'), 'error')
  } finally {
    reintentandoId.value = null
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  return fallback
}

function formatDate(value?: string) {
  if (!value) return 'Sin registro'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin registro'
  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function operacionLabel(tipo: Notificacion['operacionTipo']) {
  return tipo === 'gestion_compra' ? 'Gestión de compra' : 'Envío'
}

onMounted(cargarNotificaciones)
</script>

<template>
  <section class="notifications-page" aria-labelledby="notifications-title">
    <header class="intro">
      <div class="intro-copy">
        <span class="eyebrow">Centro de entrega</span>
        <h2 id="notifications-title">Notificaciones por email</h2>
        <p>Supervisa cada envío y recupera correos fallidos sin perder el contexto de la operación.</p>
      </div>
      <div class="summary" aria-label="Resumen del listado actual">
        <div class="summary-item">
          <span>Mostrados</span>
          <strong>{{ resumen.total }}</strong>
        </div>
        <div class="summary-item summary-item--danger">
          <span>Fallidos</span>
          <strong>{{ resumen.fallidas }}</strong>
        </div>
        <div class="summary-item summary-item--success">
          <span>Enviados</span>
          <strong>{{ resumen.enviadas }}</strong>
        </div>
      </div>
    </header>

    <div class="filter-bar" aria-label="Filtrar por estado">
      <span class="filter-label">Estado</span>
      <div class="filter-options">
        <button
          v-for="filtro in filtros"
          :key="filtro.value || 'todos'"
          type="button"
          class="filter-button"
          :class="{ active: filtroEstado === filtro.value }"
          :aria-pressed="filtroEstado === filtro.value"
          :disabled="cargando"
          @click="seleccionarFiltro(filtro.value)"
        >
          {{ filtro.label }}
        </button>
      </div>
      <button type="button" class="refresh-button" :disabled="cargando" @click="cargarNotificaciones">
        <i class="fa-solid fa-rotate" :class="{ spinning: cargando }" aria-hidden="true" />
        Actualizar
      </button>
    </div>

    <div v-if="errorCarga" class="feedback feedback--error" role="alert">
      <i class="fa-solid fa-circle-exclamation" aria-hidden="true" />
      <span>{{ errorCarga }}</span>
      <button type="button" @click="cargarNotificaciones">Reintentar carga</button>
    </div>

    <div v-else-if="cargando" class="notification-list" aria-busy="true" aria-label="Cargando notificaciones">
      <div v-for="item in 4" :key="item" class="notification-card skeleton-card">
        <span class="skeleton-line skeleton-line--short" />
        <span class="skeleton-line" />
        <span class="skeleton-line skeleton-line--medium" />
      </div>
    </div>

    <div v-else-if="notificaciones.length === 0" class="empty-state">
      <span class="empty-icon"><i class="fa-regular fa-envelope-open" aria-hidden="true" /></span>
      <strong>No hay correos en este estado</strong>
      <p>Prueba otro filtro o actualiza para revisar actividad nueva.</p>
    </div>

    <div v-else class="notification-list" aria-live="polite">
      <article
        v-for="notificacion in notificaciones"
        :key="notificacion._id"
        class="notification-card"
        :class="`notification-card--${notificacion.estado}`"
      >
        <div class="card-main">
          <div class="card-heading">
            <span class="mail-icon" aria-hidden="true">
              <i :class="notificacion.estado === 'enviada' ? 'fa-solid fa-envelope-circle-check' : 'fa-solid fa-envelope'" />
            </span>
            <div class="recipient">
              <span class="event-name">{{ eventoLabels[notificacion.evento] }}</span>
              <strong>{{ notificacion.destinatario }}</strong>
              <span class="created-at">Creado {{ formatDate(notificacion.createdAt) }}</span>
            </div>
            <span class="status-pill" :class="`status-pill--${notificacion.estado}`">
              {{ estadoLabels[notificacion.estado] }}
            </span>
          </div>

          <div class="details">
            <div class="detail-item operation-detail">
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

          <div v-if="notificacion.ultimoError" class="last-error">
            <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" />
            <div>
              <span>Último error</span>
              <p>{{ notificacion.ultimoError }}</p>
            </div>
          </div>
        </div>

        <div v-if="notificacion.estado === 'fallida'" class="card-action">
          <button
            type="button"
            class="retry-button"
            :disabled="reintentandoId !== null"
            @click="reintentar(notificacion)"
          >
            <i
              class="fa-solid fa-rotate-right"
              :class="{ spinning: reintentandoId === notificacion._id }"
              aria-hidden="true"
            />
            {{ reintentandoId === notificacion._id ? 'Reintentando...' : 'Reintentar envío' }}
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

$cream: #f3ede1;
$cream-muted: #c9c0b1;
$black-soft: #11100f;
$black-raised: #181613;
$success: #2bbb92;
$danger: #ef5b61;
$warning: #ffb347;

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
  background: $black-soft;
  border: 1px solid rgba($cream, 0.12);
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

  h2 {
    margin: 0;
    color: #fff;
    font-size: clamp(1.5rem, 3vw, 2.2rem);
    line-height: 1.1;
  }

  p {
    margin: $space-3 0 0;
    color: $cream-muted;
    line-height: 1.6;
  }
}

.summary {
  display: flex;
  align-items: stretch;
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid rgba($cream, 0.14);
  border-radius: 14px;
}

.summary-item {
  display: flex;
  min-width: 92px;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  padding: $space-3 $space-4;
  border-right: 1px solid rgba($cream, 0.12);

  &:last-child { border-right: 0; }
  span { color: $cream-muted; font-size: 0.7rem; text-transform: uppercase; }
  strong { color: #fff; font-size: 1.4rem; }
  &--danger strong { color: $danger; }
  &--success strong { color: $success; }
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: $space-3;
  flex-wrap: wrap;
  padding: $space-3;
  background: $black-soft;
  border: 1px solid rgba($cream, 0.1);
  border-radius: 16px;
}

.filter-label {
  padding-left: $space-2;
  color: $cream-muted;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.filter-options {
  display: flex;
  flex: 1;
  align-items: center;
  gap: $space-2;
  flex-wrap: wrap;
}

.filter-button,
.refresh-button,
.retry-button,
.feedback button {
  font: inherit;
  cursor: pointer;
  transition: color 180ms ease, background-color 180ms ease, border-color 180ms ease, transform 180ms ease;

  &:focus-visible {
    outline: 2px solid $brand-orange;
    outline-offset: 2px;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.55;
  }
}

.filter-button {
  padding: $space-2 $space-3;
  color: $cream-muted;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 650;

  &:hover:not(:disabled) { color: #fff; border-color: rgba($brand-orange, 0.45); }
  &.active { color: $black-soft; background: $brand-orange; border-color: $brand-orange; }
}

.refresh-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  color: $cream;
  background: transparent;
  border: 1px solid rgba($cream, 0.22);
  border-radius: 10px;

  &:hover:not(:disabled) { color: $brand-orange; border-color: $brand-orange; }
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.notification-card {
  display: flex;
  align-items: stretch;
  overflow: hidden;
  background: $black-soft;
  border: 1px solid rgba($cream, 0.12);
  border-left: 4px solid $warning;
  border-radius: 18px;
  transition: border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease;

  &:hover {
    transform: translateY(-2px);
    border-top-color: rgba($brand-orange, 0.35);
    border-right-color: rgba($brand-orange, 0.35);
    border-bottom-color: rgba($brand-orange, 0.35);
    box-shadow: 0 14px 38px rgba(#000, 0.3);
  }

  &--enviada { border-left-color: $success; }
  &--fallida { border-left-color: $danger; }
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
  .created-at { color: $cream-muted; font-size: 0.75rem; }
}

.status-pill {
  flex-shrink: 0;
  padding: 5px 10px;
  color: $warning;
  background: rgba($warning, 0.12);
  border: 1px solid rgba($warning, 0.3);
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 750;

  &--enviada { color: $success; background: rgba($success, 0.12); border-color: rgba($success, 0.3); }
  &--fallida { color: $danger; background: rgba($danger, 0.12); border-color: rgba($danger, 0.3); }
  &--enviando { color: $brand-orange; background: rgba($brand-orange, 0.12); border-color: rgba($brand-orange, 0.3); }
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
  background: $black-raised;
  border: 1px solid rgba($cream, 0.08);
  border-radius: 12px;

  span { color: $cream-muted; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
  strong { color: $cream; font-size: 0.88rem; }
  small { overflow: hidden; color: $cream-muted; font-size: 0.7rem; text-overflow: ellipsis; white-space: nowrap; }
  code { width: fit-content; color: $brand-orange; font-size: 0.75rem; }
  .date-value { font-size: 0.78rem; }
}

.last-error {
  display: flex;
  align-items: flex-start;
  gap: $space-3;
  padding: $space-3 $space-4;
  color: $danger;
  background: rgba($danger, 0.08);
  border: 1px solid rgba($danger, 0.24);
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
  background: rgba($danger, 0.05);
  border-left: 1px solid rgba($danger, 0.16);
}

.retry-button {
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

  &:hover:not(:disabled) { background: $brand-orange-deep; border-color: $brand-orange-deep; transform: translateY(-1px); }
}

.feedback,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  min-height: 180px;
  padding: $space-6;
  background: $black-soft;
  border: 1px solid rgba($cream, 0.12);
  border-radius: 18px;
}

.feedback--error {
  color: #ffd7d8;
  border-color: rgba($danger, 0.35);

  i { color: $danger; }
  button { padding: $space-2 $space-3; color: #fff; background: transparent; border: 1px solid $danger; border-radius: 9px; }
  button:hover { background: rgba($danger, 0.15); }
}

.empty-state {
  flex-direction: column;
  text-align: center;

  .empty-icon { display: inline-flex; width: 52px; height: 52px; align-items: center; justify-content: center; color: $brand-orange; background: rgba($brand-orange, 0.12); border-radius: 50%; font-size: 1.2rem; }
  strong { color: #fff; }
  p { margin: -$space-2 0 0; color: $cream-muted; }
}

.skeleton-card {
  min-height: 160px;
  flex-direction: column;
  gap: $space-4;
  justify-content: center;
  padding: $space-5;
  pointer-events: none;
}

.skeleton-line {
  display: block;
  width: 90%;
  height: 14px;
  background: $black-raised;
  border-radius: 999px;
  animation: pulse 1.2s ease-in-out infinite;
  &--short { width: 25%; }
  &--medium { width: 58%; }
}

.spinning { animation: spin 800ms linear infinite; }

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 50% { opacity: 0.45; } }

@media (max-width: 820px) {
  .intro { align-items: stretch; flex-direction: column; }
  .summary { align-self: flex-start; }
  .notification-card { flex-direction: column; }
  .card-action { flex-basis: auto; border-top: 1px solid rgba($danger, 0.16); border-left: 0; }
  .retry-button { width: auto; min-width: 190px; }
}

@media (max-width: 560px) {
  .intro { padding: $space-5; }
  .summary { width: 100%; }
  .summary-item { min-width: 0; flex: 1; padding: $space-3; }
  .filter-bar { align-items: stretch; flex-direction: column; }
  .filter-label { padding-left: 0; }
  .filter-options { gap: $space-1; }
  .refresh-button { width: 100%; }
  .card-main { padding: $space-4; }
  .card-heading { align-items: flex-start; flex-wrap: wrap; }
  .recipient { flex-basis: calc(100% - 58px); }
  .status-pill { margin-left: 58px; }
  .detail-item { min-width: 100%; }
  .feedback { align-items: stretch; flex-direction: column; text-align: center; }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
