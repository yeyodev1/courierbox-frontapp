<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { adminApi } from '@/services/admin.api'

const loading = ref(false)
const data = ref<any>({ gastos: { total: 0, pagado: 0 }, caja: [], envios: [], produccion: { facturado: 0, clientesNuevos: 0 } })

async function load() {
  loading.value = true
  try { data.value = await adminApi.getData('v1/reportes/ejecutivo') } finally { loading.value = false }
}

onMounted(load)
</script>

<template>
  <div class="page-shell">
    <div class="page-header"><div><h2 class="page-title">Estado de Resultados</h2><p class="page-subtitle">Visión ejecutiva de ingresos, egresos y producción</p></div></div>
    <div v-if="loading" class="loading-grid"><div v-for="n in 4" :key="n" class="skeleton-card"></div></div>
    <template v-else>
      <div class="stats-grid">
        <article class="stat-card"><span>Gasto total</span><strong>${{ Number(data.gastos.total || 0).toFixed(2) }}</strong></article>
        <article class="stat-card"><span>Pagado</span><strong>${{ Number(data.gastos.pagado || 0).toFixed(2) }}</strong></article>
        <article class="stat-card"><span>Facturado</span><strong>${{ Number(data.produccion.facturado || 0).toFixed(2) }}</strong></article>
        <article class="stat-card"><span>Clientes nuevos</span><strong>{{ Number(data.produccion.clientesNuevos || 0) }}</strong></article>
      </div>
      <section class="panel"><h3>Resumen caja</h3><pre>{{ JSON.stringify(data.caja, null, 2) }}</pre></section>
      <section class="panel"><h3>Proveedores más usados</h3><article v-for="p in (data.proveedores || []).slice(0, 5)" :key="p._id" class="list-row"><div><strong>{{ p._id }}</strong><p>{{ p.total }} envíos</p></div><div><strong>${{ Number(p.cobrado || 0).toFixed(2) }}</strong></div></article></section>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *; @use '@/styles/tokens/space' as *; .page-shell{display:flex;flex-direction:column;gap:$space-6}.stats-grid,.loading-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:$space-4}.panel,.stat-card,.skeleton-card{background:rgba($ink-900,.7);border:1px solid rgba($ink-500,.12);border-radius:20px;padding:$space-5}.stat-card strong{display:block;font-size:1.8rem;margin-top:$space-2}.stat-card span{color:$ink-400}.skeleton-card{height:140px;animation:pulse 1.3s ease-in-out infinite alternate}@keyframes pulse{from{opacity:.45}to{opacity:.8}}pre{white-space:pre-wrap;color:$ink-300}
.list-row{display:flex;justify-content:space-between;gap:$space-3;padding:$space-3 0;border-bottom:1px solid rgba($ink-500,.1)}
</style>
