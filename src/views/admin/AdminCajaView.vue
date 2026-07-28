<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { adminApi } from '@/services/admin.api'
import { contactosApi } from '@/services/contactos.api'
import { contactosCbAPI } from '@/services/contactos_cb.api'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppDatePicker from '@/components/ui/AppDatePicker.vue'
import AppFileUpload from '@/components/ui/AppFileUpload.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppConfirmModal from '@/components/ui/AppConfirmModal.vue'
import { useToastStore } from '@/stores/toast.store'
import {
  CATEGORIAS_EGRESO,
  CATEGORIAS_INGRESO,
  buildQuery,
  canDeleteCajaMovimiento,
  formatDate,
  formatMoney,
  type CajaMovimiento,
  type CajaResumen,
} from './caja.utils'

type ClienteResult = { clientId: string; clientName: string; clientEmail?: string; clientPhone?: string; lastOrderDate: string }

type CajaForm = {
  tipo: 'ingreso' | 'egreso'
  categoria: string
  monto: number
  fecha: string
  clienteNombre: string
  clienteId: string
  descripcion: string
  referencia: string
}

const loading = ref(false)
const saving = ref(false)
const items = ref<CajaMovimiento[]>([])
const summary = ref<CajaResumen | null>(null)
const router = useRouter()
const toastStore = useToastStore()

const filtroTipo = ref('')
const filtroCategoria = ref('')
const filtroDesde = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
const filtroHasta = ref(new Date().toISOString().slice(0, 10))

const showModal = ref(false)
const showDeleteConfirm = ref(false)
const deleteTarget = ref<CajaMovimiento | null>(null)
const showCreateContactModal = ref(false)
const createContactSaving = ref(false)
const createContactForm = ref({
  clientName: '',
  clientEmail: '',
  clientPhone: '',
})

const clienteQuery = ref('')
const clientResults = ref<ClienteResult[]>([])
const selectedClient = ref<ClienteResult | null>(null)
const selectedClientConfirmed = ref(false)
const searchingClients = ref(false)
const comprobanteFile = ref<File | null>(null)

const form = ref<CajaForm>({
  tipo: 'ingreso' as 'ingreso' | 'egreso',
  categoria: CATEGORIAS_INGRESO[0] || '',
  monto: 0,
  fecha: new Date().toISOString().slice(0, 10),
  clienteNombre: '',
  clienteId: '',
  descripcion: '',
  referencia: '',
})

const resumen = computed(() => {
  const base = summary.value as Partial<CajaResumen> | null
  return {
    ingresos: base?.ingresos ?? { total: 0, count: 0 },
    egresos: base?.egresos ?? { total: 0, count: 0 },
    saldo: typeof base?.saldo === 'number' ? base.saldo : 0,
    porTipo: (Array.isArray(base?.porTipo) ? base.porTipo : []) as CajaResumen['porTipo'],
    porCategoria: (Array.isArray(base?.porCategoria) ? base.porCategoria : []) as CajaResumen['porCategoria'],
  }
})
const categoriasDisponibles = computed(() => (form.value.tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO))
const categoriaOptions = computed(() => categoriasDisponibles.value.map((item) => ({ value: item, label: item })))
const maxCategoria = computed(() => Math.max(...(resumen.value.porCategoria.map((item: CajaResumen['porCategoria'][number]) => Number(item.total || 0)) || [0]), 0))
const movimientosFiltrados = computed(() => items.value.filter((item) => {
  if (filtroTipo.value && item.tipo !== filtroTipo.value) return false
  if (filtroCategoria.value && item.categoria !== filtroCategoria.value) return false
  return true
}))
const showClientEmptyHelp = computed(() => clienteQuery.value.trim().length >= 2 && !searchingClients.value && !selectedClientConfirmed.value && clientResults.value.length === 0)
const createIdempotencyKey = ref(crypto.randomUUID())

