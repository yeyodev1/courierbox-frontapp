<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { costosApi, CATEGORIAS_POR_TIPO, type Gasto } from '@/services/costos.api'

import CostosHeader from './components/CostosHeader.vue'
import CostosToolbar from './components/CostosToolbar.vue'
import CostosSummary from './components/CostosSummary.vue'
import CostosTable from './components/CostosTable.vue'
import CostosDetailModal from './components/CostosDetailModal.vue'
import CostosFormModal from './components/CostosFormModal.vue'

const route = useRoute()

const gastos = ref<Gasto[]>([])
const loading = ref(false)
const error = ref('')
const resumen = ref<any>(null)

const filtroTipo = ref('')
const filtroCategoria = ref('')
const filtroProveedor = ref(String(route.query.proveedor || ''))
const filtroDesde = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
const filtroHasta = ref(new Date().toISOString().slice(0, 10))

const showFormModal = ref(false)
const showDetailModal = ref(false)
const selectedGasto = ref<Gasto | null>(null)

const categoriasDisponibles = computed(() => {
  if (!filtroTipo.value) return []
  return CATEGORIAS_POR_TIPO[filtroTipo.value as keyof typeof CATEGORIAS_POR_TIPO] || []
})

const filteredGastos = computed(() => {
  return gastos.value.filter((g) => {
    if (filtroTipo.value && g.tipo !== filtroTipo.value) return false
    if (filtroCategoria.value && g.categoria !== filtroCategoria.value) return false
    return true
  })
})

const resumenSeguro = computed(() => {
  if (!resumen.value) return null
  return {
    total: resumen.value.total || { total: 0, facturas: 0, libras: 0 },
    porMes: resumen.value.porMes || [],
    porCategoria: resumen.value.porCategoria || [],
    porProveedor: resumen.value.porProveedor || [],
  }
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [data, resumenData] = await Promise.all([
      costosApi.list({
        tipo: filtroTipo.value || undefined,
        categoria: filtroCategoria.value || undefined,
        proveedor: filtroProveedor.value || undefined,
        desde: filtroDesde.value || undefined,
        hasta: filtroHasta.value || undefined,
        limit: 200,
      }),
      costosApi.resumen({
        tipo: filtroTipo.value || undefined,
        categoria: filtroCategoria.value || undefined,
        proveedor: filtroProveedor.value || undefined,
        desde: filtroDesde.value || undefined,
        hasta: filtroHasta.value || undefined,
      }),
    ])
    gastos.value = data.gastos
    resumen.value = resumenData.resumen
  } catch (e: any) {
    error.value = e.message || 'Error'
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch([filtroTipo, filtroCategoria, filtroDesde, filtroHasta], load)
watch(filtroProveedor, load)
watch(
  () => route.query.proveedor,
  (newVal) => {
    filtroProveedor.value = String(newVal || '')
  }
)

function openCreate() {
  selectedGasto.value = null
  showFormModal.value = true
}

function openDetail(gasto: Gasto) {
  selectedGasto.value = gasto
  showDetailModal.value = true
}

function openEdit(gasto: Gasto) {
  selectedGasto.value = gasto
  showDetailModal.value = false
  showFormModal.value = true
}

async function handleRemove(id: string) {
  try {
    await costosApi.remove(id)
    await load()
  } catch (e: any) {
    error.value = e.message || 'Error al eliminar'
  }
}

async function handleSave(payload: any, file: File | null) {
  try {
    if (selectedGasto.value) {
      await costosApi.update(selectedGasto.value._id, payload)
    } else {
      const created = await costosApi.create(payload)
      if (file && created.gasto?._id) {
        await costosApi.uploadFactura(created.gasto._id, file)
      }
    }
    showFormModal.value = false
    selectedGasto.value = null
    await load()
  } catch (e: any) {
    alert(e.message || 'Error al guardar')
  }
}
</script>

<template>
  <div class="costos-page">
    <CostosHeader @create="openCreate" />
    
    <CostosToolbar
      v-model:tipo="filtroTipo"
      v-model:categoria="filtroCategoria"
      v-model:proveedor="filtroProveedor"
      v-model:desde="filtroDesde"
      v-model:hasta="filtroHasta"
      :categorias-disponibles="categoriasDisponibles"
    />

    <CostosSummary v-if="resumenSeguro" :resumen-seguro="resumenSeguro" />

    <CostosTable
      :gastos="filteredGastos"
      :loading="loading"
      :error="error"
      @detail="openDetail"
      @delete="handleRemove"
    />

    <CostosDetailModal
      :show="showDetailModal"
      :gasto="selectedGasto"
      @close="showDetailModal = false; selectedGasto = null"
      @edit="openEdit"
    />

    <CostosFormModal
      ref="formModalRef"
      :show="showFormModal"
      :initial-data="selectedGasto"
      @close="showFormModal = false; selectedGasto = null"
      @save="handleSave"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/space' as *;

.costos-page {
  display: flex;
  flex-direction: column;
  gap: $space-5;

  @media (max-width: 640px) {
    gap: $space-3;
  }
}
</style>
