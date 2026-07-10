<template>
  <div class="ventas-page">
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow"><i class="fa-solid fa-bag-shopping" aria-hidden="true" /> Ventas del asesor</span>
        <h1>Registra la venta, cobra la reserva y deja el historial listo para el cliente.</h1>
        <p>
          Este flujo conecta cliente, asesor, cuenta de pago, comprobante de compra y notificación automática con imagen y términos.
        </p>
      </div>
      <div class="hero-actions">
        <button class="primary-action" @click="scrollToStart"><i class="fa-solid fa-plus" aria-hidden="true" /> Nueva venta</button>
        <router-link to="/asesor/gestiones-compra" class="ghost-link"><i class="fa-solid fa-clock-rotate-left" aria-hidden="true" /> Ver historial</router-link>
        <button class="btn-back" @click="$router.back()"><i class="fa-solid fa-arrow-left" aria-hidden="true" /> Volver</button>
      </div>
    </section>

    <section class="summary-strip" v-if="!loadingSummary">
      <article class="summary-card accent">
        <span class="summary-label">Ventas del mes</span>
        <strong>{{ stats.totalGestiones }}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label">Total gestionado</span>
        <strong>${{ stats.sumaValorTotal.toFixed(2) }}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label">Comisiones</span>
        <strong>${{ stats.sumaComision.toFixed(2) }}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label">Pendientes</span>
        <strong>{{ pendingCount }}</strong>
      </article>
    </section>

    <section v-else class="summary-strip skeletons">
      <div v-for="i in 4" :key="i" class="summary-skeleton" />
    </section>

    <section v-if="!selectedServiceType" id="flow-start" ref="startRef" class="flow-start">
      <div class="flow-start__copy">
        <span class="eyebrow"><i class="fa-solid fa-compass" aria-hidden="true" /> Paso 1</span>
        <h2>Primero elige el tipo de gestión</h2>
        <p>Después de esto aparece el formulario del cliente y el resto del proceso. No te deja saltar este paso.</p>
      </div>

      <div class="service-grid start-grid">
        <button class="service-choice" @click="selectServiceType('compra_total')">
          <i class="fa-solid fa-cart-shopping service-choice__icon" aria-hidden="true" />
          <span class="service-choice__title">Compra total</span>
          <span class="service-choice__desc">Nosotros compramos por el cliente y luego gestionamos el envío.</span>
          <span class="service-choice__tag">Hay monto + foto/comprobante</span>
        </button>

        <button class="service-choice" @click="selectServiceType('logistica')">
          <i class="fa-solid fa-truck-fast service-choice__icon" aria-hidden="true" />
          <span class="service-choice__title">Solo courier</span>
          <span class="service-choice__desc">El cliente ya compró y solo manejamos el traslado.</span>
          <span class="service-choice__tag">Ya está comprado</span>
        </button>
      </div>
    </section>

    <template v-else>
      <section class="flow-banner">
        <div>
          <span class="eyebrow"><i class="fa-solid fa-circle-check" aria-hidden="true" /> Paso 1 completado</span>
          <h3><i class="fa-solid fa-layer-group" aria-hidden="true" /> {{ selectedServiceLabel }}</h3>
          <p>Ahora sigue: cliente, monto, reserva, soporte y resumen.</p>
        </div>
        <button class="service-secondary" @click="changeServiceType"><i class="fa-solid fa-rotate-left" aria-hidden="true" /> Cambiar tipo</button>
      </section>

      <section class="guidance-strip">
        <article class="guidance-card">
          <span class="guidance-label"><i class="fa-solid fa-dollar-sign" aria-hidden="true" /> Monto</span>
          <strong>Se define en el paso de valor total</strong>
        </article>
        <article class="guidance-card">
          <span class="guidance-label"><i class="fa-solid fa-paperclip" aria-hidden="true" /> Soporte</span>
          <strong>Sube foto, comprobante o marca verificado</strong>
        </article>
        <article class="guidance-card">
          <span class="guidance-label"><i class="fa-solid fa-sitemap" aria-hidden="true" /> Tipo</span>
          <strong>{{ selectedServiceLabel }}</strong>
        </article>
      </section>

      <section class="live-progress">
        <div class="panel-card live-progress__current">
          <div class="panel-head">
            <h3><i class="fa-solid fa-bullseye" aria-hidden="true" /> Qué estás completando ahora</h3>
            <span>{{ store.currentStep }} / {{ store.totalSteps }}</span>
          </div>
          <strong class="live-progress__step">{{ store.currentStepLabel }}</strong>
          <p class="live-progress__hint">Este es el dato que toca completar en este momento.</p>
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
      </section>

      <div class="layout-grid">
        <section class="wizard-panel">
          <GestionCompraWizard />
        </section>

        <aside class="side-panel">
          <section class="panel-card">
            <div class="panel-head">
              <h3><i class="fa-solid fa-list-check" aria-hidden="true" /> Flujo</h3>
              <span>11 pasos</span>
            </div>
            <ol class="flow-list">
              <li>Selecciona o crea el cliente</li>
              <li>Elige asesor y calcula comisión</li>
              <li>Define reserva, comprobante e imagen</li>
              <li>Se envía email automático al cliente</li>
              <li>Admin recibe la compra pendiente</li>
            </ol>
          </section>

          <section class="panel-card">
            <div class="panel-head">
              <h3><i class="fa-solid fa-clock-rotate-left" aria-hidden="true" /> Ventas recientes</h3>
              <span>{{ recentGestiones.length }}</span>
            </div>

            <div v-if="loadingRecent" class="recent-skeletons">
              <div v-for="i in 3" :key="i" class="recent-skeleton" />
            </div>

            <div v-else-if="recentGestiones.length" class="recent-list">
              <article v-for="gestion in recentGestiones" :key="gestion._id" class="recent-item">
                <div>
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
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useGestionCompraFormStore } from '@/stores/gestion_compra_form.store'
import { gestionesCompraAPI, type GestionCompra, type GestionesStats } from '@/services/gestiones_compra.api'
import GestionCompraWizard from '@/views/shared/GestionCompraWizard/GestionCompraWizard.vue'

