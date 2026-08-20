<script setup lang="ts">
/** Cash ledger: income, expenses, the running balance and their movements. */
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppDatePicker from '@/components/ui/AppDatePicker.vue'
import AppConfirmModal from '@/components/ui/AppConfirmModal.vue'
import type { CajaMovimiento } from './caja.utils'
import CajaResumen from './Caja/CajaResumen.vue'
import CajaMovimientos from './Caja/CajaMovimientos.vue'
import CajaMovimientoModal from './Caja/CajaMovimientoModal.vue'
import CrearContactoModal from './Caja/CrearContactoModal.vue'
import { CATEGORIAS_EGRESO, CATEGORIAS_INGRESO, useCaja, type CajaForm } from './Caja/useCaja'
import type { ClienteResult, NuevoContactoForm } from './Caja/useClienteSearch'

const router = useRouter()
const caja = useCaja()

const movimientoModal = ref<InstanceType<typeof CajaMovimientoModal> | null>(null)
const showMovimientoModal = ref(false)

const showContactoModal = ref(false)
const nombreSugerido = ref('')
const creandoContacto = ref(false)

const deleteTarget = ref<CajaMovimiento | null>(null)

const tipoOptions = [
  { value: '', label: 'Todos' },
  { value: 'ingreso', label: 'Ingreso' },
  { value: 'egreso', label: 'Egreso' },
]

const categoriaOptions = [
  { value: '', label: 'Todas' },
  ...CATEGORIAS_INGRESO.map((item) => ({ value: item, label: item })),
  ...CATEGORIAS_EGRESO.map((item) => ({ value: item, label: item })),
]

async function onSave(form: CajaForm, cliente: ClienteResult | null, comprobante: File | null, idempotencyKey: string) {
  const saved = await caja.save({
    form,
    clienteEmail: cliente?.clientEmail,
    clientePhone: cliente?.clientPhone,
    comprobante,
    idempotencyKey,
  })
  if (saved) showMovimientoModal.value = false
}

function openCrearContacto(sugerido: string) {
  nombreSugerido.value = sugerido.trim()
  showContactoModal.value = true
}

async function onCrearContacto(form: NuevoContactoForm) {
  creandoContacto.value = true
  const created = await movimientoModal.value?.crearContacto(form)
  creandoContacto.value = false
  if (created) showContactoModal.value = false
}

function goToContactos() {
  showContactoModal.value = false
  router.push('/admin/contactos')
}

function requestDelete(movimiento: CajaMovimiento) {
  const blocked = caja.deletionBlockedReason(movimiento)
  if (blocked) {
    caja.notify(blocked, 'error')
    return
  }
  deleteTarget.value = movimiento
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  if (await caja.remove(deleteTarget.value)) deleteTarget.value = null
}

watch([caja.filtroTipo, caja.filtroCategoria, caja.filtroDesde, caja.filtroHasta], caja.load)

onMounted(caja.load)
</script>

<template>
  <div class="page-shell">
    <div class="page-header caja-header">
      <div>
        <h2 class="page-title">Caja</h2>
        <p class="page-subtitle">Control claro de ingresos, egresos y balance operativo</p>
      </div>
      <button class="btn-primary" type="button" @click="showMovimientoModal = true">
        <i class="fa-solid fa-plus" /> Nuevo movimiento
      </button>
    </div>

    <CajaResumen :resumen="caja.resumen.value" />

    <section class="panel filters-panel">
      <div class="section-head">
        <h3>Filtros</h3>
        <p>Filtra la caja por tipo, categoría y rango de fechas.</p>
      </div>
      <AppSelect v-model="caja.filtroTipo.value" :options="tipoOptions" label="Tipo" />
      <AppSelect v-model="caja.filtroCategoria.value" :options="categoriaOptions" label="Categoría" />
      <AppDatePicker v-model="caja.filtroDesde.value" label="Desde" />
      <AppDatePicker v-model="caja.filtroHasta.value" label="Hasta" />
    </section>

    <CajaMovimientos
      :movimientos="caja.movimientosFiltrados.value"
      :loading="caja.loading.value"
      @remove="requestDelete"
    />

    <CajaMovimientoModal
      ref="movimientoModal"
      :open="showMovimientoModal"
      :saving="caja.saving.value"
      @close="showMovimientoModal = false"
      @save="onSave"
      @crear-contacto="openCrearContacto"
      @ir-a-contactos="goToContactos"
    />

    <CrearContactoModal
      :open="showContactoModal"
      :saving="creandoContacto"
      :nombre-sugerido="nombreSugerido"
      @close="showContactoModal = false"
      @submit="onCrearContacto"
    />

    <AppConfirmModal
      :open="!!deleteTarget"
      title="Eliminar movimiento"
      message="¿Eliminar este movimiento? Esta acción no se puede deshacer."
      confirm-label="Eliminar"
      variant="danger"
      @cancel="deleteTarget = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/space' as *;
@use './Caja/caja-ui' as ui;

@include ui.panel;
@include ui.buttons;

.page-shell {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.caja-header {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: $space-4;
  flex-wrap: wrap;

  @media (max-width: 640px) { align-items: stretch; }
}

.filters-panel {
  display: grid;
  gap: $space-4;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}
</style>
