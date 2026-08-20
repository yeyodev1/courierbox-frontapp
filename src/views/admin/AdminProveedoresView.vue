<script setup lang="ts">
/** Provider directory: spend at a glance, filters and CRUD. */
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppConfirmModal from '@/components/ui/AppConfirmModal.vue'
import type { Proveedor } from '@/services/proveedores.api'
import ProveedorCard from './Proveedores/components/ProveedorCard.vue'
import ProveedorFormModal from './Proveedores/components/ProveedorFormModal.vue'
import ProveedoresFiltros from './Proveedores/ProveedoresFiltros.vue'
import ProveedoresSkeleton from './Proveedores/ProveedoresSkeleton.vue'
import { formatCurrency, useProveedoresPage, type PendingRemoval } from './Proveedores/useProveedoresPage'

const router = useRouter()
const p = useProveedoresPage()

const showModal = ref(false)
const editing = ref<Proveedor | null>(null)
const pendingRemoval = ref<PendingRemoval | null>(null)

function openCreate() {
  editing.value = null
  showModal.value = true
}

function openEdit(proveedor: Proveedor) {
  editing.value = proveedor
  showModal.value = true
}

async function onSave(payload: Partial<Proveedor>) {
  if (await p.save(editing.value, payload)) {
    showModal.value = false
    editing.value = null
  }
}

function onDeleteType(type: string) {
  pendingRemoval.value = p.typeRemovalRequest(type)
}

async function onConfirmRemoval() {
  if (!pendingRemoval.value) return
  const action = pendingRemoval.value
  pendingRemoval.value = null
  await p.confirmRemoval(action)
}

onMounted(p.loadAll)
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
        <button class="btn-primary" type="button" @click="openCreate">
          <i class="fa-solid fa-plus" /> Nuevo proveedor
        </button>
      </div>
    </div>

    <section class="stats-grid">
      <article class="stat-card"><span>Total</span><strong>{{ p.proveedores.value.length }}</strong></article>
      <article class="stat-card"><span>Activos</span><strong>{{ p.activeCount.value }}</strong></article>
      <article class="stat-card"><span>Tipos</span><strong>{{ p.typeCount.value }}</strong></article>
      <article class="stat-card stat-card--accent">
        <span>Filtrados</span><strong>{{ p.filtered.value.length }}</strong>
      </article>
    </section>

    <section class="expenses-strip">
      <article class="expense-card expense-card--current">
        <span>Gasto mes corriente</span>
        <strong>{{ formatCurrency(p.gastoResumen.value.thisMonth) }}</strong>
      </article>
      <article class="expense-card expense-card--historic">
        <span>Gasto histórico</span>
        <strong>{{ formatCurrency(p.gastoResumen.value.historic) }}</strong>
      </article>
      <article class="expense-card expense-card--providers">
        <span>Proveedores con gasto</span>
        <strong>{{ p.gastoResumen.value.providers }}</strong>
      </article>
    </section>

    <ProveedoresFiltros
      v-model:search="p.search.value"
      v-model:tipo="p.selectedType.value"
      v-model:estado="p.selectedStatus.value"
      v-model:pais="p.selectedCountry.value"
      :type-options="p.typeOptions.value"
      :country-options="p.countryOptions.value"
      :filtrados="p.filtered.value.length"
      :total="p.proveedores.value.length"
      @reset="p.resetFilters"
    />

    <ProveedoresSkeleton v-if="p.pageLoading.value" />

    <div v-else-if="!p.filtered.value.length" class="empty empty--colorful">
      <i class="fa-solid fa-truck-fast" />
      <p>No hay proveedores</p>
      <button v-if="p.hasFilters.value" type="button" class="btn-secondary" @click="p.resetFilters">
        Limpiar filtros
      </button>
    </div>

    <div v-else class="providers-grid">
      <ProveedorCard
        v-for="item in p.providerCards.value"
        :key="item.proveedor._id"
        :proveedor="item.proveedor"
        :gasto-mes-actual="item.gasto.mes"
        :gasto-historico="item.gasto.historic"
        @detail="(prov) => router.push({ name: 'AdminCostos', query: { proveedor: prov.nombre } })"
        @edit="openEdit"
        @toggle="p.toggleActivo"
        @remove="(prov) => (pendingRemoval = p.providerRemovalRequest(prov))"
      />
    </div>

    <ProveedorFormModal
      :show="showModal"
      :initial-data="editing"
      :provider-types="p.providerTypes.value"
      :default-provider-types="p.defaultProviderTypes.value"
      :type-usage="p.typeUsage.value"
      :on-add-type="p.addType"
      @close="showModal = false; editing = null"
      @save="onSave"
      @delete-type="onDeleteType"
    />

    <AppConfirmModal
      :open="!!pendingRemoval"
      :title="pendingRemoval?.title || ''"
      :message="pendingRemoval?.message || ''"
      :confirm-label="pendingRemoval?.confirmLabel || 'Confirmar'"
      variant="danger"
      @cancel="pendingRemoval = null"
      @confirm="onConfirmRemoval"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.providers-page {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.page-header,
.header-actions {
  display: flex;
  justify-content: space-between;
  gap: $space-3;
  align-items: flex-start;

  @media (max-width: 900px) { flex-direction: column; align-items: stretch; }
}

.page-title { font-size: 1.5rem; font-weight: 700; margin: 0 0 $space-1; }
.page-subtitle { margin: 0; color: $ink-400; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: $space-4;

  @media (max-width: 900px) { grid-template-columns: 1fr; }
}

.stat-card {
  padding: $space-4;
  border-radius: 16px;
  background: rgba($ink-900, 0.7);
  border: 1px solid rgba($ink-500, 0.12);

  span { color: $ink-400; font-size: 0.8rem; }
  strong { display: block; margin-top: $space-2; font-size: 1.6rem; }

  &--accent {
    border-color: rgba($brand-orange, 0.35);
    strong { color: $brand-orange; }
  }
}

.expenses-strip {
  display: flex;
  gap: $space-4;

  @media (max-width: 900px) { flex-direction: column; }
}

.expense-card {
  position: relative;
  flex: 1;
  overflow: hidden;
  padding: $space-4 $space-5;
  border-radius: 16px;
  background: rgba($ink-900, 0.7);
  border: 1px solid rgba($ink-500, 0.12);

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 5px;
  }

  span { color: $ink-400; font-size: 0.8rem; }
  strong { display: block; margin-top: $space-2; font-size: 1.5rem; }

  &--current::before { background: linear-gradient(180deg, $brand-orange, $brand-orange-soft); }
  &--historic::before { background: linear-gradient(180deg, $signal-blue, #7cc7ff); }
  &--providers::before { background: linear-gradient(180deg, $signal-green, #64e0bf); }
}

.providers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: $space-4;
}

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

.empty {
  padding: $space-5;
  border-radius: 16px;
  background: rgba($ink-900, 0.7);
  border: 1px solid rgba($ink-500, 0.12);
  color: $ink-300;

  &--colorful {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-3;
    text-align: center;
    padding-block: $space-8;
  }
}
</style>
