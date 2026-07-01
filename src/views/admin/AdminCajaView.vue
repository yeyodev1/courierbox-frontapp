<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { adminApi } from '@/services/admin.api'

type Movimiento = {
  _id: string
  tipo: 'ingreso' | 'egreso'
  categoria: string
  monto: number
  clienteNombre?: string
  descripcion?: string
  referencia?: string
  createdAt: string
}

const loading = ref(false)
const saving = ref(false)
const items = ref<Movimiento[]>([])
const summary = ref<{ ingresos: { total: number; count: number }; egresos: { total: number; count: number } }>({ ingresos: { total: 0, count: 0 }, egresos: { total: 0, count: 0 } })
const error = ref('')

const form = ref({
  tipo: 'ingreso' as 'ingreso' | 'egreso',
  categoria: 'VENTA',
  monto: 0,
  clienteNombre: '',
  descripcion: '',
  referencia: '',
})

const ingresos = ['VENTA', 'GDC', 'COURIER']
const egresos = ['TRANSPORTE', 'COMBUSTIBLE', 'GASTOS FIJOS', 'GASTOS VARIABLES', 'GASTOS EVENTUALES', 'ADELANTOS', 'ALIMENTOS', 'INSUMOS BASICOS', 'DEVOLUCIONES']

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [list, sum] = await Promise.all([adminApi.getData('v1/caja?limit=100'), adminApi.getData('v1/caja/resumen')])
    items.value = list.movimientos || []
    summary.value = sum || summary.value
  } catch (e: any) {
    error.value = e.message || 'Error'
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await adminApi.postData('v1/caja', form.value)
    form.value.descripcion = ''
    form.value.referencia = ''
    form.value.monto = 0
    await load()
  } catch (e: any) {
    error.value = e.message || 'Error al guardar'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page-shell">
    <div class="page-header">
      <div>
        <h2 class="page-title">Caja</h2>
        <p class="page-subtitle">Ingresos y egresos visibles para administración y gerencia</p>
      </div>
    </div>

    <div class="stats-grid">
      <article class="stat-card"><span>Ingresos</span><strong>${{ summary.ingresos.total.toFixed(2) }}</strong><small>{{ summary.ingresos.count }} movimientos</small></article>
      <article class="stat-card"><span>Egresos</span><strong>${{ summary.egresos.total.toFixed(2) }}</strong><small>{{ summary.egresos.count }} movimientos</small></article>
    </div>

    <div v-if="loading" class="loading-grid">
      <div v-for="n in 4" :key="n" class="skeleton-card"></div>
    </div>
    <div v-else-if="error" class="alert error">{{ error }}</div>

    <div class="two-col">
      <section class="panel">
        <h3>Nuevo movimiento</h3>
        <div class="form-grid">
          <label><span>Tipo</span><select v-model="form.tipo" class="field-input"><option value="ingreso">Ingreso</option><option value="egreso">Egreso</option></select></label>
          <label><span>Categoría</span><select v-model="form.categoria" class="field-input"><option v-for="c in form.tipo === 'ingreso' ? ingresos : egresos" :key="c" :value="c">{{ c }}</option></select></label>
          <label v-if="form.tipo === 'ingreso'"><span>Cliente</span><input v-model="form.clienteNombre" class="field-input" placeholder="Selecciona cliente" /></label>
          <label><span>Monto</span><input v-model.number="form.monto" type="number" step="0.01" min="0" class="field-input" /></label>
          <label class="full"><span>Descripción</span><textarea v-model="form.descripcion" class="field-input" rows="3"></textarea></label>
          <label class="full"><span>Referencia</span><input v-model="form.referencia" class="field-input" /></label>
        </div>
        <button class="btn-primary" :disabled="saving" @click="save">{{ saving ? 'Guardando...' : 'Guardar movimiento' }}</button>
      </section>

      <section class="panel">
        <h3>Últimos movimientos</h3>
        <div class="movements">
          <article v-for="m in items" :key="m._id" class="movement-row">
            <div>
              <strong>{{ m.categoria }}</strong>
              <p>{{ m.clienteNombre || m.descripcion || 'Sin detalle' }}</p>
            </div>
            <div class="right">
              <span :class="['tag', m.tipo]">{{ m.tipo }}</span>
              <strong>${{ m.monto.toFixed(2) }}</strong>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
.page-shell{display:flex;flex-direction:column;gap:$space-6}.stats-grid,.two-col{display:grid;gap:$space-4}.stats-grid{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}.two-col{grid-template-columns:repeat(auto-fit,minmax(320px,1fr))}.panel,.stat-card,.movement-row,.skeleton-card{background:rgba($ink-900,.7);border:1px solid rgba($ink-500,.12);border-radius:20px;padding:$space-5}.stat-card span,.panel h3{color:$ink-400}.stat-card strong{display:block;font-size:1.8rem;margin:$space-2 0}.movement-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:$space-3}.movement-row p{margin:0;color:$ink-400}.tag{padding:.3rem .6rem;border-radius:999px;font-size:.75rem;text-transform:uppercase}.tag.ingreso{background:rgba(#2bbb92,.12);color:#2bbb92}.tag.egreso{background:rgba(#e5484d,.12);color:#e5484d}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:$space-3}.form-grid .full{grid-column:1/-1}.loading-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:$space-4}.skeleton-card{height:140px;animation:pulse 1.3s ease-in-out infinite alternate}@keyframes pulse{from{opacity:.45}to{opacity:.8}}@media (max-width: 768px){.form-grid{grid-template-columns:1fr}}
</style>
