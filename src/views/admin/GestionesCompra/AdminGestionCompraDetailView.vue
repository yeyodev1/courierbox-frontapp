<template>
  <div class="page" v-if="!loading">
    <div class="page-header">
      <button class="btn-back" @click="$router.push('/admin/gestiones-compra')">← Gestiones</button>
      <div class="header-right">
        <span class="estado-badge" :class="`estado-${gestion?.estado}`">{{ estadoLabel(gestion?.estado ?? '') }}</span>
        <AppButton variant="outline" @click="reNotificar" :disabled="notifying">
          {{ notifying ? 'Enviando...' : 'Renotificar' }}
        </AppButton>
      </div>
    </div>

    <div class="detail-grid" v-if="gestion">
      <!-- Left: datos principales -->
      <div class="detail-main">
        <div class="detail-card operation-timeline">
          <h3 class="card-title">Progreso de la operación</h3>
          <div class="timeline-steps">
            <article class="timeline-step created done">
              <span class="timeline-icon"><i class="fa-solid fa-file-circle-plus" /></span>
              <div><strong>Gestión creada</strong><small>{{ formatDateTime(gestion.createdAt) }}</small></div>
            </article>
            <article class="timeline-step paid" :class="{ done: gestion.estadoPago === 'confirmado' }">
              <span class="timeline-icon"><i class="fa-solid fa-circle-check" /></span>
              <div><strong>Pago confirmado</strong><small>{{ gestion.pagoConfirmadoEn ? formatDateTime(gestion.pagoConfirmadoEn) : 'Pendiente' }}</small></div>
            </article>
            <article class="timeline-step delivered" :class="{ done: gestion.estadoEntrega === 'entregada' || gestion.stage === 'entregada' }">
              <span class="timeline-icon"><i class="fa-solid fa-box-circle-check" /></span>
              <div><strong>Entrega completada</strong><small>{{ gestion.estadoEntrega === 'entregada' || gestion.stage === 'entregada' ? 'Finalizada' : 'Pendiente' }}</small></div>
            </article>
          </div>
        </div>

        <!-- Cliente -->
        <div class="detail-card">
          <h3 class="card-title">Cliente</h3>
          <p class="info-row"><span>Nombre</span><strong>{{ contacto?.nombre ?? '—' }}</strong></p>
          <p class="info-row" v-if="contacto?.email"><span>Email</span><a :href="`mailto:${contacto.email}`" class="link">{{ contacto.email }}</a></p>
          <p class="info-row" v-if="contacto?.telefono"><span>Teléfono</span><strong>{{ contacto.telefono }}</strong></p>
        </div>

        <!-- Financiero -->
        <div class="detail-card">
          <h3 class="card-title">Financiero</h3>
          <p class="info-row"><span>Valor Total</span><strong class="orange">${{ gestion.valorTotal.toFixed(2) }}</strong></p>
          <p class="info-row">
            <span>Reserva</span>
            <span class="reserva-group">
              <strong>${{ gestion.valorReserva.toFixed(2) }}</strong>
              <span v-if="gestion.reservaConfirmada" class="chip green">Confirmada ✓</span>
              <AppButton v-else variant="outline" size="sm" @click="confirmarReserva" :disabled="confirming">
                {{ confirming ? '...' : 'Confirmar reserva' }}
              </AppButton>
            </span>
          </p>
          <p class="info-row"><span>Cuenta de pago</span><strong>{{ cuentaText }}</strong></p>
          <p class="info-row"><span>Costo de venta</span><strong>${{ gestion.costoVenta.toFixed(2) }}</strong></p>
          <p class="info-row"><span>Comisión</span><strong>${{ gestion.valorComision.toFixed(2) }}</strong></p>
          <p class="info-row"><span>Margen</span><strong :class="margin >= 0 ? 'green' : 'red'">${{ margin.toFixed(2) }}</strong></p>
          <p class="info-row">
            <span>Estado de pago</span>
            <span class="reserva-group">
              <strong>{{ paymentLabel(gestion.estadoPago) }}</strong>
              <AppButton v-if="!['confirmado', 'reembolsado'].includes(gestion.estadoPago || '')" variant="primary" size="sm" @click="confirmarPago" :disabled="confirmingPayment">
                {{ confirmingPayment ? 'Confirmando...' : 'Confirmar pago total' }}
              </AppButton>
            </span>
          </p>
        </div>

        <!-- Detalles compra -->
        <div class="detail-card">
          <h3 class="card-title">Detalles de compra</h3>
          <p class="info-row"><span>Asesor</span><strong>{{ asesor?.name ?? '—' }}</strong></p>
          <p class="info-row"><span>Página</span><a :href="gestion.paginaCompra" target="_blank" class="link" rel="noopener">{{ gestion.paginaCompra }}</a></p>
          <p class="info-row"><span>Entrega tentativa</span><strong>{{ formatDate(gestion.fechaEntregaTentativa) }}</strong></p>
          <p class="info-row" v-if="gestion.notas"><span>Notas</span><span class="muted">{{ gestion.notas }}</span></p>
          <p class="info-row">
            <span>Compra</span>
            <span class="reserva-group">
              <strong>{{ gestion.estadoCompra ?? 'pendiente' }}</strong>
              <AppButton v-if="gestion.estadoCompra !== 'comprada'" variant="outline" size="sm" @click="marcarComprada" :disabled="markingPurchased">
                {{ markingPurchased ? 'Guardando...' : 'Marcar comprada' }}
              </AppButton>
            </span>
          </p>
        </div>

        <!-- Imagen compra -->
        <div class="detail-card" v-if="gestion.imagenCompraUrl">
          <h3 class="card-title">Imagen de la compra</h3>
          <img :src="gestion.imagenCompraUrl" alt="Imagen de compra" class="compra-img" />
        </div>

        <div class="detail-card" v-if="gestion.envio?.estado === 'entregado'">
          <h3 class="card-title">Evidencia de entrega</h3>
          <p class="info-row"><span>Recibido por</span><strong>{{ gestion.envio.recibidoPor || '—' }}</strong></p>
          <p class="info-row"><span>Cédula</span><strong>{{ gestion.envio.recibidoPorCedula || '—' }}</strong></p>
          <p class="info-row"><span>Fecha</span><strong>{{ gestion.envio.entregadoEn ? formatDateTime(gestion.envio.entregadoEn) : '—' }}</strong></p>
          <div class="evidence-images">
            <img v-if="gestion.envio.fotoEntregaUrl" :src="gestion.envio.fotoEntregaUrl" alt="Foto de entrega" />
            <img v-if="gestion.envio.firmaUrl" :src="gestion.envio.firmaUrl" alt="Firma del receptor" />
          </div>
        </div>

        <!-- Estado -->
        <div class="detail-card">
          <h3 class="card-title">Cambiar estado</h3>
          <div class="estado-buttons">
            <button
              v-for="s in estados"
              :key="s.value"
              class="estado-btn"
              :class="{ active: gestion.estado === s.value }"
              @click="cambiarEstado(s.value)"
            >{{ s.label }}</button>
          </div>
        </div>
        <div class="detail-card">
          <h3 class="card-title">Correos</h3>
          <div v-if="gestion.notificaciones?.length" class="audit-list">
            <div v-for="notification in gestion.notificaciones" :key="notification._id" class="audit-entry">
              <span class="audit-action">{{ notification.evento }}</span>
              <span class="audit-who">{{ notification.destinatario }}</span>
              <span class="audit-date">{{ notification.estado }} · {{ notification.intentos }} intento(s)</span>
              <span v-if="notification.ultimoError" class="audit-notes">{{ notification.ultimoError }}</span>
            </div>
          </div>
          <p v-else class="muted">Sin correos registrados.</p>
        </div>

        <!-- Link público -->
        <div class="detail-card">
          <h3 class="card-title">Enlace público del cliente</h3>
          <div class="link-row">
            <code class="public-link">{{ viewUrl }}</code>
            <AppButton variant="outline" size="sm" @click="copyLink">Copiar</AppButton>
          </div>
        </div>
      </div>

      <!-- Right: audit log -->
      <div class="detail-sidebar">
        <div class="detail-card">
          <h3 class="card-title">Historial</h3>
          <div class="audit-list">
            <div v-for="(entry, i) in gestion.auditLog.slice().reverse()" :key="i" class="audit-entry">
              <span class="audit-action">{{ entry.action }}</span>
              <span class="audit-who">{{ entry.userName }}</span>
              <span class="audit-date">{{ formatDateTime(entry.timestamp) }}</span>
              <span v-if="entry.notes" class="audit-notes">{{ entry.notes }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="loading-state">Cargando gestión...</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import { gestionesCompraAPI } from '@/services/gestiones_compra.api'
import { useToastStore } from '@/stores/toast.store'
import type { GestionCompra } from '@/services/gestiones_compra.api'

const route = useRoute()
const toast = useToastStore()

const gestion = ref<GestionCompra | null>(null)
const loading = ref(true)
const confirming = ref(false)
const notifying = ref(false)
const confirmingPayment = ref(false)
const markingPurchased = ref(false)

const paymentLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  verificando: 'Verificando',
  confirmado: 'Confirmado',
  rechazado: 'Rechazado',
  reembolsado: 'Reembolsado',
}
function paymentLabel(value?: string) { return paymentLabels[value || 'pendiente'] || value || 'Pendiente' }