const auth = useAuthStore()
const store = useGestionCompraFormStore()
const loadingSummary = ref(true)
const loadingRecent = ref(true)
const selectedServiceType = ref<'logistica' | 'compra_total' | ''>('')
const startRef = ref<HTMLElement | null>(null)
const stats = ref<GestionesStats>({ totalGestiones: 0, sumaValorTotal: 0, sumaComision: 0, sumaCostoVenta: 0, porEstado: {} })
const recentGestiones = ref<GestionCompra[]>([])
const asesorId = computed(() => auth.currentUser?.id || auth.currentUser?.userId || auth.currentUser?._id || '')
const selectedServiceLabel = computed(() =>
  selectedServiceType.value === 'logistica' ? 'Solo courier' : selectedServiceType.value === 'compra_total' ? 'Compra total' : 'Pendiente'
)

const liveChecklist = computed(() => [
  {
    label: 'Tipo de gestión',
    value: selectedServiceLabel.value,
    state: selectedServiceType.value ? 'done' : 'pending',
  },
  {
    label: 'Cliente',
    value: store.formData.contacto?.nombre || 'Pendiente',
    state: store.formData.contactoId ? 'done' : 'pending',
  },
  {
    label: 'Monto total',
    value: store.formData.valorTotal != null ? `$${store.formData.valorTotal.toFixed(2)}` : 'Pendiente',
    state: store.formData.valorTotal != null ? 'done' : 'pending',
  },
  {
    label: 'Reserva y cuenta',
    value: store.formData.cuentaBancaria
      ? `${store.formData.cuentaBancaria.banco} · ${store.formData.cuentaBancaria.numeroCuenta}`
      : 'Pendiente',
    state: store.formData.cuentaBancariaId ? 'done' : 'pending',
  },
  {
    label: 'Soporte / foto',
    value: store.formData.imagenCompraUrl
      ? 'Imagen cargada'
      : store.formData.comprobanteEstado === 'verificado'
        ? 'Verificado sin archivo'
        : 'Pendiente',
    state: store.formData.imagenCompraUrl || store.formData.comprobanteEstado === 'verificado' ? 'done' : 'pending',
  },
])

