<template>
  <div class="ventas-page">
    <!-- HERO -->
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow"><i class="fa-solid fa-bag-shopping" aria-hidden="true" /> Ventas del asesor</span>
        <h1>Registra la venta, cobra la reserva y deja el historial listo para el cliente.</h1>
        <p>Conecta cliente, cuenta de pago, comprobante y notificación automática con imagen y términos.</p>
      </div>
      <div class="hero-actions">
        <button class="primary-action" @click="openTypeModal">
          <i class="fa-solid fa-plus" aria-hidden="true" /> Nueva venta
        </button>
        <router-link to="/asesor/gestiones-compra" class="ghost-link">
          <i class="fa-solid fa-clock-rotate-left" aria-hidden="true" /> Ver historial
        </router-link>
        <button class="btn-back" @click="$router.back()">
          <i class="fa-solid fa-arrow-left" aria-hidden="true" /> Volver
        </button>
      </div>
    </section>

    <!-- KPIs -->
    <section class="summary-strip" v-if="!loadingSummary">
      <article class="summary-card accent">
        <span class="summary-label"><i class="fa-solid fa-receipt" aria-hidden="true" /> Ventas del mes</span>
        <strong>{{ stats.totalGestiones }}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label"><i class="fa-solid fa-sack-dollar" aria-hidden="true" /> Total gestionado</span>
        <strong>${{ stats.sumaValorTotal.toFixed(2) }}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label"><i class="fa-solid fa-hand-holding-dollar" aria-hidden="true" /> Comisiones</span>
        <strong>${{ stats.sumaComision.toFixed(2) }}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label"><i class="fa-solid fa-hourglass-half" aria-hidden="true" /> Pendientes</span>
        <strong>{{ pendingCount }}</strong>
      </article>
    </section>
    <section v-else class="summary-strip">
      <div v-for="i in 4" :key="i" class="summary-skeleton" />
    </section>

    <!-- DASHBOARD (no flow active) -->
    <div class="flow-swap">
      <section v-if="!selectedServiceType" key="dash" class="dashboard anim-fade">
        <div class="cta-card">
          <div class="cta-icon"><i class="fa-solid fa-cart-plus" aria-hidden="true" /></div>
          <div class="cta-copy">
            <h2>Empieza una nueva venta</h2>
            <p>Elige el tipo de gestión y te guiamos paso a paso hasta la orden confirmada.</p>
          </div>
          <button class="primary-action lg" @click="openTypeModal">
            <i class="fa-solid fa-plus" aria-hidden="true" /> Nueva venta
          </button>
        </div>

        <div class="panel-card recent-panel">
          <div class="panel-head">
            <h3><i class="fa-solid fa-clock-rotate-left" aria-hidden="true" /> Ventas recientes</h3>
            <span>{{ recentGestiones.length }}</span>
          </div>
          <div v-if="loadingRecent" class="recent-list">
            <div v-for="i in 3" :key="i" class="recent-skeleton" />
          </div>
          <div v-else-if="recentGestiones.length" class="recent-list">
            <article v-for="gestion in recentGestiones" :key="gestion._id" class="recent-item">
              <div class="recent-main">
                <strong>{{ typeof gestion.contactoId === 'object' ? gestion.contactoId.nombre : 'Cliente' }}</strong>
                <span>{{ gestion.paginaCompra }}</span>
              </div>
              <div class="recent-meta">
                <span>{{ formatDate(gestion.createdAt) }}</span>
                <span class="badge-pill" :class="`state-${gestion.estado}`">{{ gestion.estado }}</span>
              </div>
            </article>
          </div>
          <p v-else class="muted">Todavía no hay ventas recientes.</p>
        </div>
      </section>

      <!-- FLOW (wizard active) -->
      <section v-else key="flow" class="flow anim-fade" ref="wizardRef">
        <div class="flow-banner">
          <div class="flow-banner__copy">
            <span class="eyebrow"><i class="fa-solid fa-circle-check" aria-hidden="true" /> Tipo elegido</span>
            <h3><i class="fa-solid fa-layer-group" aria-hidden="true" /> {{ selectedServiceLabel }}</h3>
            <p>Sigue: cliente, monto, reserva, soporte y resumen.</p>
          </div>
          <button class="service-secondary" @click="openTypeModal">
            <i class="fa-solid fa-rotate-left" aria-hidden="true" /> Cambiar tipo
          </button>
        </div>

        <div class="live-progress">
          <div class="panel-card">
            <div class="panel-head">
              <h3><i class="fa-solid fa-bullseye" aria-hidden="true" /> Completando ahora</h3>
              <span>{{ store.currentStep }} / {{ store.totalSteps }}</span>
            </div>
            <strong class="live-progress__step">{{ store.currentStepLabel }}</strong>
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: `${store.progressPercent}%` }"></div>
            </div>
          </div>
          <div class="live-progress__grid">
            <article
              v-for="item in liveChecklist"
              :key="item.label"
              class="live-progress__item"
              :class="`state-${item.state}`"
            >
              <span class="live-progress__label">{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </article>
          </div>
        </div>

        <div class="wizard-panel">
           <GestionCompraWizard />
         </div>
       </section>
    </div>

    <!-- RESUME MODAL (after reload restored a draft) -->
    <transition name="modal">
      <div v-if="showResumeModal" class="overlay" @click.self="resumeContinue">
        <div class="card leave-modal" role="dialog" aria-modal="true">
          <div class="leave-icon info"><i class="fa-solid fa-rotate-left" aria-hidden="true" /></div>
          <h2>Retomamos tu venta</h2>
          <p>Recuperamos una venta en progreso que no habías terminado. ¿Quieres continuar donde quedaste?</p>
          <div class="leave-actions">
            <button class="danger-action ghost" @click="resumeDiscard"><i class="fa-solid fa-trash-can" aria-hidden="true" /> Empezar de nuevo</button>
            <button class="primary-action" @click="resumeContinue"><i class="fa-solid fa-play" aria-hidden="true" /> Continuar</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- LEAVE WARNING MODAL -->
    <transition name="modal">
      <div v-if="showLeaveModal" class="overlay" @click.self="cancelLeave">
        <div class="card leave-modal" role="dialog" aria-modal="true">
          <div class="leave-icon"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true" /></div>
          <h2>¿Salir de la venta?</h2>
          <p>Tienes una venta en progreso. Si sales ahora <strong>se perderá el progreso</strong> que no hayas confirmado.</p>
          <div class="leave-actions">
            <button class="service-secondary" @click="cancelLeave"><i class="fa-solid fa-arrow-left" aria-hidden="true" /> Seguir aquí</button>
            <button class="danger-action" @click="confirmLeave"><i class="fa-solid fa-xmark" aria-hidden="true" /> Salir y descartar</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- TYPE SELECTION MODAL -->
    <transition name="modal">
      <div v-if="showTypeModal" class="overlay" @click.self="closeTypeModal">
          <div class="card type-modal" role="dialog" aria-modal="true">
            <div class="tm-head">
              <div>
                <span class="eyebrow"><i class="fa-solid fa-compass" aria-hidden="true" /> Paso 1</span>
                <h2>Elige el tipo de gestión</h2>
              </div>
              <button class="tm-close" @click="closeTypeModal" aria-label="Cerrar">
                <i class="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <div class="service-list">
              <button class="service-choice" @click="selectServiceType('compra_total')">
                <span class="service-choice__icon"><i class="fa-solid fa-cart-shopping" aria-hidden="true" /></span>
                <span class="service-choice__body">
                  <span class="service-choice__title">Compra total</span>
                  <span class="service-choice__desc">Nosotros compramos por el cliente y luego gestionamos el envío.</span>
                  <span class="service-choice__tag">Hay monto + foto/comprobante</span>
                </span>
                <i class="fa-solid fa-chevron-right service-choice__arrow" aria-hidden="true" />
              </button>

              <button class="service-choice" @click="selectServiceType('logistica')">
                <span class="service-choice__icon"><i class="fa-solid fa-truck-fast" aria-hidden="true" /></span>
                <span class="service-choice__body">
                  <span class="service-choice__title">Solo courier</span>
                  <span class="service-choice__desc">El cliente ya compró y solo manejamos el traslado.</span>
                  <span class="service-choice__tag">Ya está comprado</span>
                </span>
                <i class="fa-solid fa-chevron-right service-choice__arrow" aria-hidden="true" />
              </button>
            </div>
          </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRouter, type RouteLocationRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useGestionCompraFormStore } from '@/stores/gestion_compra_form.store'
