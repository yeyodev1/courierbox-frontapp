<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { adminApi } from '@/services/admin.api'
import AppDatePicker from '@/components/ui/AppDatePicker.vue'
import { useToastStore } from '@/stores/toast.store'

const toastStore = useToastStore()
const loading = ref(false)
const saving = ref(false)
const items = ref<any[]>([])
const summary = ref({ facturado: 0, ventaCourier: 0, ventaGestionCompra: 0, ventaVentas: 0, libras: 0, clientesNuevos: 0, dias: 0 })
const comparativo = ref<any[]>([])

function emptyForm() {
  return {
    fecha: new Date().toISOString().slice(0, 10),
    supervisorNombre: '',
    ventaCourier: 0,
    ventaGestionCompra: 0,
    ventaVentas: 0,
    libras: 0,
    clientesNuevos: 0,
    notas: '',
  }
}
const form = ref(emptyForm())

/** The day's total is never typed by hand — it is the sum of the three lines. */
const totalDia = computed(
  () => (Number(form.value.ventaCourier) || 0) + (Number(form.value.ventaGestionCompra) || 0) + (Number(form.value.ventaVentas) || 0),
)

const money = (value: unknown) => `$${(Number(value) || 0).toFixed(2)}`
const libras = (value: unknown) => `${(Number(value) || 0).toLocaleString('es-EC', { maximumFractionDigits: 1 })} lb`
const MESES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const mesLabel = (m: number, y: number) => `${MESES[m] || m} ${y}`
const deltaPct = (v: number | null) => (v == null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`)

async function load() {
  loading.value = true
  try {
    const [list, sum, comp] = await Promise.all([
      adminApi.getData('v1/produccion?limit=60'),
      adminApi.getData('v1/produccion/resumen'),
      adminApi.getData('v1/produccion/comparativo?meses=12'),
    ])
    items.value = list.items || []
    if (sum.resumen) summary.value = { ...summary.value, ...sum.resumen }
    comparativo.value = comp.items || []
  } catch (e: any) {
    toastStore.showNotification(e.message || 'Error al cargar', 'error')
  } finally {
    loading.value = false
  }
}

async function save() {
  if (totalDia.value <= 0) {
    toastStore.showNotification('Ingresa al menos un monto para registrar el día', 'error')
    return
  }
  saving.value = true
  try {
    await adminApi.postData('v1/produccion', form.value)
    toastStore.showNotification('Ventas del día registradas', 'success')
    form.value = emptyForm()
    await load()
  } catch (e: any) {
    toastStore.showNotification(e.message || 'Error al guardar', 'error')
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
        <h2 class="page-title">Ventas diarias</h2>
        <p class="page-subtitle">Registro diario de lo facturado por courier, gestión de compra y ventas</p>
      </div>
    </div>

    <div class="stats-grid">
      <article class="stat-card total">
        <span>Facturado (30 días)</span><strong>{{ money(summary.facturado) }}</strong>
      </article>
      <article class="stat-card"><span>Courier</span><strong>{{ money(summary.ventaCourier) }}</strong></article>
      <article class="stat-card"><span>Gestión de compra</span><strong>{{ money(summary.ventaGestionCompra) }}</strong></article>
      <article class="stat-card"><span>Ventas</span><strong>{{ money(summary.ventaVentas) }}</strong></article>
      <article class="stat-card libras-card"><span>Libras (30 días)</span><strong>{{ libras(summary.libras) }}</strong></article>
    </div>

    <section class="panel form-panel">
      <h3>Registrar el día</h3>
      <div class="form-grid">
        <AppDatePicker v-model="form.fecha" label="Fecha" />
        <label><span>Responsable</span><input v-model="form.supervisorNombre" class="field-input" placeholder="Quién registra" /></label>
        <label><span>Courier $</span><input v-model.number="form.ventaCourier" type="number" min="0" step="0.01" class="field-input" /></label>
        <label><span>Gestión de compra $</span><input v-model.number="form.ventaGestionCompra" type="number" min="0" step="0.01" class="field-input" /></label>
        <label><span>Ventas $</span><input v-model.number="form.ventaVentas" type="number" min="0" step="0.01" class="field-input" /></label>
        <label><span>Clientes nuevos</span><input v-model.number="form.clientesNuevos" type="number" min="0" class="field-input" /></label>
        <label><span>Libras del día</span><input v-model.number="form.libras" type="number" min="0" step="0.1" class="field-input" placeholder="0" /></label>
        <label class="full"><span>Notas</span><textarea v-model="form.notas" rows="2" class="field-input"></textarea></label>
      </div>
      <div class="form-footer">
        <div class="total-live"><span>Total del día</span><strong>{{ money(totalDia) }}</strong></div>
        <button class="btn-primary" :disabled="saving || totalDia <= 0" @click="save">
          {{ saving ? 'Guardando...' : 'Guardar ventas del día' }}
        </button>
      </div>
    </section>

    <section class="panel">
      <h3>Contraste mensual de libras</h3>
      <p class="section-hint">Libras alimentadas cada mes y su variación respecto al mes anterior.</p>
      <p v-if="!loading && !comparativo.length" class="empty">Aún no hay datos para comparar.</p>
      <div v-else class="month-grid">
        <article v-for="row in comparativo" :key="`${row.anio}-${row.mes}`" class="month-card">
          <header>{{ mesLabel(row.mes, row.anio) }}</header>
          <strong class="month-libras">{{ libras(row.libras) }}</strong>
          <span
            class="month-delta"
            :class="{ up: (row.deltaLibras || 0) > 0, down: (row.deltaLibras || 0) < 0 }"
          >
            {{ deltaPct(row.deltaPct) }} vs. mes anterior
          </span>
          <footer>{{ money(row.facturado) }} · {{ row.dias }} días</footer>
        </article>
      </div>
    </section>

    <section class="panel">
      <h3>Registros recientes</h3>
      <p v-if="!loading && !items.length" class="empty">Aún no hay ventas registradas.</p>
      <div class="list">
        <article v-for="item in items" :key="item._id" class="list-row">
          <div>
            <strong>{{ new Date(item.fecha).toLocaleDateString('es-EC') }}</strong>
            <p>{{ item.supervisorNombre || 'Sin responsable' }}</p>
          </div>
          <div class="breakdown">
            <span>Courier {{ money(item.ventaCourier) }}</span>
            <span>Compra {{ money(item.ventaGestionCompra) }}</span>
            <span>Ventas {{ money(item.ventaVentas) }}</span>
          </div>
          <div class="row-total">
            <strong>{{ money(item.facturado) }}</strong>
            <p>{{ item.clientesNuevos || 0 }} clientes</p>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.page-shell { display: flex; flex-direction: column; gap: $space-6; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: $space-4; }
.panel, .stat-card, .list-row { background: rgba($ink-900, .7); border: 1px solid rgba($ink-500, .12); border-radius: 20px; padding: $space-5; }
.stat-card.total { border-color: rgba($brand-orange, .45); }
.stat-card span { color: $ink-400; }
.stat-card strong { display: block; font-size: 1.7rem; margin-top: $space-2; }
.form-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: $space-3; margin: $space-4 0; }
.full { grid-column: 1 / -1; }
.form-footer { display: flex; align-items: center; justify-content: space-between; gap: $space-4; flex-wrap: wrap; }
.total-live span { color: $ink-400; margin-right: $space-2; }
.total-live strong { font-size: 1.4rem; color: $brand-orange; }
.list { display: flex; flex-direction: column; gap: $space-3; }
.list-row { display: flex; justify-content: space-between; align-items: center; gap: $space-3; flex-wrap: wrap; }
.breakdown { display: flex; gap: $space-3; flex-wrap: wrap; color: $ink-400; font-size: .82rem; }
.row-total { text-align: right; }
.list-row p, .empty { color: $ink-400; margin: 0; }
.libras-card strong { color: $brand-orange; }
.section-hint { color: $ink-400; margin: 0 0 $space-3; font-size: .85rem; }
.month-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: $space-3; }
.month-card { display: flex; flex-direction: column; gap: $space-1; background: rgba($ink-900, .55); border: 1px solid rgba($ink-500, .12); border-radius: 16px; padding: $space-4; }
.month-card header { color: $ink-400; font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; }
.month-libras { font-size: 1.5rem; }
.month-delta { font-size: .82rem; color: $ink-400; }
.month-delta.up { color: #34d399; }
.month-delta.down { color: #f87171; }
.month-card footer { color: $ink-400; font-size: .78rem; margin-top: $space-1; }
@media (max-width: 900px) { .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
</style>