function resetForm() {
  createIdempotencyKey.value = crypto.randomUUID()
  form.value = {
    tipo: 'ingreso',
    categoria: CATEGORIAS_INGRESO[0] || '',
    monto: 0,
    fecha: new Date().toISOString().slice(0, 10),
    clienteNombre: '',
    clienteId: '',
    descripcion: '',
    referencia: '',
  }
  clienteQuery.value = ''
  clientResults.value = []
  selectedClient.value = null
  selectedClientConfirmed.value = false
  comprobanteFile.value = null
}

function openNewMovement() {
  resetForm()
  showModal.value = true
}

function openCreateContactModal() {
  createContactForm.value.clientName = clienteQuery.value.trim() || form.value.clienteNombre.trim() || ''
  createContactForm.value.clientEmail = ''
  createContactForm.value.clientPhone = ''
  showCreateContactModal.value = true
}

function closeModal() {
  showModal.value = false
}

function closeDeleteConfirm() {
  showDeleteConfirm.value = false
  deleteTarget.value = null
}

function showToast(message: string, variant: 'success' | 'error') {
  toastStore.showNotification(message, variant)
}

async function load() {
  loading.value = true
  try {
    const params = {
      tipo: filtroTipo.value || undefined,
      categoria: filtroCategoria.value || undefined,
      desde: filtroDesde.value || undefined,
      hasta: filtroHasta.value || undefined,
      limit: 100,
    }
    const query = buildQuery(params)
    const [list, sum] = await Promise.all([
      adminApi.getData(`v1/caja?${query}`),
      adminApi.getData(`v1/caja/resumen?${query}`),
    ])
    items.value = list.movimientos || []
    summary.value = sum || null
  } catch (e: any) {
    toastStore.showNotification(e.message || 'Error al cargar caja', 'error')
  } finally {
    loading.value = false
  }
}

async function searchClients() {
  const q = clienteQuery.value.trim()
  if (q.length < 2) {
    clientResults.value = []
    return
  }

  searchingClients.value = true
  try {
    const data = await contactosApi.list({ q, limit: 20 })
    clientResults.value = data.contactos.map((contacto) => ({
      clientId: contacto._id,
      clientName: contacto.clientName,
      clientEmail: contacto.clientEmail,
      clientPhone: contacto.clientPhone,
      lastOrderDate: contacto.lastOrderDate,
    }))
  } catch {
    clientResults.value = []
  } finally {
    searchingClients.value = false
  }
}

function selectClient(client: ClienteResult) {
  form.value.clienteNombre = client.clientName
  form.value.clienteId = client.clientId
  selectedClient.value = client
  selectedClientConfirmed.value = true
  clienteQuery.value = client.clientName
  clientResults.value = []
}

function clearSelectedClient() {
  selectedClient.value = null
  selectedClientConfirmed.value = false
}

watch(clienteQuery, (value) => {
  if (!selectedClient.value) return
  const normalized = value.trim().toLowerCase()
  const selectedMatch = [selectedClient.value.clientName, selectedClient.value.clientEmail || '', selectedClient.value.clientPhone || '']
    .map((item) => item.trim().toLowerCase())
    .includes(normalized)
  if (!selectedMatch) {
    selectedClient.value = null
    selectedClientConfirmed.value = false
    form.value.clienteNombre = ''
    form.value.clienteId = ''
  } else {
    selectedClientConfirmed.value = true
  }
})

function goToContactos() {
  showCreateContactModal.value = false
  router.push('/admin/contactos')
}