import { gestionesCompraAPI, type GestionCompra, type GestionesStats } from '@/services/gestiones_compra.api'
import GestionCompraWizard from '@/views/shared/GestionCompraWizard/GestionCompraWizard.vue'

const auth = useAuthStore()
const router = useRouter()
const store = useGestionCompraFormStore()
const loadingSummary = ref(true)
const loadingRecent = ref(true)
const selectedServiceType = ref<'logistica' | 'compra_total' | ''>('')
const showTypeModal = ref(false)
const wizardRef = ref<HTMLElement | null>(null)
const stats = ref<GestionesStats>({ totalGestiones: 0, sumaValorTotal: 0, sumaComision: 0, sumaCostoVenta: 0, porEstado: {} })
const recentGestiones = ref<GestionCompra[]>([])
const asesorId = computed(() => auth.currentUser?.id || auth.currentUser?.userId || auth.currentUser?._id || '')
const selectedServiceLabel = computed(() =>
  selectedServiceType.value === 'logistica' ? 'Solo courier' : selectedServiceType.value === 'compra_total' ? 'Compra total' : 'Pendiente'
)

const liveChecklist = computed(() => [
  { label: 'Tipo de gestión', value: selectedServiceLabel.value, state: selectedServiceType.value ? 'done' : 'pending' },
  { label: 'Cliente', value: store.formData.contacto?.nombre || 'Pendiente', state: store.formData.contactoId ? 'done' : 'pending' },
  {
    label: 'Monto total',
    value: store.formData.valorTotal != null && store.formData.valorTotal !== ('' as any)
      ? `$${(Number(store.formData.valorTotal) || 0).toFixed(2)}`
      : 'Pendiente',
    state: store.formData.valorTotal != null && store.formData.valorTotal !== ('' as any) ? 'done' : 'pending',
  },
  {
    label: 'Reserva y cuenta',
    value: store.formData.cuentaBancaria ? `${store.formData.cuentaBancaria.banco} · ${store.formData.cuentaBancaria.numeroCuenta}` : 'Pendiente',
    state: store.formData.cuentaBancariaId ? 'done' : 'pending',
  },
  {
    label: 'Soporte / foto',
    value: store.formData.imagenCompraUrl
      ? 'Imagen cargada'
      : store.formData.comprobanteEstado === 'verificado' ? 'Verificado sin archivo' : 'Pendiente',
    state: store.formData.imagenCompraUrl || store.formData.comprobanteEstado === 'verificado' ? 'done' : 'pending',
  },
])

