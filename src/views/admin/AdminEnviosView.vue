<script setup lang="ts">
import AppSelect from "@/components/ui/AppSelect.vue";
/** Last-mile deliveries screen: summary, deliveries tab and provider catalogue. */
import { computed, onMounted, ref, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import AppButton from '@/components/ui/AppButton.vue'
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

const estadoOptions = [{ value: '', label: 'Todos' }, ...Object.entries(ESTADO_LABEL).map(([value, label]) => ({ value, label }))]
const modoOptions = [
  { value: '', label: 'Todos' },
  { value: 'local', label: 'Local' },
  { value: 'interprovincial', label: 'Interprovincial' },
]
const motorizadoOptions = computed(() => [
  { value: '', label: 'Todos' },
  { value: 'none', label: 'Sin asignar' },
  ...envios.motorizados.value.map((m) => ({ value: m._id, label: m.name || m.email })),
])

const hayFiltros = computed(
  () => !!(envios.filtroEstado.value || envios.filtroModo.value || envios.filtroMotorizado.value || envios.filtroBusqueda.value),
)

watch(
  [envios.filtroEstado, envios.filtroModo, envios.filtroMotorizado, envios.filtroDesde, envios.filtroHasta],
  envios.load,
)
watchDebounced(envios.filtroBusqueda, envios.load, { debounce: 350 })
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
        <label class="filter search-filter">
          <span>Buscar</span>
          <input
            v-model="envios.filtroBusqueda.value"
            class="field-input"
            type="search"
            placeholder="Cliente, dirección, teléfono, ciudad, proveedor..."
          />
        </label>
        <label class="filter">
          <span>Estado</span>
          <AppSelect v-model="envios.filtroEstado.value" :options="estadoOptions" />
        </label>
        <label class="filter">
          <span>Modo</span>
          <AppSelect v-model="envios.filtroModo.value" :options="modoOptions" />
        </label>
        <label class="filter">
          <span>Motorizado</span>
          <AppSelect v-model="envios.filtroMotorizado.value" :options="motorizadoOptions" />
        </label>
        <AppDatePicker v-model="envios.filtroDesde.value" label="Desde" />
        <AppDatePicker v-model="envios.filtroHasta.value" label="Hasta" />
        <button v-if="hayFiltros" class="btn-link" type="button" @click="envios.limpiarFiltros">Limpiar filtros</button>
      </div>

      <div class="toolbar actions-bar">
        <span class="result-count">{{ envios.filtered.value.length }} envíos</span>
        <div class="actions">
          <AppButton variant="outline" :disabled="envios.exporting.value" @click="envios.exportar('excel')">
            <i class="fa-solid fa-file-excel" /> Excel
          </AppButton>
          <AppButton variant="outline" :disabled="envios.exporting.value" @click="envios.exportar('pdf')">
            <i class="fa-solid fa-file-pdf" /> PDF
          </AppButton>
          <button class="btn-primary" @click="openCreate"><i class="fa-solid fa-plus" /> Nuevo envío</button>
        </div>
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

.search-filter { flex: 1 1 260px; }

.actions-bar {
  align-items: center;
  justify-content: space-between;
}

.actions {
  display: flex;
  align-items: center;
  gap: $space-2;
  flex-wrap: wrap;
}

.result-count { color: $ink-400; font-size: 0.85rem; }

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
