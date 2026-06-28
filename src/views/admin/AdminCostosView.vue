<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { costosApi, CATEGORIAS_POR_TIPO, type Gasto } from '@/services/costos.api'

const gastos = ref<Gasto[]>([])
const loading = ref(false)
const error = ref('')
const filtroTipo = ref('')
const filtroCategoria = ref('')

const showModal = ref(false)
const editId = ref<string | null>(null)

const form = ref({
  tipo: 'operacional' as string,
  categoria: '',
  monto: 0,
  descripcion: '',
  fecha: new Date().toISOString().slice(0, 10),
  proveedor: '',
  referencia: '',
  categoriaPersonalizada: '',
})

const categoriasDisponibles = computed(() => {
  if (!form.value.tipo) return []
  const cats = CATEGORIAS_POR_TIPO[form.value.tipo] || []
  return [...cats, 'Otro (especificar)']
})

const filtered = computed(() => {
  return gastos.value.filter((g) => {
    if (filtroTipo.value && g.tipo !== filtroTipo.value) return false
    if (filtroCategoria.value && g.categoria !== filtroCategoria.value) return false
    return true
  })
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await costosApi.list({ tipo: filtroTipo.value || undefined, limit: 200 })
    gastos.value = data.gastos
  } catch (e: any) {
    error.value = e.message || 'Error'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.value = {
    tipo: 'operacional',
    categoria: '',
    monto: 0,
    descripcion: '',
    fecha: new Date().toISOString().slice(0, 10),
    proveedor: '',
    referencia: '',
    categoriaPersonalizada: '',
  }
  editId.value = null
}

function openCreate() {
  resetForm()
  showModal.value = true
}

async function save() {
  const categoria = form.value.categoria === 'Otro (especificar)'
    ? form.value.categoriaPersonalizada
    : form.value.categoria
  if (!categoria || !form.value.descripcion || form.value.monto <= 0) {
    error.value = 'Completa todos los campos requeridos'
    return
  }
  try {
    if (editId.value) {
      await costosApi.update(editId.value, {
        tipo: form.value.tipo as any,
        categoria,
        monto: form.value.monto,
        descripcion: form.value.descripcion,
        proveedor: form.value.proveedor,
        referencia: form.value.referencia,
      })
    } else {
      await costosApi.create({
        tipo: form.value.tipo,
        categoria,
        monto: form.value.monto,
        descripcion: form.value.descripcion,
        fecha: form.value.fecha,
        proveedor: form.value.proveedor,
        referencia: form.value.referencia,
      })
    }
    showModal.value = false
    resetForm()
    await load()
  } catch (e: any) {
    error.value = e.message || 'Error al guardar'
  }
}

async function remove(id: string) {
  if (!confirm('¿Eliminar este gasto?')) return
  try {
    await costosApi.remove(id)
    await load()
  } catch (e: any) {
    error.value = e.message || 'Error'
  }
}

function formatCurrency(n: number) {
  return '$' + n.toFixed(2)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

const tipoLabel: Record<string, string> = {
  operacional: 'Operacional',
  logistico: 'Logístico',
  envio: 'Envío',
}

onMounted(load)
</script>

<template>
  <div class="costos-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Costos y Gastos</h1>
        <p class="page-subtitle">Registra costos operacionales, logísticos y de envío</p>
      </div>
      <button class="btn-primary" @click="openCreate">
        <i class="fa-solid fa-plus" /> Nuevo gasto
      </button>
    </div>

    <div class="toolbar">
      <label class="filter">
        <span>Tipo</span>
        <select v-model="filtroTipo" class="field-input" @change="load()">
          <option value="">Todos</option>
          <option value="operacional">Operacional</option>
          <option value="logistico">Logístico</option>
          <option value="envio">Envío</option>
        </select>
      </label>
    </div>

    <div v-if="loading" class="loading"><i class="fa-solid fa-circle-notch fa-spin" /> Cargando...</div>
    <div v-else-if="error" class="alert error"><i class="fa-solid fa-circle-exclamation" /> {{ error }}</div>
    <div v-else-if="filtered.length === 0" class="empty">
      <i class="fa-solid fa-coins" />
      <p>No hay gastos registrados</p>
    </div>

    <div v-else class="table-wrapper">
      <table class="gastos-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Categoría</th>
            <th>Descripción</th>
            <th>Monto</th>
            <th>Proveedor</th>
            <th>Ref.</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="g in filtered" :key="g._id">
            <td class="mono">{{ formatDate(g.fecha) }}</td>
            <td><span class="badge" :class="g.tipo">{{ tipoLabel[g.tipo] || g.tipo }}</span></td>
            <td>{{ g.categoria }}</td>
            <td>{{ g.descripcion }}</td>
            <td class="mono total">{{ formatCurrency(g.monto) }}</td>
            <td>{{ g.proveedor || '—' }}</td>
            <td class="mono">{{ g.referencia || '—' }}</td>
            <td>
              <button class="btn-icon danger" @click="remove(g._id)" title="Eliminar">
                <i class="fa-solid fa-trash-can" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <transition name="fade">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-card wide">
          <div class="modal-icon-box info"><i class="fa-solid fa-coins" /></div>
          <h3>{{ editId ? 'Editar' : 'Nuevo' }} gasto</h3>
          <form @submit.prevent="save" class="form-grid">
            <label class="form-field">
              <span>Tipo *</span>
              <select v-model="form.tipo" class="field-input">
                <option value="operacional">Operacional</option>
                <option value="logistico">Logístico</option>
                <option value="envio">Envío</option>
              </select>
            </label>
            <label class="form-field">
              <span>Categoría *</span>
              <select v-model="form.categoria" class="field-input">
                <option value="" disabled>Seleccionar</option>
                <option v-for="c in categoriasDisponibles" :key="c" :value="c">{{ c }}</option>
              </select>
            </label>
            <label v-if="form.categoria === 'Otro (especificar)'" class="form-field">
              <span>Especificar categoría *</span>
              <input v-model="form.categoriaPersonalizada" class="field-input" placeholder="Nueva categoría" />
            </label>
            <label class="form-field">
              <span>Descripción *</span>
              <input v-model="form.descripcion" class="field-input" placeholder="Ej: Pago de renta enero" />
            </label>
            <label class="form-field">
              <span>Monto USD *</span>
              <input v-model.number="form.monto" type="number" step="0.01" min="0" class="field-input" />
            </label>
            <label class="form-field">
              <span>Fecha</span>
              <input v-model="form.fecha" type="date" class="field-input" />
            </label>
            <label class="form-field">
              <span>Proveedor</span>
              <input v-model="form.proveedor" class="field-input" placeholder="Nombre o empresa" />
            </label>
            <label class="form-field">
              <span>Referencia</span>
              <input v-model="form.referencia" class="field-input" placeholder="Factura # o código" />
            </label>
            <div class="form-actions">
              <button type="button" class="btn-ghost" @click="showModal = false">Cancelar</button>
              <button type="submit" class="btn-primary">{{ editId ? 'Actualizar' : 'Guardar' }}</button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.costos-page {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-4;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 $space-1;
}

.page-subtitle {
  color: $ink-400;
  margin: 0;
  font-size: 0.9rem;
}

.toolbar {
  display: flex;
  gap: $space-4;
}

.filter {
  display: flex;
  align-items: center;
  gap: $space-3;
  color: $ink-300;
  font-size: 0.9rem;
}

.field-input {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.2);
  border-radius: 10px;
  padding: $space-2 $space-3;
  color: $fg-dark;
  font-family: inherit;
  outline: none;
  &:focus { border-color: $brand-orange; }
}

.loading, .empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  padding: $space-12 0;
  color: $ink-500;
  i { font-size: 1.5rem; }
}