const id = computed(() => route.params.id as string)

const contacto = computed(() => typeof gestion.value?.contactoId === 'object' ? gestion.value.contactoId as any : null)
const asesor = computed(() => typeof gestion.value?.asesorId === 'object' ? gestion.value.asesorId as any : null)
const cuenta = computed(() => typeof gestion.value?.cuentaBancariaId === 'object' ? gestion.value.cuentaBancariaId as any : null)
const cuentaText = computed(() => cuenta.value ? `${cuenta.value.banco} · ${cuenta.value.numeroCuenta}` : '—')
const margin = computed(() => (gestion.value?.valorTotal ?? 0) - (gestion.value?.valorComision ?? 0) - (gestion.value?.costoVenta ?? 0))

const estados = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'activa', label: 'Activa' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado', label: 'Cancelado' },
]

const viewUrl = computed(() => `${window.location.origin}/compra/${gestion.value?.viewToken ?? ''}`)

function estadoLabel(e: string) {
  return { borrador: 'Borrador', activa: 'Activa', completado: 'Completado', cancelado: 'Cancelado' }[e] ?? e
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' })
}

async function loadGestion() {
  loading.value = true
  try { gestion.value = await gestionesCompraAPI.getById(id.value) }
  finally { loading.value = false }
}

async function confirmarReserva() {
  confirming.value = true
  try {
    await gestionesCompraAPI.confirmarReserva(id.value)
    await loadGestion()
    toast.showNotification('Reserva confirmada', 'success')
  } catch (e: any) { toast.showNotification(e?.message ?? 'Error', 'error') }
  finally { confirming.value = false }
}