const pendingCount = computed(() => (stats.value.porEstado?.activa || 0) + (stats.value.porEstado?.borrador || 0))

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })
}

function openTypeModal() {
  showTypeModal.value = true
}
function closeTypeModal() {
  showTypeModal.value = false
}

function selectServiceType(type: 'logistica' | 'compra_total') {
  selectedServiceType.value = type
  store.init({
    adminMode: false,
    defaultAsesorId: asesorId.value,
    defaultAsesorNombre: auth.currentUser?.name ?? '',
    defaultServiceType: type,
  })
  showTypeModal.value = false
  nextTick(() => {
    wizardRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

// --- In-app leave confirmation (our own modal, not the browser alert) ---
const showLeaveModal = ref(false)
const confirmedLeave = ref(false)
let pendingTo: RouteLocationRaw | null = null

// --- Resume modal shown after a reload restored a draft ---
const showResumeModal = ref(false)

onBeforeRouteLeave((to) => {
  if (confirmedLeave.value || !store.hasProgress) return true
  pendingTo = to.fullPath
  showLeaveModal.value = true
  return false
})

function cancelLeave() {
  showLeaveModal.value = false
  pendingTo = null
}

function confirmLeave() {
  confirmedLeave.value = true
  store.reset()
  showLeaveModal.value = false
  if (pendingTo) router.push(pendingTo)
}

function freshStart() {
  store.init({
    adminMode: false,
    defaultAsesorId: asesorId.value,
    defaultAsesorNombre: auth.currentUser?.name ?? '',
    defaultServiceType: '',
  })
  selectedServiceType.value = ''
}

function resumeContinue() {
  showResumeModal.value = false
}

function resumeDiscard() {
  showResumeModal.value = false
  freshStart()
}

onMounted(() => {
  // Restore an in-progress draft if there is one; otherwise start fresh.
  // Ignore admin-mode drafts here (this is the asesor flow).
  const restored = store.loadDraft()
  if (restored && !store.isAdminMode && store.formData.serviceType) {
    selectedServiceType.value = store.formData.serviceType as 'logistica' | 'compra_total'
    // No browser alert on reload — we already restored; just confirm with our modal.
    showResumeModal.value = true
  } else {
    freshStart()
  }

  const now = new Date()
  Promise.all([
    gestionesCompraAPI.getStatsMensuales({ año: now.getFullYear(), mes: now.getMonth() + 1, asesorId: asesorId.value || undefined }),
    gestionesCompraAPI.list({ limit: 5, asesorId: asesorId.value || undefined }),
  ])
    .then(([statsResult, listResult]) => {
      stats.value = statsResult
      recentGestiones.value = listResult.gestiones
    })
    .catch(() => {})
    .finally(() => {
      loadingSummary.value = false
      loadingRecent.value = false
    })
})
</script>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.ventas-page { display: flex; flex-direction: column; gap: $space-6; }

/* HERO */
.hero {
  display: flex; justify-content: space-between; gap: $space-6; padding: $space-6;
  border-radius: 24px; border: 1px solid rgba($brand-orange, 0.14);
  background: linear-gradient(135deg, rgba($brand-orange, 0.12), rgba($ink-900, 0.95));
}
.hero-copy h1 { margin: 0 0 $space-2; font-size: 1.95rem; line-height: 1.08; }
.hero-copy p { margin: 0; max-width: 740px; color: $ink-300; line-height: 1.65; }
.eyebrow {
  display: inline-flex; align-items: center; gap: $space-2; margin-bottom: $space-2;
  color: $brand-orange; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
}
.hero-actions { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: flex-end; gap: $space-3; min-width: 280px; }
.primary-action {
  display: inline-flex; align-items: center; gap: $space-2; border: 1px solid rgba($brand-orange, 0.25);
  background: $brand-orange; color: $ink-1000; border-radius: 14px; padding: $space-3 $space-4; font-weight: 800; cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  &:hover { transform: translateY(-1px); box-shadow: 0 10px 30px rgba($brand-orange, 0.25); }
  &.lg { padding: $space-4 $space-5; font-size: 1rem; }
}
.ghost-link, .btn-back {
  display: inline-flex; align-items: center; gap: $space-2; color: $brand-orange; background: transparent;
  border: 1px solid rgba($brand-orange, 0.25); border-radius: 14px; padding: $space-3 $space-4; text-decoration: none; cursor: pointer;
}

/* KPIs */
.summary-strip { display: flex; flex-wrap: wrap; gap: $space-3; }
.summary-card {
  flex: 1 1 180px; background: $ink-900; border: 1px solid rgba($ink-500, 0.14); border-radius: 18px;
  padding: $space-5; display: flex; flex-direction: column; gap: $space-2;
}
.summary-card strong { font-size: 1.35rem; color: $fg-dark; }
.summary-label { display: inline-flex; align-items: center; gap: 8px; font-size: 0.72rem; color: $ink-400; text-transform: uppercase; letter-spacing: 0.06em; }
.summary-card.accent { border-color: rgba($brand-orange, 0.25); }
.summary-card.accent strong { color: $brand-orange; }
.summary-skeleton { flex: 1 1 180px; height: 92px; border-radius: 18px; background: $ink-700; animation: pulse 1.4s infinite; }

/* DASHBOARD */
.dashboard { display: flex; flex-wrap: wrap; gap: $space-5; align-items: stretch; }
.cta-card {
  flex: 2 1 360px; display: flex; flex-direction: column; gap: $space-4; justify-content: center;
  padding: $space-6; border-radius: 24px; border: 1px dashed rgba($brand-orange, 0.35);
  background: linear-gradient(180deg, rgba($ink-900, 0.96), rgba($ink-1000, 0.96));
}
.cta-icon {
  width: 56px; height: 56px; border-radius: 16px; background: rgba($brand-orange, 0.12); color: $brand-orange;
  display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
}
.cta-copy h2 { margin: 0 0 $space-2; font-size: 1.5rem; color: $fg-dark; }
.cta-copy p { margin: 0; color: $ink-300; line-height: 1.6; max-width: 520px; }
.cta-card .primary-action { align-self: flex-start; }
.recent-panel { flex: 1 1 320px; }

/* FLOW */
.flow { display: flex; flex-direction: column; gap: $space-5; }
.flow-banner {
  display: flex; align-items: center; justify-content: space-between; gap: $space-4;
  padding: $space-5 $space-6; border-radius: 20px; border: 1px solid rgba($brand-orange, 0.16); background: rgba($brand-orange, 0.06);
}
.flow-banner__copy h3 { display: flex; align-items: center; gap: $space-2; margin: 0 0 4px; font-size: 1.15rem; }
.flow-banner__copy p { margin: 0; color: $ink-300; }
.service-secondary {
  display: inline-flex; align-items: center; gap: $space-2; border: 1px solid rgba($brand-orange, 0.22);
  background: transparent; color: $brand-orange; border-radius: 14px; padding: $space-3 $space-4; cursor: pointer; white-space: nowrap;
}

/* LIVE PROGRESS */
.live-progress { display: flex; flex-direction: column; gap: $space-4; }
.live-progress__step { display: block; margin-bottom: $space-2; font-size: 1.05rem; color: $brand-orange; }
.progress-track { height: 4px; background: $ink-700; border-radius: 999px; overflow: hidden; }
.progress-fill { height: 100%; background: $brand-orange; border-radius: 999px; transition: width 0.25s ease; }
.live-progress__grid { display: flex; flex-wrap: wrap; gap: $space-3; }
.live-progress__item {
  flex: 1 1 200px; background: $ink-900; border: 1px solid rgba($ink-500, 0.14); border-radius: 18px;
  padding: $space-4 $space-5; display: flex; flex-direction: column; gap: $space-1;
}
.live-progress__item strong { color: $fg-dark; font-size: 0.9rem; word-break: break-word; }
.live-progress__label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: $ink-400; }
.state-done { border-color: rgba(43,187,146,0.25); }
.state-pending { opacity: 0.85; }
.wizard-panel { width: 100%; }

/* PANEL / RECENT */
.panel-card {
  background: $ink-900; border: 1px solid rgba($ink-500, 0.14); border-radius: 20px;
  padding: $space-6; display: flex; flex-direction: column; gap: $space-4;
}
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: $space-3; }
.panel-head h3 { display: flex; align-items: center; gap: $space-2; margin: 0; font-size: 1rem; }
.panel-head span { color: $ink-400; font-size: 0.82rem; }
.recent-list { display: flex; flex-direction: column; gap: $space-2; }
.recent-item {
  display: flex; align-items: center; justify-content: space-between; gap: $space-3;
  padding: $space-3 $space-4; border-radius: 12px; background: $ink-1000; border: 1px solid rgba($ink-500, 0.12);
}
.recent-main { display: flex; flex-direction: column; gap: 2px; }
.recent-item strong { font-size: 0.9rem; }
.recent-item span { color: $ink-400; font-size: 0.78rem; }
.recent-meta { display: flex; align-items: center; gap: $space-2; }
.recent-skeleton { height: 56px; border-radius: 12px; background: $ink-700; animation: pulse 1.4s infinite; }
.muted { color: $ink-400; }
.badge-pill { display: inline-flex; padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
.state-activa, .state-completado { background: rgba(43,187,146,0.15); color: $signal-green; }
.state-borrador { background: rgba(111,111,122,0.18); color: $ink-300; }
.state-cancelado { background: rgba(229,72,77,0.15); color: $signal-red; }

/* TYPE MODAL */
.overlay {
  position: fixed; inset: 0; z-index: 120; background: rgba($ink-1000, 0.82); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; padding: $space-4;
}
.type-modal {
  width: min(560px, 100%); background: linear-gradient(180deg, rgba($ink-900, 0.98), rgba($ink-1000, 0.98));
  border: 1px solid rgba($brand-orange, 0.18); border-radius: 24px; padding: $space-6;
  display: flex; flex-direction: column; gap: $space-5; box-shadow: 0 30px 80px rgba(0,0,0,0.5);
}
.tm-head { display: flex; align-items: flex-start; justify-content: space-between; gap: $space-4; }
.tm-head h2 { margin: 0; font-size: 1.4rem; color: $fg-dark; }
.tm-close { background: transparent; border: 1px solid rgba($brand-orange, 0.25); color: $brand-orange; border-radius: 12px; padding: $space-2 $space-3; cursor: pointer; }
.service-list { display: flex; flex-direction: column; gap: $space-3; }
.service-choice {
  display: flex; align-items: center; gap: $space-4; text-align: left; padding: $space-4 $space-5;
  border-radius: 18px; border: 2px solid $ink-500; background: $ink-900; color: $fg-dark; cursor: pointer; transition: all 0.16s;
  &:hover { border-color: $brand-orange; transform: translateY(-1px); }
}
.service-choice__icon {
  flex: 0 0 auto; width: 46px; height: 46px; border-radius: 12px; background: rgba($brand-orange, 0.12);
  color: $brand-orange; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
}
.service-choice__body { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.service-choice__title { font-weight: 800; font-size: 1rem; }
.service-choice__desc { color: $ink-300; font-size: 0.85rem; line-height: 1.45; }
.service-choice__tag {
  align-self: flex-start; margin-top: 4px; font-size: 0.7rem; font-weight: 700; color: $brand-orange;
  background: rgba(240, 138, 31, 0.12); border-radius: 999px; padding: 3px 10px;
}
.service-choice__arrow { color: $ink-400; }

/* LEAVE MODAL */
.leave-modal {
  width: min(460px, 100%); background: linear-gradient(180deg, rgba($ink-900, 0.98), rgba($ink-1000, 0.98));
  border: 1px solid rgba($brand-orange, 0.2); border-radius: 24px; padding: $space-6;
  display: flex; flex-direction: column; align-items: center; text-align: center; gap: $space-3;
  box-shadow: 0 30px 80px rgba(0,0,0,0.5);
}
.leave-icon {
  width: 56px; height: 56px; border-radius: 50%; background: rgba($brand-orange, 0.14); color: $brand-orange;
  display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
  &.info { background: rgba($signal-blue, 0.14); color: $signal-blue; }
}
.leave-modal h2 { margin: 0; font-size: 1.3rem; color: $fg-dark; }
.leave-modal p { margin: 0; color: $ink-300; line-height: 1.55; }
.leave-actions { display: flex; flex-wrap: wrap; gap: $space-3; justify-content: center; margin-top: $space-2; }
.danger-action {
  display: inline-flex; align-items: center; gap: $space-2; border: 1px solid rgba($signal-red, 0.4);
  background: rgba($signal-red, 0.12); color: $signal-red; border-radius: 14px; padding: $space-3 $space-4; font-weight: 700; cursor: pointer;
  &:hover { background: rgba($signal-red, 0.2); }
  &.ghost { background: transparent; border-color: rgba($ink-500, 0.5); color: $ink-300; &:hover { background: rgba($ink-500, 0.12); color: $fg-dark; } }
}

/* TRANSITIONS */
.flow-swap { display: flex; flex-direction: column; }
.anim-fade { animation: fadeInUp 0.24s ease; }
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Unified modal transition — animates backdrop AND card, on enter and exit */
.modal-enter-active, .modal-leave-active { transition: opacity 0.22s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .card, .modal-leave-active .card { transition: transform 0.26s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease; }
.modal-enter-from .card, .modal-leave-to .card { transform: translateY(22px) scale(0.95); opacity: 0; }

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }

@media (max-width: 980px) {
  .hero { flex-direction: column; }
  .hero-actions { align-items: flex-start; justify-content: flex-start; min-width: 0; }
  .summary-strip { flex-direction: column; }
  .dashboard { flex-direction: column; }
  .flow-banner { flex-direction: column; align-items: flex-start; }
  .live-progress__grid { flex-direction: column; }
}
</style>