async function createContactFromModal() {
  const clientName = createContactForm.value.clientName.trim()
  const clientEmail = createContactForm.value.clientEmail.trim()
  const clientPhone = createContactForm.value.clientPhone.trim()
  if (!clientName) {
    toastStore.showNotification('Ingresa el nombre del cliente', 'error')
    return
  }

  createContactSaving.value = true
  try {
    const searchText = [clientName, clientEmail, clientPhone].filter(Boolean).join(' ')
    const existing = await contactosApi.list({ q: searchText, limit: 20 })
    const exact = existing.contactos.find((contacto) => {
      const sameName = contacto.clientName.trim().toLowerCase() === clientName.toLowerCase()
      const sameEmail = clientEmail && (contacto.clientEmail || '').trim().toLowerCase() === clientEmail.toLowerCase()
      const samePhone = clientPhone && (contacto.clientPhone || '').replace(/\D/g, '') === clientPhone.replace(/\D/g, '')
      return sameName || sameEmail || samePhone
    })

    if (exact) {
      const foundClient: ClienteResult = {
        clientId: exact._id,
        clientName: exact.clientName,
        clientEmail: exact.clientEmail,
        clientPhone: exact.clientPhone,
        lastOrderDate: exact.lastOrderDate,
      }
      selectClient(foundClient)
      showCreateContactModal.value = false
      showToast('Ese contacto ya existía, se reutilizó para evitar duplicados', 'success')
      return
    }

    const result = await contactosCbAPI.create({
      nombre: clientName,
      email: clientEmail || undefined,
      telefono: clientPhone || undefined,
      notas: 'Contacto creado desde caja',
    })
    selectClient({
      clientId: result.contacto._id,
      clientName: result.contacto.nombre,
      clientEmail: result.contacto.email,
      clientPhone: result.contacto.telefono,
      lastOrderDate: new Date().toISOString(),
    })
    showCreateContactModal.value = false
    showToast('Contacto creado y disponible en caja', 'success')
  } catch (e: any) {
    toastStore.showNotification(e.message || 'No se pudo crear el contacto', 'error')
  } finally {
    createContactSaving.value = false
  }
}

async function save() {
  if (!form.value.categoria || !form.value.monto || !form.value.descripcion) {
    toastStore.showNotification('Completa tipo, categoría, monto y descripción', 'error')
    return
  }

  saving.value = true
  try {
    const created = await adminApi.postData('v1/caja', {
      ...form.value,
      clienteNombre: form.value.tipo === 'ingreso' ? form.value.clienteNombre : '',
      clienteId: form.value.tipo === 'ingreso' ? form.value.clienteId || undefined : undefined,
      clienteEmail: form.value.tipo === 'ingreso' ? selectedClient.value?.clientEmail || undefined : undefined,
      clientePhone: form.value.tipo === 'ingreso' ? selectedClient.value?.clientPhone || undefined : undefined,
      idempotencyKey: createIdempotencyKey.value,
    })

    if (comprobanteFile.value && created.movimiento?._id) {
      const uploadForm = new FormData()
      uploadForm.append('file', comprobanteFile.value)
      await adminApi.postData(`v1/caja/${created.movimiento._id}/upload`, uploadForm)
    }

    showModal.value = false
    showToast('Movimiento guardado correctamente', 'success')
    await load()
  } catch (e: any) {
    toastStore.showNotification(e.message || 'Error al guardar', 'error')
  } finally {
    saving.value = false
  }
}

function requestDelete(movement: CajaMovimiento) {
  if (!canDeleteCajaMovimiento(movement)) {
    showToast('No se puede eliminar después de 7 días', 'error')
    return
  }
  deleteTarget.value = movement
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return

  try {
    await adminApi.deleteData(`v1/caja/${deleteTarget.value._id}`)
    showToast('Movimiento eliminado', 'success')
    closeDeleteConfirm()
    await load()
  } catch (e: any) {
    showToast(e.message || 'No se pudo eliminar el movimiento', 'error')
  }
}

function isIngresoCategoria(category: string) {
  return CATEGORIAS_INGRESO.includes(category)
}

watch(
  () => form.value.tipo,
  (tipo) => {
    const nextCategoria = (tipo === 'ingreso' ? CATEGORIAS_INGRESO[0] : CATEGORIAS_EGRESO[0]) || ''
    form.value.categoria = nextCategoria
    if (tipo === 'egreso') {
      form.value.clienteNombre = ''
      form.value.clienteId = ''
      clienteQuery.value = ''
      clientResults.value = []
    }
    const currentCategoria = form.value.categoria || ''
    if (!categoriasDisponibles.value.includes(currentCategoria)) {
      form.value.categoria = categoriasDisponibles.value[0] || ''
    }
  },
)