const pendingCount = computed(() => {
  return (stats.value.porEstado?.activa || 0) + (stats.value.porEstado?.borrador || 0)
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })
}

function selectServiceType(type: 'logistica' | 'compra_total') {
  selectedServiceType.value = type
  store.init({
    adminMode: false,
    defaultAsesorId: asesorId.value,
    defaultAsesorNombre: auth.currentUser?.name ?? '',
    defaultServiceType: type,
  })
}

function scrollToStart() {
  startRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function changeServiceType() {
  selectedServiceType.value = ''
  store.init({
    adminMode: false,
    defaultAsesorId: asesorId.value,
    defaultAsesorNombre: auth.currentUser?.name ?? '',
    defaultServiceType: '',
  })
}

onMounted(() => {
  store.init({
    adminMode: false,
    defaultAsesorId: asesorId.value,
    defaultAsesorNombre: auth.currentUser?.name ?? '',
    defaultServiceType: '',
  })

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

.ventas-page {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: $space-6;
  padding: $space-6;
  border-radius: 24px;
  border: 1px solid rgba($brand-orange, 0.14);
  background: linear-gradient(135deg, rgba($brand-orange, 0.12), rgba($ink-900, 0.95));
}

.hero-copy h1 {
  margin: 0 0 $space-2;
  font-size: 1.95rem;
  line-height: 1.08;
}

.hero-copy p {
  margin: 0;
  max-width: 740px;
  color: $ink-300;
  line-height: 1.65;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: $space-2;
  color: $brand-orange;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: flex-end;
  gap: $space-3;
  min-width: 280px;
}

.primary-action {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  border: 1px solid rgba($brand-orange, 0.25);
  background: $brand-orange;
  color: $ink-1000;
  border-radius: 14px;
  padding: $space-3 $space-4;
  font-weight: 800;
  cursor: pointer;
}

.flow-start {
  display: flex;
  flex-direction: column;
  gap: $space-5;
  padding: $space-6;
  border: 1px solid rgba($brand-orange, 0.16);
  border-radius: 24px;
  background: linear-gradient(180deg, rgba($ink-900, 0.96), rgba($ink-1000, 0.96));
}
.flow-start__copy h2 {
  margin: 0 0 $space-2;
  font-size: 1.6rem;
}
.flow-start__copy p {
  margin: 0;
  color: $ink-300;
  line-height: 1.65;
}
.flow-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;
  padding: $space-5 $space-6;
  border-radius: 20px;
  border: 1px solid rgba($brand-orange, 0.16);
  background: rgba($brand-orange, 0.06);
}
.flow-banner h3 { display: flex; align-items: center; gap: $space-2; margin: 0 0 4px; font-size: 1.15rem; }
.flow-banner p { margin: 0; color: $ink-300; }
.service-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $space-4;
}
.service-choice {
  flex: 1 1 280px;
  display: flex;
  flex-direction: column;
  gap: $space-3;
  text-align: left;
  padding: $space-5;
  border-radius: 20px;
  border: 2px solid $ink-500;
  background: $ink-900;
  color: $fg-dark;
  cursor: pointer;
  transition: all 0.18s;
  &:hover { border-color: $brand-orange; transform: translateY(-1px); }
}
.service-choice__icon {
  color: $brand-orange;
  font-size: 1.05rem;
}
.service-choice__title { font-weight: 800; font-size: 1rem; }
.service-choice__desc { color: $ink-300; font-size: 0.88rem; line-height: 1.45; }
.service-choice__tag {
  align-self: flex-start;
  margin-top: $space-1;
  font-size: 0.72rem;
  font-weight: 700;
  color: $brand-orange;
  background: rgba(240, 138, 31, 0.12);
  border-radius: 999px;
  padding: 4px 10px;
}
.service-secondary {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  border: 1px solid rgba($brand-orange, 0.22);
  background: transparent;
  color: $brand-orange;
  border-radius: 14px;
  padding: $space-3 $space-4;
  cursor: pointer;
}

.guidance-strip {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
}
.guidance-card {
  flex: 1 1 220px;
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.14);
  border-radius: 18px;
  padding: $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}
