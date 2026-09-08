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
      <header class="panel-head">
        <div>
          <h3>Registrar el día</h3>
          <p class="section-hint">Un registro por día. El total se calcula solo con las tres líneas de venta.</p>
        </div>
      </header>

      <div class="form-grid">
        <AppDatePicker v-model="form.fecha" label="Fecha" />
        <label class="field">
          <span>Responsable</span>
          <div class="control">
            <i class="fa-regular fa-user" aria-hidden="true" />
            <input v-model="form.supervisorNombre" type="text" placeholder="Quién registra" autocomplete="off" />
          </div>
        </label>
        <label class="field">
          <span>Clientes nuevos</span>
          <div class="control">
            <i class="fa-solid fa-user-plus" aria-hidden="true" />
            <input v-model.number="form.clientesNuevos" type="number" min="0" step="1" inputmode="numeric" placeholder="0" />
          </div>
        </label>
      </div>

      <fieldset class="montos">
        <legend>Ventas del día</legend>
        <div class="form-grid">
          <label class="field">
            <span>Courier</span>
            <div class="control">
              <b class="prefix">$</b>
              <input v-model.number="form.ventaCourier" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00" />
            </div>
          </label>
          <label class="field">
            <span>Gestión de compra</span>
            <div class="control">
              <b class="prefix">$</b>
              <input v-model.number="form.ventaGestionCompra" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00" />
            </div>
          </label>
          <label class="field">
            <span>Ventas</span>
            <div class="control">
              <b class="prefix">$</b>
              <input v-model.number="form.ventaVentas" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00" />
            </div>
          </label>
        </div>
      </fieldset>

      <div class="form-grid">
        <label class="field">
          <span>Libras del día</span>
          <div class="control">
            <i class="fa-solid fa-weight-hanging" aria-hidden="true" />
            <input v-model.number="form.libras" type="number" min="0" step="0.1" inputmode="decimal" placeholder="0" />
            <b class="suffix">lb</b>
          </div>
        </label>
        <label class="field full-2">
          <span>Notas <small>(opcional)</small></span>
          <div class="control">
            <textarea v-model="form.notas" rows="2" placeholder="Algo que valga la pena recordar de este día…"></textarea>
          </div>
        </label>
      </div>

      <footer class="form-footer">
        <div class="total-live">
          <span>Total del día</span>
          <Transition name="swap" mode="out-in"><strong :key="totalDia">{{ money(totalDia) }}</strong></Transition>
          <small>Courier + gestión de compra + ventas</small>
        </div>
        <button type="button" class="btn primary" :disabled="saving || totalDia <= 0" @click="save">
          <i class="fa-solid" :class="saving ? 'fa-circle-notch fa-spin' : 'fa-floppy-disk'" aria-hidden="true" />
          {{ saving ? 'Guardando…' : 'Guardar ventas del día' }}
        </button>
      </footer>
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
@use '@/styles/tokens/motion' as *;

.page-shell { display: flex; flex-direction: column; gap: $space-6; }

.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: $space-4; }
.panel, .stat-card, .list-row { background: rgba($ink-900, .7); border: 1px solid rgba($ink-500, .12); border-radius: $radius-lg; padding: $space-5; }
.stat-card.total { border-color: rgba($brand-orange, .45); }
.stat-card span { color: $ink-400; font-size: .85rem; }
.stat-card strong { display: block; font-size: 1.7rem; margin-top: $space-2; font-variant-numeric: tabular-nums; }
.libras-card strong { color: $brand-orange; }

.panel h3 { margin: 0; font-size: 1.1rem; }
.panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: $space-4; flex-wrap: wrap; margin-bottom: $space-4; }
.panel-head .section-hint { margin: 2px 0 0; }
.section-hint { color: $ink-400; margin: 0 0 $space-3; font-size: .85rem; max-width: 60ch; }

// ── Formulario ─────────────────────────────────────────────
.form-panel { display: flex; flex-direction: column; gap: $space-4; }
.form-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: $space-4; align-items: start; }
.full-2 { grid-column: span 2; }

.field {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  min-width: 0;

  > span { font-size: .8rem; font-weight: 500; color: $ink-300; }
  > span small { color: $ink-500; font-weight: 400; }
}