.alert {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-radius: 12px;
  font-size: 0.9rem;
  background: rgba($signal-red, 0.1);
  color: #ff8a8f;
  border: 1px solid rgba($signal-red, 0.15);
}

.table-wrapper {
  overflow-x: auto;
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 16px;
}

.gastos-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  th, td {
    padding: $space-3 $space-4;
    text-align: left;
    border-bottom: 1px solid rgba($ink-500, 0.1);
    white-space: nowrap;
  }
  th {
    color: $ink-400;
    font-weight: 600;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  tbody tr:last-child td { border-bottom: none; }
  .mono { font-variant-numeric: tabular-nums; }
  .total { color: $brand-orange; font-weight: 700; }
}

.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  &.operacional { background: rgba($brand-orange, 0.12); color: $brand-orange; }
  &.logistico { background: rgba(#4fc3f7, 0.12); color: #4fc3f7; }
  &.envio { background: rgba(#81c784, 0.12); color: #81c784; }
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: transparent;
  color: $ink-400;
  transition: all 0.2s;
  &.danger:hover { background: rgba($signal-red, 0.1); color: #ff8a8f; }
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: 0.6rem 1.25rem;
  background: $brand-orange;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  &:hover { background: darken($brand-orange, 8%); }
}

.btn-ghost {
  padding: 0.6rem 1.25rem;
  background: transparent;
  border: 1px solid rgba($ink-500, 0.3);
  border-radius: 10px;
  color: $ink-300;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  &:hover { background: rgba($ink-500, 0.15); color: $fg-dark; }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba($ink-1000, 0.75);
  backdrop-filter: blur(6px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.modal-card.wide {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.15);
  border-radius: 20px;
  padding: $space-8;
  max-width: 600px;
  width: 100%;
  text-align: left;

  .modal-icon-box {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto $space-4;
    font-size: 1.2rem;
    &.info { background: rgba($brand-orange, 0.12); color: $brand-orange; }
  }

  h3 { text-align: center; font-size: 1.15rem; margin: 0 0 $space-6; }
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-4;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  span { font-size: 0.8rem; color: $ink-400; font-weight: 500; }
  &:nth-last-child(2) { grid-column: 1 / -1; }
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: $space-3;
  margin-top: $space-2;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
