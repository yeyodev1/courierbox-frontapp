<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppConfirmModal from '@/components/ui/AppConfirmModal.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { costosApi } from '@/services/costos.api'
import { proveedoresApi, type Proveedor } from '@/services/proveedores.api'
import { useToastStore } from '@/stores/toast.store'

import ProveedorCard from './Proveedores/components/ProveedorCard.vue'
import ProveedorFormModal from './Proveedores/components/ProveedorFormModal.vue'

function normalizeType(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

const router = useRouter()
const toastStore = useToastStore()
const pageLoading = ref(true)
const loading = ref(false)
const search = ref('')
const selectedType = ref('all')
const selectedStatus = ref('all')
const selectedCountry = ref('all')
const proveedores = ref<Proveedor[]>([])
const showModal = ref(false)
const selectedProveedor = ref<Proveedor | null>(null)
const providerTypes = ref<string[]>([])
const defaultProviderTypes = ref<string[]>([])
const gastoResumen = ref({ thisMonth: 0, historic: 0, providers: 0 })
const gastoByProvider = ref<Record<string, { mes: number; historic: number }>>({})
const pendingRemoval = ref<null | { kind: 'type' | 'provider'; value: string; title: string; message: string; confirmLabel: string }>(null)

const providerCount = computed(() => proveedores.value.length)
const filteredCount = computed(() => filtered.value.length)

const typeOptions = computed(() => {
  const items = new Set<string>()
  for (const type of providerTypes.value.length ? providerTypes.value : proveedores.value.map((p) => p.tipo || 'General')) {
    items.add(type || 'General')
  }
  return Array.from(items).sort((a, b) => a.localeCompare(b))
})

const countryOptions = computed(() => {
  const items = new Set<string>()
  for (const p of proveedores.value) {
    if (p.pais) items.add(p.pais)
  }
  return Array.from(items).sort((a, b) => a.localeCompare(b))
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return proveedores.value.filter((p) => {
    const matchesQuery = !q || [p.nombre, p.tipo, p.pais, p.ciudad, p.contacto, p.email]
      .filter(Boolean)
      .some((v) => v.toLowerCase().includes(q))
    const matchesType = selectedType.value === 'all' || (p.tipo || 'General') === selectedType.value
    const matchesStatus = selectedStatus.value === 'all'
      || (selectedStatus.value === 'active' && p.activo)
      || (selectedStatus.value === 'inactive' && !p.activo)
    const matchesCountry = selectedCountry.value === 'all' || (p.pais || '') === selectedCountry.value

    return matchesQuery && matchesType && matchesStatus && matchesCountry
  })
})

const activeCount = computed(() => proveedores.value.filter((p) => p.activo).length)
const typeCount = computed(() => new Set(proveedores.value.map((p) => p.tipo || 'General')).size)
const typeUsage = computed(() => {
  const counts: Record<string, number> = {}
  for (const p of proveedores.value) {
    const key = normalizeType(p.tipo || 'Sin tipo')
    counts[key] = (counts[key] || 0) + 1
  }
  return counts
})

function formatCurrency(value: number) {
  return '$' + Number(value || 0).toFixed(2)
}

function normalizeKey(value: string) {
  return String(value || '').trim().toLowerCase()
}

function firstDayOfMonth() {
  const date = new Date()
  date.setDate(1)
  date.setHours(0, 0, 0, 0)
  return date.toISOString().slice(0, 10)
}

function buildProviderCostMap(hist: any[] = [], month: any[] = []) {
  const map: Record<string, { mes: number; historic: number }> = {}
  for (const item of hist) {
    const key = normalizeKey(item._id)
    map[key] = map[key] || { mes: 0, historic: 0 }
    map[key].historic = Number(item.total || 0)
  }
  for (const item of month) {
    const key = normalizeKey(item._id)
    map[key] = map[key] || { mes: 0, historic: 0 }
    map[key].mes = Number(item.total || 0)
  }
  return map
}

const providerCards = computed(() => filtered.value.map((p) => ({
  proveedor: p,
  gasto: gastoByProvider.value[normalizeKey(p.nombre)] || { mes: 0, historic: 0 },
})))

function resetFilters() {
  search.value = ''
  selectedType.value = 'all'
  selectedStatus.value = 'all'
  selectedCountry.value = 'all'
}

async function loadProviderTypes() {
  const data = await proveedoresApi.listTypes()
  defaultProviderTypes.value = data.defaultTypes
  providerTypes.value = data.providerTypes
}

async function loadExpenseSummary() {
  const [historic, month] = await Promise.all([
    costosApi.resumen({ desde: '1970-01-01' }),
    costosApi.resumen({ desde: firstDayOfMonth() }),
  ])
  gastoResumen.value = {
    thisMonth: Number(month.resumen.total?.total || 0),
    historic: Number(historic.resumen.total?.total || 0),
    providers: Number(historic.resumen.porProveedor?.length || 0),
  }
  gastoByProvider.value = buildProviderCostMap(historic.resumen.porProveedor || [], month.resumen.porProveedor || [])
}

async function loadProviders() {
  loading.value = true
  try {
    const data = await proveedoresApi.list({ limit: 200 })
    proveedores.value = data.proveedores
  } catch (e: any) {
    toastStore.showNotification(e.message || 'Error al cargar proveedores', 'error')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  selectedProveedor.value = null
  showModal.value = true
}

function openEdit(p: Proveedor) {
  selectedProveedor.value = p
  showModal.value = true
}

function goToCosts(p: Proveedor) {
  router.push({ name: 'AdminCostos', query: { proveedor: p.nombre } })
}

async function saveProveedor(payload: Partial<Proveedor>) {
  if (!payload.nombre?.trim()) {
    toastStore.showNotification('El nombre es obligatorio', 'error')
    return
  }

  try {
    if (selectedProveedor.value) {
      await proveedoresApi.update(selectedProveedor.value._id, payload)
    } else {
      await proveedoresApi.create(payload as any)
    }
    showModal.value = false
    selectedProveedor.value = null
    await loadProviders()
  } catch (e: any) {
    toastStore.showNotification(e.message || 'No se pudo guardar', 'error')
  }
}

async function handleAddType(type: string) {
  await proveedoresApi.addType(type)
  await loadProviderTypes()
}

async function toggleActivo(p: Proveedor) {
  try {
    await proveedoresApi.update(p._id, { activo: !p.activo })
    await loadProviders()
  } catch (e: any) {
    toastStore.showNotification(e.message || 'No se pudo actualizar', 'error')
  }
}

function handleDeleteType(type: string) {
  const normalized = normalizeType(type)
  const count = typeUsage.value[normalized] || 0
  if (count > 0) {
    toastStore.showNotification(`No puedes eliminar "${type}" porque ya está asignado a ${count} proveedor${count > 1 ? 'es' : ''}.`, 'error')
    return
  }
  pendingRemoval.value = {
    kind: 'type',
    value: type,
    title: 'Eliminar tipo de proveedor',
    message: `¿Eliminar el tipo "${type}"?`,
    confirmLabel: 'Eliminar tipo',
  }
}

function removeProvider(p: Proveedor) {
  pendingRemoval.value = {
    kind: 'provider',
    value: p._id,
    title: 'Eliminar proveedor',
    message: `¿Eliminar a ${p.nombre}?`,
    confirmLabel: 'Eliminar proveedor',
  }
}

async function confirmRemoval() {
  if (!pendingRemoval.value) return
  const action = pendingRemoval.value
  pendingRemoval.value = null

  try {
    if (action.kind === 'type') {
      await proveedoresApi.removeType(action.value)
      await loadProviderTypes()
      return
    }
    await proveedoresApi.remove(action.value)
    await loadProviders()
  } catch (e: any) {
    toastStore.showNotification(e.message || 'No se pudo eliminar', 'error')
  }
}

onMounted(() => {
  Promise.all([loadProviderTypes(), loadProviders(), loadExpenseSummary()])
    .catch((e: any) => {
      toastStore.showNotification(e.message || 'Error al cargar datos', 'error')
    })
    .finally(() => {
      pageLoading.value = false
    })
})
</script>

<template>
  <div class="providers-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Proveedores</h1>
        <p class="page-subtitle">Crea, edita y conecta proveedores con costos y envíos</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" type="button" @click="router.push({ name: 'AdminCostos' })">Ir a costos</button>
        <button class="btn-primary" type="button" @click="openCreate"><i class="fa-solid fa-plus" /> Nuevo proveedor</button>
      </div>
    </div>

    <section class="stats-grid">
      <article class="stat-card"><span>Total</span><strong>{{ proveedores.length }}</strong></article>
      <article class="stat-card"><span>Activos</span><strong>{{ activeCount }}</strong></article>
      <article class="stat-card"><span>Tipos</span><strong>{{ typeCount }}</strong></article>
      <article class="stat-card stat-card--accent"><span>Filtrados</span><strong>{{ filteredCount }}</strong></article>
    </section>

    <section class="expenses-strip">
      <article class="expense-card expense-card--current">
        <span>Gasto mes corriente</span>
        <strong>{{ formatCurrency(gastoResumen.thisMonth) }}</strong>
      </article>
      <article class="expense-card expense-card--historic">
        <span>Gasto histórico</span>
        <strong>{{ formatCurrency(gastoResumen.historic) }}</strong>
      </article>
      <article class="expense-card expense-card--providers">
        <span>Proveedores con gasto</span>
        <strong>{{ gastoResumen.providers }}</strong>
      </article>
    </section>

    <section class="filter-panel">
      <div class="toolbar">
        <input v-model="search" class="field-input search-input" placeholder="Buscar proveedor, tipo, país, ciudad..." />
        <AppSelect v-model="selectedType" class="filter-select filter-select--compact" label="Tipo" :options="[{ value: 'all', label: 'Todos los tipos' }, ...typeOptions.map((type) => ({ value: type, label: type }))]" />
        <AppSelect v-model="selectedStatus" class="filter-select filter-select--compact" label="Estado" :options="[{ value: 'all', label: 'Todos los estados' }, { value: 'active', label: 'Activos' }, { value: 'inactive', label: 'Inactivos' }]" />
        <AppSelect v-model="selectedCountry" class="filter-select filter-select--compact" label="País" :options="[{ value: 'all', label: 'Todos los países' }, ...countryOptions.map((country) => ({ value: country, label: country }))]" />
        <button type="button" class="btn-secondary btn-clear" @click="resetFilters">Limpiar</button>
      </div>
      <div class="filter-summary">
        <span>Mostrando <strong>{{ filteredCount }}</strong> de <strong>{{ providerCount }}</strong> proveedores</span>
        <span class="filter-hint">Filtra por tipo, estado o país desde esta pantalla.</span>
      </div>
    </section>

    <div v-if="pageLoading" class="skeleton-grid" aria-busy="true" aria-live="polite">
      <article v-for="n in 4" :key="n" class="provider-skeleton" :class="`tone-${(n - 1) % 4}`">
        <div class="skeleton-top">
          <div class="skeleton-title-block">
            <span class="skeleton-line skeleton-title"></span>
            <span class="skeleton-line skeleton-subtitle"></span>
          </div>
          <span class="skeleton-pill"></span>
        </div>
        <div class="skeleton-meta">
          <span class="skeleton-label"></span>
          <span class="skeleton-label"></span>
          <span class="skeleton-label"></span>
        </div>
        <div class="skeleton-notes"></div>
        <div class="skeleton-band"></div>
        <div class="skeleton-actions">
          <span class="skeleton-button"></span>
          <span class="skeleton-button"></span>
          <span class="skeleton-button"></span>
        </div>
      </article>
    </div>
    <div v-else-if="filtered.length === 0" class="empty empty--colorful">
      <i class="fa-solid fa-truck-fast" />
      <p>No hay proveedores</p>
      <button v-if="search || selectedType !== 'all' || selectedStatus !== 'all' || selectedCountry !== 'all'" type="button" class="btn-secondary" @click="resetFilters">Limpiar filtros</button>
    </div>

    <div v-else class="providers-grid">
      <ProveedorCard
        v-for="item in providerCards"
        :key="item.proveedor._id"
        :proveedor="item.proveedor"
        :gasto-mes-actual="item.gasto.mes"
        :gasto-historico="item.gasto.historic"
        @detail="goToCosts"
        @edit="openEdit"
        @toggle="toggleActivo"
        @remove="removeProvider"
      />
    </div>

    <ProveedorFormModal
      :show="showModal"
      :initial-data="selectedProveedor"
      :provider-types="providerTypes"
      :default-provider-types="defaultProviderTypes"
      :type-usage="typeUsage"
      :on-add-type="handleAddType"
      @close="showModal = false; selectedProveedor = null"
      @save="saveProveedor"
      @delete-type="handleDeleteType"
    />

    <AppConfirmModal
      :open="!!pendingRemoval"
      :title="pendingRemoval?.title || ''"
      :message="pendingRemoval?.message || ''"
      :confirm-label="pendingRemoval?.confirmLabel || 'Confirmar'"
      variant="danger"
      @cancel="pendingRemoval = null"
      @confirm="confirmRemoval"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.providers-page { display: flex; flex-direction: column; gap: $space-6; }

.page-header,
.header-actions { display: flex; justify-content: space-between; gap: $space-3; align-items: flex-start; }

.page-title { font-size: 1.5rem; font-weight: 700; margin: 0 0 $space-1; }

.page-subtitle { margin: 0; color: $ink-400; }

.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: $space-4; }

.stat-card--accent {
  background: linear-gradient(135deg, rgba($brand-orange, 0.18), rgba($ink-900, 0.92));
  border-color: rgba($brand-orange, 0.22);
}

.expenses-strip {
  display: flex;
  flex-wrap: wrap;
  gap: $space-4;
}

.expense-card {
  flex: 1 1 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  padding: $space-5;
  border-radius: 18px;
  background: rgba($ink-900, 0.82);
  border: 1px solid rgba($ink-500, 0.12);
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
  }

  span { color: $ink-400; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.06em; }
  strong { font-size: 1.6rem; }
}

