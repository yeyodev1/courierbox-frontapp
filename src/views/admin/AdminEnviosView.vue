<script setup lang="ts">
/** Last-mile deliveries screen: summary, deliveries tab and provider catalogue. */
import { onMounted, ref, watch } from 'vue'
import AppDatePicker from '@/components/ui/AppDatePicker.vue'
import type { Proveedor } from '@/services/proveedores.api'
import EnviosTable from './Envios/EnviosTable.vue'
import EnvioFormModal from './Envios/EnvioFormModal.vue'
import ProveedoresPanel from './Envios/ProveedoresPanel.vue'
import ProveedorFormModal from './Envios/ProveedorFormModal.vue'
import { ESTADO_LABEL, formatMoney, useEnvios } from './Envios/useEnvios'
import { useProveedores } from './Envios/useProveedores'

const activeTab = ref<'envios' | 'proveedores'>('envios')

const envios = useEnvios()
const proveedores = useProveedores()

const showEnvioModal = ref(false)
const showProvModal = ref(false)
/** Set when the provider modal was opened from inside the envío form, so we can go back. */
const returningToEnvio = ref(false)
const envioForm = ref<InstanceType<typeof EnvioFormModal> | null>(null)

function openCreate() {
  envioForm.value?.reset()
  proveedores.load()
  envios.loadMotorizados()
  showEnvioModal.value = true
}

function onEnvioCreated() {
  showEnvioModal.value = false
  envios.load()
}

function createProveedorFromEnvio() {
  returningToEnvio.value = true
  showEnvioModal.value = false
  proveedores.startCreate()
  showProvModal.value = true
}

function openProvCreate() {
  returningToEnvio.value = false
  proveedores.startCreate()
  showProvModal.value = true
}

function openProvEdit(proveedor: Proveedor) {
  returningToEnvio.value = false
  proveedores.startEdit(proveedor)
  showProvModal.value = true
}

function closeProvModal() {
  showProvModal.value = false
  if (returningToEnvio.value) {
    returningToEnvio.value = false
    showEnvioModal.value = true
  }
}

async function saveProveedor() {
  const nombre = await proveedores.save()
  if (nombre === null) return
  showProvModal.value = false
  if (returningToEnvio.value) {
    returningToEnvio.value = false
    envioForm.value?.preselectProveedor(nombre)
    showEnvioModal.value = true
  }
}

onMounted(() => {
  envios.load()
  envios.loadMotorizados()
  proveedores.load()
})

watch([envios.filtroEstado, envios.filtroDesde, envios.filtroHasta], envios.load)
</script>

<template>
  <div class="envios-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Envíos a Domicilio</h1>
        <p class="page-subtitle">Gestiona envíos de última milla y proveedores logísticos</p>
      </div>
    </div>

    <div v-if="envios.resumen.value" class="stats-grid">
      <article class="stat-card">
        <span>Locales</span>
        <strong>{{ envios.resumen.value.locales.total }}</strong>
        <small>{{ formatMoney(envios.resumen.value.locales.cobrados) }} cobrados</small>
      </article>
      <article class="stat-card">
        <span>Interprovinciales</span>
        <strong>{{ envios.resumen.value.interprovinciales.total }}</strong>
        <small>{{ formatMoney(envios.resumen.value.interprovinciales.cobrados) }} cobrados</small>
      </article>
      <article class="stat-card">
        <span>Saldo</span>
        <strong>{{ formatMoney(envios.resumen.value.saldo) }}</strong>
        <small>cobrado menos costos</small>
      </article>
      <article class="stat-card">
        <span>Novedades</span>
        <strong>{{ (envios.resumen.value.locales.novedades || 0) + (envios.resumen.value.interprovinciales.novedades || 0) }}</strong>
        <small>casos con observación</small>
      </article>
    </div>

    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'envios' }" @click="activeTab = 'envios'">Envíos</button>
      <button class="tab" :class="{ active: activeTab === 'proveedores' }" @click="activeTab = 'proveedores'">Proveedores</button>
    </div>

    <template v-if="activeTab === 'envios'">
      <div class="toolbar">
        <label class="filter">
          <span>Estado</span>
          <select v-model="envios.filtroEstado.value" class="field-input">
            <option value="">Todos</option>
            <option v-for="(label, key) in ESTADO_LABEL" :key="key" :value="key">{{ label }}</option>
          </select>
        </label>
        <AppDatePicker v-model="envios.filtroDesde.value" label="Desde" />
        <AppDatePicker v-model="envios.filtroHasta.value" label="Hasta" />
        <button class="btn-primary" @click="openCreate"><i class="fa-solid fa-plus" /> Nuevo envío</button>
      </div>

      <div v-if="envios.loading.value" class="skeleton-list">
        <div v-for="n in 4" :key="n" class="skeleton-row"></div>
      </div>
      <div v-else-if="!envios.filtered.value.length" class="empty">
        <i class="fa-solid fa-truck" /><p>No hay envíos</p>
      </div>
      <EnviosTable
        v-else
        :envios="envios.filtered.value"
        :motorizados="envios.motorizados.value"
        @reasignar="envios.reasignar"
        @update-status="envios.updateStatus"
        @toggle-pago="envios.togglePago"
        @open-guide="envios.openGuide"
      />
    </template>

    <ProveedoresPanel
      v-else
      v-model:query="proveedores.filterQuery.value"
      :proveedores="proveedores.filtered.value"
      :loading="proveedores.loading.value"
      @search="proveedores.load"
      @create="openProvCreate"
      @edit="openProvEdit"
      @toggle-activo="proveedores.toggleActivo"
    />

    <EnvioFormModal
      ref="envioForm"
      :open="showEnvioModal"
      :motorizados="envios.motorizados.value"
      :proveedores="proveedores.activos.value"
      @close="showEnvioModal = false"
      @created="onEnvioCreated"
      @create-proveedor="createProveedorFromEnvio"
    />

    <ProveedorFormModal
      v-model:form="proveedores.form.value"
      :open="showProvModal"
      :editing="!!proveedores.editing.value"
      @close="closeProvModal"
      @save="saveProveedor"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './Envios/envios-ui' as ui;

@include ui.buttons;
@include ui.fields;
@include ui.states;
@include ui.toolbar;

.envios-page { display: flex; flex-direction: column; gap: $space-6; }

.tabs {
  display: flex;
  gap: $space-1;
  background: $ink-900;
  border-radius: 12px;
  padding: $space-1;
  width: fit-content;
}

.tab {
  padding: $space-2 $space-5;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: $ink-400;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { color: $fg-dark; }
  &.active { background: $brand-orange; color: #fff; }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: $space-4;
}

.stat-card {
  background: rgba($ink-900, 0.72);
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 20px;
  padding: $space-4;

  span { color: $ink-400; font-size: 0.8rem; }
  strong { display: block; margin: $space-2 0; font-size: 1.8rem; }
  small { color: $ink-500; }
}
</style>