// Mismo aspecto que AppDatePicker / AppSelect para que todo el formulario se lea igual.
.control {
  display: flex;
  align-items: center;
  gap: $space-3;
  width: 100%;
  padding: 0 1rem;
  background: rgba($ink-1000, .5);
  border: 1px solid rgba($ink-500, .3);
  border-radius: 10px;
  color: $fg-dark;
  transition: border-color $dur-fast ease, background $dur-fast ease, box-shadow $dur-fast ease;

  > i { color: $ink-400; font-size: .85rem; flex: 0 0 auto; }
  .prefix, .suffix { color: $ink-400; font-weight: 600; font-size: .9rem; flex: 0 0 auto; }

  input, textarea {
    flex: 1 1 auto;
    min-width: 0;
    width: 100%;
    min-height: 46px;
    padding: 0;
    border: none;
    background: transparent;
    color: $fg-dark;
    font: inherit;
    font-size: .9rem;
    outline: none;
    font-variant-numeric: tabular-nums;

    &::placeholder { color: $ink-500; }
  }

  textarea { min-height: 0; padding: .75rem 0; resize: vertical; line-height: 1.45; }

  // Sin flechas del navegador en los campos numéricos.
  input[type='number'] { -moz-appearance: textfield; appearance: textfield; }
  input[type='number']::-webkit-outer-spin-button,
  input[type='number']::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

  &:hover { background: rgba($ink-1000, .8); border-color: rgba($ink-500, .5); }
  &:focus-within {
    background: rgba($ink-1000, .8);
    border-color: $brand-orange;
    box-shadow: 0 0 0 3px rgba($brand-orange, .1);
    > i, .prefix, .suffix { color: $brand-orange; }
  }
}

.montos {
  margin: 0;
  padding: $space-4 $space-4 $space-4;
  border: 1px solid rgba($brand-orange, .28);
  border-radius: $radius-md;
  background: rgba($brand-orange, .05);

  legend {
    padding: 0 $space-2;
    color: $brand-orange;
    font-size: .74rem;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
}

.form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;
  flex-wrap: wrap;
  padding-top: $space-4;
  border-top: 1px solid rgba($ink-500, .15);
}

.total-live {
  display: grid;
  grid-template-columns: auto auto;
  column-gap: $space-3;
  align-items: baseline;

  span { color: $ink-400; font-size: .85rem; }
  strong { font-size: 1.6rem; color: $brand-orange; font-variant-numeric: tabular-nums; }
  small { grid-column: 1 / -1; color: $ink-500; font-size: .74rem; }
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  min-height: 46px;
  padding: 0 $space-5;
  border-radius: $radius-md;
  border: 1px solid transparent;
  font: inherit;
  font-weight: 600;
  font-size: .9rem;
  cursor: pointer;
  transition: background $dur-fast ease, opacity $dur-fast ease, transform $dur-fast ease;

  &.primary { background: $brand-orange; color: $ink-1000; }
  &.primary:hover:not(:disabled) { background: $brand-orange-soft; }
  &:disabled { opacity: .5; cursor: not-allowed; }
  &:active:not(:disabled) { transform: translateY(1px); }
}

.swap-enter-active { transition: opacity $dur-base ease, transform $dur-base $ease-spring; }
.swap-leave-active { transition: opacity $dur-fast ease; }
.swap-enter-from { opacity: 0; transform: translateY(6px); }
.swap-leave-to { opacity: 0; }

// ── Listas ─────────────────────────────────────────────────
.list { display: flex; flex-direction: column; gap: $space-3; margin-top: $space-4; }
.list-row { display: flex; justify-content: space-between; align-items: center; gap: $space-3; flex-wrap: wrap; padding: $space-4 $space-5; }
.breakdown { display: flex; gap: $space-3; flex-wrap: wrap; color: $ink-400; font-size: .82rem; }
.row-total { text-align: right; }
.row-total strong { color: $brand-orange; font-variant-numeric: tabular-nums; }
.list-row p, .empty { color: $ink-400; margin: 0; }
.empty { margin-top: $space-3; font-size: .88rem; }

.month-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: $space-3; }
.month-card { display: flex; flex-direction: column; gap: $space-1; background: rgba($ink-900, .55); border: 1px solid rgba($ink-500, .12); border-radius: 16px; padding: $space-4; }
.month-card header { color: $ink-400; font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; }
.month-libras { font-size: 1.5rem; }
.month-delta { font-size: .82rem; color: $ink-400; }
.month-delta.up { color: $signal-green; }
.month-delta.down { color: $signal-red; }
.month-card footer { color: $ink-400; font-size: .78rem; margin-top: $space-1; }

@media (max-width: 900px) {
  .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .full-2 { grid-column: 1 / -1; }
}
@media (max-width: 600px) {
  .form-grid { grid-template-columns: 1fr; }
  .form-footer .btn { width: 100%; justify-content: center; }
}
@media (prefers-reduced-motion: reduce) {
  .control, .btn, .swap-enter-active, .swap-leave-active { transition: none; }
}
</style>