watch([filtroTipo, filtroCategoria, filtroDesde, filtroHasta], load)

onMounted(load)
</script>

<template>
  <div class="page-shell">
    <div class="page-header caja-header">
      <div>
        <h2 class="page-title">Caja</h2>
        <p class="page-subtitle">Control claro de ingresos, egresos y balance operativo</p>
      </div>
      <button class="btn-primary" type="button" @click="openNewMovement">
        <i class="fa-solid fa-plus" /> Nuevo movimiento
      </button>
    </div>

    <div class="stats-grid">
      <article class="stat-card accent">
        <span>Ingresos</span>
        <strong>{{ formatMoney(resumen.ingresos.total) }}</strong>
        <small>{{ resumen.ingresos.count }} movimientos</small>
      </article>
      <article class="stat-card danger">
        <span>Egresos</span>
        <strong>{{ formatMoney(resumen.egresos.total) }}</strong>
        <small>{{ resumen.egresos.count }} movimientos</small>
      </article>
      <article class="stat-card balance">
        <span>Saldo</span>
        <strong>{{ formatMoney(resumen.saldo) }}</strong>
        <small>Ingresos - egresos</small>
      </article>
    </div>

    <section class="panel filters-panel">
      <div class="section-head">
        <h3>Filtros</h3>
        <p>Filtra la caja por tipo, categoría y rango de fechas.</p>
      </div>
      <AppSelect v-model="filtroTipo" :options="[{ value: '', label: 'Todos' }, { value: 'ingreso', label: 'Ingreso' }, { value: 'egreso', label: 'Egreso' }]" label="Tipo" />
      <AppSelect v-model="filtroCategoria" :options="[{ value: '', label: 'Todas' }, ...CATEGORIAS_INGRESO.map((item) => ({ value: item, label: item })), ...CATEGORIAS_EGRESO.map((item) => ({ value: item, label: item }))]" label="Categoría" />
      <AppDatePicker v-model="filtroDesde" label="Desde" />
      <AppDatePicker v-model="filtroHasta" label="Hasta" />
    </section>

    <section class="panel breakdown-panel">
      <div class="section-head">
        <h3>Desglose por categoría</h3>
        <p>Visualiza dónde se concentra el dinero dentro del periodo seleccionado.</p>
      </div>

      <div v-if="resumen.porCategoria.length" class="breakdown-list">
        <article v-for="row in resumen.porCategoria" :key="row._id" class="breakdown-row">
          <div class="breakdown-meta">
            <strong>{{ row._id }}</strong>
            <span>{{ row.count }} movimientos</span>
          </div>
          <div class="breakdown-bar-wrap">
            <div class="breakdown-bar" :class="isIngresoCategoria(row._id) ? 'is-income' : 'is-expense'" :style="{ width: `${maxCategoria ? (Number(row.total || 0) / maxCategoria) * 100 : 0}%` }"></div>
          </div>
          <div class="breakdown-value">
            <strong>{{ formatMoney(row.total) }}</strong>
          </div>
        </article>
      </div>
      <div v-else class="empty-state compact">
        <i class="fa-solid fa-chart-column" />
        <div>
          <strong>Sin movimientos en este periodo</strong>
          <p>Cuando registres movimientos aparecerá el desglose aquí.</p>
        </div>
      </div>
    </section>

    <section class="panel movements-panel">
      <div class="section-head between">
        <div>
          <h3>Movimientos</h3>
          <p>Lista clara con fecha, tipo, cliente, comprobante y acciones.</p>
        </div>
        <div class="count-pill">{{ movimientosFiltrados.length }} movimientos</div>
      </div>

      <div v-if="loading" class="loading-grid">
        <div v-for="n in 4" :key="n" class="skeleton-card"></div>
      </div>
      <template v-else>
        <div v-if="movimientosFiltrados.length" class="table-wrapper desktop-only">
          <table class="movements-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Cliente</th>
                <th>Monto</th>
                <th>Comprobante</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in movimientosFiltrados" :key="m._id">
                <td>{{ formatDate(m.fecha || m.createdAt) }}</td>
                <td><span :class="['badge', m.tipo]">{{ m.tipo }}</span></td>
                <td>{{ m.categoria }}</td>
                <td>
                  <strong>{{ m.descripcion }}</strong>
                  <p v-if="m.referencia">Ref: {{ m.referencia }}</p>
                </td>
                <td>{{ m.clienteNombre || '—' }}</td>
                <td class="money">{{ formatMoney(m.monto) }}</td>
                <td>
                  <a v-if="m.comprobanteUrl" :href="m.comprobanteUrl" target="_blank" class="file-link">Abrir</a>
                  <span v-else>—</span>
                </td>
                <td>
                  <button
                    class="btn-icon danger"
                    type="button"
                    :disabled="!canDeleteCajaMovimiento(m)"
                    :title="canDeleteCajaMovimiento(m) ? 'Eliminar movimiento' : 'No se puede eliminar después de 7 días'"
                    @click="requestDelete(m)"
                  >
                    <i class="fa-solid fa-trash-can" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="movimientosFiltrados.length" class="mobile-only movement-cards">
          <article v-for="m in movimientosFiltrados" :key="m._id" class="movement-card">
            <div class="movement-card__top">
              <div>
                <div class="card-meta">
                  <span>{{ formatDate(m.fecha || m.createdAt) }}</span>
                  <span :class="['badge', m.tipo]">{{ m.tipo }}</span>
                </div>
                <h4>{{ m.categoria }}</h4>
                <p>{{ m.descripcion }}</p>
              </div>
              <strong class="money">{{ formatMoney(m.monto) }}</strong>
            </div>

            <dl class="movement-card__details">
              <div><dt>Cliente</dt><dd>{{ m.clienteNombre || '—' }}</dd></div>
              <div><dt>Referencia</dt><dd>{{ m.referencia || '—' }}</dd></div>
              <div><dt>Comprobante</dt><dd><a v-if="m.comprobanteUrl" :href="m.comprobanteUrl" target="_blank" class="file-link">Abrir</a><span v-else>—</span></dd></div>
            </dl>

            <div class="movement-card__actions">
              <button
                class="btn-icon danger"
                type="button"
                :disabled="!canDeleteCajaMovimiento(m)"
                :title="canDeleteCajaMovimiento(m) ? 'Eliminar movimiento' : 'No se puede eliminar después de 7 días'"
                @click="requestDelete(m)"
              >
                <i class="fa-solid fa-trash-can" />
              </button>
            </div>
          </article>
        </div>

        <div v-if="!movimientosFiltrados.length" class="empty-state">
          <i class="fa-solid fa-wallet" />
          <div>
            <strong>No hay movimientos registrados</strong>
            <p>Presiona “Nuevo movimiento” para registrar un ingreso o egreso.</p>
          </div>
        </div>
      </template>
    </section>

    <AppModal
      :show="showModal"
      title="Nuevo movimiento"
      icon="fa-solid fa-wallet"
      icon-variant="info"
      max-width="760px"
      :prevent-close-on-overlay="saving"
      @close="closeModal"
    >
      <div v-if="saving" class="saving-banner">
        <i class="fa-solid fa-spinner fa-spin" /> Guardando movimiento... el registro se actualizará al instante.
      </div>

      <div class="modal-grid">
        <AppSelect v-model="form.tipo" :options="[{ value: 'ingreso', label: 'Ingreso' }, { value: 'egreso', label: 'Egreso' }]" label="Tipo" />
        <AppSelect v-model="form.categoria" :options="categoriaOptions" label="Categoría" />
        <AppDatePicker v-model="form.fecha" label="Fecha" />
        <label class="field">
          <span>Monto</span>
          <input v-model.number="form.monto" type="number" min="0" step="0.01" class="field-input" />
        </label>
        <label class="field full">
          <span>Descripción</span>
          <textarea v-model="form.descripcion" class="field-input" rows="3" placeholder="Qué se está registrando y por qué"></textarea>
        </label>
        <label class="field full">
          <span>Referencia</span>
          <input v-model="form.referencia" class="field-input" placeholder="Factura, nota, comprobante o código" />
        </label>

        <div v-if="form.tipo === 'ingreso'" class="field full client-box">
          <div class="section-head compact-head">
            <div>
              <h4>Cliente</h4>
              <p>Busca un cliente existente para dejar la caja amarrada al caso correcto.</p>
            </div>
          </div>
          <input v-model="clienteQuery" class="field-input" placeholder="Buscar cliente" @input="searchClients" @focus="clienteQuery.length >= 2 && searchClients()" />
          <div v-if="searchingClients" class="hint">Buscando clientes...</div>
          <div v-if="clientResults.length" class="client-results">
            <button v-for="client in clientResults" :key="client.clientId" type="button" class="client-result" @click="selectClient(client)">
              <strong>{{ client.clientName }}</strong>
              <span>{{ client.clientEmail || client.clientPhone || 'Sin contacto' }}</span>
            </button>
          </div>
          <div v-if="selectedClient" class="selected-client-pill">
            <div>
              <strong>{{ selectedClient.clientName }}</strong>
              <span>{{ selectedClient.clientEmail || selectedClient.clientPhone || 'Sin contacto' }}</span>
            </div>
            <button type="button" class="text-link" @click="clearSelectedClient">Cambiar</button>
          </div>
          <div v-else-if="showClientEmptyHelp" class="client-empty-help">
            <strong>No existe este cliente aún.</strong>
            <p>Busca por nombre, correo o teléfono. Si no aparece, créalo primero en <button type="button" class="text-link" @click="goToContactos">Contactos</button> o usa <button type="button" class="text-link" @click="openCreateContactModal">Crear contacto aquí</button>.</p>
          </div>
        </div>

        <div class="field full">
          <AppFileUpload v-model="comprobanteFile" label="Comprobante" accept="image/*,.pdf" hint="Adjunta una imagen o PDF. Al guardar se sube y queda visible." variant="proof" />
        </div>
      </div>

      <template #footer>
        <div class="modal-actions">
          <button type="button" class="btn-ghost" @click="closeModal">Cancelar</button>
          <button class="btn-primary" type="button" :disabled="saving" @click="save">
            <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'" />
            {{ saving ? 'Guardando...' : 'Guardar movimiento' }}
          </button>
        </div>
      </template>
    </AppModal>

    <AppConfirmModal
      :open="showDeleteConfirm"
      title="Eliminar movimiento"
      message="¿Eliminar este movimiento? Esta acción no se puede deshacer."
      confirm-label="Eliminar"
      variant="danger"
      @cancel="closeDeleteConfirm"
      @confirm="confirmDelete"
    />

    <AppModal
      :show="showCreateContactModal"
      title="Crear contacto"
      icon="fa-solid fa-address-book"
      icon-variant="info"
      max-width="560px"
      :prevent-close-on-overlay="createContactSaving"
      @close="showCreateContactModal = false"
    >
      <p class="contact-modal-note">Este contacto se crea como un registro inicial para que luego puedas usarlo en caja.</p>
      <div class="modal-grid single-col">
        <label class="field full">
          <span>Nombre del cliente</span>
          <input v-model="createContactForm.clientName" class="field-input" placeholder="Nombre completo" />
        </label>
        <label class="field full">
          <span>Email</span>
          <input v-model="createContactForm.clientEmail" class="field-input" type="email" placeholder="correo@ejemplo.com" />
        </label>
        <label class="field full">
          <span>Teléfono</span>
          <input v-model="createContactForm.clientPhone" class="field-input" placeholder="0999999999" />
        </label>
      </div>
      <template #footer>
        <div class="modal-actions">
          <button type="button" class="btn-ghost" @click="showCreateContactModal = false">Cancelar</button>
          <button type="button" class="btn-primary" :disabled="createContactSaving" @click="createContactFromModal">
            <i :class="createContactSaving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-user-plus'" />
            {{ createContactSaving ? 'Creando...' : 'Crear contacto' }}
          </button>
        </div>
      </template>
    </AppModal>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.page-shell { display: flex; flex-direction: column; gap: $space-6; }
