<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { adminApi } from '@/services/admin.api'
import AppDatePicker from '@/components/ui/AppDatePicker.vue'

const loading = ref(false)
const saving = ref(false)
const items = ref<any[]>([])
const summary = ref({ facturado: 0, clientesNuevos: 0, dias: 0 })
const form = ref({ fecha: new Date().toISOString().slice(0, 10), supervisorNombre: '', facturado: 0, clientesNuevos: 0, notas: '' })

async function load() {
  loading.value = true
  try {
    const [list, sum] = await Promise.all([adminApi.getData('v1/produccion?limit=60'), adminApi.getData('v1/produccion/resumen')])
    items.value = list.items || []
    summary.value = sum.resumen || summary.value
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await adminApi.postData('v1/produccion', form.value)
    await load()
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page-shell">
    <div class="page-header"><div><h2 class="page-title">Producción Diaria</h2><p class="page-subtitle">Facturación diaria y clientes nuevos tipo CRM</p></div></div>
    <div class="stats-grid">
      <article class="stat-card"><span>Facturado (30 días)</span><strong>${{ summary.facturado.toFixed(2) }}</strong></article>
      <article class="stat-card"><span>Clientes nuevos (30 días)</span><strong>{{ summary.clientesNuevos }}</strong></article>
    </div>
    <section class="panel form-panel">
      <div class="form-grid">
        <AppDatePicker v-model="form.fecha" label="Fecha" />
        <label><span>Supervisor</span><input v-model="form.supervisorNombre" class="field-input" /></label>
        <label><span>Facturado</span><input v-model.number="form.facturado" type="number" step="0.01" class="field-input" /></label>
        <label><span>Clientes nuevos</span><input v-model.number="form.clientesNuevos" type="number" class="field-input" /></label>
        <label class="full"><span>Notas CRM</span><textarea v-model="form.notas" rows="3" class="field-input"></textarea></label>
      </div>
      <button class="btn-primary" :disabled="saving" @click="save">{{ saving ? 'Guardando...' : 'Guardar producción' }}</button>
    </section>
    <section class="panel"><h3>Registros recientes</h3><div class="list"><article v-for="item in items" :key="item._id" class="list-row"><div><strong>{{ new Date(item.fecha).toLocaleDateString('es-EC') }}</strong><p>{{ item.supervisorNombre || 'Supervisor' }}</p></div><div><strong>${{ Number(item.facturado || 0).toFixed(2) }}</strong><p>{{ item.clientesNuevos }} clientes</p></div></article></div></section>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *; @use '@/styles/tokens/space' as *; .page-shell{display:flex;flex-direction:column;gap:$space-6}.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:$space-4}.panel,.stat-card,.list-row{background:rgba($ink-900,.7);border:1px solid rgba($ink-500,.12);border-radius:20px;padding:$space-5}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:$space-3;margin-bottom:$space-4}.full{grid-column:1/-1}.list{display:flex;flex-direction:column;gap:$space-3}.list-row{display:flex;justify-content:space-between;gap:$space-3}.list-row p,.stat-card span{color:$ink-400;margin:0}.stat-card strong{display:block;font-size:1.8rem;margin-top:$space-2}@media (max-width:768px){.form-grid{grid-template-columns:1fr}}
</style>
