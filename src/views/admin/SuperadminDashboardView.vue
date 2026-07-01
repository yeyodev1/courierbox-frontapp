<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { adminApi } from '@/services/admin.api'

const report = ref<any>(null)
const payments = ref<any[]>([])
const loading = ref(false)
const checklist = ref<Record<string, boolean>>({})

async function load() {
  loading.value = true
  try {
    const [rep, pay] = await Promise.all([adminApi.getData('v1/reportes/ejecutivo'), adminApi.getPayments()])
    report.value = rep
    payments.value = pay.payments || pay || []
  } finally { loading.value = false }
}

onMounted(load)
</script>

<template>
  <div class="page-shell">
    <div class="page-header"><div><h2 class="page-title">Superadmin</h2><p class="page-subtitle">Módulo privado ejecutivo</p></div></div>
    <div v-if="loading" class="loading-grid"><div v-for="n in 4" :key="n" class="skeleton-card"></div></div>
    <template v-else>
      <div class="stats-grid">
        <article class="stat-card"><span>Gastos</span><strong>${{ Number(report?.gastos?.total || 0).toFixed(2) }}</strong></article>
        <article class="stat-card"><span>Facturado</span><strong>${{ Number(report?.produccion?.facturado || 0).toFixed(2) }}</strong></article>
        <article class="stat-card"><span>Clientes nuevos</span><strong>{{ Number(report?.produccion?.clientesNuevos || 0) }}</strong></article>
      </div>
      <section class="panel">
        <h3>Pagos del mes</h3>
        <article v-for="p in payments" :key="p._id || p.id" class="check-row">
          <label><input v-model="checklist[p._id || p.id]" type="checkbox" /> {{ p.reference || p.descripcion || 'Pago' }}</label>
          <span>${{ Number(p.amount || p.monto || 0).toFixed(2) }}</span>
        </article>
      </section>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *; @use '@/styles/tokens/space' as *; .page-shell{display:flex;flex-direction:column;gap:$space-6}.stats-grid,.loading-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:$space-4}.panel,.stat-card,.skeleton-card{background:rgba($ink-900,.7);border:1px solid rgba($ink-500,.12);border-radius:20px;padding:$space-5}.stat-card strong{display:block;font-size:1.8rem;margin-top:$space-2}.stat-card span{color:$ink-400}.check-row{display:flex;justify-content:space-between;padding:$space-3 0;border-bottom:1px solid rgba($ink-500,.1)}.skeleton-card{height:140px;animation:pulse 1.3s ease-in-out infinite alternate}@keyframes pulse{from{opacity:.45}to{opacity:.8}}
</style>