async function confirmarPago() {
  if (!gestion.value) return
  confirmingPayment.value = true
  try {
    await gestionesCompraAPI.confirmarPago(id.value, gestion.value.valorTotal)
    await loadGestion()
    toast.showNotification('Pago confirmado y registrado en reportes', 'success')
  } catch (e: any) { toast.showNotification(e?.message ?? 'No se pudo confirmar el pago', 'error') }
  finally { confirmingPayment.value = false }
}

async function marcarComprada() {
  markingPurchased.value = true
  try {
    await gestionesCompraAPI.marcarComprada(id.value)
    await loadGestion()
    toast.showNotification('Compra registrada en la bitácora', 'success')
  } catch (e: any) { toast.showNotification(e?.message ?? 'No se pudo actualizar la compra', 'error') }
  finally { markingPurchased.value = false }
}

async function cambiarEstado(estado: string) {
  try {
    await gestionesCompraAPI.update(id.value, { estado: estado as any })
    await loadGestion()
    toast.showNotification('Estado actualizado', 'success')
  } catch (e: any) { toast.showNotification(e?.message ?? 'Error', 'error') }
}

async function reNotificar() {
  notifying.value = true
  try {
    await gestionesCompraAPI.reNotificar(id.value)
    toast.showNotification('Notificación reenviada', 'success')
    await loadGestion()
  } catch (e: any) { toast.showNotification(e?.message ?? 'Error', 'error') }
  finally { notifying.value = false }
}

function copyLink() {
  navigator.clipboard.writeText(viewUrl.value)
  toast.showNotification('Enlace copiado', 'success')
}

onMounted(loadGestion)
</script>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
.page { display: flex; flex-direction: column; gap: $space-5; padding: $space-6; }
.page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: $space-3; }
.btn-back { background: none; border: none; color: $brand-orange; cursor: pointer; font-size: 0.9rem; }
.header-right { display: flex; align-items: center; gap: $space-3; }

.detail-grid {
  display: flex; align-items: flex-start; flex-wrap: wrap; gap: $space-5;
}
.detail-main { display: flex; flex: 1 1 620px; min-width: 0; flex-direction: column; gap: $space-4; }
.detail-sidebar { display: flex; flex: 1 1 280px; min-width: 0; flex-direction: column; gap: $space-4; }