.expense-card--current::before { background: linear-gradient(180deg, $brand-orange, $brand-orange-soft); }
.expense-card--historic::before { background: linear-gradient(180deg, $signal-blue, #7cc7ff); }
.expense-card--providers::before { background: linear-gradient(180deg, $signal-green, #64e0bf); }

.stat-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 18px;
  padding: $space-5;

  span { color: $ink-400; }
  strong { display: block; font-size: 1.6rem; margin-top: $space-2; }
}

.filter-panel {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding: $space-4;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba($ink-900, 0.94), rgba($ink-800, 0.74));
  border: 1px solid rgba($ink-500, 0.12);
}

.toolbar {
  display: grid;
  grid-template-columns: minmax(240px, 1.7fr) repeat(3, minmax(150px, 1fr)) auto;
  gap: $space-2;
  align-items: end;
}

.search-input { width: 100%; min-height: 46px; }

.filter-select {
  min-width: 0;
}

.btn-clear {
  flex: 0 0 auto;
  height: 46px;
  padding-inline: 1rem;
}

.filter-summary {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: $space-2;
  color: $ink-300;
  font-size: 0.8rem;
}

.filter-hint { color: $ink-400; }

.filter-select--compact :deep(.app-select__label) {
  font-size: 0.72rem;
  margin-left: 0.1rem;
}

.filter-select--compact :deep(.app-select__trigger) {
  padding: 0.62rem 0.85rem;
  border-radius: 10px;
  min-height: 46px;
}

.filter-select--compact :deep(.app-select__value) {
  font-size: 0.86rem;
}

.filter-select--compact :deep(.app-select__chevron) {
  font-size: 0.68rem;
}

.filter-select--compact :deep(.app-select__dropdown) {
  max-height: 190px;
}

.providers-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: $space-4; }

.btn-primary,
.btn-secondary {
  border: none;
  cursor: pointer;
  font-family: inherit;
  border-radius: 12px;
  padding: 0.65rem 0.95rem;
  font-weight: 700;
}

.btn-primary { background: $brand-orange; color: $ink-1000; }
.btn-secondary { background: rgba($ink-700, 0.8); color: $fg-dark; }

.field-input {
  background: $ink-1000;
  border: 1px solid rgba($ink-500, 0.2);
  border-radius: 12px;
  padding: $space-3 $space-4;
  color: $fg-dark;
}

.alert,
.empty,
.provider-skeleton {
  padding: $space-5;
  border-radius: 16px;
  background: rgba($ink-900, 0.7);
  border: 1px solid rgba($ink-500, 0.12);
  color: $ink-300;
}

.empty--colorful {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;
  text-align: center;
  padding-block: $space-8;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: $space-4;
}

.provider-skeleton {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  min-height: 310px;
  background: linear-gradient(180deg, rgba($ink-900, 0.96), rgba($ink-900, 0.84));

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 5px;
    background: var(--skeleton-accent, $brand-orange);
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(#ffffff, 0.05), transparent);
    transform: translateX(-100%);
    animation: shimmer 1.35s infinite;
  }

  &.tone-0 { --skeleton-accent: #{$brand-orange}; }
  &.tone-1 { --skeleton-accent: #{$signal-blue}; }
  &.tone-2 { --skeleton-accent: #{$signal-green}; }
  &.tone-3 { --skeleton-accent: #{$signal-amber}; }
}

.skeleton-top,
.skeleton-actions,
.skeleton-meta {
  display: flex;
  gap: $space-3;
  align-items: center;
  justify-content: space-between;
}

.skeleton-top { align-items: flex-start; }

.skeleton-title-block {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  flex: 1;
}

.skeleton-line,
.skeleton-pill,
.skeleton-label,
.skeleton-band,
.skeleton-button,
.skeleton-notes {
  position: relative;
  overflow: hidden;
  background: rgba($ink-700, 0.85);
}

.skeleton-line,
.skeleton-label { border-radius: 999px; }

.skeleton-title { width: 62%; height: 18px; }
.skeleton-subtitle { width: 42%; height: 12px; opacity: 0.8; }
.skeleton-pill { width: 72px; height: 28px; border-radius: 999px; }
.skeleton-meta { flex-wrap: wrap; }
.skeleton-label { width: calc(33.333% - 0.5rem); height: 36px; border-radius: 12px; }
.skeleton-notes { height: 48px; border-radius: 14px; }
.skeleton-band { height: 56px; border-radius: 14px; }
.skeleton-actions { justify-content: flex-start; flex-wrap: wrap; }
.skeleton-button { width: 96px; height: 40px; border-radius: 12px; }

@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

@media (max-width: 900px) {
  .stats-grid { grid-template-columns: 1fr; }
  .expenses-strip { flex-direction: column; }
  .page-header,
  .header-actions { flex-direction: column; align-items: stretch; }

  .toolbar { grid-template-columns: 1fr; }

  .btn-clear { width: 100%; }
}
</style>