.guidance-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: $ink-400;
}
.guidance-card strong {
  color: $fg-dark;
  font-size: 0.95rem;
}

.live-progress {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}
.live-progress__current {
  min-height: 100%;
}
.live-progress__step {
  display: block;
  margin-bottom: $space-1;
  font-size: 1.05rem;
  color: $brand-orange;
}
.live-progress__hint {
  margin: 0 0 $space-3;
  color: $ink-300;
  font-size: 0.88rem;
}
.progress-track {
  height: 4px;
  background: $ink-700;
  border-radius: 999px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: $brand-orange;
  border-radius: 999px;
  transition: width 0.25s ease;
}
.live-progress__grid {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
}
.live-progress__item {
  flex: 1 1 220px;
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.14);
  border-radius: 18px;
  padding: $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-1;
}
.live-progress__item strong {
  color: $fg-dark;
  font-size: 0.9rem;
  word-break: break-word;
}
.live-progress__label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: $ink-400;
}
.state-done { border-color: rgba(43,187,146,0.2); }
.state-pending { opacity: 0.85; }

.ghost-link, .btn-back {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  color: $brand-orange;
  background: transparent;
  border: 1px solid rgba($brand-orange, 0.25);
  border-radius: 14px;
  padding: $space-3 $space-4;
  text-decoration: none;
  cursor: pointer;
}

.summary-strip {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
}

.summary-card {
  flex: 1 1 180px;
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.14);
  border-radius: 18px;
  padding: $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.summary-card strong { font-size: 1.35rem; color: $fg-dark; }
.summary-label { display: inline-flex; align-items: center; gap: 8px; font-size: 0.72rem; color: $ink-400; text-transform: uppercase; letter-spacing: 0.06em; }
.summary-card.accent { border-color: rgba($brand-orange, 0.25); }
.summary-card.accent strong { color: $brand-orange; }

.skeletons .summary-skeleton,
.recent-skeleton {
  height: 90px;
  border-radius: 16px;
  background: $ink-700;
  animation: pulse 1.4s infinite;
}

.layout-grid {
  display: flex;
  flex-direction: column;
  gap: $space-6;
  align-items: start;
}

.wizard-panel, .side-panel { min-width: 0; width: 100%; }

.side-panel {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.panel-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.14);
  border-radius: 20px;
  padding: $space-6;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.panel-card + .panel-card { margin-top: $space-4; }

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
}

.panel-head h3 { display: flex; align-items: center; gap: $space-2; margin: 0; font-size: 1rem; }
.panel-head span { color: $ink-400; font-size: 0.82rem; }

.flow-list {
  margin: 0;
  padding-left: $space-4;
  color: $ink-300;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.recent-list { display: flex; flex-direction: column; gap: $space-2; }
.recent-item {
  display: flex; align-items: center; justify-content: space-between; gap: $space-3;
  padding: $space-3 $space-4; border-radius: 12px; background: $ink-1000;
  border: 1px solid rgba($ink-500, 0.12);
}
.recent-item strong { display: block; font-size: 0.9rem; }
.recent-item span { color: $ink-400; font-size: 0.78rem; }
.recent-meta { display: flex; align-items: center; gap: $space-2; }
.muted { color: $ink-400; }
.badge-pill {
  display: inline-flex; padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700;
}

.state-activa, .state-completado { background: rgba(43,187,146,0.15); color: $signal-green; }
.state-borrador { background: rgba(111,111,122,0.18); color: $ink-300; }
.state-cancelado { background: rgba(229,72,77,0.15); color: $signal-red; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}

@media (max-width: 980px) {
  .layout-grid, .summary-strip, .hero { display: flex; flex-direction: column; }
  .hero-actions { align-items: flex-start; justify-content: flex-start; min-width: 0; }
  .service-grid, .guidance-strip { display: flex; flex-direction: column; }
  .flow-banner { flex-direction: column; align-items: flex-start; }
  .live-progress { flex-direction: column; }
  .live-progress__grid { display: flex; flex-direction: column; }
}

@media (max-width: 640px) {
  .service-modal-actions { flex-direction: column; }
  .summary-strip { flex-direction: column; }
}
</style>
