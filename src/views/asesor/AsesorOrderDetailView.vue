<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { asesoriaApi, type PurchaseOrder } from '@/services/asesoria.api'
import AppFileUpload from '@/components/ui/AppFileUpload.vue'

const route = useRoute()
const router = useRouter()
const orderId = computed(() => String(route.params.id))

const order = ref<PurchaseOrder | null>(null)
const loading = ref(false)
const error = ref('')
const generatingLink = ref(false)
const uploading = ref(false)
const transferFile = ref<File | null>(null)
const transferReference = ref('')
const transferNotes = ref('')
const copied = ref(false)
const internalCopied = ref(false)
const resettingToken = ref(false)

const showShareModal = ref(false)
const shareTargetEmail = ref('')
const sharing = ref(false)
const shareSearchResults = ref<{ _id: string; name: string; email: string }[]>([])
const searchingAsesores = ref(false)

const windowOrigin = window.location.origin
const apiBaseUrl = (() => {
  const origin = window.location.origin
  if (origin.includes('testing-storybrand-frontend.bakano.ec')) {
    return 'https://testing-storybrand-backapp.bakano.ec/api'
  }
  return (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8101/api'
})()

const statusSteps = [
  { key: 'borrador', label: 'Borrador' },
  { key: 'pendiente', label: 'Pendiente' },
  { key: 'en_proceso', label: 'En proceso' },
  { key: 'comprado', label: 'Comprado' },
  { key: 'en_envio', label: 'En envío' },
  { key: 'entregado', label: 'Entregado' },
]

const currentStepIndex = computed(() => {
  if (!order.value) return -1
  return statusSteps.findIndex((s) => s.key === order.value?.status)
})

function copyInternalLink() {
  if (!order.value?.viewToken) return
  navigator.clipboard.writeText(`${windowOrigin}/seguir/${order.value.viewToken}`)
  internalCopied.value = true
  setTimeout(() => (internalCopied.value = false), 2000)
}

async function resetToken() {
  if (!order.value) return
  resettingToken.value = true
  try {
    const data = await asesoriaApi.resetViewToken(order.value._id)
    order.value = data.order
  } catch (e: any) {
    console.error('Error resetting token:', e)
  } finally {
    resettingToken.value = false
  }
}

function formatAuditAction(action: string): string {
  const labels: Record<string, string> = {
    created: 'Orden creada',
    status_changed: 'Estado actualizado',
    payment_status_changed: 'Estado de pago actualizado',
    shared: 'Orden compartida',
    unshared: 'Acceso removido',
    link_shared: 'Enlace de pago generado',
    transfer_uploaded: 'Comprobante subido',
    view_token_generated: 'Enlace interno generado',
    view_token_reset: 'Enlace interno renovado',
    viewed_by_client: 'Visto por el cliente',
  }
  return labels[action] || action
}

function formatDate(ts: string): string {
  const d = new Date(ts)
  return d.toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function loadOrder() {
  loading.value = true
  error.value = ''
  try {
    const data = await asesoriaApi.getOrder(orderId.value)
    order.value = data.order
  } catch (e: any) {
    error.value = e.message || 'Error al cargar la orden'
  } finally {
    loading.value = false
  }
}

async function generateLink() {
  generatingLink.value = true
  try {
    await asesoriaApi.generatePaymentLink(orderId.value)
    await loadOrder()
  } catch (e: any) {
    error.value = e.data?.detail || e.message || 'Error al generar link'
  } finally {
    generatingLink.value = false
  }
}

function copyLink() {
  if (!order.value?.paymentLinkUrl) return
  navigator.clipboard.writeText(order.value.paymentLinkUrl)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

async function submitTransfer() {
  if (!transferFile.value) {
    error.value = 'Selecciona una imagen del comprobante'
    return
  }
  uploading.value = true
  error.value = ''
  try {
    const formData = new FormData()
    formData.append('proof', transferFile.value)
    formData.append('reference', transferReference.value)
    formData.append('notes', transferNotes.value)
    await asesoriaApi.uploadTransferProof(orderId.value, formData)
    transferFile.value = null
    transferReference.value = ''
    transferNotes.value = ''
    await loadOrder()
  } catch (e: any) {
    error.value = e.data?.detail || e.message || 'Error al subir comprobante'
  } finally {
    uploading.value = false
  }
}

async function searchAsesores() {
  if (!shareTargetEmail.value.trim()) return
  searchingAsesores.value = true
  try {
    const token = localStorage.getItem('admin_token') || localStorage.getItem('access_token')
    const res = await axios.get<{ users: { _id: string; name: string; email: string }[] }>(
      `${apiBaseUrl}/users?q=${encodeURIComponent(shareTargetEmail.value.trim())}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    shareSearchResults.value = res.data.users || []
  } catch {
    shareSearchResults.value = []
  } finally {
    searchingAsesores.value = false
  }
}

async function shareWith(asesorId: string) {
  sharing.value = true
  try {
    await asesoriaApi.shareOrder(orderId.value, asesorId)
    showShareModal.value = false
    shareTargetEmail.value = ''
    shareSearchResults.value = []
    await loadOrder()
  } catch (e: any) {
    error.value = e.message || 'Error al compartir'
  } finally {
    sharing.value = false
  }
}

async function unshare(asesorId: string) {
  try {
    await asesoriaApi.unshareOrder(orderId.value, asesorId)
    await loadOrder()
  } catch (e: any) {
    error.value = e.message || 'Error al revocar'
  }
}

function isSharedWith(asesorId: string): boolean {
  return order.value?.sharedWith?.some((s) => s.asesorId === asesorId) ?? false
}

onMounted(loadOrder)
</script>

<template>
  <div class="order-detail-page">
    <button class="btn-back" @click="router.push({ name: 'AsesorOrders' })">
      <i class="fa-solid fa-arrow-left" /> Volver a órdenes
    </button>

    <div v-if="loading" class="loading">
      <i class="fa-solid fa-circle-notch fa-spin" />
      <span>Cargando orden...</span>
    </div>

    <div v-else-if="error" class="alert error">
      <i class="fa-solid fa-circle-exclamation" />
      <span>{{ error }}</span>
    </div>

    <template v-else-if="order">
      <div class="detail-header">
        <div>
          <div class="detail-id">Orden #{{ order._id.slice(-6).toUpperCase() }}</div>
          <h1 class="page-title">{{ order.clientName }}</h1>
          <p class="detail-desc">{{ order.description }}</p>
        </div>
        <div class="detail-total">
          <span>Total</span>
          <strong>${{ order.totalAmount.toFixed(2) }}</strong>
        </div>
      </div>

      <div class="detail-grid">
        <section class="card">
          <h3 class="card-title">Progreso</h3>
          <div class="steps">
            <div
              v-for="(step, idx) in statusSteps"
              :key="step.key"
              class="step"
              :class="{ active: idx <= currentStepIndex, current: idx === currentStepIndex }"
            >
              <div class="step-dot" />
              <span>{{ step.label }}</span>
            </div>
          </div>
        </section>

        <section class="card">
          <h3 class="card-title">Detalles de la compra</h3>
          <div class="detail-list">
            <div class="detail-item"><span>Tipo de servicio</span><strong>{{ order.serviceType === 'compra_total' ? 'Compra Total' : 'Logística' }}</strong></div>
            <div class="detail-item"><span>Tienda</span><strong>{{ order.storeName }}</strong></div>
            <div class="detail-item"><span>Valor producto</span><strong>${{ order.productValue.toFixed(2) }}</strong></div>
            <div class="detail-item"><span>Envío USA</span><strong>${{ order.shippingValue.toFixed(2) }}</strong></div>
            <div class="detail-item"><span>Fee de gestión</span><strong>${{ order.feeAmount.toFixed(2) }}</strong></div>
            <div class="detail-item"><span>Peso</span><strong>{{ order.weightLb ? `${order.weightLb} lb` : 'N/A' }}</strong></div>
            <div class="detail-item"><span>Tracking USA</span><strong>{{ order.trackingUsa || 'N/A' }}</strong></div>
            <div class="detail-item" v-if="order.productUrl">
              <span>URL</span>
              <a :href="order.productUrl" target="_blank" rel="noopener">Ver producto <i class="fa-solid fa-external-link-alt" /></a>
            </div>
          </div>
        </section>

        <section class="card">
          <h3 class="card-title">Link de pago</h3>
          <div v-if="order.paymentLinkUrl" class="payment-link">
            <input :value="order.paymentLinkUrl" readonly class="field-input" />
            <button class="btn-secondary" @click="copyLink">
              <i :class="copied ? 'fa-solid fa-check' : 'fa-solid fa-copy'" />
              {{ copied ? 'Copiado' : 'Copiar' }}
            </button>
          </div>
          <button v-else class="btn-primary" :disabled="generatingLink" @click="generateLink">
            <span v-if="generatingLink">Generando...</span>
            <span v-else><i class="fa-solid fa-link" /> Generar link Payphone</span>
          </button>
        </section>

        <section class="card">
          <h3 class="card-title">Comprobante de transferencia</h3>
          <div v-if="order.transferProofUrl" class="transfer-proof">
            <a :href="order.transferProofUrl" target="_blank" rel="noopener" class="proof-link">
              <i class="fa-solid fa-file-image" /> Ver comprobante
            </a>
            <p class="transfer-status">
              Estado: <span class="badge" :class="order.paymentStatus === 'pagado' ? 'badge-green' : 'badge-blue'">
                {{ order.paymentStatus === 'verificando' ? 'En verificación' : order.paymentStatus }}
              </span>
            </p>
          </div>
          <div v-else class="transfer-form">
            <AppFileUpload
              v-model="transferFile"
              label="Imagen del comprobante"
              accept="image/*"
              hint="Adjunta una foto clara del comprobante para verificar la transferencia."
            />
            <div class="field-row">
              <label class="field">
                <span class="field-label">Referencia</span>
                <input v-model="transferReference" class="field-input" placeholder="Número de referencia" />
              </label>
              <label class="field">
                <span class="field-label">Notas</span>
                <input v-model="transferNotes" class="field-input" placeholder="Banco, fecha..." />
              </label>
            </div>
            <button class="btn-primary" :disabled="uploading" @click="submitTransfer">
              <span v-if="uploading">Subiendo...</span>
              <span v-else><i class="fa-solid fa-upload" /> Subir comprobante</span>
            </button>
          </div>
        </section>

        <section class="card">
          <h3 class="card-title">Compartir</h3>
          <p class="share-desc">Comparte esta orden con otro asesor para que pueda verla.</p>
          <div v-if="order.sharedWith && order.sharedWith.length > 0" class="shared-list">
            <div v-for="s in order.sharedWith" :key="s.asesorId" class="shared-item">
              <span>Asesor {{ s.asesorId.slice(-6).toUpperCase() }}</span>
              <button class="btn-unshare" @click="unshare(s.asesorId)" title="Revocar acceso">
                <i class="fa-solid fa-xmark" />
              </button>
            </div>
          </div>
          <button class="btn-secondary" @click="showShareModal = true">
            <i class="fa-solid fa-share-nodes" /> Compartir
          </button>
        </section>

        <section class="card full-width">
          <h3 class="card-title">Enlace interno para el cliente</h3>
          <p class="share-desc">Este enlace permite al cliente ver el estado de su orden sin necesidad de cuenta.</p>
          <div v-if="order.viewToken" class="payment-link">
            <input :value="`${windowOrigin}/seguir/${order.viewToken}`" readonly class="field-input" />
            <button class="btn-secondary" @click="copyInternalLink">
              <i :class="internalCopied ? 'fa-solid fa-check' : 'fa-solid fa-copy'" />
              {{ internalCopied ? 'Copiado' : 'Copiar' }}
            </button>
            <button class="btn-ghost btn-sm" :disabled="resettingToken" @click="resetToken" title="Generar nuevo enlace">
              <i class="fa-solid fa-rotate" /> Nuevo
            </button>
          </div>
          <button v-else class="btn-primary btn-sm" :disabled="resettingToken" @click="resetToken">
            <i class="fa-solid fa-link" /> Generar enlace
          </button>
        </section>

        <section v-if="order.auditLog && order.auditLog.length" class="card full-width">
          <h3 class="card-title">Historial de cambios</h3>
          <div class="audit-timeline">
            <div v-for="entry in order.auditLog" :key="entry.timestamp" class="audit-entry">
              <div class="audit-dot" />
              <div class="audit-body">
                <div class="audit-action">{{ formatAuditAction(entry.action) }}</div>
                <div class="audit-meta">{{ entry.userName }} &middot; {{ formatDate(entry.timestamp) }}</div>
                <div v-if="entry.notes" class="audit-notes">{{ entry.notes }}</div>
              </div>
            </div>
          </div>
        </section>

        <section v-if="order.notes || order.adminNotes" class="card full-width">
          <h3 class="card-title">Notas</h3>
          <p v-if="order.notes" class="note"><strong>Tuyas:</strong> {{ order.notes }}</p>
          <p v-if="order.adminNotes" class="note"><strong>Admin:</strong> {{ order.adminNotes }}</p>
        </section>
      </div>
    </template>

    <transition name="fade">
      <div v-if="showShareModal" class="modal-overlay" @click.self="showShareModal = false">
        <div class="modal-card">
          <div class="modal-icon-box info"><i class="fa-solid fa-share-nodes" /></div>
          <h3>Compartir orden</h3>
          <p class="share-desc">Busca un asesor por nombre o email para compartir esta orden.</p>
          <div class="share-search">
            <input
              v-model="shareTargetEmail"
              class="field-input"
              placeholder="Nombre o email del asesor..."
              @keyup.enter="searchAsesores"
            />
            <button class="btn-sm" @click="searchAsesores" :disabled="searchingAsesores">
              <i class="fa-solid fa-search" />
            </button>
          </div>
          <div v-if="searchingAsesores" class="search-loading">Buscando...</div>
          <div v-else-if="shareSearchResults.length > 0" class="share-results">
            <button
              v-for="u in shareSearchResults"
              :key="u._id"
              class="share-result-item"
              :class="{ shared: isSharedWith(u._id) }"
              :disabled="isSharedWith(u._id)"
              @click="shareWith(u._id)"
            >
              <strong>{{ u.name }}</strong>
              <span>{{ u.email }}</span>
              <span v-if="isSharedWith(u._id)" class="shared-tag">Compartido</span>
            </button>
          </div>
          <div v-else-if="shareTargetEmail && !searchingAsesores" class="search-empty">
            No se encontraron asesores
          </div>
          <div class="modal-actions">
            <button class="btn-ghost" @click="showShareModal = false">Cerrar</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.order-detail-page {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.btn-back {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-4;
  background: transparent;
  border: 1px solid rgba($ink-500, 0.2);
  border-radius: 10px;
  color: $ink-300;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.9rem;

  &:hover {
    background: rgba($ink-500, 0.1);
    color: $fg-dark;
  }
}

.loading,
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  padding: $space-12 0;
  color: $ink-500;
}

.alert {
  display: flex;
  align-items: flex-start;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-radius: 12px;
  font-size: 0.9rem;
  background: rgba($signal-red, 0.1);
  color: #ff8a8f;
  border: 1px solid rgba($signal-red, 0.15);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-4;

  @media (max-width: 640px) {
    flex-direction: column;
  }
}

.detail-id {
  font-size: 0.8rem;
  font-weight: 700;
  color: $brand-orange;
  margin-bottom: $space-1;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0 0 $space-2;
}

.detail-desc {
  color: $ink-300;
  margin: 0;
}

.detail-total {
  text-align: right;

  span {
    display: block;
    font-size: 0.85rem;
    color: $ink-400;
  }
  strong {
    font-size: 2rem;
    color: $brand-orange;
  }

  @media (max-width: 640px) {
    text-align: left;
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-6;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 20px;
  padding: $space-6;

  &.full-width {
    grid-column: 1 / -1;
  }
}

.card-title {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0 0 $space-5;
}

.steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  overflow-x: auto;
  padding-bottom: $space-2;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  font-size: 0.75rem;
  color: $ink-500;
  white-space: nowrap;
  flex: 1;

  .step-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: $ink-700;
    border: 2px solid $ink-600;
  }

  &.active .step-dot {
    background: $brand-orange;
    border-color: $brand-orange;
  }

  &.current {
    color: $brand-orange;
    font-weight: 600;
  }
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
  color: $ink-300;

  strong, a {
    color: $fg-dark;
    font-weight: 600;
  }

  a {
    text-decoration: none;
    color: $brand-orange;
  }
}

.payment-link {
  display: flex;
  gap: $space-3;

  .field-input {
    flex: 1;
  }
}

.field-input {
  background: $ink-1000;
  border: 1px solid rgba($ink-500, 0.2);
  border-radius: 12px;
  padding: $space-3 $space-4;
  color: $fg-dark;
  font-size: 0.95rem;
  font-family: inherit;
  outline: none;

  &:focus {
    border-color: $brand-orange;
  }

  &.file {
    padding: $space-2;
  }
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  padding: $space-3 $space-4;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-primary {
  background: $brand-orange;
  color: $ink-1000;

  &:hover:not(:disabled) {
    background: lighten($brand-orange, 6%);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-secondary {
  background: $ink-700;
  color: $fg-dark;

  &:hover {
    background: $ink-600;
  }
}

.transfer-proof {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.proof-link {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  color: $brand-orange;
  text-decoration: none;
  font-weight: 600;
}

.transfer-status {
  margin: 0;
  color: $ink-300;
}

.badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
}

.badge-green { background: rgba($signal-green, 0.12); color: $signal-green; }
.badge-blue { background: rgba($signal-blue, 0.12); color: $signal-blue; }

.field {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  margin-bottom: $space-4;

  .field-label {
    font-size: 0.85rem;
    font-weight: 500;
    color: $ink-300;
  }
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-4;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.transfer-form {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.note {
  color: $ink-300;
  margin: 0 0 $space-2;
  line-height: 1.5;

  &:last-child {
    margin-bottom: 0;
  }
}

.share-desc {
  color: $ink-400;
  font-size: 0.85rem;
  margin: 0 0 $space-4;
}

.shared-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  margin-bottom: $space-4;
}

.shared-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-2 $space-3;
  background: rgba($brand-orange, 0.06);
  border: 1px solid rgba($brand-orange, 0.15);
  border-radius: 10px;
  font-size: 0.85rem;
  color: $fg-dark;
}

.btn-unshare {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: $ink-400;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: rgba($signal-red, 0.1); color: #ff8a8f; }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba($ink-1000, 0.75);
  backdrop-filter: blur(6px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.modal-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.15);
  border-radius: 20px;
  padding: $space-8;
  max-width: 480px;
  width: 100%;
  text-align: center;

  .modal-icon-box {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto $space-4;
    font-size: 1.2rem;
    &.info { background: rgba($brand-orange, 0.12); color: $brand-orange; }
  }

  h3 { font-size: 1.15rem; margin: 0 0 $space-2; }
}

.share-search {
  display: flex;
  gap: $space-2;
  margin-bottom: $space-4;

  .field-input {
    flex: 1;
  }
}

.btn-sm {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $ink-700;
  border: 1px solid rgba($ink-500, 0.2);
  border-radius: 10px;
  color: $fg-dark;
  cursor: pointer;
  flex-shrink: 0;
  &:hover { background: $ink-600; }
}

.search-loading, .search-empty {
  color: $ink-400;
  font-size: 0.85rem;
  padding: $space-3 0;
}

.share-results {
  display: flex;
  flex-direction: column;
  gap: $space-1;
  margin-bottom: $space-4;
  max-height: 200px;
  overflow-y: auto;
}

.share-result-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  width: 100%;
  padding: $space-3;
  background: transparent;
  border: 1px solid rgba($ink-500, 0.1);
  border-radius: 10px;
  color: $fg-dark;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: rgba($brand-orange, 0.08);
    border-color: rgba($brand-orange, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.shared {
    border-color: rgba($brand-orange, 0.2);
  }

  span {
    font-size: 0.8rem;
    color: $ink-400;
  }
}

.shared-tag {
  margin-left: auto;
  font-size: 0.7rem !important;
  font-weight: 600;
  color: $brand-orange !important;
  background: rgba($brand-orange, 0.1);
  padding: 2px 8px;
  border-radius: 6px;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: $space-3;
}

.btn-ghost {
  padding: 0.6rem 1.25rem;
  background: transparent;
  border: 1px solid rgba($ink-500, 0.3);
  border-radius: 10px;
  color: $ink-300;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  &:hover { background: rgba($ink-500, 0.15); color: $fg-dark; }
}

.audit-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-left: $space-2;
}

.audit-entry {
  display: flex;
  gap: $space-3;
  padding: $space-3 0;
  border-left: 2px solid rgba($brand-orange, 0.2);
  margin-left: 4px;
  &:first-child { padding-top: 0; }
  &:last-child { border-left-color: transparent; }
}

.audit-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: $brand-orange;
  flex-shrink: 0;
  margin-left: -7px;
  margin-top: 4px;
}

.audit-body { flex: 1; }

.audit-action {
  font-weight: 600;
  font-size: 0.9rem;
  color: $fg-dark;
}

.audit-meta {
  font-size: 0.75rem;
  color: $ink-400;
  margin-top: 2px;
}

.audit-notes {
  font-size: 0.8rem;
  color: $ink-300;
  margin-top: $space-1;
  background: rgba($ink-700, 0.3);
  padding: $space-1 $space-2;
  border-radius: 6px;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