.detail-card {
  background: $ink-900; border: 1px solid $ink-500; border-radius: 12px;
  padding: $space-5;
}
.card-title { color: $fg-dark; font-size: 0.9rem; font-weight: 700; margin: 0 0 $space-4; text-transform: uppercase; letter-spacing: 0.04em; }
.info-row {
  display: flex; flex-wrap: wrap; gap: $space-2;
  align-items: center; padding: $space-2 0;
  border-bottom: 1px solid $ink-700;
  &:last-child { border-bottom: none; }
  > span:first-child { flex: 0 1 140px; color: #f2dcc7; font-size: 0.82rem; }
  > strong, > a, > .reserva-group, > .muted { flex: 1 1 180px; }
}
.timeline-steps { display: flex; flex-wrap: wrap; gap: $space-3; }
.timeline-step {
  flex: 1 1 180px; display: flex; align-items: center; gap: $space-3; padding: $space-4;
  border-radius: 14px; border: 1px solid rgba($brand-orange, .3); background: rgba($brand-orange, .06);
  opacity: .58; transition: transform 180ms ease, opacity 180ms ease, border-color 180ms ease;
  &.done { opacity: 1; transform: translateY(-2px); }
  > div { display: flex; flex-direction: column; gap: 3px; }
  small { color: #f2dcc7; }
}
.timeline-icon { width: 40px; height: 40px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; }
.timeline-step.created .timeline-icon { color: #7fb3ff; background: rgba(60, 130, 246, .16); }
.timeline-step.paid.done { border-color: $signal-green; }
.timeline-step.paid .timeline-icon { color: $signal-green; background: rgba($signal-green, .14); }
.timeline-step.delivered.done { border-color: #a78bfa; }
.timeline-step.delivered .timeline-icon { color: #c4b5fd; background: rgba(139, 92, 246, .16); }
@media (prefers-reduced-motion: reduce) { .timeline-step { transition: none; } }
.orange { color: $brand-orange; font-size: 1.1rem; }
.green { color: $signal-green; }
.red { color: $signal-red; }
.muted { color: $ink-400; }
.link { color: $brand-orange; font-size: 0.85rem; word-break: break-all; }

.reserva-group { display: flex; align-items: center; gap: $space-2; flex-wrap: wrap; }
.chip { padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
.chip.green { background: rgba(43,187,146,0.15); color: $signal-green; }

.estado-buttons { display: flex; flex-wrap: wrap; gap: $space-2; }
.estado-btn {
  padding: $space-2 $space-4; border-radius: 8px; border: 1px solid $ink-500;
  background: $ink-700; color: $ink-300; cursor: pointer; font-size: 0.85rem;
  transition: all 0.15s;
  &:hover { border-color: $brand-orange; color: $fg-dark; }
  &.active { border-color: $brand-orange; background: rgba(240,138,31,0.15); color: $fg-dark; font-weight: 600; }
}

.link-row { display: flex; align-items: center; gap: $space-3; flex-wrap: wrap; }
.public-link { font-size: 0.78rem; color: $ink-300; word-break: break-all; background: $ink-700; padding: $space-2 $space-3; border-radius: 6px; }

.compra-img { max-width: 100%; border-radius: 8px; }
.evidence-images { display: flex; flex-wrap: wrap; gap: $space-3; }
.evidence-images img { flex: 1 1 220px; min-width: 0; max-width: 100%; max-height: 320px; object-fit: contain; border-radius: 8px; background: $ink-1000; }

.estado-badge {
  display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;
}
.estado-activa { background: rgba(43,187,146,0.15); color: $signal-green; }
.estado-borrador { background: rgba(111,111,122,0.2); color: $ink-300; }
.estado-completado { background: rgba(43,187,146,0.25); color: $signal-green; }
.estado-cancelado { background: rgba(229,72,77,0.15); color: $signal-red; }

.audit-list { display: flex; flex-direction: column; gap: $space-3; }
.audit-entry {
  display: flex; flex-direction: column; gap: 2px;
  padding: $space-2 0; border-bottom: 1px solid $ink-700;
  &:last-child { border-bottom: none; }
}
.audit-action { font-size: 0.82rem; font-weight: 700; color: $fg-dark; text-transform: capitalize; }
.audit-who { font-size: 0.78rem; color: $brand-orange; }
.audit-date { font-size: 0.72rem; color: $ink-400; }
.audit-notes { font-size: 0.78rem; color: $ink-300; }

.loading-state { padding: $space-8; text-align: center; color: $ink-400; }
</style>