.caja-header { display: flex; justify-content: space-between; align-items: end; gap: $space-4; flex-wrap: wrap; }
.stats-grid, .filters-panel, .breakdown-list, .movement-cards { display: grid; gap: $space-4; }
.stats-grid { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.filters-panel { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
.panel, .stat-card, .movement-row, .skeleton-card, .movement-card { background: rgba($ink-900, .72); border: 1px solid rgba($ink-500, .12); border-radius: 20px; padding: $space-5; }
.stat-card span, .section-head p { color: $ink-400; }
.stat-card strong { display: block; font-size: 1.8rem; margin: $space-2 0; }
.stat-card.accent strong { color: $brand-orange; }
.stat-card.danger strong { color: #ff8a8f; }
.stat-card.balance strong { color: #9ae6b4; }
.section-head { display: flex; flex-direction: column; gap: .2rem; margin-bottom: $space-3; }
.section-head.between { flex-direction: row; justify-content: space-between; align-items: end; }
.section-head h3, .compact-head h4 { margin: 0; }
.count-pill { display: inline-flex; align-items: center; border-radius: 999px; padding: .4rem .75rem; background: rgba($ink-800, .7); color: $ink-200; font-size: .8rem; }
.breakdown-row { display: grid; grid-template-columns: 180px 1fr 120px; gap: $space-4; align-items: center; }
.breakdown-meta { display: flex; flex-direction: column; gap: .15rem; }
.breakdown-meta span { color: $ink-400; font-size: .8rem; }
.breakdown-bar-wrap { height: 12px; border-radius: 999px; background: rgba($ink-700, .65); overflow: hidden; }
.breakdown-bar { height: 100%; border-radius: 999px; }
.breakdown-bar.is-income { background: linear-gradient(90deg, rgba(#2bbb92, .75), #2bbb92); }
.breakdown-bar.is-expense { background: linear-gradient(90deg, rgba(#e5484d, .75), #e5484d); }
.breakdown-value { text-align: right; }
.desktop-only { display: block; }
.mobile-only { display: none; }
.table-wrapper { overflow-x: auto; background: $ink-900; border: 1px solid rgba($ink-500, 0.12); border-radius: 16px; }
.movements-table { width: 100%; border-collapse: collapse; font-size: .9rem; }
.movements-table th, .movements-table td { padding: $space-3 $space-4; text-align: left; border-bottom: 1px solid rgba($ink-500, .1); vertical-align: top; }
.movements-table th { color: $ink-400; font-weight: 600; font-size: .75rem; text-transform: uppercase; letter-spacing: .04em; }
.movements-table p { margin: .15rem 0 0; color: $ink-400; }
.money { color: $brand-orange; font-weight: 700; font-variant-numeric: tabular-nums; }
.badge { display: inline-flex; padding: 2px 10px; border-radius: 999px; font-size: .75rem; font-weight: 600; text-transform: uppercase; }
.badge.ingreso { background: rgba(#2bbb92, .12); color: #2bbb92; }
.badge.egreso { background: rgba(#e5484d, .12); color: #e5484d; }
.btn-icon { width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; border-radius: 10px; border: 1px solid rgba($ink-500, .15); background: transparent; color: $ink-300; cursor: pointer; }
.btn-icon:disabled { opacity: .45; cursor: not-allowed; }
.btn-icon.danger:hover:not(:disabled) { border-color: rgba($signal-red, .35); color: #ff8a8f; background: rgba($signal-red, .08); }
.file-link { color: $brand-orange; text-decoration: none; font-weight: 600; }
.movement-card { display: flex; flex-direction: column; gap: $space-4; }
.movement-card__top { display: flex; justify-content: space-between; gap: $space-4; }
.card-meta { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: .25rem; color: $ink-400; font-size: .78rem; }
.movement-card h4 { margin: 0; }
.movement-card p { margin: .25rem 0 0; color: $ink-400; }
.movement-card__details { margin: 0; display: grid; gap: $space-2; }
.movement-card__details > div { display: grid; grid-template-columns: 110px 1fr; gap: $space-2; }
.movement-card__details dt { color: $ink-500; font-size: .75rem; text-transform: uppercase; }
.movement-card__details dd { margin: 0; }
.movement-card__actions { display: flex; justify-content: flex-end; }
.alert { display: flex; align-items: center; gap: $space-3; padding: $space-3 $space-4; border-radius: 12px; font-size: .9rem; }
.alert.error { background: rgba($signal-red, .1); color: #ff8a8f; border: 1px solid rgba($signal-red, .15); }
.empty-state { display: flex; align-items: center; gap: $space-4; justify-content: center; padding: $space-10 0; text-align: left; color: $ink-400; }
.empty-state.compact { padding: $space-6 0; justify-content: flex-start; }
.empty-state i { font-size: 1.5rem; color: $brand-orange; }
.empty-state strong { color: $fg-dark; }
.saving-banner { display: flex; align-items: center; gap: .5rem; margin-bottom: $space-4; padding: .75rem 1rem; border-radius: 12px; background: rgba($brand-orange, .12); color: $brand-orange; }
.modal-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: $space-4; }
.field { display: flex; flex-direction: column; gap: $space-2; }
.field span { font-size: .8rem; color: $ink-400; font-weight: 600; }
.full { grid-column: 1 / -1; }
.field-input { width: 100%; background: $ink-900; border: 1px solid rgba($ink-500, .2); border-radius: 10px; padding: $space-2 $space-3; color: $fg-dark; font-family: inherit; outline: none; }
.field-input:focus { border-color: $brand-orange; }
.client-box { position: relative; }
.client-results { display: grid; gap: .5rem; max-height: 220px; overflow: auto; }
.client-result { display: flex; flex-direction: column; gap: 2px; text-align: left; padding: .7rem .85rem; border-radius: 12px; border: 1px solid rgba($ink-500, .12); background: rgba($ink-800, .55); color: $fg-dark; font-family: inherit; cursor: pointer; }
.client-result:hover { border-color: rgba($brand-orange, .3); }
.client-empty-help { display: flex; flex-direction: column; gap: .25rem; padding: .85rem 1rem; border-radius: 12px; border: 1px dashed rgba($brand-orange, .28); background: rgba($brand-orange, .06); }
.client-empty-help strong { color: $fg-dark; }
.client-empty-help p { margin: 0; color: $ink-300; }
.text-link { border: none; background: transparent; color: $brand-orange; font: inherit; padding: 0; cursor: pointer; }
.text-link:hover { text-decoration: underline; }
.contact-modal-note { margin: 0 0 $space-4; color: $ink-300; }
.single-col { grid-template-columns: 1fr; }
.hint { color: $ink-400; font-size: .8rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: $space-3; }
.btn-primary { display: inline-flex; align-items: center; gap: $space-2; padding: .6rem 1.25rem; background: $brand-orange; color: #fff; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { opacity: .7; cursor: not-allowed; }
.btn-ghost { padding: .6rem 1.25rem; background: transparent; border: 1px solid rgba($ink-500, .3); border-radius: 10px; color: $ink-300; font-weight: 500; cursor: pointer; }
.btn-ghost:hover { background: rgba($ink-500, .15); color: $fg-dark; }
.loading-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: $space-4; }
.skeleton-card { height: 140px; animation: pulse 1.3s ease-in-out infinite alternate; }
@keyframes pulse { from { opacity: .45; } to { opacity: .8; } }
@media (max-width: 640px) {
  .caja-header { align-items: stretch; }
  .section-head.between { flex-direction: column; align-items: flex-start; }
  .breakdown-row { grid-template-columns: 1fr; }
  .breakdown-value { text-align: left; }
  .desktop-only { display: none; }
  .mobile-only { display: grid; }
  .modal-grid { grid-template-columns: 1fr; }
  .movement-card__details > div { grid-template-columns: 1fr; }
  .modal-actions { flex-direction: column-reverse; }
}
</style>
