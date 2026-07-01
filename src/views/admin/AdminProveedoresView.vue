<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppConfirmModal from '@/components/ui/AppConfirmModal.vue'
import { proveedoresApi, type Proveedor } from '@/services/proveedores.api'

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
const loading = ref(false)
const error = ref('')
const search = ref('')
const proveedores = ref<Proveedor[]>([])
const showModal = ref(false)
const selectedProveedor = ref<Proveedor | null>(null)
const providerTypes = ref<string[]>([])
const defaultProviderTypes = ref<string[]>([])
const pendingRemoval = ref<null | { kind: 'type' | 'provider'; value: string; title: string; message: string; confirmLabel: string }>(null)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return proveedores.value.filter((p) => {
    if (!q) return true
    return [p.nombre, p.tipo, p.pais, p.ciudad, p.contacto, p.email]
      .filter(Boolean)
      .some((v) => v.toLowerCase().includes(q))
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

async function loadProviderTypes() {
  const data = await proveedoresApi.listTypes()
  defaultProviderTypes.value = data.defaultTypes
  providerTypes.value = data.providerTypes
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await proveedoresApi.list({ q: search.value || undefined, limit: 200 })
    proveedores.value = data.proveedores
  } catch (e: any) {
    error.value = e.message || 'Error al cargar proveedores'
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
    error.value = 'El nombre es obligatorio'
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
    await load()
  } catch (e: any) {
    error.value = e.message || 'No se pudo guardar'
  }
}

async function handleAddType(type: string) {
  await proveedoresApi.addType(type)
  await loadProviderTypes()
}

async function toggleActivo(p: Proveedor) {
  try {
    await proveedoresApi.update(p._id, { activo: !p.activo })
    await load()
  } catch (e: any) {
    error.value = e.message || 'No se pudo actualizar'
  }
}

function handleDeleteType(type: string) {
  const normalized = normalizeType(type)
  const count = typeUsage.value[normalized] || 0
  if (count > 0) {
    error.value = `No puedes eliminar "${type}" porque ya está asignado a ${count} proveedor${count > 1 ? 'es' : ''}.`
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
    await load()
  } catch (e: any) {
    error.value = e.message || 'No se pudo eliminar'
  }
}

watch(search, () => load())

onMounted(() => {
  Promise.all([loadProviderTypes(), load()]).catch((e: any) => {
    error.value = e.message || 'Error al cargar datos'
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
    </section>

    <div class="toolbar">
      <input v-model="search" class="field-input search-input" placeholder="Buscar proveedor, tipo, país, ciudad..." />
    </div>

    <div v-if="loading" class="skeleton-list">
      <div v-for="n in 4" :key="n" class="skeleton-row"></div>
    </div>
    <div v-else-if="error" class="alert error"><i class="fa-solid fa-circle-exclamation" /> {{ error }}</div>
    <div v-else-if="filtered.length === 0" class="empty">
      <i class="fa-solid fa-truck-fast" />
      <p>No hay proveedores</p>
    </div>

    <div v-else class="providers-grid">
      <ProveedorCard
        v-for="p in filtered"
        :key="p._id"
        :proveedor="p"
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

.stats-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: $space-4; }

.stat-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 18px;
  padding: $space-5;

  span { color: $ink-400; }
  strong { display: block; font-size: 1.6rem; margin-top: $space-2; }
}

.toolbar { display: flex; gap: $space-3; }
.search-input { width: 100%; }

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
.skeleton-row {
  padding: $space-5;
  border-radius: 16px;
  background: rgba($ink-900, 0.7);
  border: 1px solid rgba($ink-500, 0.12);
  color: $ink-300;
}

.skeleton-list { display: grid; gap: $space-3; }
.skeleton-row { height: 138px; background: linear-gradient(90deg, rgba($ink-900, 0.75), rgba($ink-800, 0.7), rgba($ink-900, 0.75)); background-size: 200% 100%; animation: shimmer 1.4s infinite; }

@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

@media (max-width: 900px) {
  .stats-grid { grid-template-columns: 1fr; }
  .page-header,
  .header-actions { flex-direction: column; align-items: stretch; }
}
</style>
